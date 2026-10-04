import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import {
  ShieldAlert,
  Clock,
  CheckCircle,
  FileCheck2,
  Users2,
  Lock,
  ArrowRight,
  Sparkles,
  Search,
  MessageSquare
} from 'lucide-react';

export default function LandingPage() {
  const { isAuthenticated, isAdmin } = useAuth();

  return (
    <div className="space-y-16 py-8 sm:py-12">
      {/* Hero Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-8">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-primary-50 border border-primary-200 text-primary-700 text-xs font-semibold tracking-wide uppercase">
          <Sparkles className="w-3.5 h-3.5" />
          Next-Gen Campus Grievance Portal
        </div>

        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-navy-900 tracking-tight leading-tight max-w-4xl mx-auto">
          Online Complaint Management System{' '}
          <span className="text-primary-600 block sm:inline">(OCMS)</span>
        </h1>

        <p className="text-lg sm:text-xl text-slate-600 max-w-2xl mx-auto leading-relaxed">
          A centralized, transparent, and accountable platform for students, faculty, and campus administrators to report, manage, and resolve college facility and academic issues.
        </p>

        {/* CTA buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-2">
          {isAuthenticated ? (
            <Link
              to={isAdmin ? '/admin/dashboard' : '/dashboard'}
              className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-navy-900 hover:bg-navy-800 text-white font-semibold shadow-lg shadow-navy-900/20 transition-all flex items-center justify-center gap-2"
            >
              Go to Dashboard
              <ArrowRight className="w-4 h-4" />
            </Link>
          ) : (
            <>
              <Link
                to="/register"
                className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-primary-600 hover:bg-primary-700 text-white font-semibold shadow-lg shadow-primary-600/20 transition-all flex items-center justify-center gap-2"
              >
                File a Complaint
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                to="/login"
                className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 font-semibold shadow-sm transition-all"
              >
                Sign In to Portal
              </Link>
            </>
          )}
        </div>

        {/* Demo Credentials Quick Teaser */}
        <div className="max-w-xl mx-auto mt-8 p-4 rounded-2xl bg-white border border-slate-200/80 shadow-sm text-left">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2 mb-3">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Quick Test Credentials
            </span>
            <Link to="/login" className="text-xs font-semibold text-primary-600 hover:underline">
              Auto-fill on Login →
            </Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/60">
              <span className="font-bold text-slate-900 block">Administrator</span>
              <code className="text-slate-600 block mt-0.5">admin@ocms.edu</code>
              <span className="text-slate-400">Password: Admin@12345</span>
            </div>
            <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/60">
              <span className="font-bold text-slate-900 block">Student User</span>
              <code className="text-slate-600 block mt-0.5">student1@ocms.edu</code>
              <span className="text-slate-400">Password: User@12345</span>
            </div>
          </div>
        </div>
      </section>

      {/* Feature Highlights */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-2xl sm:text-3xl font-bold text-navy-900">
            Engineered for Campus Accountability
          </h2>
          <p className="text-slate-600 mt-2 max-w-xl mx-auto text-sm sm:text-base">
            Every ticket is tracked with a verifiable audit trail, real-time status updates, and department assignment.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
            <div className="w-12 h-12 rounded-xl bg-blue-50 text-primary-600 flex items-center justify-center mb-4">
              <FileCheck2 className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-navy-900 mb-2">Unique Ticket Identification</h3>
            <p className="text-sm text-slate-600 leading-relaxed">
              Every complaint generates a unique reference number (e.g., <code className="bg-slate-100 px-1 py-0.5 rounded font-mono text-primary-700">OCMS-2026-00001</code>) for effortless tracking and referencing across campus offices.
            </p>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
            <div className="w-12 h-12 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center mb-4">
              <Clock className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-navy-900 mb-2">Immutable Audit Timeline</h3>
            <p className="text-sm text-slate-600 leading-relaxed">
              Full lifecycle tracking from Submitted, Under Review, In Progress, to Resolved or Rejected with official admin remarks and timestamps for complete transparency.
            </p>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
            <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-4">
              <Lock className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-navy-900 mb-2">Role Isolation & Security</h3>
            <p className="text-sm text-slate-600 leading-relaxed">
              Strict privacy isolation ensures students view only their own complaints, while administrators receive dedicated triage queues, assignment controls, and CSV export.
            </p>
          </div>
        </div>
      </section>

      {/* How it Works Workflow */}
      <section className="bg-navy-900 text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">
              Transparent Redressal Workflow
            </h2>
            <p className="text-slate-300 mt-2 text-sm sm:text-base">
              From report to resolution, each step is systematically recorded in the database.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-navy-800/80 p-6 rounded-2xl border border-navy-700 relative">
              <div className="w-8 h-8 rounded-full bg-primary-500 text-white font-bold flex items-center justify-center text-sm mb-4">
                1
              </div>
              <h4 className="font-bold text-lg mb-1">Submit Ticket</h4>
              <p className="text-xs text-slate-300 leading-relaxed">
                Provide title, category, department location, priority, and optional photo or PDF documentation.
              </p>
            </div>

            <div className="bg-navy-800/80 p-6 rounded-2xl border border-navy-700 relative">
              <div className="w-8 h-8 rounded-full bg-amber-500 text-white font-bold flex items-center justify-center text-sm mb-4">
                2
              </div>
              <h4 className="font-bold text-lg mb-1">Under Review</h4>
              <p className="text-xs text-slate-300 leading-relaxed">
                Administration inspects the report, prioritizes urgency, and assigns technician or estate officers.
              </p>
            </div>

            <div className="bg-navy-800/80 p-6 rounded-2xl border border-navy-700 relative">
              <div className="w-8 h-8 rounded-full bg-purple-500 text-white font-bold flex items-center justify-center text-sm mb-4">
                3
              </div>
              <h4 className="font-bold text-lg mb-1">In Progress</h4>
              <p className="text-xs text-slate-300 leading-relaxed">
                Repairs or administrative actions are underway with two-way messaging on the ticket thread.
              </p>
            </div>

            <div className="bg-navy-800/80 p-6 rounded-2xl border border-navy-700 relative">
              <div className="w-8 h-8 rounded-full bg-emerald-500 text-white font-bold flex items-center justify-center text-sm mb-4">
                4
              </div>
              <h4 className="font-bold text-lg mb-1">Resolved</h4>
              <p className="text-xs text-slate-300 leading-relaxed">
                Resolution remarks are recorded. If an issue is not solved satisfactorily, users can reopen the ticket.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Categories Grid */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold text-navy-900">Supported Campus Categories</h2>
          <p className="text-slate-600 text-sm mt-1">
            Categorized ticketing for rapid routing to responsible departments
          </p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 text-center">
          {[
            'Infrastructure and Maintenance',
            'Electricity and Water',
            'Hostel Facilities',
            'Library Resources',
            'IT and Internet',
            'Academics & Exams',
            'Administration & Registrar',
            'Cleanliness & Sanitation'
          ].map((cat, idx) => (
            <div
              key={idx}
              className="p-3.5 bg-white rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 hover:border-primary-300 hover:bg-primary-50/50 transition-colors"
            >
              {cat}
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
