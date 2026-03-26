const Student = require('../models/Student');
const Guide = require('../models/Guide');
const Admin = require('../models/Admin');
const generateToken = require('../utils/generateToken');

// @desc    Register student
// @route   POST /api/auth/register/student
exports.registerStudent = async (req, res) => {
  try {
    return res.status(403).json({
      success: false,
      message: 'Student registration is currently disabled. Please contact your administrator.'
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Register guide
// @route   POST /api/auth/register/guide
exports.registerGuide = async (req, res) => {
  try {
    const { name, email, password, department, specialization } = req.body;

    // Email domain validation
    // Password complexity validation
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
    if (!passwordRegex.test(password)) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 8 characters long and include uppercase, lowercase, numbers, and special characters (@$!%*?&)'
      });
    }

    const existingGuide = await Guide.findOne({ email });
    if (existingGuide) {
      return res.status(400).json({ success: false, message: 'Email already exists' });
    }

    const guide = await Guide.create({ name, email, password, department, specialization });
    const token = generateToken(guide._id, 'guide');

    res.status(201).json({
      success: true,
      token,
      user: { id: guide._id, name: guide.name, email: guide.email, role: 'guide' }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Register admin
// @route   POST /api/auth/register/admin
exports.registerAdmin = async (req, res) => {
  try {
    const { name, email, password, department } = req.body;

    // Email domain validation
    if (!email.endsWith('@gmail.com') && !email.endsWith('.ac.in')) {
      return res.status(400).json({ success: false, message: 'Please use a valid @gmail.com or GNITS (.ac.in) email address' });
    }

    // Password complexity validation
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
    if (!passwordRegex.test(password)) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 8 characters long and include uppercase, lowercase, numbers, and special characters (@$!%*?&)'
      });
    }

    const existingAdmin = await Admin.findOne({ email });
    if (existingAdmin) {
      return res.status(400).json({ success: false, message: 'Email already exists' });
    }

    const admin = await Admin.create({ name, email, password, department });
    const token = generateToken(admin._id, 'admin');

    res.status(201).json({
      success: true,
      token,
      user: { id: admin._id, name: admin.name, email: admin.email, role: 'admin' }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Login user (auto-detect role)
// @route   POST /api/auth/login
exports.login = async (req, res) => {
  try {
    const { email, password, role } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Please provide email and password' });
    }

    // Role is REQUIRED and must match exactly
    if (!role) {
      return res.status(400).json({ success: false, message: 'Please select a role' });
    }

    if (!['student', 'guide', 'admin'].includes(role)) {
      return res.status(400).json({ success: false, message: 'Invalid role specified' });
    }

    let user;
    let userRole;

    // Search only in the specified role's collection
    if (role === 'student') {
      // For students, check both email and rollNumber
      user = await Student.findOne({
        $or: [{ email: email }, { rollNumber: email }]
      }).select('+password');
      userRole = 'student';
    } else if (role === 'guide') {
      user = await Guide.findOne({ email }).select('+password');
      userRole = 'guide';
    } else if (role === 'admin') {
      user = await Admin.findOne({ email }).select('+password');
      userRole = 'admin';
    }

    if (!user) {
      return res.status(401).json({ success: false, message: `No ${role} account found with these credentials` });
    }

    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    const token = generateToken(user._id, userRole);

    res.status(200).json({
      success: true,
      token,
      user: { id: user._id, name: user.name, email: user.email, role: userRole }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get current logged in user
// @route   GET /api/auth/me
exports.getMe = async (req, res) => {
  try {
    res.status(200).json({
      success: true,
      user: { id: req.user._id, name: req.user.name, email: req.user.email, role: req.user.role }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Reset password directly
// @route   POST /api/auth/reset-password
exports.resetPassword = async (req, res) => {
  try {
    const { email, role, newPassword } = req.body;

    if (!email || !role || !newPassword) {
      return res.status(400).json({ success: false, message: 'Please provide all required fields' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ success: false, message: 'Password must be at least 6 characters' });
    }

    if (!['student', 'guide', 'admin'].includes(role)) {
      return res.status(400).json({ success: false, message: 'Invalid role' });
    }

    let user;

    if (role === 'student') {
      user = await Student.findOne({
        $or: [{ email: email }, { rollNumber: email }]
      });
    } else if (role === 'guide') {
      user = await Guide.findOne({ email });
    } else if (role === 'admin') {
      user = await Admin.findOne({ email });
    }

    if (!user) {
      return res.status(404).json({ success: false, message: `No ${role} account found with this credentials` });
    }

    // Update password directly
    user.password = newPassword;
    await user.save();

    res.status(200).json({
      success: true,
      message: 'Password reset successfully'
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

