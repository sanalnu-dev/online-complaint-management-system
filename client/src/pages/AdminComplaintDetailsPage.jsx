import React, { useState, useEffect, useCallback } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { complaintService } from '../services/complaintService';
import { adminService } from '../services/adminService';
import { useAuth } from '../hooks/useAuth';
import { useToast } from '../hooks/useToast';
import StatusBadge from '../components/StatusBadge';
import PriorityBadge from '../components/PriorityBadge';
import LoadingSpinner from '../components/LoadingSpinner';
import Modal from '../components/Modal';
import { formatDate } from '../utils/formatters';
import {
  ArrowLeft,
  Copy,
  Check,
  User,
  MapPin,
  Calendar,
  ShieldAlert,
  ShieldCheck,
  Clock,
  MessageSquare,
  Send,
  Download,
  AlertTriangle,
  Lock,
  Layers,
  ChevronRight
} from 'lucide-react';

const ALLOWED_ADMIN_NEXT_STATUSES = {
  Submitted: ['Under Review', 'Rejected'],
  'Under Review': ['In Progress', 'Rejected'],
  'In Progress': ['Resolved', 'Rejected'],
  Resolved: [],
  Rejected: [],
  Reopened: ['Under Review', 'In Progress']
};

export default function AdminComplaintDetailsPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { success, error: toastError } = useToast();

  const [complaint, setComplaint] = useState(null);
  const [history, setHistory] = useState([]);
  const [comments, setComments] = useState([]);
  const [admins, setAdmins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  // Status update modal
  const [statusModalOpen, setStatusModalOpen] = useState(false);
  const [targetStatus, setTargetStatus] = useState('');
  const [statusRemarks, setStatusRemarks] = useState('');
  const [updatingStatus, setUpdatingStatus] = useState(false);

  // Priority update
  const [priorityValue, setPriorityValue] = useState('');
  const [updatingPriority, setUpdatingPriority] = useState(false);

  // Assignee update
  const [assigneeId, setAssigneeId] = useState('');
  const [updatingAssignee, setUpdatingAssignee] = useState(false);

  // Comment input
  const [commentText, setCommentText] = useState('');
  const [isInternalComment, setIsInternalComment] = useState(false);
  const [submittingComment, setSubmittingComment] = useState(false);

  const fetchDetails = useCallback(async () => {
    try {
      setLoading(true);
      const [compRes, adminRes] = await Promise.all([
        complaintService.getComplaintById(id),
        adminService.getAdmins()
      ]);

      if (compRes.success) {
        setComplaint(compRes.complaint);
        setHistory(compRes.history || []);
        setComments(compRes.comments || []);
        setPriorityValue(compRes.complaint.priority);
        setAssigneeId(compRes.complaint.assigned_admin_id || '');
      }
      if (adminRes.success) {
        setAdmins(adminRes.admins || []);
      }
    } catch (err) {
      toastError(err.response?.data?.message || 'Failed to load complaint');
      if (err.response?.status === 404) navigate('/404');
    } finally {
      setLoading(false);
    }
  }, [id, navigate, toastError]);

  useEffect(() => {
    fetchDetails();
  }, [fetchDetails]);

  const copyRefNumber = () => {
    if (complaint?.reference_number) {
      navigator.clipboard.writeText(complaint.reference_number);
      setCopied(true);
      success('Reference number copied to clipboard');
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const openStatusModal = (status) => {
    setTargetStatus(status);
    setStatusRemarks('');
    setStatusModalOpen(true);
  };

  const handleStatusSubmit = async (e) => {
    e.preventDefault();

    if (
      (targetStatus === 'Resolved' || targetStatus === 'Rejected') &&
      (!statusRemarks.trim() || statusRemarks.trim().length < 5)
    ) {
      toastError(`Remarks are required when marking a complaint as ${targetStatus} (minimum 5 characters).`);
      return;
    }

    setUpdatingStatus(true);
    try {
      const res = await adminService.updateStatus(id, targetStatus, statusRemarks.trim());
      if (res.success) {
        success(`Status successfully changed to ${targetStatus}`);
        setStatusModalOpen(false);
        fetchDetails();
      }
    } catch (err) {
      toastError(err.response?.data?.message || 'Failed to update status');
    } finally {
      setUpdatingStatus(false);
    }
  };

  const handlePriorityChange = async (newPriority) => {
    if (newPriority === complaint.priority) return;

    setUpdatingPriority(true);
    try {
      const res = await adminService.updatePriority(id, newPriority);
      if (res.success) {
        setPriorityValue(newPriority);
        setComplaint((prev) => ({ ...prev, priority: newPriority }));
        success(`Priority updated to ${newPriority}`);
        fetchDetails();
      }
    } catch (err) {
      toastError(err.response?.data?.message || 'Failed to update priority');
    } finally {
      setUpdatingPriority(false);
    }
  };

  const handleAssigneeChange = async (newAdminId) => {
    setUpdatingAssignee(true);
    try {
      const res = await adminService.assignComplaint(id, newAdminId || null);
      if (res.success) {
        setAssigneeId(newAdminId);
        setComplaint((prev) => ({
          ...prev,
          assigned_admin_id: newAdminId || null,
          assigned_admin_name: res.assignedAdminName
        }));
        success(res.message);
        fetchDetails();
      }
    } catch (err) {
      toastError(err.response?.data?.message || 'Failed to update assignment');
    } finally {
      setUpdatingAssignee(false);
    }
  };

  const handleAddComment = async (e) => {
    e.preventDefault();
    if (!commentText.trim()) return;

    setSubmittingComment(true);
    try {
      const res = await complaintService.addComment(id, commentText.trim(), isInternalComment);
      if (res.success) {
        setComments((prev) => [...prev, res.comment]);
        setCommentText('');
        setIsInternalComment(false);
        success(isInternalComment ? 'Internal note saved' : 'Public response sent to student');
      }
    } catch (err) {
      toastError(err.response?.data?.message || 'Failed to add comment');
    } finally {
      setSubmittingComment(false);
    }
  };

  if (loading) {
    return <LoadingSpinner fullPage message="Loading ticket details..." />;
  }

  if (!complaint) return null;

  const allowedNext = ALLOWED_ADMIN_NEXT_STATUSES[complaint.status] || [];

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Top back navigation */}
      <div className="flex items-center justify-between">
        <Link
          to="/admin/complaints"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Complaint Queue
        </Link>
        <span className="text-xs text-slate-400 font-mono">
          Complaint #{complaint.complaint_id}
        </span>
      </div>

      {/* Main Admin Overview Card */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 border-b border-slate-100 pb-6">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-mono text-sm font-bold text-primary-700 bg-primary-50 px-2.5 py-1 rounded-lg border border-primary-200 flex items-center gap-1.5">
                {complaint.reference_number}
                <button
                  type="button"
                  onClick={copyRefNumber}
                  className="hover:text-primary-900 transition-colors p-0.5"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </span>
              <span className="text-xs px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700 font-semibold">
                {complaint.category_name}
              </span>
            </div>

            <h1 className="text-xl sm:text-2xl font-bold text-navy-900 tracking-tight">
              {complaint.title}
            </h1>
          </div>

          <div className="flex items-center gap-2 self-start">
            <PriorityBadge priority={complaint.priority} />
            <StatusBadge status={complaint.status} />
          </div>
        </div>

        {/* Administrative Action Control Strip */}
        <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
          {/* Status Workflow Action */}
          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
              Available Status Transitions
            </label>
            {allowedNext.length === 0 ? (
              <p className="text-xs text-slate-500 italic mt-1">
                {complaint.status === 'Resolved' || complaint.status === 'Rejected'
                  ? 'Ticket closed. Awaiting student reopen if issue persists.'
                  : 'No valid next transitions available.'}
              </p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {allowedNext.map((st) => (
                  <button
                    key={st}
                    type="button"
                    onClick={() => openStatusModal(st)}
                    className="px-3 py-1.5 rounded-lg bg-navy-900 hover:bg-navy-800 text-white font-semibold text-xs transition-colors shadow-xs"
                  >
                    Move to {st}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Priority Modifier */}
          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
              Modify Priority
            </label>
            <select
              value={priorityValue}
              disabled={updatingPriority}
              onChange={(e) => handlePriorityChange(e.target.value)}
              className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-semibold text-slate-700 cursor-pointer"
            >
              <option value="Low">Low</option>
              <option value="Medium">Medium</option>
              <option value="High">High</option>
              <option value="Urgent">Urgent</option>
            </select>
          </div>

          {/* Assignee Modifier */}
          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
              Assigned Administrator
            </label>
            <select
              value={assigneeId}
              disabled={updatingAssignee}
              onChange={(e) => handleAssigneeChange(e.target.value)}
              className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-semibold text-slate-700 cursor-pointer"
            >
              <option value="">Unassigned</option>
              {admins.map((adm) => (
                <option key={adm.user_id} value={adm.user_id}>
                  {adm.full_name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Metadata Details */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/60">
            <span className="text-slate-400 font-semibold uppercase text-[10px] block">Submitted By</span>
            <span className="font-semibold text-slate-900 mt-1 block">{complaint.author_name}</span>
            <span className="text-slate-500 text-[11px] block">{complaint.author_email}</span>
            <span className="text-slate-400 text-[10px] block font-mono mt-0.5">
              ID: {complaint.author_id_code || 'N/A'}
            </span>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/60">
            <span className="text-slate-400 font-semibold uppercase text-[10px] block">Location / Department</span>
            <span className="font-semibold text-slate-900 mt-1 block">{complaint.location_department}</span>
            <span className="text-slate-400 text-[11px] block mt-1">Logged on {formatDate(complaint.created_at)}</span>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/60">
            <span className="text-slate-400 font-semibold uppercase text-[10px] block">Current Assignee</span>
            <span className="font-semibold text-slate-900 mt-1 block">
              {complaint.assigned_admin_name || 'Unassigned'}
            </span>
            <span className="text-slate-400 text-[11px] block mt-1">
              Last updated: {formatDate(complaint.updated_at)}
            </span>
          </div>
        </div>

        {/* Description */}
        <div className="space-y-2">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
            Issue Description
          </h3>
          <div className="p-5 rounded-2xl bg-slate-50/70 border border-slate-200/70 text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">
            {complaint.description}
          </div>
        </div>

        {/* Supporting Attachment */}
        {complaint.attachment_path && (
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Download className="w-5 h-5 text-primary-600" />
              <div>
                <span className="text-xs font-semibold text-slate-800 block">
                  {complaint.attachment_path.split('/').pop()}
                </span>
                <span className="text-[11px] text-slate-400">User uploaded file</span>
              </div>
            </div>
            <a
              href={complaint.attachment_path}
              target="_blank"
              rel="noreferrer"
              className="px-3 py-1.5 rounded-xl bg-white border border-slate-200 text-xs font-semibold text-primary-700 hover:bg-slate-50 shadow-xs"
            >
              View Document
            </a>
          </div>
        )}

        {/* Resolution Remarks if already recorded */}
        {complaint.resolution_remarks && (
          <div
            className={`p-5 rounded-2xl border ${
              complaint.status === 'Resolved'
                ? 'bg-emerald-50/80 border-emerald-200 text-emerald-900'
                : 'bg-rose-50/80 border-rose-200 text-rose-900'
            }`}
          >
            <div className="flex items-center gap-2 mb-1.5 font-bold text-sm">
              <ShieldCheck className="w-4 h-4" />
              Current Resolution Remarks
            </div>
            <p className="text-xs sm:text-sm leading-relaxed whitespace-pre-wrap">
              {complaint.resolution_remarks}
            </p>
          </div>
        )}
      </div>

      {/* Two Column Section: Status History on Left, Discussion & Internal Notes on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Audit Timeline */}
        <div className="lg:col-span-6 bg-white rounded-3xl p-6 sm:p-7 border border-slate-200/80 shadow-sm space-y-5">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
            <Clock className="w-4 h-4 text-primary-600" />
            <h2 className="font-bold text-navy-900 text-base">Status Audit Trail</h2>
          </div>

          <div className="relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
            {history.map((step, idx) => (
              <div key={step.history_id || idx} className="relative">
                <div className="absolute -left-6 top-1 w-3.5 h-3.5 rounded-full bg-white border-2 border-primary-600 ring-4 ring-primary-50"></div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-900">
                      {step.new_status}
                    </span>
                    {step.old_status && (
                      <span className="text-[10px] text-slate-400">
                        (from {step.old_status})
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    {formatDate(step.created_at)} • by {step.changed_by_name} ({step.changed_by_role})
                  </p>
                  {step.remarks && (
                    <div className="mt-2 p-2.5 rounded-xl bg-slate-50 border border-slate-100 text-xs text-slate-600">
                      {step.remarks}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Responses & Internal Admin Notes */}
        <div className="lg:col-span-6 bg-white rounded-3xl p-6 sm:p-7 border border-slate-200/80 shadow-sm space-y-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
              <div className="flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-primary-600" />
                <h2 className="font-bold text-navy-900 text-base">Communication Center</h2>
              </div>
              <span className="text-[10px] font-semibold text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full flex items-center gap-1">
                <Lock className="w-3 h-3" />
                Internal notes enabled
              </span>
            </div>

            <div className="space-y-3 max-h-[350px] overflow-y-auto pr-1">
              {comments.length === 0 ? (
                <p className="text-xs text-slate-400 italic text-center py-8">
                  No comments or internal notes recorded yet.
                </p>
              ) : (
                comments.map((c) => (
                  <div
                    key={c.comment_id}
                    className={`p-3.5 rounded-2xl text-xs leading-relaxed border ${
                      c.is_internal
                        ? 'bg-amber-50/90 border-amber-300 text-amber-950'
                        : c.author_role === 'ADMIN'
                        ? 'bg-blue-50/80 border-blue-200 text-slate-800'
                        : 'bg-slate-50 border-slate-200 text-slate-800'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="font-bold text-slate-900 flex items-center gap-1.5">
                        {c.author_name}
                        {c.is_internal && (
                          <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-amber-700 text-white flex items-center gap-1">
                            <Lock className="w-2.5 h-2.5" />
                            INTERNAL NOTE
                          </span>
                        )}
                        {!c.is_internal && c.author_role === 'ADMIN' && (
                          <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-navy-900 text-white">
                            STAFF
                          </span>
                        )}
                      </span>
                      <span className="text-[10px] text-slate-400">
                        {formatDate(c.created_at)}
                      </span>
                    </div>
                    <p className="whitespace-pre-wrap">{c.message}</p>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleAddComment} className="pt-3 border-t border-slate-100 space-y-2">
            <textarea
              rows={2}
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              placeholder="Write a message or internal note..."
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary-500 transition-all resize-none"
            />
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-1.5 text-xs text-amber-800 font-semibold cursor-pointer">
                <input
                  type="checkbox"
                  checked={isInternalComment}
                  onChange={(e) => setIsInternalComment(e.target.checked)}
                  className="rounded text-amber-600 focus:ring-amber-500"
                />
                Internal Note (Invisible to student)
              </label>

              <button
                type="submit"
                disabled={submittingComment || !commentText.trim()}
                className="px-4 py-2 rounded-xl bg-navy-900 hover:bg-navy-800 text-white text-xs font-semibold transition-colors disabled:opacity-50 flex items-center gap-1.5 shadow-xs"
              >
                <Send className="w-3 h-3" />
                Post Update
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Status Transition Modal */}
      {statusModalOpen && (
        <Modal
          isOpen={statusModalOpen}
          onClose={() => setStatusModalOpen(false)}
          title={`Update Status to: ${targetStatus}`}
          maxWidth="max-w-md"
        >
          <form onSubmit={handleStatusSubmit} className="space-y-4">
            <div className="p-3.5 rounded-xl bg-blue-50 border border-blue-200 text-blue-900 text-xs leading-relaxed">
              Transitioning ticket status from <span className="font-bold">{complaint.status}</span> to{' '}
              <span className="font-bold">{targetStatus}</span>. This change will be permanently logged in the audit trail.
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                {(targetStatus === 'Resolved' || targetStatus === 'Rejected') ? (
                  <>
                    Resolution Remarks <span className="text-rose-500">* (Mandatory)</span>
                  </>
                ) : (
                  'Administrative Remarks (Optional)'
                )}
              </label>
              <textarea
                rows={3}
                required={targetStatus === 'Resolved' || targetStatus === 'Rejected'}
                value={statusRemarks}
                onChange={(e) => setStatusRemarks(e.target.value)}
                placeholder={
                  targetStatus === 'Resolved'
                    ? 'State actions taken, parts replaced, or outcome verified...'
                    : targetStatus === 'Rejected'
                    ? 'State official policy reason or why this cannot be actioned...'
                    : 'Provide internal or progress notes...'
                }
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setStatusModalOpen(false)}
                className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={
                  updatingStatus ||
                  ((targetStatus === 'Resolved' || targetStatus === 'Rejected') &&
                    statusRemarks.trim().length < 5)
                }
                className="px-4 py-2 rounded-xl bg-navy-900 hover:bg-navy-800 text-white text-xs font-semibold shadow-sm transition-colors flex items-center gap-1.5 disabled:opacity-50"
              >
                {updatingStatus ? (
                  <span className="inline-block w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                ) : null}
                Confirm Transition
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
