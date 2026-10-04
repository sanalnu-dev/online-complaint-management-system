import React from 'react';
import { Outlet, Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import { ShieldAlert, Heart } from 'lucide-react';

export default function PublicLayout() {
  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <Navbar />

      <main className="flex-1">
        <Outlet />
      </main>

      <footer className="bg-white border-t border-slate-200 py-8 px-4 sm:px-6 lg:px-8 text-center text-sm text-slate-500">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg bg-navy-900 flex items-center justify-center text-white">
              <ShieldAlert className="w-3.5 h-3.5 text-primary-400" />
            </div>
            <span className="font-semibold text-slate-800">OCMS</span>
            <span className="text-slate-400">| Online Complaint Management System</span>
          </div>

          <div className="flex items-center gap-6 text-xs text-slate-500">
            <Link to="/login" className="hover:text-primary-600 transition-colors">
              Portal Login
            </Link>
            <Link to="/register" className="hover:text-primary-600 transition-colors">
              Register Account
            </Link>
            <span>Production Grade v1.0.0</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
