const mongoose = require('mongoose');
const Student = require('./models/Student');
const Batch = require('./models/Batch');

const MONGODB_URI = 'mongodb+srv://sravanthir0403_db_user:3oeeDsTQdjqWWECk@cluster0.sofydu4.mongodb.net/mini_project_db';

async function verify() {
    try {
        await mongoose.connect(MONGODB_URI);
        console.log('Connected to MongoDB');

        const batches = await Batch.find();
        console.log(`Found ${batches.length} batches`);

        for (const batch of batches) {
            const students = await Student.find({ batchId: batch._id });
            console.log(`Batch: ${batch.teamName} | Students Found: ${students.length}`);
            if (students.length > 0) {
                console.log(' - Member Names:', students.map(s => s.name).join(', '));
            } else {
                console.log(' - No students found with this batchId');
            }
        }

        mongoose.disconnect();
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
}

verify();
