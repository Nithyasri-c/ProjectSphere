import { useState } from 'react';
import * as api from '../../services/api';
import ConfirmationDialog from '../../components/ConfirmationDialog';

function ImportProjectData() {
    const [files, setFiles] = useState([]);
    const [loading, setLoading] = useState(false);
    const [results, setResults] = useState(null);
    const [dialog, setDialog] = useState({ isOpen: false, title: '', message: '', type: 'info' });

    const handleFileChange = (e) => {
        const selectedFiles = Array.from(e.target.files);
        setFiles(selectedFiles);
    };

    const handleImport = async (e) => {
        e.preventDefault();
        if (files.length === 0) {
            showDialog('Error', 'Please select at least one Excel file', 'danger');
            return;
        }

        setLoading(true);
        try {
            const response = await api.importProjectExcelFiles(files);
            setResults(response.data.data);
            showDialog('Success', response.data.message, 'success');
            setFiles([]);
            if (e.target.fileInput) e.target.fileInput.value = '';
        } catch (error) {
            showDialog('Error', error.response?.data?.message || 'Failed to import Excel files', 'danger');
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
                <h2 className="section-title">📥 Import Unified Project Data from Excel</h2>
                <p style={{ color: '#718096', marginTop: '8px' }}>
                    Import team names, student names, guide names, project titles, and COE from multiple Excel files
                </p>
            </div>

            <div className="card" style={{ padding: '24px', maxWidth: '800px' }}>
                <h3 style={{ marginBottom: '16px', color: '#2d3748' }}>📋 Excel File Requirements</h3>

                <div style={{ marginBottom: '20px', padding: '16px', background: '#f0f4ff', borderRadius: '8px' }}>
                    <p style={{ color: '#2d3748', marginBottom: '12px', fontSize: '14px', fontWeight: '500' }}>
                        The system will automatically extract the following fields:
                    </p>
                    <ul style={{ color: '#2d3748', fontSize: '14px', marginLeft: '20px', lineHeight: '1.8' }}>
                        <li><strong>Team Name</strong> - Batch/Team/Group identifier</li>
                        <li><strong>Student Names</strong> - Multiple student columns will be merged</li>
                        <li><strong>Guide Name</strong> - Internal Guide/Mentor/Supervisor</li>
                        <li><strong>Project Title</strong> - Project/Problem/Topic name</li>
                        <li><strong>COE/RC</strong> - Domain/Research Area/Center of Excellence</li>
                    </ul>

                    <div style={{ marginTop: '16px', padding: '12px', background: '#fff3cd', borderRadius: '6px', border: '1px solid #ffc107' }}>
                        <p style={{ fontSize: '13px', color: '#856404', margin: 0 }}>
                            <strong>Note:</strong> Column names can vary - the system uses intelligent pattern matching to detect fields.
                        </p>
                    </div>
                </div>



                <form onSubmit={handleImport}>
                    <div style={{ marginBottom: '20px' }}>
                        <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500', color: '#2d3748' }}>
                            Select Excel Files (1-10 files)
                        </label>
                        <input
                            type="file"
                            ref={(ref) => { if (ref) ref.id = 'fileInput'; }}
                            accept=".xlsx,.xls"
                            multiple
                            onChange={handleFileChange}
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
                        {files.length > 0 && (
                            <div style={{ marginTop: '12px' }}>
                                <p style={{ color: '#38a169', fontSize: '14px', fontWeight: '500', marginBottom: '8px' }}>
                                    ✓ {files.length} file(s) selected:
                                </p>
                                <ul style={{ fontSize: '13px', color: '#2d3748', marginLeft: '20px', lineHeight: '1.6' }}>
                                    {files.map((file, index) => (
                                        <li key={index}>{file.name}</li>
                                    ))}
                                </ul>
                            </div>
                        )}
                    </div>

                    <button
                        type="submit"
                        disabled={loading || files.length === 0}
                        className="btn btn-primary"
                        style={{ width: '100%', opacity: loading || files.length === 0 ? 0.6 : 1 }}
                    >
                        {loading ? 'Importing...' : `Import ${files.length} File(s)`}
                    </button>
                </form>

                {results && (
                    <div style={{ marginTop: '24px', padding: '16px', background: '#f7fafc', borderRadius: '8px' }}>
                        <h4 style={{ marginBottom: '16px', color: '#2d3748' }}>📊 Import Results</h4>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '16px' }}>
                            <div style={{ padding: '12px', background: '#d4edda', borderRadius: '6px' }}>
                                <p style={{ fontSize: '12px', color: '#155724', marginBottom: '4px' }}>Success</p>
                                <p style={{ fontSize: '20px', fontWeight: 'bold', color: '#155724' }}>{results.success}</p>
                            </div>
                            <div style={{ padding: '12px', background: '#f8d7da', borderRadius: '6px' }}>
                                <p style={{ fontSize: '12px', color: '#721c24', marginBottom: '4px' }}>Failed</p>
                                <p style={{ fontSize: '20px', fontWeight: 'bold', color: '#721c24' }}>{results.failed}</p>
                            </div>
                        </div>

                        {results.errors && results.errors.length > 0 && (
                            <div style={{ marginTop: '12px' }}>
                                <p style={{ fontSize: '14px', fontWeight: '500', marginBottom: '8px', color: '#e53e3e' }}>
                                    ✗ File Processing Errors:
                                </p>
                                <div style={{ maxHeight: '200px', overflowY: 'auto', padding: '12px', background: 'white', borderRadius: '6px', border: '1px solid #e2e8f0' }}>
                                    {results.errors.map((err, i) => (
                                        <p key={i} style={{ fontSize: '12px', color: '#e53e3e', marginBottom: '6px', lineHeight: '1.4' }}>
                                            <strong>{err.file || 'Unknown file'}</strong>: {err.error}
                                        </p>
                                    ))}
                                </div>
                            </div>
                        )}

                        {results.warnings && results.warnings.length > 0 && (
                            <div style={{ marginTop: '12px' }}>
                                <p style={{ fontSize: '14px', fontWeight: '500', marginBottom: '8px', color: '#ff9800' }}>
                                    ⚠ Record Warnings:
                                </p>
                                <div style={{ maxHeight: '300px', overflowY: 'auto', padding: '12px', background: 'white', borderRadius: '6px', border: '1px solid #e2e8f0' }}>
                                    {results.warnings.map((warn, i) => (
                                        <p key={i} style={{ fontSize: '12px', color: '#ff9800', marginBottom: '8px', lineHeight: '1.4' }}>
                                            <strong>{warn.teamName || 'Unknown team'}</strong> - {warn.projectTitle || 'No title'}
                                            <br />
                                            <span style={{ fontSize: '11px' }}>
                                                {warn.errors?.join(', ') || 'Unknown error'}
                                            </span>
                                        </p>
                                    ))}
                                </div>
                            </div>
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

export default ImportProjectData;
