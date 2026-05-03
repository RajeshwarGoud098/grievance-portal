import React from 'react';

const statusConfig = {
  'Received': { class: 'badge-received', emoji: '📩' },
  'Under Review': { class: 'badge-review', emoji: '🔍' },
  'Resolved': { class: 'badge-resolved', emoji: '✅' },
  'Rejected': { class: 'badge-rejected', emoji: '❌' },
};

const priorityConfig = {
  'Low': { class: 'badge-low' },
  'Medium': { class: 'badge-medium' },
  'High': { class: 'badge-high' },
};

export const StatusBadge = ({ status }) => {
  const cfg = statusConfig[status] || { class: 'badge-received', emoji: '📩' };
  return (
    <span className={`badge ${cfg.class}`}>
      {cfg.emoji} {status}
    </span>
  );
};

export const PriorityBadge = ({ priority }) => {
  const cfg = priorityConfig[priority] || { class: 'badge-medium' };
  return <span className={`badge ${cfg.class}`}>{priority}</span>;
};

export const StatusTimeline = ({ history }) => (
  <div className="timeline">
    {[...history].reverse().map((item, i) => (
      <div className="timeline-item" key={i}>
        <div className={`timeline-dot ${item.status === 'Resolved' ? 'resolved' : item.status === 'Rejected' ? 'rejected' : ''}`} />
        <div className="timeline-content">
          <div className="timeline-status">{statusConfig[item.status]?.emoji} {item.status}</div>
          {item.note && <div className="timeline-note">{item.note}</div>}
          <div className="timeline-meta">
            {item.updatedBy?.name && <span>by {item.updatedBy.name} • </span>}
            {new Date(item.updatedAt).toLocaleString()}
          </div>
        </div>
      </div>
    ))}
  </div>
);
