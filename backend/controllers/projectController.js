const Project = require('../models/Project');
const Batch = require('../models/Batch');
const Student = require('../models/Student');
const Guide = require('../models/Guide');
const TeamMember = require('../models/TeamMember');
const COE = require('../models/COE');
const ProblemStatement = require('../models/ProblemStatement');
const { parseExcelFile, mergeRecords, validateRecord } = require('../utils/excelParser');


/**
 * @desc    Import projects from Excel files
 * @route   POST /api/projects/import
 * @access  Admin only
 */
exports.importExcelFiles = async (req, res) => {
    try {
        // Check if files are uploaded
        if (!req.files || req.files.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Please upload at least one Excel file'
            });
        }

        const results = {
            success: 0,
            failed: 0,
            errors: [],
            warnings: []
        };

        // Parse all uploaded Excel files
        const allRecords = [];

        for (let i = 0; i < req.files.length; i++) {
            const file = req.files[i];

            try {
                console.log(`Processing file ${i + 1}: ${file.originalname}`);
                const records = parseExcelFile(file.buffer);
                allRecords.push(records);
                console.log(`Extracted ${records.length} records from ${file.originalname}`);
            } catch (error) {
                results.errors.push({
                    file: file.originalname,
                    error: error.message
                });
            }
        }

        // Merge records from all files and remove duplicates
        const mergedRecords = mergeRecords(...allRecords);
        console.log(`Total unique records after merging: ${mergedRecords.length}`);

        // Process each record
        for (const record of mergedRecords) {
            try {
                // Validate record
                const validation = validateRecord(record);

                if (!validation.valid) {
                    results.failed++;
                    results.warnings.push({
                        teamName: record.teamName,
                        projectTitle: record.projectTitle,
                        errors: validation.errors
                    });
                    continue;
                }

                // Sync with Batch and Students
                // 1. Find or create Guide (with error handling for duplicates)
                let guide = null;
                if (record.guideName && record.guideName !== 'N/A') {
                    const email = record.guideName.toLowerCase().replace(/[^a-z0-9]/g, '') + '@gmail.com';

                    try {
                        guide = await Guide.findOneAndUpdate(
                            { email: email },
                            {
                                name: record.guideName,
                                email: email,
                                password: 'password123'
                            },
                            { upsert: true, new: true, setDefaultsOnInsert: true }
                        );
                    } catch (error) {
                        // Handle duplicate key error - guide already exists
                        if (error.code === 11000) {
                            console.log(`[Import] Guide already exists: ${email}, fetching...`);
                            guide = await Guide.findOne({ email: email });
                        } else {
                            throw error;
                        }
                    }
                }


                // 2. Find or create Students (optimized with parallel processing and error handling)
                const studentPromises = record.students.map(async (sName, j) => {
                    const sRoll = record.rollNumbers[j] || `TEMP_${record.teamName}_${j}`;
                    const email = sRoll.toLowerCase() + '@gmail.com';

                    try {
                        const student = await Student.findOneAndUpdate(
                            { rollNumber: sRoll },
                            {
                                name: sName,
                                email: email,
                                password: 'password123',
                                rollNumber: sRoll,
                                year: record.year || '4th',
                                branch: record.branch || 'CSE',
                                section: record.section || 'A'
                            },
                            { upsert: true, new: true, setDefaultsOnInsert: true }
                        );

                        return student._id;
                    } catch (error) {
                        // Handle duplicate key error - student already exists
                        if (error.code === 11000) {
                            console.log(`[Import] Student already exists: ${sRoll}, fetching...`);
                            const existingStudent = await Student.findOne({ rollNumber: sRoll });
                            return existingStudent._id;
                        } else {
                            throw error;
                        }
                    }
                });

                const studentIds = await Promise.all(studentPromises);

                // 3. Find or create COE
                let coe = null;
                if (record.coe && record.coe !== 'N/A') {
                    try {
                        coe = await COE.findOneAndUpdate(
                            { name: record.coe },
                            { name: record.coe, description: `Center of Excellence: ${record.coe}` },
                            { upsert: true, new: true, setDefaultsOnInsert: true }
                        );
                    } catch (error) {
                        console.error(`Error upserting COE: ${error.message}`);
                    }
                }

                // 4. Find or create ProblemStatement
                let problem = null;
                if (record.projectTitle && record.projectTitle !== 'N/A') {
                    try {
                        problem = await ProblemStatement.findOneAndUpdate(
                            { title: record.projectTitle },
                            {
                                title: record.projectTitle,
                                description: `Project: ${record.projectTitle}`,
                                researchArea: record.researchArea || 'N/A',
                                coeId: coe ? coe._id : null,
                                guideId: guide ? guide._id : null,
                                targetYear: record.year || '4th',
                                status: 'active'
                            },
                            { upsert: true, new: true, setDefaultsOnInsert: true }
                        );
                    } catch (error) {
                        if (error.code === 11000) {
                            problem = await ProblemStatement.findOne({ title: record.projectTitle });
                        } else {
                            console.error(`Error creating ProblemStatement: ${error.message}`);
                        }
                    }
                }

                // 5. Find or create Batch using BatchID as primary identifier
                const batchIdentifier = record.batchId && record.batchId !== 'N/A' ? record.batchId : record.teamName;
                let batch = await Batch.findOne({
                    $or: [
                        { batchId: batchIdentifier },
                        { teamName: batchIdentifier }
                    ]
                });

                // CRITICAL: If batch exists, unlink old members to prevent cumulative growth
                if (batch) {
                    console.log(`[Import] Refreshing members for batch: ${batch.batchId || batch.teamName}`);
                    await Student.updateMany({ batchId: batch._id }, { batchId: null });
                    await TeamMember.deleteMany({ batchId: batch._id });

                    // Update batch fields
                    if (record.batchId && record.batchId !== 'N/A') batch.batchId = record.batchId;
                    if (guide) batch.guideId = guide._id;
                    if (problem) batch.problemId = problem._id;
                    if (coe) batch.coeId = coe._id;
                    if (studentIds.length > 0) batch.leaderStudentId = studentIds[0];
                    if (record.year) batch.year = record.year;
                    if (record.branch) batch.branch = record.branch;
                    if (record.section) batch.section = record.section;
                    await batch.save();
                } else {
                    batch = await Batch.create({
                        batchId: record.batchId && record.batchId !== 'N/A' ? record.batchId : undefined,
                        teamName: record.teamName || batchIdentifier,
                        leaderStudentId: studentIds[0] || null,
                        guideId: guide ? guide._id : null,
                        problemId: problem ? problem._id : null,
                        coeId: coe ? coe._id : null,
                        year: record.year || '4th',
                        branch: record.branch || 'CSE',
                        section: record.section || 'A'
                    });
                }


                // 6. Link students to batch and create TeamMembers (optimized with parallel processing)
                if (batch) {
                    const linkingPromises = studentIds.map(async (sId) => {
                        const s = await Student.findByIdAndUpdate(sId, { batchId: batch._id }, { new: true });

                        await TeamMember.findOneAndUpdate(
                            { rollNo: s.rollNumber },
                            {
                                batchId: batch._id,
                                name: s.name,
                                rollNo: s.rollNumber,
                                branch: s.branch
                            },
                            { upsert: true }
                        );
                    });

                    await Promise.all(linkingPromises);
                }

                // Create or Update project (Deduplicate by batchId or teamName)
                const projectIdentifier = record.batchId && record.batchId !== 'N/A' ? record.batchId : record.teamName;
                let project = await Project.findOne({
                    $or: [
                        { batchId: projectIdentifier },
                        { teamName: projectIdentifier }
                    ]
                });

                if (project) {
                    // Update existing project
                    if (record.batchId && record.batchId !== 'N/A') project.batchId = record.batchId;
                    project.teamName = record.teamName || projectIdentifier;
                    project.students = record.students;
                    project.rollNumbers = record.rollNumbers || [];
                    project.guideName = record.guideName;
                    project.projectTitle = record.projectTitle !== 'N/A' ? record.projectTitle : project.projectTitle;
                    project.researchArea = record.researchArea || 'N/A';
                    project.coe = record.coe;
                    await project.save();
                } else {
                    // Create new project
                    await Project.create({
                        batchId: record.batchId || 'N/A',
                        teamName: record.teamName || projectIdentifier,
                        students: record.students,
                        rollNumbers: record.rollNumbers || [],
                        guideName: record.guideName,
                        projectTitle: record.projectTitle,
                        researchArea: record.researchArea || 'N/A',
                        coe: record.coe,
                        source: 'excel_import'
                    });
                }

                results.success++;
            } catch (error) {
                results.failed++;
                results.errors.push({
                    teamName: record.teamName,
                    projectTitle: record.projectTitle,
                    error: error.message
                });
            }
        }

        res.status(200).json({
            success: true,
            data: results,
            message: `Import completed: ${results.success} succeeded, ${results.failed} failed`
        });

    } catch (error) {
        console.error('Excel import error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to import Excel files',
            error: error.message
        });
    }
};

/**
 * @desc    Smart search projects by guide name or project title
 * @route   GET /api/projects/search?q=keyword
 * @access  Public
 */
exports.searchProjects = async (req, res) => {
    try {
        const { q, type = 'all' } = req.query;

        if (!q || q.trim() === '') {
            return res.status(400).json({
                success: false,
                message: 'Search query is required'
            });
        }

        const searchTerm = q.trim();
        const searchRegex = new RegExp(searchTerm, 'i');

        // Build restrictive query based on type
        let query = {};
        if (type === 'all') {
            query = {
                $or: [
                    { guideName: searchRegex },
                    { projectTitle: searchRegex },
                    { researchArea: searchRegex },
                    { coe: searchRegex }
                ]
            };
        } else if (type === 'guide') {
            query = { guideName: searchRegex };
        } else if (type === 'problem') {
            query = { projectTitle: searchRegex };
        } else if (type === 'research') {
            query = { researchArea: searchRegex };
        } else if (type === 'coe') {
            query = { coe: searchRegex };
        }

        const projects = await Project.find(query).sort({ createdAt: -1 });

        res.status(200).json({
            success: true,
            count: projects.length,
            data: projects
        });

    } catch (error) {
        console.error('Search error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to search projects',
            error: error.message
        });
    }
};

/**
 * @desc    Get all projects
 * @route   GET /api/projects
 * @access  Public
 */
exports.getAllProjects = async (req, res) => {
    try {
        const projects = await Project.find().sort({ createdAt: -1 });

        res.status(200).json({
            success: true,
            count: projects.length,
            data: projects
        });

    } catch (error) {
        console.error('Get projects error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get projects',
            error: error.message
        });
    }
};

/**
 * @desc    Delete all projects (for testing/reset)
 * @route   DELETE /api/projects/all
 * @access  Admin only
 */
exports.deleteAllProjects = async (req, res) => {
    try {
        const result = await Project.deleteMany({});

        res.status(200).json({
            success: true,
            message: `Deleted ${result.deletedCount} projects`
        });

    } catch (error) {
        console.error('Delete projects error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to delete projects',
            error: error.message
        });
    }
};

