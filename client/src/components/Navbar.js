import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Search, LogOut, Moon, Sun } from 'lucide-react';

export default function Navbar() {
  const { user, logout } = useAuth();
  const location = useLocation();
  const [isDark, setIsDark] = useState(() => localStorage.getItem('theme') === 'dark');

  useEffect(() => {
    if (isDark) {
      document.documentElement.setAttribute('data-theme', 'dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.removeAttribute('data-theme');
      localStorage.setItem('theme', 'light');
    }
  }, [isDark]);

  const toggleTheme = () => setIsDark(!isDark);

  const isActive = (path) => location.pathname === path ? 'nav-link active' : 'nav-link';

  return (
    <nav className="navbar">
      <Link to="/" className="navbar-brand">
        <div className="navbar-logo">⚖️</div>
        <span className="navbar-title">GrievancePortal</span>
      </Link>

      <div className="navbar-nav">
        {!user && (
          <>
            <Link to="/track" className={isActive('/track')}>
              <Search size={14} style={{ display: 'inline', marginRight: 4 }} />Track
            </Link>
            <Link to="/login" className="btn btn-secondary btn-sm">Login</Link>
            <Link to="/register" className="btn btn-primary btn-sm">Register</Link>
          </>
        )}

        <button onClick={toggleTheme} className="btn btn-icon btn-secondary" style={{ marginLeft: 8 }} title="Toggle Theme">
          {isDark ? <Sun size={16} /> : <Moon size={16} />}
        </button>

        {user?.role === 'user' && (
          <>
            <Link to="/dashboard" className={isActive('/dashboard')}>Dashboard</Link>
            <Link to="/my-complaints" className={isActive('/my-complaints')}>My Complaints</Link>
            <Link to="/submit" className={isActive('/submit')}>Submit</Link>
            <Link to="/track" className={isActive('/track')}>Track</Link>
          </>
        )}

        {(user?.role === 'manager' || user?.role === 'admin') && (
          <>
            <Link to="/manager" className={isActive('/manager')}>Dashboard</Link>
            <Link to="/manager/complaints" className={isActive('/manager/complaints')}>Complaints</Link>
            {user.role === 'admin' && <Link to="/admin/users" className={isActive('/admin/users')}>Users</Link>}
          </>
        )}

        {user && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginLeft: 8 }}>
            <div className="nav-user">
              <span style={{ fontSize: 18 }}>{user.role === 'admin' ? '👑' : user.role === 'manager' ? '🏢' : '👤'}</span>
              <div>
                <div className="nav-user-name">{user.name?.split(' ')[0]}</div>
                <div className="nav-user-role">{user.role}</div>
              </div>
            </div>
            <button onClick={logout} className="btn btn-icon btn-secondary" title="Logout">
              <LogOut size={16} />
            </button>
          </div>
        )}
      </div>
    </nav>
  );
}
