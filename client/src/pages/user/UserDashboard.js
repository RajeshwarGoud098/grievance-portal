import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import api from '../../api/axios';
import Navbar from '../../components/Navbar';
import { StatusBadge } from '../../components/StatusBadge';
import { PlusCircle, FileText, Clock } from 'lucide-react';

export default function UserDashboard() {
  const { user } = useAuth();
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/complaints/my').then((res) => setComplaints(res.data.complaints)).finally(() => setLoading(false));
  }, []);

  const stats = {
    total: complaints.length,
    received: complaints.filter((c) => c.status === 'Received').length,
    review: complaints.filter((c) => c.status === 'Under Review').length,
    resolved: complaints.filter((c) => c.status === 'Resolved').length,
  };

  return (
    <div>
      <Navbar />
      <div className="container" style={{ paddingTop: 36, paddingBottom: 60 }}>
        {/* Welcome */}
        <div className="card" style={{ marginBottom: 28, background: 'linear-gradient(135deg, rgba(99,102,241,0.15) 0%, rgba(6,182,212,0.1) 100%)', borderColor: 'rgba(99,102,241,0.3)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
            <div>
              <h1 style={{ fontSize: 24, fontWeight: 800, marginBottom: 6 }}>Welcome back, {user?.name?.split(' ')[0]} 👋</h1>
              <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>Track your complaints and submit new ones from your dashboard.</p>
            </div>
            <Link to="/submit" className="btn btn-primary">
              <PlusCircle size={18} /> Submit New Complaint
            </Link>
          </div>
        </div>

        {/* Stats */}
        <div className="grid-4" style={{ marginBottom: 32 }}>
          {[
            { label: 'Total Complaints', value: stats.total, icon: '📋', color: 'var(--primary)' },
            { label: 'Received', value: stats.received, icon: '📩', color: 'var(--primary)' },
            { label: 'Under Review', value: stats.review, icon: '🔍', color: 'var(--warning)' },
            { label: 'Resolved', value: stats.resolved, icon: '✅', color: 'var(--success)' },
          ].map((s, i) => (
            <div className="stat-card" key={i}>
              <div style={{ fontSize: 28, marginBottom: 8 }}>{s.icon}</div>
              <div className="stat-number" style={{ fontSize: 28 }}>{s.value}</div>
              <div className="stat-label">{s.label}</div>
            </div>
          ))}
        </div>

        {/* Quick Actions */}
        <div className="grid-3" style={{ marginBottom: 32 }}>
          {[
            { to: '/submit', icon: <PlusCircle size={24} />, title: 'Submit Complaint', desc: 'File a new grievance to a department', color: 'var(--primary)' },
            { to: '/my-complaints', icon: <FileText size={24} />, title: 'My Complaints', desc: 'View all your submitted complaints', color: 'var(--secondary)' },
            { to: '/track', icon: <Clock size={24} />, title: 'Track by Ticket', desc: 'Enter a ticket ID to track status', color: 'var(--accent)' },
          ].map((action, i) => (
            <Link to={action.to} className="card" key={i} style={{ textDecoration: 'none', display: 'block' }}>
              <div style={{ color: action.color, marginBottom: 12 }}>{action.icon}</div>
              <h3 style={{ fontWeight: 700, marginBottom: 6 }}>{action.title}</h3>
              <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>{action.desc}</p>
            </Link>
          ))}
        </div>

        {/* Recent Complaints */}
        <div className="section-header">
          <h2 className="section-title">Recent Complaints</h2>
          <Link to="/my-complaints" className="btn btn-secondary btn-sm">View All →</Link>
        </div>

        {loading ? (
          <div className="loading-center"><div className="spinner" /></div>
        ) : complaints.length === 0 ? (
          <div className="card empty-state">
            <div className="empty-icon">📭</div>
            <div className="empty-title">No complaints yet</div>
            <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 20 }}>You haven't filed any complaints. Submit your first one!</p>
            <Link to="/submit" className="btn btn-primary">Submit Complaint</Link>
          </div>
        ) : (
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>Ticket ID</th>
                  <th>Title</th>
                  <th>Department</th>
                  <th>Status</th>
                  <th>Date</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {complaints.slice(0, 5).map((c) => (
                  <tr key={c._id}>
                    <td><code style={{ color: 'var(--primary-light)', fontSize: 12 }}>{c.ticketId}</code></td>
                    <td style={{ fontWeight: 500 }}>{c.title}</td>
                    <td>{c.department?.icon} {c.department?.name}</td>
                    <td><StatusBadge status={c.status} /></td>
                    <td style={{ color: 'var(--text-muted)', fontSize: 13 }}>{new Date(c.createdAt).toLocaleDateString()}</td>
                    <td><Link to={`/complaint/${c._id}`} className="btn btn-secondary btn-sm">View</Link></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
