/**
 * Parse student batches from Excel file
 * Handles merged cells correctly (Batch No. filled down for multiple students)
 * Format: Batch No. (merged) | Roll Number | Student Name
 */
export const parseBatchesFromExcel = (jsonData) => {
  const batches = {};
  const errors = [];
  let lastBatchNo = '';

  jsonData.forEach((row, index) => {
    try {
      // Extract columns - supporting variations
      let batchNo = (row['Batch No.'] || row['Batch'] || row['BatchNo'] || '').toString().trim();
      const rollNumber = (row['Roll Number'] || row['Roll No'] || row['RollNumber'] || row['Roll'] || '').toString().trim().toUpperCase();
      const studentName = (row['Student Name'] || row['StudentName'] || row['Student'] || '').toString().trim();

      // Skip completely empty rows
      if (!batchNo && !rollNumber && !studentName) {
        return;
      }

      // Skip header row
      if (batchNo.toLowerCase().includes('batch') || rollNumber.toLowerCase().includes('roll')) {
        return;
      }

      // Skip rows without student info
      if (!rollNumber || !studentName) {
        return;
      }

      // FILL DOWN: use last batch if current is empty (handles merged cells)
      if (!batchNo && lastBatchNo) {
        batchNo = lastBatchNo;
        console.log(`[BatchParser] Row ${index + 1}: Filled down batch '${batchNo}'`);
      }

      // Skip if still no batch number
      if (!batchNo) {
        errors.push({
          row: index + 2,
          error: 'Missing Batch No. value'
        });
        return;
      }

      // Update last batch
      if (batchNo) {
        lastBatchNo = batchNo;
      }

      // Create batch group if not exists
      if (!batches[batchNo]) {
        batches[batchNo] = [];
        console.log(`[BatchParser] Created batch: '${batchNo}'`);
      }

      // Add student to batch
      batches[batchNo].push({
        rollNumber,
        name: studentName
      });
      console.log(`[BatchParser] Added ${rollNumber} (${studentName}) to batch '${batchNo}'`);
    } catch (err) {
      errors.push({
        row: index + 2,
        error: err.message
      });
    }
  });

  // Convert to array format
  const batchesArray = Object.entries(batches).map(([batchNo, students]) => ({
    batchNo,
    students,
    studentCount: students.length,
    leader: students[0]?.name || '',
    leaderRoll: students[0]?.rollNumber || ''
  }));

  console.log(`[BatchParser] ✅ Parsed ${batchesArray.length} batches`);
  batchesArray.forEach(b => {
    console.log(`  Batch '${b.batchNo}': ${b.students.map(s => `${s.rollNumber}`).join(', ')}`);
  });

  return { batches: batchesArray, errors };
};
