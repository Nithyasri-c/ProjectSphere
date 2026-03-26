const RC = require('../models/RC');

/**
 * @desc    Get all RCs
 * @route   GET /api/rc
 * @access  Public
 */
exports.getAllRCs = async (req, res) => {
  try {
    const rcs = await RC.find({ isActive: true }).sort({ name: 1 });

    res.status(200).json({
      success: true,
      count: rcs.length,
      data: rcs
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

/**
 * @desc    Get single RC by ID
 * @route   GET /api/rc/:id
 * @access  Public
 */
exports.getRC = async (req, res) => {
  try {
    const rc = await RC.findById(req.params.id);

    if (!rc) {
      return res.status(404).json({
        success: false,
        message: 'RC not found'
      });
    }

    res.status(200).json({
      success: true,
      data: rc
    });
  } catch (error) {
    console.error('Get RC error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get RC',
      error: error.message
    });
  }
};

/**
 * @desc    Create new RC
 * @route   POST /api/rc
 * @access  Admin only
 */
exports.createRC = async (req, res) => {
  try {
    const { name, email, department, description } = req.body;

    // Validate required fields
    if (!name) {
      return res.status(400).json({
        success: false,
        message: 'RC name is required'
      });
    }

    // Check if RC already exists
    let rc = await RC.findOne({ name: name.trim() });
    if (rc) {
      return res.status(400).json({
        success: false,
        message: 'RC with this name already exists'
      });
    }

    rc = await RC.create({
      name: name.trim(),
      email: email ? email.trim() : '',
      department: department ? department.trim() : 'GNITS',
      description: description ? description.trim() : '',
      createdBy: req.user._id,
      isActive: true
    });

    res.status(201).json({
      success: true,
      message: 'RC created successfully',
      data: rc
    });
  } catch (error) {
    console.error('Create RC error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create RC',
      error: error.message
    });
  }
};

/**
 * @desc    Update RC
 * @route   PUT /api/rc/:id
 * @access  Admin only
 */
exports.updateRC = async (req, res) => {
  try {
    let rc = await RC.findById(req.params.id);

    if (!rc) {
      return res.status(404).json({
        success: false,
        message: 'RC not found'
      });
    }

    const { name, email, department, description, isActive } = req.body;

    // Check if new name is unique
    if (name && name !== rc.name) {
      const exists = await RC.findOne({ name: name.trim() });
      if (exists) {
        return res.status(400).json({
          success: false,
          message: 'RC with this name already exists'
        });
      }
    }

    // Update fields
    if (name) rc.name = name.trim();
    if (email !== undefined) rc.email = email ? email.trim() : '';
    if (department) rc.department = department.trim();
    if (description !== undefined) rc.description = description ? description.trim() : '';
    if (isActive !== undefined) rc.isActive = isActive;
    
    rc.updatedBy = req.user._id;
    rc.updatedAt = Date.now();

    await rc.save();

    res.status(200).json({
      success: true,
      message: 'RC updated successfully',
      data: rc
    });
  } catch (error) {
    console.error('Update RC error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update RC',
      error: error.message
    });
  }
};

/**
 * @desc    Delete RC (soft delete - just mark as inactive)
 * @route   DELETE /api/rc/:id
 * @access  Admin only
 */
exports.deleteRC = async (req, res) => {
  try {
    const rc = await RC.findById(req.params.id);

    if (!rc) {
      return res.status(404).json({
        success: false,
        message: 'RC not found'
      });
    }

    // Soft delete
    rc.isActive = false;
    rc.updatedBy = req.user._id;
    await rc.save();

    res.status(200).json({
      success: true,
      message: 'RC deleted successfully'
    });
  } catch (error) {
    console.error('Delete RC error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete RC',
      error: error.message
    });
  }
};

/**
 * @desc    Search RCs by name or department
 * @route   GET /api/rc/search?q=query
 * @access  Public
 */
exports.searchRCs = async (req, res) => {
  try {
    const { q } = req.query;

    if (!q || q.trim() === '') {
      return res.status(400).json({
        success: false,
        message: 'Search query is required'
      });
    }

    const searchRegex = new RegExp(q.trim(), 'i');

    const rcs = await RC.find({
      isActive: true,
      $or: [
        { name: searchRegex },
        { department: searchRegex },
        { description: searchRegex }
      ]
    }).sort({ name: 1 });

    res.status(200).json({
      success: true,
      count: rcs.length,
      data: rcs
    });
  } catch (error) {
    console.error('Search RCs error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to search RCs',
      error: error.message
    });
  }
};
