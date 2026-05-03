/**
 * ComplaintManage — Manager's status update panel
 *
 * Fixes:
 * - Problem #4: Only shows VALID next states (state machine UI)
 * - Problem #4: Displays full audit history (who + when)
 * - Problem #3: Admin can reassign to another department
 */
import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../api/axios';
import Navbar from '../../components/Navbar';
import { StatusBadge, PriorityBadge, StatusTimeline } from '../../components/StatusBadge';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';
import { ArrowLeft, Save, RefreshCw, AlertTriangle, Clock } from 'lucide-react';

/* ------------------------------------------------------------------ */
/*  State machine — mirrors the server's VALID_TRANSITIONS             */
/* ------------------------------------------------------------------ */
const VALID_TRANSITIONS = {
  'Received':     ['Under Review', 'Rejected'],
  'Under Review': ['Resolved', 'Rejected'],
  'Resolved':     [],
  'Rejected':     [],
};

const STATUS_LABELS = {
  'Under Review': { emoji: '🔍', desc: 'Acknowledge and begin investigation' },
  'Resolved':     { emoji: '✅', desc: 'Mark as resolved with a resolution note' },
  'Rejected':     { emoji: '❌', desc: 'Reject with a clear reason for the citizen' },
};

export default function ComplaintManage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [complaint, setComplaint] = useState(null);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [reassigning, setReassigning] = useState(false);
  const [showReassign, setShowReassign] = useState(false);
  const [form, setForm] = useState({ status: '', note: '' });
  const [reassignForm, setReassignForm] = useState({ departmentId: '', reason: '' });
  const [error, setError] = useState('');

  useEffect(() => {
    Promise.all([
      api.get(`/complaints/${id}`),
      user?.role === 'admin' ? api.get('/departments') : Promise.resolve(null),
    ])
      .then(([cRes, dRes]) => {
        setComplaint(cRes.data.complaint);
        setForm({ status: '', note: '' });
        if (dRes) setDepartments(dRes.data.departments);
      })
      .catch((err) => setError(err.response?.data?.message || 'Failed to load.'))
      .finally(() => setLoading(false));
  }, [id, user]);

  const allowedStatuses = VALID_TRANSITIONS[complaint?.status] || [];
  const isTerminal = allowedStatuses.length === 0;

  const handleUpdate = async (e) => {
    e.preventDefault();
    if (!form.status) return toast.error('Please select a status.');
    if ((form.status === 'Resolved' || form.status === 'Rejected') && !form.note.trim()) {
      return toast.error('A note is required when resolving or rejecting.');
    }
    setUpdating(true);
    try {
      const res = await api.put(`/complaints/${id}/status`, form);
      setComplaint(res.data.complaint);
      setForm({ status: '', note: '' });
      toast.success('✅ Status updated successfully!');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Update failed.');
    } finally {
      setUpdating(false);
    }
  };

  const handleReassign = async (e) => {
    e.preventDefault();
    if (!reassignForm.departmentId || !reassignForm.reason.trim()) {
      return toast.error('Department and reason are required.');
    }
    setReassigning(true);
    try {
      const res = await api.put(`/complaints/${id}/reassign`, reassignForm);
      setComplaint(res.data.complaint);
      setShowReassign(false);
      setReassignForm({ departmentId: '', reason: '' });
      toast.success('📤 Complaint reassigned successfully!');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Reassignment failed.');
    } finally {
      setReassigning(false);
    }
  };

  if (loading) return <div><Navbar /><div className="loading-center" style={{ minHeight: 'calc(100vh - 68px)' }}><div className="spinner" /></div></div>;
  if (error) return <div><Navbar /><div className="container" style={{ paddingTop: 40 }}><div className="alert alert-error">{error}</div></div></div>;

  return (
    <div>
      <Navbar />
      <div className="container" style={{ paddingTop: 36, paddingBottom: 60, maxWidth: 960 }}>
        <button className="btn btn-secondary btn-sm" onClick={() => navigate(-1)} style={{ marginBottom: 24 }}>
          <ArrowLeft size={16} /> Back
        </button>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 24, alignItems: 'start' }}>

          {/* ====== LEFT: Complaint Details ====== */}
          <div>
            <div className="card" style={{ marginBottom: 20 }}>
              {/* Header */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12, marginBottom: 20 }}>
                <div>
                  <code style={{ fontSize: 13, color: 'var(--primary)', fontWeight: 700, letterSpacing: 1 }}>
                    {complaint.ticketId}
                  </code>
                  <h1 style={{ fontSize: 20, fontWeight: 800, marginTop: 6 }}>{complaint.title}</h1>
                </div>
                <StatusBadge status={complaint.status} />
              </div>

              <p style={{ color: 'var(--text-muted)', lineHeight: 1.8, fontSize: 14, marginBottom: 20 }}>{complaint.description}</p>

              {/* SLA / Overdue warning */}
              {complaint.isOverdue && complaint.status !== 'Resolved' && complaint.status !== 'Rejected' && (
                <div className="alert alert-error" style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
                  <AlertTriangle size={16} />
                  <strong>SLA Breached!</strong> This complaint is past its due date.
                </div>
              )}
              {complaint.dueDate && !complaint.isOverdue && (
                <div className="alert alert-info" style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
                  <Clock size={16} />
                  Due by: <strong>{new Date(complaint.dueDate).toLocaleDateString()}</strong>
                </div>
              )}

              <div className="grid-2" style={{ marginBottom: 16 }}>
                <div>
                  <div style={{ fontSize: 11, color: 'var(--text-subtle)', fontWeight: 700, textTransform: 'uppercase', marginBottom: 4 }}>Department</div>
                  <div style={{ fontWeight: 600 }}>{complaint.department?.icon} {complaint.department?.name}</div>
                </div>
                <div>
                  <div style={{ fontSize: 11, color: 'var(--text-subtle)', fontWeight: 700, textTransform: 'uppercase', marginBottom: 4 }}>Priority</div>
                  <PriorityBadge priority={complaint.priority} />
                </div>
                <div>
                  <div style={{ fontSize: 11, color: 'var(--text-subtle)', fontWeight: 700, textTransform: 'uppercase', marginBottom: 4 }}>Citizen</div>
                  <div style={{ fontSize: 14, fontWeight: 500 }}>{complaint.submittedBy?.name}</div>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{complaint.submittedBy?.email}</div>
                  {complaint.submittedBy?.phone && <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{complaint.submittedBy.phone}</div>}
                </div>
                <div>
                  <div style={{ fontSize: 11, color: 'var(--text-subtle)', fontWeight: 700, textTransform: 'uppercase', marginBottom: 4 }}>Filed On</div>
                  <div style={{ fontSize: 14 }}>{new Date(complaint.createdAt).toLocaleString()}</div>
                </div>
              </div>

              {complaint.imageUrl && (
                <div style={{ marginBottom: 16 }}>
                  <div style={{ fontSize: 11, color: 'var(--text-subtle)', fontWeight: 700, textTransform: 'uppercase', marginBottom: 8 }}>Evidence Image</div>
                  <img src={complaint.imageUrl} alt="Evidence" style={{ maxWidth: '100%', borderRadius: 10, border: '1px solid var(--border)' }} onError={(e) => e.target.style.display = 'none'} />
                </div>
              )}

              {complaint.resolutionNote && (
                <div className="alert alert-success">
                  <strong>📝 Resolution Note:</strong> {complaint.resolutionNote}
                </div>
              )}

              {/* Department Reassignment History (Problem #3) */}
              {complaint.departmentHistory?.length > 0 && (
                <div style={{ marginTop: 16, padding: 14, background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.2)', borderRadius: 10 }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--warning)', marginBottom: 8 }}>🔄 Reassignment History</div>
                  {complaint.departmentHistory.map((h, i) => (
                    <div key={i} style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 4 }}>
                      {new Date(h.changedAt).toLocaleDateString()} — Moved from <strong>{h.department?.name}</strong> — "{h.reason}"
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Status Timeline */}
            <div className="card">
              <h3 style={{ fontWeight: 700, marginBottom: 20 }}>📋 Audit Trail (Who Updated + When)</h3>
              <StatusTimeline history={complaint.statusHistory || []} />
            </div>
          </div>

          {/* ====== RIGHT: Action Panel ====== */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

            {/* Status Update Panel */}
            <div className="card" style={{ position: 'sticky', top: 88 }}>
              <h3 style={{ fontWeight: 700, marginBottom: 4 }}>⚙️ Update Status</h3>

              {isTerminal ? (
                <div style={{ padding: '16px', background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.2)', borderRadius: 10, textAlign: 'center' }}>
                  <div style={{ fontSize: 24, marginBottom: 8 }}>{complaint.status === 'Resolved' ? '✅' : '❌'}</div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-muted)' }}>
                    This complaint is in a <strong>terminal state</strong> ({complaint.status}).
                    No further status changes are allowed.
                  </div>
                </div>
              ) : (
                <form onSubmit={handleUpdate}>
                  <p style={{ fontSize: 12, color: 'var(--text-subtle)', marginBottom: 16 }}>
                    Current: <StatusBadge status={complaint.status} />
                  </p>

                  <div className="form-group">
                    <label>Next Status *</label>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                      {allowedStatuses.map((s) => (
                        <label key={s} style={{
                          display: 'flex', alignItems: 'center', gap: 10,
                          padding: '10px 14px', borderRadius: 8, cursor: 'pointer',
                          border: `1px solid ${form.status === s ? 'var(--primary)' : 'var(--border)'}`,
                          background: form.status === s ? 'rgba(99,102,241,0.1)' : 'rgba(255,255,255,0.03)',
                          transition: 'all 0.2s',
                        }}>
                          <input type="radio" name="status" value={s} checked={form.status === s} onChange={(e) => setForm({ ...form, status: e.target.value })} style={{ display: 'none' }} />
                          <span style={{ fontSize: 18 }}>{STATUS_LABELS[s]?.emoji}</span>
                          <div>
                            <div style={{ fontWeight: 600, fontSize: 13 }}>{s}</div>
                            <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{STATUS_LABELS[s]?.desc}</div>
                          </div>
                        </label>
                      ))}
                    </div>
                  </div>

                  <div className="form-group">
                    <label>
                      Note {(form.status === 'Resolved' || form.status === 'Rejected') ? '*' : '(optional)'}
                    </label>
                    <textarea
                      className="form-control"
                      rows={3}
                      placeholder={
                        form.status === 'Resolved' ? 'Describe how this was resolved...' :
                        form.status === 'Rejected' ? 'Explain why this is being rejected...' :
                        'Add a note about this update...'
                      }
                      value={form.note}
                      onChange={(e) => setForm({ ...form, note: e.target.value })}
                    />
                  </div>

                  <button className="btn btn-primary" type="submit" disabled={updating || !form.status} style={{ width: '100%', justifyContent: 'center' }}>
                    <Save size={16} />
                    {updating ? 'Updating...' : 'Update Status'}
                  </button>
                </form>
              )}

              {/* Workflow Guide */}
              <div style={{ marginTop: 16, padding: 12, background: 'rgba(255,255,255,0.03)', borderRadius: 8, fontSize: 12, color: 'var(--text-subtle)' }}>
                <strong style={{ color: 'var(--text-muted)', display: 'block', marginBottom: 6 }}>Valid Workflow:</strong>
                📩 Received → 🔍 Under Review → ✅ Resolved<br />
                📩 Received → ❌ Rejected<br />
                🔍 Under Review → ❌ Rejected
              </div>
            </div>

            {/* Reassign Panel (Admin only — Problem #3) */}
            {user?.role === 'admin' && !isTerminal && (
              <div className="card">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                  <h3 style={{ fontWeight: 700, fontSize: 15 }}>📤 Reassign Department</h3>
                  <button className="btn btn-secondary btn-sm" onClick={() => setShowReassign(!showReassign)}>
                    <RefreshCw size={14} /> {showReassign ? 'Cancel' : 'Reassign'}
                  </button>
                </div>

                {showReassign && (
                  <form onSubmit={handleReassign}>
                    <div className="form-group">
                      <label>New Department *</label>
                      <select className="form-control" value={reassignForm.departmentId} onChange={(e) => setReassignForm({ ...reassignForm, departmentId: e.target.value })} required>
                        <option value="">Select Department</option>
                        {departments.filter((d) => d._id !== complaint.department?._id).map((d) => (
                          <option key={d._id} value={d._id}>{d.icon} {d.name}</option>
                        ))}
                      </select>
                    </div>
                    <div className="form-group">
                      <label>Reason for Reassignment *</label>
                      <textarea className="form-control" rows={2} placeholder="Why is this being reassigned? (min 10 chars)" value={reassignForm.reason} onChange={(e) => setReassignForm({ ...reassignForm, reason: e.target.value })} required minLength={10} />
                    </div>
                    <button className="btn btn-primary btn-sm" type="submit" disabled={reassigning} style={{ width: '100%', justifyContent: 'center' }}>
                      {reassigning ? 'Reassigning...' : '📤 Confirm Reassign'}
                    </button>
                  </form>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
