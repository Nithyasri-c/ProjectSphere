const TimelineEvent = require('../models/TimelineEvent');
const Submission = require('../models/Submission');
const Batch = require('../models/Batch');

// @desc    Create timeline event (Admin only)
// @route   POST /api/timeline
exports.createEvent = async (req, res) => {
  try {
    console.log('Creating timeline event...');
    console.log('Request body:', req.body);
    console.log('User:', req.user);

    if (!req.body) {
      return res.status(400).json({
        success: false,
        message: 'Request body is missing. Ensure you are sending valid form data.'
      });
    }

    const { title, description, deadline, maxMarks, submissionRequirements, targetYear, order, isMandatoryFormat, isMarksEnabled } = req.body;

    let referenceFileData = null;
    if (req.file) {
      referenceFileData = {
        url: `/uploads/reference/${req.file.filename}`,
        name: req.file.originalname
      };
    }

    // Helper to parse boolean from possible form-data string
    const parseBool = (val) => {
      if (val === undefined || val === null) return true;
      if (typeof val === 'boolean') return val;
      return val === 'true' || val === '1' || val === 'on';
    };

    const event = await TimelineEvent.create({
      title,
      description,
      deadline,
      maxMarks: parseBool(isMarksEnabled) ? Number(maxMarks) : 0,
      submissionRequirements,
      targetYear: targetYear || 'all',
      order: Number(order) || 0,
      isMandatoryFormat: parseBool(isMandatoryFormat),
      isMarksEnabled: parseBool(isMarksEnabled),
      referenceFile: referenceFileData,
      createdBy: req.user._id
    });

    console.log('Event created:', event);
    res.status(201).json({ success: true, data: event });
  } catch (error) {
    console.error('Error creating event:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get all timeline events
// @route   GET /api/timeline
exports.getAllEvents = async (req, res) => {
  try {
    console.log('Getting all timeline events...');
    console.log('Query params:', req.query);
    console.log('User:', req.user);

    const { year } = req.query;
    let query = { $or: [{ isActive: true }, { isActive: { $exists: false } }] };

    if (year && year !== 'all') {
      query.$and = [
        { $or: [{ isActive: true }, { isActive: { $exists: false } }] },
        { $or: [{ targetYear: year }, { targetYear: 'all' }] }
      ];
    }

    const events = await TimelineEvent.find(query)
      .sort({ order: 1, deadline: 1 })
      .populate('createdBy', 'name');

    console.log('Found events:', events.length);
    console.log('Returning events:', JSON.stringify(events, null, 2));

    res.status(200).json({
      success: true,
      data: events
    });
  } catch (error) {
    console.error('Error getting events:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Update timeline event
// @route   PUT /api/timeline/:id
exports.updateEvent = async (req, res) => {
  try {
    if (!req.body) {
      return res.status(400).json({
        success: false,
        message: 'Request body is missing.'
      });
    }

    const { title, description, deadline, maxMarks, submissionRequirements, targetYear, order, isActive, isMandatoryFormat, isMarksEnabled } = req.body;

    const updateData = {};
    if (title !== undefined) updateData.title = title;
    if (description !== undefined) updateData.description = description;
    if (deadline !== undefined) updateData.deadline = deadline;
    if (maxMarks !== undefined) updateData.maxMarks = Number(maxMarks);
    if (submissionRequirements !== undefined) updateData.submissionRequirements = submissionRequirements;
    if (targetYear !== undefined) updateData.targetYear = targetYear;
    if (order !== undefined) updateData.order = Number(order);
    if (isActive !== undefined) updateData.isActive = isActive === 'true' || isActive === true;

    const parseBool = (val) => {
      if (val === undefined || val === null) return true;
      if (typeof val === 'boolean') return val;
      return val === 'true' || val === '1' || val === 'on';
    };

    if (isMandatoryFormat !== undefined) {
      updateData.isMandatoryFormat = parseBool(isMandatoryFormat);
    }

    if (isMarksEnabled !== undefined) {
      const enabled = parseBool(isMarksEnabled);
      updateData.isMarksEnabled = enabled;
      if (!enabled) updateData.maxMarks = 0;
    }

    if (req.file) {
      updateData.referenceFile = {
        url: `/uploads/reference/${req.file.filename}`,
        name: req.file.originalname
      };
    }

    const event = await TimelineEvent.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    );

    if (!event) {
      return res.status(404).json({ success: false, message: 'Event not found' });
    }

    res.status(200).json({ success: true, data: event });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Delete timeline event
// @route   DELETE /api/timeline/:id
exports.deleteEvent = async (req, res) => {
  try {
    const event = await TimelineEvent.findByIdAndDelete(req.params.id);

    if (!event) {
      return res.status(404).json({ success: false, message: 'Event not found' });
    }

    // Also delete related submissions
    await Submission.deleteMany({ timelineEventId: req.params.id });

    res.status(200).json({ success: true, message: 'Event deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get timeline with submission status for a batch
// @route   GET /api/timeline/batch/:batchId
exports.getTimelineForBatch = async (req, res) => {
  try {
    console.log('🔍 Getting timeline for batch:', req.params.batchId);
    console.log('👤 Requested by user:', req.user?.email, 'Role:', req.user?.role);

    const batch = await Batch.findById(req.params.batchId);
    if (!batch) {
      return res.status(404).json({ success: false, message: 'Batch not found' });
    }

    console.log('📦 Batch found:', batch.teamName, 'Year:', batch.year);

    const query = { isActive: true };
    if (batch.year) {
      query.$or = [{ targetYear: batch.year }, { targetYear: 'all' }];
    }

    const events = await TimelineEvent.find(query).sort({ order: 1, deadline: 1 });
    const submissions = await Submission.find({ batchId: req.params.batchId })
      .populate('comments.guideId', 'name')
      .populate('marksAssignedBy', 'name')
      .populate('adminRemarks.adminId', 'name');

    console.log('📄 Found', submissions.length, 'submissions for batch', req.params.batchId);
    submissions.forEach(sub => {
      console.log('  - Submission for event:', sub.timelineEventId, 'Versions:', sub.versions.length, 'Status:', sub.status);
    });

    const timelineWithStatus = events.map(event => {
      const submission = submissions.find(s => s.timelineEventId.toString() === event._id.toString());
      return {
        ...event.toObject(),
        submission: submission || null,
        submissionStatus: submission?.status || 'not_started',
        marks: submission?.marks,
        currentVersion: submission?.currentVersion || 0
      };
    });

    console.log('✅ Returning', timelineWithStatus.length, 'timeline events with submission status');
    res.status(200).json({ success: true, data: timelineWithStatus });
  } catch (error) {
    console.error('❌ Error in getTimelineForBatch:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};
