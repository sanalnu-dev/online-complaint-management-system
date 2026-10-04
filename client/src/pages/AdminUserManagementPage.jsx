import React, { useState, useEffect, useCallback } from 'react';
import { adminService } from '../services/adminService';
import { useAuth } from '../hooks/useAuth';
import { useToast } from '../hooks/useToast';
import ConfirmDialog from '../components/ConfirmDialog';
import LoadingSpinner from '../components/LoadingSpinner';
import EmptyState from '../components/EmptyState';
import { formatDateOnly } from '../utils/formatters';
import {
  Users,
  Search,
  UserX,
  UserCheck,
  ShieldCheck,
  RotateCcw,
  CheckCircle2,
  AlertTriangle
} from 'lucide-react';

export default function AdminUserManagementPage() {
  const { user: currentUser } = useAuth();
  const { success, error: toastError } = useToast();

  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [activeFilter, setActiveFilter] = useState('');

  // Confirmation dialog state
  const [targetUser, setTargetUser] = useState(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  const fetchUsers = useCallback(async () => {
    try {
      setLoading(true);
      const params = {};
      if (search.trim()) params.search = search.trim();
      if (roleFilter) params.role = roleFilter;
      if (activeFilter !== '') params.is_active = activeFilter;

      const res = await adminService.getUsers(params);
      if (res.success) {
        setUsers(res.users || []);
      }
    } catch (err) {
      toastError('Failed to fetch user directory');
    } finally {
      setLoading(false);
    }
  }, [search, roleFilter, activeFilter, toastError]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleToggleActiveClick = (user) => {
    if (user.user_id === currentUser.userId) {
      toastError('You cannot deactivate your own administrator account');
      return;
    }
    setTargetUser(user);
    setConfirmOpen(true);
  };

  const confirmToggleActive = async () => {
    if (!targetUser) return;

    setActionLoading(true);
    try {
      const res = await adminService.toggleUserActive(targetUser.user_id);
      if (res.success) {
        success(res.message);
        setConfirmOpen(false);
        setTargetUser(null);
        fetchUsers();
      }
    } catch (err) {
      toastError(err.response?.data?.message || 'Failed to update user account status');
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Title */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-navy-900 tracking-tight">
          User Directory & Access Control
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Review registered students, faculty members, and campus administrative personnel
        </p>
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col sm:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
            <Search className="w-4 h-4" />
          </div>
          <input
            type="text"
            placeholder="Search by name, email, or student ID..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
        </div>

        <select
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value)}
          className="w-full sm:w-40 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary-500 cursor-pointer"
        >
          <option value="">All Roles</option>
          <option value="USER">USER</option>
          <option value="ADMIN">ADMIN</option>
        </select>

        <select
          value={activeFilter}
          onChange={(e) => setActiveFilter(e.target.value)}
          className="w-full sm:w-40 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary-500 cursor-pointer"
        >
          <option value="">All Statuses</option>
          <option value="1">Active</option>
          <option value="0">Deactivated</option>
        </select>

        {(search || roleFilter || activeFilter !== '') && (
          <button
            type="button"
            onClick={() => {
              setSearch('');
              setRoleFilter('');
              setActiveFilter('');
            }}
            className="text-xs text-primary-600 hover:text-primary-800 font-semibold flex items-center gap-1 whitespace-nowrap self-end sm:self-center"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Reset
          </button>
        )}
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm overflow-hidden">
        {loading ? (
          <LoadingSpinner message="Loading user directory..." />
        ) : users.length === 0 ? (
          <div className="p-8">
            <EmptyState
              title="No users match query"
              description="No user records found with the applied filters."
            />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-600">
              <thead className="bg-slate-50/80 text-xs uppercase font-semibold text-slate-500 border-b border-slate-100">
                <tr>
                  <th className="px-6 py-4">User</th>
                  <th className="px-6 py-4">Student / Employee ID</th>
                  <th className="px-6 py-4">Role</th>
                  <th className="px-6 py-4">Complaints Filed</th>
                  <th className="px-6 py-4">Joined Date</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4 text-right">Access Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {users.map((u) => {
                  const isCurrent = u.user_id === currentUser.userId;
                  return (
                    <tr key={u.user_id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl bg-navy-900 text-white flex items-center justify-center font-bold text-xs flex-shrink-0">
                            {u.full_name?.charAt(0) || 'U'}
                          </div>
                          <div>
                            <div className="font-semibold text-slate-900 text-sm flex items-center gap-1.5">
                              {u.full_name}
                              {isCurrent && (
                                <span className="text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded font-mono">
                                  You
                                </span>
                              )}
                            </div>
                            <div className="text-xs text-slate-500">{u.email}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 font-mono text-xs text-slate-700">
                        {u.student_employee_id || 'N/A'}
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                            u.role === 'ADMIN'
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-primary-50 text-primary-700 border border-primary-200'
                          }`}
                        >
                          {u.role === 'ADMIN' && <ShieldCheck className="w-3.5 h-3.5" />}
                          {u.role}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-xs font-semibold text-slate-700">
                        {u.complaint_count} tickets
                      </td>
                      <td className="px-6 py-4 text-xs text-slate-500">
                        {formatDateOnly(u.created_at)}
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium border ${
                            u.is_active
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                              : 'bg-rose-50 text-rose-700 border-rose-200'
                          }`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${
                              u.is_active ? 'bg-emerald-500' : 'bg-rose-500'
                            }`}
                          />
                          {u.is_active ? 'Active' : 'Deactivated'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        {isCurrent ? (
                          <span className="text-xs text-slate-400 italic">Current Session</span>
                        ) : (
                          <button
                            type="button"
                            onClick={() => handleToggleActiveClick(u)}
                            className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                              u.is_active
                                ? 'bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200'
                                : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200'
                            }`}
                          >
                            {u.is_active ? (
                              <>
                                <UserX className="w-3.5 h-3.5" />
                                Deactivate
                              </>
                            ) : (
                              <>
                                <UserCheck className="w-3.5 h-3.5" />
                                Reactivate
                              </>
                            )}
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Confirmation Dialog */}
      {confirmOpen && targetUser && (
        <ConfirmDialog
          isOpen={confirmOpen}
          onClose={() => setConfirmOpen(false)}
          onConfirm={confirmToggleActive}
          title={targetUser.is_active ? 'Deactivate User Account' : 'Reactivate User Account'}
          message={
            targetUser.is_active
              ? `Are you sure you want to deactivate ${targetUser.full_name}'s account (${targetUser.email})? Deactivated users will be blocked from logging in.`
              : `Are you sure you want to restore access for ${targetUser.full_name} (${targetUser.email})?`
          }
          confirmText={targetUser.is_active ? 'Deactivate Account' : 'Reactivate Account'}
          isDanger={targetUser.is_active}
          loading={actionLoading}
        />
      )}
    </div>
  );
}
