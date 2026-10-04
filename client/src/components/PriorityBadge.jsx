import React from 'react';
import { getPriorityBadgeProps } from '../utils/formatters';

export default function PriorityBadge({ priority, className = '' }) {
  const { bg, dot } = getPriorityBadgeProps(priority);

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs border ${bg} ${className}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${dot}`}></span>
      {priority || 'Medium'}
    </span>
  );
}
