const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const { protect, authorize } = require('../middleware/auth');
const {
  getGuideChats,
  getStudentChat,
  sendMessage,
  getBatchTeamChats,
  getChatDetails,
  getGuideInfo,
  markChatAsRead,
  uploadChatFile
} = require('../controllers/chatController');

const {
  generateProjectSummaries,
  getProjectSummaries,
  generateBatchSummaries,
  getBatchSummaries
} = require('../controllers/chatSummaryController');

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.join(__dirname, '../uploads/chat'));
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + '-' + file.originalname);
  }
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB
  fileFilter: function (req, file, cb) {
    // Allow common file types
    const allowedTypes = /pdf|doc|docx|xls|xlsx|ppt|pptx|jpg|jpeg|png|gif|zip|txt/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    if (extname) {
      return cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only certain file types are allowed.'));
    }
  }
});

// Chat routes - protected
router.use(protect);

// Summary routes - accessible by admin, student, and guide
router.post('/summarize/:projectId', authorize('admin', 'student', 'guide'), generateProjectSummaries);
router.get('/summaries/:projectId', authorize('admin', 'student', 'guide'), getProjectSummaries);
router.post('/summarize-batch/:batchId', authorize('admin', 'student', 'guide'), generateBatchSummaries);
router.get('/summaries-batch/:batchId', authorize('admin', 'student', 'guide'), getBatchSummaries);

// More specific routes first
router.get('/guide/chats', getGuideChats);
router.get('/guide/batch/:batchId', getBatchTeamChats);
router.get('/guide-info/:batchId', getGuideInfo);
router.post('/mark-read', markChatAsRead);
router.post('/upload', upload.single('file'), uploadChatFile);

// Less specific routes after
router.post('/send', sendMessage);
router.get('/student/:batchId/:teamMemberId', getStudentChat);
router.get('/:batchId/:teamMemberId', getStudentChat); // Generic fallback for both guide and student

module.exports = router;

