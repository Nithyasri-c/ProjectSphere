import { useState, useEffect } from 'react';
import * as XLSX from 'xlsx';
import * as api from '../services/api';
import './ProjectDirectory.css';

function ProjectDirectory({ showExport = true }) {
  const [projects, setProjects] = useState([]);
  const [filteredProjects, setFilteredProjects] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [guideFilter, setGuideFilter] = useState('');
  const [guides, setGuides] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [sortBy, setSortBy] = useState('date');

  useEffect(() => {
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    try {
      setLoading(true);
      const response = await api.getAllProjects();
      setProjects(response.data.data || []);
      setFilteredProjects(response.data.data || []);

      // Extract unique guides
      const uniqueGuides = [...new Set((response.data.data || []).map(p => p.internalGuide))];
      setGuides(uniqueGuides.filter(g => g));
      setError('');
    } catch (err) {
      setError('Failed to load projects: ' + (err.response?.data?.message || err.message));
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (query) => {
    setSearchQuery(query);
    filterProjects(query, guideFilter, sortBy);
  };

  const handleGuideFilter = (guide) => {
    setGuideFilter(guide);
    filterProjects(searchQuery, guide, sortBy);
  };

  const handleSort = (sort) => {
    setSortBy(sort);
    filterProjects(searchQuery, guideFilter, sort);
  };

  const filterProjects = (search, guide, sort) => {
    let filtered = [...projects];

    // Search filter
    if (search) {
      const searchLower = search.toLowerCase();
      filtered = filtered.filter(p =>
        p.projectTitle.toLowerCase().includes(searchLower) ||
        p.internalGuide.toLowerCase().includes(searchLower) ||
        p.projectId.toLowerCase().includes(searchLower) ||
        p.students.some(s =>
          s.name.toLowerCase().includes(searchLower) ||
          s.rollNumber.toLowerCase().includes(searchLower)
        )
      );
    }

    // Guide filter
    if (guide) {
      filtered = filtered.filter(p => p.internalGuide === guide);
    }

    // Sort
    if (sort === 'guide') {
      filtered.sort((a, b) => a.internalGuide.localeCompare(b.internalGuide));
    } else if (sort === 'title') {
      filtered.sort((a, b) => a.projectTitle.localeCompare(b.projectTitle));
    } else {
      filtered.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    }

    setFilteredProjects(filtered);
  };

  const exportToExcel = () => {
    if (filteredProjects.length === 0) {
      alert('No projects to export');
      return;
    }

    const exportData = filteredProjects.map((p, idx) => ({
      'S.No': idx + 1,
      'Project ID': p.projectId,
      'Project Title': p.projectTitle,
      'Internal Guide': p.internalGuide,
      'Students': p.students.map(s => `${s.name} (${s.rollNumber})`).join(', '),
      'No. of Students': p.students.length,
      'Branch': p.branch || 'N/A',
      'Year': p.year || 'N/A',
      'Section': p.section || 'N/A',
      'Imported Date': new Date(p.importedAt).toLocaleDateString()
    }));

    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Projects');

    const filename = `Projects_${searchQuery || 'All'}_${new Date().toISOString().split('T')[0]}.xlsx`;
    XLSX.writeFile(workbook, filename);
  };

  return (
    <div className="project-directory">
      <div className="directory-header">
        <h2>?? Project Directory</h2>
        <p>View and search all imported projects</p>
      </div>

      {error && (
        <div className="alert alert-error">
          {error}
        </div>
      )}

      <div className="directory-controls">
        <div className="search-section">
          <input
            type="text"
            placeholder="?? Search by project title, guide name, or ID..."
            value={searchQuery}
            onChange={(e) => handleSearch(e.target.value)}
            className="search-input"
          />
        </div>

        <div className="filter-section">
          <select
            value={guideFilter}
            onChange={(e) => handleGuideFilter(e.target.value)}
            className="filter-select"
          >
            <option value="">All Guides</option>
            {guides.map(guide => (
              <option key={guide} value={guide}>{guide}</option>
            ))}
          </select>

          <select
            value={sortBy}
            onChange={(e) => handleSort(e.target.value)}
            className="filter-select"
          >
            <option value="date">Sort by: Latest</option>
            <option value="guide">Sort by: Guide Name</option>
            <option value="title">Sort by: Project Title</option>
          </select>

          {showExport && (
            <button
              onClick={exportToExcel}
              className="btn-export"
              disabled={filteredProjects.length === 0}
              title="Export filtered projects to Excel"
            >
              ?? Export ({filteredProjects.length})
            </button>
          )}
        </div>
      </div>

      {loading ? (
        <div className="loading">Loading projects...</div>
      ) : filteredProjects.length === 0 ? (
        <div className="empty-state">
          <p>No projects found</p>
          {(searchQuery || guideFilter) && (
            <button onClick={() => { setSearchQuery(''); setGuideFilter(''); fetchProjects(); }} className="btn-reset">
              Reset Filters
            </button>
          )}
        </div>
      ) : (
        <div className="projects-grid">
          {filteredProjects.map((project) => (
            <div key={project._id} className="project-card">
              <div className="project-header">
                <div className="project-id">{project.projectId}</div>
                <div className="students-count">?? {project.students.length}</div>
              </div>

              <h3 className="project-title">{project.projectTitle}</h3>

              <div className="project-info">
                <div className="info-item">
                  <span className="label">Guide:</span>
                  <span className="value">{project.internalGuide}</span>
                </div>
                <div className="info-item">
                  <span className="label">Batch:</span>
                  <span className="value">{project.year} {project.branch} {project.section}</span>
                </div>
              </div>

              <div className="students-list">
                <strong>Students ({project.students.length}):</strong>
                <ul>
                  {project.students.map((student, idx) => (
                    <li key={idx}>{student.name} ({student.rollNumber})</li>
                  ))}
                </ul>
              </div>

              <div className="project-footer">
                <span className="import-date">
                  ?? {new Date(project.importedAt).toLocaleDateString()}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="directory-summary">
        <p>Showing <strong>{filteredProjects.length}</strong> of <strong>{projects.length}</strong> projects</p>
      </div>
    </div>
  );
}

export default ProjectDirectory;
