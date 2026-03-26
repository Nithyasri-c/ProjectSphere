import { useState, useEffect, useCallback } from 'react';
import * as api from '../../services/api';
import ChatPanel from '../../components/ChatPanel';
import ChatsListPanel from '../../components/ChatsListPanel';
import { generateChatReport } from '../../utils/reportGenerator';
import usePolling from '../../utils/usePolling';
import BatchDetails from './BatchDetails';
import GuideTimeline from './GuideTimeline';
import ExcelImportProblem from './ExcelImportProblem';
import GuideSearch from '../admin/GuideSearch';
import ConfirmationDialog from '../../components/ConfirmationDialog';
import './GuideDashboard.css';
import GuideMeetings from './GuideMeetings';

function GuideDashboard() {
  const [activeTab, setActiveTab] = useState(
    () => sessionStorage.getItem('guideActiveTab') || 'problems'
  );

  // Per-section state – loaded lazily
  const [problems, setProblems] = useState([]);
  const [coes, setCoes] = useState([]);
  const [rcs, setRcs] = useState([]);
  const [batches, setBatches] = useState([]);
  const [optedTeams, setOptedTeams] = useState([]);
  const [submissions, setSubmissions] = useState([]);

  // Loading flags per section
  const [loadingProblems, setLoadingProblems] = useState(false);
  const [loadingRequests, setLoadingRequests] = useState(false);
  const [loadingTeams, setLoadingTeams] = useState(false);

  // Track which sections have been fetched at least once
  const [fetchedProblems, setFetchedProblems] = useState(false);
  const [fetchedRequests, setFetchedRequests] = useState(false);
  const [fetchedTeams, setFetchedTeams] = useState(false);

  const [selectedBatch, setSelectedBatch] = useState(null);
  const [showAddProblem, setShowAddProblem] = useState(false);
  const [showImportExcel, setShowImportExcel] = useState(false);
  const [chatsListOpen, setChatsListOpen] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);
  const [selectedChat, setSelectedChat] = useState(null);
  const [currentChatData, setCurrentChatData] = useState(null);
  const [newProblem, setNewProblem] = useState({ title: '', description: '', coeId: '', targetYear: '', datasetUrl: '', researchArea: '' });
  const [dialog, setDialog] = useState({ isOpen: false, title: '', message: '', type: 'info', onConfirm: null, confirmText: 'OK', cancelText: 'Cancel', showCancel: true });
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredProblems, setFilteredProblems] = useState([]);
  const [editingProblem, setEditingProblem] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);

  const TARGET_YEARS = ['2nd', '3rd', '4th'];
  const YEAR_LABELS = {
    '2nd': '2nd - Real Time Project',
    '3rd': '3rd - Mini Project',
    '4th': '4th - Major Project'
  };

  // ── Tab-specific fetch functions ──────────────────────────────────────────

  const fetchProblemsData = useCallback(async () => {
    setLoadingProblems(true);
    try {
      const [problemsRes, coesRes, rcsRes] = await Promise.all([
        api.getMyProblems(),
        api.getAllCOEs(),
        api.getAllRCs()
      ]);
      const p = problemsRes.data.data || [];
      setProblems(p);
      setFilteredProblems(p);
      setCoes(coesRes.data.data || []);
      setRcs(rcsRes.data.data || []);
      setFetchedProblems(true);
    } catch (error) {
      console.error('Failed to fetch problems data');
    } finally {
      setLoadingProblems(false);
    }
  }, []);

  const fetchRequestsData = useCallback(async () => {
    if (!fetchedRequests) setLoadingRequests(true);
    try {
      const res = await api.getOptedTeams();
      setOptedTeams(res.data.data || []);
      setFetchedRequests(true);
      setLastUpdated(new Date());
    } catch (error) {
      console.error('Failed to fetch requests data');
    } finally {
      setLoadingRequests(false);
    }
  }, [fetchedRequests]);

  const fetchTeamsData = useCallback(async () => {
    if (!fetchedTeams) setLoadingTeams(true);
    try {
      const [batchesRes, submissionsRes] = await Promise.all([
        api.getMyBatches(),
        api.getGuideSubmissions()
      ]);
      setBatches(batchesRes.data.data || []);
      setSubmissions(submissionsRes.data.data || []);
      setFetchedTeams(true);
      setLastUpdated(new Date());
    } catch (error) {
      console.error('Failed to fetch teams data');
    } finally {
      setLoadingTeams(false);
    }
  }, [fetchedTeams]);

  // Initial load based on active tab
  useEffect(() => {
    if (activeTab === 'problems' && !fetchedProblems) fetchProblemsData();
    if (activeTab === 'requests' && !fetchedRequests) fetchRequestsData();
    if (activeTab === 'teams' && !fetchedTeams) fetchTeamsData();
  }, [activeTab]); // eslint-disable-line

  // Also preload teams data once (needed for stats row)
  useEffect(() => {
    fetchTeamsData();
    fetchRequestsData();
  }, []); // eslint-disable-line

  // ── Auto-polling ─────────────────────────────────────────────────────────

  // Poll pending requests every 15 s
  usePolling(fetchRequestsData, 15000, activeTab === 'requests' || true);
  // Poll teams/submissions every 20 s
  usePolling(fetchTeamsData, 20000, true);

  // ── Tab switching ────────────────────────────────────────────────────────

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    sessionStorage.setItem('guideActiveTab', tab);
    // Lazy-load if not yet fetched
    if (tab === 'problems' && !fetchedProblems) fetchProblemsData();
    if (tab === 'requests') fetchRequestsData(); // always refresh when switching to requests
    if (tab === 'teams' && !fetchedTeams) fetchTeamsData();
  };

  // ── Handlers ────────────────────────────────────────────────────────────

  const handleSearch = async (value) => {
    setSearchTerm(value);
    if (!value.trim()) { setFilteredProblems(problems); return; }
    try {
      const response = await api.searchProblems(value);
      setFilteredProblems(response.data.data || []);
    } catch {
      setFilteredProblems(problems.filter(p =>
        p.title.toLowerCase().includes(value.toLowerCase()) ||
        p.description?.toLowerCase().includes(value.toLowerCase())
      ));
    }
  };

  const handleAddProblem = async (e) => {
    e.preventDefault();

    // Validate all required fields
    if (!newProblem.coeId || !newProblem.coeId.trim()) {
      showDialog('Validation Error', 'Please select a COE/RC', 'danger');
      return;
    }
    if (!newProblem.targetYear || !newProblem.targetYear.trim()) {
      showDialog('Validation Error', 'Please select a Target Year', 'danger');
      return;
    }
    if (!newProblem.title || !newProblem.title.trim()) {
      showDialog('Validation Error', 'Please enter a Title', 'danger');
      return;
    }
    if (!newProblem.description || !newProblem.description.trim()) {
      showDialog('Validation Error', 'Please enter a Description', 'danger');
      return;
    }
    if (!newProblem.researchArea || !newProblem.researchArea.trim()) {
      showDialog('Validation Error', 'Please enter a Research Area', 'danger');
      return;
    }

    try {
      if (editingProblem) {
        await api.updateProblem(editingProblem._id, newProblem);
        fetchProblemsData(); // Refresh immediately
        showDialog('Success', 'Problem statement updated successfully!', 'success', null, false, 'OK');
      } else {
        await api.createProblem(newProblem);
        fetchProblemsData();
      }
      setNewProblem({ title: '', description: '', coeId: '', targetYear: '', datasetUrl: '', researchArea: '' });
      setShowAddProblem(false);
      setEditingProblem(null);
    } catch (error) {
      showDialog('Error', error.response?.data?.message || 'Failed to save problem', 'danger');
    }
  };

  const handleEditClick = (problem) => {
    setEditingProblem(problem);
    setNewProblem({
      title: problem.title,
      description: problem.description,
      coeId: problem.coeId?._id || problem.coeId,
      targetYear: problem.targetYear,
      datasetUrl: problem.datasetUrl || '',
      researchArea: problem.researchArea || ''
    });
    setShowAddProblem(true);
    setShowImportExcel(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleCancelAddProblem = () => {
    setShowAddProblem(false);
    setEditingProblem(null);
    setNewProblem({ title: '', description: '', coeId: '', targetYear: '', datasetUrl: '', researchArea: '' });
  };

  const handleDeleteProblem = async (id) => {
    showDialog('Delete Problem', 'Are you sure you want to delete this problem statement?', 'danger', async () => {
      try {
        await api.deleteProblem(id);
        fetchProblemsData(); // Refresh immediately
        showDialog('Success', 'Problem statement deleted successfully!', 'success', null, false, 'OK');
      } catch (error) {
        showDialog('Error', error.response?.data?.message || 'Failed to delete', 'danger');
      }
    });
  };

  const handleAllot = async (batchId, problemId) => {
    try {
      await api.allotProblem(batchId, problemId);
      fetchRequestsData(); // Refresh immediately
      fetchTeamsData();    // Refresh immediately
      showDialog('Success', 'Team allotted successfully!', 'success', null, false, 'OK');
    } catch (error) {
      showDialog('Error', error.response?.data?.message || 'Failed to allot', 'danger');
    }
  };

  const handleReject = async (batchId, problemId) => {
    console.log('[Reject] Initiating for batch:', batchId, 'problem:', problemId);
    if (!problemId) {
      console.warn('[Reject] No problemId provided to handleReject');
    }
    showDialog('Reject Request', 'Are you sure you want to reject this request?', 'warning', async () => {
      try {
        const response = await api.rejectProblem(batchId, problemId);
        console.log('[Reject] Success:', response.data);
        fetchRequestsData(); // Refresh immediately
        showDialog('Success', 'Request rejected successfully!', 'success', null, false, 'OK');
      } catch (error) {
        console.error('[Reject] API Error:', error.response?.data || error.message);
        showDialog('Error', error.response?.data?.message || 'Failed to reject', 'danger');
      }
    });
  };

  const getAcceptedSubmissionsCount = (batchId) =>
    (submissions || []).filter(s => (s.batchId?._id || s.batchId) === batchId && s.status === 'accepted').length;

  const showDialog = (title, message, type = 'info', onConfirm = null, showCancel = true, confirmText = null) => {
    setDialog({
      isOpen: true, title, message, type,
      onConfirm: async () => {
        setDialog(prev => ({ ...prev, isOpen: false }));
        if (onConfirm) { try { await onConfirm(); } catch (err) { console.error('Dialog confirm error:', err); } }
      },
      showCancel,
      confirmText: confirmText || (onConfirm ? (type === 'danger' ? 'Delete' : 'Yes') : 'OK'),
      cancelText: 'Cancel'
    });
  };

  const handleSelectTeam = (teamData) => { setSelectedChat(teamData); setChatOpen(true); };
  const handleChatClose = () => setChatOpen(false);

  const handleDownloadReport = async () => {
    if (selectedChat && currentChatData) {
      try {
        const batch = batches.find(b => b._id === selectedChat.batchId);
        generateChatReport(currentChatData, batch?.teamName || 'Team', currentChatData.guideId?.name || 'Guide');
      } catch (error) { console.error('Error generating report:', error); }
    }
  };

  const getLastUpdatedText = () => {
    if (!lastUpdated) return '';
    const diff = Math.round((Date.now() - lastUpdated.getTime()) / 1000);
    if (diff < 60) return `${diff}s ago`;
    return `${Math.round(diff / 60)}m ago`;
  };

  if (selectedBatch) return <BatchDetails batchId={selectedBatch} onBack={() => { setSelectedBatch(null); fetchTeamsData(); }} />;

  // Skeleton loader for individual tabs
  const TabSkeleton = () => (
    <div style={{ padding: '20px' }}>
      {[1, 2, 3].map(i => (
        <div key={i} className="card" style={{ marginBottom: '15px', opacity: 0.5 }}>
          <div style={{ height: '16px', background: '#e2e8f0', borderRadius: '4px', width: '60%', marginBottom: '10px' }} />
          <div style={{ height: '12px', background: '#e2e8f0', borderRadius: '4px', width: '80%' }} />
        </div>
      ))}
    </div>
  );

  return (
    <div className="guide-dashboard">
      <div className="dashboard-header">
        <div className="header-left">
          <h1>👨‍🏫 Guide Dashboard</h1>
          <p>Manage your problem statements and teams</p>
        </div>
        <div className="header-right">
          <button className="messages-btn" onClick={() => setChatsListOpen(true)} title="View team messages">
            💬 Messages
          </button>
          {chatOpen && selectedChat && (
            <button className="download-report-btn" onClick={handleDownloadReport} title="Download chat report">
              📄 Report
            </button>
          )}
        </div>
      </div>

      <div className="stats-row">
        <div className="stat-card"><div className="stat-icon">📋</div><div className="stat-value">{(problems || []).length}</div><div className="stat-label">My Problems</div></div>
        <div className="stat-card"><div className="stat-icon">⏳</div><div className="stat-value">{(optedTeams || []).length}</div><div className="stat-label">Pending Requests</div></div>
        <div className="stat-card"><div className="stat-icon">👥</div><div className="stat-value">{(batches || []).length}</div><div className="stat-label">Allotted Teams</div></div>
        <div className="stat-card"><div className="stat-icon">✅</div><div className="stat-value">{(batches || []).filter(b => b?.status === 'Completed').length}</div><div className="stat-label">Completed</div></div>
      </div>

      <div className="tabs">
        <button className={`tab ${activeTab === 'problems' ? 'active' : ''}`} onClick={() => handleTabChange('problems')}>📋 My Problem Statements</button>
        <button className={`tab ${activeTab === 'requests' ? 'active' : ''}`} onClick={() => handleTabChange('requests')}>
          ⏳ Pending Requests ({optedTeams.length})
        </button>
        <button className={`tab ${activeTab === 'teams' ? 'active' : ''}`} onClick={() => handleTabChange('teams')}>👥 My Teams</button>
        <button className={`tab ${activeTab === 'submissions' ? 'active' : ''}`} onClick={() => handleTabChange('submissions')}>📅 Timeline</button>
        <button className={`tab ${activeTab === 'guide-search' ? 'active' : ''}`} onClick={() => handleTabChange('guide-search')}>🔍 Search Batches</button>
        <button className={`tab ${activeTab === 'meetings' ? 'active' : ''}`} onClick={() => handleTabChange('meetings')}>📅 Meetings</button>
      </div>

      {activeTab === 'problems' && (
        <div className="tab-content">
          <div className="section-header">
            <h2>📋 My Problem Statements</h2>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button className="btn btn-primary" onClick={() => { setShowAddProblem(true); setShowImportExcel(false); }}>+ Add Problem</button>
              <button className="btn btn-secondary" onClick={() => { setShowImportExcel(true); setShowAddProblem(false); }} style={{ backgroundColor: '#17a2b8' }}>📊 Import from Excel</button>
            </div>
          </div>
          {showImportExcel && (
            <ExcelImportProblem
              coes={coes} rcs={rcs} targetYears={['2nd', '3rd', '4th']}
              onImportComplete={() => { setShowImportExcel(false); fetchProblemsData(); }}
              onCancel={() => setShowImportExcel(false)}
            />
          )}
          {showAddProblem && (
            <div className="card" style={{ marginBottom: '20px', borderLeft: '4px solid #4a90e2' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                <h3 style={{ margin: 0 }}>{editingProblem ? '✏️ Edit Problem Statement' : '➕ Add New Problem Statement'}</h3>
              </div>
              <form onSubmit={handleAddProblem}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                  <div className="form-group"><label>COE / RC <span style={{ color: 'red' }}>*</span></label>
                    <select value={newProblem.coeId} onChange={(e) => setNewProblem({ ...newProblem, coeId: e.target.value })} required>
                      <option value="">Select COE / RC</option>
                      {[...coes, ...rcs].map(item => (<option key={item._id} value={item._id}>{item.name}</option>))}
                    </select>
                  </div>
                  <div className="form-group"><label>Target Year <span style={{ color: 'red' }}>*</span></label>
                    <select value={newProblem.targetYear} onChange={(e) => setNewProblem({ ...newProblem, targetYear: e.target.value })} required>
                      <option value="">Select Year</option>
                      {TARGET_YEARS.map(y => <option key={y} value={y}>{YEAR_LABELS[y]}</option>)}
                    </select>
                  </div>
                </div>
                <div className="form-group"><label>Title <span style={{ color: 'red' }}>*</span></label><input type="text" value={newProblem.title} onChange={(e) => setNewProblem({ ...newProblem, title: e.target.value })} required /></div>
                <div className="form-group"><label>Description <span style={{ color: 'red' }}>*</span></label><textarea value={newProblem.description} onChange={(e) => setNewProblem({ ...newProblem, description: e.target.value })} rows={3} required /></div>
                <div className="form-group"><label>Research Area <span style={{ color: 'red' }}>*</span></label><input type="text" value={newProblem.researchArea} onChange={(e) => setNewProblem({ ...newProblem, researchArea: e.target.value })} placeholder="e.g., Machine Learning, IoT, Data Science" required /></div>
                <div className="form-group"><label>Dataset URL (optional)</label><input type="url" value={newProblem.datasetUrl} onChange={(e) => setNewProblem({ ...newProblem, datasetUrl: e.target.value })} /></div>
                <div style={{ display: 'flex', gap: '10px' }}>
                  <button type="submit" className="btn btn-primary">{editingProblem ? 'Update Problem' : 'Save Problem'}</button>
                  <button type="button" className="btn btn-secondary" onClick={handleCancelAddProblem}>Cancel</button>
                </div>
                <div style={{ marginTop: '10px', padding: '10px', backgroundColor: '#f0f4ff', borderRadius: '4px', fontSize: '12px', color: '#666' }}>
                  💡 Tip: You can also import multiple problems at once using the "Import from Excel" button
                </div>
              </form>
            </div>
          )}
          {loadingProblems ? <TabSkeleton /> : problems.length === 0 ? (
            <div className="card empty-state"><h3>No Problem Statements Yet</h3><p>Add your first problem statement to get started</p></div>
          ) : (
            <>
              <div style={{ marginBottom: '20px' }}>
                <input type="text" placeholder="Search your problems by title or description..." value={searchTerm}
                  onChange={(e) => handleSearch(e.target.value)}
                  style={{ width: '100%', padding: '10px 12px', borderRadius: '4px', border: '1px solid #cbd5e0', fontSize: '14px', boxSizing: 'border-box' }}
                />
              </div>
              <div className="grid grid-2">
                {filteredProblems.map(p => (
                  <div className="card" key={p._id}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                      <div>
                        <h3 style={{ margin: '0 0 10px 0' }}>{p?.title || 'Untitled Problem'}</h3>
                        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '10px' }}>
                          <span className="timeline-badge badge-info">{p?.coeId?.name || 'No COE/RC'}</span>
                          <span className="timeline-badge badge-warning">{p?.targetYear || 'N/A'} Year</span>
                          {p?.researchArea && <span className="timeline-badge badge-success">{p.researchArea}</span>}
                        </div>
                      </div>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button className="edit-btn-container" onClick={(e) => { e.preventDefault(); handleEditClick(p); }} title="Edit problem statement"
                          style={{ background: '#e3f2fd', color: '#1976d2', border: 'none', borderRadius: '4px', padding: '6px 10px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px', fontSize: '13px', fontWeight: '600' }}>
                          ✏️ Edit
                        </button>
                        {(!p?.selectedBatchCount || p.selectedBatchCount === 0) && (
                          <button className="delete-btn-container" onClick={(e) => { e.preventDefault(); e.stopPropagation(); if (p?._id) handleDeleteProblem(p._id); }} title="Delete problem statement"
                            style={{ background: '#ffebee', color: '#d32f2f', border: 'none', borderRadius: '4px', padding: '6px 10px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px', fontSize: '13px', fontWeight: '600' }}>
                            🗑️ Delete
                          </button>
                        )}
                      </div>
                    </div>
                    <p style={{ color: '#666', margin: '10px 0' }}>{p?.description || 'No description provided'}</p>
                    {p?.allottedTeamName && (
                      <div style={{ fontSize: '14px', color: '#28a745', fontWeight: '600' }}>✓ Allotted to: {p.allottedTeamName}</div>
                    )}
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      )}

      {activeTab === 'requests' && (
        <div className="tab-content">
          <h2>⏳ Pending Team Requests</h2>
          {loadingRequests && optedTeams.length === 0 ? <TabSkeleton /> : optedTeams.length === 0 ? (
            <div className="card empty-state"><h3>No Pending Requests</h3><p>Teams that opt for your problems will appear here</p></div>
          ) : (
            <div className="grid grid-2">
              {optedTeams.map((t, idx) => (
                <div key={`${t._id}-${t.optedProblemId?._id || idx}`} className="card">
                  <div className="batch-icon">👥</div>
                  <h3>{t.teamName}</h3>
                  <p style={{ color: '#667eea', fontWeight: '500', marginBottom: '10px' }}>
                    <strong>Year:</strong> {t.year || 'N/A'} • <strong>Branch:</strong> {t.branch || 'N/A'}
                  </p>
                  <p style={{ color: '#667eea', fontWeight: '500', marginBottom: '10px' }}>
                    <strong>Project Type:</strong> {t.optedProblemId?.targetYear === '2nd' ? 'Real Time Project' : t.optedProblemId?.targetYear === '3rd' ? 'Mini Project' : t.optedProblemId?.targetYear === '4th' ? 'Major Project' : 'N/A'}
                  </p>
                  <p><strong>Leader:</strong> {t?.leaderStudentId?.name || 'Unknown'}</p>
                  <p><strong>Problem:</strong> {t?.optedProblemId?.title || 'No Problem'}</p>
                  <p><strong>COE:</strong> {t?.coeId?.name || 'No COE'}</p>
                  <div style={{ display: 'flex', gap: '10px', marginTop: '15px' }}>
                    <button className="btn btn-primary" onClick={() => handleAllot(t._id, t.optedProblemId?._id)}>✅ Allot</button>
                    <button className="btn btn-danger" onClick={() => handleReject(t._id, t.optedProblemId?._id)}>❌ Reject</button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === 'teams' && (
        <div className="tab-content">
          <h2>👥 My Allotted Teams</h2>
          {loadingTeams && batches.length === 0 ? <TabSkeleton /> : batches.length === 0 ? (
            <div className="card empty-state"><h3>No Teams Allotted Yet</h3><p>Allot teams from pending requests</p></div>
          ) : (
            <div className="grid grid-3">
              {batches.map(b => (
                <div key={b._id} className="batch-card">
                  <div className="batch-status">
                    <span className={`timeline-badge badge-${b.status === 'Completed' ? 'success' : b.status === 'In Progress' ? 'warning' : 'info'}`}>{b.status}</span>
                  </div>
                  <div className="batch-icon">👥</div>
                  <h3>{b.teamName}</h3>
                  <div style={{ marginBottom: '12px' }}><span style={{ fontSize: '12px', color: '#718096' }}>Year: <strong>{b.year}</strong></span></div>
                  <p className="batch-leader">Leader: <strong>{b?.leaderStudentId?.name || 'Unknown'}</strong></p>
                  <div className="batch-problem" style={{ background: '#ebf4ff', padding: '8px 12px', borderRadius: '6px', color: '#2b6cb0', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '6px', justifyContent: 'center', margin: '10px 0' }}>
                    📋 {b?.problemId?.title || 'Not Assigned'}
                  </div>
                  <div className="batch-submissions" style={{ color: '#38a169', fontSize: '14px', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '6px', justifyContent: 'center', marginBottom: '15px' }}>
                    <span style={{ backgroundColor: '#c6f6d5', padding: '2px 6px', borderRadius: '4px' }}>✅ Accepted Submissions: {getAcceptedSubmissionsCount(b._id)}</span>
                  </div>
                  <button className="batch-action-btn" onClick={() => setSelectedBatch(b._id)}>View Details →</button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === 'submissions' && <GuideTimeline />}

      {activeTab === 'guide-search' && (
        <div className="tab-content"><GuideSearch /></div>
      )}

      {activeTab === 'meetings' && (
        <GuideMeetings />
      )}

      <ConfirmationDialog
        isOpen={dialog.isOpen} title={dialog.title} message={dialog.message} type={dialog.type}
        onConfirm={dialog.onConfirm} onCancel={() => setDialog(prev => ({ ...prev, isOpen: false }))}
        confirmText={dialog.confirmText} cancelText={dialog.cancelText} showCancel={dialog.showCancel}
      />

      <ChatsListPanel batches={batches} isOpen={chatsListOpen} onClose={() => setChatsListOpen(false)} onSelectTeam={handleSelectTeam} />

      {selectedChat && (
        <ChatPanel
          batchId={selectedChat.batchId} teamMemberId={selectedChat.teamMemberId}
          isOpen={chatOpen} onClose={handleChatClose} onChatLoaded={setCurrentChatData}
        />
      )}
    </div>
  );
}

export default GuideDashboard;
