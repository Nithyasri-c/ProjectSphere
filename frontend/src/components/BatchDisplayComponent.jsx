import React, { useState, useEffect } from 'react';
import * as api from '../../services/api';
import './BatchDisplayComponent.css';

function BatchDisplayComponent() {
  const [batches, setBatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filtered, setFiltered] = useState([]);

  useEffect(() => {
    fetchBatches();
  }, []);

  const fetchBatches = async () => {
    try {
      setLoading(true);
      const res = await api.getAllBatches();
      const populatedBatches = res.data.data || [];
      setBatches(populatedBatches);
      setFiltered(populatedBatches);
    } catch (error) {
      console.error('Failed to fetch batches:', error);
      setBatches([]);
    } finally {
      setLoading(false);
    }
  };

  // Search across all fields
  const handleSearch = async (e) => {
    const query = e.target.value.toLowerCase();
    setSearchQuery(query);

    if (!query.trim()) {
      setFiltered(batches);
      return;
    }

    try {
      // Use backend search which prevents data corruption
      const res = await api.searchAllBatches(query);
      setFiltered(res.data.data || []);
    } catch (error) {
      console.error('Search failed:', error);
      // Fallback to client-side filtering
      const results = batches.filter(batch => {
        // Search in batch/team name
        if (batch.teamName.toLowerCase().includes(query)) return true;
        
        // Search in guide name (exact match, no replacement)
        if (batch.guideId?.name?.toLowerCase().includes(query)) return true;
        
        // Search in domain
        if (batch.domain?.toLowerCase().includes(query)) return true;
        
        // Search in COE
        if (batch.coe?.name?.toLowerCase().includes(query)) return true;
        
        // Search in RC
        if (batch.rc?.name?.toLowerCase().includes(query)) return true;
        
        // Search in student names and roll numbers
        for (const member of batch.teamMembers || []) {
          if (member.name?.toLowerCase().includes(query)) return true;
          if (member.rollNo?.toLowerCase().includes(query)) return true;
        }
        
        return false;
      });

      setFiltered(results);
    }
  };

  // Download filtered batches as Excel with ALL columns
  const downloadAsExcel = () => {
    if (filtered.length === 0) {
      alert('No results to download');
      return;
    }

    try {
      // Group batches and prepare CSV data with ALL columns
      let csvContent = 'data:text/csv;charset=utf-8,';
      csvContent += 'S.No,Proj ID/Batch,Roll No(s),Student Name(s),Guide,Project Title,Research Area,Year,Branch,Section,COE/RC\n';

      let sNo = 1;
      filtered.forEach((batch) => {
        const batchName = batch.teamName || '-';
        const guide = batch.guideId?.name || 'Not Assigned';
        const domain = batch.domain || '-';
        const year = batch.year || '-';
        const branch = batch.branch || '-';
        const section = batch.section || '-';
        const coe = batch.coe?.name || batch.coeId?.name || '-';
        const students = batch.teamMembers || [];
        
        if (students.length === 0) {
          // If no students, show batch with empty student fields
          const row = [
            sNo,
            `"${batchName.replace(/"/g, '""')}"`,
            '-',
            '-',
            `"${guide.replace(/"/g, '""')}"`,
            `"${domain.replace(/"/g, '""')}"`,
            `"${domain.replace(/"/g, '""')}"`,
            year,
            branch,
            section,
            `"${coe.replace(/"/g, '""')}"`
          ];
          csvContent += row.join(',') + '\n';
          sNo++;
        } else {
          // Show batch info on first student row, leave empty for subsequent students
          students.forEach((student, idx) => {
            const rollNo = student.rollNo || '-';
            const studentName = student.name || '-';
            const row = [
              idx === 0 ? sNo : '',  // S.No only on first student
              idx === 0 ? `"${batchName.replace(/"/g, '""')}"` : '',  // Batch only on first
              rollNo,
              `"${studentName.replace(/"/g, '""')}"`,
              idx === 0 ? `"${guide.replace(/"/g, '""')}"` : '',  // Guide only on first
              idx === 0 ? `"${domain.replace(/"/g, '""')}"` : '',  // Domain only on first
              idx === 0 ? `"${domain.replace(/"/g, '""')}"` : '',  // Research Area only on first
              idx === 0 ? year : '',  // Year only on first
              idx === 0 ? branch : '',  // Branch only on first
              idx === 0 ? section : '',  // Section only on first
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
      link.setAttribute('download', `batches_${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error('Failed to download:', error);
      alert('Failed to download file');
    }
  };

  return (
    <div className="batch-display">
      <div className="batch-header">
        <h2>?? All Teams & Projects</h2>
        <div className="header-controls">
          <input
            type="text"
            placeholder="Search by Team, Guide, Domain, COE, RC, or Student..."
            value={searchQuery}
            onChange={handleSearch}
            className="search-input"
          />
          <button 
            className="btn btn-success"
            onClick={downloadAsExcel}
            title="Download search results as CSV"
          >
            ?? Download Results
          </button>
        </div>
      </div>

      <div className="batch-count">
        Showing {filtered.length} of {batches.length} batches
      </div>

      <div className="batch-table-container">
        <table className="batch-table">
          <thead>
            <tr>
              <th>Batch/Team</th>
              <th>Roll Number</th>
              <th>Student Name</th>
              <th>Guide</th>
              <th>Project Title</th>
              <th>Domain</th>
              <th>COE/RC</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan="7" style={{ textAlign: 'center', padding: '20px', color: '#999' }}>
                  No batches found
                </td>
              </tr>
            ) : (
              filtered.map((batch, idx) => {
                const members = batch.teamMembers || [];
                const guideName = batch.guideId?.name || 'N/A';
                const projectTitle = batch.problemId?.title || 'N/A';
                const domain = batch.domain || 'N/A';
                const coeRc = batch.coe?.name && batch.rc?.name 
                  ? `${batch.coe.name}, ${batch.rc.name}`
                  : batch.coe?.name || batch.rc?.name || 'N/A';

                if (members.length === 0) {
                  // Show batch with no members
                  return (
                    <tr key={`${idx}-empty`} className="batch-row">
                      <td rowSpan="1" className="batch-name">{batch.teamName}</td>
                      <td>-</td>
                      <td>-</td>
                      <td>{guideName}</td>
                      <td>{projectTitle}</td>
                      <td>{domain}</td>
                      <td>{coeRc}</td>
                    </tr>
                  );
                }

                // Show batch with all members
                return members.map((member, memberIdx) => (
                  <tr key={`${idx}-${memberIdx}`} className="batch-row">
                    {memberIdx === 0 && (
                      <>
                        <td rowSpan={members.length} className="batch-name">
                          {batch.teamName}
                          <div className="member-count">{members.length} members</div>
                        </td>
                      </>
                    )}
                    <td>{member.rollNo || '-'}</td>
                    <td>
                      {member.name}
                      {memberIdx === 0 && batch.leaderStudentId === member._id && (
                        <span className="leader-badge">LEADER</span>
                      )}
                    </td>
                    {memberIdx === 0 && (
                      <>
                        <td rowSpan={members.length}>{guideName}</td>
                        <td rowSpan={members.length}>{projectTitle}</td>
                        <td rowSpan={members.length}>{domain}</td>
                        <td rowSpan={members.length}>{coeRc}</td>
                      </>
                    )}
                  </tr>
                ));
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default BatchDisplayComponent;
