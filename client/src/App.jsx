import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './store/authStore.js';
import { useThemeStore } from './store/themeStore.js';
import { authApi } from './api/auth.js';
import LoginPage from './pages/LoginPage.jsx';
import RegisterPage from './pages/RegisterPage.jsx';
import ChatPage from './pages/ChatPage.jsx';

function ProtectedRoute({ children }) {
  const { isAuthenticated, isLoading } = useAuthStore();
  if (isLoading) return (
    <div className="flex h-full items-center justify-center bg-[var(--bg-base)]">
      <div className="h-8 w-8 animate-spin rounded-full border-4 border-white/20 border-t-white" />
    </div>
  );
  return isAuthenticated ? children : <Navigate to="/login" replace />;
}

export default function App() {
  const { setUser, clearUser } = useAuthStore();
  const { init } = useThemeStore();

  useEffect(() => {
    init();
    authApi.me()
      .then(res => setUser(res.data.user))
      .catch(() => clearUser());
  }, []);

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login"    element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/chat"     element={<ProtectedRoute><ChatPage /></ProtectedRoute>} />
        <Route path="*"         element={<Navigate to="/chat" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
