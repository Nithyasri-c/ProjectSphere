const TeamMember = require('../models/TeamMember');
const Batch = require('../models/Batch');

// @desc    Get team members for a batch
// @route   GET /api/team-members/:batchId
exports.getTeamMembers = async (req, res) => {
  try {
    const Batch = require('../models/Batch');
    const Student = require('../models/Student');
    const batch = await Batch.findById(req.params.batchId);
    
    if (!batch) {
      return res.status(404).json({ success: false, message: 'Batch not found' });
    }

    // Get team members from both sources
    const [students, teamMembers] = await Promise.all([
      Student.find({ batchId: req.params.batchId }).select('_id name rollNumber branch'),
      TeamMember.find({ batchId: req.params.batchId }).select('_id name rollNo branch')
    ]);

    // Merge and deduplicate using normalized keys
    const memberMap = new Map();

    // Add students first (prioritize Student records)
    students.forEach(s => {
      const key = (s.rollNumber || '').trim().toLowerCase();
      if (key) { // Only add if there's a valid rollNumber
        memberMap.set(key, {
          _id: s._id,
          name: s.name,
          rollNo: s.rollNumber,
          branch: s.branch,
          source: 'student'
        });
      }
    });

    // Add team members only if not already present (avoid duplicates)
    teamMembers.forEach(tm => {
      const key = (tm.rollNo || '').trim().toLowerCase();
      if (key && !memberMap.has(key)) { // Only add if key doesn't exist
        memberMap.set(key, {
          _id: tm._id,
          name: tm.name,
          rollNo: tm.rollNo,
          branch: tm.branch,
          source: 'team-member'
        });
      }
    });

    const allMembers = Array.from(memberMap.values());
    res.status(200).json({ success: true, data: allMembers });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Add team member (Student only)
// @route   POST /api/team-members
exports.addTeamMember = async (req, res) => {
  try {
    const { name, rollNo, branch } = req.body;

    // Get student's batch
    const batch = await Batch.findOne({ leaderStudentId: req.user._id });
    if (!batch) {
      return res.status(404).json({ success: false, message: 'Create a batch first' });
    }

    const teamMember = await TeamMember.create({
      batchId: batch._id,
      name,
      rollNo,
      branch
    });

    res.status(201).json({ success: true, data: teamMember });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Update team member
// @route   PUT /api/team-members/:id
exports.updateTeamMember = async (req, res) => {
  try {
    const teamMember = await TeamMember.findById(req.params.id);
    
    if (!teamMember) {
      return res.status(404).json({ success: false, message: 'Team member not found' });
    }

    // Check if user is leader of this batch
    const batch = await Batch.findOne({ 
      _id: teamMember.batchId, 
      leaderStudentId: req.user._id 
    });
    
    if (!batch) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    const updatedMember = await TeamMember.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });

    res.status(200).json({ success: true, data: updatedMember });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Delete team member
// @route   DELETE /api/team-members/:id
exports.deleteTeamMember = async (req, res) => {
  try {
    const teamMember = await TeamMember.findById(req.params.id);
    
    if (!teamMember) {
      return res.status(404).json({ success: false, message: 'Team member not found' });
    }

    // Check if user is leader of this batch
    const batch = await Batch.findOne({ 
      _id: teamMember.batchId, 
      leaderStudentId: req.user._id 
    });
    
    if (!batch) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    await TeamMember.findByIdAndDelete(req.params.id);
    res.status(200).json({ success: true, data: {} });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

