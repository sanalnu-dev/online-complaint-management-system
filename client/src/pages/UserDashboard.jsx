import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { complaintService } from '../services/complaintService';
import StatCard from '../components/StatCard';
import StatusBadge from '../components/StatusBadge';
import PriorityBadge from '../components/PriorityBadge';
import LoadingSpinner from '../components/LoadingSpinner';
import EmptyState from '../components/EmptyState';
import { formatDate } from '../utils/formatters';
import {
  FileText,
  Clock,
  CheckCircle2,
  AlertCircle,
  PlusCircle,
  ArrowRight,
  RotateCcw
} from 'lucide-react';

export default function UserDashboard() {
  const { user } = useAuth();
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function fetchDashboardData() {
      try {
        setLoading(true);
        const data = await complaintService.getMyComplaints({ limit: 5 });
        if (data.success) {
          setComplaints(data.complaints || []);
        }
      } catch (err) {
        setError('Failed to load recent complaints');
      } finally {
        setLoading(false);
      }
    }
    fetchDashboardData();
  }, []);

  // Calculate user-level summary stats from complaints
  const total = complaints.length;
  const inProgress = complaints.filter(
    (c) => c.status === 'In Progress' || c.status === 'Under Review'
  ).length;
  const resolved = complaints.filter((c) => c.status === 'Resolved').length;
  const reopened = complaints.filter((c) => c.status === 'Reopened').length;

  return (
    <div className="space-y-8">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-navy-950 via-navy-900 to-navy-800 text-white rounded-3xl p-6 sm:p-8 shadow-lg shadow-navy-900/10 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-white text-xs font-semibold uppercase tracking-wider backdrop-blur-sm mb-3">
            Campus Portal Member
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Welcome, {user?.fullName}!
          </h1>
          <p className="text-sm text-slate-300 mt-1 max-w-xl">
            Track your logged grievances, follow up on technician updates, and submit new campus complaints.
          </p>
        </div>

        <Link
          to="/complaints/new"
          className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-2xl bg-primary-600 hover:bg-primary-500 text-white font-semibold text-sm transition-all shadow-md shadow-primary-600/30 whitespace-nowrap self-start md:self-auto"
        >
          <PlusCircle className="w-4 h-4" />
          Submit Complaint
        </Link>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        <StatCard
          title="Recent Submissions"
          value={total}
          subtitle="Complaints tracked"
          icon={FileText}
          color="blue"
        />
        <StatCard
          title="Under Action"
          value={inProgress}
          subtitle="Review & in-progress"
          icon={Clock}
          color="amber"
        />
        <StatCard
          title="Resolved"
          value={resolved}
          subtitle="Successfully closed"
          icon={CheckCircle2}
          color="emerald"
        />
        <StatCard
          title="Reopened"
          value={reopened}
          subtitle="Follow-up needed"
          icon={RotateCcw}
          color="purple"
        />
      </div>

      {/* Recent Activity Table */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-navy-900">Recent Complaints</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Overview of your latest reported issues
            </p>
          </div>
          <Link
            to="/complaints"
            className="text-xs font-semibold text-primary-600 hover:text-primary-700 flex items-center gap-1"
          >
            View All
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {loading ? (
          <LoadingSpinner message="Loading your recent complaints..." />
        ) : error ? (
          <div className="p-6 text-center text-sm text-rose-600">{error}</div>
        ) : complaints.length === 0 ? (
          <div className="p-6">
            <EmptyState
              title="No complaints filed yet"
              description="Have an issue on campus? Submit a ticket and our maintenance team will investigate."
              actionText="Submit First Complaint"
              onAction={() => window.location.assign('/complaints/new')}
            />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-600">
              <thead className="bg-slate-50/80 text-xs uppercase font-semibold text-slate-500 border-b border-slate-100">
                <tr>
                  <th className="px-6 py-3.5">Reference No</th>
                  <th className="px-6 py-3.5">Title & Category</th>
                  <th className="px-6 py-3.5">Priority</th>
                  <th className="px-6 py-3.5">Status</th>
                  <th className="px-6 py-3.5">Date</th>
                  <th className="px-6 py-3.5 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {complaints.map((item) => (
                  <tr key={item.complaint_id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="px-6 py-4 font-mono font-semibold text-xs text-primary-700">
                      {item.reference_number}
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-semibold text-slate-900 text-sm">{item.title}</div>
                      <div className="text-xs text-slate-500 mt-0.5">{item.category_name}</div>
                    </td>
                    <td className="px-6 py-4">
                      <PriorityBadge priority={item.priority} />
                    </td>
                    <td className="px-6 py-4">
                      <StatusBadge status={item.status} />
                    </td>
                    <td className="px-6 py-4 text-xs text-slate-500">
                      {formatDate(item.created_at)}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <Link
                        to={`/complaints/${item.complaint_id}`}
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-primary-50 hover:text-primary-700 text-xs font-semibold text-slate-700 transition-colors"
                      >
                        Details
                        <ArrowRight className="w-3 h-3" />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
