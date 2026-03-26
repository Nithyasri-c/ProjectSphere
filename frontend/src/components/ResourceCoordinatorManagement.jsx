import React, { useState, useEffect } from 'react';
import * as api from '../../services/api';
import './ResourceCoordinatorManagement.css';

function ResourceCoordinatorManagement() {
  const [rcs, setRCs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedRC, setSelectedRC] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    department: '',
    description: ''
  });
  const [isEditing, setIsEditing] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [notification, setNotification] = useState(null);

  // Fetch all RCs
  const fetchRCs = async () => {
    try {
      setLoading(true);
      const res = await api.getAllRCs();
      setRCs(res.data.data || []);
    } catch (error) {
      showNotification('Failed to load RCs', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRCs();
  }, []);

  // Show notification
  const showNotification = (message, type = 'info') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 3000);
  };

  // Handle form change
  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Create new RC
  const handleCreate = async (e) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      showNotification('RC name is required', 'error');
      return;
    }

    try {
      await api.createRC(formData);
      showNotification('RC created successfully', 'success');
      setFormData({ name: '', email: '', department: '', description: '' });
      fetchRCs();
    } catch (error) {
      showNotification(error.response?.data?.message || 'Failed to create RC', 'error');
    }
  };

  // Edit RC
  const handleEdit = (rc) => {
    setSelectedRC(rc._id);
    setFormData({
      name: rc.name,
      email: rc.email || '',
      department: rc.department || '',
      description: rc.description || ''
    });
    setIsEditing(true);
  };

  // Update RC
  const handleUpdate = async (e) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      showNotification('RC name is required', 'error');
      return;
    }

    try {
      await api.updateRC(selectedRC, formData);
      showNotification('RC updated successfully', 'success');
      setFormData({ name: '', email: '', department: '', description: '' });
      setSelectedRC(null);
      setIsEditing(false);
      fetchRCs();
    } catch (error) {
      showNotification(error.response?.data?.message || 'Failed to update RC', 'error');
    }
  };

  // Delete RC
  const handleDelete = async (rcId) => {
    if (!window.confirm('Are you sure you want to delete this RC?')) return;

    try {
      await api.deleteRC(rcId);
      showNotification('RC deleted successfully', 'success');
      fetchRCs();
    } catch (error) {
      showNotification(error.response?.data?.message || 'Failed to delete RC', 'error');
    }
  };

  // Cancel editing
  const handleCancel = () => {
    setFormData({ name: '', email: '', department: '', description: '' });
    setSelectedRC(null);
    setIsEditing(false);
  };

  // Filter RCs
  const filteredRCs = rcs.filter(rc =>
    rc.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    rc.department?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="rc-management">
      {notification && (
        <div className={`notification notification-${notification.type}`}>
          {notification.message}
        </div>
      )}

      <h2>Resource Coordinator Management</h2>

      <div className="rc-container">
        {/* Form Section */}
        <div className="rc-form-section">
          <div className="card">
            <h3>{isEditing ? '?? Edit RC' : '? Add New RC'}</h3>
            <form onSubmit={isEditing ? handleUpdate : handleCreate}>
              <div className="form-group">
                <label>RC Name *</label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleFormChange}
                  placeholder="e.g., CoE-Deep Learning in Eye Disease Prognosis"
                  required
                />
              </div>

              <div className="form-group">
                <label>Email</label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleFormChange}
                  placeholder="coordinator@example.com"
                />
              </div>

              <div className="form-group">
                <label>Department</label>
                <input
                  type="text"
                  name="department"
                  value={formData.department}
                  onChange={handleFormChange}
                  placeholder="e.g., GNITS, CSE"
                />
              </div>

              <div className="form-group">
                <label>Description</label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleFormChange}
                  placeholder="Additional details about this RC..."
                  rows="3"
                ></textarea>
              </div>

              <div className="form-buttons">
                <button type="submit" className="btn btn-primary">
                  {isEditing ? 'Update RC' : 'Create RC'}
                </button>
                {isEditing && (
                  <button type="button" className="btn btn-secondary" onClick={handleCancel}>
                    Cancel
                  </button>
                )}
              </div>
            </form>
          </div>
        </div>

        {/* List Section */}
        <div className="rc-list-section">
          <div className="card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3>Resource Coordinators ({filteredRCs.length})</h3>
              <input
                type="text"
                placeholder="Search RCs..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="search-input"
              />
            </div>

            {loading ? (
              <p style={{ textAlign: 'center', color: '#666' }}>Loading RCs...</p>
            ) : filteredRCs.length === 0 ? (
              <p style={{ textAlign: 'center', color: '#666' }}>No RCs found</p>
            ) : (
              <div className="rc-list">
                {filteredRCs.map(rc => (
                  <div key={rc._id} className="rc-item">
                    <div className="rc-info">
                      <h4>{rc.name}</h4>
                      {rc.email && <p className="rc-email">?? {rc.email}</p>}
                      {rc.department && <p className="rc-dept">?? {rc.department}</p>}
                      {rc.description && <p className="rc-desc">{rc.description}</p>}
                    </div>
                    <div className="rc-actions">
                      <button
                        className="btn btn-sm btn-secondary"
                        onClick={() => handleEdit(rc)}
                      >
                        Edit
                      </button>
                      <button
                        className="btn btn-sm btn-danger"
                        onClick={() => handleDelete(rc._id)}
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default ResourceCoordinatorManagement;
