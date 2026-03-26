import { useState, useEffect, useCallback } from 'react';
import * as api from '../../services/api';
import COEandRCManagement from '../../components/COEandRCManagement';
import TimelineManagement from './TimelineManagement';
import BatchImport from './BatchImport';
import usePolling from '../../utils/usePolling';
import ImportProjectData from './ImportProjectData';
import GuideSearch from './GuideSearch';
import './AdminDashboard.css';

const YEARS = ['2nd', '3rd', '4th'];
const BRANCHES = ['CSE', 'IT', 'ECE', 'CSM', 'EEE', 'CSD', 'ETM'];
const SECTIONS = ['A', 'B', 'C', 'D', 'E'];

function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [coes, setCoes] = useState([]);
  const [batches, setBatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedBatch, setSelectedBatch] = useState(null);
  const [activeTab, setActiveTab] = useState(
    () => sessionStorage.getItem('adminActiveTab') || 'timeline'
  );

  // Filters
  const [filterYear, setFilterYear] = useState('');
  const [filterBranch, setFilterBranch] = useState('');
  const [filterSection, setFilterSection] = useState('');

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const fetchData = useCallback(async () => {
    try {
      const [statsRes, coesRes, batchesRes] = await Promise.all([
        api.getAdminDashboard(),
        api.getAllCOEs(),
        api.getAllBatches()
      ]);
      setStats(statsRes.data.data);
      setCoes(coesRes.data.data);
      setBatches(batchesRes.data.data);
    } catch (error) {
      console.error('AdminDashboard: Failed to fetch data:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Silently poll every 25s — new teams and submissions appear automatically
  usePolling(fetchData, 25000);

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    sessionStorage.setItem('adminActiveTab', tab);
  };

  const getBatchesForCOE = (coeId) => batches.filter(b => b.coeId?._id === coeId || b.coeId === coeId);
  const getStatusColor = (status) => status === 'Completed' ? 'success' : status === 'In Progress' ? 'warning' : 'info';

  // Filter batches by year, branch, section
  const getFilteredBatches = () => {
    return batches.filter(b => {
      if (filterYear && b.year !== filterYear) return false;
      if (filterBranch && b.branch !== filterBranch) return false;
      if (filterSection && b.section !== filterSection) return false;
      return true;
    });
  };

  const handleSelectBatch = (batch) => {
    setSelectedBatch(batch);
    // Scroll to top of the page to show the batch details
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [filterYear, filterBranch, filterSection]);

  if (loading && !stats) return (
    <div style={{ padding: '20px' }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5,1fr)', gap: '15px', marginBottom: '20px' }}>
        {[1, 2, 3, 4, 5].map(i => (
          <div key={i} className="stat-card" style={{ opacity: 0.4 }}>
            <div style={{ height: '40px', background: '#e2e8f0', borderRadius: '8px', marginBottom: '8px' }} />
            <div style={{ height: '14px', background: '#e2e8f0', borderRadius: '4px', width: '60%', margin: '0 auto' }} />
          </div>
        ))}
      </div>
    </div>
  );

  console.log('AdminDashboard: Rendering with activeTab:', activeTab);

  const filteredBatches = getFilteredBatches();

  // Pagination logic
  const totalPages = Math.ceil(filteredBatches.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedBatches = filteredBatches.slice(startIndex, endIndex);

  return (
    <div className="admin-dashboard">
      <div className="dashboard-header">
        <h1>👑 Admin Dashboard</h1>
        <p>Project Coordinator - Monitor all COEs, teams, and progress</p>
      </div>

      <div className="stats-row">
        <div className="stat-card"><div className="stat-icon">🏛️</div><div className="stat-value">{stats?.totalCOEs || 0}</div><div className="stat-label">COEs</div></div>
        <div className="stat-card"><div className="stat-icon">📋</div><div className="stat-value">{stats?.totalProblems || 0}</div><div className="stat-label">Problems</div></div>
        <div className="stat-card"><div className="stat-icon">👨‍🏫</div><div className="stat-value">{stats?.totalGuides || 0}</div><div className="stat-label">Guides</div></div>
        <div className="stat-card"><div className="stat-icon">👥</div><div className="stat-value">{stats?.totalBatches || 0}</div><div className="stat-label">Teams</div></div>
        <div className="stat-card"><div className="stat-icon">✅</div><div className="stat-value">{batches.filter(b => b.status === 'Completed').length}</div><div className="stat-label">Completed</div></div>
      </div>

      <div className="tabs">
        <button className={`tab ${activeTab === 'timeline' ? 'active' : ''}`} onClick={() => handleTabChange('timeline')}>📅 Timeline</button>
        <button className={`tab ${activeTab === 'filter' ? 'active' : ''}`} onClick={() => { handleTabChange('filter'); setSelectedBatch(null); }}>🔍 Filter by Class</button>
        <button className={`tab ${activeTab === 'guide-search' ? 'active' : ''}`} onClick={() => handleTabChange('guide-search')}>👨‍🏫 Search Batches</button>
        <button className={`tab ${activeTab === 'import' ? 'active' : ''}`} onClick={() => handleTabChange('import')}>📤 Batch Import</button>
        <button className={`tab ${activeTab === 'project-import' ? 'active' : ''}`} onClick={() => handleTabChange('project-import')}>📊 Import Projects</button>
        <button className={`tab ${activeTab === 'manage-coe-rc' ? 'active' : ''}`} onClick={() => handleTabChange('manage-coe-rc')}>🏛️ Manage COE/RC</button>
      </div>

      {activeTab === 'timeline' && <TimelineManagement />}

      {activeTab === 'import' && (
        <div className="tab-content">
          <BatchImport
            onImportComplete={() => {
              setActiveTab('filter');
              fetchData();
            }}
            onCancel={() => setActiveTab('filter')}
          />
        </div>
      )}

      {activeTab === 'guide-search' && (
        <div className="tab-content">
          <GuideSearch />
        </div>
      )}

      {activeTab === 'project-import' && (
        <div className="tab-content">
          <ImportProjectData />
        </div>
      )}

      {activeTab === 'filter' && !selectedBatch && (
        <div className="tab-content">
          <h2>🔍 Filter Teams by Year, Branch & Section</h2>

          <div className="card" style={{ marginBottom: '20px', maxWidth: '100%' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr) auto', gap: '20px', alignItems: 'end' }}>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label>Year</label>
                <select value={filterYear} onChange={(e) => setFilterYear(e.target.value)}>
                  <option value="">All Years</option>
                  {YEARS.map(y => <option key={y} value={y}>{y} Year</option>)}
                </select>
              </div>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label>Branch</label>
                <select value={filterBranch} onChange={(e) => setFilterBranch(e.target.value)}>
                  <option value="">All Branches</option>
                  {BRANCHES.map(b => <option key={b} value={b}>{b}</option>)}
                </select>
              </div>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label>Section</label>
                <select value={filterSection} onChange={(e) => setFilterSection(e.target.value)}>
                  <option value="">All Sections</option>
                  {SECTIONS.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <button className="btn btn-secondary" onClick={() => { setFilterYear(''); setFilterBranch(''); setFilterSection(''); }}>
                Clear Filters
              </button>
            </div>
          </div>

          {(filterYear || filterBranch || filterSection) && (
            <p style={{ color: '#666', marginBottom: '15px' }}>
              Showing: {filterYear || 'All Years'} • {filterBranch || 'All Branches'} • Section {filterSection || 'All'}
              <strong> ({filteredBatches.length} teams)</strong>
            </p>
          )}

          {filteredBatches.length === 0 ? (
            <div className="card empty-state">
              <h3>No Teams Found</h3>
              <p>No teams match the selected filters</p>
            </div>
          ) : (
            <div className="table-container">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Team Name</th>
                    <th>Team Members</th>
                    <th style={{ width: "120px" }}>COE/RC</th>
                    <th style={{ width: "120px" }}>Research Area</th>
                    <th>Guide</th>
                    <th>Problem</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedBatches.map((batch) => (
                    <tr key={batch._id}>
                      <td><strong>{batch.teamName}</strong></td>
                      <td>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                          {batch.teamMembers && batch.teamMembers.map((member, idx) => (
                            <div key={idx} style={{ fontSize: '12px', color: '#4a5568' }}>
                              • {member.rollNo || member.name}
                            </div>
                          ))}
                        </div>
                      </td>

                      <td>{batch.problemId?.coeId?.name || batch.coeId?.name || batch.coe?.name || 'Not Assigned'}</td>
                      <td>{batch.problemId?.researchArea || batch.researchArea || 'Not Assigned'}</td>
                      <td>{batch.guideId?.name || 'Not Assigned'}</td>
                      <td>
                        <button className="btn btn-primary btn-sm" onClick={() => handleSelectBatch(batch)}>View Details</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Pagination Controls */}
              {filteredBatches.length > itemsPerPage && (
                <div style={{
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                  gap: '10px',
                  marginTop: '20px',
                  padding: '15px'
                }}>
                  <button
                    className="btn btn-secondary btn-sm"
                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                    disabled={currentPage === 1}
                    style={{ opacity: currentPage === 1 ? 0.5 : 1 }}
                  >
                    ← Previous
                  </button>

                  <div style={{ display: 'flex', gap: '5px' }}>
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                      <button
                        key={page}
                        className={`btn btn-sm ${page === currentPage ? 'btn-primary' : 'btn-secondary'}`}
                        onClick={() => setCurrentPage(page)}
                        style={{
                          minWidth: '40px',
                          fontWeight: page === currentPage ? 'bold' : 'normal'
                        }}
                      >
                        {page}
                      </button>
                    ))}
                  </div>

                  <button
                    className="btn btn-secondary btn-sm"
                    onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                    disabled={currentPage === totalPages}
                    style={{ opacity: currentPage === totalPages ? 0.5 : 1 }}
                  >
                    Next →
                  </button>

                  <span style={{ marginLeft: '15px', color: '#666', fontSize: '14px' }}>
                    Showing {startIndex + 1}-{Math.min(endIndex, filteredBatches.length)} of {filteredBatches.length}
                  </span>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {activeTab === 'filter' && selectedBatch && (
        <div className="tab-content">
          <button className="btn btn-secondary" onClick={() => setSelectedBatch(null)} style={{ marginBottom: '20px' }}>← Back to List</button>

          <div className="card" style={{ marginBottom: '20px', borderLeft: '4px solid #667eea' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '15px' }}>
              <div>
                <h3>{selectedBatch.teamName}</h3>
                <p><strong>Year:</strong> {selectedBatch.year}</p>
                <p><strong>Branch:</strong> {selectedBatch.branch}</p>
                <p><strong>Section:</strong> {selectedBatch.section}</p>
              </div>
              <div>
                <p><strong>COE/RC:</strong> {selectedBatch.problemId?.coeId?.name || selectedBatch.coeId?.name || selectedBatch.coe?.name || 'Not Assigned'}</p>
                <p><strong>Research Area:</strong> {selectedBatch.problemId?.researchArea || selectedBatch.researchArea || 'Not Assigned'}</p>
                <p><strong>Guide:</strong> {selectedBatch.guideId?.name || 'Not Assigned'}</p>
                <p><strong>Problem:</strong> {selectedBatch.problemId?.title || 'Not Assigned'}</p>
              </div>
            </div>
          </div>

          <div className="card">
            <h3>👥 Team Members</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {selectedBatch.leaderStudentId && (
                <div style={{
                  padding: '12px',
                  background: '#f7fafc',
                  borderRadius: '6px',
                  borderLeft: '4px solid #cbd5e0',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}>
                  <div>
                    <div style={{ fontWeight: '500', color: '#2d3748', marginBottom: '4px' }}>
                      👤 {selectedBatch.leaderStudentId.name} <span style={{ fontSize: '12px', color: '#667eea' }}>(leader)</span>
                    </div>
                    <div style={{ fontSize: '14px', color: '#2d3748' }}>
                      {selectedBatch.leaderStudentId.rollNumber}
                    </div>
                    <div style={{ fontSize: '12px', color: '#718096', marginTop: '4px' }}>
                      {selectedBatch.year} {selectedBatch.branch}-{selectedBatch.section}
                    </div>
                  </div>
                </div>
              )}
              {selectedBatch.teamMembers && selectedBatch.teamMembers.length > 0 ? (
                selectedBatch.teamMembers.filter(m => m.rollNo !== selectedBatch.leaderStudentId?.rollNumber && m._id !== selectedBatch.leaderStudentId?._id).map((member, idx) => (
                  <div key={idx} style={{
                    padding: '12px',
                    background: '#f7fafc',
                    borderRadius: '6px',
                    borderLeft: '4px solid #cbd5e0',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}>
                    <div>
                      <div style={{ fontWeight: '500', color: '#2d3748', marginBottom: '4px' }}>
                        👤 {member.name}
                      </div>
                      <div style={{ fontSize: '14px', color: '#2d3748' }}>
                        {member.rollNo}
                      </div>
                      <div style={{ fontSize: '12px', color: '#718096', marginTop: '4px' }}>
                        {selectedBatch.year} {selectedBatch.branch}-{selectedBatch.section}
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div style={{ padding: '12px', color: '#718096', fontStyle: 'italic' }}>
                  No other team members
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'manage' && <COEManagement onUpdate={fetchData} />}

      {activeTab === 'manage-coe-rc' && (
        <div className="tab-content">
          <COEandRCManagement />
        </div>
      )}
    </div>
  );
}

export default AdminDashboard;

