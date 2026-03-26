import { Outlet, useNavigate } from 'react-router-dom';
import { useState, useRef, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import './Layout.css';

function Layout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
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

  return (
    <div className="layout">
      <header className="header">
        <div className="header-content">
          <div className="logo">
            <span className="logo-icon">📚</span>
            <span className="logo-text">ProjectSphere</span>
          </div>
          <div className="user-info">
            <button onClick={() => navigate('/home')} className="home-btn" style={{
              marginRight: '15px',
              padding: '6px 12px',
              borderRadius: '6px',
              border: '1px solid var(--border-color)',
              background: 'transparent',
              color: 'var(--text-color)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: '14px',
              fontWeight: '500',
              transition: 'all 0.2s'
            }}>
              Home
            </button>
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
          </div>
        </div>
      </header>
      <main className="main-content">
        <Outlet />
      </main>
    </div>
  );
}

export default Layout;

