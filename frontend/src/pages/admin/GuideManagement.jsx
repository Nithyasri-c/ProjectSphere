import { useState, useEffect } from 'react';
import * as api from '../../services/api';
import ConfirmationDialog from '../../components/ConfirmationDialog';

function GuideManagement() {
  const [guides, setGuides] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({ name: '', email: '', password: '' });
  const [saving, setSaving] = useState(false);
  const [dialog, setDialog] = useState({ isOpen: false, title: '', message: '', type: 'info', onConfirm: null });

  const fetchGuides = async () => {
    try {
      const res = await api.getAllGuides();
      setGuides(res.data.data);
    } catch (error) {
      console.error('Failed to fetch guides');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGuides();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.createGuide(formData);
      setFormData({ name: '', email: '', password: '' });
      setShowModal(false);
      fetchGuides();
    } catch (error) {
      showDialog('Error', error.response?.data?.message || 'Failed to create guide', 'danger');
    } finally {
      setSaving(false);
    }
  };

  const showDialog = (title, message, type = 'info') => {
    setDialog({
      isOpen: true,
      title,
      message,
      type,
      onConfirm: () => {
        setDialog({ ...dialog, isOpen: false });
      }
    });
  };

  if (loading) return <div>Loading...</div>;

  return (
    <div>
      <div className="section-header">
        <h2 className="section-title">👨‍🏫 Guide Management</h2>
        <button className="btn btn-primary" onClick={() => setShowModal(true)}>
          + Add Guide
        </button>
      </div>

      {guides.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '40px', color: '#718096' }}>
          <p>No guides created yet. Click "Add Guide" to create one.</p>
        </div>
      ) : (
        <table className="data-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Assigned Batches</th>
              <th>Max Batches</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {guides.map((guide) => (
              <tr key={guide._id}>
                <td><strong>{guide.name}</strong></td>
                <td>{guide.email}</td>
                <td>{guide.assignedBatches}</td>
                <td>{guide.maxBatches}</td>
                <td>
                  <span className={`badge ${guide.assignedBatches >= guide.maxBatches ? 'badge-danger' : 'badge-success'}`}>
                    {guide.assignedBatches >= guide.maxBatches ? 'Full' : 'Available'}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h3>Add New Guide</h3>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>Full Name</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  placeholder="Dr. John Smith"
                  required
                />
              </div>
              <div className="form-group">
                <label>Email</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                  placeholder="guide@university.edu"
                  required
                />
              </div>
              <div className="form-group">
                <label>Password</label>
                <input
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({...formData, password: e.target.value})}
                  placeholder="Minimum 6 characters"
                  required
                  minLength={6}
                />
              </div>
              <div className="modal-actions">
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={saving}>
                  {saving ? 'Creating...' : 'Create Guide'}
                </button>
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
        onCancel={dialog.onConfirm}
      />
    </div>
  );
}

export default GuideManagement;

