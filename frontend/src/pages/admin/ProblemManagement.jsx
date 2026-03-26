import { useState, useEffect } from 'react';
import * as api from '../../services/api';
import ConfirmationDialog from '../../components/ConfirmationDialog';

function ProblemManagement() {
  const [problems, setProblems] = useState([]);
  const [coes, setCOEs] = useState([]);
  const [guides, setGuides] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({ coeId: '', title: '', description: '', year: new Date().getFullYear(), guideId: '', datasetUrl: '', researchArea: '' });
  const [saving, setSaving] = useState(false);
  const [dialog, setDialog] = useState({ isOpen: false, title: '', message: '', type: 'info', onConfirm: null });
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredProblems, setFilteredProblems] = useState([]);

  const fetchData = async () => {
    try {
      const [problemsRes, coesRes, guidesRes] = await Promise.all([
        api.getAllProblems(),
        api.getAllCOEs(),
        api.getAllGuides()
      ]);
      setProblems(problemsRes.data.data);
      setFilteredProblems(problemsRes.data.data);
      setCOEs(coesRes.data.data);
      setGuides(guidesRes.data.data);
    } catch (error) {
      console.error('Failed to fetch data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleSearch = async (value) => {
    setSearchTerm(value);

    if (!value.trim()) {
      setFilteredProblems(problems);
      return;
    }

    try {
      const response = await api.searchProblems(value);
      setFilteredProblems(response.data.data || []);
    } catch (error) {
      console.error('Error searching problems:', error);
      // Fallback to local filtering
      const filtered = problems.filter(problem =>
        problem.title.toLowerCase().includes(value.toLowerCase()) ||
        problem.description?.toLowerCase().includes(value.toLowerCase())
      );
      setFilteredProblems(filtered);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate all required fields
    if (!formData.title || !formData.title.trim()) {
      showDialog('Validation Error', 'Please enter a Title', 'danger');
      return;
    }
    if (!formData.coeId || !formData.coeId.trim()) {
      showDialog('Validation Error', 'Please select a COE / RC', 'danger');
      return;
    }
    if (!formData.guideId || !formData.guideId.trim()) {
      showDialog('Validation Error', 'Please select a Guide', 'danger');
      return;
    }
    if (!formData.year) {
      showDialog('Validation Error', 'Please enter a Year', 'danger');
      return;
    }
    if (!formData.description || !formData.description.trim()) {
      showDialog('Validation Error', 'Please enter a Description', 'danger');
      return;
    }
    if (!formData.researchArea || !formData.researchArea.trim()) {
      showDialog('Validation Error', 'Please enter a Research Area', 'danger');
      return;
    }
    
    setSaving(true);
    try {
      await api.createProblem(formData);
      setFormData({ coeId: '', title: '', description: '', year: new Date().getFullYear(), guideId: '', datasetUrl: '', researchArea: '' });
      setShowModal(false);
      setSearchTerm('');
      fetchData();
    } catch (error) {
      showDialog('Error', error.response?.data?.message || 'Failed to create problem', 'danger');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    showDialog('Delete Problem', 'Are you sure you want to delete this problem?', 'danger', async () => {
      try {
        await api.deleteProblem(id);
        fetchData();
      } catch (error) {
        showDialog('Error', 'Failed to delete problem', 'danger');
      }
    });
  };

  const showDialog = (title, message, type = 'info', onConfirm = null) => {
    setDialog({
      isOpen: true,
      title,
      message,
      type,
      onConfirm: () => {
        if (onConfirm) onConfirm();
        setDialog({ ...dialog, isOpen: false });
      },
      confirmText: onConfirm ? (type === 'danger' ? 'Delete' : 'Yes') : 'OK',
      cancelText: onConfirm ? 'Cancel' : 'OK'
    });
  };

  if (loading) return <div>Loading...</div>;

  return (
    <div>
      <div className="section-header">
        <h2 className="section-title">📋 Problem Statements</h2>
        <button className="btn btn-primary" onClick={() => setShowModal(true)}>
          + Add Problem
        </button>
      </div>

      {problems.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '40px', color: '#718096' }}>
          <p>No problems created yet. Click "Add Problem" to create one.</p>
        </div>
      ) : (
        <>
          <div style={{ marginBottom: '20px' }}>
            <input
              type="text"
              placeholder="Search problems by title or description..."
              value={searchTerm}
              onChange={(e) => handleSearch(e.target.value)}
              style={{
                width: '100%',
                padding: '10px 12px',
                borderRadius: '4px',
                border: '1px solid #cbd5e0',
                fontSize: '14px',
                boxSizing: 'border-box'
              }}
            />
          </div>
          <div style={{ overflowX: 'auto' }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Title</th>
                  <th style={{ width: "120px" }}>COE/RC</th>
                  <th>Guide</th>
                  <th>Year</th>
                  <th>Selected</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredProblems.map((problem) => (
                  <tr key={problem._id}>
                    <td><strong>{problem.title}</strong></td>
                    <td>{problem.coeId?.name || '-'}</td>
                    <td>{problem.guideId?.name || '-'}</td>
                    <td>{problem.year}</td>
                    <td>
                      <span className={`badge ${problem.selectedBatchCount >= problem.maxBatches ? 'badge-danger' : 'badge-success'}`}>
                        {problem.selectedBatchCount}/{problem.maxBatches}
                      </span>
                    </td>
                    <td>
                      <button className="btn btn-danger" style={{ padding: '6px 12px', fontSize: '12px' }} onClick={() => handleDelete(problem._id)}>
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h3>Add New Problem Statement</h3>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>Title <span style={{ color: 'red' }}>*</span></label>
                <input type="text" value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })} required />
              </div>
              <div className="form-group">
                <label>COE / RC <span style={{ color: 'red' }}>*</span></label>
                <select value={formData.coeId} onChange={(e) => setFormData({ ...formData, coeId: e.target.value })} required>
                  <option value="">Select COE / RC</option>
                  {coes.map((coe) => (<option key={coe._id} value={coe._id}>{coe.name}</option>))}
                </select>
              </div>
              <div className="form-group">
                <label>Assigned Guide <span style={{ color: 'red' }}>*</span></label>
                <select value={formData.guideId} onChange={(e) => setFormData({ ...formData, guideId: e.target.value })} required>
                  <option value="">Select Guide</option>
                  {guides.map((guide) => (<option key={guide._id} value={guide._id}>{guide.name} ({guide.assignedBatches}/{guide.maxBatches})</option>))}
                </select>
              </div>
              <div className="form-group">
                <label>Year <span style={{ color: 'red' }}>*</span></label>
                <input type="number" value={formData.year} onChange={(e) => setFormData({ ...formData, year: parseInt(e.target.value) })} required />
              </div>
              <div className="form-group">
                <label>Description <span style={{ color: 'red' }}>*</span></label>
                <textarea value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} rows={3} required />
              </div>
              <div className="form-group">
                <label>Research Area <span style={{ color: 'red' }}>*</span></label>
                <input type="text" value={formData.researchArea} onChange={(e) => setFormData({ ...formData, researchArea: e.target.value })} placeholder="e.g., Machine Learning, IoT, Data Science" required />
              </div>
              <div className="form-group">
                <label>Dataset URL (optional)</label>
                <input type="url" value={formData.datasetUrl} onChange={(e) => setFormData({ ...formData, datasetUrl: e.target.value })} placeholder="https://..." />
              </div>
              <div className="modal-actions">
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? 'Creating...' : 'Create Problem'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      <ConfirmationDialog
        isOpen={dialog.isOpen}
        title={dialog.title}
        message={dialog.message}
        type={dialog.type}
        onConfirm={dialog.onConfirm}
        onCancel={() => setDialog({ ...dialog, isOpen: false })}
        confirmText={dialog.confirmText}
        cancelText={dialog.cancelText}
      />
    </div>
  );
}

export default ProblemManagement;

