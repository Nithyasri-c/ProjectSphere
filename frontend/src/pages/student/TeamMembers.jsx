import { useState, useEffect } from 'react';
import * as api from '../../services/api';

function TeamMembers({ batchId, leader, batchYear }) {
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchMembers = async () => {
    try {
      const res = await api.getTeamMembers(batchId);
      setMembers(res.data.data);
    } catch (error) {
      console.error('Failed to fetch team members');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMembers();
  }, [batchId]);

  const handleDelete = async (id) => {
    if (!confirm('Remove this team member?')) return;
    try {
      await api.deleteTeamMember(id);
      fetchMembers();
    } catch (error) {
      alert('Failed to remove member');
    }
  };

  if (loading) return <div>Loading team members...</div>;

  // Normalize roll numbers for comparison
  const leaderRollNo = leader?.rollNumber?.toLowerCase().trim();
  const otherMembers = members.filter(m => {
    const memberRollNo = m.rollNo?.toLowerCase().trim();
    // Exclude if roll number matches leader (case-insensitive)
    return memberRollNo !== leaderRollNo && m._id !== leader?._id;
  });

  return (
    <div>
      <div className="flex-between" style={{ marginBottom: '20px' }}>
        <h2 className="section-title">👥 Team Members</h2>
      </div>

      {!leader && members.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">👥</div>
          <h3>No Team Members Yet</h3>
          <p>Team members are provided by the admin</p>
        </div>
      ) : (
        <div className="grid grid-3">
          {leader && (
            <div key={leader._id} className="card" style={{ position: 'relative' }}>
              <div style={{ fontSize: '40px', marginBottom: '12px' }}>👤</div>
              <h3 style={{ color: '#2d3748', marginBottom: '8px' }}>{leader.name} <span style={{ fontSize: '12px', color: '#667eea', fontWeight: '600' }}>(leader)</span></h3>
              <p style={{ color: '#718096', fontSize: '14px' }}>Roll No: {leader.rollNumber}</p>
              <p style={{ color: '#718096', fontSize: '14px' }}>Year: {batchYear}</p>
              <p style={{ color: '#718096', fontSize: '14px' }}>Branch: {leader.branch}</p>
            </div>
          )}
          {otherMembers.map((member) => (
            <div key={member._id} className="card" style={{ position: 'relative' }}>
              <div style={{ fontSize: '40px', marginBottom: '12px' }}>👤</div>
              <h3 style={{ color: '#2d3748', marginBottom: '8px' }}>{member.name}</h3>
              <p style={{ color: '#718096', fontSize: '14px' }}>Roll No: {member.rollNo}</p>
              <p style={{ color: '#718096', fontSize: '14px' }}>Year: {batchYear}</p>
              <p style={{ color: '#718096', fontSize: '14px' }}>Branch: {member.branch}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default TeamMembers;
