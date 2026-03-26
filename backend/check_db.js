const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config();

const COE = require('./models/COE');
const RC = require('./models/RC');
const Batch = require('./models/Batch');

async function check() {
  try {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/project-sphere';
    console.log('Connecting to:', mongoUri);
    await mongoose.connect(mongoUri);
    console.log('Connected.');

    const coes = await COE.find();
    const rcs = await RC.find();
    const batches = await Batch.find();

    console.log(`\n--- COEs (${coes.length}) ---`);
    coes.forEach(c => console.log(`ID: ${c._id}, Name: "${c.name}"`));

    console.log(`\n--- RCs (${rcs.length}) ---`);
    rcs.forEach(r => console.log(`ID: ${r._id}, Name: "${r.name}"`));

    console.log(`\n--- Batches (${batches.length}) ---`);
    batches.slice(0, 10).forEach(b => {
      console.log(`Team: ${b.teamName}`);
      console.log(`  coeId: ${b.coeId}`);
      console.log(`  coe: ${JSON.stringify(b.coe)}`);
      console.log(`  rc: ${JSON.stringify(b.rc)}`);
    });

    // Check specifically for "Cloud Computing" or "Data Analytics"
    console.log('\n--- Specific Check ---');
    const specificBatches = batches.filter(b => 
      (b.coe?.name && (b.coe.name.includes('Cloud') || b.coe.name.includes('Data'))) ||
      (b.rc?.name && (b.rc.name.includes('Cloud') || b.rc.name.includes('Data')))
    );

    specificBatches.forEach(b => {
      console.log(`Team: ${b.teamName}`);
      console.log(`  coe: ${JSON.stringify(b.coe)}`);
      console.log(`  rc: ${JSON.stringify(b.rc)}`);
    });

    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

check();
