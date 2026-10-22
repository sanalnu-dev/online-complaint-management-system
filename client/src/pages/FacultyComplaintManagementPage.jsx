import React, { useState, useEffect, useCallback } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { facultyService } from '../services/facultyService';
import { complaintService } from '../services/complaintService';
import { useToast } from '../hooks/useToast';
import StatusBadge from '../components/StatusBadge';
import PriorityBadge from '../components/PriorityBadge';
import LoadingSpinner from '../components/LoadingSpinner';
import EmptyState from '../components/EmptyState';
import { formatDate } from '../utils/formatters';
import {
  Search,
  Filter,
  RotateCcw,
  ArrowRight,
  Clock,
  CheckCircle2,
  AlertTriangle,
  ClipboardList,
  ChevronLeft,
  ChevronRight,
  GraduationCap
} from 'lucide-react';

export default function FacultyComplaintManagementPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const { error: toastError } = useToast();

  const [complaints, setComplaints] = useState([]);
  const [categories, setCategories] = useState([]);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 1
  });
  const [loading, setLoading] = useState(true);

  // Filter States
  const [filters, setFilters] = useState({
    search: searchParams.get('search') || '',
    category_id: searchParams.get('category_id') || '',
    status: searchParams.get('status') || '',
    priority: searchParams.get('priority') || '',
    overdue: searchParams.get('overdue') || '',
    sortBy: searchParams.get('sortBy') || 'created_at',
    sortOrder: searchParams.get('sortOrder') || 'DESC',
    page: parseInt(searchParams.get('page'), 10) || 1
  });

  // Active quick tab
  const [activeTab, setActiveTab] = useState(() => {
    if (searchParams.get('overdue') === 'true') return 'overdue';
    if (searchParams.get('status') === 'Pending') return 'pending';
    if (searchParams.get('status') === 'In Progress') return 'inprogress';
    if (searchParams.get('status') === 'Resolved') return 'resolved';
    return 'all';
  });

  // Load categories for filter dropdown
  useEffect(() => {
    async function loadCategories() {
      try {
        const res = await complaintService.getCategories();
        if (res.success) {
          setCategories(res.categories);
        }
      } catch (err) {
        // non-blocking
      }
    }
    loadCategories();
  }, []);

  const fetchComplaints = useCallback(async () => {
    try {
      setLoading(true);
      const params = {
        page: filters.page,
        limit: 10,
        sortBy: filters.sortBy,
        sortOrder: filters.sortOrder
      };

      if (filters.search) params.search = filters.search;
      if (filters.category_id) params.category_id = filters.category_id;
      if (filters.status) params.status = filters.status;
      if (filters.priority) params.priority = filters.priority;
      if (filters.overdue) params.overdue = filters.overdue;

      const res = await facultyService.getAssignedComplaints(params);
      if (res.success) {
        setComplaints(res.complaints);
        setPagination(res.pagination);
      }
    } catch (err) {
      toastError(err.response?.data?.message || 'Failed to fetch assigned complaints');
    } finally {
      setLoading(false);
    }
  }, [filters, toastError]);

  useEffect(() => {
    fetchComplaints();
  }, [fetchComplaints]);

  // Sync state to URL search params
  const updateUrlParams = (newFilters) => {
    const params = new URLSearchParams();
    Object.entries(newFilters).forEach(([key, val]) => {
      if (val) params.set(key, val);
    });
    setSearchParams(params);
  };

  const handleFilterChange = (key, value) => {
    setFilters((prev) => {
      const updated = { ...prev, [key]: value, page: 1 };
      updateUrlParams(updated);
      return updated;
    });
  };

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    setFilters((prev) => {
      const updated = { ...prev, page: 1 };
      if (tab === 'all') {
        updated.status = '';
        updated.overdue = '';
      } else if (tab === 'pending') {
        updated.status = 'Pending';
        updated.overdue = '';
      } else if (tab === 'inprogress') {
        updated.status = 'In Progress';
        updated.overdue = '';
      } else if (tab === 'resolved') {
        updated.status = 'Resolved';
        updated.overdue = '';
      } else if (tab === 'overdue') {
        updated.status = '';
        updated.overdue = 'true';
      }
      updateUrlParams(updated);
      return updated;
    });
  };

  const resetFilters = () => {
    const cleared = {
      search: '',
      category_id: '',
      status: '',
      priority: '',
      overdue: '',
      sortBy: 'created_at',
      sortOrder: 'DESC',
      page: 1
    };
    setActiveTab('all');
    setFilters(cleared);
    setSearchParams(new URLSearchParams());
  };

  const handlePageChange = (newPage) => {
    setFilters((prev) => {
      const updated = { ...prev, page: newPage };
      updateUrlParams(updated);
      return updated;
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-purple-700 bg-purple-50 px-2.5 py-1 rounded-lg border border-purple-200 mb-2">
            <GraduationCap className="w-3.5 h-3.5" />
            Faculty Workspace
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-navy-900 tracking-tight">
            Assigned Complaints Queue
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Review grievances submitted by students and transition them through resolution workflow
          </p>
        </div>

        <button
          type="button"
          onClick={fetchComplaints}
          className="self-start sm:self-auto px-4 py-2 rounded-xl bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold transition-colors flex items-center gap-2 shadow-sm"
        >
          <RotateCcw className="w-3.5 h-3.5 text-slate-400" />
          Refresh Queue
        </button>
      </div>

      {/* Quick Navigation Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 border-b border-slate-200 text-sm font-semibold">
        {[
          { id: 'all', label: 'All Assigned', icon: ClipboardList },
          { id: 'pending', label: 'Pending Action', icon: Clock },
          { id: 'inprogress', label: 'Under Review / In Progress', icon: Clock },
          { id: 'overdue', label: 'Overdue (>7 Days)', icon: AlertTriangle, badgeColor: 'bg-rose-500 text-white' },
          { id: 'resolved', label: 'Resolved', icon: CheckCircle2 }
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => handleTabChange(tab.id)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-t-xl transition-all whitespace-nowrap border-b-2 -mb-[2px] ${
                isActive
                  ? 'border-purple-600 text-purple-700 bg-purple-50/50'
                  : 'border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-50'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Search and Filters Bar */}
      <div className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-sm space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Keyword Search */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={filters.search}
              onChange={(e) => handleFilterChange('search', e.target.value)}
              placeholder="Search reference, title, student..."
              className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>

          {/* Category Filter */}
          <div>
            <select
              value={filters.category_id}
              onChange={(e) => handleFilterChange('category_id', e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-purple-500 cursor-pointer"
            >
              <option value="">All Categories</option>
              {categories.map((cat) => (
                <option key={cat.category_id} value={cat.category_id}>
                  {cat.category_name}
                </option>
              ))}
            </select>
          </div>

          {/* Priority Filter */}
          <div>
            <select
              value={filters.priority}
              onChange={(e) => handleFilterChange('priority', e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-purple-500 cursor-pointer"
            >
              <option value="">All Priorities</option>
              <option value="Urgent">Urgent</option>
              <option value="High">High</option>
              <option value="Medium">Medium</option>
              <option value="Low">Low</option>
            </select>
          </div>

          {/* Status Filter */}
          <div>
            <select
              value={filters.status}
              onChange={(e) => handleFilterChange('status', e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-purple-500 cursor-pointer"
            >
              <option value="">All Statuses</option>
              <option value="Pending">Pending / Assigned</option>
              <option value="Under Review">Under Review</option>
              <option value="In Progress">In Progress</option>
              <option value="Resolved">Resolved</option>
              <option value="Rejected">Rejected</option>
              <option value="Reopened">Reopened</option>
            </select>
          </div>
        </div>

        {/* Sorting Controls */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-100 text-xs">
          <div className="flex items-center gap-2">
            <span className="text-slate-500 font-medium">Sort by:</span>
            <select
              value={filters.sortBy}
              onChange={(e) => handleFilterChange('sortBy', e.target.value)}
              className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1 text-slate-700"
            >
              <option value="created_at">Submission Date</option>
              <option value="priority">Priority</option>
              <option value="status">Status</option>
              <option value="title">Title</option>
            </select>

            <select
              value={filters.sortOrder}
              onChange={(e) => handleFilterChange('sortOrder', e.target.value)}
              className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1 text-slate-700"
            >
              <option value="DESC">Descending</option>
              <option value="ASC">Ascending</option>
            </select>
          </div>

          {(filters.search || filters.category_id || filters.status || filters.priority || filters.overdue) && (
            <button
              type="button"
              onClick={resetFilters}
              className="text-purple-600 hover:text-purple-800 font-semibold flex items-center gap-1"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Reset Filters
            </button>
          )}
        </div>
      </div>

      {/* Complaints Table Container */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm overflow-hidden">
        {loading ? (
          <LoadingSpinner message="Loading assigned complaints..." />
        ) : complaints.length === 0 ? (
          <div className="p-8">
            <EmptyState
              title="No complaints in this queue"
              description="No grievances match the selected criteria or there are no pending assignments."
              actionText="Reset All Filters"
              onAction={resetFilters}
            />
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-slate-600">
                <thead className="bg-slate-50/80 text-xs uppercase font-semibold text-slate-500 border-b border-slate-100">
                  <tr>
                    <th className="px-5 py-4">Reference No</th>
                    <th className="px-5 py-4">Title & Category</th>
                    <th className="px-5 py-4">Student</th>
                    <th className="px-5 py-4">Location</th>
                    <th className="px-5 py-4">Priority</th>
                    <th className="px-5 py-4">Status</th>
                    <th className="px-5 py-4">Submitted</th>
                    <th className="px-5 py-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {complaints.map((item) => (
                    <tr
                      key={item.complaint_id}
                      className="hover:bg-slate-50/70 transition-colors"
                    >
                      <td className="px-5 py-4 font-mono font-semibold text-xs text-purple-700 whitespace-nowrap">
                        {item.reference_number}
                      </td>
                      <td className="px-5 py-4 max-w-xs">
                        <div className="font-semibold text-slate-900 line-clamp-1">
                          {item.title}
                        </div>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <span className="text-xs text-slate-500">{item.category_name}</span>
                          {item.is_overdue && (
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-rose-700 bg-rose-50 px-1.5 py-0.5 rounded border border-rose-200">
                              <AlertTriangle className="w-3 h-3 text-rose-500" />
                              Overdue
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-5 py-4 text-xs whitespace-nowrap">
                        <div className="font-medium text-slate-800">{item.author_name}</div>
                        <div className="text-[11px] text-slate-400">{item.author_id_code || item.author_email}</div>
                      </td>
                      <td className="px-5 py-4 text-xs text-slate-600 whitespace-nowrap">
                        {item.location_department}
                      </td>
                      <td className="px-5 py-4 whitespace-nowrap">
                        <PriorityBadge priority={item.priority} />
                      </td>
                      <td className="px-5 py-4 whitespace-nowrap">
                        <StatusBadge status={item.status} />
                      </td>
                      <td className="px-5 py-4 text-xs text-slate-500 whitespace-nowrap">
                        {formatDate(item.created_at)}
                      </td>
                      <td className="px-5 py-4 text-right whitespace-nowrap">
                        <Link
                          to={`/faculty/complaints/${item.complaint_id}`}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-purple-50 hover:bg-purple-100 text-purple-700 text-xs font-semibold transition-colors"
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

            {/* Pagination Controls */}
            {pagination.totalPages > 1 && (
              <div className="px-6 py-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                <span>
                  Showing page <strong className="text-slate-800">{pagination.page}</strong> of{' '}
                  <strong className="text-slate-800">{pagination.totalPages}</strong> ({pagination.total} tickets)
                </span>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    disabled={pagination.page <= 1}
                    onClick={() => handlePageChange(pagination.page - 1)}
                    className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    disabled={pagination.page >= pagination.totalPages}
                    onClick={() => handlePageChange(pagination.page + 1)}
                    className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
