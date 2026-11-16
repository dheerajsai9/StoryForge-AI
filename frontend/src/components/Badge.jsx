import React from 'react';

export const PriorityBadge = ({ priority }) => {
  const p = (priority || 'MEDIUM').toUpperCase();
  const styles = {
    CRITICAL: 'bg-rose-100 text-rose-700 border-rose-200',
    HIGH: 'bg-amber-100 text-amber-700 border-amber-200',
    MEDIUM: 'bg-blue-100 text-blue-700 border-blue-200',
    LOW: 'bg-slate-100 text-slate-700 border-slate-200',
  };

  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold border ${styles[p] || styles.MEDIUM}`}>
      {p}
    </span>
  );
};

export const StatusBadge = ({ status }) => {
  const s = (status || 'BACKLOG').toUpperCase();
  const styles = {
    DONE: 'bg-emerald-100 text-emerald-700 border-emerald-200',
    IN_PROGRESS: 'bg-indigo-100 text-indigo-700 border-indigo-200',
    REVIEW: 'bg-purple-100 text-purple-700 border-purple-200',
    BACKLOG: 'bg-slate-100 text-slate-700 border-slate-200',
  };

  const labels = {
    DONE: 'Done',
    IN_PROGRESS: 'In Progress',
    REVIEW: 'Review',
    BACKLOG: 'Backlog',
  };

  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${styles[s] || styles.BACKLOG}`}>
      {labels[s] || s}
    </span>
  );
};

export const PointsBadge = ({ points }) => {
  return (
    <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-slate-100 text-slate-800 text-xs font-bold border border-slate-300">
      {points || 1}
    </span>
  );
};
