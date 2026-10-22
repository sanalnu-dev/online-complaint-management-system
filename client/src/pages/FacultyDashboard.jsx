import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { facultyService } from '../services/facultyService';
import { useAuth } from '../hooks/useAuth';
import { useToast } from '../hooks/useToast';
import StatCard from '../components/StatCard';
import StatusBadge from '../components/StatusBadge';
import PriorityBadge from '../components/PriorityBadge';
import LoadingSpinner from '../components/LoadingSpinner';
import EmptyState from '../components/EmptyState';
import { formatDate } from '../utils/formatters';
import {
  GraduationCap,
  ClipboardList,
  Clock,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  TrendingUp,
  Inbox,
  Filter,
  Calendar,
  User,
  ShieldAlert
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Cell,
  PieChart,
  Pie
} from 'recharts';

export default function FacultyDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { error: toastError } = useToast();

  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchStats() {
      try {
        setLoading(true);
        const res = await facultyService.getDashboardStats();
        if (res.success) {
          setStats(res.stats);
        }
      } catch (err) {
        toastError(err.response?.data?.message || 'Failed to load faculty dashboard data');
      } finally {
        setLoading(false);
      }
    }
    fetchStats();
  }, [toastError]);

  if (loading) {
    return <LoadingSpinner fullPage message="Loading faculty workspace..." />;
  }

  if (!stats) {
    return (
      <EmptyState
        title="Workspace Unavailable"
        description="Could not load your assigned complaint statistics. Please try refreshing."
      />
    );
  }

  const priorityColors = {
    Urgent: '#ef4444',
    High: '#f59e0b',
    Medium: '#0284c7',
    Low: '#10b981'
  };

  const priorityChartData = Object.entries(stats.priorityCounts || {}).map(([name, count]) => ({
    name,
    count
  }));

  const categoryChartData = (stats.categoryBreakdown || []).slice(0, 6).map((cat) => ({
    name: cat.category_name.length > 16 ? `${cat.category_name.slice(0, 14)}...` : cat.category_name,
    fullName: cat.category_name,
    count: cat.count
  }));

  return (
    <div className="space-y-8">
      {/* Welcome Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-navy-950 via-navy-900 to-indigo-950 p-6 sm:p-8 text-white shadow-xl shadow-navy-950/20">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/20 border border-purple-400/30 text-purple-300 text-xs font-semibold uppercase tracking-wider">
              <GraduationCap className="w-3.5 h-3.5" />
              Faculty Grievance Resolution Desk
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Welcome back, {user?.fullName}
            </h1>
            <p className="text-sm text-slate-300 leading-relaxed">
              Review, acknowledge, investigate, and resolve grievances routed directly to your department and academic oversight.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Link
              to="/faculty/complaints"
              className="px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-semibold text-sm shadow-md shadow-purple-600/30 transition-all flex items-center gap-2"
            >
              <ClipboardList className="w-4 h-4" />
              Manage Queue ({stats.activeWorkload || 0})
            </Link>
          </div>
        </div>

        {/* Decorative background glow */}
        <div className="absolute -right-16 -top-16 w-64 h-64 rounded-full bg-purple-500/10 blur-3xl pointer-events-none" />
      </div>

      {/* Overdue Alert Banner if any complaints are past 7 days */}
      {stats.overdueCount > 0 && (
        <div className="p-4 sm:p-5 rounded-2xl bg-amber-50 border border-amber-200/80 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-amber-900 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center text-amber-600 flex-shrink-0">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <p className="font-bold text-sm">
                Attention Required: {stats.overdueCount} {stats.overdueCount === 1 ? 'complaint has' : 'complaints have'} exceeded the 7-day resolution window
              </p>
              <p className="text-xs text-amber-700 mt-0.5">
                Overdue complaints may be escalated to the department head or campus administrator.
              </p>
            </div>
          </div>
          <Link
            to="/faculty/complaints?overdue=true"
            className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold transition-colors whitespace-nowrap"
          >
            Review Overdue Tickets
          </Link>
        </div>
      )}

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
        <StatCard
          title="Total Assigned"
          value={stats.totalAssigned}
          subtitle="Cumulative tickets"
          icon={Inbox}
          trend={{ value: `${stats.activeWorkload} active`, isPositive: true }}
        />

        <StatCard
          title="Pending / Acknowledged"
          value={stats.pendingCount}
          subtitle="Requires faculty action"
          icon={Clock}
        />

        <StatCard
          title="In Progress / Review"
          value={stats.inProgressCount}
          subtitle="Under active investigation"
          icon={TrendingUp}
        />

        <StatCard
          title="Resolved by Faculty"
          value={stats.resolvedCount}
          subtitle={`${stats.resolutionRate}% resolution rate`}
          icon={CheckCircle2}
        />
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Category Breakdown Bar Chart */}
        <div className="lg:col-span-7 bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-bold text-navy-900 text-base">Complaints by Category</h2>
              <p className="text-xs text-slate-500">Distribution across assigned course & campus categories</p>
            </div>
            <span className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-slate-100 text-slate-600">
              {stats.categoryBreakdown?.length || 0} Categories
            </span>
          </div>

          <div className="h-64 w-full pt-4">
            {categoryChartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={categoryChartData} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
                  <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#64748b' }} interval={0} angle={-15} textAnchor="end" />
                  <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: '#64748b' }} />
                  <Tooltip
                    formatter={(val) => [`${val} complaints`, 'Total']}
                    labelFormatter={(label, payload) => payload?.[0]?.payload?.fullName || label}
                    contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0' }}
                  />
                  <Bar dataKey="count" fill="#7c3aed" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-xs text-slate-400">
                No categorical complaint data available
              </div>
            )}
          </div>
        </div>

        {/* Priority Breakdown Donut / Pie Chart */}
        <div className="lg:col-span-5 bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm space-y-4">
          <div>
            <h2 className="font-bold text-navy-900 text-base">Priority Breakdown</h2>
            <p className="text-xs text-slate-500">Urgency level of assigned complaints</p>
          </div>

          <div className="h-64 w-full flex items-center justify-center">
            {priorityChartData.some((p) => p.count > 0) ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={priorityChartData}
                    dataKey="count"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={80}
                    paddingAngle={4}
                  >
                    {priorityChartData.map((entry) => (
                      <Cell key={`cell-${entry.name}`} fill={priorityColors[entry.name] || '#94a3b8'} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(val, name) => [`${val} tickets`, name]}
                    contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="text-xs text-slate-400">No priority data logged</div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100 text-xs">
            {Object.entries(stats.priorityCounts || {}).map(([p, count]) => (
              <div key={p} className="flex items-center justify-between p-2 rounded-xl bg-slate-50 border border-slate-100">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: priorityColors[p] }} />
                  <span className="font-medium text-slate-700">{p}</span>
                </div>
                <span className="font-bold text-slate-900">{count}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent Assigned Complaints Table */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
          <div>
            <h2 className="font-bold text-navy-900 text-base">Recent Assigned Complaints</h2>
            <p className="text-xs text-slate-500">Latest grievance submissions routed to your queue</p>
          </div>
          <Link
            to="/faculty/complaints"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-purple-600 hover:text-purple-700"
          >
            View All Assigned Complaints
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {stats.recentComplaints?.length === 0 ? (
          <div className="py-8 text-center text-sm text-slate-500">
            No complaints currently assigned to your queue.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-600">
              <thead className="bg-slate-50/80 text-xs uppercase font-semibold text-slate-500 border-b border-slate-100">
                <tr>
                  <th className="px-4 py-3">Reference No</th>
                  <th className="px-4 py-3">Title & Category</th>
                  <th className="px-4 py-3">Student</th>
                  <th className="px-4 py-3">Priority</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Date</th>
                  <th className="px-4 py-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {stats.recentComplaints.map((item) => (
                  <tr key={item.complaint_id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="px-4 py-3 font-mono font-semibold text-xs text-purple-700 whitespace-nowrap">
                      {item.reference_number}
                    </td>
                    <td className="px-4 py-3 max-w-xs">
                      <div className="font-semibold text-slate-900 line-clamp-1">{item.title}</div>
                      <div className="flex items-center gap-1.5 text-xs text-slate-500 mt-0.5">
                        <span>{item.category_name}</span>
                        {item.is_overdue && (
                          <span className="text-[10px] font-bold text-rose-600 bg-rose-50 px-1.5 py-0.5 rounded border border-rose-200">
                            Overdue
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-xs whitespace-nowrap">
                      <div className="font-medium text-slate-800">{item.author_name}</div>
                      <div className="text-[11px] text-slate-400">{item.author_email}</div>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <PriorityBadge priority={item.priority} />
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <StatusBadge status={item.status} />
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-500 whitespace-nowrap">
                      {formatDate(item.created_at)}
                    </td>
                    <td className="px-4 py-3 text-right whitespace-nowrap">
                      <Link
                        to={`/faculty/complaints/${item.complaint_id}`}
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-purple-50 hover:bg-purple-100 text-purple-700 font-semibold text-xs transition-colors"
                      >
                        Review
                        <ArrowRight className="w-3.5 h-3.5" />
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
