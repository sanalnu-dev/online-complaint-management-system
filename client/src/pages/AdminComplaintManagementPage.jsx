import React, { useState, useEffect, useCallback } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { adminService } from '../services/adminService';
import { complaintService } from '../services/complaintService';
import { useToast } from '../hooks/useToast';
import StatusBadge from '../components/StatusBadge';
import PriorityBadge from '../components/PriorityBadge';
import LoadingSpinner from '../components/LoadingSpinner';
import EmptyState from '../components/EmptyState';
import { formatDate } from '../utils/formatters';
import {
  Search,
  Download,
  Filter,
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  RotateCcw,
  UserCheck
} from 'lucide-react';

export default function AdminComplaintManagementPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const { success, error: toastError } = useToast();

  const [complaints, setComplaints] = useState([]);
  const [categories, setCategories] = useState([]);
  const [admins, setAdmins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [pagination, setPagination] = useState({ page: 1, limit: 15, total: 0, totalPages: 1 });

  const [filters, setFilters] = useState({
    search: searchParams.get('search') || '',
    category_id: searchParams.get('category_id') || '',
    status: searchParams.get('status') || '',
    priority: searchParams.get('priority') || '',
    assigned_admin_id: searchParams.get('assigned_admin_id') || '',
    sortBy: searchParams.get('sortBy') || 'created_at',
    sortOrder: searchParams.get('sortOrder') || 'DESC',
    page: parseInt(searchParams.get('page'), 10) || 1
  });

  // Load dropdown resources
  useEffect(() => {
    async function loadMeta() {
      try {
        const [catRes, adminRes] = await Promise.all([
          complaintService.getCategories(),
          adminService.getAdmins()
        ]);
        if (catRes.success) setCategories(catRes.categories || []);
        if (adminRes.success) setAdmins(adminRes.admins || []);
      } catch (err) {
        console.error('Failed to load filter metadata', err);
      }
    }
    loadMeta();
  }, []);

  const fetchComplaints = useCallback(async () => {
    try {
      setLoading(true);
      const params = {
        page: filters.page,
        limit: 15,
        sortBy: filters.sortBy,
        sortOrder: filters.sortOrder
      };
      if (filters.search) params.search = filters.search;
      if (filters.category_id) params.category_id = filters.category_id;
      if (filters.status) params.status = filters.status;
      if (filters.priority) params.priority = filters.priority;
      if (filters.assigned_admin_id) params.assigned_admin_id = filters.assigned_admin_id;

      const data = await adminService.getAllComplaints(params);
      if (data.success) {
        setComplaints(data.complaints || []);
        setPagination(data.pagination);
      }
    } catch (err) {
      toastError('Failed to fetch complaint records');
    } finally {
      setLoading(false);
    }
  }, [filters, toastError]);

  useEffect(() => {
    fetchComplaints();
  }, [fetchComplaints]);

  const handleFilterChange = (key, value) => {
    setFilters((prev) => ({
      ...prev,
      [key]: value,
      page: 1
    }));
  };

  const resetFilters = () => {
    setFilters({
      search: '',
      category_id: '',
      status: '',
      priority: '',
      assigned_admin_id: '',
      sortBy: 'created_at',
      sortOrder: 'DESC',
      page: 1
    });
  };

  const handleExportCsv = async () => {
    try {
      setExporting(true);
      const params = {};
      if (filters.search) params.search = filters.search;
      if (filters.category_id) params.category_id = filters.category_id;
      if (filters.status) params.status = filters.status;
      if (filters.priority) params.priority = filters.priority;

      const blob = await adminService.exportComplaintsCsv(params);
      const url = window.URL.createObjectURL(new Blob([blob], { type: 'text/csv' }));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute(
        'download',
        `OCMS_Complaints_Report_${new Date().toISOString().slice(0, 10)}.csv`
      );
      document.body.appendChild(link);
      link.click();
      link.remove();
      success('Complaint records exported to CSV successfully');
    } catch (err) {
      toastError('Failed to export CSV report');
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Title & Export Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-navy-900 tracking-tight">
            Complaint Queue
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Search, filter, assign, and update all campus complaints submitted by students and staff
          </p>
        </div>

        <button
          type="button"
          onClick={handleExportCsv}
          disabled={exporting}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 font-semibold text-xs transition-colors shadow-sm self-start sm:self-auto"
        >
          {exporting ? (
            <span className="inline-block w-4 h-4 border-2 border-slate-600 border-t-transparent rounded-full animate-spin"></span>
          ) : (
            <Download className="w-4 h-4" />
          )}
          Export CSV Report
        </button>
      </div>

      {/* Filter Matrix */}
      <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/80 shadow-sm space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {/* Search */}
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
              <Search className="w-4 h-4" />
            </div>
            <input
              type="text"
              placeholder="Search ref #, title, user..."
              value={filters.search}
              onChange={(e) => handleFilterChange('search', e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>

          {/* Category */}
          <div>
            <select
              value={filters.category_id}
              onChange={(e) => handleFilterChange('category_id', e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary-500 cursor-pointer"
            >
              <option value="">All Categories</option>
              {categories.map((c) => (
                <option key={c.category_id} value={c.category_id}>
                  {c.category_name}
                </option>
              ))}
            </select>
          </div>

          {/* Status */}
          <div>
            <select
              value={filters.status}
              onChange={(e) => handleFilterChange('status', e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary-500 cursor-pointer"
            >
              <option value="">All Statuses</option>
              <option value="Submitted">Submitted</option>
              <option value="Under Review">Under Review</option>
              <option value="In Progress">In Progress</option>
              <option value="Resolved">Resolved</option>
              <option value="Rejected">Rejected</option>
              <option value="Reopened">Reopened</option>
            </select>
          </div>

          {/* Priority */}
          <div>
            <select
              value={filters.priority}
              onChange={(e) => handleFilterChange('priority', e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary-500 cursor-pointer"
            >
              <option value="">All Priorities</option>
              <option value="Urgent">Urgent</option>
              <option value="High">High</option>
              <option value="Medium">Medium</option>
              <option value="Low">Low</option>
            </select>
          </div>

          {/* Assignee Filter */}
          <div>
            <select
              value={filters.assigned_admin_id}
              onChange={(e) => handleFilterChange('assigned_admin_id', e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary-500 cursor-pointer"
            >
              <option value="">All Assignees</option>
              <option value="unassigned">Unassigned Only</option>
              {admins.map((adm) => (
                <option key={adm.user_id} value={adm.user_id}>
                  {adm.full_name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Secondary controls */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-100 text-xs">
          <div className="flex items-center gap-2">
            <span className="text-slate-500 font-medium">Sort by:</span>
            <select
              value={filters.sortBy}
              onChange={(e) => handleFilterChange('sortBy', e.target.value)}
              className="bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 text-slate-700"
            >
              <option value="created_at">Date Created</option>
              <option value="priority">Priority</option>
              <option value="status">Status</option>
              <option value="reference_number">Reference Number</option>
            </select>

            <select
              value={filters.sortOrder}
              onChange={(e) => handleFilterChange('sortOrder', e.target.value)}
              className="bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 text-slate-700"
            >
              <option value="DESC">Descending</option>
              <option value="ASC">Ascending</option>
            </select>
          </div>

          {(filters.search ||
            filters.category_id ||
            filters.status ||
            filters.priority ||
            filters.assigned_admin_id) && (
            <button
              type="button"
              onClick={resetFilters}
              className="text-primary-600 hover:text-primary-800 font-semibold flex items-center gap-1"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Reset Filters
            </button>
          )}
        </div>
      </div>

      {/* Main Table */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm overflow-hidden">
        {loading ? (
          <LoadingSpinner message="Querying complaint database..." />
        ) : complaints.length === 0 ? (
          <div className="p-8">
            <EmptyState
              title="No complaints matching your criteria"
              description="Adjust your search query or reset the filter dropdowns to see results."
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
                    <th className="px-6 py-4">Reference No</th>
                    <th className="px-6 py-4">Title & Category</th>
                    <th className="px-6 py-4">Submitted By</th>
                    <th className="px-6 py-4">Priority</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4">Assignee</th>
                    <th className="px-6 py-4">Date</th>
                    <th className="px-6 py-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {complaints.map((item) => (
                    <tr
                      key={item.complaint_id}
                      className="hover:bg-slate-50/70 transition-colors"
                    >
                      <td className="px-6 py-4 font-mono font-semibold text-xs text-primary-700 whitespace-nowrap">
                        {item.reference_number}
                      </td>
                      <td className="px-6 py-4 max-w-xs">
                        <div className="font-semibold text-slate-900 line-clamp-1">
                          {item.title}
                        </div>
                        <div className="text-xs text-slate-500 mt-0.5">
                          {item.category_name}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="font-semibold text-xs text-slate-800">
                          {item.author_name}
                        </div>
                        <div className="text-[10px] text-slate-400 font-mono">
                          {item.author_id_code || item.author_email}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <PriorityBadge priority={item.priority} />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <StatusBadge status={item.status} />
                      </td>
                      <td className="px-6 py-4 text-xs whitespace-nowrap">
                        {item.assigned_admin_name ? (
                          <span className="inline-flex items-center gap-1 font-medium text-slate-700">
                            <UserCheck className="w-3.5 h-3.5 text-primary-600" />
                            {item.assigned_admin_name}
                          </span>
                        ) : (
                          <span className="text-slate-400 italic">Unassigned</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-xs text-slate-500 whitespace-nowrap">
                        {formatDate(item.created_at)}
                      </td>
                      <td className="px-6 py-4 text-right whitespace-nowrap">
                        <Link
                          to={`/admin/complaints/${item.complaint_id}`}
                          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-navy-900 hover:bg-navy-800 text-white text-xs font-semibold transition-colors shadow-xs"
                        >
                          Process
                          <ArrowRight className="w-3 h-3" />
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls */}
            <div className="p-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
              <div>
                Showing {(pagination.page - 1) * pagination.limit + 1} to{' '}
                {Math.min(pagination.page * pagination.limit, pagination.total)} of{' '}
                {pagination.total} records
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() =>
                    setFilters((prev) => ({ ...prev, page: Math.max(1, prev.page - 1) }))
                  }
                  disabled={pagination.page <= 1}
                  className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 disabled:opacity-40"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <span className="font-semibold text-slate-700">
                  Page {pagination.page} of {pagination.totalPages}
                </span>
                <button
                  type="button"
                  onClick={() =>
                    setFilters((prev) => ({
                      ...prev,
                      page: Math.min(pagination.totalPages, prev.page + 1)
                    }))
                  }
                  disabled={pagination.page >= pagination.totalPages}
                  className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 disabled:opacity-40"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
