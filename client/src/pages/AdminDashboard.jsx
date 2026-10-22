import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { adminService } from '../services/adminService';
import StatCard from '../components/StatCard';
import StatusBadge from '../components/StatusBadge';
import PriorityBadge from '../components/PriorityBadge';
import LoadingSpinner from '../components/LoadingSpinner';
import { formatDate } from '../utils/formatters';
import {
  FileText,
  Clock,
  CheckCircle2,
  XCircle,
  TrendingUp,
  Users,
  ArrowRight,
  FileSpreadsheet,
  AlertTriangle,
  Layers,
  FolderTree,
  GraduationCap
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend
} from 'recharts';

const CATEGORY_COLORS = [
  '#0066cc',
  '#0284c7',
  '#0d9488',
  '#10b981',
  '#f59e0b',
  '#ea580c',
  '#8b5cf6',
  '#ec4899',
  '#64748b'
];

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function loadStats() {
      try {
        setLoading(true);
        const data = await adminService.getDashboardStats();
        if (data.success) {
          setStats(data.stats);
        }
      } catch (err) {
        setError('Failed to fetch administrator statistics from database');
      } finally {
        setLoading(false);
      }
    }
    loadStats();
  }, []);

  if (loading) {
    return <LoadingSpinner fullPage message="Loading database metrics..." />;
  }

  if (error || !stats) {
    return <div className="p-8 text-center text-rose-600 font-semibold">{error}</div>;
  }

  const {
    totalComplaints,
    totalUsers,
    resolutionRate,
    statusCounts,
    categoryBreakdown,
    priorityCounts,
    recentComplaints
  } = stats;

  // Format data for Status Chart
  const statusChartData = [
    { name: 'Submitted', count: statusCounts.Submitted || 0, fill: '#3b82f6' },
    { name: 'Under Review', count: statusCounts['Under Review'] || 0, fill: '#f59e0b' },
    { name: 'In Progress', count: statusCounts['In Progress'] || 0, fill: '#8b5cf6' },
    { name: 'Resolved', count: statusCounts.Resolved || 0, fill: '#10b981' },
    { name: 'Rejected', count: statusCounts.Rejected || 0, fill: '#f43f5e' },
    { name: 'Reopened', count: statusCounts.Reopened || 0, fill: '#ea580c' }
  ];

  // Format data for Priority Chart
  const priorityChartData = [
    { name: 'Low', count: priorityCounts.Low || 0, fill: '#64748b' },
    { name: 'Medium', count: priorityCounts.Medium || 0, fill: '#0284c7' },
    { name: 'High', count: priorityCounts.High || 0, fill: '#f59e0b' },
    { name: 'Urgent', count: priorityCounts.Urgent || 0, fill: '#dc2626' }
  ];

  return (
    <div className="space-y-8">
      {/* Header and Quick Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-navy-900 tracking-tight">
            Administrator Dashboard
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Real-time MySQL grievance metrics, category distributions, and active triage queues
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            to="/admin/complaints"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-navy-900 hover:bg-navy-800 text-white font-semibold text-xs transition-colors shadow-sm"
          >
            <Layers className="w-4 h-4" />
            Manage All Tickets
          </Link>
        </div>
      </div>

      {/* KPI Cards Row 1 */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        <StatCard
          title="Total Complaints"
          value={totalComplaints}
          subtitle="All-time recorded"
          icon={FileText}
          color="navy"
        />
        <StatCard
          title="Resolution Rate"
          value={`${resolutionRate}%`}
          subtitle="Closed successfully"
          icon={TrendingUp}
          color="emerald"
        />
        <StatCard
          title="Active In Triage"
          value={(statusCounts.Submitted || 0) + (statusCounts['Under Review'] || 0) + (statusCounts['In Progress'] || 0)}
          subtitle="Requiring attention"
          icon={Clock}
          color="amber"
        />
        <StatCard
          title="Registered Students"
          value={totalUsers}
          subtitle="Campus accounts"
          icon={Users}
          color="indigo"
        />
      </div>

      {/* KPI Cards Row 2 - Status Breakdown */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="bg-white p-3.5 rounded-2xl border border-slate-200/80 text-center shadow-xs">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Submitted</span>
          <span className="text-xl font-bold text-blue-600 mt-1 block">{statusCounts.Submitted || 0}</span>
        </div>
        <div className="bg-white p-3.5 rounded-2xl border border-slate-200/80 text-center shadow-xs">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Under Review</span>
          <span className="text-xl font-bold text-amber-600 mt-1 block">{statusCounts['Under Review'] || 0}</span>
        </div>
        <div className="bg-white p-3.5 rounded-2xl border border-slate-200/80 text-center shadow-xs">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">In Progress</span>
          <span className="text-xl font-bold text-purple-600 mt-1 block">{statusCounts['In Progress'] || 0}</span>
        </div>
        <div className="bg-white p-3.5 rounded-2xl border border-slate-200/80 text-center shadow-xs">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Resolved</span>
          <span className="text-xl font-bold text-emerald-600 mt-1 block">{statusCounts.Resolved || 0}</span>
        </div>
        <div className="bg-white p-3.5 rounded-2xl border border-slate-200/80 text-center shadow-xs">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Rejected</span>
          <span className="text-xl font-bold text-rose-600 mt-1 block">{statusCounts.Rejected || 0}</span>
        </div>
        <div className="bg-white p-3.5 rounded-2xl border border-slate-200/80 text-center shadow-xs">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Reopened</span>
          <span className="text-xl font-bold text-orange-600 mt-1 block">{statusCounts.Reopened || 0}</span>
        </div>
      </div>

      {/* Visual Analytics Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Complaints by Category Distribution */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h2 className="text-base font-bold text-navy-900">
              Complaints by Category
            </h2>
            <span className="text-xs text-slate-400 font-medium">Department workload</span>
          </div>

          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={categoryBreakdown.map((item) => ({
                  name: item.category_name.length > 15 ? `${item.category_name.slice(0, 15)}...` : item.category_name,
                  count: item.count
                }))}
                margin={{ top: 10, right: 10, left: -20, bottom: 40 }}
              >
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis
                  dataKey="name"
                  angle={-35}
                  textAnchor="end"
                  interval={0}
                  tick={{ fontSize: 11, fill: '#64748b' }}
                />
                <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: '#64748b' }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0f172a',
                    borderRadius: '12px',
                    color: '#fff',
                    border: 'none',
                    fontSize: '12px'
                  }}
                />
                <Bar dataKey="count" fill="#0066cc" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Complaints by Status & Priority */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h2 className="text-base font-bold text-navy-900">
              Status & Priority Distribution
            </h2>
            <span className="text-xs text-slate-400 font-medium">Resolution pipeline</span>
          </div>

          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={statusChartData}
                margin={{ top: 10, right: 10, left: -20, bottom: 20 }}
              >
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#64748b' }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: '#64748b' }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0f172a',
                    borderRadius: '12px',
                    color: '#fff',
                    border: 'none',
                    fontSize: '12px'
                  }}
                />
                <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                  {statusChartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Recent Submissions Triage Table */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-navy-900">Latest Submissions</h2>
            <p className="text-xs text-slate-500 mt-0.5">Most recent tickets requiring attention</p>
          </div>
          <Link
            to="/admin/complaints"
            className="text-xs font-semibold text-primary-600 hover:text-primary-700 flex items-center gap-1"
          >
            Open Queue
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-600">
            <thead className="bg-slate-50/80 text-xs uppercase font-semibold text-slate-500 border-b border-slate-100">
              <tr>
                <th className="px-6 py-4">Ref No</th>
                <th className="px-6 py-4">Title & Category</th>
                <th className="px-6 py-4">Submitted By</th>
                <th className="px-6 py-4">Priority</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Date</th>
                <th className="px-6 py-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {recentComplaints.map((item) => (
                <tr key={item.complaint_id} className="hover:bg-slate-50/70 transition-colors">
                  <td className="px-6 py-4 font-mono font-semibold text-xs text-primary-700 whitespace-nowrap">
                    {item.reference_number}
                  </td>
                  <td className="px-6 py-4">
                    <div className="font-semibold text-slate-900 text-sm line-clamp-1">
                      {item.title}
                    </div>
                    <div className="text-xs text-slate-500 mt-0.5">{item.category_name}</div>
                  </td>
                  <td className="px-6 py-4 text-xs font-medium text-slate-800 whitespace-nowrap">
                    {item.user_name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <PriorityBadge priority={item.priority} />
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <StatusBadge status={item.status} />
                  </td>
                  <td className="px-6 py-4 text-xs text-slate-500 whitespace-nowrap">
                    {formatDate(item.created_at)}
                  </td>
                  <td className="px-6 py-4 text-right whitespace-nowrap">
                    <Link
                      to={`/admin/complaints/${item.complaint_id}`}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-navy-900 hover:bg-navy-800 text-white text-xs font-semibold transition-colors"
                    >
                      Review
                      <ArrowRight className="w-3 h-3" />
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
