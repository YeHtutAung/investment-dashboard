import { useState, useEffect } from 'react';
import { Login } from './pages/Login';
import { Register } from './pages/Register';
import { Dashboard } from './pages/Dashboard';
import { api } from './lib/api';

type User = {
  id: string;
  email: string;
  name: string;
  provider?: string;
};

type Page = 'login' | 'register' | 'dashboard';

function App() {
  const [page, setPage] = useState<Page>('login');
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // Check for existing session on load
  useEffect(() => {
    const checkAuth = async () => {
      const res = await api.auth.me();
      if (res.success) {
        setUser(res.data.user);
        setPage('dashboard');
      }
      setLoading(false);
    };
    checkAuth();
  }, []);

  // Handle Google OAuth redirect
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const error = params.get('error');
    if (error) {
      // Clear the error from URL
      window.history.replaceState({}, '', window.location.pathname);
    }
    // If we're on /dashboard after Google OAuth, check auth
    if (window.location.pathname === '/dashboard') {
      window.history.replaceState({}, '', '/');
    }
  }, []);

  const handleLogin = (user: User) => {
    setUser(user);
    setPage('dashboard');
  };

  const handleLogout = () => {
    setUser(null);
    setPage('login');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50">
        <div className="w-12 h-12 border-4 border-amber-200 border-t-amber-600 rounded-full animate-spin mb-4" />
        <div className="text-lg text-gray-600">Loading...</div>
      </div>
    );
  }

  switch (page) {
    case 'login':
      return <Login onLogin={handleLogin} onNavigate={setPage} />;
    case 'register':
      return <Register onRegister={handleLogin} onNavigate={setPage} />;
    case 'dashboard':
      return user ? <Dashboard user={user} onLogout={handleLogout} /> : null;
  }
}

export default App;
