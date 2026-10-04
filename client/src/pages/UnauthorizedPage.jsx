import React from 'react';
import { Link } from 'react-router-dom';
import { Lock, ArrowLeft, Home, ShieldAlert } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';

export default function UnauthorizedPage() {
  const { user } = useAuth();

  return (
    <div className="min-h-[75vh] flex items-center justify-center px-4 py-16">
      <div className="max-w-md w-full text-center space-y-6 bg-white p-8 sm:p-10 rounded-3xl border border-slate-200/80 shadow-xl shadow-slate-200/50">
        <div className="w-16 h-16 rounded-3xl bg-rose-100 text-rose-600 flex items-center justify-center mx-auto shadow-inner">
          <Lock className="w-8 h-8" />
        </div>

        <div>
          <span className="text-4xl font-extrabold text-navy-900 tracking-tight block">403</span>
          <h1 className="text-xl font-bold text-slate-800 mt-1">Access Restricted</h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-2 leading-relaxed">
            You do not have the required administrative permissions to view or perform operations on this resource.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 pt-2">
          <Link
            to={user?.role === 'ADMIN' ? '/admin/dashboard' : '/dashboard'}
            className="flex-1 py-2.5 px-4 rounded-xl bg-navy-900 hover:bg-navy-800 text-white font-semibold text-xs transition-colors flex items-center justify-center gap-2"
          >
            <Home className="w-4 h-4" />
            My Dashboard
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
