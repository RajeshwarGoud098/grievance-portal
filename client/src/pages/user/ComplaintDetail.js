import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../api/axios';
import Navbar from '../../components/Navbar';
import { StatusBadge, PriorityBadge, StatusTimeline } from '../../components/StatusBadge';
import { ArrowLeft } from 'lucide-react';

export default function ComplaintDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [complaint, setComplaint] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    api.get(`/complaints/${id}`)
      .then((res) => setComplaint(res.data.complaint))
      .catch((err) => setError(err.response?.data?.message || 'Failed to load complaint.'))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <div><Navbar /><div className="loading-center" style={{ minHeight: 'calc(100vh - 68px)' }}><div className="spinner" /></div></div>;
  if (error) return <div><Navbar /><div className="container" style={{ paddingTop: 40 }}><div className="alert alert-error">{error}</div></div></div>;

  return (
    <div>
      <Navbar />
      <div className="container" style={{ paddingTop: 36, paddingBottom: 60, maxWidth: 800 }}>
        <button className="btn btn-secondary btn-sm" onClick={() => navigate(-1)} style={{ marginBottom: 24 }}>
          <ArrowLeft size={16} /> Back
        </button>

        <div className="card" style={{ marginBottom: 20 }}>
          {/* Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12, marginBottom: 24 }}>
            <div>
              <code style={{ fontSize: 13, color: 'var(--primary)', fontWeight: 700, letterSpacing: 1 }}>{complaint.ticketId}</code>
              <h1 style={{ fontSize: 22, fontWeight: 800, marginTop: 6 }}>{complaint.title}</h1>
            </div>
            <StatusBadge status={complaint.status} />
          </div>

          {/* Description */}
          <div style={{ marginBottom: 24 }}>
            <div style={{ fontSize: 12, color: 'var(--text-subtle)', fontWeight: 700, textTransform: 'uppercase', marginBottom: 8 }}>Description</div>
            <p style={{ color: 'var(--text-muted)', lineHeight: 1.8, fontSize: 14 }}>{complaint.description}</p>
          </div>

          {/* Meta */}
          <div className="grid-2" style={{ marginBottom: 20 }}>
            <div>
              <div style={{ fontSize: 12, color: 'var(--text-subtle)', fontWeight: 700, textTransform: 'uppercase', marginBottom: 6 }}>Department</div>
              <div style={{ fontWeight: 600 }}>{complaint.department?.icon} {complaint.department?.name}</div>
            </div>
            <div>
              <div style={{ fontSize: 12, color: 'var(--text-subtle)', fontWeight: 700, textTransform: 'uppercase', marginBottom: 6 }}>Priority</div>
              <PriorityBadge priority={complaint.priority} />
            </div>
            <div>
              <div style={{ fontSize: 12, color: 'var(--text-subtle)', fontWeight: 700, textTransform: 'uppercase', marginBottom: 6 }}>Filed On</div>
              <div style={{ fontSize: 14 }}>{new Date(complaint.createdAt).toLocaleString()}</div>
            </div>
            {complaint.resolvedAt && (
              <div>
                <div style={{ fontSize: 12, color: 'var(--text-subtle)', fontWeight: 700, textTransform: 'uppercase', marginBottom: 6 }}>Resolved On</div>
                <div style={{ fontSize: 14, color: 'var(--success)' }}>{new Date(complaint.resolvedAt).toLocaleString()}</div>
              </div>
            )}
          </div>

          {/* Image */}
          {complaint.imageUrl && (
            <div style={{ marginBottom: 20 }}>
              <div style={{ fontSize: 12, color: 'var(--text-subtle)', fontWeight: 700, textTransform: 'uppercase', marginBottom: 8 }}>Attached Image</div>
              <img src={complaint.imageUrl} alt="Complaint" style={{ maxWidth: '100%', borderRadius: 10, border: '1px solid var(--border)' }} onError={(e) => e.target.style.display='none'} />
            </div>
          )}

          {/* Resolution Note */}
          {complaint.resolutionNote && (
            <div className="alert alert-success">
              <strong>📝 Resolution Note:</strong> {complaint.resolutionNote}
            </div>
          )}
        </div>

        {/* Timeline */}
        <div className="card">
          <h2 style={{ fontWeight: 700, marginBottom: 24 }}>📋 Status History</h2>
          <StatusTimeline history={complaint.statusHistory || []} />
        </div>
      </div>
    </div>
  );
}
