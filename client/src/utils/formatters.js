export function formatDate(dateString) {
  if (!dateString) return 'N/A';
  const d = new Date(dateString);
  if (isNaN(d.getTime())) return dateString;
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }).format(d);
}

export function formatDateOnly(dateString) {
  if (!dateString) return 'N/A';
  const d = new Date(dateString);
  if (isNaN(d.getTime())) return dateString;
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  }).format(d);
}

export function getStatusBadgeProps(status) {
  switch (status) {
    case 'Submitted':
      return {
        bg: 'bg-blue-50 text-blue-700 border-blue-200',
        dot: 'bg-blue-500'
      };
    case 'Under Review':
      return {
        bg: 'bg-amber-50 text-amber-700 border-amber-200',
        dot: 'bg-amber-500'
      };
    case 'In Progress':
      return {
        bg: 'bg-purple-50 text-purple-700 border-purple-200',
        dot: 'bg-purple-500'
      };
    case 'Resolved':
      return {
        bg: 'bg-emerald-50 text-emerald-700 border-emerald-200',
        dot: 'bg-emerald-500'
      };
    case 'Rejected':
      return {
        bg: 'bg-rose-50 text-rose-700 border-rose-200',
        dot: 'bg-rose-500'
      };
    case 'Reopened':
      return {
        bg: 'bg-orange-50 text-orange-700 border-orange-200',
        dot: 'bg-orange-500'
      };
    default:
      return {
        bg: 'bg-slate-100 text-slate-700 border-slate-200',
        dot: 'bg-slate-400'
      };
  }
}

export function getPriorityBadgeProps(priority) {
  switch (priority) {
    case 'Urgent':
      return {
        bg: 'bg-red-50 text-red-700 border-red-200 font-semibold',
        dot: 'bg-red-600'
      };
    case 'High':
      return {
        bg: 'bg-amber-50 text-amber-700 border-amber-200 font-medium',
        dot: 'bg-amber-500'
      };
    case 'Medium':
      return {
        bg: 'bg-sky-50 text-sky-700 border-sky-200 font-medium',
        dot: 'bg-sky-500'
      };
    case 'Low':
      return {
        bg: 'bg-slate-100 text-slate-600 border-slate-200',
        dot: 'bg-slate-400'
      };
    default:
      return {
        bg: 'bg-slate-100 text-slate-700 border-slate-200',
        dot: 'bg-slate-400'
      };
  }
}
