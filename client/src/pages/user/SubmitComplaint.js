import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../api/axios';
import Navbar from '../../components/Navbar';
import toast from 'react-hot-toast';
import { Send, Image, AlertCircle } from 'lucide-react';

export default function SubmitComplaint() {
  const navigate = useNavigate();
  const [departments, setDepartments] = useState([]);
  const [form, setForm] = useState({ title: '', description: '', department: '', imageUrl: '', priority: 'Medium' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(null);

  useEffect(() => {
    api.get('/departments').then((res) => setDepartments(res.data.departments));
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.department) return setError('Please select a department.');
    setLoading(true); setError('');
    try {
      const res = await api.post('/complaints', form);
      setSuccess(res.data.complaint);
      toast.success('Complaint submitted successfully!');
    } catch (err) {
      setError(err.response?.data?.message || 'Submission failed.');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div>
        <Navbar />
        <div style={{ display: 'flex', minHeight: 'calc(100vh - 68px)', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
          <div style={{ width: '100%', maxWidth: 500, textAlign: 'center' }}>
            <div className="card">
              <div style={{ fontSize: 64, marginBottom: 16 }}>🎉</div>
              <h2 style={{ fontSize: 24, fontWeight: 800, marginBottom: 12 }}>Complaint Submitted!</h2>
              <p style={{ color: 'var(--text-muted)', marginBottom: 24 }}>Your complaint has been registered successfully. Use your Ticket ID to track the status.</p>
              <div style={{ background: 'rgba(99,102,241,0.12)', border: '1px solid rgba(99,102,241,0.3)', borderRadius: 12, padding: '20px', marginBottom: 24 }}>
                <div style={{ fontSize: 13, color: 'var(--text-subtle)', marginBottom: 8, textTransform: 'uppercase', fontWeight: 700 }}>Your Ticket ID</div>
                <div style={{ fontSize: 28, fontWeight: 800, color: 'var(--primary)', letterSpacing: 2 }}>{success.ticketId}</div>
                <p style={{ fontSize: 12, color: 'var(--text-subtle)', marginTop: 8 }}>Save this ID to track your complaint</p>
              </div>
              <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
                <button className="btn btn-secondary" onClick={() => navigate('/my-complaints')}>My Complaints</button>
                <button className="btn btn-primary" onClick={() => { setSuccess(null); setForm({ title: '', description: '', department: '', imageUrl: '', priority: 'Medium' }); }}>
                  Submit Another
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <Navbar />
      <div className="container" style={{ paddingTop: 40, paddingBottom: 80, maxWidth: 680 }}>
        <div style={{ marginBottom: 32 }}>
          <h1 style={{ fontSize: 28, fontWeight: 800, marginBottom: 8 }}>Submit a Complaint</h1>
          <p style={{ color: 'var(--text-muted)' }}>Fill in the details below. Your complaint will be assigned to the relevant department.</p>
        </div>

        {error && <div className="alert alert-error"><AlertCircle size={16} style={{ display: 'inline', marginRight: 6 }} />{error}</div>}

        <div className="card">
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label>Complaint Title *</label>
              <input className="form-control" placeholder="Brief title for your complaint" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required maxLength={150} />
            </div>

            <div className="grid-2">
              <div className="form-group">
                <label>Department *</label>
                <select className="form-control" value={form.department} onChange={(e) => setForm({ ...form, department: e.target.value })} required>
                  <option value="">Select Department</option>
                  {departments.map((d) => (
                    <option key={d._id} value={d._id}>{d.icon} {d.name}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>Priority</label>
                <select className="form-control" value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value })}>
                  <option value="Low">🟢 Low</option>
                  <option value="Medium">🟡 Medium</option>
                  <option value="High">🔴 High</option>
                </select>
              </div>
            </div>

            <div className="form-group">
              <label>Description *</label>
              <textarea className="form-control" rows={5} placeholder="Describe your complaint in detail. Include location, date, and any relevant information..." value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} required style={{ minHeight: 130 }} />
            </div>

            <div className="form-group">
              <label>
                <Image size={14} style={{ display: 'inline', marginRight: 6 }} />
                Image Link (optional)
              </label>
              <input className="form-control" type="url" placeholder="https://example.com/image.jpg" value={form.imageUrl} onChange={(e) => setForm({ ...form, imageUrl: e.target.value })} />
              {form.imageUrl && (
                <div style={{ marginTop: 8 }}>
                  <img src={form.imageUrl} alt="Preview" style={{ maxWidth: '100%', maxHeight: 200, borderRadius: 8, border: '1px solid var(--border)' }} onError={(e) => e.target.style.display = 'none'} />
                </div>
              )}
            </div>

            <button className="btn btn-primary btn-lg" type="submit" disabled={loading} style={{ width: '100%', justifyContent: 'center' }}>
              <Send size={18} />
              {loading ? 'Submitting...' : 'Submit Complaint'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
