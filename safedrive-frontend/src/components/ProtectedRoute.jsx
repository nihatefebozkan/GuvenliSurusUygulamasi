import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function ProtectedRoute({ children, requireRole }) {
  const { token, user } = useAuth();

  // Token yoksa login'e yönlendir
  if (!token) {
    return <Navigate to="/login" replace />;
  }

  // Rol gerekiyorsa ve eşleşmiyorsa 403 göster
  if (requireRole && user?.role !== requireRole) {
    return (
      <div className="forbidden">
        <h1>403</h1>
        <p>Bu sayfaya erişim yetkiniz yok.</p>
      </div>
    );
  }

  return children;
}
