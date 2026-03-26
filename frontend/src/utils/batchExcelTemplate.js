import * as XLSX from 'xlsx';

export const downloadBatchExcelTemplate = () => {
  const data = [
    {
      'Team Name': 'Alpha Squad',
      'Team Members Names and RollNos': 'John Doe (21XX1A0501), Jane Smith (21XX1A0502), Bob Wilson (21XX1A0503)',
      'Class': '3rd CSE B'
    },
    {
      'Team Name': 'Beta Builders',
      'Team Members Names and RollNos': 'Alice Brown (22XX1A1201), Charlie Davis (22XX1A1202)',
      'Class': '2nd IT A'
    }
  ];

  const worksheet = XLSX.utils.json_to_sheet(data);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Batches');

  // Add instructions sheet
  const instructions = [
    ['Instruction', 'Details'],
    ['Team Name', 'The name of the project team'],
    ['Team Members Names and RollNos', 'Format: Name (RollNo), Name (RollNo), ... separated by commas'],
    ['Class', 'Format: [Year] [Branch] [Section] (e.g., 3rd CSE B)'],
    ['Default Password', 'The default password for all members will be [Team Name]@123'],
    ['Year Options', '2nd, 3rd, 4th'],
    ['Branch Options', 'CSE, IT, ECE, CSM, EEE, CSD, ETM'],
    ['Section Options', 'A, B, C, D, E']
  ];
  const instrWorksheet = XLSX.utils.aoa_to_sheet(instructions);
  XLSX.utils.book_append_sheet(workbook, instrWorksheet, 'Instructions');

  XLSX.writeFile(workbook, 'Student_Batches_Template.xlsx');
};
