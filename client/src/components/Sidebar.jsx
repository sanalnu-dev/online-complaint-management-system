import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import {
  LayoutDashboard,
  PlusCircle,
  ListOrdered,
  Users,
  User,
  LogOut,
  ShieldCheck,
  FolderTree,
  GraduationCap
} from 'lucide-react';

export default function Sidebar() {
  const { user, isAdmin, isFaculty, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const userNavItems = [
    { label: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { label: 'Submit Complaint', path: '/complaints/new', icon: PlusCircle },
    { label: 'My Complaints', path: '/complaints', icon: ListOrdered },
    { label: 'My Profile', path: '/profile', icon: User }
  ];

  const facultyNavItems = [
    { label: 'Faculty Workspace', path: '/faculty/dashboard', icon: LayoutDashboard },
    { label: 'Assigned Complaints', path: '/faculty/complaints', icon: ListOrdered },
    { label: 'My Profile', path: '/profile', icon: User }
  ];

  const adminNavItems = [
    { label: 'Admin Dashboard', path: '/admin/dashboard', icon: LayoutDashboard },
    { label: 'Complaint Queue', path: '/admin/complaints', icon: ListOrdered },
    { label: 'Category Routing', path: '/admin/categories', icon: FolderTree },
    { label: 'User Directory', path: '/admin/users', icon: Users },
    { label: 'My Profile', path: '/profile', icon: User }
  ];

  const navItems = isAdmin ? adminNavItems : isFaculty ? facultyNavItems : userNavItems;

  return (
    <aside className="w-64 bg-white border-r border-slate-200 hidden lg:flex flex-col justify-between min-h-[calc(100vh-4rem)] sticky top-16">
      <div className="p-4 space-y-6">
        {/* Role identifier badge */}
        <div className="px-3 py-2 rounded-xl bg-slate-50 border border-slate-200/80 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span
              className={`w-2 h-2 rounded-full ${
                isAdmin ? 'bg-amber-500' : isFaculty ? 'bg-purple-600' : 'bg-primary-500'
              }`}
            />
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-600">
              {isAdmin ? 'Admin Console' : isFaculty ? 'Faculty Portal' : 'Student Portal'}
            </span>
          </div>
          {isAdmin ? (
            <ShieldCheck className="w-4 h-4 text-amber-600" />
          ) : isFaculty ? (
            <GraduationCap className="w-4 h-4 text-purple-600" />
          ) : null}
        </div>

        {/* Navigation list */}
        <nav className="space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                end={item.path === '/dashboard' || item.path === '/admin/dashboard'}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all ${
                    isActive
                      ? 'bg-primary-50 text-primary-700 font-semibold border-l-4 border-primary-600 shadow-sm'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                  }`
                }
              >
                <Icon className="w-4 h-4 flex-shrink-0" />
                <span>{item.label}</span>
              </NavLink>
            );
          })}
        </nav>
      </div>

      {/* User profile card at bottom */}
      <div className="p-4 border-t border-slate-200">
        <div className="flex items-center justify-between p-2 rounded-xl bg-slate-50 border border-slate-200/60">
          <div className="flex items-center gap-2.5 overflow-hidden">
            <div className="w-8 h-8 rounded-lg bg-navy-900 text-white flex items-center justify-center font-bold text-xs flex-shrink-0">
              {user?.fullName?.charAt(0) || 'U'}
            </div>
            <div className="overflow-hidden">
              <p className="text-xs font-semibold text-slate-900 truncate">
                {user?.fullName}
              </p>
              <p className="text-[10px] text-slate-500 truncate">{user?.email}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleLogout}
            title="Sign out"
            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors flex-shrink-0"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </aside>
  );
}
