const ProgressUpdate = require('../models/ProgressUpdate');
const Batch = require('../models/Batch');

// @desc    Get progress updates for a batch
// @route   GET /api/progress/:batchId
exports.getProgressUpdates = async (req, res) => {
  try {
    const updates = await ProgressUpdate.find({ batchId: req.params.batchId })
      .populate('commentThread.guideId', 'name email')
      .sort({ date: -1 });
    res.status(200).json({ success: true, data: updates });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Create progress update (Student only)
// @route   POST /api/progress
exports.createProgressUpdate = async (req, res) => {
  try {
    const { description, fileUrl } = req.body;

    // Get student's batch
    const batch = await Batch.findOne({ leaderStudentId: req.user._id });
    if (!batch) {
      return res.status(404).json({ success: false, message: 'Create a batch first' });
    }

    if (!batch.problemId) {
      return res.status(400).json({ success: false, message: 'Select a problem first' });
    }

    const update = await ProgressUpdate.create({
      batchId: batch._id,
      description,
      fileUrl
    });

    res.status(201).json({ success: true, data: update });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Add comment to progress update (Guide only)
// @route   POST /api/progress/:id/comment
exports.addComment = async (req, res) => {
  try {
    const { comment } = req.body;

    const update = await ProgressUpdate.findById(req.params.id);
    if (!update) {
      return res.status(404).json({ success: false, message: 'Progress update not found' });
    }

    // Check if guide is assigned to this batch
    const batch = await Batch.findById(update.batchId);
    if (!batch || batch.guideId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    update.commentThread.push({
      guideId: req.user._id,
      comment,
      date: new Date()
    });

    await update.save();

    const updatedProgress = await ProgressUpdate.findById(update._id)
      .populate('commentThread.guideId', 'name email');

    res.status(200).json({ success: true, data: updatedProgress });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get all progress updates (for guide's batches)
// @route   GET /api/progress/guide/all
exports.getGuideProgressUpdates = async (req, res) => {
  try {
    // Get all batches assigned to this guide
    const batches = await Batch.find({ guideId: req.user._id });
    const batchIds = batches.map(b => b._id);

    const updates = await ProgressUpdate.find({ batchId: { $in: batchIds } })
      .populate('batchId', 'teamName')
      .populate('commentThread.guideId', 'name email')
      .sort({ date: -1 });

    res.status(200).json({ success: true, data: updates });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

