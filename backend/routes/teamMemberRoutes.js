const express = require('express');
const router = express.Router();
const { 
  getTeamMembers, 
  addTeamMember, 
  updateTeamMember, 
  deleteTeamMember 
} = require('../controllers/teamMemberController');
const { protect, authorize } = require('../middleware/auth');

router.get('/:batchId', protect, getTeamMembers);
router.post('/', protect, authorize('student'), addTeamMember);
router.put('/:id', protect, authorize('student'), updateTeamMember);
router.delete('/:id', protect, authorize('student'), deleteTeamMember);

module.exports = router;

