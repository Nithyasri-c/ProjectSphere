import { useState, useEffect } from 'react';
import * as api from '../../services/api';

function ChatSummaryView() {
  const [projects, setProjects] = useState([]);
  const [selectedProjectId, setSelectedProjectId] = useState('');
  const [summaries, setSummaries] = useState([]);
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    try {
      // Use project entries as they have the projectId string the user wants
      const res = await api.getAllProjectEntries(1, 100);
      setProjects(res.data.data);
    } catch (error) {
      console.error('Error fetching projects:', error);
    }
  };

  const fetchSummaries = async (projectId) => {
    if (!projectId) return;
    setLoading(true);
    try {
      const res = await api.getProjectSummaries(projectId);
      setSummaries(res.data.data);
    } catch (error) {
      console.error('Error fetching summaries:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleProjectChange = (e) => {
    const projectId = e.target.value;
    setSelectedProjectId(projectId);
    if (projectId) {
      fetchSummaries(projectId);
    } else {
      setSummaries([]);
    }
  };

  const handleGenerateSummaries = async () => {
    if (!selectedProjectId) return;
    setGenerating(true);
    try {
      await api.summarizeProject(selectedProjectId);
      await fetchSummaries(selectedProjectId);
      alert('Summaries generated successfully!');
    } catch (error) {
      console.error('Error generating summaries:', error);
      alert('Failed to generate summaries');
    } finally {
      setGenerating(false);
    }
  };

  const exportToCSV = () => {
    if (summaries.length === 0) return;

    const headers = ['Date', 'Summary'];
    const rows = summaries.map(s => [
      new Date(s.date).toLocaleDateString(),
      `"${s.summary.replace(/"/g, '""')}"`
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(r => r.join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `Chat_Summary_${selectedProjectId}_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="tab-content">
      <div className="section-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h2>💬 Daily Chat Summaries</h2>
        <div className="header-actions">
          {selectedProjectId && (
            <>
              <button 
                className="btn btn-primary" 
                onClick={handleGenerateSummaries} 
                disabled={generating}
                style={{ marginRight: '10px' }}
              >
                {generating ? '⌛ Generating...' : '🔄 Refresh Summaries'}
              </button>
              <button 
                className="btn btn-secondary" 
                onClick={exportToCSV}
                disabled={summaries.length === 0}
              >
                📥 Export CSV
              </button>
            </>
          )}
        </div>
      </div>

      <div className="card" style={{ marginBottom: '20px' }}>
        <div className="form-group">
          <label>Select Project/Team</label>
          <select value={selectedProjectId} onChange={handleProjectChange}>
            <option value="">-- Select a Project --</option>
            {projects.map(p => (
              <option key={p._id} value={p.projectId}>
                {p.projectId} - {p.projectTitle}
              </option>
            ))}
          </select>
        </div>
      </div>

      {loading ? (
        <div className="loading">Loading summaries...</div>
      ) : selectedProjectId ? (
        summaries.length > 0 ? (
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th style={{ width: '150px' }}>Date</th>
                  <th>Daily Summary</th>
                </tr>
              </thead>
              <tbody>
                {summaries.map((s) => (
                  <tr key={s._id}>
                    <td><strong>{new Date(s.date).toLocaleDateString()}</strong></td>
                    <td style={{ lineHeight: '1.6', color: '#4a5568' }}>{s.summary}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="card empty-state">
            <h3>No Summaries Found</h3>
            <p>Click "Refresh Summaries" to analyze chat history and generate daily summaries for this project.</p>
          </div>
        )
      ) : (
        <div className="card empty-state">
          <p>Please select a project to view daily chat summaries.</p>
        </div>
      )}
    </div>
  );
}

export default ChatSummaryView;
