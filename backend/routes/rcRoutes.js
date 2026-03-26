const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const {
  getAllRCs,
  getRC,
  createRC,
  updateRC,
  deleteRC,
  searchRCs
} = require('../controllers/rcController');

// Public routes
router.get('/', getAllRCs);
router.get('/search', searchRCs);
router.get('/:id', getRC);

// Admin only routes
router.post('/', protect, authorize('admin'), createRC);
router.put('/:id', protect, authorize('admin'), updateRC);
router.delete('/:id', protect, authorize('admin'), deleteRC);

module.exports = router;
