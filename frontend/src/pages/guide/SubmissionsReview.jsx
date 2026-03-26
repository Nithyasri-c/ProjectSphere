import { useState, useEffect } from 'react';
import * as api from '../../services/api';
import ConfirmationDialog from '../../components/ConfirmationDialog';

function SubmissionsReview() {
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedSubmission, setSelectedSubmission] = useState(null);
  const [comment, setComment] = useState('');
  const [marks, setMarks] = useState('');
  const [dialog, setDialog] = useState({ isOpen: false, title: '', message: '', type: 'info', onConfirm: null });

  const fetchSubmissions = async () => {
    try {
      const res = await api.getGuideSubmissions();
      setSubmissions(res.data.data);
    } catch (error) {
      console.error('Failed to fetch submissions');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchSubmissions(); }, []);



  const handleAddComment = async () => {
    if (!comment.trim()) {
      showDialog('Error', 'Please enter a comment', 'danger');
      return;
    }
    try {
      await api.addSubmissionComment(selectedSubmission._id, comment);
      const res = await api.getSubmission(selectedSubmission._id);
      setSelectedSubmission(res.data.data);
      setComment('');
      showDialog('Success', 'Comment added successfully', 'success');
    } catch (error) {
      console.error('Error adding comment:', error);
      showDialog('Error', error.response?.data?.message || 'Failed to add comment', 'danger');
    }
  };

  const handleAssignMarks = async (status) => {
    const isMarksDisabled = selectedSubmission.timelineEventId?.isMarksEnabled === false || selectedSubmission.timelineEventId?.isMarksEnabled === 'false';
    const isMarksEnabled = !isMarksDisabled;
    if (isMarksEnabled && !marks && status === 'accepted') {
      showDialog('Error', 'Please enter marks', 'danger');
      return;
    }
    try {
      console.log('Assigning marks:', { submissionId: selectedSubmission._id, marks: parseFloat(marks) || 0, status, comment });
      const res = await api.assignSubmissionMarks(selectedSubmission._id, parseFloat(marks) || 0, status, comment);
      console.log('Marks assigned response:', res.data);

      // Refresh data after assignment
      await new Promise(resolve => setTimeout(resolve, 500)); // Wait 500ms for backend to sync
      const updatedRes = await api.getSubmission(selectedSubmission._id);
      setSelectedSubmission(updatedRes.data.data);

      // Also refresh the list
      await fetchSubmissions();
      setMarks('');
      setComment(''); // Clear comment after successful action
    } catch (error) {
      console.error('Error assigning marks:', error);
      showDialog('Error', error.response?.data?.message || 'Failed to assign marks', 'danger');
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

  const getStatusBadge = (status) => {
    const colors = {
      not_started: 'secondary', submitted: 'info', under_review: 'warning',
      needs_revision: 'warning', accepted: 'success', rejected: 'danger'
    };
    const labels = {
      not_started: 'Not Started', submitted: 'Submitted', under_review: 'Under Review',
      needs_revision: 'Needs Revision', accepted: 'Accepted', rejected: 'Rejected'
    };
    return <span className={`badge badge-${colors[status] || 'info'}`}>{labels[status] || status}</span>;
  };

  if (loading) return <div>Loading submissions...</div>;

  if (selectedSubmission) {
    return (
      <div className="tab-content">
        <button className="btn btn-secondary" onClick={() => setSelectedSubmission(null)} style={{ marginBottom: '20px' }}>← Back</button>

        <div className="card" style={{ marginBottom: '20px' }}>
          <h2>📝 {selectedSubmission.timelineEventId?.title}</h2>
          <div style={{ display: 'flex', gap: '15px', marginTop: '10px' }}>
            <span><strong>Team:</strong> {selectedSubmission.batchId?.teamName}</span>
            <span><strong>Class:</strong> {selectedSubmission.batchId?.year} {selectedSubmission.batchId?.branch}-{selectedSubmission.batchId?.section}</span>
            {(selectedSubmission.timelineEventId?.isMarksEnabled !== false && selectedSubmission.timelineEventId?.isMarksEnabled !== 'false') && (
              <span><strong>🎯 Max Marks:</strong> {selectedSubmission.timelineEventId?.maxMarks}</span>
            )}
            {getStatusBadge(selectedSubmission.status)}
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
          <div className="card">
            <h3>📄 Submission History</h3>
            {selectedSubmission.versions?.length === 0 ? (
              <p style={{ color: '#888' }}>No submissions yet</p>
            ) : (
              <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
                {selectedSubmission.versions?.map((v, idx) => (
                  <div key={idx} style={{ padding: '10px', borderBottom: '1px solid #eee' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <strong>Submission {v.version}</strong>
                      <small>{new Date(v.submittedAt).toLocaleString()}</small>
                    </div>
                    {v.description && <p style={{ color: '#666', fontSize: '14px', margin: '5px 0' }}>{v.description}</p>}
                    <div style={{ marginTop: '8px', display: 'flex', gap: '8px' }}>
                      {v.driveLink && <a href={v.driveLink} target="_blank" rel="noopener noreferrer" className="btn btn-secondary btn-sm">📁 View</a>}
                      {v.fileUrl && <a href={v.fileUrl} target="_blank" rel="noopener noreferrer" className="btn btn-secondary btn-sm">📁 View</a>}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div className="card" style={{ maxWidth: '100%', minWidth: '0', overflow: 'hidden' }}>
              <h3>💬 Comments & Feedback</h3>
              <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
                {selectedSubmission.comments?.length === 0 ? (
                  <p style={{ color: '#888' }}>No comments yet</p>
                ) : (
                  selectedSubmission.comments?.map((c, idx) => (
                    <div key={idx} style={{ padding: '10px', background: '#f8fafc', borderRadius: '8px', marginBottom: '10px', maxWidth: '100%', minWidth: '0', wordWrap: 'break-word', overflowWrap: 'break-word', overflow: 'hidden', wordBreak: 'break-word', whiteSpace: 'pre-wrap' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px', minWidth: '0' }}>
                        <strong style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.guideId?.name}</strong>
                        <small style={{ whiteSpace: 'nowrap', marginLeft: '10px' }}>{new Date(c.createdAt).toLocaleString()}</small>
                      </div>
                      <p style={{ margin: '0', color: '#333', maxWidth: '100%', wordWrap: 'break-word', overflowWrap: 'break-word', whiteSpace: 'pre-wrap', wordBreak: 'break-word', minWidth: '0' }}>{c.comment}</p>
                    </div>
                  ))
                )}
              </div>
            </div>

            {selectedSubmission.adminRemarks?.length > 0 && (
              <div className="card" style={{ background: '#f0f9ff', borderColor: '#bae6fd' }}>
                <h3 style={{ color: '#0369a1' }}>🛡️ Admin Feedback</h3>
                <div style={{ maxHeight: '150px', overflowY: 'auto' }}>
                  {selectedSubmission.adminRemarks
                    .filter((r, idx, self) =>
                      idx === self.findIndex((t) => (
                        t.remark === r.remark && (new Date(t.createdAt) - new Date(r.createdAt)) < 60000 && (new Date(t.createdAt) - new Date(r.createdAt)) > -60000
                      ))
                    )
                    .map((r, idx) => (
                      <div key={idx} style={{ padding: '10px', borderBottom: idx !== selectedSubmission.adminRemarks.length - 1 ? '1px solid #e0f2fe' : 'none' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
                          <strong style={{ color: '#0c4a6e' }}>{r.adminId?.name || 'Admin'}</strong>
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

        {(selectedSubmission.status === 'submitted' || selectedSubmission.status === 'under_review') && (
          <div className="card" style={{ marginTop: '20px' }}>
            <h3>🎯 {(selectedSubmission.timelineEventId?.isMarksEnabled === false || selectedSubmission.timelineEventId?.isMarksEnabled === 'false') ? 'Review Decision' : 'Assign Marks'}</h3>
            {(selectedSubmission.timelineEventId?.isMarksEnabled !== false && selectedSubmission.timelineEventId?.isMarksEnabled !== 'false') && (
              <>
                <p style={{ color: '#666', marginBottom: '15px' }}>Max Marks: {selectedSubmission.timelineEventId?.maxMarks}</p>
                {selectedSubmission.marks !== null && (
                  <p style={{ color: '#22c55e', marginBottom: '15px' }}>✅ Current Marks: <strong>{selectedSubmission.marks}/{selectedSubmission.timelineEventId?.maxMarks}</strong></p>
                )}
              </>
            )}
            <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-end', marginBottom: '15px' }}>
              {(selectedSubmission.timelineEventId?.isMarksEnabled !== false && selectedSubmission.timelineEventId?.isMarksEnabled !== 'false') && (
                <input type="number" value={marks} onChange={(e) => setMarks(e.target.value)} placeholder="Enter marks" style={{ width: '120px' }} min="0" max={selectedSubmission.timelineEventId?.maxMarks} />
              )}
              <button className="btn btn-primary" onClick={() => handleAssignMarks('accepted')}>
                {(selectedSubmission.timelineEventId?.isMarksEnabled !== false && selectedSubmission.timelineEventId?.isMarksEnabled !== 'false') ? '✅ Accept & Assign' : '✅ Accept Submission'}
              </button>
              <button className="btn btn-warning" onClick={() => handleAssignMarks('needs_revision')}>🔄 Request Revision</button>
            </div>
            <div className="form-group">
              <label style={{ marginBottom: '8px', display: 'block' }}>Add Feedback (Optional):</label>
              <textarea value={comment} onChange={(e) => setComment(e.target.value)} rows={3} placeholder="Add feedback or revision comments..." style={{ width: '100%' }} />
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <>
      <div className="tab-content">
        <h2>📝 Review Submissions</h2>
        {submissions.length === 0 ? (
          <div className="card empty-state"><h3>No Submissions</h3><p>Submissions from your teams will appear here</p></div>
        ) : (
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr><th>Team</th><th>Class</th><th>Event</th><th>Submission</th><th>Status</th><th>Marks</th><th>Action</th></tr>
              </thead>
              <tbody>
                {submissions.map(sub => (
                  <tr key={sub._id}>
                    <td><strong>{sub.batchId?.teamName}</strong></td>
                    <td>{sub.batchId?.year} {sub.batchId?.branch}-{sub.batchId?.section}</td>
                    <td>{sub.timelineEventId?.title}</td>
                    <td>
                      {sub.versions && sub.versions.length > 0 && sub.versions[0]?.fileUrl ? (
                        <a href={sub.versions[0].fileUrl} target="_blank" rel="noopener noreferrer" style={{ color: '#667eea', cursor: 'pointer', textDecoration: 'underline' }}>
                          📁 Submission {sub.currentVersion}
                        </a>
                      ) : (
                        <span>Submission {sub.currentVersion}</span>
                      )}
                    </td>
                    <td>{getStatusBadge(sub.status)}</td>
                    <td>{(sub.status === 'accepted' || sub.status === 'completed') && (sub.timelineEventId?.isMarksEnabled === false || sub.timelineEventId?.isMarksEnabled === 'false') ? 'No marks' : (sub.marks !== null ? `${sub.marks}/${sub.timelineEventId?.maxMarks}` : '-')}</td>
                    <td><button className="btn btn-primary btn-sm" onClick={() => setSelectedSubmission(sub)}>Review</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <ConfirmationDialog
        isOpen={dialog.isOpen}
        title={dialog.title}
        message={dialog.message}
        type={dialog.type}
        onConfirm={dialog.onConfirm}
        onCancel={dialog.onConfirm}
      />
    </>
  );
}

export default SubmissionsReview;

