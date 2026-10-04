import React from 'react';

export default function LoadingSpinner({
  size = 'md',
  message = 'Loading...',
  fullPage = false
}) {
  const sizeClasses = {
    sm: 'w-5 h-5 border-2',
    md: 'w-8 h-8 border-3',
    lg: 'w-12 h-12 border-4'
  };

  const spinner = (
    <div className="flex flex-col items-center justify-center gap-3">
      <div
        className={`${sizeClasses[size] || sizeClasses.md} border-primary-200 border-t-primary-600 rounded-full animate-spin`}
      />
      {message && <p className="text-sm font-medium text-slate-500">{message}</p>}
    </div>
  );

  if (fullPage) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center p-8">
        {spinner}
      </div>
    );
  }

  return <div className="py-8 flex items-center justify-center">{spinner}</div>;
}
