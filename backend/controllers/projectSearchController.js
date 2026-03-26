const ProjectEntry = require('../models/ProjectEntry');
const Batch = require('../models/Batch');

/**
 * @desc    Search projects by multiple fields
 * @route   GET /api/projects/search-projects?q=query
 * @access  Public
 */
exports.searchProjectEntries = async (req, res) => {
  try {
    const { q } = req.query;

    if (!q || q.trim() === '') {
      return res.status(400).json({
        success: false,
        message: 'Search query is required'
      });
    }

    const searchTerm = q.trim();
    const searchRegex = new RegExp(searchTerm, 'i');

    // Search across multiple fields
    const projects = await ProjectEntry.find({
      $or: [
        { projectTitle: searchRegex },
        { 'internalGuide.name': searchRegex },
        { domain: searchRegex },
        { 'coe.name': searchRegex },
        { 'rc.name': searchRegex },
        { 'students.name': searchRegex },
        { projectId: searchRegex }
      ]
    })
    .populate('internalGuide.guideId', 'name email')
    .populate('coe.coeId', 'name')
    .populate('rc.rcId', 'name')
    .populate('batchId', 'teamName')
    .sort({ createdAt: -1 })
    .lean();

    res.status(200).json({
      success: true,
      count: projects.length,
      data: projects
    });
  } catch (error) {
    console.error('Search projects error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to search projects',
      error: error.message
    });
  }
};

/**
 * @desc    Get all project entries with pagination
 * @route   GET /api/projects/all-entries?page=1&limit=10
 * @access  Public
 */
exports.getAllProjectEntries = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const total = await ProjectEntry.countDocuments();
    const projects = await ProjectEntry.find()
      .populate('internalGuide.guideId', 'name email')
      .populate('coe.coeId', 'name')
      .populate('rc.rcId', 'name')
      .populate('batchId', 'teamName')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    res.status(200).json({
      success: true,
      count: projects.length,
      total,
      page,
      pages: Math.ceil(total / limit),
      data: projects
    });
  } catch (error) {
    console.error('Get projects error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get projects',
      error: error.message
    });
  }
};

/**
 * @desc    Get single project entry by ID
 * @route   GET /api/projects/entry/:id
 * @access  Public
 */
exports.getProjectEntry = async (req, res) => {
  try {
    const project = await ProjectEntry.findById(req.params.id)
      .populate('internalGuide.guideId', 'name email')
      .populate('coe.coeId', 'name')
      .populate('rc.rcId', 'name')
      .populate('batchId')
      .lean();

    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Project not found'
      });
    }

    res.status(200).json({
      success: true,
      data: project
    });
  } catch (error) {
    console.error('Get project error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get project',
      error: error.message
    });
  }
};

/**
 * @desc    Filter projects by domain
 * @route   GET /api/projects/filter/domain?domain=DeepLearning
 * @access  Public
 */
exports.filterByDomain = async (req, res) => {
  try {
    const { domain } = req.query;

    if (!domain) {
      return res.status(400).json({
        success: false,
        message: 'Domain parameter is required'
      });
    }

    const searchRegex = new RegExp(domain.trim(), 'i');

    const projects = await ProjectEntry.find({ domain: searchRegex })
      .populate('internalGuide.guideId', 'name email')
      .populate('coe.coeId', 'name')
      .populate('rc.rcId', 'name')
      .populate('batchId', 'teamName')
      .sort({ createdAt: -1 })
      .lean();

    res.status(200).json({
      success: true,
      count: projects.length,
      data: projects
    });
  } catch (error) {
    console.error('Filter by domain error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to filter projects',
      error: error.message
    });
  }
};

/**
 * @desc    Filter projects by COE
 * @route   GET /api/projects/filter/coe?coe=GNITS
 * @access  Public
 */
exports.filterByCOE = async (req, res) => {
  try {
    const { coe } = req.query;

    if (!coe) {
      return res.status(400).json({
        success: false,
        message: 'COE parameter is required'
      });
    }

    const searchRegex = new RegExp(coe.trim(), 'i');

    const projects = await ProjectEntry.find({ 'coe.name': searchRegex })
      .populate('internalGuide.guideId', 'name email')
      .populate('coe.coeId', 'name')
      .populate('rc.rcId', 'name')
      .populate('batchId', 'teamName')
      .sort({ createdAt: -1 })
      .lean();

    res.status(200).json({
      success: true,
      count: projects.length,
      data: projects
    });
  } catch (error) {
    console.error('Filter by COE error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to filter projects',
      error: error.message
    });
  }
};

/**
 * @desc    Filter projects by RC
 * @route   GET /api/projects/filter/rc?rc=CoE-DeepLearning
 * @access  Public
 */
exports.filterByRC = async (req, res) => {
  try {
    const { rc } = req.query;

    if (!rc) {
      return res.status(400).json({
        success: false,
        message: 'RC parameter is required'
      });
    }

    const searchRegex = new RegExp(rc.trim(), 'i');

    const projects = await ProjectEntry.find({ 'rc.name': searchRegex })
      .populate('internalGuide.guideId', 'name email')
      .populate('coe.coeId', 'name')
      .populate('rc.rcId', 'name')
      .populate('batchId', 'teamName')
      .sort({ createdAt: -1 })
      .lean();

    res.status(200).json({
      success: true,
      count: projects.length,
      data: projects
    });
  } catch (error) {
    console.error('Filter by RC error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to filter projects',
      error: error.message
    });
  }
};

/**
 * @desc    Filter projects by guide name
 * @route   GET /api/projects/filter/guide?guide=DrSmith
 * @access  Public
 */
exports.filterByGuide = async (req, res) => {
  try {
    const { guide } = req.query;

    if (!guide) {
      return res.status(400).json({
        success: false,
        message: 'Guide parameter is required'
      });
    }

    const searchRegex = new RegExp(guide.trim(), 'i');

    const projects = await ProjectEntry.find({ 'internalGuide.name': searchRegex })
      .populate('internalGuide.guideId', 'name email')
      .populate('coe.coeId', 'name')
      .populate('rc.rcId', 'name')
      .populate('batchId', 'teamName')
      .sort({ createdAt: -1 })
      .lean();

    res.status(200).json({
      success: true,
      count: projects.length,
      data: projects
    });
  } catch (error) {
    console.error('Filter by guide error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to filter projects',
      error: error.message
    });
  }
};

/**
 * @desc    Get project entry by batch ID
 * @route   GET /api/projects/entry/batch/:batchId
 * @access  Public
 */
exports.getProjectEntryByBatchId = async (req, res) => {
  try {
    const project = await ProjectEntry.findOne({ batchId: req.params.batchId })
      .populate('internalGuide.guideId', 'name email')
      .populate('coe.coeId', 'name')
      .populate('rc.rcId', 'name')
      .populate('batchId')
      .lean();

    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Project not found for this batch'
      });
    }

    res.status(200).json({
      success: true,
      data: project
    });
  } catch (error) {
    console.error('Get project by batch error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get project',
      error: error.message
    });
  }
};

/**
 * @desc    Get available domains
 * @route   GET /api/projects/meta/domains
 * @access  Public
 */
exports.getDomains = async (req, res) => {
  try {
    const domains = await ProjectEntry.distinct('domain');
    
    res.status(200).json({
      success: true,
      count: domains.length,
      data: domains.filter(d => d && d !== 'N/A')
    });
  } catch (error) {
    console.error('Get domains error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get domains',
      error: error.message
    });
  }
};

/**
 * @desc    Get available COEs
 * @route   GET /api/projects/meta/coes
 * @access  Public
 */
exports.getCOEs = async (req, res) => {
  try {
    const coes = await ProjectEntry.distinct('coe.name');
    
    res.status(200).json({
      success: true,
      count: coes.length,
      data: coes.filter(c => c && c !== 'N/A')
    });
  } catch (error) {
    console.error('Get COEs error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get COEs',
      error: error.message
    });
  }
};

/**
 * @desc    Get available RCs
 * @route   GET /api/projects/meta/rcs
 * @access  Public
 */
exports.getRCs = async (req, res) => {
  try {
    const rcs = await ProjectEntry.distinct('rc.name');
    
    res.status(200).json({
      success: true,
      count: rcs.length,
      data: rcs.filter(r => r && r !== 'N/A')
    });
  } catch (error) {
    console.error('Get RCs error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get RCs',
      error: error.message
    });
  }
};
