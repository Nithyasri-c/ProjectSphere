const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');
const COE = require('./models/COE');

const Batch = require('./models/Batch');
const ProblemStatement = require('./models/ProblemStatement');

// Load env vars
dotenv.config();

const cleanup = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/project-sphere');
    console.log('MongoDB Connected...');

    // Find COEs that have the specific description pattern from automatic import
    const coesToDelete = await COE.find({
      description: { $regex: /^Center of Excellence: / }
    });

    const coeIds = coesToDelete.map(c => c._id);
    console.log(`Found ${coeIds.length} automatically created COEs to delete.`);

    if (coeIds.length > 0) {
      // 1. Update Batches to remove reference to these COEs
      const batchResult = await Batch.updateMany(
        { coeId: { $in: coeIds } },
        { $set: { coeId: null } }
      );
      console.log(`Updated ${batchResult.modifiedCount} batches to remove COE references.`);

      // 2. Update ProblemStatements to remove reference to these COEs
      const problemResult = await ProblemStatement.updateMany(
        { coeId: { $in: coeIds } },
        { $set: { coeId: null } }
      );
      console.log(`Updated ${problemResult.modifiedCount} problem statements to remove COE references.`);

      // 3. Delete the COEs
      const deleteResult = await COE.deleteMany({
        _id: { $in: coeIds }
      });
      console.log(`Successfully deleted ${deleteResult.deletedCount} COEs.`);
    }
    
    process.exit(0);
  } catch (error) {
    console.error('Error during cleanup:', error);
    process.exit(1);
  }
};

cleanup();
