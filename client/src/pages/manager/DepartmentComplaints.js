/**
 * DepartmentComplaints — Server-side filtering + pagination
 * Fixes: Issue #6, Issue #7
 */
import React, { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import api from '../../api/axios';
import Navbar from '../../components/Navbar';
import { StatusBadge, PriorityBadge } from '../../components/StatusBadge';
import { Search, ChevronLeft, ChevronRight, AlertTriangle } from 'lucide-react';

const useDebounce = (value, delay = 500) => {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debounced;
};

export default function DepartmentComplaints() {
  const [complaints, setComplaints] = useState([]);
  const [pagination, setPagination] = useState({ total: 0, page: 1, pages: 1 });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');
  const [overdueOnly, setOverdueOnly] = useState(false);
  const [page, setPage] = useState(1);

  const debouncedSearch = useDebounce(search);

  const fetchComplaints = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page, limit: 10 });
      if (statusFilter)    params.append('status', statusFilter);
      if (priorityFilter)  params.append('priority', priorityFilter);
      if (debouncedSearch) params.append('search', debouncedSearch);
      if (overdueOnly)     params.append('overdue', 'true');

      const res = await api.get(`/complaints/department?${params}`);
      setComplaints(res.data.complaints);
      setPagination(res.data.pagination);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [page, statusFilter, priorityFilter, debouncedSearch, overdueOnly]);

  useEffect(() => { fetchComplaints(); }, [fetchComplaints]);
  useEffect(() => { setPage(1); }, [statusFilter, priorityFilter, debouncedSearch, overdueOnly]);

  return (
    <div>
      <Navbar />
      <div className="container" style={{ paddingTop: 36, paddingBottom: 60 }}>
        <div className="section-header">
          <h1 className="section-title">Department Complaints</h1>
          <span style={{ fontSize: 14, color: 'var(--text-muted)' }}>
            {pagination.total} total complaint{pagination.total !== 1 ? 's' : ''}
          </span>
        </div>

        {/* Filters */}
        <div style={{ display: 'flex', gap: 12, marginBottom: 24, flexWrap: 'wrap' }}>
          <div style={{ position: 'relative', flex: 1, minWidth: 220 }}>
            <Search size={16} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-subtle)' }} />
            <input className="form-control" placeholder="Search complaints, ticket ID..." value={search} onChange={(e) => setSearch(e.target.value)} style={{ paddingLeft: 40 }} />
          </div>
          <select className="form-control" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} style={{ width: 200 }}>
            <option value="">All Statuses</option>
            <option value="Received">📩 Received</option>
            <option value="Under Review">🔍 Under Review</option>
            <option value="Resolved">✅ Resolved</option>
            <option value="Rejected">❌ Rejected</option>
          </select>
          <select className="form-control" value={priorityFilter} onChange={(e) => setPriorityFilter(e.target.value)} style={{ width: 160 }}>
            <option value="">All Priorities</option>
            <option value="High">🔴 High</option>
            <option value="Medium">🟡 Medium</option>
            <option value="Low">🟢 Low</option>
          </select>
          <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', padding: '0 12px', background: overdueOnly ? 'rgba(239,68,68,0.15)' : 'rgba(255,255,255,0.05)', border: `1px solid ${overdueOnly ? 'rgba(239,68,68,0.4)' : 'var(--border)'}`, borderRadius: 10, fontSize: 13 }}>
            <input type="checkbox" checked={overdueOnly} onChange={(e) => setOverdueOnly(e.target.checked)} />
            <AlertTriangle size={14} style={{ color: '#fca5a5' }} /> Overdue Only
          </label>
        </div>

        <div style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 16 }}>
          Showing {complaints.length} of <strong>{pagination.total}</strong> complaints
        </div>

        {loading ? (
          <div className="loading-center"><div className="spinner" /></div>
        ) : complaints.length === 0 ? (
          <div className="card empty-state">
            <div className="empty-icon">📭</div>
            <div className="empty-title">No complaints found</div>
          </div>
        ) : (
          <>
            <div className="table-wrapper">
              <table>
                <thead>
                  <tr>
                    <th>Ticket ID</th>
                    <th>Title</th>
                    <th>Citizen</th>
                    <th>Priority</th>
                    <th>Status</th>
                    <th>Due Date</th>
                    <th>Filed</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {complaints.map((c) => (
                    <tr key={c._id} style={{ background: c.isOverdue ? 'rgba(239,68,68,0.04)' : 'transparent' }}>
                      <td>
                        <code style={{ color: 'var(--primary)', fontSize: 12, letterSpacing: 0.5 }}>{c.ticketId}</code>
                        {c.isOverdue && (
                          <div style={{ fontSize: 10, color: '#fca5a5', fontWeight: 700, textTransform: 'uppercase', marginTop: 2 }}>⚠ Overdue</div>
                        )}
                      </td>
                      <td style={{ fontWeight: 500, maxWidth: 200 }}>
                        <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.title}</div>
                      </td>
                      <td>
                        <div style={{ fontSize: 13 }}>{c.submittedBy?.name}</div>
                        <div style={{ fontSize: 11, color: 'var(--text-subtle)' }}>{c.submittedBy?.email}</div>
                      </td>
                      <td><PriorityBadge priority={c.priority} /></td>
                      <td><StatusBadge status={c.status} /></td>
                      <td style={{ fontSize: 12, color: c.isOverdue ? '#fca5a5' : 'var(--text-muted)' }}>
                        {c.dueDate ? new Date(c.dueDate).toLocaleDateString() : '—'}
                      </td>
                      <td style={{ color: 'var(--text-muted)', fontSize: 13 }}>{new Date(c.createdAt).toLocaleDateString()}</td>
                      <td><Link to={`/manager/complaint/${c._id}`} className="btn btn-primary btn-sm">Manage →</Link></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {pagination.pages > 1 && (
              <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 12, marginTop: 24 }}>
                <button className="btn btn-secondary btn-sm" onClick={() => setPage(p => p - 1)} disabled={page === 1}>
                  <ChevronLeft size={16} /> Prev
                </button>
                <span style={{ fontSize: 14, color: 'var(--text-muted)' }}>
                  Page <strong>{page}</strong> of <strong>{pagination.pages}</strong>
                </span>
                <button className="btn btn-secondary btn-sm" onClick={() => setPage(p => p + 1)} disabled={page === pagination.pages}>
                  Next <ChevronRight size={16} />
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
