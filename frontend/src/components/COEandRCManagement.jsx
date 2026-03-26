import React, { useState, useEffect } from 'react';
import * as api from '../services/api';
import './COEandRCManagement.css';

function COEandRCManagement() {
  const [activeSubTab, setActiveSubTab] = useState('coe');
  const [coes, setCOEs] = useState([]);
  const [rcs, setRCs] = useState([]);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({ name: '' });
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [notification, setNotification] = useState(null);
  const [selectedCOEId, setSelectedCOEId] = useState(null);
  const [selectedRCId, setSelectedRCId] = useState(null);
  const [coeDetails, setCOEDetails] = useState(null);
  const [loadingDetails, setLoadingDetails] = useState(false);

  const fetchData = async () => {
    try {
      setLoading(true);
      // Fetch COEs, RCs, AND batches upfront so counts display correctly from the start
      const [coesRes, rcsRes, batchesRes] = await Promise.all([
        api.getAllCOEs(),
        api.getAllRCs(),
        api.getAllBatches()
      ]);

      const coesData = coesRes.data.data || [];
      const rcsData = rcsRes.data.data || [];
      const batchesData = batchesRes.data.data || [];

      console.log('?? Fetched Data:');
      console.log('COEs:', coesData);
      console.log('RCs:', rcsData);
      console.log('Batches:', batchesData);

      setCOEs(coesData);
      setRCs(rcsData);
      // Fetch batches upfront so team counts are accurate immediately
      setProjects(batchesData);
    } catch (error) {
      showNotification('Failed to fetch data', 'error');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  // Fetch batches lazily - only when COE/RC details are requested
  const fetchBatches = async () => {
    try {
      const batchesRes = await api.getAllBatches();
      const batchesData = batchesRes.data.data || [];
      setProjects(batchesData);
      return batchesData;
    } catch (error) {
      showNotification('Failed to fetch projects/batches', 'error');
      console.error(error);
      return [];
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const showNotification = (message, type = 'info') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 3000);
  };

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const resetForm = () => {
    setFormData({ name: '' });
    setEditingId(null);
  };

  // COE Functions
  const handleCreateCOE = async (e) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      showNotification('COE name is required', 'error');
      return;
    }

    setSaving(true);
    try {
      await api.createCOE({ name: formData.name });
      showNotification('COE created successfully', 'success');
      resetForm();
      setShowModal(false);
      fetchData();
    } catch (error) {
      showNotification(error.response?.data?.message || 'Failed to create COE', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteCOE = async (id) => {
    if (window.confirm('Are you sure you want to delete this COE?')) {
      try {
        await api.deleteCOE(id);
        showNotification('COE deleted successfully', 'success');
        setSelectedCOEId(null);
        fetchData();
      } catch (error) {
        showNotification('Failed to delete COE', 'error');
      }
    }
  };

  // Fetch detailed COE data
  const handleCOECardClick = async (coeId) => {
    setSelectedCOEId(coeId);
    setLoadingDetails(true);
    try {
      const response = await api.getCOEDetails(coeId);
      setCOEDetails(response.data.data);
    } catch (error) {
      showNotification('Failed to fetch COE details', 'error');
      console.error(error);
    } finally {
      setLoadingDetails(false);
    }
  };

  // RC Functions
  const handleCreateRC = async (e) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      showNotification('Research Center name is required', 'error');
      return;
    }

    setSaving(true);
    try {
      await api.createRC({
        name: formData.name
      });
      showNotification('Research Center created successfully', 'success');
      resetForm();
      setShowModal(false);
      fetchData();
    } catch (error) {
      showNotification(error.response?.data?.message || 'Failed to create RC', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteRC = async (id) => {
    if (window.confirm('Are you sure you want to delete this Research Center?')) {
      try {
        await api.deleteRC(id);
        showNotification('Research Center deleted successfully', 'success');
        setSelectedRCId(null);
        setProjects([]);
        fetchData();
      } catch (error) {
        showNotification('Failed to delete Research Center', 'error');
      }
    }
  };

  const handleEditRC = (rc) => {
    setEditingId(rc._id);
    setFormData({
      name: rc.name
    });
    setShowModal(true);
  };

  const handleUpdateRC = async (e) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      showNotification('Research Center name is required', 'error');
      return;
    }

    setSaving(true);
    try {
      await api.updateRC(editingId, {
        name: formData.name
      });
      showNotification('Research Center updated successfully', 'success');
      resetForm();
      setShowModal(false);
      setSelectedRCId(null);
      setProjects([]);
      fetchData();
    } catch (error) {
      showNotification(error.response?.data?.message || 'Failed to update RC', 'error');
    } finally {
      setSaving(false);
    }
  };
  // Get projects (batches) for COE - match by coeId, embedded coe.coeId, or allotted problem's coeId
  const getProjectsForCOE = (coeObj) => {
    if (!coeObj || !coeObj._id) return [];

    const coeId = coeObj._id.toString();

    return projects.filter(p => {
      // 1. Explicitly check batch.coeId (set during allotProblem)
      const pCoeId = p.coeId?._id || p.coeId;
      if (pCoeId && pCoeId.toString() === coeId) {
        return true;
      }

      // 2. Check embedded batch.coe.coeId (set during Excel import)
      const embeddedCoeId = p.coe?.coeId?._id || p.coe?.coeId;
      if (embeddedCoeId && embeddedCoeId.toString() === coeId) {
        return true;
      }

      // 3. Check the allotted problem's COE (works for Others COE and any COE linkage)
      const probCoeId = p.problemId?.coeId?._id || p.problemId?.coeId;
      if (probCoeId && probCoeId.toString() === coeId) {
        return true;
      }

      return false;
    });
  };

  // Helper to count teams for a COE (for display on card)
  const getTeamCountForCOE = (coeObj) => {
    return getProjectsForCOE(coeObj).length;
  };

  // Get projects (batches) for RC - match by rcId
  const getProjectsForRC = (rcObj) => {
    if (!rcObj || !rcObj._id) return [];

    const rcId = rcObj._id.toString();

    return projects.filter(p => {
      // Match by batch.rcId
      if (p.rcId && p.rcId._id && p.rcId._id.toString() === rcId) {
        return true;
      }
      if (typeof p.rcId === 'string' && p.rcId === rcId) {
        return true;
      }

      return false;
    });
  };

  // Get unassigned projects - only show if NO coeId AND NO rcId assigned, or if RC name is "--"
  const getUnassignedProjects = () => {
    return projects.filter(p => {
      // Check if RC name is "--" (explicitly marked as unassigned)
      if (p.rc && p.rc.name === '--') {
        return true;
      }

      // Check if has coeId (either directly or from problem)
      const hasCoeId = (p.coeId && (typeof p.coeId === 'string' || p.coeId._id)) ||
        (p.problemId?.coeId && (typeof p.problemId.coeId === 'string' || p.problemId.coeId._id));

      // Check if has rcId
      const hasRcId = p.rcId && (typeof p.rcId === 'string' || p.rcId._id);

      // Only include if NEITHER coeId nor rcId is assigned
      return !hasCoeId && !hasRcId;
    });
  };

  const openCOEModal = () => {
    resetForm();
    setActiveSubTab('coe');
    setShowModal(true);
  };

  const openRCModal = () => {
    resetForm();
    setActiveSubTab('rc');
    setShowModal(true);
  };

  if (loading) return <div className="loading">Loading...</div>;

  // Render COE/RC details table modal
  const renderDetailsModal = () => {
    if (activeSubTab === 'coe' && selectedCOEId && coeDetails) {
      const { coe, problemStatements, guides, students, batches, counts } = coeDetails;

      return (
        <div className="details-modal-overlay" onClick={() => { setSelectedCOEId(null); setCOEDetails(null); }}>
          <div className="details-modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="details-modal-header">
              <h3>{coe.name} - Details</h3>
              <button className="modal-close" onClick={() => { setSelectedCOEId(null); setCOEDetails(null); }}>&times;</button>
            </div>

            {loadingDetails ? (
              <div className="loading">Loading COE details...</div>
            ) : (
              <div style={{ padding: '30px' }}>
                {/* Summary Stats */}
                <div className="stats-grid" style={{ marginBottom: '30px' }}>
                  <div className="stat-card">
                    <div className="stat-value" style={{ color: '#5B7BD2' }}>{counts.problemStatements}</div>
                    <div className="stat-label">Problem Statements</div>
                  </div>
                  <div className="stat-card">
                    <div className="stat-value" style={{ color: '#70AD47' }}>{counts.guides}</div>
                    <div className="stat-label">Guides</div>
                  </div>
                  <div className="stat-card">
                    <div className="stat-value" style={{ color: '#FFC000' }}>{counts.batches}</div>
                    <div className="stat-label">Batches</div>
                  </div>
                  <div className="stat-card">
                    <div className="stat-value" style={{ color: '#E74C3C' }}>{counts.students}</div>
                    <div className="stat-label">Students</div>
                  </div>
                </div>

                {/* Consolidated Batches Section */}
                <div style={{ marginBottom: '30px' }}>
                  <h4 className="section-title" style={{ marginTop: 0, marginBottom: '20px', fontSize: '18px', fontWeight: '600', color: '#1a365d' }}>Batch Assignments</h4>
                  <div className="details-table-container" style={{ minHeight: '200px' }}>
                    {batches && batches.length > 0 ? (
                      <table className="details-table">
                        <thead>
                          <tr>
                            <th>Problem Statement</th>
                            <th>Guide</th>
                            <th>Batch Name</th>
                            <th>Batch Details (Roll Numbers)</th>
                          </tr>
                        </thead>
                        <tbody>
                          {batches.map((batch) => {
                            const batchStudents = students.filter(s =>
                              (s.batchId?._id || s.batchId)?.toString() === batch._id?.toString()
                            );
                            const rollNumbers = batchStudents.map(s => s.rollNumber).filter(Boolean).join(', ');

                            return (
                              <tr key={batch._id}>
                                <td>{batch.problemId?.title || 'N/A'}</td>
                                <td>{batch.guideId?.name || 'N/A'}</td>
                                <td>{batch.teamName || batch.batchId || 'N/A'}</td>
                                <td style={{ maxWidth: '300px', wordBreak: 'break-word' }}>
                                  {rollNumbers || 'No students assigned'}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    ) : (
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        minHeight: '200px',
                        color: '#999',
                        fontSize: '14px',
                        fontStyle: 'italic'
                      }}>
                        No batches found for this COE
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      );
    }

    // For RC tab - keep original behavior
    let selectedItems = [];
    let title = '';

    if (activeSubTab === 'rc' && selectedRCId) {
      const rc = rcs.find(r => r._id === selectedRCId);
      if (rc) {
        selectedItems = getProjectsForRC(rc);
        title = `${rc.name} - Projects (${selectedItems.length})`;
      }
    }

    if (!selectedItems.length) return null;

    const getCoeRcValue = (project) => {
      // Get the current tab's selected item (COE or RC)
      if (activeSubTab === 'coe') {
        // For COE tab, show the COE name
        if (project.coeId) {
          if (typeof project.coeId === 'object' && project.coeId.name) {
            return project.coeId.name;
          }
        }
        // Fallback to problem's COE
        if (project.problemId?.coeId) {
          if (typeof project.problemId.coeId === 'object' && project.problemId.coeId.name) {
            return project.problemId.coeId.name;
          }
        }
      } else if (activeSubTab === 'rc') {
        // For RC tab, show the RC name
        if (project.rcId) {
          if (typeof project.rcId === 'object' && project.rcId.name) {
            return project.rcId.name;
          }
        }
      }

      // Fallback for embedded data
      if (project.coe?.name && typeof project.coe.name === 'string') {
        const name = project.coe.name;
        return name === '--' ? 'Others' : name;
      }
      if (project.rc?.name && typeof project.rc.name === 'string') {
        const name = project.rc.name;
        return name === '--' ? 'Others' : name;
      }
      return 'Others';
    };

    return (
      <div className="details-modal-overlay" onClick={() => { setSelectedCOEId(null); setSelectedRCId(null); }}>
        <div className="details-modal-content" onClick={(e) => e.stopPropagation()}>
          <div className="details-modal-header">
            <h3>{title}</h3>
            <button className="modal-close" onClick={() => { setSelectedCOEId(null); setSelectedRCId(null); }}>&times;</button>
          </div>

          <div className="details-table-container">
            <table className="details-table">
              <thead>
                <tr>
                  <th>Team Name</th>
                  <th>Project Title</th>
                  <th>Guide</th>
                  <th>Research Area</th>
                  <th>COE/RC</th>
                </tr>
              </thead>
              <tbody>
                {selectedItems.map((project) => (
                  <tr key={project._id}>
                    <td>{project.teamName || project.batchId || 'N/A'}</td>
                    <td>{project.problemId?.title || project.optedProblemId?.title || 'N/A'}</td>
                    <td>{project.guideId?.name || 'N/A'}</td>
                    <td>{project.researchArea || project.problemId?.researchArea || project.optedProblemId?.researchArea || 'N/A'}</td>
                    <td className="coe-rc-cell">{getCoeRcValue(project)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="coe-rc-management">
      {notification && (
        <div className={`notification notification-${notification.type}`}>
          {notification.message}
        </div>
      )}

      <div className="sub-tabs" style={{ display: 'none' }}>
        <button
          className={`sub-tab ${activeSubTab === 'coe' ? 'active' : ''}`}
          onClick={() => setActiveSubTab('coe')}
        >
          [COE] Centers of Excellence
        </button>
      </div>

      {activeSubTab === 'coe' && (
        <div className="tab-content">
          <div className="section-header" style={{ justifyContent: 'flex-end' }}>
            <button className="btn btn-primary" onClick={openCOEModal}>
              + Add COE/RC
            </button>
          </div>

          {coes.length === 0 ? (
            <div className="empty-state">
              <p>No COEs created yet.</p>
            </div>
          ) : (
            <div className="coe-rc-grid">
              {coes.map((coe) => {
                const teamCount = getTeamCountForCOE(coe);
                return (
                  <div
                    key={coe._id}
                    className="coe-rc-card"
                    onClick={() => handleCOECardClick(coe._id)}
                    style={{ cursor: 'pointer' }}
                  >
                    <div className="card-body">
                      <h4>{coe.name === '--' ? 'Others' : coe.name}</h4>
                      <div style={{
                        marginTop: '12px',
                        fontSize: '32px',
                        fontWeight: 'bold',
                        color: '#ffffff',
                        marginBottom: '4px',
                        textShadow: '0 2px 4px rgba(0,0,0,0.2)'
                      }}>
                        {teamCount}
                      </div>
                      <div style={{
                        fontSize: '12px',
                        color: '#e0e0e0',
                        marginBottom: '16px'
                      }}>
                        team{teamCount !== 1 ? 's' : ''} assigned
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button
                        className="btn btn-primary btn-sm"
                        style={{ flex: 1, fontSize: '13px' }}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleCOECardClick(coe._id);
                        }}
                      >
                        VIEW
                      </button>
                      <button
                        className="btn btn-danger btn-sm"
                        style={{ flex: 1, fontSize: '13px' }}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteCOE(coe._id);
                        }}
                      >
                        DELETE
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Details Modal */}
      {selectedCOEId && renderDetailsModal()}

      {/* Modal for Create/Edit */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>
                {editingId ? 'Edit COE' : 'Add New COE'}
              </h3>
              <button className="modal-close" onClick={() => setShowModal(false)}>�</button>
            </div>

            <form onSubmit={editingId ? null : handleCreateCOE}>
              <div className="form-group">
                <label>COE Name *</label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleFormChange}
                  placeholder="e.g., Deep Learning in Eye Disease Prognosis"
                  required
                />
              </div>

              <div className="form-actions">
                <button type="submit" className="btn btn-success" disabled={saving}>
                  {saving ? 'Saving...' : 'Create COE'}
                </button>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setShowModal(false)}
                  disabled={saving}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default COEandRCManagement;
