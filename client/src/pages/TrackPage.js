import React, { useState } from 'react';
import { Search } from 'lucide-react';
import api from '../api/axios';
import Navbar from '../components/Navbar';
import { StatusBadge, PriorityBadge, StatusTimeline } from '../components/StatusBadge';

export default function TrackPage() {
  const [ticketId, setTicketId] = useState('');
  const [complaint, setComplaint] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!ticketId.trim()) return;
    setLoading(true); setError(''); setComplaint(null);
    try {
      const res = await api.get(`/complaints/track/${ticketId.trim().toUpperCase()}`);
      setComplaint(res.data.complaint);
    } catch (err) {
      setError(err.response?.data?.message || 'Ticket not found.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <Navbar />
      <div className="container" style={{ paddingTop: 60, paddingBottom: 80, maxWidth: 700 }}>
        <div style={{ textAlign: 'center', marginBottom: 40 }}>
          <div style={{ fontSize: 56, marginBottom: 16 }}>🔍</div>
          <h1 style={{ fontSize: 32, fontWeight: 800, marginBottom: 12 }}>Track Your Complaint</h1>
          <p style={{ color: 'var(--text-muted)' }}>Enter your ticket ID to check the current status of your complaint.</p>
        </div>

        <form onSubmit={handleSearch}>
          <div style={{ display: 'flex', gap: 12 }}>
            <input
              className="form-control"
              placeholder="Enter Ticket ID (e.g. TKT-A1B2C3D4)"
              value={ticketId}
              onChange={(e) => setTicketId(e.target.value)}
              style={{ fontSize: 16, flex: 1 }}
            />
            <button className="btn btn-primary" type="submit" disabled={loading}>
              <Search size={18} />
              {loading ? 'Searching...' : 'Track'}
            </button>
          </div>
        </form>

        {error && <div className="alert alert-error" style={{ marginTop: 20 }}>❌ {error}</div>}

        {complaint && (
          <div style={{ marginTop: 32 }}>
            <div className="card" style={{ marginBottom: 20 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12, marginBottom: 20 }}>
                <div>
                  <div style={{ fontSize: 12, color: 'var(--text-subtle)', marginBottom: 4, fontWeight: 700, textTransform: 'uppercase' }}>Ticket ID</div>
                  <div style={{ fontSize: 22, fontWeight: 800, color: 'var(--primary)', letterSpacing: 1 }}>{complaint.ticketId}</div>
                </div>
                <StatusBadge status={complaint.status} />
              </div>

              <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 12 }}>{complaint.title}</h2>
              <p style={{ color: 'var(--text-muted)', fontSize: 14, marginBottom: 16, lineHeight: 1.7 }}>{complaint.description}</p>

              <div className="grid-2" style={{ marginBottom: 16 }}>
                <div>
                  <div style={{ fontSize: 12, color: 'var(--text-subtle)', fontWeight: 700, textTransform: 'uppercase', marginBottom: 4 }}>Department</div>
                  <div style={{ fontWeight: 600 }}>{complaint.department?.icon} {complaint.department?.name}</div>
                </div>
                <div>
                  <div style={{ fontSize: 12, color: 'var(--text-subtle)', fontWeight: 700, textTransform: 'uppercase', marginBottom: 4 }}>Priority</div>
                  <PriorityBadge priority={complaint.priority} />
                </div>
                <div>
                  <div style={{ fontSize: 12, color: 'var(--text-subtle)', fontWeight: 700, textTransform: 'uppercase', marginBottom: 4 }}>Submitted By</div>
                  <div style={{ fontSize: 14 }}>{complaint.submittedBy?.name}</div>
                </div>
                <div>
                  <div style={{ fontSize: 12, color: 'var(--text-subtle)', fontWeight: 700, textTransform: 'uppercase', marginBottom: 4 }}>Date Filed</div>
                  <div style={{ fontSize: 14 }}>{new Date(complaint.createdAt).toLocaleDateString()}</div>
                </div>
              </div>

              {complaint.imageUrl && (
                <div style={{ marginBottom: 16 }}>
                  <div style={{ fontSize: 12, color: 'var(--text-subtle)', fontWeight: 700, textTransform: 'uppercase', marginBottom: 8 }}>Attached Image</div>
                  <img src={complaint.imageUrl} alt="Complaint" style={{ maxWidth: '100%', borderRadius: 10, border: '1px solid var(--border)' }} onError={(e) => e.target.style.display='none'} />
                </div>
              )}

              {complaint.resolutionNote && (
                <div className="alert alert-success">
                  <strong>📝 Resolution Note:</strong> {complaint.resolutionNote}
                </div>
              )}
            </div>

            <div className="card">
              <h3 style={{ fontWeight: 700, marginBottom: 20 }}>📋 Status History</h3>
              <StatusTimeline history={complaint.statusHistory || []} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
