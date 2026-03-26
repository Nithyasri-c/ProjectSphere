import React, { useState, useEffect } from 'react';
import * as api from '../../services/api';
import './ProjectSearchComponent.css';

function ProjectSearchComponent() {
  const [searchQuery, setSearchQuery] = useState('');
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [activeTab, setActiveTab] = useState('search');
  const [domains, setDomains] = useState([]);
  const [coes, setCOEs] = useState([]);
  const [rcs, setRCs] = useState([]);
  const [selectedFilter, setSelectedFilter] = useState({ type: '', value: '' });

  // Load metadata on mount
  useEffect(() => {
    const loadMetadata = async () => {
      try {
        const [domainsRes, coesRes, rcsRes] = await Promise.all([
          api.getProjectDomains(),
          api.getProjectCOEs(),
          api.getProjectRCs()
        ]);
        setDomains(domainsRes.data.data || []);
        setCOEs(coesRes.data.data || []);
        setRCs(rcsRes.data.data || []);
      } catch (error) {
        console.error('Failed to load metadata:', error);
      }
    };
    loadMetadata();
  }, []);

  // Handle search
  const handleSearch = async (e) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    setLoading(true);
    setSearched(true);
    try {
      const res = await api.searchProjectEntries(searchQuery);
      setProjects(res.data.data || []);
    } catch (error) {
      console.error('Search failed:', error);
      setProjects([]);
    } finally {
      setLoading(false);
    }
  };

  // Handle filter
  const handleFilter = async (type, value) => {
    setLoading(true);
    setSearched(true);
    setSelectedFilter({ type, value });

    try {
      let res;
      switch (type) {
        case 'domain':
          res = await api.filterProjectsByDomain(value);
          break;
        case 'coe':
          res = await api.filterProjectsByCOE(value);
          break;
        case 'rc':
          res = await api.filterProjectsByRC(value);
          break;
        case 'guide':
          res = await api.filterProjectsByGuide(value);
          break;
        default:
          return;
      }
      setProjects(res.data.data || []);
    } catch (error) {
      console.error('Filter failed:', error);
      setProjects([]);
    } finally {
      setLoading(false);
    }
  };

  const clearSearch = () => {
    setSearchQuery('');
    setProjects([]);
    setSearched(false);
    setSelectedFilter({ type: '', value: '' });
  };

  return (
    <div className="project-search">
      <h2>Project Search & Filter</h2>

      {/* Tabs */}
      <div className="search-tabs">
        <button
          className={`tab ${activeTab === 'search' ? 'active' : ''}`}
          onClick={() => setActiveTab('search')}
        >
          ?? Search
        </button>
        <button
          className={`tab ${activeTab === 'filter' ? 'active' : ''}`}
          onClick={() => setActiveTab('filter')}
        >
          ?? Filter
        </button>
      </div>

      {/* Search Tab */}
      {activeTab === 'search' && (
        <div className="search-section">
          <form onSubmit={handleSearch} className="search-form">
            <div className="search-input-group">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by project title, guide, domain, COE, RC..."
                className="search-input"
              />
              <button type="submit" className="btn btn-primary">
                Search
              </button>
              {searched && (
                <button type="button" className="btn btn-secondary" onClick={clearSearch}>
                  Clear
                </button>
              )}
            </div>
          </form>

          {searched && (
            <div className="search-results">
              <p style={{ color: '#666', marginBottom: '15px' }}>
                Found {projects.length} project(s)
              </p>
              {loading && <p>Searching...</p>}
              {!loading && projects.length === 0 && (
                <p style={{ color: '#999' }}>No projects found matching your search.</p>
              )}
              {!loading && projects.length > 0 && (
                <div className="projects-list">
                  {projects.map(project => (
                    <ProjectCard key={project._id} project={project} />
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Filter Tab */}
      {activeTab === 'filter' && (
        <div className="filter-section">
          <div className="filter-grid">
            {/* Domain Filter */}
            <div className="filter-category">
              <h4>Domain</h4>
              <div className="filter-buttons">
                {domains.length === 0 ? (
                  <p style={{ color: '#999' }}>No domains available</p>
                ) : (
                  domains.map(domain => (
                    <button
                      key={domain}
                      className={`filter-btn ${selectedFilter.type === 'domain' && selectedFilter.value === domain ? 'active' : ''}`}
                      onClick={() => handleFilter('domain', domain)}
                    >
                      {domain}
                    </button>
                  ))
                )}
              </div>
            </div>

            {/* COE Filter */}
            <div className="filter-category">
              <h4>COE</h4>
              <div className="filter-buttons">
                {coes.length === 0 ? (
                  <p style={{ color: '#999' }}>No COEs available</p>
                ) : (
                  coes.map(coe => (
                    <button
                      key={coe}
                      className={`filter-btn ${selectedFilter.type === 'coe' && selectedFilter.value === coe ? 'active' : ''}`}
                      onClick={() => handleFilter('coe', coe)}
                    >
                      {coe}
                    </button>
                  ))
                )}
              </div>
            </div>

            {/* RC Filter */}
            <div className="filter-category">
              <h4>RC</h4>
              <div className="filter-buttons">
                {rcs.length === 0 ? (
                  <p style={{ color: '#999' }}>No RCs available</p>
                ) : (
                  rcs.map(rc => (
                    <button
                      key={rc}
                      className={`filter-btn ${selectedFilter.type === 'rc' && selectedFilter.value === rc ? 'active' : ''}`}
                      onClick={() => handleFilter('rc', rc)}
                      title={rc}
                    >
                      {rc.substring(0, 20)}...
                    </button>
                  ))
                )}
              </div>
            </div>
          </div>

          {searched && (
            <div className="filter-results">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                <p style={{ color: '#666' }}>
                  Found {projects.length} project(s) with {selectedFilter.type}: "{selectedFilter.value}"
                </p>
                <button className="btn btn-secondary btn-sm" onClick={clearSearch}>
                  Clear Filter
                </button>
              </div>
              {loading && <p>Filtering...</p>}
              {!loading && projects.length === 0 && (
                <p style={{ color: '#999' }}>No projects found with selected filter.</p>
              )}
              {!loading && projects.length > 0 && (
                <div className="projects-list">
                  {projects.map(project => (
                    <ProjectCard key={project._id} project={project} />
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// Project Card Component
function ProjectCard({ project }) {
  return (
    <div className="project-card">
      <div className="project-header">
        <h3>{project.projectTitle}</h3>
        <span className="project-id">{project.projectId}</span>
      </div>

      <div className="project-details">
        <div className="detail-row">
          <strong>Guide:</strong>
          <span>{project.internalGuide?.name || 'N/A'}</span>
        </div>
        {project.domain && project.domain !== 'N/A' && (
          <div className="detail-row">
            <strong>Domain:</strong>
            <span className="badge badge-info">{project.domain}</span>
          </div>
        )}
        {project.coe?.name && project.coe.name !== 'N/A' && (
          <div className="detail-row">
            <strong>COE:</strong>
            <span className="badge badge-success">{project.coe.name}</span>
          </div>
        )}
        {project.rc?.name && project.rc.name !== 'N/A' && (
          <div className="detail-row">
            <strong>RC:</strong>
            <span className="badge badge-warning">{project.rc.name}</span>
          </div>
        )}
      </div>

      <div className="project-students">
        <strong>Students ({project.students?.length || 0}):</strong>
        <div className="students-list">
          {project.students?.map((student, idx) => (
            <div key={idx} className="student-item">
              <span className="student-name">{student.name}</span>
              <span className="student-roll">{student.rollNumber}</span>
            </div>
          ))}
        </div>
      </div>

      {project.batchId && (
        <div className="project-batch">
          <strong>Batch:</strong>
          <span>{project.batchId?.teamName || 'N/A'}</span>
        </div>
      )}
    </div>
  );
}

export default ProjectSearchComponent;
