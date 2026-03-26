import { useState, useEffect } from 'react';
import * as api from '../../services/api';

function ProgressUpdates({ batchId }) {
  const [updates, setUpdates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({ description: '', fileUrl: '' });
  const [saving, setSaving] = useState(false);

  const fetchUpdates = async () => {
    try {
      const res = await api.getProgressUpdates(batchId);
      setUpdates(res.data.data);
    } catch (error) {
      console.error('Failed to fetch updates');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUpdates();
  }, [batchId]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.createProgressUpdate(formData);
      setFormData({ description: '', fileUrl: '' });
      setShowForm(false);
      fetchUpdates();
    } catch (error) {
      alert(error.response?.data?.message || 'Failed to add update');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div>Loading updates...</div>;

  return (
    <div>
      <div className="flex-between" style={{ marginBottom: '20px' }}>
        <h2 className="section-title">📝 Progress Updates</h2>
        <button className="btn btn-primary" onClick={() => setShowForm(!showForm)}>
          {showForm ? 'Cancel' : '+ Add Update'}
        </button>
      </div>

      {showForm && (
        <div className="card" style={{ marginBottom: '20px', background: '#f7fafc' }}>
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label>Description</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Describe your progress..."
                rows={4}
                required
              />
            </div>
            <div className="form-group">
              <label>File URL (Optional)</label>
              <input
                type="url"
                value={formData.fileUrl}
                onChange={(e) => setFormData({ ...formData, fileUrl: e.target.value })}
                placeholder="https://drive.google.com/..."
              />
            </div>
            <button type="submit" className="btn btn-success" disabled={saving}>
              {saving ? 'Submitting...' : 'Submit Update'}
            </button>
          </form>
        </div>
      )}

      {updates.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">📝</div>
          <h3>No Updates Yet</h3>
          <p>Add your first progress update</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {updates.map((update) => (
            <div key={update._id} className="card">
              <div className="flex-between" style={{ marginBottom: '12px' }}>
                <span style={{ color: '#718096', fontSize: '14px' }}>
                  📅 {new Date(update.date).toLocaleDateString('en-US', {
                    year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit'
                  })}
                </span>
                {update.fileUrl && (
                  <a href={update.fileUrl} target="_blank" rel="noopener noreferrer" className="btn btn-secondary" style={{ fontSize: '12px', padding: '6px 12px' }}>
                    📁 View
                  </a>
                )}
              </div>
              <p style={{ color: '#2d3748', lineHeight: 1.6 }}>{update.description}</p>

              {update.commentThread?.length > 0 && (
                <div style={{ marginTop: '16px', paddingTop: '16px', borderTop: '1px solid #e2e8f0' }}>
                  <h4 style={{ fontSize: '14px', color: '#718096', marginBottom: '12px' }}>💬 Guide Comments</h4>
                  {update.commentThread.map((comment, idx) => (
                    <div key={idx} style={{ background: '#f7fafc', padding: '12px', borderRadius: '8px', marginBottom: '8px' }}>
                      <div style={{ fontSize: '12px', color: '#667eea', fontWeight: '600', marginBottom: '4px' }}>
                        {comment.guideId?.name} • {new Date(comment.date).toLocaleDateString()}
                      </div>
                      <p style={{ color: '#2d3748', fontSize: '14px' }}>{comment.comment}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default ProgressUpdates;

