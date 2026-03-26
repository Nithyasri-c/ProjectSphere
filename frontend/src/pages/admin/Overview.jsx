import { useState, useEffect } from 'react';
import * as api from '../../services/api';

function Overview() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await api.getAdminOverview();
        setData(res.data.data);
      } catch (error) {
        console.error('Failed to fetch overview');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) return <div>Loading overview...</div>;

  return (
    <div>
      <h2 className="section-title" style={{ marginBottom: '24px' }}>📊 System Overview</h2>

      {/* Batch-Guide Mapping */}
      <div style={{ marginBottom: '32px' }}>
        <h3 style={{ color: '#667eea', marginBottom: '16px' }}>👨‍🏫 Guide Workload</h3>
        <div className="grid grid-3">
          {data?.guides?.map((guide) => (
            <div key={guide._id} className="card" style={{ border: guide.assignedBatches >= guide.maxBatches ? '2px solid #e53e3e' : '2px solid #38a169' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
                <div style={{ fontSize: '36px' }}>👤</div>
                <div>
                  <h4 style={{ color: '#2d3748' }}>{guide.name}</h4>
                  <p style={{ color: '#718096', fontSize: '12px' }}>{guide.email}</p>
                </div>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ color: '#718096', fontSize: '14px' }}>Assigned Batches</span>
                <span className={`badge ${guide.assignedBatches >= guide.maxBatches ? 'badge-danger' : 'badge-success'}`}>
                  {guide.assignedBatches} / {guide.maxBatches}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Problems by COE */}
      <div style={{ marginBottom: '32px' }}>
        <h3 style={{ color: '#667eea', marginBottom: '16px' }}>🏛️ Problems by COE</h3>
        {data?.coes?.map((coe) => {
          const coeProblems = data?.problems?.filter(p => p.coeId?._id === coe._id) || [];
          return (
            <div key={coe._id} style={{ marginBottom: '20px' }}>
              <h4 style={{ color: '#2d3748', marginBottom: '12px', padding: '12px', background: '#f7fafc', borderRadius: '8px' }}>
                📁 {coe.name} ({coeProblems.length} problems)
              </h4>
              {coeProblems.length > 0 && (
                <div style={{ paddingLeft: '20px' }}>
                  {coeProblems.map((problem) => (
                    <div key={problem._id} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 12px', borderBottom: '1px solid #e2e8f0' }}>
                      <span>{problem.title}</span>
                      <span className={`badge ${problem.selectedBatchCount >= problem.maxBatches ? 'badge-danger' : 'badge-success'}`}>
                        {problem.selectedBatchCount}/{problem.maxBatches} batches
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* All Batches */}
      <div>
        <h3 style={{ color: '#667eea', marginBottom: '16px' }}>👥 All Batches</h3>
        {data?.batches?.length === 0 ? (
          <p style={{ color: '#718096' }}>No batches created yet</p>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>Team Name</th>
                <th>Leader</th>
                <th>Problem</th>
                <th>Guide</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {data?.batches?.map((batch) => (
                <tr key={batch._id}>
                  <td><strong>{batch.teamName}</strong></td>
                  <td>{batch.leaderStudentId?.name || '-'}</td>
                  <td>{batch.problemId?.title || 'Not selected'}</td>
                  <td>{batch.guideId?.name || '-'}</td>
                  <td>
                    <span className={`badge badge-${batch.status === 'Completed' ? 'success' : batch.status === 'In Progress' ? 'warning' : 'info'}`}>
                      {batch.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

export default Overview;

