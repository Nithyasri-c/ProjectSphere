const ProblemStatement = require('../models/ProblemStatement');
const Batch = require('../models/Batch');

// @desc    Get all problem statements
// @route   GET /api/problems
exports.getAllProblems = async (req, res) => {
  try {
    const problems = await ProblemStatement.find()
      .populate('coeId', 'name')
      .populate('guideId', 'name email assignedBatches maxBatches');
    res.status(200).json({ success: true, data: problems });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Search problem statements by title or description
// @route   GET /api/problems/search?q=searchTerm
exports.searchProblems = async (req, res) => {
  try {
    const { q } = req.query;

    if (!q || q.trim() === '') {
      return res.status(400).json({ success: false, message: 'Search query is required' });
    }

    // Create a regex pattern for case-insensitive search
    const searchPattern = new RegExp(q, 'i');

    const problems = await ProblemStatement.find({
      $or: [
        { title: searchPattern },
        { description: searchPattern }
      ]
    })
      .populate('coeId', 'name')
      .populate('guideId', 'name email assignedBatches maxBatches');

    res.status(200).json({ success: true, data: problems });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get my problem statements (Guide)
// @route   GET /api/problems/my-problems
exports.getMyProblems = async (req, res) => {
  try {
    const problems = await ProblemStatement.find({ guideId: req.user._id })
      .populate('coeId', 'name')
      .populate('guideId', 'name email');

    // For each problem, find the allotted batch
    const problemsWithBatch = await Promise.all(problems.map(async (problem) => {
      const allottedBatch = await Batch.findOne({ problemId: problem._id }).select('teamName');
      return {
        ...problem.toObject(),
        allottedTeamName: allottedBatch ? allottedBatch.teamName : null
      };
    }));

    res.status(200).json({ success: true, data: problemsWithBatch });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get problems by COE
// @route   GET /api/problems/coe/:coeId
exports.getProblemsByCOE = async (req, res) => {
  try {
    const problems = await ProblemStatement.find({ coeId: req.params.coeId })
      .populate('coeId', 'name')
      .populate('guideId', 'name email assignedBatches maxBatches');
    res.status(200).json({ success: true, data: problems });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get single problem statement
// @route   GET /api/problems/:id
exports.getProblem = async (req, res) => {
  try {
    const problem = await ProblemStatement.findById(req.params.id)
      .populate('coeId', 'name')
      .populate('guideId', 'name email assignedBatches maxBatches');
    if (!problem) {
      return res.status(404).json({ success: false, message: 'Problem statement not found' });
    }
    res.status(200).json({ success: true, data: problem });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Create problem statement (Guide creates their own)
// @route   POST /api/problems
exports.createProblem = async (req, res) => {
  try {
    const { coeId, title, description, targetYear, datasetUrl, researchArea } = req.body;

    // Validate required fields
    if (!coeId || !coeId.trim()) {
      return res.status(400).json({ success: false, message: 'COE is required' });
    }
    if (!title || !title.trim()) {
      return res.status(400).json({ success: false, message: 'Title is required' });
    }
    if (!description || !description.trim()) {
      return res.status(400).json({ success: false, message: 'Description is required' });
    }
    if (!targetYear || !targetYear.trim()) {
      return res.status(400).json({ success: false, message: 'Target year is required' });
    }
    if (!researchArea || !researchArea.trim()) {
      return res.status(400).json({ success: false, message: 'Research Area is required' });
    }

    // Guide creates their own problem - use their ID
    const guideId = req.user.role === 'guide' ? req.user._id : req.body.guideId;

    const problem = await ProblemStatement.create({
      coeId, title, description, targetYear, guideId, datasetUrl, researchArea
    });

    const populatedProblem = await ProblemStatement.findById(problem._id)
      .populate('coeId', 'name')
      .populate('guideId', 'name email');

    res.status(201).json({ success: true, data: populatedProblem });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Update problem statement
// @route   PUT /api/problems/:id
exports.updateProblem = async (req, res) => {
  try {
    let problem = await ProblemStatement.findById(req.params.id);

    if (!problem) {
      return res.status(404).json({ success: false, message: 'Problem statement not found' });
    }

    // Security: Check if user is an admin or the owner (guide) of the problem
    if (req.user.role !== 'admin' && problem.guideId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized to update this problem statement' });
    }

    const oldCoeId = problem.coeId?.toString();
    const newCoeId = req.body.coeId;

    problem = await ProblemStatement.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    })
      .populate('coeId', 'name')
      .populate('guideId', 'name email');

    // If COE changed, sync it to all batches associated with this problem
    if (newCoeId && oldCoeId !== newCoeId) {
      await Batch.updateMany(
        { problemId: problem._id },
        { coeId: newCoeId }
      );
      // Also update any batches that have this as their optedProblemId
      await Batch.updateMany(
        { optedProblemId: problem._id },
        { coeId: newCoeId }
      );
    }

    res.status(200).json({ success: true, data: problem });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Delete problem statement
// @route   DELETE /api/problems/:id
exports.deleteProblem = async (req, res) => {
  try {
    const problem = await ProblemStatement.findById(req.params.id);
    if (!problem) {
      return res.status(404).json({ success: false, message: 'Problem statement not found' });
    }

    // Security: Check if user is an admin or the owner (guide) of the problem
    if (req.user.role !== 'admin' && problem.guideId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized to delete this problem statement' });
    }

    // Check if the problem is already allotted to any batch
    const allottedBatch = await Batch.findOne({
      $or: [
        { problemId: req.params.id },
        { optedProblemId: req.params.id, allotmentStatus: 'allotted' }
      ]
    });

    if (allottedBatch) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete problem statement as it is already allotted to a team'
      });
    }

    // Clear this problem from all batches that opted for it (those not yet allotted)
    await Batch.updateMany(
      { 'optedProblems.problemId': req.params.id },
      { $pull: { optedProblems: { problemId: req.params.id } } }
    );

    // Also clear legacy optedProblemId field for any other pending states
    await Batch.updateMany(
      { optedProblemId: req.params.id },
      {
        $set: {
          optedProblemId: null,
          coeId: null,
          allotmentStatus: 'none'
        }
      }
    );

    // Delete the problem
    await ProblemStatement.findByIdAndDelete(req.params.id);

    res.status(200).json({ success: true, data: {} });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

