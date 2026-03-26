const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const dotenv = require('dotenv');

dotenv.config();

// Import models
const Admin = require('./models/Admin');
const Guide = require('./models/Guide');
const COE = require('./models/COE');

const seedData = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('MongoDB Connected');

    // Create Admin
    const existingAdmin = await Admin.findOne({ email: 'admin@example.com' });
    if (!existingAdmin) {
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash('admin123', salt);
      
      await Admin.create({
        name: 'System Admin',
        email: 'admin@example.com',
        password: hashedPassword,
        department: 'Computer Science'
      });
      console.log('Admin created: admin@example.com / admin123');
    } else {
      console.log('Admin already exists');
    }

    // Create a sample Guide
    const existingGuide = await Guide.findOne({ email: 'guide@example.com' });
    if (!existingGuide) {
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash('guide123', salt);
      
      await Guide.create({
        name: 'Sample Guide',
        email: 'guide@example.com',
        password: hashedPassword,
        department: 'Computer Science',
        specialization: 'Web Development'
      });
      console.log('Guide created: guide@example.com / guide123');
    } else {
      console.log('Guide already exists');
    }

    // Clear existing COEs first
    await COE.deleteMany({});
    console.log('Cleared existing COEs');

    // Create sample COEs
    const coes = [
      { name: 'Deep Learning', description: 'Deep neural networks and advanced ML models' },
      { name: 'Data Analytics', description: 'Data analysis, visualization and insights' },
      { name: 'Assistive Technology', description: 'Technology for accessibility and assistance' },
      { name: 'AR-VR', description: 'Augmented Reality and Virtual Reality projects' },
      { name: 'IoT', description: 'Internet of Things and connected devices' },
      { name: 'Advanced AI', description: 'Cutting-edge artificial intelligence applications' },
      { name: 'Cloud Computing', description: 'Cloud infrastructure and distributed systems' }
    ];

    for (const coe of coes) {
      const existing = await COE.findOne({ name: coe.name });
      if (!existing) {
        await COE.create(coe);
        console.log(`COE created: ${coe.name}`);
      }
    }

    console.log('\nSeed completed successfully!');
    console.log('\nLogin Credentials:');
    console.log('Admin: admin@example.com / admin123');
    console.log('Guide: guide@example.com / guide123');
    
    process.exit(0);
  } catch (error) {
    console.error('Error seeding data:', error.message);
    process.exit(1);
  }
};

seedData();

