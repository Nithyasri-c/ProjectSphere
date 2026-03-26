const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { protect, authorize } = require('../middleware/auth');
const {
  createEvent,
  getAllEvents,
  updateEvent,
  deleteEvent,
  getTimelineForBatch
} = require('../controllers/timelineController');

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const dir = 'uploads/reference';
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    cb(null, dir);
  },
  filename: function (req, file, cb) {
    cb(null, `ref-${Date.now()}${path.extname(file.originalname)}`);
  }
});

const upload = multer({ storage: storage });

// Public routes (protected)
router.get('/', protect, getAllEvents);
router.get('/batch/:batchId', protect, getTimelineForBatch);

// Admin only routes
router.post('/', protect, authorize('admin'), upload.single('referenceFile'), createEvent);
router.put('/:id', protect, authorize('admin'), upload.single('referenceFile'), updateEvent);
router.delete('/:id', protect, authorize('admin'), deleteEvent);

module.exports = router;

