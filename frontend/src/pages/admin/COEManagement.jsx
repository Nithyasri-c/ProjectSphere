import { useState, useEffect } from 'react';
import * as api from '../../services/api';
import ConfirmationDialog from '../../components/ConfirmationDialog';

function COEManagement() {
  const [coes, setCOEs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({ name: '', description: '' });
  const [saving, setSaving] = useState(false);
  const [dialog, setDialog] = useState({ isOpen: false, title: '', message: '', type: 'info', onConfirm: null });

  const fetchCOEs = async () => {
    try {
      const res = await api.getAllCOEs();
      setCOEs(res.data.data);
    } catch (error) {
      console.error('Failed to fetch COEs');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCOEs();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.createCOE(formData);
      setFormData({ name: '', description: '' });
      setShowModal(false);
      fetchCOEs();
    } catch (error) {
      showDialog('Error', error.response?.data?.message || 'Failed to create COE', 'danger');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    showDialog('Delete COE', 'Are you sure you want to delete this COE?', 'danger', async () => {
      try {
        await api.deleteCOE(id);
        fetchCOEs();
      } catch (error) {
        showDialog('Error', 'Failed to delete COE', 'danger');
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
        <h2 className="section-title">🏛️ COE Management</h2>
        <button className="btn btn-primary" onClick={() => setShowModal(true)}>
          + Add COE
        </button>
      </div>

      {coes.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '40px', color: '#718096' }}>
          <p>No COEs created yet. Click "Add COE" to create one.</p>
        </div>
      ) : (
        <table className="data-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Description</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {coes.map((coe) => (
              <tr key={coe._id}>
                <td><strong>{coe.name}</strong></td>
                <td>{coe.description || '-'}</td>
                <td>
                  <button className="btn btn-danger" style={{ padding: '6px 12px', fontSize: '12px' }} onClick={() => handleDelete(coe._id)}>
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h3>Add New COE</h3>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>COE Name</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  placeholder="e.g., Artificial Intelligence"
                  required
                />
              </div>
              <div className="form-group">
                <label>Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  placeholder="Brief description..."
                  rows={3}
                />
              </div>
              <div className="modal-actions">
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={saving}>
                  {saving ? 'Creating...' : 'Create COE'}
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
        onCancel={() => setDialog({ ...dialog, isOpen: false })}
        confirmText={dialog.confirmText}
        cancelText={dialog.cancelText}
      />
    </div>
  );
}

export default COEManagement;

