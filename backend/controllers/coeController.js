const COE = require('../models/COE');
const Batch = require('../models/Batch');
const ProblemStatement = require('../models/ProblemStatement');
const Guide = require('../models/Guide');
const Student = require('../models/Student');

// @desc    Get all COEs
// @route   GET /api/coe
exports.getAllCOEs = async (req, res) => {
  try {
    const coes = await COE.find();
    res.status(200).json({ success: true, data: coes });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get single COE
// @route   GET /api/coe/:id
exports.getCOE = async (req, res) => {
  try {
    const coe = await COE.findById(req.params.id);
    if (!coe) {
      return res.status(404).json({ success: false, message: 'COE not found' });
    }
    res.status(200).json({ success: true, data: coe });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Create COE
// @route   POST /api/coe
exports.createCOE = async (req, res) => {
  try {
    const { name, description } = req.body;
    const coe = await COE.create({ name, description });
    res.status(201).json({ success: true, data: coe });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Update COE
// @route   PUT /api/coe/:id
exports.updateCOE = async (req, res) => {
  try {
    const coe = await COE.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });
    if (!coe) {
      return res.status(404).json({ success: false, message: 'COE not found' });
    }
    res.status(200).json({ success: true, data: coe });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Delete COE
// @route   DELETE /api/coe/:id
exports.deleteCOE = async (req, res) => {
  try {
    const coeId = req.params.id;
    const coe = await COE.findById(coeId);

    if (!coe) {
      return res.status(404).json({ success: false, message: 'COE not found' });
    }

    // Update Batches to remove reference
    await Batch.updateMany({ coeId: coeId }, { $set: { coeId: null } });

    // Update ProblemStatements to remove reference
    await ProblemStatement.updateMany({ coeId: coeId }, { $set: { coeId: null } });

    await COE.findByIdAndDelete(coeId);

    res.status(200).json({ success: true, data: {} });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get COE details with related data
// @route   GET /api/coe/:id/details
exports.getCOEDetails = async (req, res) => {
  try {
    const coeId = req.params.id;
    const coe = await COE.findById(coeId);

    if (!coe) {
      return res.status(404).json({ success: false, message: 'COE not found' });
    }

    // Get problem statements for this COE
    const problemStatements = await ProblemStatement.find({ coeId }).populate('guideId', 'name');

    // Get problem statement IDs for this COE (to find batches linked via allotted problem)
    const problemStatementIds = problemStatements.map(p => p._id);

    // Fetch batches that belong to this COE via any linkage:
    // 1. batch.coeId directly points to this COE (set during allotProblem)
    // 2. batch.coe.coeId embedded subdocument (set during Excel import)
    // 3. batch.problemId is one of this COE's problem statements (correct for Others COE)
    const batchQuery = {
      $or: [
        { coeId: coeId },
        { 'coe.coeId': coeId }
      ]
    };

    // Only add the problemId filter if there are problem statements (avoids fetching everything)
    if (problemStatementIds.length > 0) {
      batchQuery.$or.push({ problemId: { $in: problemStatementIds } });
    }

    const allBatches = await Batch.find(batchQuery)
      .populate('problemId', 'title coeId')
      .populate('guideId', 'name')
      .populate('leaderStudentId', 'name rollNumber');

    // Deduplicate by batch _id (in case multiple conditions matched same batch)
    const batchMap = new Map();
    allBatches.forEach(b => {
      if (!batchMap.has(b._id.toString())) {
        batchMap.set(b._id.toString(), b);
      }
    });
    const batches = Array.from(batchMap.values());

    // Get all students in these batches
    const batchIds = batches.map(b => b._id);
    const students = await Student.find({ batchId: { $in: batchIds } }).select('name rollNumber batchId');

    // Get unique guides from both problem statements and batches
    const guideIdsFromProblems = problemStatements.map(p => p.guideId?._id?.toString()).filter(Boolean);
    const guideIdsFromBatches = batches.map(b => b.guideId?._id?.toString() || b.guideId?.toString()).filter(Boolean);
    const uniqueGuideIds = [...new Set([...guideIdsFromProblems, ...guideIdsFromBatches])];
    const guides = await Guide.find({ _id: { $in: uniqueGuideIds } }).select('name');

    res.status(200).json({
      success: true,
      data: {
        coe,
        problemStatements,
        guides,
        students,
        batches,
        counts: {
          problemStatements: problemStatements.length,
          guides: guides.length,
          batches: batches.length,
          students: students.length
        }
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

