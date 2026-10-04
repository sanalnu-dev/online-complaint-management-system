import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useToast } from '../hooks/useToast';
import { ShieldAlert, User, Mail, Lock, KeyRound, BadgeCheck, AlertCircle, ArrowRight } from 'lucide-react';

export default function RegisterPage() {
  const { register } = useAuth();
  const { success, error: toastError } = useToast();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    password: '',
    confirm_password: '',
    student_employee_id: ''
  });

  const [loading, setLoading] = useState(false);
  const [formError, setFormError] = useState('');

  // Password strength checks
  const password = formData.password;
  const hasMinLength = password.length >= 8;
  const hasUppercase = /[A-Z]/.test(password);
  const hasLowercase = /[a-z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const hasSpecial = /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(password);
  const passwordsMatch = password && formData.confirm_password && password === formData.confirm_password;

  const strengthCount = [hasMinLength, hasUppercase, hasLowercase, hasNumber, hasSpecial].filter(Boolean).length;

  const handleChange = (e) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
    setFormError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');

    if (strengthCount < 5) {
      setFormError('Please satisfy all password security requirements before proceeding.');
      return;
    }

    if (!passwordsMatch) {
      setFormError('Passwords do not match.');
      return;
    }

    setLoading(true);
    try {
      const res = await register(formData);
      if (res.success) {
        success('Registration successful! Welcome to OCMS.');
        navigate('/dashboard');
      } else {
        setFormError(res.message || 'Registration failed');
      }
    } catch (err) {
      const message = err.response?.data?.message || 'Failed to complete registration';
      setFormError(message);
      toastError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-lg bg-white rounded-3xl p-8 sm:p-10 border border-slate-200/80 shadow-xl shadow-slate-200/50">
        {/* Brand header */}
        <div className="text-center mb-8">
          <div className="w-12 h-12 rounded-2xl bg-navy-900 text-white flex items-center justify-center mx-auto mb-3 shadow-md shadow-navy-900/20">
            <ShieldAlert className="w-7 h-7 text-primary-400" />
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-navy-900 tracking-tight">
            Create an Account
          </h2>
          <p className="text-sm text-slate-500 mt-1">
            Register to submit and track your college grievance requests
          </p>
        </div>

        {formError && (
          <div className="mb-6 p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-sm flex items-start gap-2.5">
            <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5 text-rose-500" />
            <span>{formError}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Full Name */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5 uppercase tracking-wider">
              Full Name <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <User className="w-4 h-4" />
              </div>
              <input
                type="text"
                name="full_name"
                required
                value={formData.full_name}
                onChange={handleChange}
                placeholder="e.g. Alice Smith"
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
              />
            </div>
          </div>

          {/* Email */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5 uppercase tracking-wider">
              College Email <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <Mail className="w-4 h-4" />
              </div>
              <input
                type="email"
                name="email"
                required
                value={formData.email}
                onChange={handleChange}
                placeholder="name@ocms.edu"
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
              />
            </div>
          </div>

          {/* Student or Employee ID */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5 uppercase tracking-wider">
              Student / Employee ID <span className="text-slate-400 font-normal lowercase">(optional)</span>
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <BadgeCheck className="w-4 h-4" />
              </div>
              <input
                type="text"
                name="student_employee_id"
                value={formData.student_employee_id}
                onChange={handleChange}
                placeholder="e.g. STU-2024-001 or EMP-104"
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
              />
            </div>
          </div>

          {/* Password */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5 uppercase tracking-wider">
              Password <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <Lock className="w-4 h-4" />
              </div>
              <input
                type="password"
                name="password"
                required
                value={formData.password}
                onChange={handleChange}
                placeholder="••••••••"
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
              />
            </div>

            {/* Password strength meters */}
            {password && (
              <div className="mt-2.5 p-3 rounded-xl bg-slate-50 border border-slate-200/70 space-y-2">
                <div className="flex gap-1.5 h-1.5 w-full">
                  <div className={`h-full flex-1 rounded-full ${strengthCount >= 1 ? 'bg-rose-500' : 'bg-slate-200'}`} />
                  <div className={`h-full flex-1 rounded-full ${strengthCount >= 3 ? 'bg-amber-500' : 'bg-slate-200'}`} />
                  <div className={`h-full flex-1 rounded-full ${strengthCount >= 5 ? 'bg-emerald-500' : 'bg-slate-200'}`} />
                </div>
                <div className="grid grid-cols-2 gap-1 text-[11px] text-slate-500">
                  <span className={hasMinLength ? 'text-emerald-600 font-medium' : ''}>
                    ✓ 8+ Characters
                  </span>
                  <span className={hasUppercase ? 'text-emerald-600 font-medium' : ''}>
                    ✓ Uppercase letter
                  </span>
                  <span className={hasLowercase ? 'text-emerald-600 font-medium' : ''}>
                    ✓ Lowercase letter
                  </span>
                  <span className={hasNumber ? 'text-emerald-600 font-medium' : ''}>
                    ✓ Number (0-9)
                  </span>
                  <span className={hasSpecial ? 'text-emerald-600 font-medium' : ''}>
                    ✓ Special character
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Confirm Password */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5 uppercase tracking-wider">
              Confirm Password <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <KeyRound className="w-4 h-4" />
              </div>
              <input
                type="password"
                name="confirm_password"
                required
                value={formData.confirm_password}
                onChange={handleChange}
                placeholder="••••••••"
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
              />
            </div>
            {formData.confirm_password && !passwordsMatch && (
              <p className="text-xs text-rose-600 mt-1 font-medium">Passwords do not match</p>
            )}
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-4 py-3 px-4 rounded-xl bg-primary-600 hover:bg-primary-700 text-white font-semibold shadow-md shadow-primary-600/20 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 transition-all flex items-center justify-center gap-2"
          >
            {loading ? (
              <span className="inline-block w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
            ) : (
              <>
                Register Account
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        <p className="text-center text-xs text-slate-500 mt-6">
          Already registered?{' '}
          <Link to="/login" className="text-primary-600 hover:underline font-semibold">
            Sign in here
          </Link>
        </p>
      </div>
    </div>
  );
}
