const Batch = require('../models/Batch');
const ProblemStatement = require('../models/ProblemStatement');
const Guide = require('../models/Guide');
const TeamMember = require('../models/TeamMember');
const Student = require('../models/Student');
const XLSX = require('xlsx');
const COE = require('../models/COE');
const RC = require('../models/RC');

/**
 * Parse and import batches from Excel file with merged cells
 * Excel format: Batch No. (merged), Roll Number, Student Name
 * Batch No. is merged for all students in same batch
 */
function parseStudentBatchExcel(fileBuffer) {
  try {
    const workbook = XLSX.read(fileBuffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];

    // Read as 2D array to preserve structure with merged cells
    const jsonData = XLSX.utils.sheet_to_json(worksheet, {
      header: 1,
      defval: '',
      blankrows: false
    });

    if (jsonData.length < 2) {
      throw new Error('Excel file must have at least a header row and one data row');
    }

    // Get headers and normalize
    const headers = jsonData[0];
    console.log('[BatchParser] Raw headers:', headers);

    // Find exact column positions
    let batchNoIndex = -1;
    let rollNumIndex = -1;
    let studentNameIndex = -1;

    for (let i = 0; i < headers.length; i++) {
      const h = String(headers[i] || '').trim().toLowerCase();
      if (h.includes('batch') && h.includes('no')) batchNoIndex = i;
      if (h.includes('roll') && (h.includes('number') || h.includes('no'))) rollNumIndex = i;
      if (h.includes('student') && h.includes('name')) studentNameIndex = i;
    }

    console.log('[BatchParser] Column indices:', { batchNoIndex, rollNumIndex, studentNameIndex });

    if (batchNoIndex === -1 || rollNumIndex === -1 || studentNameIndex === -1) {
      throw new Error(`Could not find columns. Need: Batch No., Roll Number, Student Name`);
    }

    // Group students by batch with fill-down for merged cells
    const batchGroups = {};
    let lastBatchNo = '';

    for (let i = 1; i < jsonData.length; i++) {
      const row = jsonData[i];

      // Ensure row has enough columns
      while (row.length <= Math.max(batchNoIndex, rollNumIndex, studentNameIndex)) {
        row.push('');
      }

      const batchNoCell = String(row[batchNoIndex] || '').trim();
      const rollNum = String(row[rollNumIndex] || '').trim();
      const studentName = String(row[studentNameIndex] || '').trim();

      console.log(`[BatchParser] Row ${i}:`, { batchNoCell, rollNum, studentName, rowLength: row.length });

      // Skip empty rows
      if (!rollNum && !studentName) {
        console.log(`[BatchParser] Row ${i}: Skipping empty row`);
        continue;
      }

      // Skip rows without both roll and name
      if (!rollNum || !studentName) {
        console.log(`[BatchParser] Row ${i}: Skipping incomplete row (no roll or name)`);
        continue;
      }

      let batchNo = batchNoCell;

      // FILL DOWN: use last batch number if current is empty
      if (!batchNo && lastBatchNo) {
        batchNo = lastBatchNo;
        console.log(`[BatchParser] Row ${i}: FILL DOWN batch '${batchNo}'`);
      }

      if (!batchNo) {
        console.log(`[BatchParser] Row ${i}: No batch number, skipping`);
        continue;
      }

      // Update last seen batch
      if (batchNoCell) {
        lastBatchNo = batchNoCell;
      }

      // Create batch group if needed
      if (!batchGroups[batchNo]) {
        batchGroups[batchNo] = [];
        console.log(`[BatchParser] Created batch group: '${batchNo}'`);
      }

      // Add student
      batchGroups[batchNo].push({ rollNumber: rollNum, name: studentName });
      console.log(`[BatchParser] Added ${rollNum} (${studentName}) to batch '${batchNo}'`);
    }

    // Convert to output format
    const batches = Object.entries(batchGroups).map(([batchNo, students]) => ({
      batchNo,
      students
    }));

    const totalStudents = Object.values(batchGroups).reduce((sum, s) => sum + s.length, 0);
    console.log(`[BatchParser] ✅ SUCCESS: ${batches.length} batches, ${totalStudents} students`);

    batches.forEach(b => {
      console.log(`  Batch '${b.batchNo}': ${b.students.map(s => `${s.rollNumber}(${s.name})`).join(', ')}`);
    });

    return batches;
  } catch (error) {
    console.error('[BatchParser] ERROR:', error.message);
    throw new Error(`Failed to parse batch Excel file: ${error.message}`);
  }
}

// @desc    Search batches by query (team, guide, domain, COE, RC, student)
// @route   GET /api/batches/search-all?q=query
exports.searchAllBatches = async (req, res) => {
  try {
    const RC = require('../models/RC');
    const { q } = req.query;

    if (!q || q.trim() === '') {
      return res.status(400).json({
        success: false,
        message: 'Search query is required'
      });
    }

    const searchRegex = new RegExp(q.trim(), 'i');

    // Find matching batches
    let batches = await Batch.find({
      $or: [
        { teamName: searchRegex },
        { domain: searchRegex },
        { 'coe.name': searchRegex },
        { 'rc.name': searchRegex },
        { 'guideId.name': searchRegex }
      ]
    })
      .populate('leaderStudentId', 'name rollNumber email branch')
      .populate({
        path: 'problemId',
        select: 'title description coeId guideId targetYear researchArea',
        populate: {
          path: 'coeId',
          select: 'name'
        }
      })
      .populate('optedProblemId', 'title description researchArea')
      .populate('coeId', 'name')
      .populate('guideId', 'name email');

    // Get team members for each batch
    batches = await Promise.all(
      batches.map(async (batch) => {
        try {
          const batchObj = batch.toObject();

          // Handle RC lookup from batch.rc.rcId
          if (batchObj.rc && batchObj.rc.rcId) {
            try {
              const rc = await RC.findById(batchObj.rc.rcId).select('name');
              if (rc) {
                batchObj.rcId = rc;
              }
            } catch (err) {
              console.warn('Failed to fetch RC for batch', batch._id, err.message);
            }
          } else if (batchObj.rc && batchObj.rc.name && batchObj.rc.name !== '--') {
            // Try to find RC by name if not found by ID
            try {
              const rc = await RC.findOne({
                name: { $regex: `^${batchObj.rc.name}$`, $options: 'i' }
              }).select('name _id');
              if (rc) {
                batchObj.rcId = rc;
              }
            } catch (err) {
              console.warn('Failed to find RC by name:', batchObj.rc.name);
            }
          }

          // Get team members
          const [students, teamMembersList] = await Promise.all([
            require('../models/Student').find({ batchId: batch._id }).select('name rollNumber branch'),
            require('../models/TeamMember').find({ batchId: batch._id }).select('name rollNo branch')
          ]);

          // Merge and deduplicate
          const combinedMembers = new Map();

          students.forEach(s => {
            if (s.rollNumber) combinedMembers.set(s.rollNumber.toLowerCase(), {
              _id: s._id,
              name: s.name,
              rollNo: s.rollNumber,
              branch: s.branch
            });
          });

          teamMembersList.forEach(tm => {
            if (tm.rollNo && !combinedMembers.has(tm.rollNo.toLowerCase())) {
              combinedMembers.set(tm.rollNo.toLowerCase(), {
                _id: tm._id,
                name: tm.name,
                rollNo: tm.rollNo,
                branch: tm.branch
              });
            }
          });

          batchObj.teamMembers = Array.from(combinedMembers.values());
          return batchObj;
        } catch (err) {
          console.error('Error processing batch in searchAllBatches', batch._id, ':', err.message);
          const batchObj = batch.toObject();
          batchObj.teamMembers = [];
          return batchObj;
        }
      })
    );

    // Also search by team member names (without modifying guide names)
    const batchesWithMembers = await Batch.find()
      .populate('guideId', 'name email')
      .populate('problemId', 'title')
      .populate('coeId', 'name');

    const additionalMatches = await Promise.all(
      batchesWithMembers.map(async (batch) => {
        const students = await require('../models/Student').find({ batchId: batch._id });
        const hasMatch = students.some(s =>
          searchRegex.test(s.name) || searchRegex.test(s.rollNumber)
        );

        if (hasMatch) {
          return batch;
        }
        return null;
      })
    );

    const additionalBatches = additionalMatches.filter(b => b !== null);

    // Combine and deduplicate
    const batchIds = new Set();
    const allMatches = [];

    batches.forEach(b => {
      batchIds.add(b._id.toString());
      allMatches.push(b);
    });

    for (const batch of additionalBatches) {
      if (!batchIds.has(batch._id.toString())) {
        try {
          const batchObj = batch.toObject();

          // Handle RC lookup for additional batches
          if (batchObj.rc && batchObj.rc.rcId) {
            try {
              const rc = await RC.findById(batchObj.rc.rcId).select('name');
              if (rc) {
                batchObj.rcId = rc;
              }
            } catch (err) {
              console.warn('Failed to fetch RC for batch', batch._id, err.message);
            }
          }

          const [students, teamMembersList] = await Promise.all([
            require('../models/Student').find({ batchId: batch._id }).select('name rollNumber branch'),
            require('../models/TeamMember').find({ batchId: batch._id }).select('name rollNo branch')
          ]);

          const combinedMembers = new Map();
          students.forEach(s => {
            if (s.rollNumber) combinedMembers.set(s.rollNumber.toLowerCase(), {
              _id: s._id,
              name: s.name,
              rollNo: s.rollNumber,
              branch: s.branch
            });
          });

          teamMembersList.forEach(tm => {
            if (tm.rollNo && !combinedMembers.has(tm.rollNo.toLowerCase())) {
              combinedMembers.set(tm.rollNo.toLowerCase(), {
                _id: tm._id,
                name: tm.name,
                rollNo: tm.rollNo,
                branch: tm.branch
              });
            }
          });

          batchObj.teamMembers = Array.from(combinedMembers.values());
          allMatches.push(batchObj);
        } catch (err) {
          console.error('Error processing additional batch', batch._id, ':', err.message);
        }
      }
    }

    res.status(200).json({
      success: true,
      count: allMatches.length,
      data: allMatches
    });
  } catch (error) {
    console.error('Search batches error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to search batches',
      error: error.message
    });
  }
};

exports.getAllBatches = async (req, res) => {
  try {
    const RC = require('../models/RC');
    const Student = require('../models/Student');
    const TeamMember = require('../models/TeamMember');
    const Guide = require('../models/Guide');

    let batches = await Batch.find()
      .populate('leaderStudentId', 'name rollNumber email branch')
      .populate({
        path: 'problemId',
        select: 'title description coeId guideId targetYear researchArea',
        populate: {
          path: 'coeId',
          select: 'name'
        }
      })
      .populate({
        path: 'optedProblemId',
        select: 'title description researchArea coeId',
        populate: { path: 'coeId', select: 'name' }
      })
      .populate('coeId', 'name')
      .populate('guideId', 'name email')
      .select('+coe +rc +domain')
      .lean(); // Use lean() for better performance

    // Bulk fetch all related data
    const batchIds = batches.map(b => b._id);
    const guideIds = new Set();
    batches.forEach(b => {
      if (b.guideId && b.guideId._id) guideIds.add(b.guideId._id);
    });

    // Fetch all students and team members in bulk
    const allStudents = await Student.find({ batchId: { $in: batchIds } }).select('batchId name rollNumber branch').lean();
    const allTeamMembers = await TeamMember.find({ batchId: { $in: batchIds } }).select('batchId name rollNo branch').lean();

    // Create maps for quick lookup
    const studentsByBatchId = {};
    const teamMembersByBatchId = {};

    allStudents.forEach(s => {
      if (!studentsByBatchId[s.batchId]) studentsByBatchId[s.batchId] = [];
      studentsByBatchId[s.batchId].push(s);
    });

    allTeamMembers.forEach(tm => {
      if (!teamMembersByBatchId[tm.batchId]) teamMembersByBatchId[tm.batchId] = [];
      teamMembersByBatchId[tm.batchId].push(tm);
    });

    // Process batches with bulk-fetched data
    batches = batches.map(batch => {
      try {
        // Handle RC lookup
        if (batch.rc && batch.rc.rcId) {
          // RC ID already available, no additional lookup needed
        } else if (batch.rc && batch.rc.name && batch.rc.name !== '--') {
          // RC name is available
          console.log('ℹ️  RC name:', batch.rc.name);
        }

        // Merge team members from both sources
        const students = studentsByBatchId[batch._id] || [];
        const teamMembers = teamMembersByBatchId[batch._id] || [];

        const combinedMembers = new Map();

        students.forEach(s => {
          if (s.rollNumber) combinedMembers.set(s.rollNumber.toLowerCase(), {
            _id: s._id,
            name: s.name,
            rollNo: s.rollNumber,
            branch: s.branch
          });
        });

        teamMembers.forEach(tm => {
          if (tm.rollNo && !combinedMembers.has(tm.rollNo.toLowerCase())) {
            combinedMembers.set(tm.rollNo.toLowerCase(), {
              _id: tm._id,
              name: tm.name,
              rollNo: tm.rollNo,
              branch: tm.branch
            });
          }
        });

        batch.teamMembers = Array.from(combinedMembers.values());
        return batch;
      } catch (err) {
        console.error('Error processing batch', batch._id, ':', err.message);
        batch.teamMembers = [];
        return batch;
      }
    });

    console.log('📡 getAllBatches returning:', batches.length, 'batches');
    if (batches.length > 0) {
      console.log('📌 Sample batch:', {
        teamName: batches[0].teamName,
        domain: batches[0].domain,
        coe: batches[0].coe,
        rc: batches[0].rc,
        coeId: batches[0].coeId,
        rcId: batches[0].rcId,
        leaderName: batches[0].leaderStudentId?.name,
        leaderRollNumber: batches[0].leaderStudentId?.rollNumber,
        problemTitle: batches[0].problemId?.title
      });
    }
    res.status(200).json({ success: true, data: batches });
  } catch (error) {
    console.error('Error getting batches:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get student's batch
// @route   GET /api/batches/my-batch
exports.getMyBatch = async (req, res) => {
  try {
    const batch = await Batch.findOne({ leaderStudentId: req.user._id })
      .populate('leaderStudentId', 'name email rollNumber branch')
      .populate({
        path: 'problemId',
        select: 'title description coeId datasetUrl researchArea',
        populate: { path: 'coeId', select: 'name' }
      })
      .populate({
        path: 'optedProblemId',
        select: 'title description coeId researchArea',
        populate: { path: 'coeId', select: 'name' }
      })
      .populate({
        path: 'optedProblems.problemId',
        select: 'title description coeId researchArea'
      })
      .populate('optedProblems.coeId', 'name')
      .populate('coeId', 'name')
      .populate('guideId', 'name email');

    if (!batch) {
      return res.status(404).json({ success: false, message: 'No batch found', data: null });
    }

    // Get team members from Student collection
    const students = await require('../models/Student').find({ batchId: batch._id });
    const teamMembers = students.map(s => ({
      _id: s._id,
      name: s.name,
      rollNo: s.rollNumber,
      branch: s.branch
    }));

    res.status(200).json({ success: true, data: { ...batch.toObject(), teamMembers } });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Create batch (Student only)
// @route   POST /api/batches
exports.createBatch = async (req, res) => {
  try {
    const { teamName } = req.body;

    // Check if student already has a batch
    const existingBatch = await Batch.findOne({ leaderStudentId: req.user._id });
    if (existingBatch) {
      return res.status(400).json({ success: false, message: 'You already have a batch' });
    }

    // Get student's year, branch, section
    const student = req.user;
    if (!student.year || !student.branch || !student.section) {
      return res.status(400).json({ success: false, message: 'Student profile incomplete. Please update year, branch, and section.' });
    }

    const batch = await Batch.create({
      leaderStudentId: req.user._id,
      teamName,
      year: student.year,
      branch: student.branch,
      section: student.section
    });

    res.status(201).json({ success: true, data: batch });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Opt for a problem statement (Student selects - pending guide approval)
// @route   POST /api/batches/select-problem
exports.selectProblem = async (req, res) => {
  try {
    const { problemId } = req.body;

    // Get student's batch
    const batch = await Batch.findOne({ leaderStudentId: req.user._id });
    if (!batch) {
      return res.status(404).json({ success: false, message: 'Create a batch first' });
    }

    // Check if team already has an allotted problem
    if (batch.allotmentStatus === 'allotted') {
      return res.status(400).json({ success: false, message: 'You already have an allotted problem' });
    }

    // Initialize optedProblems if undefined
    if (!batch.optedProblems) {
      batch.optedProblems = [];
    }

    // Check if already opted for 3 problems
    const pendingOpts = batch.optedProblems.filter(o => o.status === 'pending');
    if (pendingOpts.length >= 3) {
      return res.status(400).json({ success: false, message: 'You can only opt for a maximum of 3 problems at a time' });
    }

    // Check if already opted for this problem
    const alreadyOpted = batch.optedProblems.find(o => o.problemId.toString() === problemId);
    if (alreadyOpted) {
      return res.status(400).json({ success: false, message: 'You already opted for this problem' });
    }

    // Get problem statement
    const problem = await ProblemStatement.findById(problemId).populate('coeId');
    if (!problem) {
      return res.status(404).json({ success: false, message: 'Problem statement not found' });
    }

    // Check if problem's target year matches student's year
    if (problem.targetYear && batch.year && problem.targetYear !== batch.year) {
      return res.status(400).json({ success: false, message: `This problem is for ${problem.targetYear} year students only` });
    }

    // Add to opted problems
    batch.optedProblems.push({
      problemId: problemId,
      coeId: problem.coeId._id,
      status: 'pending',
      optedAt: new Date()
    });

    // Also set for backward compatibility
    if (!batch.optedProblemId) {
      batch.optedProblemId = problemId;
      batch.coeId = problem.coeId._id;
      batch.allotmentStatus = 'pending';
    }

    await batch.save();

    const updatedBatch = await Batch.findById(batch._id)
      .populate('leaderStudentId', 'name email rollNumber branch')
      .populate({
        path: 'optedProblemId',
        select: 'title description coeId',
        populate: { path: 'coeId', select: 'name' }
      })
      .populate({
        path: 'optedProblems.problemId',
        select: 'title description coeId',
        populate: { path: 'coeId', select: 'name' }
      })
      .populate('coeId', 'name');

    res.status(200).json({ success: true, data: updatedBatch, message: 'Problem opted successfully. Waiting for guide approval.' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get teams that opted for guide's problem statements
// @route   GET /api/batches/opted-teams
exports.getOptedTeams = async (req, res) => {
  try {
    // Get all problem statements created by this guide
    const myProblems = await ProblemStatement.find({ guideId: req.user._id });
    const problemIds = myProblems.map(p => p._id.toString());

    const result = [];

    // Handle NEW format: batches with optedProblems array
    const newFormatBatches = await Batch.find({
      'optedProblems.status': 'pending'
    })
      .populate('leaderStudentId', 'name email rollNumber branch')
      .populate('optedProblems.problemId', 'title description guideId targetYear')
      .populate('optedProblems.coeId', 'name');

    for (const batch of newFormatBatches) {
      if (batch.optedProblems && batch.optedProblems.length > 0) {
        for (const opt of batch.optedProblems) {
          if (opt.status === 'pending' && opt.problemId && problemIds.includes(opt.problemId._id.toString())) {
            result.push({
              _id: batch._id,
              teamName: batch.teamName,
              year: batch.year,
              branch: batch.branch,
              leaderStudentId: batch.leaderStudentId,
              optedProblemId: opt.problemId,
              coeId: opt.coeId,
              optedAt: opt.optedAt
            });
          }
        }
      }
    }

    // Handle OLD format: batches with only optedProblemId (no optedProblems array)
    const oldFormatBatches = await Batch.find({
      optedProblemId: { $in: myProblems.map(p => p._id) },
      allotmentStatus: 'pending',
      $or: [
        { optedProblems: { $exists: false } },
        { optedProblems: { $size: 0 } }
      ]
    })
      .populate('leaderStudentId', 'name email rollNumber branch')
      .populate('optedProblemId', 'title description targetYear')
      .populate('coeId', 'name');

    for (const batch of oldFormatBatches) {
      // Check if already added from new format
      const alreadyAdded = result.find(r => r._id.toString() === batch._id.toString() &&
        r.optedProblemId?._id?.toString() === batch.optedProblemId?._id?.toString());
      if (!alreadyAdded) {
        result.push({
          _id: batch._id,
          teamName: batch.teamName,
          year: batch.year,
          branch: batch.branch,
          leaderStudentId: batch.leaderStudentId,
          optedProblemId: batch.optedProblemId,
          coeId: batch.coeId,
          optedAt: batch.createdAt
        });
      }
    }

    res.status(200).json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Allot problem to a team (Guide approves)
// @route   POST /api/batches/:id/allot
exports.allotProblem = async (req, res) => {
  try {
    const { problemId } = req.body;
    console.log('Allot request - batchId:', req.params.id, 'problemId:', problemId);

    const batch = await Batch.findById(req.params.id);
    if (!batch) {
      return res.status(404).json({ success: false, message: 'Batch not found' });
    }

    // Find the problem to allot (from request body or from optedProblemId)
    const targetProblemId = problemId || batch.optedProblemId;
    if (!targetProblemId) {
      return res.status(400).json({ success: false, message: 'No problem specified' });
    }

    // Get the problem
    const problem = await ProblemStatement.findById(targetProblemId);
    if (!problem) {
      return res.status(404).json({ success: false, message: 'Problem not found' });
    }

    // Check if guide owns this problem
    if (problem.guideId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    // Check max batches for guide
    const guide = await Guide.findById(req.user._id);
    if (!guide) {
      return res.status(404).json({ success: false, message: 'Guide not found' });
    }
    if (guide.assignedBatches >= guide.maxBatches) {
      return res.status(400).json({ success: false, message: 'You have reached max batch limit' });
    }

    // Update the opted problem status in optedProblems array
    if (batch.optedProblems && batch.optedProblems.length > 0) {
      batch.optedProblems = batch.optedProblems.map(opt => {
        if (opt.problemId && opt.problemId.toString() === targetProblemId.toString()) {
          opt.status = 'accepted';
        } else {
          // Reject other pending problems since one is being allotted
          if (opt.status === 'pending') {
            opt.status = 'rejected';
          }
        }
        return opt;
      });
    }

    // Allot the problem
    batch.problemId = targetProblemId;
    batch.optedProblemId = targetProblemId;
    batch.coeId = problem.coeId;
    batch.researchArea = problem.researchArea || '';  // Copy research area from problem
    batch.guideId = req.user._id;
    batch.allotmentStatus = 'allotted';
    batch.status = 'In Progress';
    await batch.save();
    console.log('Batch saved successfully');

    // Mark problem as fully assigned (only 1 batch can have it)
    problem.selectedBatchCount = 1;
    problem.maxBatches = 1; // Ensure no more batches can select it
    await problem.save();
    console.log('Problem updated successfully');

    // Remove this batch from other problem's pending requests
    // (clear this batch from any other guide's pending requests since it's now allotted)
    await Batch.findByIdAndUpdate(batch._id, {
      $set: {
        optedProblems: batch.optedProblems // Keep updated optedProblems with statuses
      }
    });

    // Also remove this problem from other batches' optedProblems since it's now taken
    await Batch.updateMany(
      {
        _id: { $ne: batch._id },
        'optedProblems.problemId': targetProblemId
      },
      {
        $pull: { optedProblems: { problemId: targetProblemId } }
      }
    );
    console.log('Cleaned up other batches pending requests');

    // Update guide's assigned batches using findByIdAndUpdate to avoid pre-save hook
    await Guide.findByIdAndUpdate(req.user._id, { $inc: { assignedBatches: 1 } });
    console.log('Guide updated successfully');

    const updatedBatch = await Batch.findById(batch._id)
      .populate('leaderStudentId', 'name email rollNumber branch')
      .populate({
        path: 'problemId',
        select: 'title description coeId',
        populate: { path: 'coeId', select: 'name' }
      })
      .populate('coeId', 'name')
      .populate('guideId', 'name email');

    res.status(200).json({ success: true, data: updatedBatch, message: 'Team allotted successfully!' });
  } catch (error) {
    console.error('Allot error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Reject team's problem request
// @route   POST /api/batches/:id/reject
exports.rejectProblem = async (req, res) => {
  try {
    const { problemId } = req.body;
    const batchId = req.params.id;
    console.log(`[RejectProblem] Guide ${req.user._id} rejecting batch ${batchId} for problem ${problemId}`);

    const batch = await Batch.findById(batchId);
    if (!batch) {
      return res.status(404).json({ success: false, message: 'Batch not found' });
    }

    // Find the problem to reject (from request body or from optedProblemId)
    const targetProblemId = problemId || batch.optedProblemId;
    if (!targetProblemId) {
      return res.status(400).json({ success: false, message: 'No problem specified' });
    }

    const problem = await ProblemStatement.findById(targetProblemId);
    if (!problem) {
      return res.status(404).json({ success: false, message: 'Problem not found' });
    }

    if (problem.guideId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    // Update the opted problem status in optedProblems array
    if (batch.optedProblems && batch.optedProblems.length > 0) {
      batch.optedProblems = batch.optedProblems.map(opt => {
        if (opt.problemId && opt.problemId.toString() === targetProblemId.toString()) {
          opt.status = 'rejected';
        }
        return opt;
      });
    }

    // If this was the main optedProblemId, clear it
    if (batch.optedProblemId && batch.optedProblemId.toString() === targetProblemId.toString()) {
      batch.optedProblemId = null;
      batch.coeId = null;
      // Check if there are other pending problems
      const pendingProblems = batch.optedProblems?.filter(o => o.status === 'pending') || [];
      if (pendingProblems.length > 0) {
        batch.allotmentStatus = 'pending';
      } else {
        batch.allotmentStatus = 'none';
      }
    }

    await batch.save();

    res.status(200).json({ success: true, message: 'Request rejected. Team can opt for another problem.' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Update batch status (Guide only)
// @route   PUT /api/batches/:id/status
exports.updateBatchStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const batch = await Batch.findById(req.params.id);

    if (!batch) {
      return res.status(404).json({ success: false, message: 'Batch not found' });
    }

    // Check if guide is assigned to this batch
    if (batch.guideId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    batch.status = status;
    await batch.save();

    const updatedBatch = await Batch.findById(batch._id)
      .populate('leaderStudentId', 'name email rollNumber branch')
      .populate('problemId', 'title description')
      .populate('guideId', 'name email');

    res.status(200).json({ success: true, data: updatedBatch });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get batch details with team members
// @route   GET /api/batches/:id
exports.getBatch = async (req, res) => {
  try {
    const batch = await Batch.findById(req.params.id)
      .populate('leaderStudentId', 'name email rollNumber branch')
      .populate({
        path: 'problemId',
        select: 'title description coeId datasetUrl researchArea',
        populate: { path: 'coeId', select: 'name' }
      })
      .populate('coeId', 'name')
      .populate('guideId', 'name email');

    if (!batch) {
      return res.status(404).json({ success: false, message: 'Batch not found' });
    }

    // Get team members from Student collection
    const students = await require('../models/Student').find({ batchId: batch._id });
    const teamMembers = students.map(s => ({
      _id: s._id,
      name: s.name,
      rollNo: s.rollNumber,
      branch: s.branch
    }));

    res.status(200).json({ success: true, data: { ...batch.toObject(), teamMembers } });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get all batches for a specific guide (for home page)
// @route   GET /api/batches/guide/:guideId
exports.getBatchesByGuide = async (req, res) => {
  try {
    const batches = await Batch.find({ guideId: req.params.guideId })
      .populate('leaderStudentId', 'name rollNumber email')
      .populate('problemId', 'title description')
      .populate('guideId', 'name email');

    res.status(200).json({ success: true, data: batches });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Search batches by project ID, student name, guide name, or project title
// @route   GET /api/batches/search
exports.searchBatches = async (req, res) => {
  try {
    const { query } = req.query;

    if (!query || query.trim().length === 0) {
      return res.status(200).json({ success: true, data: [] });
    }

    const searchQuery = query.trim();
    const searchRegex = new RegExp(searchQuery, 'i');

    const batches = await Batch.find({
      $or: [
        { teamName: searchRegex },
        { 'leaderStudentId.name': searchRegex },
        { 'guideId.name': searchRegex }
      ]
    })
      .populate('leaderStudentId', 'name rollNumber email')
      .populate('problemId', 'title description')
      .populate('guideId', 'name email');

    const teamMembers = await Promise.all(
      batches.map(async (batch) => {
        const students = await require('../models/Student').find({ batchId: batch._id });
        const members = students.map(s => ({
          _id: s._id,
          name: s.name,
          rollNo: s.rollNumber,
          branch: s.branch
        }));
        return { batch: batch.toObject(), teamMembers: members };
      })
    );

    const results = teamMembers.map(({ batch, teamMembers }) => ({
      ...batch,
      teamMembers
    }));

    res.status(200).json({ success: true, data: results });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Import student batches from Excel file
// @route   POST /api/batches/import
// @access  Admin only
exports.importStudentBatches = async (req, res) => {
  try {
    // Check if file is uploaded
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'Please upload an Excel file'
      });
    }

    console.log(`[BatchImport] Starting import of ${req.file.originalname}`);

    // Parse Excel file
    const batchesData = parseStudentBatchExcel(req.file.buffer);

    const results = {
      success: 0,
      failed: 0,
      errors: [],
      warnings: [],
      createdBatches: [],
      createdStudents: []
    };

    // Process each batch
    for (const batchData of batchesData) {
      try {
        const { batchNo, students } = batchData;

        if (!students || students.length === 0) {
          results.failed++;
          results.errors.push({
            batch: batchNo,
            error: 'No students found in batch'
          });
          continue;
        }

        console.log(`[BatchImport] Processing batch ${batchNo} with ${students.length} students`);

        // Use first student's roll number as batch ID
        const firstRoll = students[0].rollNumber.toLowerCase();
        const teamName = batchNo;
        const password = `${teamName}@123`;

        // Create or get students
        const studentIds = [];
        let leaderStudentId = null;

        for (let idx = 0; idx < students.length; idx++) {
          const { rollNumber, name } = students[idx];
          const email = rollNumber.toLowerCase();

          try {
            // Use upsert with proper error handling for duplicates
            let student;
            const existingStudent = await Student.findOne({ rollNumber });

            if (existingStudent) {
              // Update existing student
              student = await Student.findOneAndUpdate(
                { rollNumber },
                {
                  name,
                  email,
                  // Keep existing password and year if already set
                  branch: 'CSE',
                  section: 'A'
                },
                { new: true, runValidators: false }
              );
              console.log(`[BatchImport] Updated existing student: ${rollNumber}`);
            } else {
              // Create new student
              student = new Student({
                name,
                email,
                password,
                rollNumber,
                year: '2nd',
                branch: 'CSE',
                section: 'A'
              });
              await student.save();
              console.log(`[BatchImport] Created new student: ${rollNumber} with password: ${password}`);
              results.createdStudents.push({
                rollNumber,
                name,
                password
              });
            }

            studentIds.push(student._id);

            // Set first student as batch leader
            if (idx === 0) {
              leaderStudentId = student._id;
            }
          } catch (error) {
            console.error(`[BatchImport] Error processing student ${rollNumber}:`, error.message);
            results.warnings.push({
              batch: batchNo,
              student: rollNumber,
              warning: error.message
            });
          }
        }

        if (studentIds.length === 0) {
          results.failed++;
          results.errors.push({
            batch: batchNo,
            error: 'Could not create/retrieve any students'
          });
          continue;
        }

        // Create or update batch
        try {
          let batch = await Batch.findOne({ batchId: firstRoll });

          if (batch) {
            // Update existing batch - add new students
            const existingStudentIds = new Set(batch.leaderStudentId ? [batch.leaderStudentId.toString()] : []);

            // Add all new students to the batch
            for (const studentId of studentIds) {
              const studentRecord = await Student.findById(studentId);
              if (studentRecord && !existingStudentIds.has(studentId.toString())) {
                await Student.findByIdAndUpdate(studentId, { batchId: batch._id }, { new: true });
              }
            }

            console.log(`[BatchImport] Updated existing batch: ${batchNo}`);
            results.success++;
          } else {
            // Create new batch
            batch = new Batch({
              batchId: firstRoll,
              teamName,
              leaderStudentId,
              year: '2nd',
              branch: 'CSE',
              section: 'A'
            });
            await batch.save();

            // Link all students to this batch
            for (const studentId of studentIds) {
              await Student.findByIdAndUpdate(studentId, { batchId: batch._id }, { new: true });
            }

            console.log(`[BatchImport] Created new batch: ${batchNo}`);
            results.success++;
            results.createdBatches.push({
              batchId: firstRoll,
              teamName,
              studentCount: studentIds.length,
              leader: students[0].name,
              leaderRoll: students[0].rollNumber
            });
          }
        } catch (error) {
          console.error(`[BatchImport] Error creating/updating batch ${batchNo}:`, error.message);
          results.failed++;
          results.errors.push({
            batch: batchNo,
            error: `Failed to create batch: ${error.message}`
          });
        }
      } catch (error) {
        console.error(`[BatchImport] Error processing batch:`, error);
        results.failed++;
        results.errors.push({
          batch: batchData.batchNo,
          error: error.message
        });
      }
    }

    console.log('[BatchImport] Import completed:', results);

    res.status(200).json({
      success: true,
      message: `Import completed: ${results.success} batches processed successfully, ${results.failed} failed`,
      results
    });
  } catch (error) {
    console.error('[BatchImport] Fatal error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to import batches',
      error: error.message
    });
  }
};
