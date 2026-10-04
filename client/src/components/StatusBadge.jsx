import React from 'react';
import { getStatusBadgeProps } from '../utils/formatters';

export default function StatusBadge({ status, className = '' }) {
  const { bg, dot } = getStatusBadgeProps(status);

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium border ${bg} ${className}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${dot}`}></span>
      {status || 'Unknown'}
    </span>
  );
}
