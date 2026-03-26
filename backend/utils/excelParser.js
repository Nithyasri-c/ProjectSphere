const XLSX = require('xlsx');

/**
 * Excel Parser Utility
 * Handles feature extraction and normalization from Excel files with different schemas
 */

/**
 * Column mapping patterns for intelligent field detection
 * Uses regex patterns to match various column name formats
 */
const COLUMN_PATTERNS = {
    batchId: /batch.*id|batchid|proj.*id|proj.*batch/i,
    teamName: /team|batch(?!.*id)|group|squad/i,
    students: /student.*name/i,
    rollNumbers: /roll.*no.*\(s\)|roll.*number|roll.*no|roll\s*no|htno/i,
    guideName: /name.*of.*the.*guide|guide.*name|name.*of.*guide|mentor|supervisor|faculty|advisor|\bguide\b/i,
    projectTitle: /project.*title|title/i,
    researchArea: /research.*thrust|thrust.*area|research.*area|domain|\barea\b/i,
    coe: /\bcoe\b|\brc\b|center.*excellence|center.*of.*excellence/i,
    year: /year|class.*year/i,
    branch: /branch|department|dept/i,
    section: /section|sec/i
};

/**
 * Normalize text field
 */
function normalizeText(text) {
    if (text === undefined || text === null) return '';
    return String(text).trim();
}

/**
 * Find column index by pattern matching
 */
function findColumnIndex(headers, pattern) {
    return headers.findIndex(header =>
        header && pattern.test(String(header))
    );
}

/**
 * Find all column indices matching a pattern
 */
function findAllColumnIndices(headers, pattern) {
    const indices = [];
    headers.forEach((header, index) => {
        if (header && pattern.test(String(header))) {
            indices.push(index);
        }
    });
    return indices;
}

/**
 * Extract COE name from cell value or header text
 * Example: "GNITS, COE-Deep Learning in Eye Disease Prognosis" => "Deep Learning in Eye Disease Prognosis"
 * Example: "Within GNITS, CoE-Advanced Research in AI" => "Advanced Research in AI"
 */
function extractCOENameFromText(text) {
    if (!text) return 'N/A';

    const str = String(text).trim();

    // Look for keywords followed by separators
    const keywordMatch = str.match(/(?:coe|rc|research\s+centre)[-\s:,]*(.+)$/i);

    if (keywordMatch && keywordMatch[1]) {
        return keywordMatch[1].trim();
    }

    // fallback: strip "GNITS, " prefix if present
    const cleaned = str.replace(/^gnits\s*,\s*/i, '');

    return cleaned || 'N/A';
}

/**
 * Parse Excel file and extract data
 */
function parseExcelFile(fileBuffer) {
    try {
        const workbook = XLSX.read(fileBuffer, { type: 'buffer' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];

        const jsonData = XLSX.utils.sheet_to_json(worksheet, {
            header: 1,
            defval: '',
            blankrows: false
        });

        if (jsonData.length < 2) {
            throw new Error('Excel file must have at least a header row and one data row');
        }

        const headers = jsonData[0].map(h => normalizeText(h));

        // Find column indices
        const batchIdIndex = findColumnIndex(headers, COLUMN_PATTERNS.batchId);
        const teamNameIndex = findColumnIndex(headers, COLUMN_PATTERNS.teamName);
        const guideNameIndex = findColumnIndex(headers, COLUMN_PATTERNS.guideName);
        const projectTitleIndex = findColumnIndex(headers, COLUMN_PATTERNS.projectTitle);
        const researchAreaIndex = findColumnIndex(headers, COLUMN_PATTERNS.researchArea);
        const coeIndex = findColumnIndex(headers, COLUMN_PATTERNS.coe);
        const yearIndex = findColumnIndex(headers, COLUMN_PATTERNS.year);
        const branchIndex = findColumnIndex(headers, COLUMN_PATTERNS.branch);
        const sectionIndex = findColumnIndex(headers, COLUMN_PATTERNS.section);

        // Find all student name and roll number columns
        const studentNameIndices = findAllColumnIndices(headers, COLUMN_PATTERNS.students);
        const rollNumberIndices = findAllColumnIndices(headers, COLUMN_PATTERNS.rollNumbers);

        console.log('[Parser] Headers from file:', headers);
        console.log('[Parser] Detected Column Mapping:', {
            batchId: batchIdIndex >= 0 ? `Matched '${headers[batchIdIndex]}'` : 'NOT FOUND',
            teamName: teamNameIndex >= 0 ? `Matched '${headers[teamNameIndex]}'` : 'NOT FOUND',
            guideName: guideNameIndex >= 0 ? `Matched '${headers[guideNameIndex]}'` : 'NOT FOUND',
            projectTitle: projectTitleIndex >= 0 ? `Matched '${headers[projectTitleIndex]}'` : 'NOT FOUND',
            researchArea: researchAreaIndex >= 0 ? `Matched '${headers[researchAreaIndex]}'` : 'NOT FOUND',
            coe: coeIndex >= 0 ? `Matched '${headers[coeIndex]}'` : 'NOT FOUND',
            students: studentNameIndices.map(idx => headers[idx]),
            rollNumbers: rollNumberIndices.map(idx => headers[idx])
        });

        // Group rows by BatchID (or team name as fallback)
        const batchGroups = {};
        let lastBatchId = '';
        let lastTeamName = '';
        let lastGuideName = '';
        let lastProjectTitle = '';
        let lastResearchArea = 'N/A';
        let lastCoe = 'N/A';
        let lastYear = '4th';
        let lastBranch = 'CSE';
        let lastSection = 'A';

        for (let i = 1; i < jsonData.length; i++) {
            const row = jsonData[i];

            // Skip empty rows
            if (!row || row.every(cell => !cell || String(cell).trim() === '')) {
                continue;
            }

            // Extract BatchID (primary identifier) and team name (fallback)
            let batchId = batchIdIndex >= 0 ? normalizeText(row[batchIdIndex]) : '';
            let teamName = teamNameIndex >= 0 ? normalizeText(row[teamNameIndex]) : '';

            // Extract all student names and roll numbers from multiple columns on this row
            const rowStudents = [];
            const rowRolls = [];

            studentNameIndices.forEach((idx, sIdx) => {
                const name = normalizeText(row[idx]);
                // Try to find matching roll number in the same relative position if multiple roll columns exist
                const rollIdx = rollNumberIndices[sIdx] !== undefined ? rollNumberIndices[sIdx] : (rollNumberIndices[0] || -1);
                const roll = rollIdx >= 0 ? normalizeText(row[rollIdx]) : '';

                if (name && name !== 'N/A' && name !== '-') {
                    rowStudents.push(name);
                    rowRolls.push(roll);
                }
            });

            // Fill down BatchID and team name if empty (MERGED CELLS)
            if (!batchId && lastBatchId && rowStudents.length > 0) {
                batchId = lastBatchId;
            }
            if (!teamName && lastTeamName && rowStudents.length > 0) {
                teamName = lastTeamName;
            }

            // Use BatchID as primary key, fallback to teamName
            const groupKey = batchId || teamName;
            if (!groupKey) continue;

            lastBatchId = batchId;
            lastTeamName = teamName;

            // Extract other fields
            let guideName = guideNameIndex >= 0 ? normalizeText(row[guideNameIndex]) : '';
            let projectTitle = projectTitleIndex >= 0 ? normalizeText(row[projectTitleIndex]) : '';
            let researchArea = researchAreaIndex >= 0 ? normalizeText(row[researchAreaIndex]) : '';
            // Extract COE from cell value and parse it
            let coeRaw = coeIndex >= 0 ? normalizeText(row[coeIndex]) : '';
            let coe = coeRaw ? extractCOENameFromText(coeRaw) : 'N/A';
            let year = yearIndex >= 0 ? normalizeText(row[yearIndex]) : '';
            let branch = branchIndex >= 0 ? normalizeText(row[branchIndex]) : '';
            let section = sectionIndex >= 0 ? normalizeText(row[sectionIndex]) : '';

            // Check if this is a new batch or continuation of the same batch
            const isNewBatch = !batchGroups[groupKey];

            // Fill down other fields ONLY if they are merged within the SAME batch
            // For a new batch, we should NOT fill down from the previous batch
            if (!guideName && !isNewBatch && lastGuideName) guideName = lastGuideName;
            if (!projectTitle && !isNewBatch && lastProjectTitle) projectTitle = lastProjectTitle;
            if (!researchArea && !isNewBatch && lastResearchArea !== 'N/A') researchArea = lastResearchArea;
            if (!coeRaw && !isNewBatch && lastCoe !== 'N/A') coe = lastCoe;
            if (!year && lastYear) year = lastYear;
            if (!branch && lastBranch) branch = lastBranch;
            if (!section && lastSection) section = lastSection;

            // Update last values for fill-down (but only after we've used them)
            if (guideName) lastGuideName = guideName;
            if (projectTitle) lastProjectTitle = projectTitle;
            if (researchArea) lastResearchArea = researchArea;
            if (coe && coe !== 'N/A') lastCoe = coe;
            if (year) lastYear = year;
            if (branch) lastBranch = branch;
            if (section) lastSection = section;

            // Initialize batch group if not exists
            if (!batchGroups[groupKey]) {
                batchGroups[groupKey] = {
                    batchId: batchId || 'N/A',
                    teamName: teamName || batchId || 'N/A',
                    guideName: guideName || 'N/A',
                    projectTitle: projectTitle || 'N/A',
                    researchArea: researchArea || 'N/A',
                    coe: coe || 'N/A',
                    year: year || '4th',
                    branch: branch || 'CSE',
                    section: section || 'A',
                    students: [],
                    rollNumbers: []
                };
            }

            // Add students found on this row
            rowStudents.forEach((s, idx) => {
                // Prevent duplicate students in the SAME batch (if row has redundant data)
                if (!batchGroups[groupKey].students.includes(s)) {
                    batchGroups[groupKey].students.push(s);
                    if (rowRolls[idx]) {
                        batchGroups[groupKey].rollNumbers.push(rowRolls[idx]);
                    }
                }
            });

            // Update fields if they were N/A before but now have values
            if (batchGroups[groupKey].guideName === 'N/A' && guideName) batchGroups[groupKey].guideName = guideName;
            if (batchGroups[groupKey].projectTitle === 'N/A' && projectTitle) batchGroups[groupKey].projectTitle = projectTitle;
            if (batchGroups[groupKey].researchArea === 'N/A' && researchArea && researchArea !== 'N/A') batchGroups[groupKey].researchArea = researchArea;
            if (batchGroups[groupKey].coe === 'N/A' && coe && coe !== 'N/A') batchGroups[groupKey].coe = coe;
        }

        // Convert grouped data to records array
        const records = Object.values(batchGroups).map(group => {
            console.log(`[Parser] Batch "${group.batchId || group.teamName}": Extracted ${group.students.length} students`);
            return {
                batchId: group.batchId,
                teamName: group.teamName || 'N/A',
                students: group.students.length > 0 ? group.students : ['N/A'],
                rollNumbers: group.rollNumbers.length > 0 ? group.rollNumbers : [],
                guideName: group.guideName || 'N/A',
                projectTitle: group.projectTitle || 'N/A',
                researchArea: group.researchArea || 'N/A',
                coe: group.coe || 'N/A',
                year: group.year,
                branch: group.branch,
                section: group.section
            };
        });

        return records;
    } catch (error) {
        throw new Error(`Failed to parse Excel file: ${error.message}`);
    }
}

/**
 * Merge records from multiple Excel files
 * Removes duplicates based on teamName + projectTitle
 * @param {Array} recordsArray - Array of record arrays
 * @returns {Array} Merged and deduplicated records
 */
function mergeRecords(...recordsArray) {
    const merged = [];
    const seen = new Set();

    recordsArray.forEach(records => {
        records.forEach(record => {
            // Create unique key
            const key = `${record.teamName.toLowerCase()}|${record.projectTitle.toLowerCase()}`;

            if (!seen.has(key)) {
                seen.add(key);
                merged.push(record);
            }
        });
    });

    return merged;
}

/**
 * Validate extracted record
 * @param {Object} record - Record to validate
 * @returns {Object} Validation result { valid: boolean, errors: Array }
 */
function validateRecord(record) {
    const errors = [];

    if (!record.teamName || record.teamName === 'N/A') {
        errors.push('Team name is missing');
    }

    if (!record.guideName || record.guideName === 'N/A') {
        errors.push('Guide name is missing');
    }

    if (!record.projectTitle || record.projectTitle === 'N/A') {
        errors.push('Project title is missing');
    }

    if (!record.students || record.students.length === 0 || record.students[0] === 'N/A') {
        errors.push('No student names found');
    }

    return {
        valid: errors.length === 0,
        errors
    };
}

module.exports = {
    parseExcelFile,
    mergeRecords,
    validateRecord,
    normalizeText
};
