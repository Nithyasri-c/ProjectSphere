// Utility to parse project details from Excel file with proper column extraction
export const parseProjectsFromExcel = (jsonData) => {
  const projects = [];
  const errors = [];
  let currentProject = null;

  jsonData.forEach((row, index) => {
    try {
      // Extract all columns with proper mapping - supporting multiple column name variations
      const projectId = (row['Proj ID/Batch'] || row['ProjectID'] || row['Proj ID'] || '').toString().trim();
      const rollNumber = (row['Roll No(s)'] || row['Roll Number'] || row['RollNumber'] || row['Roll'] || '').toString().trim().toUpperCase();
      const studentName = (row['Student Name(s)'] || row['Student Name'] || row['StudentName'] || row['Student'] || '').toString().trim();
      const guideName = (row['Name of the Guide(s)'] || row['Internal Guide'] || row['InternalGuide'] || row['Guide'] || '').toString().trim();
      const projectTitle = (row['Project Title'] || row['ProjectTitle'] || row['Title'] || '').toString().trim();
      const domain = (row['Domain'] || row['domain'] || '').toString().trim();
      const coeRc = (row['Within GNITS COE/RC/if any others'] || row['COE/RC'] || '').toString().trim();

      // Skip completely empty rows
      if (!projectId && !rollNumber && !studentName && !guideName && !projectTitle) {
        return;
      }

      // Skip header row or rows with obvious headers
      if (projectId.toLowerCase().includes('proj') || rollNumber.toLowerCase().includes('roll')) {
        return;
      }

      // Only process rows with a project ID
      if (!projectId) {
        errors.push({
          row: index + 2,
          error: 'Missing Proj ID/Batch column value'
        });
        return;
      }

      // When Proj ID is present, we're either starting new project or continuing current
      if (projectId && (!currentProject || currentProject.projectId !== projectId)) {
        // Create new project entry for this batch
        currentProject = {
          projectId,
          projectTitle: projectTitle || '',
          internalGuide: {
            name: guideName || '',
            email: '' // Will be populated by backend when matching with Guide records
          },
          domain: domain || '',
          coe: {
            name: extractCOE(coeRc) || ''
          },
          rc: {
            name: extractRC(coeRc) || ''
          },
          students: [],
          department: row['Department'] || row['department'] || 'CSE',
          year: extractYear(row['Batch'] || row['batch'] || projectId),
          branch: extractBranch(row['Batch'] || row['batch'] || projectId),
          section: extractSection(row['Batch'] || row['batch'] || projectId),
          batch: row['Batch'] || row['batch'] || ''
        };
        projects.push(currentProject);
      }

      // Update project details if found in this row (for cases where header info is in first row)
      if (projectTitle && !currentProject.projectTitle) {
        currentProject.projectTitle = projectTitle;
      }
      if (guideName && !currentProject.internalGuide.name) {
        currentProject.internalGuide.name = guideName;
      }
      if (domain && !currentProject.domain) {
        currentProject.domain = domain;
      }
      if (coeRc && !currentProject.coe.name && !currentProject.rc.name) {
        currentProject.coe.name = extractCOE(coeRc) || '';
        currentProject.rc.name = extractRC(coeRc) || '';
      }

      // Add student if this row has student info
      // CRITICAL: Only add to students array, never add guide to students
      if (rollNumber && studentName) {
        const studentExists = currentProject.students.some(s => s.rollNumber === rollNumber);
        if (!studentExists) {
          currentProject.students.push({
            name: studentName,
            rollNumber: rollNumber
          });
        }
      }
    } catch (err) {
      errors.push({
        row: index + 2,
        error: err.message
      });
    }
  });

  // Validate all projects have required fields and at least one student
  const validProjects = projects.filter(p => {
    if (!p.projectId) {
      errors.push({
        project: 'Unknown',
        error: 'Missing project ID'
      });
      return false;
    }
    if (!p.projectTitle) {
      errors.push({
        project: p.projectId,
        error: 'Missing project title'
      });
      return false;
    }
    if (!p.internalGuide.name || p.internalGuide.name.trim() === '') {
      errors.push({
        project: p.projectId,
        error: 'Missing internal guide name'
      });
      return false;
    }
    if (p.students.length === 0) {
      errors.push({
        project: p.projectId,
        error: 'No students assigned to project'
      });
      return false;
    }
    return true;
  });

  console.log('Parse Debug:', {
    totalRows: jsonData.length,
    projectsCreated: projects.length,
    validProjects: validProjects.length,
    errors: errors.length,
    errorDetails: errors
  });

  return { projects: validProjects, errors };
};

// Extract COE name from "GNITS, CoE-Deep Learning in Eye Disease Prognosis" format
// COE is typically the first value before comma (organization name)
export const extractCOE = (coeRcString) => {
  if (!coeRcString) return '';
  const parts = coeRcString.split(',').map(part => part.trim());
  // Return the part that looks like an organization (GNITS, BITS, etc.)
  // Usually the first part or one without "CoE-" prefix
  for (const part of parts) {
    if (!part.toLowerCase().includes('coe-') && !part.toLowerCase().includes('rc-')) {
      return part;
    }
  }
  return parts[0] || '';
};

// Extract RC name from "GNITS, CoE-Deep Learning in Eye Disease Prognosis" format
// RC is typically the part with "CoE-" or "RC-" prefix, or the longer description
export const extractRC = (coeRcString) => {
  if (!coeRcString) return '';
  const parts = coeRcString.split(',').map(part => part.trim());
  // Return the part that looks like an RC (has CoE- or RC- prefix, or is descriptive)
  for (const part of parts) {
    if (part.toLowerCase().includes('coe-') || part.toLowerCase().includes('rc-')) {
      return part;
    }
  }
  // If no RC- or CoE- prefix, return the longer part or last part
  return parts[parts.length - 1] || '';
};

// Extract year from batch string or project ID
export const extractYear = (batchStr) => {
  if (!batchStr) return '3rd';
  if (batchStr.includes('2nd')) return '2nd';
  if (batchStr.includes('3rd')) return '3rd';
  if (batchStr.includes('4th')) return '4th';
  return '3rd';
};

// Extract branch from batch string
export const extractBranch = (batchStr) => {
  const branches = ['CSE', 'IT', 'ECE', 'CSM', 'EEE', 'CSD', 'ETM'];
  if (!batchStr) return 'CSE';

  for (const branch of branches) {
    if (batchStr.includes(branch)) return branch;
  }
  return 'CSE';
};

// Extract section from batch string
export const extractSection = (batchStr) => {
  const sections = ['A', 'B', 'C', 'D', 'E'];
  if (!batchStr) return 'A';

  for (const section of sections) {
    if (batchStr.includes(section)) return section;
  }
  return 'A';
};
