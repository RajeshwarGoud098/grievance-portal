import React from 'react';
import { Link } from 'react-router-dom';
import Navbar from '../components/Navbar';

const departments = [
  { icon: '🏗️', name: 'Public Works', desc: 'Roads, bridges & infrastructure' },
  { icon: '💧', name: 'Water & Sanitation', desc: 'Water supply and sewage' },
  { icon: '⚡', name: 'Electricity', desc: 'Power supply and outages' },
  { icon: '🏥', name: 'Health Services', desc: 'Hospitals and medical care' },
  { icon: '📚', name: 'Education', desc: 'Schools and institutions' },
  { icon: '🚌', name: 'Transport', desc: 'Public transport and traffic' },
  { icon: '🌿', name: 'Environment', desc: 'Garbage, pollution, parks' },
  { icon: '💼', name: 'Revenue & Tax', desc: 'Property tax and revenue' },
];

const steps = [
  { icon: '📝', title: 'Submit Complaint', desc: 'Register and file your grievance with details and an image link.' },
  { icon: '🎫', title: 'Get Ticket ID', desc: 'Receive a unique ticket ID to track your complaint anytime.' },
  { icon: '🔄', title: 'Department Reviews', desc: 'The concerned department reviews and updates the status.' },
  { icon: '✅', title: 'Resolution', desc: 'Receive resolution notes and a final status update.' },
];

export default function LandingPage() {
  return (
    <div>
      <Navbar />

      {/* Hero */}
      <div className="hero">
        <div className="hero-badge">⚖️ Citizen Grievance Management System</div>
        <h1>
          Your Voice.<br />
          <span className="gradient-text">Our Priority.</span>
        </h1>
        <p>
          Submit complaints, track resolution status in real-time, and hold departments accountable with our transparent grievance portal.
        </p>
        <div className="hero-actions">
          <Link to="/register" className="btn btn-primary btn-lg pulse">
            🚀 Submit a Complaint
          </Link>
          <Link to="/track" className="btn btn-secondary btn-lg">
            🔍 Track Your Complaint
          </Link>
        </div>
      </div>

      {/* Stats */}
      <div className="container" style={{ marginBottom: 60 }}>
        <div className="grid-4">
          {[
            { num: '8+', label: 'Departments' },
            { num: '24h', label: 'Avg. Response' },
            { num: '98%', label: 'Resolution Rate' },
            { num: '100%', label: 'Transparent' },
          ].map((s, i) => (
            <div className="stat-card" key={i}>
              <div className="stat-number">{s.num}</div>
              <div className="stat-label">{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* How it works */}
      <div className="container" style={{ marginBottom: 60 }}>
        <div className="section-header">
          <h2 className="section-title gradient-text">How It Works</h2>
        </div>
        <div className="grid-4">
          {steps.map((step, i) => (
            <div className="card" key={i} style={{ textAlign: 'center', position: 'relative' }}>
              <div style={{ position: 'absolute', top: -14, left: -14, width: 28, height: 28, borderRadius: '50%', background: 'var(--gradient)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700 }}>{i + 1}</div>
              <div style={{ fontSize: 40, marginBottom: 12 }}>{step.icon}</div>
              <h3 style={{ fontWeight: 700, marginBottom: 8 }}>{step.title}</h3>
              <p style={{ fontSize: 14, color: 'var(--text-muted)' }}>{step.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Departments */}
      <div className="container" style={{ marginBottom: 80 }}>
        <div className="section-header">
          <h2 className="section-title">Departments We Cover</h2>
        </div>
        <div className="grid-4">
          {departments.map((d, i) => (
            <div className="card" key={i} style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
              <div style={{ fontSize: 32, flexShrink: 0 }}>{d.icon}</div>
              <div>
                <div style={{ fontWeight: 600, marginBottom: 2 }}>{d.name}</div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{d.desc}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* CTA */}
      <div className="container" style={{ marginBottom: 80 }}>
        <div className="card" style={{ textAlign: 'center', background: 'linear-gradient(135deg, rgba(99,102,241,0.15) 0%, rgba(6,182,212,0.15) 100%)', borderColor: 'rgba(99,102,241,0.3)' }}>
          <h2 style={{ fontSize: 28, fontWeight: 800, marginBottom: 12 }}>
            Ready to file a grievance?
          </h2>
          <p style={{ color: 'var(--text-muted)', marginBottom: 24 }}>
            Join thousands of citizens who have successfully resolved their issues through our portal.
          </p>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link to="/register" className="btn btn-primary">Create Account</Link>
            <Link to="/login" className="btn btn-secondary">Login</Link>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer style={{ borderTop: '1px solid var(--border)', padding: '24px', textAlign: 'center', color: 'var(--text-subtle)', fontSize: 13 }}>
        © 2024 GrievancePortal. All rights reserved.
      </footer>
    </div>
  );
}
