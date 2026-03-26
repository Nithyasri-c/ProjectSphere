import { useState } from 'react';
import * as XLSX from 'xlsx';
import * as api from '../../services/api';
import { downloadExcelTemplate } from '../../utils/excelTemplate';

function ExcelImportProblem({ coes, rcs, targetYears, onImportComplete, onCancel }) {
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [importProgress, setImportProgress] = useState(0);
  const [importStatus, setImportStatus] = useState('');

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (!selectedFile) return;

    // Validate file type
    if (!selectedFile.name.endsWith('.xlsx') && !selectedFile.name.endsWith('.xls') && !selectedFile.name.endsWith('.csv')) {
      setError('Please upload an Excel file (.xlsx, .xls) or CSV file');
      setFile(null);
      setPreview([]);
      return;
    }

    setError('');
    setFile(selectedFile);

    // Parse and preview the file
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = event.target.result;
        const workbook = XLSX.read(data, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet);

        // Show first 5 rows as preview
        setPreview(jsonData.slice(0, 5));
      } catch (err) {
        setError('Error reading file: ' + err.message);
        setFile(null);
        setPreview([]);
      }
    };
    reader.readAsArrayBuffer(selectedFile);
  };

  const parseExcelData = (jsonData) => {
    return jsonData.map((row, index) => {
      // Map Excel columns to expected fields
      // Expected columns: COE/RC, Target Year, Title, Description, Research Area, Dataset URL
      const coeName = row['COE / RC'] || row['COE/RC'] || row['COE'] || row['coe'] || row['RC'] || row['rc'] || '';
      const targetYear = row['Target Year'] || row['target year'] || row['targetYear'] || '';
      const title = row['Title'] || row['title'] || '';
      const description = row['Description'] || row['description'] || '';
      const researchArea = row['Research Area'] || row['research area'] || row['researchArea'] || '';
      const datasetUrl = row['Dataset URL'] || row['dataset url'] || row['datasetUrl'] || '';

      // Find matching COE or RC ID
      const coe = coes.find(c => c.name.toLowerCase() === coeName.toLowerCase());
      const rc = rcs.find(r => r.name.toLowerCase() === coeName.toLowerCase());
      const coeId = coe ? coe._id : (rc ? rc._id : '');

      // Validate target year
      const validYear = targetYears.includes(targetYear) ? targetYear : '';

      return {
        row: index + 1,
        coeName,
        targetYear,
        title,
        description,
        researchArea,
        datasetUrl,
        coeId,
        validYear,
        isValid: !!coeId && !!validYear && !!title && !!description && !!researchArea
      };
    });
  };

  const handleImport = async () => {
    if (!file) {
      setError('Please select a file');
      return;
    }

    setLoading(true);
    setImportProgress(0);
    setError('');
    setImportStatus('');

    try {
      const reader = new FileReader();
      reader.onload = async (event) => {
        try {
          const data = event.target.result;
          const workbook = XLSX.read(data, { type: 'array' });
          const sheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[sheetName];
          const jsonData = XLSX.utils.sheet_to_json(worksheet);

          if (jsonData.length === 0) {
            setError('No data found in Excel file');
            setLoading(false);
            return;
          }

          const parsedData = parseExcelData(jsonData);
          const invalidRows = parsedData.filter(item => !item.isValid);

          if (invalidRows.length > 0) {
            setError(
              `Invalid data in rows: ${invalidRows.map(r => r.row).join(', ')}. ` +
              'Please ensure COE, Target Year, Title, Description, and Research Area are all provided and COE/Target Year match the available options.'
            );
            setLoading(false);
            return;
          }

          // Import valid problems
          let successCount = 0;
          const totalCount = parsedData.length;

          for (let i = 0; i < parsedData.length; i++) {
            const problem = parsedData[i];

            try {
              await api.createProblem({
                coeId: problem.coeId,
                title: problem.title,
                description: problem.description,
                researchArea: problem.researchArea || '',
                targetYear: problem.validYear,
                datasetUrl: problem.datasetUrl || ''
              });

              successCount++;
              setImportProgress(Math.round((successCount / totalCount) * 100));
              setImportStatus(`Importing... ${successCount}/${totalCount} problems created`);
            } catch (err) {
              console.error(`Failed to import row ${problem.row}:`, err);
              // Continue with next problem
            }
          }

          setImportStatus(`✅ Successfully imported ${successCount}/${totalCount} problems!`);
          setTimeout(() => {
            onImportComplete();
          }, 2000);
        } catch (err) {
          setError('Error processing file: ' + err.message);
          setLoading(false);
        }
      };
      reader.readAsArrayBuffer(file);
    } catch (err) {
      setError('Error: ' + err.message);
      setLoading(false);
    }
  };

  return (
    <div className="card" style={{ marginBottom: '20px', backgroundColor: '#f8f9fa' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h3>📊 Import Problem Statements from Excel</h3>
        <span style={{ fontSize: '12px', color: '#666' }}>Supported: .xlsx, .xls, .csv</span>
      </div>

      {error && (
        <div style={{
          padding: '12px',
          marginBottom: '15px',
          backgroundColor: '#fee',
          border: '1px solid #fcc',
          borderRadius: '4px',
          color: '#c33'
        }}>
          {error}
        </div>
      )}

      {importStatus && (
        <div style={{
          padding: '12px',
          marginBottom: '15px',
          backgroundColor: '#efe',
          border: '1px solid #cfc',
          borderRadius: '4px',
          color: '#3a3'
        }}>
          {importStatus}
        </div>
      )}

      <div style={{
        display: 'flex',
        gap: '10px',
        justifyContent: 'flex-end',
        marginBottom: '20px'
      }}>
        <button
          type="button"
          className="btn btn-secondary"
          onClick={() => downloadExcelTemplate(coes, targetYears)}
          style={{ backgroundColor: '#28a745' }}
        >
          📥 Download Template
        </button>
      </div>

      <div style={{
        border: '2px dashed #667eea',
        padding: '20px',
        textAlign: 'center',
        borderRadius: '8px',
        marginBottom: '20px',
        cursor: 'pointer',
        backgroundColor: file ? '#f0f4ff' : '#fff'
      }}>
        <input
          type="file"
          onChange={handleFileChange}
          accept=".xlsx,.xls,.csv"
          style={{ display: 'none' }}
          id="excel-file-input"
          disabled={loading}
        />
        <label htmlFor="excel-file-input" style={{ cursor: 'pointer', display: 'block' }}>
          <div style={{ fontSize: '24px', marginBottom: '8px' }}>📁</div>
          <p style={{ margin: '0 0 8px 0', fontWeight: '500' }}>
            {file ? `Selected: ${file.name}` : 'Click to select or drag Excel file'}
          </p>
          <p style={{ margin: 0, color: '#888', fontSize: '12px' }}>
            Format should have columns: COE/RC, Target Year, Title, Description, Dataset URL
          </p>
        </label>
      </div>

      {preview.length > 0 && (
        <div style={{ marginBottom: '20px' }}>
          <h4>Preview (first 5 rows):</h4>
          <div style={{
            overflowX: 'auto',
            backgroundColor: '#fff',
            border: '1px solid #ddd',
            borderRadius: '4px',
            padding: '10px'
          }}>
            <table style={{
              width: '100%',
              borderCollapse: 'collapse',
              fontSize: '13px'
            }}>
              <thead>
                <tr style={{ backgroundColor: '#f0f0f0' }}>
                  <th style={{ padding: '8px', textAlign: 'left', borderBottom: '1px solid #ddd' }}>COE</th>
                  <th style={{ padding: '8px', textAlign: 'left', borderBottom: '1px solid #ddd' }}>Target Year</th>
                  <th style={{ padding: '8px', textAlign: 'left', borderBottom: '1px solid #ddd' }}>Title</th>
                  <th style={{ padding: '8px', textAlign: 'left', borderBottom: '1px solid #ddd' }}>Description</th>
                  <th style={{ padding: '8px', textAlign: 'left', borderBottom: '1px solid #ddd' }}>Dataset URL</th>
                </tr>
              </thead>
              <tbody>
                {preview.map((row, idx) => (
                  <tr key={idx} style={{ borderBottom: '1px solid #eee' }}>
                    <td style={{ padding: '8px' }}>{row['COE'] || row['coe'] || '-'}</td>
                    <td style={{ padding: '8px' }}>{row['Target Year'] || row['target year'] || '-'}</td>
                    <td style={{ padding: '8px' }}>{row['Title'] || row['title'] || '-'}</td>
                    <td style={{ padding: '8px' }}>{String(row['Description'] || row['description'] || '-').substring(0, 50)}...</td>
                    <td style={{ padding: '8px' }}>{row['Dataset URL'] || row['dataset url'] || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {importProgress > 0 && importProgress < 100 && (
        <div style={{ marginBottom: '20px' }}>
          <div style={{
            width: '100%',
            height: '6px',
            backgroundColor: '#e0e0e0',
            borderRadius: '3px',
            overflow: 'hidden'
          }}>
            <div style={{
              width: `${importProgress}%`,
              height: '100%',
              backgroundColor: '#667eea',
              transition: 'width 0.3s'
            }}></div>
          </div>
          <p style={{ fontSize: '12px', color: '#666', marginTop: '8px', textAlign: 'center' }}>
            {importProgress}% complete
          </p>
        </div>
      )}

      <div style={{
        display: 'flex',
        gap: '10px',
        justifyContent: 'flex-end'
      }}>
        <button
          type="button"
          className="btn btn-secondary"
          onClick={onCancel}
          disabled={loading}
        >
          Cancel
        </button>
        <button
          type="button"
          className="btn btn-primary"
          onClick={handleImport}
          disabled={!file || loading}
          style={{
            opacity: !file || loading ? 0.6 : 1,
            cursor: !file || loading ? 'not-allowed' : 'pointer'
          }}
        >
          {loading ? '⏳ Importing...' : '📤 Import Problems'}
        </button>
      </div>

      <div style={{
        marginTop: '20px',
        padding: '15px',
        backgroundColor: '#e8f4f8',
        borderRadius: '4px',
        fontSize: '12px',
        color: '#333'
      }}>
        <p style={{ margin: '0 0 10px 0', fontWeight: '600' }}>📋 Excel Format Guide:</p>
        <ul style={{ margin: 0, paddingLeft: '20px' }}>
          <li>Column 1: <strong>COE/RC</strong> - Must match available COE or RC names exactly</li>
          <li>Column 2: <strong>Target Year</strong> - Must be one of: 2nd, 3rd, 4th</li>
          <li>Column 3: <strong>Title</strong> - Problem statement title (required)</li>
          <li>Column 4: <strong>Description</strong> - Detailed problem description</li>
          <li>Column 5: <strong>Dataset URL</strong> - Optional link to dataset</li>
        </ul>
      </div>
    </div>
  );
}

export default ExcelImportProblem;
