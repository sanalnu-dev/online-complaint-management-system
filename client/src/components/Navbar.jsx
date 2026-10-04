import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import {
  ShieldAlert,
  LogOut,
  User,
  LayoutDashboard,
  PlusCircle,
  ListOrdered,
  Menu,
  X,
  ShieldCheck
} from 'lucide-react';

export default function Navbar() {
  const { user, isAuthenticated, isAdmin, logout } = useAuth();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <nav className="bg-white border-b border-slate-200 sticky top-0 z-40 backdrop-blur-md bg-white/90">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          {/* Logo and Brand */}
          <div className="flex items-center">
            <Link to="/" className="flex items-center gap-2.5 group">
              <div className="w-10 h-10 rounded-xl bg-navy-900 flex items-center justify-center text-white shadow-md shadow-navy-900/20 group-hover:scale-105 transition-transform">
                <ShieldAlert className="w-6 h-6 text-primary-400" />
              </div>
              <div>
                <span className="text-xl font-bold tracking-tight text-navy-900">
                  OCMS
                </span>
                <span className="hidden sm:inline-block ml-2 text-xs font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-600 uppercase tracking-wider">
                  Campus Portal
                </span>
              </div>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-4">
            {isAuthenticated ? (
              <>
                <Link
                  to={isAdmin ? '/admin/dashboard' : '/dashboard'}
                  className="flex items-center gap-1.5 text-sm font-medium text-slate-600 hover:text-primary-600 px-3 py-2 rounded-lg hover:bg-slate-50 transition-colors"
                >
                  <LayoutDashboard className="w-4 h-4" />
                  Dashboard
                </Link>

                {!isAdmin && (
                  <>
                    <Link
                      to="/complaints/new"
                      className="flex items-center gap-1.5 text-sm font-medium text-slate-600 hover:text-primary-600 px-3 py-2 rounded-lg hover:bg-slate-50 transition-colors"
                    >
                      <PlusCircle className="w-4 h-4" />
                      Submit Complaint
                    </Link>
                    <Link
                      to="/complaints"
                      className="flex items-center gap-1.5 text-sm font-medium text-slate-600 hover:text-primary-600 px-3 py-2 rounded-lg hover:bg-slate-50 transition-colors"
                    >
                      <ListOrdered className="w-4 h-4" />
                      My Complaints
                    </Link>
                  </>
                )}

                {isAdmin && (
                  <Link
                    to="/admin/complaints"
                    className="flex items-center gap-1.5 text-sm font-medium text-slate-600 hover:text-primary-600 px-3 py-2 rounded-lg hover:bg-slate-50 transition-colors"
                  >
                    <ListOrdered className="w-4 h-4" />
                    Manage Complaints
                  </Link>
                )}

                <div className="h-6 w-px bg-slate-200 mx-1" />

                {/* User info badge */}
                <Link
                  to="/profile"
                  className="flex items-center gap-2 px-3 py-1.5 rounded-xl border border-slate-200 hover:border-slate-300 hover:bg-slate-50 transition-all text-sm"
                >
                  <div className="w-7 h-7 rounded-lg bg-navy-800 text-white flex items-center justify-center font-bold text-xs">
                    {user?.fullName?.charAt(0) || 'U'}
                  </div>
                  <div className="text-left">
                    <div className="font-semibold text-xs text-slate-900 leading-tight">
                      {user?.fullName}
                    </div>
                    <div className="text-[10px] text-slate-500 font-medium">
                      {isAdmin ? 'ADMINISTRATOR' : (user?.studentEmployeeId || 'STUDENT')}
                    </div>
                  </div>
                </Link>

                {/* Logout Button */}
                <button
                  type="button"
                  onClick={handleLogout}
                  className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors"
                  title="Sign out"
                >
                  <LogOut className="w-5 h-5" />
                </button>
              </>
            ) : (
              <>
                <Link
                  to="/"
                  className="text-sm font-medium text-slate-600 hover:text-primary-600 px-3 py-2 rounded-lg hover:bg-slate-50 transition-colors"
                >
                  Home
                </Link>
                <Link
                  to="/login"
                  className="text-sm font-semibold text-slate-700 hover:text-primary-600 px-4 py-2 rounded-xl transition-colors"
                >
                  Log In
                </Link>
                <Link
                  to="/register"
                  className="text-sm font-semibold text-white bg-navy-900 hover:bg-navy-800 px-4 py-2 rounded-xl transition-all shadow-sm hover:shadow"
                >
                  Register
                </Link>
              </>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="flex md:hidden items-center">
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-xl text-slate-500 hover:bg-slate-100 focus:outline-none"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu dropdown */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-slate-200 bg-white px-4 pt-3 pb-4 space-y-2">
          {isAuthenticated ? (
            <>
              <div className="p-3 bg-slate-50 rounded-xl mb-3 flex items-center justify-between">
                <div>
                  <div className="font-semibold text-sm text-slate-900">{user?.fullName}</div>
                  <div className="text-xs text-slate-500">{user?.email}</div>
                </div>
                <span className="text-xs px-2 py-0.5 rounded bg-primary-100 text-primary-700 font-semibold">
                  {user?.role}
                </span>
              </div>

              <Link
                to={isAdmin ? '/admin/dashboard' : '/dashboard'}
                onClick={() => setMobileMenuOpen(false)}
                className="block px-3 py-2 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-100"
              >
                Dashboard
              </Link>

              {!isAdmin ? (
                <>
                  <Link
                    to="/complaints/new"
                    onClick={() => setMobileMenuOpen(false)}
                    className="block px-3 py-2 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-100"
                  >
                    Submit Complaint
                  </Link>
                  <Link
                    to="/complaints"
                    onClick={() => setMobileMenuOpen(false)}
                    className="block px-3 py-2 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-100"
                  >
                    My Complaints
                  </Link>
                </>
              ) : (
                <>
                  <Link
                    to="/admin/complaints"
                    onClick={() => setMobileMenuOpen(false)}
                    className="block px-3 py-2 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-100"
                  >
                    Manage Complaints
                  </Link>
                  <Link
                    to="/admin/users"
                    onClick={() => setMobileMenuOpen(false)}
                    className="block px-3 py-2 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-100"
                  >
                    Manage Users
                  </Link>
                </>
              )}

              <Link
                to="/profile"
                onClick={() => setMobileMenuOpen(false)}
                className="block px-3 py-2 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-100"
              >
                Profile & Settings
              </Link>

              <button
                type="button"
                onClick={() => {
                  setMobileMenuOpen(false);
                  handleLogout();
                }}
                className="w-full text-left px-3 py-2 rounded-lg text-sm font-medium text-rose-600 hover:bg-rose-50 flex items-center gap-2"
              >
                <LogOut className="w-4 h-4" />
                Sign Out
              </button>
            </>
          ) : (
            <>
              <Link
                to="/"
                onClick={() => setMobileMenuOpen(false)}
                className="block px-3 py-2 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-100"
              >
                Home
              </Link>
              <Link
                to="/login"
                onClick={() => setMobileMenuOpen(false)}
                className="block px-3 py-2 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-100"
              >
                Log In
              </Link>
              <Link
                to="/register"
                onClick={() => setMobileMenuOpen(false)}
                className="block px-3 py-2 rounded-lg text-sm font-medium text-white bg-navy-900 text-center"
              >
                Register
              </Link>
            </>
          )}
        </div>
      )}
    </nav>
  );
}
