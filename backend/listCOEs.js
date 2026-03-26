const mongoose = require('mongoose');
const dotenv = require('dotenv');
const COE = require('./models/COE');

dotenv.config();

const listCOEs = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/project-sphere');
    const coes = await COE.find();
    console.log('Total COEs:', coes.length);
    coes.forEach(c => {
      console.log(`Name: "${c.name}", Description: "${c.description}"`);
    });
    process.exit(0);
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
};

listCOEs();
