const Submission = require('../models/Submission');
const TimelineEvent = require('../models/TimelineEvent');
const Batch = require('../models/Batch');
const pdf = require('pdf-parse');
const fs = require('fs');

async function validateSubmission(filePath, isMandatoryFormat, context = {}) {
  if (!isMandatoryFormat) return { isValid: true, errors: [] };

  try {
    const dataBuffer = fs.readFileSync(filePath);
    const data = await pdf(dataBuffer);
    const text = data.text;
    const errors = [];

    // Base Institutional Rules
    const rules = [
      {
        pattern: /G\.?\s*Narayanamma\s*Institute\s*of\s*Technology\s*&\s*Science/i,
        message: "Institution name 'G. Narayanamma Institute of Technology & Science' not found in header."
      },
      {
        pattern: /DEPARTMENT\s*OF\s*COMPUTER\s*SCIENCE\s*AND\s*ENGINEERING/i,
        message: "Department name 'DEPARTMENT OF COMPUTER SCIENCE AND ENGINEERING' not found."
      },
      {
        pattern: /Abstract:/i,
        message: "Section heading 'Abstract:' not found."
      },
      {
        pattern: /H\/W\s*&\s*S\/W\s*Requirements/i,
        message: "Section heading 'H/W & S/W Requirements' not found."
      }
    ];

    // Context-specific rules (Project Title, Guide, Team)
    if (context.projectTitle) {
      rules.push({
        pattern: new RegExp(context.projectTitle.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i'),
        message: `Project title '${context.projectTitle}' not found in document.`
      });
    }

    if (context.guideName) {
      rules.push({
        pattern: new RegExp(context.guideName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i'),
        message: `Guide name '${context.guideName}' not found.`
      });
    }

    if (context.teamMembers && context.teamMembers.length > 0) {
      context.teamMembers.forEach(member => {
        if (member.rollNo) {
          rules.push({
            pattern: new RegExp(member.rollNo, 'i'),
            message: `Team member roll number '${member.rollNo}' not found.`
          });
        }
      });
    }

    rules.forEach(rule => {
      if (!rule.pattern.test(text)) {
        errors.push(rule.message);
      }
    });

    // Basic word count check for abstract
    const abstractMatch = text.match(/Abstract:([\s\S]*?)(H\/W|Requirements|Introduction|$)/i);
    if (abstractMatch) {
      const abstractText = abstractMatch[1].trim();
      const wordCount = abstractText.split(/\s+/).filter(w => w.length > 0).length;
      if (wordCount > 250) {
        errors.push(`Abstract section seems too long (${wordCount} words). Requirement is approx 200 words.`);
      }
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  } catch (err) {
    console.error('Validation error:', err);
    return { isValid: true, errors: ['Warning: Could not perform automated format check on this file type.'] };
  }
}

// @desc    Submit or update a submission (Student)
// @route   POST /api/submissions
exports.createOrUpdateSubmission = async (req, res) => {
  try {
    const { batchId, timelineEventId, description, driveLink } = req.body;

    if (!driveLink || !driveLink.trim()) {
      return res.status(400).json({ success: false, message: 'Google Drive link is required' });
    }

    // Verify batch exists and student is leader
    const batch = await Batch.findById(batchId).populate('guideId').populate('problemId');
    if (!batch) {
      return res.status(404).json({ success: false, message: 'Batch not found' });
    }
    if (batch.leaderStudentId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Only team leader can submit' });
    }

    // Check if event exists
    const event = await TimelineEvent.findById(timelineEventId);
    if (!event) {
      return res.status(404).json({ success: false, message: 'Timeline event not found' });
    }

    // Check if deadline has passed
    if (new Date() > event.deadline) {
      return res.status(400).json({ success: false, message: 'Submission deadline has passed' });
    }

    let submission = await Submission.findOne({ batchId, timelineEventId });

    if (submission) {
      // Add new version
      const newVersion = submission.currentVersion + 1;
      submission.versions.push({
        version: newVersion,
        driveLink: driveLink.trim(),
        description,
        submittedAt: new Date()
      });
      submission.currentVersion = newVersion;
      submission.status = 'submitted';
      await submission.save();
    } else {
      // Create new submission
      submission = await Submission.create({
        batchId,
        timelineEventId,
        versions: [{
          version: 1,
          driveLink: driveLink.trim(),
          description,
          submittedAt: new Date()
        }],
        currentVersion: 1,
        status: 'submitted'
      });
    }

    res.status(201).json({
      success: true,
      data: submission,
      validation: { isValid: true, errors: [] }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get submission details
// @route   GET /api/submissions/:id
exports.getSubmission = async (req, res) => {
  try {
    const submission = await Submission.findById(req.params.id)
      .populate('batchId', 'teamName year branch section')
      .populate('timelineEventId', 'title maxMarks deadline isMarksEnabled')
      .populate('comments.guideId', 'name')
      .populate('adminRemarks.adminId', 'name')
      .populate('marksAssignedBy', 'name');

    if (!submission) {
      return res.status(404).json({ success: false, message: 'Submission not found' });
    }

    res.status(200).json({ success: true, data: submission });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get all submissions for a batch
// @route   GET /api/submissions/batch/:batchId
exports.getBatchSubmissions = async (req, res) => {
  try {
    const submissions = await Submission.find({ batchId: req.params.batchId })
      .populate('timelineEventId', 'title maxMarks deadline isMarksEnabled')
      .populate('comments.guideId', 'name')
      .populate('adminRemarks.adminId', 'name');

    res.status(200).json({ success: true, data: submissions });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get submissions for guide's batches
// @route   GET /api/submissions/guide
exports.getGuideSubmissions = async (req, res) => {
  try {
    const batches = await Batch.find({ guideId: req.user._id, allotmentStatus: 'allotted' });
    const batchIds = batches.map(b => b._id);

    const submissions = await Submission.find({ batchId: { $in: batchIds }, status: { $ne: 'not_started' } })
      .populate('batchId', 'teamName year branch section leaderStudentId')
      .populate('timelineEventId', 'title maxMarks deadline isMarksEnabled')
      .populate('comments.guideId', 'name')
      .populate('adminRemarks.adminId', 'name')
      .sort({ updatedAt: -1 });

    res.status(200).json({ success: true, data: submissions });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Add comment to submission (Guide)
// @route   POST /api/submissions/:id/comment
exports.addComment = async (req, res) => {
  try {
    const { comment } = req.body;
    const submission = await Submission.findById(req.params.id);

    if (!submission) {
      return res.status(404).json({ success: false, message: 'Submission not found' });
    }

    submission.comments.push({
      guideId: req.user._id,
      comment,
      createdAt: new Date()
    });

    // Only update status to needs_revision if it's not already accepted or rejected
    if (submission.status !== 'accepted' && submission.status !== 'rejected') {
      submission.status = 'needs_revision';
    }

    await submission.save();

    const updated = await Submission.findById(req.params.id).populate('comments.guideId', 'name');
    res.status(200).json({ success: true, data: updated });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Assign marks (Guide)
// @route   POST /api/submissions/:id/marks
exports.assignMarks = async (req, res) => {
  try {
    const { marks, status, comment } = req.body;
    const submission = await Submission.findById(req.params.id)
      .populate('timelineEventId', 'maxMarks');

    if (!submission) {
      return res.status(404).json({ success: false, message: 'Submission not found' });
    }

    if (marks > submission.timelineEventId.maxMarks) {
      return res.status(400).json({ success: false, message: `Marks cannot exceed ${submission.timelineEventId.maxMarks}` });
    }

    // Add comment if provided
    if (comment && comment.trim()) {
      submission.comments.push({
        guideId: req.user._id,
        comment: comment.trim(),
        createdAt: new Date()
      });
    }

    submission.marks = marks;
    submission.marksAssignedBy = req.user._id;
    submission.marksAssignedAt = new Date();
    submission.status = status || 'accepted';
    await submission.save();

    // Re-fetch with proper population to ensure comments are populated
    const updated = await Submission.findById(req.params.id)
      .populate('comments.guideId', 'name')
      .populate('marksAssignedBy', 'name')
      .populate('batchId', 'teamName')
      .populate('timelineEventId', 'title maxMarks isMarksEnabled');

    res.status(200).json({ success: true, data: updated });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get all submissions (Admin)
// @route   GET /api/submissions
// Query params: page (default 1), limit (default 50), eventId (optional), batchId (optional)
exports.getAllSubmissions = async (req, res) => {
  try {
    console.log('📡 Getting submissions...');
    
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;
    const eventId = req.query.eventId;
    const batchId = req.query.batchId;
    
    const skip = (page - 1) * limit;

    // Build filter object
    const filter = {};
    if (eventId) filter.timelineEventId = eventId;
    if (batchId) filter.batchId = batchId;

    const submissions = await Submission.find(filter)
      .populate('batchId', 'teamName year branch section leaderStudentId guideId problemId coeId researchArea')
      .populate('timelineEventId', 'title maxMarks')
      .populate('comments.guideId', 'name')
      .populate('adminRemarks.adminId', 'name')
      .populate('marksAssignedBy', 'name')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(); // Use lean() for better performance on large result sets

    // Get total count for pagination
    const total = await Submission.countDocuments(filter);

    console.log(`✅ Found ${submissions.length} submissions for page ${page}`);

    res.status(200).json({ 
      success: true, 
      data: submissions,
      pagination: {
        current: page,
        total,
        limit,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('❌ Error getting submissions:', error.message);
    console.error('❌ Stack:', error.stack);
    res.status(200).json({ success: true, data: [], pagination: { current: 1, total: 0, limit: 50, pages: 0 } });
  }
};

// @desc    Add remark to submission (Admin only)
// @route   POST /api/submissions/:id/admin-remark
exports.addAdminRemark = async (req, res) => {
  try {
    const { remark } = req.body;
    const submission = await Submission.findById(req.params.id);

    if (!submission) {
      return res.status(404).json({ success: false, message: 'Submission not found' });
    }

    // Check for duplicate remark (same admin, same content, within last 60 seconds)
    const duplicate = submission.adminRemarks.find(r =>
      r.adminId.toString() === req.user._id.toString() &&
      r.remark === remark &&
      (new Date() - new Date(r.createdAt)) < 60000
    );

    if (duplicate) {
      console.log('⚠️ Duplicate admin remark detected, skipping...');
    } else {
      submission.adminRemarks.push({
        adminId: req.user._id,
        remark,
        createdAt: new Date()
      });
      await submission.save();
    }

    const updated = await Submission.findById(req.params.id)
      .populate('adminRemarks.adminId', 'name')
      .populate('comments.guideId', 'name');

    res.status(200).json({ success: true, data: updated });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

