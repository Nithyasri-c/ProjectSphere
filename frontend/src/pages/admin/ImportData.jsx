import { useState } from 'react';
import * as api from '../../services/api';
import ConfirmationDialog from '../../components/ConfirmationDialog';
import * as XLSX from 'xlsx';

function ImportData() {
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState(null);
  const [dialog, setDialog] = useState({ isOpen: false, title: '', message: '', type: 'info' });

  const downloadTemplate = () => {
    const sampleData = [
      {
        'S.No': 1,
        'Proj ID/Batch': 'A1',
        'Roll Number': '22251A0501',
        'Student Name': 'Allam Jayasri Madhuri',
        'Internal Guide': 'Mrs. Nanda Devi. D.R',
        'Project Title': 'EnviroWatch: Empowering Communities for Environmental Action'
      },
      {
        'S.No': 2,
        'Proj ID/Batch': 'A1',
        'Roll Number': '22251A0510',
        'Student Name': 'G Veneesha Reddy',
        'Internal Guide': 'Mrs. Nanda Devi. D.R',
        'Project Title': 'EnviroWatch: Empowering Communities for Environmental Action'
      },
      {
        'S.No': 3,
        'Proj ID/Batch': 'A1',
        'Roll Number': '22251A0521',
        'Student Name': 'Maidam Neelu',
        'Internal Guide': 'Mrs. Nanda Devi. D.R',
        'Project Title': 'EnviroWatch: Empowering Communities for Environmental Action'
      },
      {
        'S.No': 4,
        'Proj ID/Batch': 'A2',
        'Roll Number': '22251A0514',
        'Student Name': 'G Suzan Glory',
        'Internal Guide': 'Mrs. K. Sneha Reddy',
        'Project Title': 'FitnessX Tracker'
      },
      {
        'S.No': 5,
        'Proj ID/Batch': 'A3',
        'Roll Number': '22251A0523',
        'Student Name': 'N Sai Varshitha',
        'Internal Guide': 'Mrs. A. Leela Kumari',
        'Project Title': 'Glow Guide'
      }
    ];

    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(sampleData);

    ws['!cols'] = [
      { wch: 8 },
      { wch: 15 },
      { wch: 15 },
      { wch: 25 },
      { wch: 25 },
      { wch: 50 }
    ];

    XLSX.utils.book_append_sheet(wb, ws, 'Batch Data');
    XLSX.writeFile(wb, 'Batch_Import_Template.xlsx');
  };

  const handleImport = async (e) => {
    e.preventDefault();
    if (!file) {
      showDialog('Error', 'Please select an Excel file', 'danger');
      return;
    }

    setLoading(true);
    try {
      const response = await api.importBatchData(file);
      setResults(response.data.data);
      showDialog('Success', response.data.message, 'success');
      setFile(null);
      if (e.target.fileInput) e.target.fileInput.value = '';
    } catch (error) {
      showDialog('Error', error.response?.data?.message || 'Failed to import data', 'danger');
    } finally {
      setLoading(false);
    }
  };

  const showDialog = (title, message, type = 'info') => {
    setDialog({
      isOpen: true,
      title,
      message,
      type,
      onConfirm: () => setDialog({ ...dialog, isOpen: false })
    });
  };

  return (
    <div>
      <div className="section-header">
        <h2 className="section-title">📥 Import Batch Data from Excel</h2>
        <p style={{ color: '#718096', marginTop: '8px' }}>Import students, batches, guides, and projects all in one file</p>
      </div>

      <div className="card" style={{ padding: '24px', maxWidth: '700px' }}>
        <h3 style={{ marginBottom: '16px', color: '#2d3748' }}>📋 Excel File Format</h3>
        
        <div style={{ marginBottom: '20px', padding: '16px', background: '#f0f4ff', borderRadius: '8px' }}>
          <p style={{ color: '#2d3748', marginBottom: '12px', fontSize: '14px', fontWeight: '500' }}>
            Required columns:
          </p>
          <ul style={{ color: '#2d3748', fontSize: '14px', marginLeft: '20px', lineHeight: '1.8' }}>
            <li><strong>S.No</strong> - Serial number</li>
            <li><strong>Proj ID/Batch</strong> - Batch identifier (e.g., A1, A2, A3)</li>
            <li><strong>Roll Number</strong> - Student roll number</li>
            <li><strong>Student Name</strong> - Full name of student</li>
            <li><strong>Internal Guide</strong> - Name of assigned guide</li>
            <li><strong>Project Title</strong> - Name of the project</li>
          </ul>
        </div>

        <button
          onClick={downloadTemplate}
          style={{
            marginBottom: '24px',
            padding: '12px 20px',
            background: '#667eea',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
            fontSize: '14px',
            fontWeight: '500'
          }}
        >
          📥 Download Template Excel
        </button>

        <form onSubmit={handleImport}>
          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500', color: '#2d3748' }}>
              Select Excel File
            </label>
            <input
              type="file"
              ref={(ref) => { if (ref) ref.id = 'fileInput'; }}
              accept=".xlsx,.xls,.csv"
              onChange={(e) => setFile(e.target.files?.[0])}
              style={{
                display: 'block',
                width: '100%',
                padding: '12px 12px',
                border: '2px dashed #cbd5e0',
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '14px',
                boxSizing: 'border-box'
              }}
            />
            {file && (
              <p style={{ color: '#38a169', marginTop: '8px', fontSize: '14px' }}>
                ✓ {file.name}
              </p>
            )}
          </div>

          <button
            type="submit"
            disabled={loading || !file}
            className="btn btn-primary"
            style={{ width: '100%', opacity: loading || !file ? 0.6 : 1 }}
          >
            {loading ? 'Importing...' : 'Import Batch Data'}
          </button>
        </form>

        {results && (
          <div style={{ marginTop: '24px', padding: '16px', background: '#f7fafc', borderRadius: '8px' }}>
            <h4 style={{ marginBottom: '16px', color: '#2d3748' }}>📊 Import Results</h4>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '16px' }}>
              <div style={{ padding: '12px', background: '#e6f3ff', borderRadius: '6px' }}>
                <p style={{ fontSize: '12px', color: '#667eea', marginBottom: '4px' }}>Batches Created</p>
                <p style={{ fontSize: '20px', fontWeight: 'bold', color: '#667eea' }}>{results.batchCount}</p>
              </div>
              <div style={{ padding: '12px', background: '#e6f3ff', borderRadius: '6px' }}>
                <p style={{ fontSize: '12px', color: '#667eea', marginBottom: '4px' }}>Students Added</p>
                <p style={{ fontSize: '20px', fontWeight: 'bold', color: '#667eea' }}>{results.studentCount}</p>
              </div>
            </div>

            <p style={{ color: '#38a169', marginBottom: '8px', fontSize: '14px', fontWeight: '500' }}>
              ✓ Success: {results.success} records
            </p>
            
            {results.failed > 0 && (
              <>
                <p style={{ color: '#e53e3e', marginBottom: '8px', fontSize: '14px', fontWeight: '500' }}>
                  ✗ Failed: {results.failed} records
                </p>
                {results.errors.length > 0 && (
                  <div style={{ marginTop: '12px', maxHeight: '300px', overflowY: 'auto', padding: '12px', background: 'white', borderRadius: '6px', border: '1px solid #e2e8f0' }}>
                    <p style={{ fontSize: '12px', fontWeight: '500', marginBottom: '8px', color: '#718096' }}>Errors:</p>
                    {results.errors.map((err, i) => (
                      <p key={i} style={{ fontSize: '12px', color: '#e53e3e', marginBottom: '6px', lineHeight: '1.4' }}>
                        <strong>Batch {err.batch}</strong>
                        {err.student && <> • {err.student}</>}
                        : {err.error}
                      </p>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </div>

      <ConfirmationDialog
        isOpen={dialog.isOpen}
        title={dialog.title}
        message={dialog.message}
        type={dialog.type}
        onConfirm={() => setDialog({ ...dialog, isOpen: false })}
        confirmText="OK"
      />
    </div>
  );
}

export default ImportData;
