const mongoose = require('mongoose');
const dotenv = require('dotenv');

dotenv.config();

// Import models
const TimelineEvent = require('./models/TimelineEvent');
const Admin = require('./models/Admin');

const seedTimeline = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('MongoDB Connected');

    // Get admin user
    const admin = await Admin.findOne({ email: 'admin@example.com' });
    if (!admin) {
      console.log('Admin not found. Run seed.js first');
      process.exit(1);
    }

    // Clear existing timeline events
    await TimelineEvent.deleteMany({});
    console.log('Cleared existing timeline events');

    // Create sample timeline events
    const events = [
      {
        title: 'Abstract Submission',
        description: 'Submit your project abstract (2-3 pages) outlining your project goals and approach',
        deadline: new Date('2025-02-15T23:59:59'),
        maxMarks: 10,
        submissionRequirements: 'PDF file, Maximum 3 pages, Include: Title, Objectives, Methodology, Expected Outcomes',
        targetYear: 'all',
        order: 1,
        isActive: true,
        createdBy: admin._id
      },
      {
        title: 'PRC-1 (Preliminary Review)',
        description: 'First phase review - Present initial design and architecture of your project',
        deadline: new Date('2025-03-15T23:59:59'),
        maxMarks: 25,
        submissionRequirements: 'Presentation slides, System architecture diagram, Tech stack documentation',
        targetYear: 'all',
        order: 2,
        isActive: true,
        createdBy: admin._id
      },
      {
        title: 'PRC-2 (Intermediate Review)',
        description: 'Mid-stage review - Demonstrate working prototype and progress',
        deadline: new Date('2025-04-15T23:59:59'),
        maxMarks: 25,
        submissionRequirements: 'Working prototype/code, Updated presentation, Progress report, Test cases',
        targetYear: 'all',
        order: 3,
        isActive: true,
        createdBy: admin._id
      },
      {
        title: 'Code and Documentation',
        description: 'Final code submission with complete documentation',
        deadline: new Date('2025-05-15T23:59:59'),
        maxMarks: 20,
        submissionRequirements: 'Source code, API documentation, User manual, Installation guide',
        targetYear: 'all',
        order: 4,
        isActive: true,
        createdBy: admin._id
      },
      {
        title: 'Final Presentation',
        description: 'Final project presentation and demonstration',
        deadline: new Date('2025-05-30T23:59:59'),
        maxMarks: 20,
        submissionRequirements: 'Presentation slides, Live demo, Q&A preparation',
        targetYear: 'all',
        order: 5,
        isActive: true,
        createdBy: admin._id
      }
    ];

    for (const event of events) {
      const existing = await TimelineEvent.findOne({ title: event.title });
      if (!existing) {
        await TimelineEvent.create(event);
        console.log(`Timeline event created: ${event.title}`);
      } else {
        console.log(`Timeline event already exists: ${event.title}`);
      }
    }

    console.log('\nTimeline seed completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Error seeding timeline:', error.message);
    process.exit(1);
  }
};

seedTimeline();
