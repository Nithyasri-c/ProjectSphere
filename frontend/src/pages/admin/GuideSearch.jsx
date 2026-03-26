import { useState } from 'react';
import * as api from '../../services/api';

function GuideSearch() {
  const [guideName, setGuideName] = useState('');
  const [searchType, setSearchType] = useState('all');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState(null);
  const [projects, setProjects] = useState([]);
  const [error, setError] = useState('');

  const handleSearch = async (e) => {
    e.preventDefault();

    if (!guideName.trim()) {
      setError('Please enter a guide name');
      return;
    }

    setLoading(true);
    setError('');
    setResults(null);
    setProjects([]);

    try {
      // Search batches (required)
      const batchesResponse = await api.searchBatchesByGuide(guideName, searchType);
      setResults(batchesResponse.data.data);

      // Search projects (optional - don't fail if this errors)
      try {
        const projectsResponse = await api.searchProjects(guideName, searchType);
        setProjects(projectsResponse.data.data || []);
      } catch (projectErr) {
        console.warn('Project search failed (non-critical):', projectErr.message);
        setProjects([]);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to search');
      setResults(null);
      setProjects([]);
    } finally {
      setLoading(false);
    }
  };

  // Helper to deduplicate and merge batches and projects
  const getUnifiedTeams = () => {
    if (!results) return [];

    const teamMap = new Map();

    // First, add all batches from results
    if (results.batches) {
      results.batches.forEach(batch => {
        // Use a unique key combining BatchID and TeamName to avoid collisions
        const key = `${batch.batchId || 'N/A'}-${batch.teamName.toLowerCase()}`;
        // Display both COE and RC if available
        const coeDisplay = batch.coe && batch.coe !== 'N/A' ? batch.coe : '';
        const rcDisplay = batch.rc && batch.rc !== 'N/A' ? batch.rc : '';
        const coeRc = (coeDisplay && rcDisplay) ? `${coeDisplay}, ${rcDisplay}` : (coeDisplay || rcDisplay || 'N/A');
        teamMap.set(key, {
          _id: batch._id,
          batchId: batch.batchId || 'N/A',
          teamName: batch.teamName,
          students: batch.students,
          studentCount: batch.studentCount,
          leaderStudent: batch.leaderStudent,
          // Use the populated guide name if available, otherwise fallback
          guideName: batch.guideName || results.guide.name,
          projectTitle: batch.projectTitle || 'N/A',
          researchArea: batch.researchArea || 'N/A',
          coe: coeRc,
          isProject: false
        });
      });
    }

    // Then, merge or add projects
    projects.forEach(project => {
      // Try to find matching team in the existing map
      const key = `${project.batchId || 'N/A'}-${project.teamName.toLowerCase()}`;
      const existing = teamMap.get(key) || teamMap.get(project.teamName.toLowerCase());

      if (existing) {
        // Project exists, update metadata
        existing.batchId = project.batchId || existing.batchId;
        existing.projectTitle = project.projectTitle;
        existing.researchArea = project.researchArea || 'N/A';
        // Combine COE and RC if available
        const projectCoeRc = project.coe && project.coe !== 'N/A'
          ? (project.rc && project.rc !== 'N/A' ? `${project.coe}, ${project.rc}` : project.coe)
          : (project.rc || 'N/A');
        existing.coe = projectCoeRc;
        existing.guideName = project.guideName || existing.guideName;
        existing.isProject = true;

        // Use project's student list if it looks more authoritative (longer)
        if (project.students && project.students.length > (existing.students?.length || 0)) {
          existing.students = project.students.map((s, idx) => ({
            name: s,
            rollNumber: project.rollNumbers?.[idx] || 'N/A'
          }));
          existing.studentCount = project.students.length;
        }
      } else {
        // Combine COE and RC for new project entries
        const projectCoeRc = project.coe && project.coe !== 'N/A'
          ? (project.rc && project.rc !== 'N/A' ? `${project.coe}, ${project.rc}` : project.coe)
          : (project.rc || 'N/A');
        teamMap.set(key, {
          _id: project._id,
          batchId: project.batchId || 'N/A',
          teamName: project.teamName,
          students: project.students.map((s, idx) => ({
            name: s,
            rollNumber: project.rollNumbers?.[idx] || 'N/A'
          })),
          studentCount: project.students.length,
          guideName: project.guideName,
          projectTitle: project.projectTitle,
          researchArea: project.researchArea || 'N/A',
          coe: projectCoeRc,
          isProject: true
        });
      }
    });

    return Array.from(teamMap.values());
  };

  const unifiedTeams = getUnifiedTeams();

  // Download search results as Excel with ALL columns
  const downloadAsExcel = () => {
    if (unifiedTeams.length === 0) {
      alert('No results to download');
      return;
    }

    try {
      // Prepare CSV data with all columns
      let csvContent = 'data:text/csv;charset=utf-8,';
      csvContent += 'S.No,Proj ID/Batch,Roll No(s),Student Name(s),Guide,Project Title,Research Area,COE/RC\n';

      let sNo = 1;
      unifiedTeams.forEach((team) => {
        const teamName = team.teamName || '-';
        const guide = team.guideName || '-';
        const projectTitle = team.projectTitle || '-';
        const researchArea = team.researchArea || '-';
        const coe = team.coe || '-';
        const students = team.students || [];

        if (students.length === 0) {
          // If no students, show team with empty student fields
          const row = [
            sNo,
            `"${teamName.replace(/"/g, '""')}"`,
            '-',
            '-',
            `"${guide.replace(/"/g, '""')}"`,
            `"${projectTitle.replace(/"/g, '""')}"`,
            `"${researchArea.replace(/"/g, '""')}"`,
            `"${coe.replace(/"/g, '""')}"`
          ];
          csvContent += row.join(',') + '\n';
          sNo++;
        } else {
          // Show team info on first student row, leave empty for subsequent students
          students.forEach((student, idx) => {
            const rollNumber = student.rollNumber || '-';
            const studentName = student.name || '-';
            const row = [
              idx === 0 ? sNo : '',  // S.No only on first student
              idx === 0 ? `"${teamName.replace(/"/g, '""')}"` : '',  // Team only on first
              rollNumber,
              `"${studentName.replace(/"/g, '""')}"`,
              idx === 0 ? `"${guide.replace(/"/g, '""')}"` : '',  // Guide only on first
              idx === 0 ? `"${projectTitle.replace(/"/g, '""')}"` : '',  // Project only on first
              idx === 0 ? `"${researchArea.replace(/"/g, '""')}"` : '',  // Research area only on first
              idx === 0 ? `"${coe.replace(/"/g, '""')}"` : ''  // COE only on first
            ];
            csvContent += row.join(',') + '\n';
          });
          sNo++;
        }
      });

      // Create download link
      const encodedUri = encodeURI(csvContent);
      const link = document.createElement('a');
      link.setAttribute('href', encodedUri);
      link.setAttribute('download', `guide_search_results_${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error('Failed to download:', error);
      alert('Failed to download file');
    }
  };

  return (
    <div>
      <div className="card" style={{ padding: '24px', maxWidth: '100%' }}>
        <form onSubmit={handleSearch} style={{ marginBottom: '24px' }}>
          <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-end' }}>
            {/* New Search Type Dropdown */}
            <div style={{ width: '200px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500', color: '#2d3748' }}>
                Search By
              </label>
              <select
                value={searchType}
                onChange={(e) => setSearchType(e.target.value)}
                style={{
                  width: '100%',
                  padding: '12px',
                  border: '2px solid #cbd5e0',
                  borderRadius: '6px',
                  fontSize: '14px',
                  backgroundColor: 'white'
                }}
              >
                <option value="all">All Fields</option>
                <option value="guide">Guide Name</option>
                <option value="problem">Problem Title</option>
                <option value="research">Research Area</option>
                <option value="coe">COE / RC</option>
              </select>
            </div>
            <div style={{ flex: 1 }}>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500', color: '#2d3748' }}>
                Search Term
              </label>
              <input
                type="text"
                value={guideName}
                onChange={(e) => setGuideName(e.target.value)}
                placeholder="e.g., Deep Learning, IOT, or Guide Name"
                style={{
                  width: '100%',
                  padding: '12px',
                  border: '2px solid #cbd5e0',
                  borderRadius: '6px',
                  fontSize: '14px',
                  boxSizing: 'border-box'
                }}
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              style={{
                padding: '12px 24px',
                background: '#667eea',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                cursor: loading ? 'not-allowed' : 'pointer',
                fontSize: '14px',
                fontWeight: '500',
                opacity: loading ? 0.6 : 1
              }}
            >
              {loading ? 'Searching...' : 'Search'}
            </button>
            {results && unifiedTeams.length > 0 && (
              <button
                type="button"
                onClick={downloadAsExcel}
                style={{
                  padding: '12px 24px',
                  background: '#10b981',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: '500',
                  whiteSpace: 'nowrap'
                }}
                title="Download search results as CSV"
              >
                📥 Download Results
              </button>
            )}
          </div>
        </form>

        {error && (
          <div style={{ padding: '12px', background: '#fed7d7', border: '1px solid #fc8181', borderRadius: '6px', color: '#c53030', marginBottom: '20px' }}>
            {error}
          </div>
        )}

        {results && (
          <div>
            <div style={{ marginBottom: '24px', padding: '16px', background: '#edf2f7', borderRadius: '8px' }}>
              <h3 style={{ color: '#2d3748', marginBottom: '12px' }}>
                👨‍🏫 {unifiedTeams.some(t => t.guideName !== results.guide.name) ? 'Search Results' : `Guide: ${results.guide.name}`}
              </h3>
              <div style={{ maxWidth: '240px' }}>
                <div style={{ padding: '16px', background: 'white', borderRadius: '8px', border: '1px solid #cbd5e0', textAlign: 'center' }}>
                  <p style={{ fontSize: '14px', color: '#718096', marginBottom: '8px' }}>Total Batches</p>
                  <p style={{ fontSize: '28px', fontWeight: 'bold', color: '#667eea' }}>{unifiedTeams.length}</p>
                </div>
              </div>
            </div>

            {/* Single Unified Table */}
            {unifiedTeams.length > 0 ? (
              <div>
                <h3 style={{ color: '#2d3748', marginBottom: '16px' }}>
                  📋 All Teams & Projects ({unifiedTeams.length})
                </h3>

                <div style={{ overflowX: 'auto' }}>
                  <table style={{
                    width: '100%',
                    borderCollapse: 'collapse',
                    background: 'white',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                    borderRadius: '8px',
                    overflow: 'hidden'
                  }}>
                    <thead>
                      <tr style={{ background: '#667eea', color: 'white' }}>
                        <th style={{ padding: '12px', textAlign: 'left', fontWeight: '600', fontSize: '14px' }}>Batch/Team</th>
                        <th style={{ padding: '12px', textAlign: 'left', fontWeight: '600', fontSize: '14px' }}>Roll Number</th>
                        <th style={{ padding: '12px', textAlign: 'left', fontWeight: '600', fontSize: '14px' }}>Student Name</th>
                        <th style={{ padding: '12px', textAlign: 'left', fontWeight: '600', fontSize: '14px' }}>Guide</th>
                        <th style={{ padding: '12px', textAlign: 'left', fontWeight: '600', fontSize: '14px' }}>Project Title</th>
                        <th style={{ padding: '12px', textAlign: 'left', fontWeight: '600', fontSize: '14px' }}>Research Area</th>
                        <th style={{ padding: '12px', textAlign: 'left', fontWeight: '600', fontSize: '14px' }}>COE/RC</th>
                      </tr>
                    </thead>
                    <tbody>
                      {unifiedTeams.map((team) => (
                        team.students.map((student, studentIdx) => (
                          <tr key={`${team._id}-${studentIdx}`} style={{
                            borderBottom: '1px solid #e2e8f0',
                            borderTop: studentIdx === 0 ? '3px solid #cbd5e0' : 'none',
                            background: team.isProject
                              ? (studentIdx % 2 === 0 ? '#f0fdf4' : 'white')
                              : (studentIdx % 2 === 0 ? '#fafbfc' : 'white')
                          }}>
                            {studentIdx === 0 ? (
                              <td rowSpan={team.students.length} style={{
                                padding: '12px',
                                fontWeight: '600',
                                color: '#2d3748',
                                borderRight: '2px solid #cbd5e0',
                                verticalAlign: 'top',
                                background: team.isProject ? '#ecfdf5' : '#f0f4ff'
                              }}>
                                {team.teamName}
                                <div style={{
                                  fontSize: '11px',
                                  color: team.isProject ? '#10b981' : '#667eea',
                                  marginTop: '4px',
                                  fontWeight: '500'
                                }}>
                                  {team.studentCount} members
                                </div>
                              </td>
                            ) : null}
                            <td style={{ padding: '12px', fontSize: '13px', color: '#4a5568' }}>
                              {student.rollNumber || 'N/A'}
                            </td>
                            <td style={{ padding: '12px', fontSize: '13px', color: '#2d3748', fontWeight: '500' }}>
                              {student.name}
                            </td>
                            {studentIdx === 0 ? (
                              <>
                                <td rowSpan={team.students.length} style={{ padding: '12px', fontSize: '13px', color: '#4a5568', verticalAlign: 'top' }}>
                                  {team.guideName}
                                </td>
                                <td rowSpan={team.students.length} style={{ padding: '12px', fontSize: '13px', color: '#4a5568', verticalAlign: 'top' }}>
                                  {team.projectTitle}
                                </td>
                                <td rowSpan={team.students.length} style={{ padding: '12px', fontSize: '13px', color: '#4a5568', verticalAlign: 'top' }}>
                                  {team.researchArea || 'N/A'}
                                </td>
                                <td rowSpan={team.students.length} style={{
                                  padding: '12px',
                                  fontSize: '13px',
                                  color: 'white',
                                  background: team.isProject ? '#10b981' : '#667eea',
                                  fontWeight: '600',
                                  verticalAlign: 'top'
                                }}>
                                  {team.coe}
                                </td>
                              </>
                            ) : null}
                          </tr>
                        ))
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : (
              <div style={{ padding: '20px', textAlign: 'center', background: '#f7fafc', borderRadius: '8px', color: '#718096' }}>
                No teams or projects found for this guide
              </div>
            )}
          </div>
        )}

        {!results && !error && guideName && !loading && (
          <div style={{ padding: '20px', textAlign: 'center', background: '#f7fafc', borderRadius: '8px', color: '#718096' }}>
            Click "Search" to find batches for this guide
          </div>
        )}
      </div>
    </div>
  );
}

export default GuideSearch;
