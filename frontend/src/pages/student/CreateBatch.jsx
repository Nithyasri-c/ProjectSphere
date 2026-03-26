import { useState } from 'react';
import * as api from '../../services/api';

function CreateBatch({ onBatchCreated }) {
  const [teamName, setTeamName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await api.createBatch({ teamName });
      onBatchCreated();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create batch');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="create-batch-container">
      <div className="card" style={{ maxWidth: '500px', margin: '0 auto' }}>
        <div className="text-center" style={{ marginBottom: '30px' }}>
          <span style={{ fontSize: '64px' }}>🚀</span>
          <h2 style={{ marginTop: '16px', color: '#2d3748' }}>Create Your Team</h2>
          <p style={{ color: '#718096' }}>Start by creating a batch for your project team</p>
        </div>

        {error && <div className="error-message" style={{ background: '#fed7d7', color: '#c53030', padding: '12px', borderRadius: '8px', marginBottom: '20px' }}>{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Team Name</label>
            <input
              type="text"
              value={teamName}
              onChange={(e) => setTeamName(e.target.value)}
              placeholder="Enter your team name"
              required
            />
          </div>

          <button type="submit" className="btn btn-primary" style={{ width: '100%' }} disabled={loading}>
            {loading ? 'Creating...' : 'Create Batch'}
          </button>
        </form>
      </div>
    </div>
  );
}

export default CreateBatch;

