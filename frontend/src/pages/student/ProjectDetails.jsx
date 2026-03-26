function ProjectDetails({ batch, isPending, isAllotted }) {
  const hasOptedProblem = batch.optedProblemId;
  const hasAllottedProblem = batch.problemId;
  const pendingOptedProblems = batch.optedProblems?.filter(o => o.status === 'pending') || [];
  const rejectedOptedProblems = batch.optedProblems?.filter(o => o.status === 'rejected') || [];

  return (
    <div>
      <h2 className="section-title">📊 Project Overview</h2>

      <div className="grid grid-2">
        <div className="card" style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: 'white', padding: '32px 28px' }}>
          <h3 style={{ marginBottom: '24px', opacity: 0.95, fontSize: '18px', fontWeight: '700' }}>🏷️ Team Information</h3>
          <div style={{ fontSize: '28px', fontWeight: '800', marginBottom: '20px', lineHeight: '1.3', wordBreak: 'break-word' }}>{batch.teamName}</div>
          <p style={{ opacity: 0.9, marginBottom: '14px', lineHeight: '1.8', fontSize: '15px', margin: '0 0 14px 0' }}>Team Leader: {batch.leaderStudentId?.name}</p>
          <p style={{ opacity: 0.9, marginBottom: '14px', lineHeight: '1.8', fontSize: '15px', margin: '0 0 14px 0' }}>Email: {batch.leaderStudentId?.email}</p>
          <p style={{ opacity: 0.9, marginBottom: '14px', lineHeight: '1.8', fontSize: '15px', margin: '0 0 14px 0' }}>Year: {batch.year}</p>
          {batch.coeId && <p style={{ opacity: 0.9, lineHeight: '1.8', fontSize: '15px', margin: '0' }}>COE: {batch.coeId?.name || batch.coeId}</p>}
        </div>

        <div className="card" style={{ padding: '28px 24px', display: 'flex', flexDirection: 'column', justifyContent: 'flex-start' }}>
          <h3 style={{ marginBottom: '18px', color: '#2d3748', fontSize: '18px', fontWeight: '700' }}>📈 Status</h3>
          <div style={{ fontSize: '48px', marginBottom: '16px', lineHeight: '1.2' }}>
            {pendingOptedProblems.length > 0 && !isAllotted && '⏳'}
            {isAllotted && batch.status === 'Not Started' && '📝'}
            {isAllotted && batch.status === 'In Progress' && '🔄'}
            {isAllotted && batch.status === 'Completed' && '✅'}
            {pendingOptedProblems.length === 0 && !isAllotted && '🔍'}
          </div>
          <span className={`badge badge-${isAllotted && batch.status === 'Completed' ? 'success' : isAllotted && batch.status === 'In Progress' ? 'warning' : pendingOptedProblems.length > 0 ? 'pending' : 'info'}`} style={{ fontSize: '14px', padding: '10px 18px', display: 'inline-flex', lineHeight: '1.6', minWidth: 'fit-content' }}>
            {pendingOptedProblems.length > 0 && !isAllotted ? `${pendingOptedProblems.length} Pending` : isAllotted ? batch.status.toUpperCase() : 'SELECT PROBLEM'}
          </span>
        </div>
      </div>

      {pendingOptedProblems.length > 0 && !isAllotted && (
        <div className="card" style={{ marginTop: '20px', background: '#fffbeb', border: '2px solid #f59e0b' }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '16px' }}>
            <div style={{ fontSize: '48px' }}>⏳</div>
            <div style={{ flex: 1 }}>
              <h3 style={{ color: '#b45309', marginBottom: '8px' }}>Waiting for Guide Approval</h3>
              <p style={{ color: '#92400e', marginBottom: '12px' }}>You have opted for {pendingOptedProblems.length} problem(s):</p>
              <ul style={{ color: '#92400e', paddingLeft: '20px', margin: 0 }}>
                {pendingOptedProblems.map((opt, idx) => (
                  <li key={idx} style={{ marginBottom: '8px' }}>
                    <strong>{opt.problemId?.title || 'Unknown Problem'}</strong>
                    {opt.coeId?.name && <span style={{ fontSize: '12px' }}> ({opt.coeId.name})</span>}
                  </li>
                ))}
              </ul>
              <p style={{ color: '#92400e', fontSize: '14px', marginTop: '12px' }}>The guide(s) will review your request and allot one problem to your team.</p>
            </div>
          </div>
        </div>
      )}

      {rejectedOptedProblems.length > 0 && (
        <div className="card" style={{ marginTop: '20px', background: '#fee', border: '2px solid #dc3545' }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '16px' }}>
            <div style={{ fontSize: '48px' }}>❌</div>
            <div style={{ flex: 1 }}>
              <h3 style={{ color: '#dc3545', marginBottom: '8px' }}>Rejected Requests</h3>
              <p style={{ color: '#721c24', marginBottom: '12px' }}>The following problem(s) were rejected by the guide:</p>
              <ul style={{ color: '#721c24', paddingLeft: '20px', margin: 0 }}>
                {rejectedOptedProblems.map((opt, idx) => (
                  <li key={idx} style={{ marginBottom: '8px', textDecoration: 'line-through', opacity: 0.7 }}>
                    <strong>{opt.problemId?.title || 'Unknown Problem'}</strong>
                    {opt.coeId?.name && <span style={{ fontSize: '12px' }}> ({opt.coeId.name})</span>}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}

      {isAllotted && hasAllottedProblem && (
        <div className="grid grid-2" style={{ marginTop: '20px' }}>
          <div className="card">
            <h3 style={{ marginBottom: '16px', color: '#2d3748' }}>📋 Allotted Problem</h3>
            <h4 style={{ color: '#667eea', marginBottom: '12px' }}>{batch.problemId?.title}</h4>
            <p style={{ color: '#718096', fontSize: '14px', marginBottom: '16px' }}>
              {batch.problemId?.description || 'No description'}
            </p>
            {batch.problemId?.datasetUrl && (
              <a href={batch.problemId.datasetUrl} target="_blank" rel="noopener noreferrer" className="btn btn-secondary" style={{ fontSize: '12px' }}>
                📁 View Dataset
              </a>
            )}
          </div>

          <div className="card">
            <h3 style={{ marginBottom: '16px', color: '#2d3748' }}>👨‍🏫 Your Guide</h3>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <div style={{ fontSize: '48px' }}>👤</div>
              <div>
                <h4 style={{ color: '#2d3748', marginBottom: '4px' }}>{batch.guideId?.name}</h4>
                <p style={{ color: '#718096', fontSize: '14px' }}>{batch.guideId?.email}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {pendingOptedProblems.length === 0 && !hasAllottedProblem && (
        <div className="card" style={{ marginTop: '20px', textAlign: 'center', padding: '40px' }}>
          <div style={{ fontSize: '64px', marginBottom: '16px' }}>🔍</div>
          <h3 style={{ color: '#2d3748', marginBottom: '8px' }}>No Problem Selected Yet</h3>
          <p style={{ color: '#718096' }}>Go to the "Select Problem" tab to choose up to 3 problem statements for your project.</p>
        </div>
      )}
    </div>
  );
}

export default ProjectDetails;

