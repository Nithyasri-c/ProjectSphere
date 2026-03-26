import { useState } from 'react';
import * as XLSX from 'xlsx';
import * as api from '../../services/api';
import { parseBatchesFromExcel } from '../../utils/batchExcelParser';

function BatchImport({ onImportComplete, onCancel }) {
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [importStatus, setImportStatus] = useState('');
  const [parseErrors, setParseErrors] = useState([]);

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (!selectedFile) return;

    if (!selectedFile.name.endsWith('.xlsx') && !selectedFile.name.endsWith('.xls') && !selectedFile.name.endsWith('.csv')) {
      setError('Please upload an Excel file (.xlsx, .xls) or CSV file');
      setFile(null);
      setPreview([]);
      setParseErrors([]);
      return;
    }

    setError('');
    setFile(selectedFile);

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = event.target.result;
        const workbook = XLSX.read(data, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        
        // Use object-based format (default) to handle merged cells properly
        const jsonData = XLSX.utils.sheet_to_json(worksheet);

        console.log('Raw Excel data:', jsonData);
        
        const { batches, errors } = parseBatchesFromExcel(jsonData);
        
        console.log('Parsed batches:', batches);
        console.log('Parse errors:', errors);
        
        setPreview(batches.slice(0, 5));
        setParseErrors(errors);

        if (errors.length > 0 && batches.length === 0) {
          setError(`❌ No valid batches found. ${errors.length} errors detected. Check the file format.`);
        } else if (errors.length > 0) {
          setError(`⚠️ ${errors.length} rows had issues but ${batches.length} batches were successfully parsed.`);
        }
      } catch (err) {
        console.error('File read error:', err);
        setError('Error reading file: ' + err.message);
        setFile(null);
        setPreview([]);
        setParseErrors([]);
      }
    };
    reader.readAsArrayBuffer(selectedFile);
  };

  const handleImport = async () => {
    if (!file) {
      setError('Please select a file');
      return;
    }

    if (parseErrors.length > 0 && preview.length === 0) {
      setError('Please fix the parsing errors before importing');
      return;
    }

    setLoading(true);
    setError('');
    setImportStatus('');

    try {
      const response = await api.importStudentBatchesFromExcel(file);
      const { results, message } = response.data;

      if (results.failed > 0) {
        const errorMsgs = results.errors
          .map(e => `Batch ${e.batch}: ${e.error}`)
          .slice(0, 5)
          .join('; ');
        const errorText = results.errors.length > 5 
          ? `${errorMsgs}... and ${results.errors.length - 5} more`
          : errorMsgs;
        setImportStatus(
          `✅ Imported ${results.success} batches with ${results.createdStudents.length} new students.\n` +
          `⚠️ ${results.failed} batches failed. Errors: ${errorText}`
        );
      } else {
        setImportStatus(
          `✅ Successfully imported ${results.success} batches!\n` +
          `📝 Created ${results.createdStudents.length} new student accounts\n` +
          `🎓 Created ${results.createdBatches.length} new batches`
        );
      }

      if (results.success > 0) {
        setTimeout(() => {
          onImportComplete();
        }, 3000);
      } else {
        setLoading(false);
      }
    } catch (err) {
      const errorMsg = err.response?.data?.error || err.response?.data?.message || err.message;
      setError(`Import failed: ${errorMsg}`);
      setLoading(false);
    }
  };

  return (
    <div className="card" style={{ marginBottom: '20px', backgroundColor: '#f8f9fa' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h3>👥 Import Student Batches from Excel</h3>
        <span style={{ fontSize: '12px', color: '#666' }}>Supported: .xlsx, .xls, .csv</span>
      </div>

      {error && (
        <div style={{ padding: '12px', marginBottom: '15px', backgroundColor: '#fee', border: '1px solid #fcc', borderRadius: '4px', color: '#c33', whiteSpace: 'pre-wrap' }}>
          {error}
        </div>
      )}

      {importStatus && (
        <div style={{ padding: '12px', marginBottom: '15px', backgroundColor: '#efe', border: '1px solid #cfc', borderRadius: '4px', color: '#3a3', whiteSpace: 'pre-wrap' }}>
          {importStatus}
        </div>
      )}

      <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginBottom: '20px' }}>
        <a 
          href="#" 
          className="btn btn-secondary" 
          style={{ backgroundColor: '#28a745', textDecoration: 'none', color: 'white', padding: '8px 16px', borderRadius: '4px' }}
          onClick={(e) => {
            e.preventDefault();
            downloadBatchExcelTemplate();
          }}
        >
          📥 Download Template
        </a>
      </div>

      <div style={{ border: '2px dashed #667eea', padding: '20px', textAlign: 'center', borderRadius: '8px', marginBottom: '20px', cursor: 'pointer', backgroundColor: file ? '#f0f4ff' : '#fff' }}>
        <input type="file" onChange={handleFileChange} accept=".xlsx,.xls,.csv" style={{ display: 'none' }} id="batch-file-input" disabled={loading} />
        <label htmlFor="batch-file-input" style={{ cursor: 'pointer', display: 'block' }}>
          <div style={{ fontSize: '24px', marginBottom: '8px' }}>📁</div>
          <p style={{ margin: '0 0 8px 0', fontWeight: '500' }}>
            {file ? `Selected: ${file.name}` : 'Click to select or drag Excel file'}
          </p>
          <p style={{ margin: 0, color: '#888', fontSize: '12px' }}>
            Columns: Batch No., Roll Number, Student Name
          </p>
        </label>
      </div>

      {preview.length > 0 && (
        <div style={{ marginBottom: '20px' }}>
          <h4>Preview ({preview.length} batches):</h4>
          <div style={{ overflowX: 'auto', backgroundColor: '#fff', border: '1px solid #ddd', borderRadius: '4px', padding: '10px' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
              <thead>
                <tr style={{ backgroundColor: '#f0f0f0' }}>
                  <th style={{ padding: '8px', textAlign: 'left', borderBottom: '1px solid #ddd', width: '15%' }}>Batch No.</th>
                  <th style={{ padding: '8px', textAlign: 'left', borderBottom: '1px solid #ddd', width: '20%' }}>Leader</th>
                  <th style={{ padding: '8px', textAlign: 'left', borderBottom: '1px solid #ddd', width: '20%' }}>Leader Roll</th>
                  <th style={{ padding: '8px', textAlign: 'left', borderBottom: '1px solid #ddd', width: '15%' }}>Student Count</th>
                  <th style={{ padding: '8px', textAlign: 'left', borderBottom: '1px solid #ddd', width: '30%' }}>All Students</th>
                </tr>
              </thead>
              <tbody>
                {preview.map((batch, idx) => (
                  <tr key={idx} style={{ borderBottom: '1px solid #eee' }}>
                    <td style={{ padding: '8px', fontWeight: '600' }}>{batch.batchNo}</td>
                    <td style={{ padding: '8px' }}>{batch.leader}</td>
                    <td style={{ padding: '8px', fontFamily: 'monospace' }}>{batch.leaderRoll}</td>
                    <td style={{ padding: '8px', textAlign: 'center' }}>{batch.studentCount}</td>
                    <td style={{ padding: '8px', fontSize: '12px', color: '#555' }}>
                      {batch.students.map(s => `${s.rollNumber}`).join(', ')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {parseErrors.length > 0 && (
        <div style={{ marginBottom: '20px', padding: '12px', backgroundColor: '#fff3cd', border: '1px solid #ffc107', borderRadius: '4px' }}>
          <p style={{ margin: '0 0 8px 0', fontWeight: '600', color: '#856404' }}>⚠️ Parse Errors ({parseErrors.length}):</p>
          <ul style={{ margin: 0, paddingLeft: '20px', fontSize: '12px', color: '#856404' }}>
            {parseErrors.slice(0, 5).map((err, idx) => (
              <li key={idx}>Row {err.row}: {err.error}</li>
            ))}
            {parseErrors.length > 5 && <li>... and {parseErrors.length - 5} more</li>}
          </ul>
        </div>
      )}

      <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
        <button type="button" className="btn btn-secondary" onClick={onCancel} disabled={loading}>Cancel</button>
        <button type="button" className="btn btn-primary" onClick={handleImport} disabled={!file || loading}>
          {loading ? '⏳ Importing...' : '📤 Import Batches'}
        </button>
      </div>

      <div style={{ marginTop: '20px', padding: '12px', backgroundColor: '#e8f4f8', borderRadius: '4px', fontSize: '13px', color: '#333' }}>
        <p style={{ margin: '0 0 8px 0' }}><strong>ℹ️ Import Information:</strong></p>
        <ul style={{ margin: '0', paddingLeft: '20px' }}>
          <li>First Roll Number in each batch becomes the leader/main account</li>
          <li>Login: Use Roll Number (username)</li>
          <li>Password format: <code style={{ backgroundColor: '#fff', padding: '2px 4px', borderRadius: '2px' }}>BatchNo@123</code></li>
          <li>Default Year: 2nd (can be updated later)</li>
          <li>Branch: CSE, Section: A (can be updated later)</li>
        </ul>
      </div>
    </div>
  );
}

function downloadBatchExcelTemplate() {
  const templateData = [
    {
      'Batch No.': 'E1',
      'Roll Number': '24251A05V4',
      'Student Name': 'Sai Sri Aishwarya Venkatesh'
    },
    {
      'Batch No.': 'E1',
      'Roll Number': '24251A05W7',
      'Student Name': 'Bavandla Prahasya Sri'
    },
    {
      'Batch No.': 'E1',
      'Roll Number': '24251A05V9',
      'Student Name': 'Uma Iyer'
    },
    {
      'Batch No.': 'E2',
      'Roll Number': '24251A05T6',
      'Student Name': 'Srihitha Durgam'
    },
    {
      'Batch No.': 'E2',
      'Roll Number': '25255A0527',
      'Student Name': 'Bodulla Bhavana'
    }
  ];

  const worksheet = XLSX.utils.json_to_sheet(templateData);
  worksheet['!cols'] = [{ wch: 15 }, { wch: 20 }, { wch: 30 }];
  
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Batches');
  XLSX.writeFile(workbook, 'Student_Batches_Import_Template.xlsx');
}

export default BatchImport;
