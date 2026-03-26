const mongoose = require('mongoose');
const Student = require('./models/Student');
const Batch = require('./models/Batch');

const MONGODB_URI = 'mongodb+srv://sravanthir0403_db_user:3oeeDsTQdjqWWECk@cluster0.sofydu4.mongodb.net/mini_project_db';

async function checkStudents() {
    try {
        await mongoose.connect(MONGODB_URI);
        console.log('Connected to MongoDB');

        const namesToCheck = [
            'Vavilala Rakshitha',
            'Gaddam Prathyusha',
            'Gande Charishma',
            'G. Tharunya Varma'
        ];

        console.log('--- Checking Students ---');
        for (const name of namesToCheck) {
            // RegExp for partial case-insensitive match
            const student = await Student.findOne({ name: { $regex: new RegExp(name, 'i') } });
            if (student) {
                console.log(`FOUND: ${student.name} | Roll: ${student.rollNumber} | BatchId: ${student.batchId}`);
                if (student.batchId) {
                    const batch = await Batch.findById(student.batchId);
                    console.log(`   -> Linked to Batch: ${batch ? batch.teamName : 'INVALID_ID'}`);
                }
            } else {
                console.log(`MISSING: ${name}`);
            }
        }

        console.log('\n--- Checking Batch A6 ---');
        const batchA6 = await Batch.findOne({ teamName: 'A6' });
        if (batchA6) {
            console.log(`Batch A6 ID: ${batchA6._id}`);
            const members = await Student.find({ batchId: batchA6._id });
            console.log(`Members linked to A6: ${members.length}`);
            members.forEach(m => console.log(` - ${m.name} (${m.rollNumber})`));
        } else {
            console.log('Batch A6 not found.');
        }

        mongoose.disconnect();
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
}

checkStudents();
