import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import Navbar from '../components/Navbar';

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true); setError('');
    try {
      const user = await login(form.email, form.password);
      toast.success(`Welcome back, ${user.name}!`);
      if (user.role === 'user') navigate('/dashboard');
      else navigate('/manager');
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <Navbar />
      <div style={{ display: 'flex', minHeight: 'calc(100vh - 68px)', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
        <div style={{ width: '100%', maxWidth: 420 }}>
          <div className="card">
            <div style={{ textAlign: 'center', marginBottom: 32 }}>
              <div style={{ fontSize: 48, marginBottom: 12 }}>🔐</div>
              <h1 style={{ fontSize: 26, fontWeight: 800 }}>Welcome Back</h1>
              <p style={{ color: 'var(--text-muted)', fontSize: 14, marginTop: 6 }}>Sign in to your GrievancePortal account</p>
            </div>

            {error && <div className="alert alert-error">{error}</div>}

            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>Email Address</label>
                <input className="form-control" type="email" placeholder="you@example.com" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
              </div>
              <div className="form-group">
                <label>Password</label>
                <input className="form-control" type="password" placeholder="••••••••" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required />
              </div>
              <button className="btn btn-primary" type="submit" disabled={loading} style={{ width: '100%', justifyContent: 'center', marginTop: 8 }}>
                {loading ? 'Signing in...' : '→ Sign In'}
              </button>
            </form>

            <div style={{ marginTop: 24, textAlign: 'center' }}>
              <div style={{ marginBottom: 16, padding: '12px', background: 'rgba(99,102,241,0.08)', borderRadius: 'var(--radius-sm)', fontSize: 12, color: 'var(--text-muted)', lineHeight: 1.8 }}>
                <strong style={{ color: 'var(--primary-light)' }}>Demo Credentials:</strong><br />
                Admin: admin@grievance.com / admin123<br />
                Manager: manager.public.works@grievance.com / manager123
              </div>
              <p style={{ fontSize: 14, color: 'var(--text-muted)' }}>
                Don't have an account? <Link to="/register" style={{ color: 'var(--primary-light)', fontWeight: 600 }}>Register here</Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
