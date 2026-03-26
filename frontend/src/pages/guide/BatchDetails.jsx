import { useState, useEffect } from 'react';
import * as api from '../../services/api';

const YEAR_LABELS = {
  '2nd': '2nd - Real Time Project',
  '3rd': '3rd - Mini Project',
  '4th': '4th - Major Project'
};

function BatchDetails({ batchId, onBack }) {
  const [batch, setBatch] = useState(null);
  const [updates, setUpdates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newComment, setNewComment] = useState({});
  const [submitting, setSubmitting] = useState(null);
  const [statusUpdating, setStatusUpdating] = useState(false);

  const fetchData = async () => {
    try {
      const [batchRes, updatesRes] = await Promise.all([
        api.getBatch(batchId),
        api.getProgressUpdates(batchId)
      ]);
      setBatch(batchRes.data.data);
      setUpdates(updatesRes.data.data);
    } catch (error) {
      console.error('Failed to fetch data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [batchId]);

  const handleAddComment = async (updateId) => {
    if (!newComment[updateId]?.trim()) return;
    setSubmitting(updateId);
    try {
      await api.addComment(updateId, newComment[updateId]);
      setNewComment({ ...newComment, [updateId]: '' });
      fetchData();
    } catch (error) {
      alert('Failed to add comment');
    } finally {
      setSubmitting(null);
    }
  };

  const handleStatusChange = async (newStatus) => {
    setStatusUpdating(true);
    try {
      await api.updateBatchStatus(batchId, newStatus);
      fetchData();
    } catch (error) {
      alert('Failed to update status');
    } finally {
      setStatusUpdating(false);
    }
  };

  if (loading) return <div className="loading">Loading...</div>;
  if (!batch) return <div>Batch not found</div>;

  return (
    <div>
      <button onClick={onBack} className="btn btn-secondary" style={{ marginBottom: '20px' }}>
        ← Back to Dashboard
      </button>

      <div className="card" style={{ marginBottom: '20px' }}>
        <div className="flex-between">
          <div>
            <h2 style={{ color: '#2d3748', marginBottom: '10px', lineHeight: '1.4', fontSize: '20px' }}>👥 {batch.teamName}</h2>
            <p style={{ color: '#718096', marginBottom: '8px', lineHeight: '1.6', fontSize: '15px' }}>Leader: {batch.leaderStudentId?.name}</p>
            <p style={{ color: '#667eea', fontWeight: '500', fontSize: '14px', lineHeight: '1.6' }}>{batch.year ? YEAR_LABELS[batch.year] : 'Year Not Set'}</p>
          </div>
          <div>
            <label style={{ fontSize: '14px', color: '#718096', display: 'block', marginBottom: '8px' }}>Update Status:</label>
            <select
              value={batch.status}
              onChange={(e) => handleStatusChange(e.target.value)}
              disabled={statusUpdating}
              style={{ padding: '8px 16px', borderRadius: '8px', border: '2px solid #e2e8f0' }}
            >
              <option value="Not Started">Not Started</option>
              <option value="In Progress">In Progress</option>
              <option value="Completed">Completed</option>
            </select>
          </div>
        </div>
      </div>

      <div className="grid grid-2" style={{ marginBottom: '20px' }}>
        <div className="card">
          <h3 style={{ marginBottom: '16px', color: '#2d3748' }}>📋 Problem Details</h3>
          <h4 style={{ color: '#667eea', marginBottom: '10px', fontSize: '16px', lineHeight: '1.6' }}>{batch.problemId?.title || 'Not Assigned'}</h4>
          <p style={{ color: '#718096', fontSize: '14px', marginBottom: '16px', lineHeight: '1.7' }}>{batch.problemId?.description}</p>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginTop: '15px', borderTop: '1px solid #edf2f7', paddingTop: '15px' }}>
            <div>
              <p style={{ fontSize: '12px', color: '#a0aec0', marginBottom: '4px', textTransform: 'uppercase', fontWeight: 'bold' }}>Research Area</p>
              <p style={{ fontSize: '14px', color: '#2d3748' }}>{batch.problemId?.researchArea || batch.researchArea || 'N/A'}</p>
            </div>
            <div>
              <p style={{ fontSize: '12px', color: '#a0aec0', marginBottom: '4px', textTransform: 'uppercase', fontWeight: 'bold' }}>COE / RC</p>
              <p style={{ fontSize: '14px', color: '#2d3748' }}>
                {batch.problemId?.coeId?.name || batch.coe?.name || batch.coeId?.name || 'N/A'}
                {batch.rc?.name && batch.rc.name !== '--' && `, ${batch.rc.name}`}
              </p>
            </div>
          </div>
        </div>

        <div className="card">
          <h3 style={{ marginBottom: '16px', color: '#2d3748' }}>👥 Team Members</h3>
          {batch.leaderStudentId || batch.teamMembers?.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {batch.leaderStudentId && (
                <div style={{ background: '#e6f2ff', padding: '10px 14px', borderRadius: '8px', fontSize: '14px', borderLeft: '3px solid #667eea', lineHeight: '1.6' }}>
                  <strong>{batch.leaderStudentId.name}</strong> - {batch.leaderStudentId.rollNumber || batch.leaderStudentId.rollNo || 'N/A'} ({batch.branch || 'N/A'}-{batch.section || 'N/A'}) <em style={{ color: '#667eea', fontSize: '12px' }}>(Leader)</em>
                </div>
              )}
              {batch.teamMembers?.filter(member => member.rollNo !== (batch.leaderStudentId?.rollNumber || batch.leaderStudentId?.rollNo)).map((member) => (
                <div key={member._id} style={{ background: '#f7fafc', padding: '10px 14px', borderRadius: '8px', fontSize: '14px', lineHeight: '1.6' }}>
                  <strong>{member.name}</strong> - {member.rollNo} ({batch.branch || 'N/A'}-{batch.section || 'N/A'})
                </div>
              ))}
            </div>
          ) : (
            <p style={{ color: '#718096', lineHeight: '1.7' }}>No team members added</p>
          )}
        </div>
      </div>
    </div>
  );
}

export default BatchDetails;

