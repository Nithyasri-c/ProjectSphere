import { useState } from 'react';
import axios from 'axios';
import * as XLSX from 'xlsx';
import * as api from '../../services/api';
import { parseProjectsFromExcel } from '../../utils/projectExcelParser';

const API_URL = import.meta.env.VITE_API_URL || '/api';

function ProjectImport({ onImportComplete, onCancel }) {
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
        const jsonData = XLSX.utils.sheet_to_json(worksheet);

        console.log('Raw Excel data:', jsonData); // Debug log
        
        const { projects, errors } = parseProjectsFromExcel(jsonData);
        
        console.log('Parsed projects:', projects); // Debug log
        console.log('Parse errors:', errors); // Debug log
        
        setPreview(projects.slice(0, 10)); // Show more previews
        setParseErrors(errors);

        if (errors.length > 0 && projects.length === 0) {
          setError(`? No valid projects found. ${errors.length} errors detected. Check the file format.`);
        } else if (errors.length > 0) {
          setError(`?? ${errors.length} rows had issues but ${projects.length} projects were successfully parsed.`);
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

  const downloadTemplate = () => {
    const template = [
      {
        'S.No': 1,
        'Proj ID/Batch': 'A1',
        'Roll Number': '22251A0501',
        'Student Name': 'John Doe',
        'Internal Guide': 'Dr. Smith',
        'Project Title': 'IoT Based Home Automation'
      },
      {
        'S.No': 2,
        'Proj ID/Batch': 'A1',
        'Roll Number': '22251A0502',
        'Student Name': 'Jane Smith',
        'Internal Guide': 'Dr. Smith',
        'Project Title': 'IoT Based Home Automation'
      }
    ];

    const worksheet = XLSX.utils.json_to_sheet(template);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Projects');
    XLSX.writeFile(workbook, 'Project_Import_Template.xlsx');
  };

  const handleImport = async () => {
    if (!file) {
      setError('Please select a file');
      return;
    }

    if (parseErrors.length > 0) {
      setError('Please fix the parsing errors before importing');
      return;
    }

    setLoading(true);
    setError('');
    setImportStatus('Processing...');

    try {
      const reader = new FileReader();
      reader.onload = async (event) => {
        try {
          const data = event.target.result;
          const workbook = XLSX.read(data, { type: 'array' });
          const sheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[sheetName];
          const jsonData = XLSX.utils.sheet_to_json(worksheet);

          const { projects, errors } = parseProjectsFromExcel(jsonData);

          if (projects.length === 0) {
            setError('No valid projects found in file');
            setLoading(false);
            return;
          }

          const response = await axios.post(`${API_URL}/projects/import`, { projects });
          const { success, created, failed, message } = response.data.data;

          if (failed > 0) {
            setImportStatus(`? Imported ${success} projects, ${created} batches created. ${failed} failed. Check console for details.`);
          } else {
            setImportStatus(`? Successfully imported ${success} projects! ${created} batches created!`);
          }

          if (success > 0) {
            setTimeout(() => {
              onImportComplete();
            }, 3000);
          } else {
            setLoading(false);
          }
        } catch (err) {
          setError('Error processing file: ' + (err.response?.data?.message || err.message));
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
        <h3>?? Import Projects from Excel</h3>
        <span style={{ fontSize: '12px', color: '#666' }}>Supported: .xlsx, .xls, .csv</span>
      </div>

      {error && (
        <div style={{ padding: '12px', marginBottom: '15px', backgroundColor: '#fee', border: '1px solid #fcc', borderRadius: '4px', color: '#c33' }}>
          ?? {error}
        </div>
      )}

      {importStatus && (
        <div style={{ padding: '12px', marginBottom: '15px', backgroundColor: '#efe', border: '1px solid #cfc', borderRadius: '4px', color: '#3a3' }}>
          {importStatus}
        </div>
      )}

      {parseErrors.length > 0 && (
        <div style={{ padding: '12px', marginBottom: '15px', backgroundColor: '#fef3e6', border: '1px solid #fdd9b5', borderRadius: '4px', color: '#856404' }}>
          <strong>Parsing Errors ({parseErrors.length}):</strong>
          <ul style={{ margin: '8px 0 0 0', paddingLeft: '20px', fontSize: '12px' }}>
            {parseErrors.map((err, idx) => (
              <li key={idx}>Row {err.row}: {err.error}</li>
            ))}
          </ul>
        </div>
      )}

      <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginBottom: '20px' }}>
        <button type="button" className="btn btn-secondary" onClick={downloadTemplate} style={{ backgroundColor: '#28a745' }}>
          ?? Download Template
        </button>
      </div>

      <div style={{ border: '2px dashed #667eea', padding: '20px', textAlign: 'center', borderRadius: '8px', marginBottom: '20px', cursor: 'pointer', backgroundColor: file ? '#f0f4ff' : '#fff' }}>
        <input type="file" onChange={handleFileChange} accept=".xlsx,.xls,.csv" style={{ display: 'none' }} id="project-file-input" disabled={loading} />
        <label htmlFor="project-file-input" style={{ cursor: 'pointer', display: 'block' }}>
          <div style={{ fontSize: '24px', marginBottom: '8px' }}>??</div>
          <p style={{ margin: '0 0 8px 0', fontWeight: '500' }}>
            {file ? `Selected: ${file.name}` : 'Click to select or drag Excel file'}
          </p>
          <p style={{ margin: 0, color: '#888', fontSize: '12px' }}>
            Columns: Proj ID/Batch, Roll Number, Student Name, Internal Guide, Project Title
          </p>
        </label>
      </div>

      {preview.length > 0 && (
        <div style={{ marginBottom: '20px' }}>
          <h4>Preview (showing {preview.length} of {preview.length} projects):</h4>
          <div style={{ overflowX: 'auto', backgroundColor: '#fff', border: '1px solid #ddd', borderRadius: '4px', padding: '10px' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
              <thead>
                <tr style={{ backgroundColor: '#f0f0f0' }}>
                  <th style={{ padding: '8px', textAlign: 'left', borderBottom: '1px solid #ddd' }}>Project ID</th>
                  <th style={{ padding: '8px', textAlign: 'left', borderBottom: '1px solid #ddd' }}>Project Title</th>
                  <th style={{ padding: '8px', textAlign: 'left', borderBottom: '1px solid #ddd' }}>Guide</th>
                  <th style={{ padding: '8px', textAlign: 'left', borderBottom: '1px solid #ddd' }}>Students</th>
                </tr>
              </thead>
              <tbody>
                {preview.map((project, idx) => (
                  <tr key={idx} style={{ borderBottom: '1px solid #eee' }}>
                    <td style={{ padding: '8px' }}>{project.projectId}</td>
                    <td style={{ padding: '8px' }}>{project.projectTitle.substring(0, 40)}</td>
                    <td style={{ padding: '8px' }}>{project.internalGuide}</td>
                    <td style={{ padding: '8px' }}>{project.students.length} student(s)</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
        <button type="button" className="btn btn-secondary" onClick={onCancel} disabled={loading}>Cancel</button>
        <button type="button" className="btn btn-primary" onClick={handleImport} disabled={!file || loading || parseErrors.length > 0}>
          {loading ? '? Importing...' : '?? Import Projects'}
        </button>
      </div>
    </div>
  );
}

export default ProjectImport;
