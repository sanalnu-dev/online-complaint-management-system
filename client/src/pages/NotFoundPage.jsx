import React from 'react';
import { Link } from 'react-router-dom';
import { ShieldAlert, ArrowLeft, Home } from 'lucide-react';

export default function NotFoundPage() {
  return (
    <div className="min-h-[75vh] flex items-center justify-center px-4 py-16">
      <div className="max-w-md w-full text-center space-y-6 bg-white p-8 sm:p-10 rounded-3xl border border-slate-200/80 shadow-xl shadow-slate-200/50">
        <div className="w-16 h-16 rounded-3xl bg-slate-100 text-navy-900 flex items-center justify-center mx-auto shadow-inner">
          <ShieldAlert className="w-8 h-8 text-primary-600" />
        </div>

        <div>
          <span className="text-4xl font-extrabold text-navy-900 tracking-tight block">404</span>
          <h1 className="text-xl font-bold text-slate-800 mt-1">Page Not Found</h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-2 leading-relaxed">
            The page or complaint record you are attempting to access does not exist or may have been moved.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 pt-2">
          <Link
            to="/"
            className="flex-1 py-2.5 px-4 rounded-xl bg-navy-900 hover:bg-navy-800 text-white font-semibold text-xs transition-colors flex items-center justify-center gap-2"
          >
            <Home className="w-4 h-4" />
            Home
          </Link>
          <button
            type="button"
            onClick={() => window.history.back()}
            className="flex-1 py-2.5 px-4 rounded-xl bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 font-semibold text-xs transition-colors flex items-center justify-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Go Back
          </button>
        </div>
      </div>
    </div>
  );
}
