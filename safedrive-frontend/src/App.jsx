import { Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { useAuth } from './context/AuthContext';

import Navbar from './components/Navbar';
import ProtectedRoute from './components/ProtectedRoute';

import Landing from './pages/Landing';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Alarms from './pages/Alarms';
import Devices from './pages/Devices';
import Users from './pages/Users';
import Applications from './pages/Applications';
import CompanyLogin from './pages/CompanyLogin';
import CompanyDashboard from './pages/CompanyDashboard';

// Giriş yapılmış sayfalarda Navbar'ı göster
const Layout = ({ children }) => (
  <>
    <Navbar />
    {children}
  </>
);

export default function App() {
  const { loading } = useAuth();

  // İlk yüklemede localStorage okunurken bekle
  if (loading) {
    return (
      <div className="spinner-wrap">
        <div className="spinner" />
      </div>
    );
  }

  return (
    <>
      <Toaster position="top-right" />
      <Routes>
        {/* Açılış sayfası (herkese açık) */}
        <Route path="/" element={<Landing />} />

        <Route path="/login" element={<Login />} />
        <Route path="/company-login" element={<CompanyLogin />} />

        {/* Lojistik şirketi filo takip paneli (kendi başlığı var, Navbar yok) */}
        <Route
          path="/company"
          element={
            <ProtectedRoute requireRole="company">
              <CompanyDashboard />
            </ProtectedRoute>
          }
        />

        {/* Yönetici paneli ana sayfası */}
        <Route
          path="/admin"
          element={
            <ProtectedRoute requireRole="admin">
              <Layout>
                <Dashboard />
              </Layout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/applications"
          element={
            <ProtectedRoute requireRole="admin">
              <Layout>
                <Applications />
              </Layout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/alarms"
          element={
            <ProtectedRoute>
              <Layout>
                <Alarms />
              </Layout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/devices"
          element={
            <ProtectedRoute>
              <Layout>
                <Devices />
              </Layout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/users"
          element={
            <ProtectedRoute requireRole="admin">
              <Layout>
                <Users />
              </Layout>
            </ProtectedRoute>
          }
        />
      </Routes>
    </>
  );
}
