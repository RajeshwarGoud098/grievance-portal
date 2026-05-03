/**
 * MyComplaints — Server-side filtering + pagination
 * Fixes: Issue #6 (client-side only filtering), Issue #7 (no pagination)
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

export default function MyComplaints() {
  const [complaints, setComplaints] = useState([]);
  const [pagination, setPagination] = useState({ total: 0, page: 1, pages: 1 });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');
  const [page, setPage] = useState(1);

  const debouncedSearch = useDebounce(search);

  const fetchComplaints = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page, limit: 10 });
      if (statusFilter)    params.append('status', statusFilter);
      if (priorityFilter)  params.append('priority', priorityFilter);
      if (debouncedSearch) params.append('search', debouncedSearch);

      const res = await api.get(`/complaints/my?${params}`);
      setComplaints(res.data.complaints);
      setPagination(res.data.pagination);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [page, statusFilter, priorityFilter, debouncedSearch]);

  useEffect(() => { fetchComplaints(); }, [fetchComplaints]);

  // Reset to page 1 when filters change
  useEffect(() => { setPage(1); }, [statusFilter, priorityFilter, debouncedSearch]);

  return (
    <div>
      <Navbar />
      <div className="container" style={{ paddingTop: 36, paddingBottom: 60 }}>
        <div className="section-header">
          <h1 className="section-title">My Complaints</h1>
          <Link to="/submit" className="btn btn-primary">+ Submit New</Link>
        </div>

        {/* Filters — all hit server side */}
        <div style={{ display: 'flex', gap: 12, marginBottom: 24, flexWrap: 'wrap' }}>
          <div style={{ position: 'relative', flex: 1, minWidth: 220 }}>
            <Search size={16} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-subtle)' }} />
            <input className="form-control" placeholder="Search title, description..." value={search} onChange={(e) => setSearch(e.target.value)} style={{ paddingLeft: 40 }} />
          </div>
          <select className="form-control" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} style={{ width: 180 }}>
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
        </div>

        <div style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 16 }}>
          Showing {complaints.length} of <strong>{pagination.total}</strong> complaints
        </div>

        {loading ? (
          <div className="loading-center"><div className="spinner" /></div>
        ) : complaints.length === 0 ? (
          <div className="card empty-state">
            <div className="empty-icon">📭</div>
            <div className="empty-title">{pagination.total === 0 ? 'No complaints yet' : 'No results found'}</div>
            <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 20 }}>
              {pagination.total === 0 ? 'Submit your first complaint!' : 'Try adjusting your search or filters.'}
            </p>
            {pagination.total === 0 && <Link to="/submit" className="btn btn-primary">Submit Complaint</Link>}
          </div>
        ) : (
          <>
            <div className="table-wrapper">
              <table>
                <thead>
                  <tr>
                    <th>Ticket ID</th>
                    <th>Title</th>
                    <th>Department</th>
                    <th>Priority</th>
                    <th>Status</th>
                    <th>Due Date</th>
                    <th>Submitted</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {complaints.map((c) => (
                    <tr key={c._id}>
                      <td>
                        <code style={{ color: 'var(--primary-light)', fontSize: 12, letterSpacing: 0.5 }}>{c.ticketId}</code>
                      </td>
                      <td style={{ fontWeight: 500, maxWidth: 200 }}>
                        <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.title}</div>
                        {c.isOverdue && (
                          <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, color: '#fca5a5', marginTop: 2 }}>
                            <AlertTriangle size={10} /> SLA Breached
                          </div>
                        )}
                      </td>
                      <td>{c.department?.icon} {c.department?.name}</td>
                      <td><PriorityBadge priority={c.priority} /></td>
                      <td><StatusBadge status={c.status} /></td>
                      <td style={{ fontSize: 12, color: c.isOverdue ? '#fca5a5' : 'var(--text-muted)' }}>
                        {c.dueDate ? new Date(c.dueDate).toLocaleDateString() : '—'}
                      </td>
                      <td style={{ color: 'var(--text-muted)', fontSize: 13 }}>{new Date(c.createdAt).toLocaleDateString()}</td>
                      <td><Link to={`/complaint/${c._id}`} className="btn btn-secondary btn-sm">View →</Link></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
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
