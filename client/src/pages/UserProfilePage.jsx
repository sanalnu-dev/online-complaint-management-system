import React, { useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useToast } from '../hooks/useToast';
import { authService } from '../services/authService';
import { formatDate } from '../utils/formatters';
import {
  User,
  Mail,
  BadgeCheck,
  Shield,
  KeyRound,
  Lock,
  Save,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';

export default function UserProfilePage() {
  const { user, updateUserState } = useAuth();
  const { success, error: toastError } = useToast();

  // Profile Form state
  const [profileData, setProfileData] = useState({
    full_name: user?.fullName || '',
    student_employee_id: user?.studentEmployeeId || ''
  });
  const [updatingProfile, setUpdatingProfile] = useState(false);

  // Password Form state
  const [passwordData, setPasswordData] = useState({
    old_password: '',
    new_password: '',
    confirm_new_password: ''
  });
  const [updatingPassword, setUpdatingPassword] = useState(false);
  const [passwordError, setPasswordError] = useState('');

  // Password requirements
  const newPass = passwordData.new_password;
  const hasMinLength = newPass.length >= 8;
  const hasUppercase = /[A-Z]/.test(newPass);
  const hasLowercase = /[a-z]/.test(newPass);
  const hasNumber = /[0-9]/.test(newPass);
  const hasSpecial = /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(newPass);
  const strengthCount = [hasMinLength, hasUppercase, hasLowercase, hasNumber, hasSpecial].filter(Boolean).length;

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    if (!profileData.full_name.trim()) {
      toastError('Full name cannot be empty');
      return;
    }

    setUpdatingProfile(true);
    try {
      const res = await authService.updateProfile(profileData);
      if (res.success) {
        updateUserState({
          fullName: profileData.full_name.trim(),
          studentEmployeeId: profileData.student_employee_id.trim() || null
        });
        success('Profile updated successfully');
      }
    } catch (err) {
      toastError(err.response?.data?.message || 'Failed to update profile');
    } finally {
      setUpdatingProfile(false);
    }
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    setPasswordError('');

    if (strengthCount < 5) {
      setPasswordError('Please meet all password complexity requirements');
      return;
    }

    if (passwordData.new_password !== passwordData.confirm_new_password) {
      setPasswordError('New passwords do not match');
      return;
    }

    setUpdatingPassword(true);
    try {
      const res = await authService.changePassword(passwordData);
      if (res.success) {
        success('Password changed successfully');
        setPasswordData({
          old_password: '',
          new_password: '',
          confirm_new_password: ''
        });
      }
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to change password';
      setPasswordError(msg);
      toastError(msg);
    } finally {
      setUpdatingPassword(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-navy-900 tracking-tight">
          User Profile & Settings
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Manage your account information, student identifier, and login security
        </p>
      </div>

      {/* Account Overview Header Card */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-sm flex flex-col sm:flex-row items-center gap-6">
        <div className="w-20 h-20 rounded-2xl bg-navy-900 text-white flex items-center justify-center font-bold text-3xl shadow-lg shadow-navy-900/10">
          {user?.fullName?.charAt(0) || 'U'}
        </div>
        <div className="text-center sm:text-left flex-1">
          <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
            <h2 className="text-xl font-bold text-navy-900">{user?.fullName}</h2>
            <span
              className={`text-xs px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider ${
                user?.role === 'ADMIN'
                  ? 'bg-amber-100 text-amber-800'
                  : 'bg-primary-100 text-primary-800'
              }`}
            >
              {user?.role}
            </span>
          </div>
          <p className="text-sm text-slate-500 mt-1">{user?.email}</p>
          <div className="flex flex-wrap items-center justify-center sm:justify-start gap-4 mt-3 text-xs text-slate-500 font-medium">
            <span>ID: {user?.studentEmployeeId || 'Not assigned'}</span>
            <span>•</span>
            <span>Status: <span className="text-emerald-600 font-semibold">Active</span></span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Edit Profile Information */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-sm">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-3 mb-6">
            <User className="w-5 h-5 text-primary-600" />
            <h3 className="font-bold text-navy-900 text-base">Personal Details</h3>
          </div>

          <form onSubmit={handleProfileSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Full Name
              </label>
              <input
                type="text"
                required
                value={profileData.full_name}
                onChange={(e) =>
                  setProfileData((prev) => ({ ...prev, full_name: e.target.value }))
                }
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Email Address
              </label>
              <input
                type="email"
                disabled
                value={user?.email || ''}
                className="w-full px-4 py-2.5 bg-slate-100 border border-slate-200 rounded-xl text-sm text-slate-500 cursor-not-allowed"
              />
              <span className="text-[11px] text-slate-400 mt-1 block">
                Email cannot be modified directly.
              </span>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Student / Employee ID
              </label>
              <input
                type="text"
                value={profileData.student_employee_id}
                onChange={(e) =>
                  setProfileData((prev) => ({
                    ...prev,
                    student_employee_id: e.target.value
                  }))
                }
                placeholder="e.g. STU-2024-001"
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>

            <button
              type="submit"
              disabled={updatingProfile}
              className="w-full mt-2 py-2.5 rounded-xl bg-primary-600 hover:bg-primary-700 text-white font-semibold text-xs transition-colors flex items-center justify-center gap-2"
            >
              {updatingProfile ? (
                <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
              ) : (
                <Save className="w-4 h-4" />
              )}
              Save Profile Changes
            </button>
          </form>
        </div>

        {/* Change Password */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-sm">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-3 mb-6">
            <Lock className="w-5 h-5 text-primary-600" />
            <h3 className="font-bold text-navy-900 text-base">Security & Password</h3>
          </div>

          {passwordError && (
            <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{passwordError}</span>
            </div>
          )}

          <form onSubmit={handlePasswordSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Current Password
              </label>
              <input
                type="password"
                required
                value={passwordData.old_password}
                onChange={(e) =>
                  setPasswordData((prev) => ({ ...prev, old_password: e.target.value }))
                }
                placeholder="••••••••"
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                New Password
              </label>
              <input
                type="password"
                required
                value={passwordData.new_password}
                onChange={(e) =>
                  setPasswordData((prev) => ({ ...prev, new_password: e.target.value }))
                }
                placeholder="••••••••"
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
              {newPass && (
                <div className="mt-2 text-[10px] text-slate-500 space-y-1">
                  <div className="flex gap-1 h-1 w-full mb-1">
                    <div className={`h-full flex-1 rounded ${strengthCount >= 1 ? 'bg-rose-500' : 'bg-slate-200'}`} />
                    <div className={`h-full flex-1 rounded ${strengthCount >= 3 ? 'bg-amber-500' : 'bg-slate-200'}`} />
                    <div className={`h-full flex-1 rounded ${strengthCount >= 5 ? 'bg-emerald-500' : 'bg-slate-200'}`} />
                  </div>
                  <p className={strengthCount === 5 ? 'text-emerald-600 font-semibold' : ''}>
                    Requires 8+ chars, uppercase, lowercase, digit, & special char.
                  </p>
                </div>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Confirm New Password
              </label>
              <input
                type="password"
                required
                value={passwordData.confirm_new_password}
                onChange={(e) =>
                  setPasswordData((prev) => ({
                    ...prev,
                    confirm_new_password: e.target.value
                  }))
                }
                placeholder="••••••••"
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>

            <button
              type="submit"
              disabled={updatingPassword}
              className="w-full mt-2 py-2.5 rounded-xl bg-navy-900 hover:bg-navy-800 text-white font-semibold text-xs transition-colors flex items-center justify-center gap-2"
            >
              {updatingPassword ? (
                <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
              ) : (
                <KeyRound className="w-4 h-4" />
              )}
              Update Password
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
