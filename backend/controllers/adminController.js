const COE = require('../models/COE');
const ProblemStatement = require('../models/ProblemStatement');
const Guide = require('../models/Guide');
const Batch = require('../models/Batch');
const Student = require('../models/Student');
const Admin = require('../models/Admin');
const TeamMember = require('../models/TeamMember');

// @desc    Get admin dashboard stats
// @route   GET /api/admin/dashboard
exports.getDashboard = async (req, res) => {
  try {
    const totalCOEs = await COE.countDocuments();
    const totalProblems = await ProblemStatement.countDocuments();
    const totalGuides = await Guide.countDocuments();
    const totalBatches = await Batch.countDocuments();
    const totalStudents = await Student.countDocuments();

    const batchesByStatus = await Batch.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 } } }
    ]);

    res.status(200).json({
      success: true,
      data: {
        totalCOEs,
        totalProblems,
        totalGuides,
        totalBatches,
        totalStudents,
        batchesByStatus
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get all data for admin overview
// @route   GET /api/admin/overview
exports.getOverview = async (req, res) => {
  try {
    const coes = await COE.find();

    const problems = await ProblemStatement.find()
      .populate('coeId', 'name')
      .populate('guideId', 'name email assignedBatches maxBatches');

    const guides = await Guide.find().select('-password');

    const batches = await Batch.find()
      .populate('leaderStudentId', 'name email')
      .populate('problemId', 'title')
      .populate('guideId', 'name email');

    res.status(200).json({
      success: true,
      data: { coes, problems, guides, batches }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Create admin (Initial setup)
// @route   POST /api/admin/create
exports.createAdmin = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    const existingAdmin = await Admin.findOne({ email });
    if (existingAdmin) {
      return res.status(400).json({ success: false, message: 'Admin already exists' });
    }

    const admin = await Admin.create({ name, email, password });
    res.status(201).json({
      success: true,
      data: { id: admin._id, name: admin.name, email: admin.email, role: 'admin' }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get batch-guide mapping
// @route   GET /api/admin/batch-guide-mapping
exports.getBatchGuideMapping = async (req, res) => {
  try {
    const batches = await Batch.find({ guideId: { $ne: null } })
      .populate('leaderStudentId', 'name email')
      .populate('problemId', 'title')
      .populate('guideId', 'name email');

    const guides = await Guide.find().select('-password');

    const mapping = guides.map(guide => ({
      guide: { id: guide._id, name: guide.name, email: guide.email },
      assignedBatches: guide.assignedBatches,
      maxBatches: guide.maxBatches,
      batches: batches.filter(b => b.guideId && b.guideId._id.toString() === guide._id.toString())
    }));

    res.status(200).json({ success: true, data: mapping });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Import student batches from Excel data
// @route   POST /api/admin/import-batches
exports.importBatches = async (req, res) => {
  try {
    const { batches } = req.body;

    if (!batches || !Array.isArray(batches)) {
      return res.status(400).json({ success: false, message: 'Invalid batches data' });
    }

    const results = {
      success: 0,
      failed: 0,
      errors: []
    };

    for (const batchData of batches) {
      try {
        let { teamName, members, year, branch, section } = batchData;

        if (!teamName || !members || !members.length || !year || !branch || !section) {
          throw new Error(`Missing required fields for team: ${teamName || 'Unknown'}`);
        }

        teamName = teamName.trim();

        // 1. Process members and create students if needed
        const studentIds = [];
        for (const member of members) {
          let student = await Student.findOne({ rollNumber: member.rollNo });

          // Default password: team_name@123
          const password = `${teamName}@123`;

          if (!student) {
            // Generate a default email if not provided
            const email = `${member.rollNo.toLowerCase()}@gmail.com`;

            student = await Student.create({
              name: member.name,
              rollNumber: member.rollNo,
              email,
              password,
              year,
              branch,
              section
            });
          } else {
            // Update password for existing student to match import default
            student.password = password;
            // Also update other info to be safe
            student.year = year;
            student.branch = branch;
            student.section = section;
            await student.save();
          }
          studentIds.push(student._id);
        }

        // 2. Create Batch
        // Use the first member as leader
        const leaderStudentId = studentIds[0];

        // Check if a batch already exists for this leader
        let batch = await Batch.findOne({ leaderStudentId });
        if (batch) {
          throw new Error(`Batch already exists for leader: ${members[0].rollNo}`);
        }

        batch = await Batch.create({
          leaderStudentId,
          teamName,
          year,
          branch,
          section
        });

        // 3. Create TeamMembers
        for (let i = 0; i < members.length; i++) {
          await TeamMember.create({
            batchId: batch._id,
            name: members[i].name,
            rollNo: members[i].rollNo,
            branch: branch // Use team branch
          });
        }

        // 4. Update students with batchId (Crucial for consistency)
        for (const studentId of studentIds) {
          await Student.findByIdAndUpdate(studentId, { batchId: batch._id });
        }

        results.success++;
      } catch (err) {
        results.failed++;
        results.errors.push({
          team: batchData.teamName || 'Unknown',
          error: err.message
        });
      }
    }

    res.status(200).json({
      success: true,
      data: results,
      message: `Import completed: ${results.success} succeeded, ${results.failed} failed`
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Import batches with students from Excel file
// @route   POST /api/admin/import-batch-data
exports.importBatchData = async (req, res) => {
  try {
    const XLSX = require('xlsx');
    const RC = require('../models/RC');

    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No file provided' });
    }

    const workbook = XLSX.read(req.file.buffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const data = XLSX.utils.sheet_to_json(worksheet);

    const results = { success: 0, failed: 0, errors: [], batchCount: 0, studentCount: 0, coeCreated: 0, rcCreated: 0 };

    // Group data by batch ID with fill-down logic for merged cells
    const batchGroups = {};
    let lastProjId = '';

    for (const row of data) {
      // Check multiple common column names
      let projId = row['Proj ID/Batch'] || row['Batch'] || row['Batch/Team'] || row['Team'] || '';

      // Fill down if empty but we have student data (implies merged cell)
      if (!projId && lastProjId && (row['Roll Number'] || row['Student Name'])) {
        projId = lastProjId;
      }

      if (projId) {
        lastProjId = projId; // Update last seen ID

        if (!batchGroups[projId]) {
          batchGroups[projId] = [];
        }
        batchGroups[projId].push(row);
      }
    }

    // Process each batch
    for (const [projId, batchRows] of Object.entries(batchGroups)) {
      try {
        // Get batch details from first row
        const firstRow = batchRows[0];
        const guideName = firstRow['Internal Guide'] || firstRow['Guide'] || '';
        const projectTitle = firstRow['Project Title'] || firstRow['Project'] || '';
        const researchArea = firstRow['Research Area'] || firstRow['research area'] || firstRow['researchArea'] || '';

        // Collect possible COE/RC values from header-insensitive keys
        let coeName = '';
        let rcName = '';
        for (const key of Object.keys(firstRow)) {
          const keyLower = key.toLowerCase().trim();
          const val = firstRow[key];
          if (!val) continue;
          if (/(^|\b)coe(\b|$)|center.*excellence|centre.*excellence/i.test(keyLower)) {
            coeName = val;
          }
          if (/(^|\b)rc(\b|$)|resource coordinator|resource center|research center|research centre/i.test(keyLower)) {
            rcName = val;
          }
          // If header ambiguous (e.g. column named "COE/RC"), still capture both candidates
          if (!coeName && /(coe|center)/i.test(keyLower) && !rcName) coeName = val;
          if (!rcName && /(rc|resource|research)/i.test(keyLower) && !coeName) rcName = val;
        }

        const teamName = projId;

        // Helper to extract proper name from a cell value
        const extractNameFromCell = (cell, type) => {
          if (!cell) return '';
          let str = String(cell).trim();

          // Remove common prefixes
          str = str.replace(/^gnits\s*,\s*/i, '');
          str = str.replace(/^(?:center of excellence|centre of excellence|coe|research center|research centre|resource center|resource centre|rc)[-:\s]*/i, '');

          return str.trim();
        };

        // Improved content-based correction and segregation
        const isRCContent = (val) => /(?:\brc\b|resource coordinator|resource center|research center|research centre|\brc[-])/i.test(String(val));
        const isCOEContent = (val) => /(?:\bcoe\b|center of excellence|centre of excellence)/i.test(String(val));

        // Case 1: Both are set
        if (coeName && rcName) {
          // If coeName actually looks like RC content and rcName doesn't
          if (isRCContent(coeName) && !isRCContent(rcName)) {
            rcName = coeName;
            coeName = '';
          }
          // If they are the same value, prioritize RC if it looks like RC, otherwise COE
          else if (coeName.trim() === rcName.trim()) {
            if (isRCContent(coeName)) {
              coeName = '';
            } else {
              rcName = '';
            }
          }
        }

        // Case 2: Only coeName set but looks like RC
        if (coeName && !rcName && isRCContent(coeName)) {
          rcName = coeName;
          coeName = '';
        }

        // Case 3: Only rcName set but looks like COE
        if (rcName && !coeName && isCOEContent(rcName)) {
          coeName = rcName;
          rcName = '';
        }

        // Final cleanup of names
        if (coeName) coeName = extractNameFromCell(coeName, 'coe');
        if (rcName) rcName = extractNameFromCell(rcName, 'rc');

        if (!guideName || !projectTitle) {
          results.errors.push({
            batch: projId,
            error: 'Missing Internal Guide or Project Title'
          });
          results.failed += batchRows.length;
          continue;
        }

        // Find or create guide - use case-insensitive name search
        let guide = await Guide.findOne({
          name: { $regex: `^${guideName}$`, $options: 'i' }
        });

        if (!guide) {
          try {
            // Generate unique email using timestamp to avoid duplicates
            const emailBase = guideName.toLowerCase().replace(/[^a-z0-9]/g, '');
            const uniqueEmail = `${emailBase}${Date.now()}@guide.gnits.ac.in`;

            guide = await Guide.create({
              name: guideName,
              email: uniqueEmail,
              password: 'defaultPassword123',
              role: 'guide'
            });
          } catch (err) {
            // If creation fails, try finding again (in case it was created by another request)
            guide = await Guide.findOne({
              name: { $regex: `^${guideName}$`, $options: 'i' }
            });

            if (!guide) {
              // Still not found after creation attempt, skip this batch
              results.errors.push({
                batch: projId,
                error: `Could not find or create guide "${guideName}"`
              });
              results.failed += batchRows.length;
              continue;
            }
          }
        }

        // Auto-create COE if it doesn't exist
        let coeId = null;
        if (coeName && coeName.trim() !== '') {
          let coe = await COE.findOne({
            name: { $regex: `^${coeName.trim()}$`, $options: 'i' }
          });

          if (!coe) {
            try {
              coe = await COE.create({
                name: coeName.trim(),
                description: `Auto-created from Excel import - Project: ${projectTitle}`
              });
              results.coeCreated++;
              console.log(`[Import] Created new COE: ${coeName}`);
            } catch (err) {
              console.error(`[Import] Failed to create COE "${coeName}":`, err.message);
            }
          }
          coeId = coe?._id;
        }

        // Auto-create RC if it doesn't exist
        let rcId = null;
        if (rcName && rcName.trim() !== '') {
          let rc = await RC.findOne({
            name: { $regex: `^${rcName.trim()}$`, $options: 'i' }
          });

          if (!rc) {
            try {
              rc = await RC.create({
                name: rcName.trim(),
                description: `Auto-created from Excel import - Project: ${projectTitle}`
              });
              results.rcCreated++;
              console.log(`[Import] Created new RC: ${rcName}`);
            } catch (err) {
              console.error(`[Import] Failed to create RC "${rcName}":`, err.message);
            }
          }
          rcId = rc?._id;
        }

        // Process students in this batch first to create leader
        const studentIds = [];
        let leaderStudentId = null;

        for (const row of batchRows) {
          try {
            const rollNumber = row['Roll Number'] || '';
            const studentName = row['Student Name'] || '';

            if (!rollNumber || !studentName) {
              results.errors.push({
                batch: projId,
                student: studentName || rollNumber,
                error: 'Missing Roll Number or Student Name'
              });
              results.failed++;
              continue;
            }

            // Check if student already exists
            let student = await Student.findOne({ rollNumber: rollNumber });

            if (!student) {
              // Create new student with all required fields
              student = await Student.create({
                name: studentName,
                email: `${rollNumber}@student.gnits.ac.in`,
                rollNumber: rollNumber,
                password: rollNumber, // Use roll number as default password
                year: '2nd',
                branch: 'CSE',
                section: 'A',
                role: 'student'
              });
            }

            studentIds.push(student._id);

            // Set first student as leader for this batch
            if (!leaderStudentId) {
              leaderStudentId = student._id;
            }

            results.studentCount++;
            results.success++;
          } catch (err) {
            results.errors.push({
              batch: projId,
              student: row['Student Name'],
              error: err.message
            });
            results.failed++;
          }
        }

        // Create batch with leader student and COE/RC information
        if (leaderStudentId && studentIds.length > 0) {
          let batch = await Batch.findOne({ teamName: teamName });

          if (!batch) {
            // Build batch data object conditionally
            const batchData = {
              leaderStudentId: leaderStudentId,
              teamName: teamName,
              guideId: guide._id,
              year: '2nd',
              branch: 'CSE',
              section: 'A',
              status: 'Not Started',
              allotmentStatus: 'none',
              researchArea: researchArea && researchArea.trim() ? researchArea.trim() : ''
            };

            // Only add COE if coeName exists
            if (coeName && coeName.trim()) {
              batchData.coeId = coeId || null;
              batchData.coe = {
                name: coeName.trim(),
                coeId: coeId
              };
            }

            // Only add RC if rcName exists
            if (rcName && rcName.trim()) {
              batchData.rcId = rcId || null;
              batchData.rc = {
                name: rcName.trim(),
                rcId: rcId
              };
            }

            batch = await Batch.create(batchData);
            results.batchCount++;
          } else {
            // Update existing batch with COE/RC info if not already set
            if ((coeName || rcName) && !batch.coe && !batch.rc) {
              if (coeName && coeName.trim()) {
                batch.coeId = coeId || batch.coeId;
                batch.coe = { name: coeName.trim(), coeId: coeId };
              }
              if (rcName && rcName.trim()) {
                batch.rcId = rcId || batch.rcId;
                batch.rc = { name: rcName.trim(), rcId: rcId };
              }
              await batch.save();
            }
          }

          // Update all students with batch ID
          for (const studentId of studentIds) {
            const updatedStudent = await Student.findByIdAndUpdate(studentId, { batchId: batch._id }, { new: true });

            // Check if TeamMember exists
            const existingMember = await TeamMember.findOne({ rollNo: updatedStudent.rollNumber });
            if (!existingMember) {
              await TeamMember.create({
                batchId: batch._id,
                name: updatedStudent.name,
                rollNo: updatedStudent.rollNumber,
                branch: updatedStudent.branch || 'CSE' // Default if missing
              });
            } else {
              // Update existing member if needed
              existingMember.batchId = batch._id;
              existingMember.name = updatedStudent.name;
              existingMember.branch = updatedStudent.branch || existingMember.branch;
              await existingMember.save();
            }
          }
        }
      } catch (err) {
        results.errors.push({
          batch: projId,
          error: err.message
        });
        results.failed += batchRows.length;
      }
    }

    res.status(200).json({
      success: true,
      data: results,
      message: `Import completed: ${results.batchCount} batches, ${results.studentCount} students, ${results.coeCreated} COEs created, ${results.rcCreated} RCs created (${results.success} succeeded, ${results.failed} failed)`
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Search batches by guide name or problem title
// @route   GET /api/admin/search-batches-by-guide
exports.searchBatchesByGuide = async (req, res) => {
  try {
    const { guideName, type = 'all' } = req.query; // 'guideName' is the query term

    console.log('[API] searchBatchesByGuide Params:', req.query); // DEBUG LOG

    const Problem = require('../models/ProblemStatement');
    const COE = require('../models/COE');
    const RC = require('../models/RC');

    if (!guideName || guideName.trim() === '') {
      return res.status(400).json({ success: false, message: 'Search term is required' });
    }

    const searchRegex = { $regex: guideName.trim(), $options: 'i' };
    const searchString = guideName.trim().toLowerCase();

    console.log('[Search] Input:', guideName.trim());
    console.log('[Search] Regex pattern will match: ' + guideName.trim() + ' (case-insensitive)');

    let guides = [];
    let guideIds = [];
    let coeIds = [];
    let rcIds = [];
    let problemIds = [];

    // 1. Search Guides
    if (type === 'all' || type === 'guide') {
      guides = await Guide.find({ name: searchRegex });
      guideIds = guides.map(g => g._id);
    }

    // 2. Search COEs - also search by partial match
    if (type === 'all' || type === 'coe') {
      const coes = await COE.find({ name: searchRegex });
      coeIds = coes.map(c => c._id);
      console.log(`[Search] COEs found with regex: ${coeIds.length}`);
    }

    // 2b. Search RCs (Resource Coordinators) - also search by partial match
    if (type === 'all' || type === 'coe') {
      const rcs = await RC.find({ name: searchRegex });
      rcIds = rcs.map(r => r._id);
      console.log(`[Search] RCs found with regex: ${rcIds.length}`);
    }

    // 3. Search Problems
    const problemQuery = [];
    if (type === 'all' || type === 'problem') problemQuery.push({ title: searchRegex });
    if (type === 'all' || type === 'research') problemQuery.push({ researchArea: searchRegex });
    // If searching by COE, find problems linked to those COEs
    if (coeIds.length > 0) problemQuery.push({ coeId: { $in: coeIds } });

    if (problemQuery.length > 0) {
      const problems = await Problem.find({ $or: problemQuery });
      problemIds = problems.map(p => p._id);
    }

    // 4. Find Batches matching specific criteria
    let batchQuery = [];
    if (guideIds.length > 0) batchQuery.push({ guideId: { $in: guideIds } });
    if (problemIds.length > 0) batchQuery.push({ problemId: { $in: problemIds } });
    if (coeIds.length > 0) batchQuery.push({ coeId: { $in: coeIds } });
    // Also search by COE name field directly for robustness
    if (type === 'all' || type === 'coe') {
      batchQuery.push({ 'coe.name': searchRegex });
    }
    // Add search by RC ID and RC name field
    if (rcIds.length > 0) {
      batchQuery.push({ 'rc.rcId': { $in: rcIds } });
    }
    // Also search by RC name directly for robustness
    if (type === 'all' || type === 'coe') {
      batchQuery.push({ 'rc.name': searchRegex });
      console.log(`[Search] Added RC name query for regex: ${guideName.trim()}`);
    }

    console.log(`[Search] Query: "${guideName}", Type: "${type}"`);
    console.log(`[Search] Found: Guides=${guideIds.length}, Problems=${problemIds.length}, COEs=${coeIds.length}, RCs=${rcIds.length}`);
    console.log(`[Search] Batch query conditions count: ${batchQuery.length}`);
    console.log(`[Search] Batch query being used:`, JSON.stringify(batchQuery, null, 2));

    let batches = [];
    if (batchQuery.length > 0) {
      console.log(`[Search] Executing find query with ${batchQuery.length} conditions...`);
      batches = await Batch.find({ $or: batchQuery })
        .populate('guideId', 'name email')
        .populate('coeId', 'name')
        .lean();

      console.log(`[Search] Raw query result: ${batches.length} batches found`);
      if (batches.length > 0) {
        console.log(`[Search] Sample batch RC data:`, batches[0].rc);
      }

      // Deduplicate batches by ID
      const batchMap = new Map();
      batches.forEach(batch => {
        if (!batchMap.has(batch._id.toString())) {
          batchMap.set(batch._id.toString(), batch);
        }
      });
      batches = Array.from(batchMap.values());
    }

    console.log(`[Search] Batches found after dedup: ${batches.length}`);

    if (batches.length === 0) {
      return res.status(404).json({
        success: false,
        message: `No batches found for "${guideName}"`
      });
    }

    // Determine what to show as the "Header Name"
    let displayHeader = 'Search Results';
    let primaryGuide = null;

    if ((type === 'all' || type === 'guide') && guides.length > 0) {
      primaryGuide = guides[0];
      displayHeader = primaryGuide.name;
    } else if (batches[0]?.guideId && type === 'all' && guides.length === 0) {
      // Fallback for "All" search if it matched a problem but not a guide name directly
      primaryGuide = batches[0].guideId;
      displayHeader = primaryGuide.name;
    } else {
      // For COE/Research/Problem search, use the search term itself as header
      displayHeader = `Results for "${guideName}"`;
    }

    // Get students for each batch
    const batchesWithStudents = await Promise.all(
      batches.map(async (batch) => {
        const students = await Student.find({ batchId: batch._id }).select('name rollNumber');
        const leader = await Student.findById(batch.leaderStudentId).select('name rollNumber');
        const problem = await Problem.findById(batch.problemId).select('title');

        const problemDetailed = await Problem.findById(batch.problemId).populate('coeId', 'name').lean();

        // Gather COE Name
        let coeName = 'N/A';
        if (problemDetailed?.coeId?.name) {
          coeName = problemDetailed.coeId.name;
        } else if (batch.coe?.name && batch.coe.name !== '--' && batch.coe.name !== 'N/A') {
          coeName = batch.coe.name;
        } else if (batch.coeId) {
          try {
            const COE = require('../models/COE');
            const coeDoc = await COE.findById(batch.coeId).select('name');
            if (coeDoc) coeName = coeDoc.name;
          } catch (e) { }
        }

        // Gather Research Area
        let researchArea = 'N/A';
        if (problemDetailed?.researchArea) {
          researchArea = problemDetailed.researchArea;
        } else if (batch.researchArea && batch.researchArea !== '--' && batch.researchArea !== 'N/A') {
          researchArea = batch.researchArea;
        }

        // Handle RC lookup
        let rcName = 'N/A';
        if (batch.rc?.name && batch.rc.name !== '--' && batch.rc.name !== 'N/A') {
          rcName = batch.rc.name;
        } else if (batch.rc?.rcId) {
          try {
            const RC = require('../models/RC');
            const rcDoc = await RC.findById(batch.rc.rcId).select('name');
            if (rcDoc) rcName = rcDoc.name;
          } catch (err) {
            console.warn('Failed to fetch RC:', err.message);
          }
        }

        return {
          _id: batch._id,
          batchId: batch.batchId,
          teamName: batch.teamName,
          year: batch.year,
          branch: batch.branch,
          section: batch.section,
          status: batch.status,
          leaderStudent: leader,
          students: students,
          studentCount: students.length,
          guideName: batch.guideId?.name || 'N/A',
          projectTitle: problemDetailed?.title || 'N/A',
          researchArea: researchArea,
          coe: coeName,
          rc: rcName
        };
      })
    );

    res.status(200).json({
      success: true,
      data: {
        guide: {
          id: primaryGuide?._id,
          name: displayHeader // Use the smart header we calculated
        },
        batches: batchesWithStudents,
        totalBatches: batchesWithStudents.length,
        totalStudents: batchesWithStudents.reduce((sum, batch) => sum + (batch.students?.length || 0), 0)
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }

};

// @desc    Fix COE/RC classification for batches
// @route   POST /api/admin/fix-coe-rc-classification
exports.fixCOEandRCClassification = async (req, res) => {
  try {
    const RC = require('../models/RC');
    const COE = require('../models/COE');
    const rcNames = ['Cloud Computing', 'Data Analytics'];
    const results = { updated: 0, errors: [] };

    for (const batchName of rcNames) {
      try {
        // Find RC by name
        const rc = await RC.findOne({
          name: { $regex: `^${batchName}$`, $options: 'i' }
        });

        if (!rc) {
          results.errors.push(`RC "${batchName}" not found`);
          continue;
        }

        // Find all batches that have this name in their coe field
        const batches = await Batch.find({
          'coe.name': { $regex: `^${batchName}$`, $options: 'i' }
        });

        // Move each batch from COE to RC
        for (const batch of batches) {
          try {
            // Store the COE name if it exists
            const oldCoeName = batch.coe?.name;

            // Clear COE reference
            batch.coe = { name: '', coeId: null };
            batch.coeId = null;

            // Set RC reference
            batch.rc = { name: batchName, rcId: rc._id };

            await batch.save();
            results.updated++;
            console.log(`[Fix] Moved batch "${batch.teamName}" from COE "${oldCoeName}" to RC "${batchName}"`);
          } catch (err) {
            results.errors.push(`Failed to update batch ${batch.teamName}: ${err.message}`);
          }
        }
      } catch (err) {
        results.errors.push(`Error processing RC "${batchName}": ${err.message}`);
      }
    }

    // Also handle "--" entries to move them to unassigned
    try {
      const unassignedBatches = await Batch.find({
        'rc.name': '--'
      });

      for (const batch of unassignedBatches) {
        try {
          batch.rc = { name: '', rcId: null };
          batch.coe = { name: '', coeId: null };
          batch.coeId = null;
          await batch.save();
          results.updated++;
          console.log(`[Fix] Moved batch "${batch.teamName}" to unassigned (removed "--")`);
        } catch (err) {
          results.errors.push(`Failed to unassign batch ${batch.teamName}: ${err.message}`);
        }
      }
    } catch (err) {
      results.errors.push(`Error handling unassigned batches: ${err.message}`);
    }

    res.status(200).json({
      success: true,
      data: results,
      message: `Fixed ${results.updated} batches. ${results.errors.length} errors occurred.`
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
