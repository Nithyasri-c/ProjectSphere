import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import * as api from '../services/api';
import GuideSearch from './admin/GuideSearch';
import Achievements from '../components/Achievements';
import './HomePage.css';

const API_URL = import.meta.env.VITE_API_URL || '/api';

const HomePage = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [guides, setGuides] = useState([]);
  const [problems, setProblems] = useState([]);
  const [batches, setBatches] = useState([]);
  const [projects, setProjects] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredGuides, setFilteredGuides] = useState([]);
  const [filteredProblems, setFilteredProblems] = useState([]);
  const [filteredBatches, setFilteredBatches] = useState([]);
  const [filteredProjects, setFilteredProjects] = useState([]);
  const [selectedGuide, setSelectedGuide] = useState(null);
  const [guideBatches, setGuideBatches] = useState([]);
  const [searchType, setSearchType] = useState('guides'); // 'guides' or 'problems'
  const [isSearching, setIsSearching] = useState(false);
  const [activeSection, setActiveSection] = useState('all'); // 'all', 'achievements', 'projects'
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const getRoleColor = () => {
    switch (user?.role) {
      case 'admin': return '#e53e3e';
      case 'guide': return '#38a169';
      case 'student': return '#3182ce';
      default: return '#667eea';
    }
  };

  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    try {
      const [guidesRes, problemsRes, projectsRes] = await Promise.all([
        axios.get(`${API_URL}/guides`),
        axios.get(`${API_URL}/problems`),
        api.getAllProjects()
      ]);
      setGuides(guidesRes.data.data || []);
      setProblems(problemsRes.data.data || []);
      setProjects(projectsRes.data.data || []);
      setFilteredGuides(guidesRes.data.data || []);
      setFilteredProblems(problemsRes.data.data || []);
      setFilteredProjects(projectsRes.data.data || []);
    } catch (error) {
      console.error('Error fetching data:', error);
    }
  };

  // Debounced search function
  useEffect(() => {
    const delaySearch = setTimeout(() => {
      performSearch(searchTerm);
    }, 300); // Wait 300ms after user stops typing

    return () => clearTimeout(delaySearch);
  }, [searchTerm]);

  const performSearch = async (value) => {
    setSelectedGuide(null);
    setGuideBatches([]);

    if (!value.trim()) {
      // Show all results if search is empty
      setFilteredGuides(guides);
      setFilteredProblems(problems);
      setFilteredBatches(batches);
      setFilteredProjects(projects);
      return;
    }

    setIsSearching(true);

    try {
      // Search guides, problems, batches, and projects
      const [guidesRes, problemsRes, batchesRes, projectsRes] = await Promise.all([
        api.searchGuides(value),
        api.searchProblems(value),
        api.searchBatches(value),
        api.searchProjects(value)
      ]);

      setFilteredGuides(guidesRes.data.data || []);
      setFilteredProblems(problemsRes.data.data || []);
      setFilteredBatches(batchesRes.data.data || []);
      setFilteredProjects(projectsRes.data.data || []);
    } catch (error) {
      console.error('Error during search:', error);
      // Fallback to local filtering
      setFilteredGuides(guides.filter(guide =>
        guide.name.toLowerCase().includes(value.toLowerCase())
      ));
      setFilteredProblems(problems.filter(problem =>
        problem.title.toLowerCase().includes(value.toLowerCase())
      ));
      setFilteredBatches(batches.filter(batch =>
        batch.teamName.toLowerCase().includes(value.toLowerCase()) ||
        batch.leaderStudentId?.name?.toLowerCase().includes(value.toLowerCase()) ||
        batch.guideId?.name?.toLowerCase().includes(value.toLowerCase())
      ));
      setFilteredProjects(projects.filter(project =>
        project.guideName.toLowerCase().includes(value.toLowerCase()) ||
        project.projectTitle.toLowerCase().includes(value.toLowerCase())
      ));
    } finally {
      setIsSearching(false);
    }
  };

  const handleGuideSelect = async (guide) => {
    setSelectedGuide(guide);
    try {
      // Fetch batches for this guide
      const response = await axios.get(`${API_URL}/batches/guide/${guide._id}`);
      setGuideBatches(response.data.data || []);
    } catch (error) {
      console.error('Error fetching guide batches:', error);
      setGuideBatches([]);
    }
  };

  return (
    <div className="home-page">
      <header className="home-header">
        <div className="header-content">
          <div className="logo-section" onClick={() => setActiveSection('all')} style={{ cursor: 'pointer' }}>
            <h1 className="logo">🚀 Project Sphere</h1>
            <p className="tagline">Collaborate. Create. Succeed.</p>
          </div>
          <div className="right-nav">
            <div className="nav-links">
              <button
                className={`nav-btn ${activeSection === 'all' ? 'active' : ''}`}
                onClick={() => setActiveSection('all')}
              >
                Home
              </button>
              <button
                className={`nav-btn ${activeSection === 'achievements' ? 'active' : ''}`}
                onClick={() => setActiveSection('achievements')}
              >
                Achievements
              </button>
              <button
                className={`nav-btn ${activeSection === 'projects' ? 'active' : ''}`}
                onClick={() => setActiveSection('projects')}
              >
                Projects
              </button>
            </div>
            <div className="auth-buttons">
              {user ? (
                <div className="profile-container" ref={dropdownRef}>
                  <div
                    className="profile-avatar"
                    onClick={() => setShowDropdown(!showDropdown)}
                    style={{ backgroundColor: getRoleColor() }}
                  >
                    {user?.name?.charAt(0).toUpperCase() || 'U'}
                  </div>
                  {showDropdown && (
                    <div className="profile-dropdown">
                      <div className="dropdown-user-info">
                        <span className="dropdown-name">{user?.name}</span>
                        <span className="dropdown-role">{user?.role?.toUpperCase()}</span>
                      </div>
                      <div className="dropdown-divider"></div>
                      <button onClick={() => { setShowDropdown(false); navigate('/'); }} className="dropdown-item">
                        Dashboard
                      </button>
                      <button onClick={handleLogout} className="dropdown-item logout-item">
                        Logout
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <button className="btn btn-primary" onClick={() => navigate('/register')}>
                  Get Started
                </button>
              )}
            </div>
          </div>
        </div>
      </header>

      {(activeSection === 'all') && (
        <>
          <section className="hero-section">
            <div className="hero-content">
              <h2>Welcome to Project Sphere</h2>
              <p>A comprehensive platform for managing academic projects, connecting students with guides, and tracking progress in real-time.</p>
              <div className="hero-features">
                <div className="feature">
                  <span className="feature-icon">📋</span>
                  <h3>Problem Statements</h3>
                  <p>Access curated problem statements from various domains</p>
                </div>
                <div className="feature">
                  <span className="feature-icon">👥</span>
                  <h3>Team Collaboration</h3>
                  <p>Form teams and work together on projects</p>
                </div>
                <div className="feature">
                  <span className="feature-icon">💬</span>
                  <h3>Direct Communication</h3>
                  <p>Chat with guides for real-time feedback</p>
                </div>
                <div className="feature">
                  <span className="feature-icon">✅</span>
                  <h3>Progress Tracking</h3>
                  <p>Monitor timeline and submission progress</p>
                </div>
              </div>
            </div>
          </section>

          <section className="coe-section">
            <h2>Center of Excellence (COE)</h2>
            <p className="section-subtitle">We support projects across multiple domains</p>
            <div className="coe-grid">
              <div className="coe-card">
                <span className="coe-icon">🔌</span>
                <h3>IOT</h3>
                <p>Internet of Things and Smart Systems</p>
              </div>
              <div className="coe-card">
                <span className="coe-icon">👓</span>
                <h3>AR-VR</h3>
                <p>Augmented and Virtual Reality</p>
              </div>
              <div className="coe-card">
                <span className="coe-icon">👁️</span>
                <h3>Deep Learning in Eye Disease Prognosis</h3>
                <p>Medical Imaging and Diagnostic AI</p>
              </div>
              <div className="coe-card">
                <span className="coe-icon">🔬</span>
                <h3>Advanced Research in AI</h3>
                <p>Cutting-edge Artificial Intelligence Research</p>
              </div>
              <div className="coe-card">
                <span className="coe-icon">☁️</span>
                <h3>Cloud Computing</h3>
                <p>AWS, Azure, and Infrastructure projects</p>
              </div>
              <div className="coe-card">
                <span className="coe-icon">✅</span>
                <h3>Data Analytics</h3>
                <p>Big Data and Business Intelligence</p>
              </div>
            </div>
          </section>
        </>
      )}

      {(activeSection === 'achievements') && (
        <Achievements />
      )}

      {(activeSection === 'projects') && (
        <section className="guide-search-section">
          <h2>Find Your Guide & Projects</h2>
          <p className="section-subtitle">Search for guides and view their assigned batches, students, and projects</p>

          <GuideSearch />
        </section>
      )}

      <footer className="home-footer">
        <div className="footer-content">
          <p className="footer-copyright">&copy; 2026 Project Sphere. All rights reserved.</p>
          <div className="developer-credits">
            <p className="developed-by">Developed by GNITS</p>
            <p className="dev-names">Tejaswi - 23251A05F0 | Sarayu - 23251A05F4 | Sravanthi - 23251A05F6</p>
            <p className="dev-guidance">under the guidance of Dr. M. Seetha - Dean R&D</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default HomePage;
