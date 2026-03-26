const Chat = require('../models/Chat');
const DailyChatSummary = require('../models/DailyChatSummary');
const ProjectEntry = require('../models/ProjectEntry');

// @desc    Generate daily summaries for a project
// @route   POST /api/chat/summarize/:projectId
exports.generateProjectSummaries = async (req, res) => {
  try {
    const { projectId } = req.params;

    // 1. Find all chats for this project
    // We need to find the batchId(s) associated with this projectId
    const projectEntries = await ProjectEntry.find({ projectId });
    const batchIds = projectEntries.map(pe => pe.batchId);

    if (batchIds.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Project not found'
      });
    }

    // 2. Fetch all chats for these batches
    const chats = await Chat.find({ batchId: { $in: batchIds } });

    // 3. Group messages by date
    const messagesByDate = {};

    chats.forEach(chat => {
      chat.messages.forEach(msg => {
        const dateStr = msg.timestamp.toISOString().split('T')[0];
        if (!messagesByDate[dateStr]) {
          messagesByDate[dateStr] = [];
        }
        messagesByDate[dateStr].push(msg);
      });
    });

    const summariesCreated = [];

    // 4. Process each date
    for (const [dateStr, messages] of Object.entries(messagesByDate)) {
      const date = new Date(dateStr);
      
      // Check participation
      const hasGuide = messages.some(m => m.senderType === 'guide');
      const hasStudent = messages.some(m => m.senderType === 'student');

      if (hasGuide && hasStudent) {
        // AI Summary Generation (Simulated)
        const summaryText = await simulateAISummary(messages);

        // Save to DB
        try {
          const summary = await DailyChatSummary.findOneAndUpdate(
            { projectId, date },
            { 
              summary: summaryText,
              batchId: batchIds[0], // Use the first associated batch
              participation: {
                guideParticipated: true,
                studentParticipated: true
              }
            },
            { upsert: true, new: true }
          );
          summariesCreated.push(summary);
        } catch (err) {
          console.error(`Error saving summary for ${dateStr}:`, err.message);
        }
      }
    }

    res.status(200).json({
      success: true,
      count: summariesCreated.length,
      data: summariesCreated
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Get all summaries for a project
// @route   GET /api/chat/summaries/:projectId
exports.getProjectSummaries = async (req, res) => {
  try {
    const { projectId } = req.params;
    const summaries = await DailyChatSummary.find({ projectId }).sort({ date: -1 });

    res.status(200).json({
      success: true,
      data: summaries
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Generate daily summaries for a specific batch
// @route   POST /api/chat/summarize-batch/:batchId
exports.generateBatchSummaries = async (req, res) => {
  try {
    const { batchId } = req.params;

    // 1. Try to find if this batch is linked to a ProjectEntry
    const projectEntry = await ProjectEntry.findOne({ batchId });
    
    // Use projectId if available, otherwise fallback to batchId string
    const projectId = projectEntry ? projectEntry.projectId : `BATCH_${batchId}`;

    // 2. Fetch all chats for this batch
    const chats = await Chat.find({ batchId });

    if (chats.length === 0) {
      return res.status(200).json({
        success: true,
        count: 0,
        data: [],
        message: 'No chats found for this batch'
      });
    }

    // 3. Group messages by date
    const messagesByDate = {};
    chats.forEach(chat => {
      chat.messages.forEach(msg => {
        const dateStr = msg.timestamp.toISOString().split('T')[0];
        if (!messagesByDate[dateStr]) {
          messagesByDate[dateStr] = [];
        }
        messagesByDate[dateStr].push(msg);
      });
    });

    const summariesCreated = [];

    // 4. Process each date
    for (const [dateStr, messages] of Object.entries(messagesByDate)) {
      const date = new Date(dateStr);
      
      const hasGuide = messages.some(m => m.senderType === 'guide');
      const hasStudent = messages.some(m => m.senderType === 'student');

      if (hasGuide && hasStudent) {
        const summaryText = await simulateAISummary(messages);

        try {
          const summary = await DailyChatSummary.findOneAndUpdate(
            { projectId, date, batchId },
            { summary: summaryText, participation: { guideParticipated: true, studentParticipated: true } },
            { upsert: true, new: true }
          );
          summariesCreated.push(summary);
        } catch (err) {
          console.error(`Error saving summary for ${dateStr}:`, err.message);
        }
      }
    }

    res.status(200).json({
      success: true,
      count: summariesCreated.length,
      data: summariesCreated
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Get all summaries for a specific batch
// @route   GET /api/chat/summaries-batch/:batchId
exports.getBatchSummaries = async (req, res) => {
  try {
    const { batchId } = req.params;
    
    // Check if there's a projectId for this batch
    const projectEntry = await ProjectEntry.findOne({ batchId });
    const projectId = projectEntry ? projectEntry.projectId : `BATCH_${batchId}`;

    const summaries = await DailyChatSummary.find({ 
      $or: [
        { batchId },
        { projectId }
      ]
    }).sort({ date: -1 });

    res.status(200).json({
      success: true,
      data: summaries
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Simulated AI Summary function
async function simulateAISummary(messages) {
  if (!messages || messages.length === 0) return "No conversation data available for this day.";

  const allText = messages.map(m => m.text).join(' ').toLowerCase();

  // 1. Identify key topics
  const technicalKeywords = [
    'frontend', 'backend', 'database', 'api', 'model', 'dataset', 'ui', 'ux', 'deployment',
    'testing', 'authentication', 'login', 'react', 'node', 'express', 'mongodb', 'python',
    'deep learning', 'cnn', 'training', 'accuracy', 'flask', 'git', 'report', 'abstract'
  ];
  const foundTech = technicalKeywords.filter(k => allText.includes(k));

  // 2. Determine the "Intent" or "Nature" of the discussion
  const intents = {
    bug: ['error', 'bug', 'issue', 'failed', 'problem', 'not working', 'fix'],
    progress: ['completed', 'finished', 'done', 'updated', 'progress', 'ready'],
    planning: ['plan', 'roadmap', 'next step', 'meeting', 'schedule', 'discuss'],
    submission: ['submit', 'upload', 'report', 'abstract', 'document']
  };

  let activeIntents = Object.keys(intents).filter(intent => 
    intents[intent].some(keyword => allText.includes(keyword))
  );

  // 3. Construct a synthesized summary
  let summary = "Today's interaction involved a detailed technical review between the students and the guide. ";

  // Describe the focus
  if (foundTech.length > 0) {
    summary += `The conversation centered around the implementation and optimization of ${foundTech.slice(0, 3).join(', ')} functionalities. `;
  }

  // Describe student activity (without quoting)
  if (activeIntents.includes('bug')) {
    summary += "Students reported technical challenges and sought guidance on resolving specific implementation bottlenecks. ";
  } else if (activeIntents.includes('progress')) {
    summary += "The team presented their recent milestones and demonstrated the progress made on their current modules. ";
  } else if (activeIntents.includes('submission')) {
    summary += "The discussion focused on the preparation and refinement of project documentation and formal submissions. ";
  }

  // Describe guide feedback (without quoting)
  if (activeIntents.includes('bug') || activeIntents.includes('planning')) {
    summary += "The guide provided strategic advice, suggesting alternative approaches to overcome current roadblocks and ensure system stability. ";
  } else {
    summary += "The guide reviewed the work and offered suggestions for further enhancing the project's quality and alignment with the requirements. ";
  }

  // Final Outcome
  if (allText.includes('fixed') || allText.includes('resolved') || allText.includes('done')) {
    summary += "The session concluded successfully with the resolution of core issues, moving the project into its next phase.";
  } else {
    summary += "The session provided the team with clear actionable insights to refine their implementation in the coming days.";
  }

  return summary;
}
