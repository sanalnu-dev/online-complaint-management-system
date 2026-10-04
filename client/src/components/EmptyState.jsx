import React from 'react';
import { Inbox } from 'lucide-react';

export default function EmptyState({
  title = 'No records found',
  description = 'There are no items matching your criteria or currently available.',
  icon: Icon = Inbox,
  actionText,
  onAction
}) {
  return (
    <div className="py-12 px-4 text-center bg-white rounded-2xl border border-slate-200/80 shadow-sm flex flex-col items-center justify-center">
      <div className="w-14 h-14 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-400 mb-4">
        <Icon className="w-7 h-7" />
      </div>
      <h3 className="text-base font-semibold text-slate-800">{title}</h3>
      <p className="text-sm text-slate-500 max-w-sm mt-1 mb-5">{description}</p>
      {actionText && onAction && (
        <button
          type="button"
          onClick={onAction}
          className="px-4 py-2 text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 rounded-xl transition-colors shadow-sm focus:outline-none"
        >
          {actionText}
        </button>
      )}
    </div>
  );
}
