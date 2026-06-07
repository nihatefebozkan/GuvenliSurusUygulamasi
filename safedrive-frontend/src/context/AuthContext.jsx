import { createContext, useContext, useState, useEffect } from 'react';
import { jwtDecode } from 'jwt-decode';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  // Sayfa yenilenince localStorage'dan geri yükle
  useEffect(() => {
    const storedToken = localStorage.getItem('token');
    const storedUser = localStorage.getItem('user');

    if (storedToken) {
      try {
        const decoded = jwtDecode(storedToken);
        // Token süresi dolmuşsa temizle
        if (decoded.exp && decoded.exp * 1000 < Date.now()) {
          localStorage.removeItem('token');
          localStorage.removeItem('user');
        } else {
          setToken(storedToken);
          setUser(
            storedUser
              ? JSON.parse(storedUser)
              : {
                  userId: decoded.userId,
                  username: decoded.username,
                  role: decoded.role
                }
          );
        }
      } catch (err) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
      }
    }
    setLoading(false);
  }, []);

  const login = (newToken, userInfo) => {
    const decoded = jwtDecode(newToken);
    const finalUser = userInfo || {
      userId: decoded.userId,
      username: decoded.username,
      role: decoded.role
    };

    localStorage.setItem('token', newToken);
    localStorage.setItem('user', JSON.stringify(finalUser));
    setToken(newToken);
    setUser(finalUser);
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, token, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);

export default AuthContext;
