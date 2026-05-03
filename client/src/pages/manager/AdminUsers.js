import React, { useEffect, useState } from 'react';
import api from '../../api/axios';
import Navbar from '../../components/Navbar';
import toast from 'react-hot-toast';
import { UserPlus, Trash2, X } from 'lucide-react';

export default function AdminUsers() {
  const [users, setUsers] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', password: '', phone: '', departmentId: '' });
  const [creating, setCreating] = useState(false);

  const fetchData = () => {
    Promise.all([api.get('/users'), api.get('/departments')]).then(([u, d]) => {
      setUsers(u.data.users);
      setDepartments(d.data.departments);
    }).finally(() => setLoading(false));
  };

  useEffect(() => { fetchData(); }, []);

  const handleCreateManager = async (e) => {
    e.preventDefault();
    setCreating(true);
    try {
      await api.post('/users/create-manager', form);
      toast.success('Manager created!');
      setShowModal(false);
      setForm({ name: '', email: '', password: '', phone: '', departmentId: '' });
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create manager.');
    } finally {
      setCreating(false);
    }
  };

  const handleDelete = async (userId, name) => {
    if (!window.confirm(`Delete user ${name}?`)) return;
    try {
      await api.delete(`/users/${userId}`);
      toast.success('User deleted.');
      setUsers(users.filter((u) => u._id !== userId));
    } catch (err) {
      toast.error('Failed to delete user.');
    }
  };

  const roleColor = { admin: '#f59e0b', manager: '#6366f1', user: '#10b981' };

  return (
    <div>
      <Navbar />
      <div className="container" style={{ paddingTop: 36, paddingBottom: 60 }}>
        <div className="section-header">
          <h1 className="section-title">👥 User Management</h1>
          <button className="btn btn-primary" onClick={() => setShowModal(true)}>
            <UserPlus size={16} /> Create Manager
          </button>
        </div>

        {loading ? (
          <div className="loading-center"><div className="spinner" /></div>
        ) : (
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Phone</th>
                  <th>Role</th>
                  <th>Department</th>
                  <th>Joined</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u._id}>
                    <td style={{ fontWeight: 600 }}>
                      <span style={{ marginRight: 8 }}>{u.role === 'admin' ? '👑' : u.role === 'manager' ? '🏢' : '👤'}</span>
                      {u.name}
                    </td>
                    <td style={{ fontSize: 13, color: 'var(--text-muted)' }}>{u.email}</td>
                    <td style={{ fontSize: 13, color: 'var(--text-muted)' }}>{u.phone || '—'}</td>
                    <td>
                      <span className="badge" style={{ background: `${roleColor[u.role]}22`, color: roleColor[u.role], border: `1px solid ${roleColor[u.role]}44` }}>
                        {u.role}
                      </span>
                    </td>
                    <td style={{ fontSize: 13 }}>{u.department ? `${u.department.name}` : '—'}</td>
                    <td style={{ fontSize: 13, color: 'var(--text-muted)' }}>{new Date(u.createdAt).toLocaleDateString()}</td>
                    <td>
                      {u.role !== 'admin' && (
                        <button className="btn btn-danger btn-sm btn-icon" onClick={() => handleDelete(u._id, u.name)} title="Delete">
                          <Trash2 size={14} />
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Create Manager Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && setShowModal(false)}>
          <div className="modal">
            <div className="modal-header">
              <h2 className="modal-title">Create Department Manager</h2>
              <button className="btn btn-icon btn-secondary" onClick={() => setShowModal(false)}><X size={18} /></button>
            </div>
            <form onSubmit={handleCreateManager}>
              <div className="form-group">
                <label>Full Name</label>
                <input className="form-control" placeholder="Manager Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
              </div>
              <div className="form-group">
                <label>Email</label>
                <input className="form-control" type="email" placeholder="manager@dept.com" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
              </div>
              <div className="form-group">
                <label>Phone</label>
                <input className="form-control" placeholder="Phone (optional)" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
              </div>
              <div className="form-group">
                <label>Password</label>
                <input className="form-control" type="password" placeholder="Min 6 characters" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required minLength={6} />
              </div>
              <div className="form-group">
                <label>Assign Department</label>
                <select className="form-control" value={form.departmentId} onChange={(e) => setForm({ ...form, departmentId: e.target.value })} required>
                  <option value="">Select Department</option>
                  {departments.map((d) => (
                    <option key={d._id} value={d._id}>{d.icon} {d.name}</option>
                  ))}
                </select>
              </div>
              <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={creating}>
                  {creating ? 'Creating...' : 'Create Manager'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
