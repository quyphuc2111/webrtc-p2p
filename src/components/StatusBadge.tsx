import React from 'react';

interface StatusBadgeProps {
  status: 'connected' | 'disconnected' | 'connecting' | 'live';
  label?: string;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, label }) => {
  const config = {
    connected: { color: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20', dot: 'bg-emerald-500' },
    live: { color: 'bg-red-500/10 text-red-400 border-red-500/20', dot: 'bg-red-500 animate-pulse' },
    connecting: { color: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20', dot: 'bg-yellow-500 animate-bounce' },
    disconnected: { color: 'bg-slate-500/10 text-slate-400 border-slate-500/20', dot: 'bg-slate-500' },
  };

  const current = config[status];

  return (
    <div className={`inline-flex items-center px-3 py-1 rounded-full border ${current.color} text-sm font-medium`}>
      <span className={`w-2 h-2 rounded-full mr-2 ${current.dot}`}></span>
      {label || status.charAt(0).toUpperCase() + status.slice(1)}
    </div>
  );
};
