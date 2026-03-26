import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import HomePage from './pages/HomePage';
import Login from './pages/Login';
import Register from './pages/Register';
import RegisterGuide from './pages/RegisterGuide';
import RegisterAdmin from './pages/RegisterAdmin';
import ForgotPassword from './pages/ForgotPassword';
import StudentDashboard from './pages/student/StudentDashboard';
import GuideDashboard from './pages/guide/GuideDashboard';
import AdminDashboard from './pages/admin/AdminDashboard';
import Layout from './components/Layout';
import AchievementCategory from './pages/AchievementCategory';

function App() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        background: 'var(--bg-subtle)',
        color: 'var(--primary)',
        fontSize: '24px',
        fontWeight: 'bold'
      }}>
        <div className="spinner" style={{ marginBottom: '20px' }}>⏳</div>
        Loading Project Sphere...
      </div>
    );
  }

  return (
    <Routes>
      <Route path="/home" element={<HomePage />} />
      <Route path="/achievements/:category" element={<AchievementCategory />} />
      <Route path="/login" element={!user ? <Login /> : <Navigate to="/" />} />
      <Route path="/register" element={<Navigate to="/register/guide" />} />
      <Route path="/register/guide" element={!user ? <RegisterGuide /> : <Navigate to="/" />} />
      <Route path="/register/admin" element={!user ? <RegisterAdmin /> : <Navigate to="/" />} />
      <Route path="/forgot-password" element={!user ? <ForgotPassword /> : <Navigate to="/" />} />

      <Route path="/" element={user ? <Layout /> : <Navigate to="/home" />}>
        {user?.role === 'student' && (
          <Route index element={<StudentDashboard />} />
        )}
        {user?.role === 'guide' && (
          <Route index element={<GuideDashboard />} />
        )}
        {user?.role === 'admin' && (
          <Route index element={<AdminDashboard />} />
        )}
        <Route path="*" element={<Navigate to="/" />} />
      </Route>
    </Routes>
  );
}

export default App;

