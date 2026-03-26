const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../backend/.env') });

const COESchema = new mongoose.Schema({ name: String });
const COE = mongoose.model('COE', COESchema, 'coes');

const ProblemStatementSchema = new mongoose.Schema({
    title: String,
    coeId: mongoose.Schema.Types.ObjectId,
    guideId: mongoose.Schema.Types.ObjectId
});
const ProblemStatement = mongoose.model('ProblemStatement', ProblemStatementSchema, 'problemstatements');

const BatchSchema = new mongoose.Schema({
    teamName: String,
    problemId: mongoose.Schema.Types.ObjectId,
    coeId: mongoose.Schema.Types.ObjectId,
    guideId: mongoose.Schema.Types.ObjectId
});
const Batch = mongoose.model('Batch', BatchSchema, 'batches');

async function debugData() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to MongoDB');

        const coes = await COE.find();
        console.log('\n--- COEs ---');
        console.log(JSON.stringify(coes, null, 2));

        const problems = await ProblemStatement.find();
        console.log('\n--- Problems ---');
        console.log(JSON.stringify(problems, null, 2));

        const batches = await Batch.find({ coeId: { $ne: null } });
        console.log('\n--- Batches with coeId ---');
        console.log(JSON.stringify(batches, null, 2));

        await mongoose.disconnect();
    } catch (err) {
        console.error(err);
    }
}

debugData();
