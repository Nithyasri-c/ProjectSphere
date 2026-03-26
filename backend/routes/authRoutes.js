const express = require('express');
const router = express.Router();
const { registerStudent, registerGuide, registerAdmin, login, getMe, resetPassword } = require('../controllers/authController');
const { protect } = require('../middleware/auth');

router.post('/register/student', registerStudent);
router.post('/register/guide', registerGuide);
router.post('/register/admin', registerAdmin);
router.post('/login', login);
router.post('/reset-password', resetPassword);
router.get('/me', protect, getMe);

module.exports = router;

