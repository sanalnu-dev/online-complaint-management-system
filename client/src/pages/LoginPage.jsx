import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useToast } from '../hooks/useToast';
import { ShieldAlert, Mail, Lock, AlertCircle, ArrowRight, Sparkles } from 'lucide-react';

export default function LoginPage() {
  const { login } = useAuth();
  const { success, error: toastError } = useToast();
  const navigate = useNavigate();
  const location = useLocation();

  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });

  const [loading, setLoading] = useState(false);
  const [formError, setFormError] = useState('');

  // Check if redirected due to expired session
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    if (params.get('expired') === 'true') {
      setFormError('Your session has expired. Please log in again.');
    }
  }, [location.search]);

  const handleChange = (e) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
    setFormError('');
  };

  const fillCredentials = (email, password) => {
    setFormData({ email, password });
    setFormError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');
    setLoading(true);

    try {
      const res = await login(formData);
      if (res.success) {
        success(`Welcome back, ${res.user.fullName}!`);
        if (res.user.role === 'ADMIN') {
          navigate('/admin/dashboard');
        } else {
          navigate('/dashboard');
        }
      } else {
        setFormError(res.message || 'Login failed');
      }
    } catch (err) {
      const message = err.response?.data?.message || 'Invalid email or password';
      setFormError(message);
      toastError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md bg-white rounded-3xl p-8 sm:p-10 border border-slate-200/80 shadow-xl shadow-slate-200/50">
        {/* Brand Header */}
        <div className="text-center mb-8">
          <div className="w-12 h-12 rounded-2xl bg-navy-900 text-white flex items-center justify-center mx-auto mb-3 shadow-md shadow-navy-900/20">
            <ShieldAlert className="w-7 h-7 text-primary-400" />
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-navy-900 tracking-tight">
            Portal Sign In
          </h2>
          <p className="text-sm text-slate-500 mt-1">
            Access your grievance tracking and resolution account
          </p>
        </div>

        {formError && (
          <div className="mb-6 p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-sm flex items-start gap-2.5">
            <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5 text-rose-500" />
            <span>{formError}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5 uppercase tracking-wider">
              College Email
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

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider">
                Password
              </label>
            </div>
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
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-2 py-3 px-4 rounded-xl bg-navy-900 hover:bg-navy-800 text-white font-semibold shadow-md shadow-navy-900/20 focus:outline-none focus:ring-2 focus:ring-navy-900 focus:ring-offset-2 transition-all flex items-center justify-center gap-2"
          >
            {loading ? (
              <span className="inline-block w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
            ) : (
              <>
                Log In
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        {/* Quick Demo Credentials 1-Click Filler */}
        <div className="mt-8 pt-6 border-t border-slate-200/80">
          <div className="flex items-center gap-1.5 mb-3 text-xs font-bold text-slate-500 uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5 text-primary-500" />
            1-Click Demo Login
          </div>
          <div className="grid grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => fillCredentials('admin@ocms.edu', 'Admin@12345')}
              className="px-2.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition-colors text-center"
            >
              Demo Admin
            </button>
            <button
              type="button"
              onClick={() => fillCredentials('student1@ocms.edu', 'User@12345')}
              className="px-2.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition-colors text-center"
            >
              Demo Student
            </button>
            <button
              type="button"
              onClick={() => fillCredentials('employee1@ocms.edu', 'User@12345')}
              className="px-2.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition-colors text-center"
            >
              Demo Faculty
            </button>
          </div>
        </div>

        <p className="text-center text-xs text-slate-500 mt-6">
          Don't have an account?{' '}
          <Link to="/register" className="text-primary-600 hover:underline font-semibold">
            Register here
          </Link>
        </p>
      </div>
    </div>
  );
}
