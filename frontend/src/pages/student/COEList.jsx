import { useState, useEffect } from 'react';
import * as api from '../../services/api';

function COEList({ onCOESelect }) {
  const [coes, setCOEs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
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
    fetchCOEs();
  }, []);

  if (loading) return <div>Loading domains...</div>;

  return (
    <div>
      <h2 className="section-title">🎯 Select a Domain (COE)</h2>
      <p style={{ color: '#718096', marginBottom: '24px' }}>Choose a Center of Excellence to view available problem statements</p>

      {coes.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">📭</div>
          <h3>No Domains Available</h3>
          <p>Please wait for the admin to add domains</p>
        </div>
      ) : (
        <div className="grid grid-3">
          {coes.map((coe) => (
            <div
              key={coe._id}
              className="card coe-card"
              onClick={() => onCOESelect(coe)}
              style={{ cursor: 'pointer', transition: 'transform 0.3s, box-shadow 0.3s' }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-5px)';
                e.currentTarget.style.boxShadow = '0 10px 30px rgba(102, 126, 234, 0.2)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 4px 20px rgba(0, 0, 0, 0.1)';
              }}
            >
              <div style={{ fontSize: '48px', marginBottom: '16px' }}>🏛️</div>
              <h3 style={{ color: '#2d3748', marginBottom: '8px' }}>{coe.name}</h3>
              <p style={{ color: '#718096', fontSize: '14px' }}>{coe.description || 'Click to view problems'}</p>
              <div style={{ marginTop: '16px', color: '#667eea', fontWeight: '600', fontSize: '14px' }}>
                View Problems →
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default COEList;

