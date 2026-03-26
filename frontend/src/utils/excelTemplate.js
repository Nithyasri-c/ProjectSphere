import * as XLSX from 'xlsx';

/**
 * Downloads a sample Excel template for importing problem statements
 * @param {Array} coes - Array of COE objects with name property
 * @param {Array} targetYears - Array of available target years
 */
export const downloadExcelTemplate = (coes, targetYears) => {
  // Create sample data
  const sampleData = [
    {
      'COE': coes.length > 0 ? coes[0].name : 'Data Analytics',
      'Target Year': targetYears[0] || '3rd',
      'Title': 'Sample Problem Statement 1',
      'Description': 'This is a sample problem statement describing the challenge that needs to be solved.',
      'Research Area': 'Data Science',
      'Dataset URL': 'https://example.com/dataset1.csv'
    },
    {
      'COE': coes.length > 1 ? coes[1].name : 'Machine Learning',
      'Target Year': targetYears[1] || '4th',
      'Title': 'Sample Problem Statement 2',
      'Description': 'Another example problem statement with detailed requirements and constraints.',
      'Research Area': 'Deep Learning',
      'Dataset URL': 'https://example.com/dataset2.csv'
    },
    {
      'COE': coes.length > 2 ? coes[2].name : 'IoT',
      'Target Year': targetYears[0] || '3rd',
      'Title': 'Sample Problem Statement 3',
      'Description': 'Problem related to Internet of Things and connected devices.',
      'Research Area': 'IoT & Connected Systems',
      'Dataset URL': ''
    }
  ];

  // Create a new workbook
  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.json_to_sheet(sampleData);

  // Set column widths
  ws['!cols'] = [
    { wch: 20 },  // COE
    { wch: 15 },  // Target Year
    { wch: 35 },  // Title
    { wch: 50 },  // Description
    { wch: 25 },  // Research Area
    { wch: 35 }   // Dataset URL
  ];

  // Add a second sheet with instructions
  const instructionsData = [
    { 'Field': 'COE *', 'Description': 'Center of Excellence name. Must exactly match available COEs. REQUIRED', 'Example': coes.length > 0 ? coes[0].name : 'Data Analytics' },
    { 'Field': 'Target Year *', 'Description': 'Year level (2nd, 3rd, or 4th). Must be exact match. REQUIRED', 'Example': '3rd' },
    { 'Field': 'Title *', 'Description': 'Problem statement title. REQUIRED', 'Example': 'Data Analysis Challenge' },
    { 'Field': 'Description *', 'Description': 'Detailed description of the problem. Can be multiple lines. REQUIRED', 'Example': 'Build a solution to analyze customer behavior...' },
    { 'Field': 'Research Area *', 'Description': 'Research area or domain. Examples: Machine Learning, IoT, Data Science. REQUIRED', 'Example': 'Machine Learning' },
    { 'Field': 'Dataset URL', 'Description': 'Link to dataset (optional). Leave blank if not applicable.', 'Example': 'https://example.com/data.csv' }
  ];

  const wsInstructions = XLSX.utils.json_to_sheet(instructionsData);
  wsInstructions['!cols'] = [
    { wch: 15 },
    { wch: 50 },
    { wch: 35 }
  ];

  // Add both sheets
  XLSX.utils.book_append_sheet(wb, ws, 'Problems');
  XLSX.utils.book_append_sheet(wb, wsInstructions, 'Instructions');

  // Download the file
  XLSX.writeFile(wb, 'Problem_Statements_Template.xlsx');
};
