const express = require('express');
const router = express.Router();
const multer = require('multer');
const {
  getAllBatches,
  getMyBatch,
  createBatch,
  selectProblem,
  updateBatchStatus,
  getBatch,
  getBatchesByGuide,
  getOptedTeams,
  allotProblem,
  rejectProblem,
  searchBatches,
  searchAllBatches,
  importStudentBatches
} = require('../controllers/batchController');
const { protect, authorize } = require('../middleware/auth');

// Configure multer for file upload (memory storage)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedMimes = [
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
      'application/vnd.ms-excel', // .xls
      'text/csv' // .csv
    ];
    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only Excel and CSV files are allowed.'));
    }
  }
});

router.get('/', protect, getAllBatches);
router.get('/search', searchBatches);
router.get('/search-all', searchAllBatches); // NEW: Search with full team member details
router.get('/guide/:guideId', getBatchesByGuide);
router.get('/my-batch', protect, authorize('student'), getMyBatch);
router.get('/opted-teams', protect, authorize('guide'), getOptedTeams);
router.get('/:id', protect, getBatch);
router.post('/', protect, authorize('student'), createBatch);
router.post('/import', protect, authorize('admin'), upload.single('file'), importStudentBatches);
router.post('/select-problem', protect, authorize('student'), selectProblem);
router.post('/:id/allot', protect, authorize('guide'), allotProblem);
router.post('/:id/reject', protect, authorize('guide'), rejectProblem);
router.put('/:id/status', protect, authorize('guide'), updateBatchStatus);

module.exports = router;
