import { useState, useEffect, useCallback } from 'react';
import * as api from '../../services/api';
import usePolling from '../../utils/usePolling';

function TimelineProgress({ batchId }) {
  const [timeline, setTimeline] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [submissionForm, setSubmissionForm] = useState({ driveLink: '', description: '' });
  const [submitting, setSubmitting] = useState(false);
  const [validationErrors, setValidationErrors] = useState([]);
  const [notification, setNotification] = useState(null);

  const fetchTimeline = useCallback(async () => {
    if (timeline.length === 0) setLoading(true);
    try {
      const res = await api.getTimelineForBatch(batchId);
      const newTimeline = res.data.data;
      setTimeline(newTimeline);
      // If student is viewing a specific event, keep it in sync with latest data
      setSelectedEvent(prev => {
        if (!prev) return prev;
        const updated = newTimeline.find(e => e._id === prev._id);
        return updated || prev;
      });
    } catch (error) {
      console.error('Failed to fetch timeline');
    } finally {
      setLoading(false);
    }
  }, [batchId, timeline.length]);

  useEffect(() => { fetchTimeline(); }, [fetchTimeline]);

  // Auto-poll every 20s: picks up guide feedback, marks, and new timeline events
  usePolling(fetchTimeline, 20000);

  const handleSubmit = async (e) => {
    e.preventDefault();
    console.log('🚀 Submitting Drive link...', submissionForm);

    if (!submissionForm.driveLink || !submissionForm.driveLink.trim()) {
      showNotification('Please enter a Google Drive link', 'danger');
      return;
    }
    setSubmitting(true);
    setValidationErrors([]);

    const data = {
      batchId,
      timelineEventId: selectedEvent._id,
      description: submissionForm.description,
      driveLink: submissionForm.driveLink
    };

    console.log('📤 Sending data:', data);

    try {
      const res = await api.createSubmission(data);
      console.log('✅ Submission response:', res.data);

      if (res.data.validation && !res.data.validation.isValid) {
        setValidationErrors(res.data.validation.errors);
        showNotification('Submission received, but format validation failed. Please check the errors below.', 'warning');
      } else {
        showNotification('✅ Drive link submitted successfully', 'success');
      }

      setSubmissionForm({ driveLink: '', description: '' });
      fetchTimeline();

      // Update selectedEvent with new submission data
      const timelineRes = await api.getTimelineForBatch(batchId);
      const updated = timelineRes.data.data.find(e => e._id === selectedEvent._id);
      setSelectedEvent(updated);
    } catch (error) {
      console.error('❌ Submission error:', error);
      console.error('❌ Error response:', error.response?.data);
      showNotification(error.response?.data?.message || 'Failed to submit', 'danger');
    } finally {
      setSubmitting(false);
    }
  };

  const showNotification = (message, type = 'info') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 4000);
  };

  const getStatusBadge = (status) => {
    const colors = {
      not_started: 'secondary',
      submitted: 'info',
      under_review: 'warning',
      needs_revision: 'warning',
      accepted: 'success',
      rejected: 'danger'
    };
    const labels = {
      not_started: 'Not Started',
      submitted: 'Submitted',
      under_review: 'Under Review',
      needs_revision: 'Needs Revision',
      accepted: 'Accepted',
      rejected: 'Rejected'
    };
    return <span className={`timeline-badge badge-${colors[status] || 'info'}`}>{labels[status] || status}</span>;
  };

  const getDeadlineStatus = (deadline) => {
    const now = new Date();
    const dl = new Date(deadline);
    const diff = (dl - now) / (1000 * 60 * 60 * 24);
    if (diff < 0) return { text: 'Past Due', color: '#ef4444' };
    if (diff < 3) return { text: `${Math.ceil(diff)} days left`, color: '#f59e0b' };
    return { text: `${Math.ceil(diff)} days left`, color: '#22c55e' };
  };

  if (loading && timeline.length === 0) return (
    <div style={{ padding: '20px' }}>
      {[1, 2, 3].map(i => (
        <div key={i} className="card" style={{ marginBottom: '15px', opacity: 0.5 }}>
          <div style={{ height: '18px', background: '#e2e8f0', borderRadius: '4px', width: '50%', marginBottom: '10px' }} />
          <div style={{ height: '12px', background: '#e2e8f0', borderRadius: '4px', width: '75%' }} />
        </div>
      ))}
    </div>
  );

  if (selectedEvent) {
    const submission = selectedEvent.submission;
    return (
      <div>
        <button className="btn btn-secondary" onClick={() => setSelectedEvent(null)} style={{ marginBottom: '20px' }}>← Back to Timeline</button>

        <div className="card" style={{ marginBottom: '20px', borderLeft: '4px solid #667eea' }}>
          <h2>{selectedEvent.title}</h2>
          <p style={{ color: '#666' }}>{selectedEvent.description}</p>
          <div style={{ display: 'flex', gap: '20px', marginTop: '15px' }}>
            <span><strong>📅 Deadline:</strong> {new Date(selectedEvent.deadline).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
            {selectedEvent.isMarksEnabled !== false && selectedEvent.isMarksEnabled !== 'false' && (
              <span><strong>🎯 Max Marks:</strong> {selectedEvent.maxMarks}</span>
            )}
            {getStatusBadge(selectedEvent.submissionStatus)}
            {selectedEvent.isMandatoryFormat && (
              <span className="timeline-badge badge-danger" title="Your submission must follow the college template">📏 Mandatory Format</span>
            )}
          </div>
          <div style={{ display: 'flex', gap: '15px', marginTop: '15px' }}>
            {selectedEvent.referenceFile && (
              <a href={selectedEvent.referenceFile.url} target="_blank" rel="noopener noreferrer" className="btn btn-secondary btn-sm" style={{ background: '#667eea', color: 'white', border: 'none' }}>
                📥 Download Template: {selectedEvent.referenceFile.name}
              </a>
            )}
          </div>
          {selectedEvent.submissionRequirements && (
            <div style={{ marginTop: '15px', padding: '10px', background: '#f8fafc', borderRadius: '8px' }}>
              <strong>📋 What to Submit:</strong><br />
              <span style={{ color: '#666' }}>{selectedEvent.submissionRequirements}</span>
            </div>
          )}
        </div>

        {(selectedEvent.isMarksEnabled !== false && selectedEvent.isMarksEnabled !== 'false') && submission?.marks !== null && submission?.marks !== undefined && (
          <div className="card" style={{ marginBottom: '20px', background: '#f0fdf4', border: '1px solid #22c55e' }}>
            <h3 style={{ color: '#22c55e' }}>✅ Marks Assigned</h3>
            <p style={{ fontSize: '24px', fontWeight: 'bold', color: '#22c55e' }}>{submission.marks} / {selectedEvent.maxMarks}</p>
          </div>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
          <div className="card">
            <h3>📄 Your Submissions</h3>
            {!submission?.versions?.length ? (
              <p style={{ color: '#888' }}>No submissions yet</p>
            ) : (
              <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
                {submission.versions.map((v, idx) => (
                  <div key={idx} style={{ padding: '10px', borderBottom: '1px solid #eee' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <strong>Submission {v.version}</strong>
                      <small>{new Date(v.submittedAt).toLocaleString()}</small>
                    </div>
                    {v.description && <p style={{ color: '#666', fontSize: '14px', margin: '5px 0' }}>{v.description}</p>}
                    {v.driveLink && <a href={v.driveLink} target="_blank" rel="noopener noreferrer" className="btn btn-secondary btn-sm">📁 View</a>}
                    {v.fileUrl && <a href={v.fileUrl} target="_blank" rel="noopener noreferrer" className="btn btn-secondary btn-sm">📁 View</a>}
                  </div>
                ))}
              </div>
            )}

            {selectedEvent.submissionStatus !== 'accepted' && (
              <form onSubmit={handleSubmit} style={{ marginTop: '20px', paddingTop: '15px', borderTop: '1px solid #eee' }}>
                <h4>{submission?.versions?.length ? 'Submit New Version' : 'Submit'}</h4>

                {validationErrors.length > 0 && (
                  <div style={{ marginBottom: '15px', padding: '12px', background: '#fff5f5', border: '1px solid #feb2b2', borderRadius: '6px' }}>
                    <strong style={{ color: '#c53030', display: 'block', marginBottom: '5px' }}>Format Validation Errors:</strong>
                    <ul style={{ margin: 0, paddingLeft: '20px', color: '#c53030', fontSize: '13px' }}>
                      {validationErrors.map((err, i) => <li key={i}>{err}</li>)}
                    </ul>
                  </div>
                )}

                <div className="form-group">
                  <label>Google Drive Link *</label>
                  <input
                    type="url"
                    value={submissionForm.driveLink}
                    onChange={(e) => setSubmissionForm({ ...submissionForm, driveLink: e.target.value })}
                    placeholder="https://drive.google.com/file/d/..."
                    required
                  />
                  <small style={{ color: '#666', display: 'block', marginTop: '5px' }}>
                    💡 Make sure the Drive link has "Anyone with the link can view" permission
                  </small>
                </div>
                <div className="form-group">
                  <label>Description</label>
                  <textarea value={submissionForm.description} onChange={(e) => setSubmissionForm({ ...submissionForm, description: e.target.value })} rows={2} placeholder="Brief description of changes..." />
                </div>
                <button type="submit" className="btn btn-primary" disabled={submitting}>{submitting ? 'Submitting...' : 'Submit'}</button>
              </form>
            )}
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div className="card" style={{ maxWidth: '100%', minWidth: '0', overflow: 'hidden' }}>
              <h3>💬 Guide Feedback</h3>
              {!submission?.comments?.length ? (
                <p style={{ color: '#888' }}>No feedback yet</p>
              ) : (
                <div style={{ maxHeight: '200px', overflowY: 'auto' }}>
                  {submission.comments.map((c, idx) => (
                    <div key={idx} style={{ padding: '10px', background: '#fef3c7', borderRadius: '8px', marginBottom: '10px', maxWidth: '100%', minWidth: '0', wordWrap: 'break-word', overflowWrap: 'break-word', overflow: 'hidden', wordBreak: 'break-word', whiteSpace: 'pre-wrap' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px', minWidth: '0' }}>
                        <strong style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>👨‍🏫 {c.guideId?.name || 'Guide'}</strong>
                        <small style={{ whiteSpace: 'nowrap', marginLeft: '10px' }}>{new Date(c.createdAt).toLocaleString()}</small>
                      </div>
                      <p style={{ margin: '0', color: '#92400e', maxWidth: '100%', wordWrap: 'break-word', overflowWrap: 'break-word', whiteSpace: 'pre-wrap', wordBreak: 'break-word', minWidth: '0' }}>{c.comment}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {submission?.adminRemarks?.length > 0 && (
              <div className="card" style={{ background: '#f0f9ff', borderColor: '#bae6fd' }}>
                <h3 style={{ color: '#0369a1' }}>🛡️ Admin Feedback</h3>
                <div style={{ maxHeight: '150px', overflowY: 'auto' }}>
                  {submission.adminRemarks
                    .filter((r, idx, self) =>
                      idx === self.findIndex((t) => (
                        t.remark === r.remark && (new Date(t.createdAt) - new Date(r.createdAt)) < 60000 && (new Date(t.createdAt) - new Date(r.createdAt)) > -60000
                      ))
                    )
                    .map((r, idx) => (
                      <div key={idx} style={{ padding: '10px', borderBottom: idx !== submission.adminRemarks.length - 1 ? '1px solid #e0f2fe' : 'none' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
                          <strong style={{ color: '#0c4a6e' }}>🛡️ {r.adminId?.name || 'Admin'}</strong>
                          <small style={{ color: '#64748b' }}>{new Date(r.createdAt).toLocaleString()}</small>
                        </div>
                        <p style={{ margin: '0', color: '#0c4a6e', fontSize: '14px', whiteSpace: 'pre-wrap' }}>{r.remark}</p>
                      </div>
                    ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      {notification && (
        <div style={{
          position: 'fixed',
          top: '20px',
          right: '20px',
          padding: '14px 20px',
          borderRadius: '8px',
          fontWeight: '600',
          fontSize: '14px',
          zIndex: 9999,
          animation: 'slideIn 0.3s ease',
          backgroundColor: notification.type === 'success' ? '#d1fae5' : notification.type === 'danger' ? '#fee2e2' : notification.type === 'warning' ? '#fef3c7' : '#dbeafe',
          color: notification.type === 'success' ? '#065f46' : notification.type === 'danger' ? '#991b1b' : notification.type === 'warning' ? '#92400e' : '#1e40af',
          border: `1px solid ${notification.type === 'success' ? '#a7f3d0' : notification.type === 'danger' ? '#fca5a5' : notification.type === 'warning' ? '#fde68a' : '#bfdbfe'}`,
          boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
        }}>
          {notification.message}
        </div>
      )}

      <style>{`
        @keyframes slideIn {
          from { transform: translateX(400px); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
      `}</style>

      <h2 className="section-title">📅 Project Timeline</h2>
      <p style={{ color: '#666', marginBottom: '20px' }}>Track deadlines, submit documents, and view feedback</p>

      {timeline.length === 0 ? (
        <div className="card empty-state"><h3>No Timeline Events</h3><p>Timeline events will appear here once admin creates them</p></div>
      ) : (
        <div className="timeline-list">
          {timeline.map((event, idx) => {
            const deadlineStatus = getDeadlineStatus(event.deadline);
            const isMarksEnabled = event.isMarksEnabled !== false && event.isMarksEnabled !== 'false';
            const progress = (isMarksEnabled && event.marks !== null) ? (event.marks / event.maxMarks * 100) : (event.submissionStatus === 'accepted' ? 100 : event.submissionStatus === 'submitted' ? 50 : 0);

            return (
              <div key={event._id} className="card" style={{ marginBottom: '15px', borderLeft: `4px solid ${event.submissionStatus === 'accepted' ? '#22c55e' : '#667eea'}`, cursor: 'pointer' }} onClick={() => setSelectedEvent(event)}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '15px', flex: 1 }}>
                    <span style={{
                      background: event.submissionStatus === 'accepted' ? '#22c55e' : '#667eea',
                      color: 'white',
                      borderRadius: '50%',
                      width: '32px',
                      height: '32px',
                      minWidth: '32px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: 'bold',
                      fontSize: '14px',
                      marginTop: '2px'
                    }}>{idx + 1}</span>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap', marginBottom: '5px' }}>
                        <h3 style={{ margin: 0, fontSize: '18px' }}>{event.title}</h3>
                        {getStatusBadge(event.submissionStatus)}
                      </div>
                      <p style={{ color: '#666', fontSize: '14px', margin: '5px 0' }}>{event.description}</p>
                    </div>
                  </div>
                  <div style={{ textAlign: 'right', marginLeft: '15px' }}>
                    <div style={{ color: deadlineStatus.color, fontWeight: '500' }}>{deadlineStatus.text}</div>
                    <small style={{ color: '#888' }}>{new Date(event.deadline).toLocaleDateString()}</small>
                    {(event.isMarksEnabled !== false && event.isMarksEnabled !== 'false') && event.marks !== null && <div style={{ color: '#22c55e', fontWeight: 'bold', marginTop: '5px' }}>{event.marks}/{event.maxMarks}</div>}
                  </div>
                </div>
                <div style={{ marginTop: '10px', background: '#e5e7eb', borderRadius: '4px', height: '6px', overflow: 'hidden' }}>
                  <div style={{ width: `${progress}%`, height: '100%', background: event.submissionStatus === 'accepted' ? '#22c55e' : '#667eea', transition: 'width 0.3s' }}></div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default TimelineProgress;

