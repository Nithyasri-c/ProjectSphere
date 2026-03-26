const Guide = require('../models/Guide');
const Batch = require('../models/Batch');

// @desc    Get all guides
// @route   GET /api/guides
exports.getAllGuides = async (req, res) => {
  try {
    const guides = await Guide.find().select('-password');
    res.status(200).json({ success: true, data: guides });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Search guides by name
// @route   GET /api/guides/search?q=searchTerm
exports.searchGuides = async (req, res) => {
  try {
    const { q } = req.query;
    
    if (!q || q.trim() === '') {
      return res.status(400).json({ success: false, message: 'Search query is required' });
    }

    // Create a regex pattern for case-insensitive search
    const searchPattern = new RegExp(q, 'i');

    const guides = await Guide.find({
      name: searchPattern
    }).select('-password');

    res.status(200).json({ success: true, data: guides });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get single guide
// @route   GET /api/guides/:id
exports.getGuide = async (req, res) => {
  try {
    const guide = await Guide.findById(req.params.id).select('-password');
    if (!guide) {
      return res.status(404).json({ success: false, message: 'Guide not found' });
    }
    res.status(200).json({ success: true, data: guide });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Create guide (Admin only)
// @route   POST /api/guides
exports.createGuide = async (req, res) => {
  try {
    const { name, email, password } = req.body;
    
    const existingGuide = await Guide.findOne({ email });
    if (existingGuide) {
      return res.status(400).json({ success: false, message: 'Email already exists' });
    }

    const guide = await Guide.create({ name, email, password });
    res.status(201).json({ 
      success: true, 
      data: { id: guide._id, name: guide.name, email: guide.email, maxBatches: guide.maxBatches, assignedBatches: guide.assignedBatches }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Update guide
// @route   PUT /api/guides/:id
exports.updateGuide = async (req, res) => {
  try {
    const { password, ...updateData } = req.body;
    const guide = await Guide.findByIdAndUpdate(req.params.id, updateData, {
      new: true,
      runValidators: true
    }).select('-password');
    if (!guide) {
      return res.status(404).json({ success: false, message: 'Guide not found' });
    }
    res.status(200).json({ success: true, data: guide });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get guide's assigned batches
// @route   GET /api/guides/my-batches
exports.getMyBatches = async (req, res) => {
  try {
    const batches = await Batch.find({ guideId: req.user._id, allotmentStatus: 'allotted' })
      .populate('leaderStudentId', 'name email')
      .populate('problemId', 'title description')
      .populate('coeId', 'name')
      .populate('guideId', 'name email');
    res.status(200).json({ success: true, data: batches });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

