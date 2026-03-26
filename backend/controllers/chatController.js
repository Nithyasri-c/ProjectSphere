const Chat = require('../models/Chat');
const TeamMember = require('../models/TeamMember');
const Batch = require('../models/Batch');
const Guide = require('../models/Guide');
const ProjectEntry = require('../models/ProjectEntry');

// Get all chats for a guide (all batches and teams)
exports.getGuideChats = async (req, res) => {
  try {
    const guideId = req.user.id;
    const batchId = req.query.batchId;

    const query = { guideId };
    if (batchId) {
      query.batchId = batchId;
    }

    const chats = await Chat.find(query)
      .populate('batchId', 'batchName')
      .populate('teamMemberId', 'teamName membersCount')
      .sort({ updatedAt: -1 });

    res.status(200).json({
      success: true,
      count: chats.length,
      data: chats
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Get chat between student and guide for specific team (for both student and guide)
exports.getStudentChat = async (req, res) => {
  try {
    const { batchId, teamMemberId } = req.params;

    const chat = await Chat.findOne({
      batchId,
      teamMemberId
    }).populate('guideId', 'name email').populate('teamMemberId', 'teamName');

    if (!chat) {
      // Return empty chat structure if no chat exists yet
      return res.status(200).json({
        success: true,
        data: {
          batchId,
          teamMemberId,
          messages: [],
          readBy: []
        }
      });
    }

    res.status(200).json({
      success: true,
      data: chat
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Send message
exports.sendMessage = async (req, res) => {
  try {
    const { batchId, teamMemberId, text, fileUrl, fileName } = req.body;
    const senderId = req.user.id;
    const senderType = req.user.role;
    const senderName = req.user.name;

    let chat = await Chat.findOne({ batchId, teamMemberId });

    if (!chat) {
      // Create new chat
      let guideId;
      if (senderType === 'guide') {
        guideId = senderId;
      } else {
        // Find guide from batch
        const batch = await Batch.findById(batchId).select('guideId');
        guideId = batch.guideId;
      }

      // Try to find projectId from ProjectEntry
      let projectId = null;
      const projectEntry = await ProjectEntry.findOne({ batchId });
      if (projectEntry) {
        projectId = projectEntry.projectId;
      }

      chat = new Chat({
        batchId,
        teamMemberId,
        guideId,
        projectId,
        messages: []
      });
    }

    // Add message
    chat.messages.push({
      senderId,
      senderType,
      senderName,
      text: text || '',
      fileUrl: fileUrl || null,
      fileName: fileName || null,
      timestamp: new Date()
    });

    chat.updatedAt = new Date();
    await chat.save();

    res.status(201).json({
      success: true,
      message: 'Message sent successfully',
      data: chat
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Get all team chats for a batch (for guide)
exports.getBatchTeamChats = async (req, res) => {
  try {
    const guideId = req.user.id;
    const { batchId } = req.params;

    const chats = await Chat.find({ guideId, batchId })
      .populate('teamMemberId', 'teamName membersCount')
      .sort({ updatedAt: -1 });

    res.status(200).json({
      success: true,
      data: chats
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Get single chat details
exports.getChatDetails = async (req, res) => {
  try {
    const { chatId } = req.params;

    const chat = await Chat.findById(chatId)
      .populate('batchId', 'batchName')
      .populate('teamMemberId', 'teamName membersCount')
      .populate('guideId', 'name email');

    if (!chat) {
      return res.status(404).json({
        success: false,
        message: 'Chat not found'
      });
    }

    res.status(200).json({
      success: true,
      data: chat
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Get guide name and info for student
exports.getGuideInfo = async (req, res) => {
  try {
    const { batchId } = req.params;

    const batch = await Batch.findById(batchId).populate('guideId', 'name email');

    if (!batch) {
      return res.status(404).json({
        success: false,
        message: 'Batch not found'
      });
    }

    res.status(200).json({
      success: true,
      data: batch.guideId
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Mark chat as read
exports.markChatAsRead = async (req, res) => {
  try {
    const userId = req.user.id;
    const userRole = req.user.role;
    const { batchId, teamMemberId } = req.body;

    console.log('markChatAsRead - userId:', userId, 'userRole:', userRole);

    const chat = await Chat.findOne({ batchId, teamMemberId });

    if (!chat) {
      // If chat doesn't exist, create it first
      let guideId;
      if (userRole === 'guide') {
        guideId = userId;
      } else {
        const batch = await Batch.findById(batchId).select('guideId');
        guideId = batch.guideId;
      }

      const newChat = new Chat({
        batchId,
        teamMemberId,
        guideId,
        messages: [],
        readBy: [{
          userId,
          role: userRole,
          lastReadAt: new Date()
        }]
      });
      
      await newChat.save();

      return res.status(200).json({
        success: true,
        message: 'Chat marked as read',
        data: newChat
      });
    }

    // Find if user already marked as read
    const existingReadIndex = chat.readBy.findIndex(reader => {
      const readerUserId = reader.userId ? reader.userId.toString() : null;
      return readerUserId === userId;
    });

    console.log('markChatAsRead - existingReadIndex:', existingReadIndex);

    if (existingReadIndex === -1) {
      // User reading for first time
      chat.readBy.push({
        userId,
        role: userRole,
        lastReadAt: new Date()
      });
      console.log('markChatAsRead - Added new read record');
    } else {
      // Update the lastReadAt timestamp for existing user
      chat.readBy[existingReadIndex].lastReadAt = new Date();
      console.log('markChatAsRead - Updated read timestamp');
    }
    
    await chat.save();

    res.status(200).json({
      success: true,
      message: 'Chat marked as read',
      data: chat
    });
  } catch (error) {
    console.error('markChatAsRead error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Handle file uploads for chat
exports.uploadChatFile = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No file provided'
      });
    }

    const fileUrl = `/uploads/chat/${req.file.filename}`;

    res.status(200).json({
      success: true,
      fileUrl: fileUrl,
      fileName: req.file.originalname
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};
