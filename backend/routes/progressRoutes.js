const express = require('express');
const router = express.Router();
const { 
  getProgressUpdates, 
  createProgressUpdate, 
  addComment,
  getGuideProgressUpdates
} = require('../controllers/progressController');
const { protect, authorize } = require('../middleware/auth');

router.get('/guide/all', protect, authorize('guide'), getGuideProgressUpdates);
router.get('/:batchId', protect, getProgressUpdates);
router.post('/', protect, authorize('student'), createProgressUpdate);
router.post('/:id/comment', protect, authorize('guide'), addComment);

module.exports = router;

