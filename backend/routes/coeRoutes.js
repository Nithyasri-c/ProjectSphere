const express = require('express');
const router = express.Router();
const { getAllCOEs, getCOE, createCOE, updateCOE, deleteCOE, getCOEDetails } = require('../controllers/coeController');
const { protect, authorize } = require('../middleware/auth');

router.get('/', protect, getAllCOEs);
router.get('/:id/details', protect, getCOEDetails);
router.get('/:id', protect, getCOE);
router.post('/', protect, authorize('admin'), createCOE);
router.put('/:id', protect, authorize('admin'), updateCOE);
router.delete('/:id', protect, authorize('admin'), deleteCOE);

module.exports = router;

