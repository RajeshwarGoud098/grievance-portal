import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import api from '../../api/axios';
import Navbar from '../../components/Navbar';
import { StatusBadge } from '../../components/StatusBadge';

export default function ManagerDashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState({ total: 0, received: 0, underReview: 0, resolved: 0, rejected: 0 });
  const [recent, setRecent] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get('/complaints/stats'),
      api.get('/complaints/department'),
    ]).then(([statsRes, complaintsRes]) => {
      setStats(statsRes.data.stats);
      setRecent(complaintsRes.data.complaints.slice(0, 5));
    }).finally(() => setLoading(false));
  }, []);

  const statCards = [
    { label: 'Total', value: stats.total, icon: '📋', color: '#6366f1' },
    { label: 'Received', value: stats.received, icon: '📩', color: '#818cf8' },
    { label: 'Under Review', value: stats.underReview, icon: '🔍', color: '#f59e0b' },
    { label: 'Resolved', value: stats.resolved, icon: '✅', color: '#10b981' },
    { label: 'Rejected', value: stats.rejected, icon: '❌', color: '#ef4444' },
  ];

  return (
    <div>
      <Navbar />
      <div className="container" style={{ paddingTop: 36, paddingBottom: 60 }}>
        {/* Header */}
        <div className="card" style={{ marginBottom: 28, background: 'linear-gradient(135deg, rgba(99,102,241,0.15) 0%, rgba(6,182,212,0.1) 100%)', borderColor: 'rgba(99,102,241,0.3)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
            <div>
              <h1 style={{ fontSize: 24, fontWeight: 800, marginBottom: 6 }}>
                {user?.role === 'admin' ? '👑 Admin Dashboard' : '🏢 Manager Dashboard'}
              </h1>
              <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>
                {user?.role === 'admin' ? 'Manage all complaints and users across departments.' : `Managing complaints for ${user?.department?.name || 'your department'}.`}
              </p>
            </div>
            <Link to="/manager/complaints" className="btn btn-primary">View All Complaints →</Link>
          </div>
        </div>

        {/* Stats */}
        {loading ? (
          <div className="loading-center"><div className="spinner" /></div>
        ) : (
          <>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 16, marginBottom: 32 }}>
              {statCards.map((s, i) => (
                <div className="stat-card" key={i}>
                  <div style={{ fontSize: 28, marginBottom: 8 }}>{s.icon}</div>
                  <div className="stat-number" style={{ fontSize: 28, background: `linear-gradient(135deg, ${s.color}, #06b6d4)`, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>{s.value}</div>
                  <div className="stat-label">{s.label}</div>
                </div>
              ))}
            </div>

            {/* Progress bar */}
            <div className="card" style={{ marginBottom: 28 }}>
              <h3 style={{ fontWeight: 700, marginBottom: 16 }}>Resolution Overview</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {[
                  { label: 'Received', value: stats.received, color: '#6366f1' },
                  { label: 'Under Review', value: stats.underReview, color: '#f59e0b' },
                  { label: 'Resolved', value: stats.resolved, color: '#10b981' },
                  { label: 'Rejected', value: stats.rejected, color: '#ef4444' },
                ].map((bar, i) => {
                  const pct = stats.total ? Math.round((bar.value / stats.total) * 100) : 0;
                  return (
                    <div key={i}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4, fontSize: 13 }}>
                        <span style={{ color: 'var(--text-muted)' }}>{bar.label}</span>
                        <span style={{ fontWeight: 600 }}>{bar.value} ({pct}%)</span>
                      </div>
                      <div style={{ height: 8, background: 'rgba(255,255,255,0.06)', borderRadius: 4, overflow: 'hidden' }}>
                        <div style={{ height: '100%', width: `${pct}%`, background: bar.color, borderRadius: 4, transition: 'width 0.8s ease' }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Recent */}
            <div className="section-header">
              <h2 className="section-title">Recent Complaints</h2>
              <Link to="/manager/complaints" className="btn btn-secondary btn-sm">View All →</Link>
            </div>

            {recent.length === 0 ? (
              <div className="card empty-state">
                <div className="empty-icon">📭</div>
                <div className="empty-title">No complaints yet</div>
              </div>
            ) : (
              <div className="table-wrapper">
                <table>
                  <thead>
                    <tr>
                      <th>Ticket ID</th>
                      <th>Title</th>
                      <th>Department</th>
                      <th>Citizen</th>
                      <th>Status</th>
                      <th>Date</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recent.map((c) => (
                      <tr key={c._id}>
                        <td><code style={{ color: 'var(--primary)', fontSize: 12 }}>{c.ticketId}</code></td>
                        <td style={{ fontWeight: 500 }}>{c.title}</td>
                        <td>{c.department?.icon} {c.department?.name}</td>
                        <td style={{ fontSize: 13, color: 'var(--text-muted)' }}>{c.submittedBy?.name}</td>
                        <td><StatusBadge status={c.status} /></td>
                        <td style={{ color: 'var(--text-muted)', fontSize: 13 }}>{new Date(c.createdAt).toLocaleDateString()}</td>
                        <td><Link to={`/manager/complaint/${c._id}`} className="btn btn-secondary btn-sm">Manage</Link></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
