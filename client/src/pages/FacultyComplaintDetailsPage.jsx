import React, { useState, useEffect, useCallback } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { facultyService } from '../services/facultyService';
import { useAuth } from '../hooks/useAuth';
import { useToast } from '../hooks/useToast';
import StatusBadge from '../components/StatusBadge';
import PriorityBadge from '../components/PriorityBadge';
import LoadingSpinner from '../components/LoadingSpinner';
import Modal from '../components/Modal';
import { formatDate } from '../utils/formatters';
import {
  ArrowLeft,
  Calendar,
  MapPin,
  User,
  Mail,
  GraduationCap,
  FileText,
  Download,
  Clock,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Copy,
  Check,
  Send,
  Lock,
  MessageSquare
} from 'lucide-react';

export default function FacultyComplaintDetailsPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { success, error: toastError } = useToast();

  const [complaint, setComplaint] = useState(null);
  const [history, setHistory] = useState([]);
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);

  // Status update modal state
  const [statusModalOpen, setStatusModalOpen] = useState(false);
  const [targetStatus, setTargetStatus] = useState('');
  const [statusRemarks, setStatusRemarks] = useState('');
  const [updatingStatus, setUpdatingStatus] = useState(false);

  // Comment state
  const [newComment, setNewComment] = useState('');
  const [isInternal, setIsInternal] = useState(false);
  const [submittingComment, setSubmittingComment] = useState(false);

  // Copy reference state
  const [copied, setCopied] = useState(false);

  const fetchDetails = useCallback(async () => {
    try {
      setLoading(true);
      const res = await facultyService.getComplaintById(id);
      if (res.success) {
        setComplaint(res.complaint);
        setHistory(res.history || []);
        setComments(res.comments || []);
      }
    } catch (err) {
      toastError(err.response?.data?.message || 'Failed to load complaint details');
      navigate('/faculty/complaints');
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

    if ((targetStatus === 'Resolved' || targetStatus === 'Rejected') && (!statusRemarks || statusRemarks.trim().length < 5)) {
      toastError(`Remarks of at least 5 characters are required when marking as ${targetStatus}.`);
      return;
    }

    setUpdatingStatus(true);
    try {
      const res = await facultyService.updateStatus(id, targetStatus, statusRemarks.trim());
      if (res.success) {
        success(`Complaint status transitioned to "${targetStatus}"`);
        setStatusModalOpen(false);
        fetchDetails();
      }
    } catch (err) {
      toastError(err.response?.data?.message || 'Failed to update complaint status');
    } finally {
      setUpdatingStatus(false);
    }
  };

  const handleCommentSubmit = async (e) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    setSubmittingComment(true);
    try {
      const res = await facultyService.addComment(id, newComment.trim(), isInternal);
      if (res.success) {
        success(isInternal ? 'Internal investigation note saved' : 'Comment posted to student');
        setNewComment('');
        setIsInternal(false);
        fetchDetails();
      }
    } catch (err) {
      toastError(err.response?.data?.message || 'Failed to add comment');
    } finally {
      setSubmittingComment(false);
    }
  };

  if (loading) {
    return <LoadingSpinner fullPage message="Loading assigned grievance..." />;
  }

  if (!complaint) {
    return null;
  }

  const isClosed = complaint.status === 'Resolved' || complaint.status === 'Rejected' || complaint.status === 'Closed';

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Back Link */}
      <div className="flex items-center justify-between">
        <Link
          to="/faculty/complaints"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Assigned Complaints
        </Link>

        {complaint.is_overdue && (
          <div className="inline-flex items-center gap-1.5 text-xs font-bold text-rose-700 bg-rose-50 px-3 py-1 rounded-xl border border-rose-200">
            <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
            Overdue (&gt;7 Days)
          </div>
        )}
      </div>

      {/* Main Header & Details Card */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 border-b border-slate-100 pb-6">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-mono text-sm font-bold text-purple-700 bg-purple-50 px-2.5 py-1 rounded-lg border border-purple-200 flex items-center gap-1.5">
                {complaint.reference_number}
                <button
                  type="button"
                  onClick={copyRefNumber}
                  title="Copy reference number"
                  className="hover:text-purple-900 transition-colors p-0.5"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </span>
              <span className="text-xs px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700 font-semibold">
                {complaint.category_name}
              </span>
              {complaint.category_department && (
                <span className="text-xs px-2.5 py-1 rounded-lg bg-slate-50 text-slate-500 border border-slate-200">
                  Dept: {complaint.category_department}
                </span>
              )}
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

        {/* Metadata Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/60 flex items-center gap-3">
            <User className="w-4 h-4 text-purple-600 flex-shrink-0" />
            <div>
              <p className="text-slate-400 uppercase tracking-wider font-semibold text-[10px]">Student / Submitter</p>
              <p className="font-semibold text-slate-800 mt-0.5 truncate">{complaint.author_name}</p>
              <p className="text-[11px] text-slate-500 truncate">{complaint.author_id_code || complaint.author_email}</p>
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/60 flex items-center gap-3">
            <MapPin className="w-4 h-4 text-slate-400 flex-shrink-0" />
            <div>
              <p className="text-slate-400 uppercase tracking-wider font-semibold text-[10px]">Location</p>
              <p className="font-semibold text-slate-800 mt-0.5 truncate">{complaint.location_department}</p>
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/60 flex items-center gap-3">
            <Calendar className="w-4 h-4 text-slate-400 flex-shrink-0" />
            <div>
              <p className="text-slate-400 uppercase tracking-wider font-semibold text-[10px]">Submission Date</p>
              <p className="font-semibold text-slate-800 mt-0.5">{formatDate(complaint.created_at)}</p>
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/60 flex items-center gap-3">
            <GraduationCap className="w-4 h-4 text-purple-600 flex-shrink-0" />
            <div>
              <p className="text-slate-400 uppercase tracking-wider font-semibold text-[10px]">Assigned Faculty</p>
              <p className="font-semibold text-slate-800 mt-0.5 truncate">{user?.fullName}</p>
            </div>
          </div>
        </div>

        {/* Complaint Description */}
        <div className="space-y-2">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
            Detailed Issue Description
          </h3>
          <div className="p-5 rounded-2xl bg-slate-50/70 border border-slate-200/70 text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">
            {complaint.description}
          </div>
        </div>

        {/* Attached Document */}
        {complaint.attachment_path && (
          <div className="space-y-2">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Student Supporting Evidence
            </h3>
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <FileText className="w-6 h-6 text-purple-600" />
                <div>
                  <span className="text-sm font-semibold text-slate-800 block">
                    {complaint.attachment_path.split('/').pop()}
                  </span>
                  <span className="text-xs text-slate-400">Supporting document attached</span>
                </div>
              </div>
              <a
                href={complaint.attachment_path}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white border border-slate-200 hover:bg-slate-50 text-xs font-semibold text-purple-700 transition-colors shadow-sm"
              >
                <Download className="w-3.5 h-3.5" />
                View Evidence
              </a>
            </div>
          </div>
        )}

        {/* Resolution Remarks Display */}
        {complaint.resolution_remarks && (
          <div
            className={`p-5 rounded-2xl border ${
              complaint.status === 'Resolved'
                ? 'bg-emerald-50/80 border-emerald-200 text-emerald-900'
                : 'bg-rose-50/80 border-rose-200 text-rose-900'
            }`}
          >
            <div className="flex items-center gap-2 mb-2 font-bold text-sm">
              <CheckCircle2 className="w-4 h-4" />
              Recorded Resolution Remarks
              {complaint.resolved_at && (
                <span className="text-xs font-normal opacity-80">
                  (Resolved on {formatDate(complaint.resolved_at)})
                </span>
              )}
            </div>
            <p className="text-xs sm:text-sm leading-relaxed whitespace-pre-wrap">
              {complaint.resolution_remarks}
            </p>
          </div>
        )}
      </div>

      {/* Faculty Workflow Action Bar */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="font-bold text-navy-900 text-base">Grievance Workflow Actions</h2>
            <p className="text-xs text-slate-500">
              Update grievance status as you investigate, interview parties, or resolve the issue
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Valid state transitions based on current status */}
            {(complaint.status === 'Submitted' || complaint.status === 'Pending' || complaint.status === 'Assigned') && (
              <>
                <button
                  type="button"
                  onClick={() => openStatusModal('Under Review')}
                  className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-semibold shadow-sm transition-colors flex items-center gap-1.5"
                >
                  <Clock className="w-3.5 h-3.5" />
                  Accept &amp; Review
                </button>
                <button
                  type="button"
                  onClick={() => openStatusModal('In Progress')}
                  className="px-4 py-2 rounded-xl bg-sky-600 hover:bg-sky-700 text-white text-xs font-semibold shadow-sm transition-colors flex items-center gap-1.5"
                >
                  <Clock className="w-3.5 h-3.5" />
                  Mark In Progress
                </button>
                <button
                  type="button"
                  onClick={() => openStatusModal('Rejected')}
                  className="px-4 py-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-semibold transition-colors flex items-center gap-1.5"
                >
                  <XCircle className="w-3.5 h-3.5" />
                  Reject Grievance
                </button>
              </>
            )}

            {complaint.status === 'Under Review' && (
              <>
                <button
                  type="button"
                  onClick={() => openStatusModal('In Progress')}
                  className="px-4 py-2 rounded-xl bg-sky-600 hover:bg-sky-700 text-white text-xs font-semibold shadow-sm transition-colors flex items-center gap-1.5"
                >
                  <Clock className="w-3.5 h-3.5" />
                  Investigate (In Progress)
                </button>
                <button
                  type="button"
                  onClick={() => openStatusModal('Resolved')}
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-sm transition-colors flex items-center gap-1.5"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Resolve Grievance
                </button>
                <button
                  type="button"
                  onClick={() => openStatusModal('Rejected')}
                  className="px-4 py-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-semibold transition-colors flex items-center gap-1.5"
                >
                  <XCircle className="w-3.5 h-3.5" />
                  Reject Grievance
                </button>
              </>
            )}

            {complaint.status === 'In Progress' && (
              <>
                <button
                  type="button"
                  onClick={() => openStatusModal('Resolved')}
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-sm transition-colors flex items-center gap-1.5"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Resolve Grievance
                </button>
                <button
                  type="button"
                  onClick={() => openStatusModal('Rejected')}
                  className="px-4 py-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-semibold transition-colors flex items-center gap-1.5"
                >
                  <XCircle className="w-3.5 h-3.5" />
                  Reject Grievance
                </button>
              </>
            )}

            {complaint.status === 'Reopened' && (
              <>
                <button
                  type="button"
                  onClick={() => openStatusModal('Under Review')}
                  className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-semibold shadow-sm transition-colors flex items-center gap-1.5"
                >
                  <Clock className="w-3.5 h-3.5" />
                  Review Reopened Case
                </button>
                <button
                  type="button"
                  onClick={() => openStatusModal('In Progress')}
                  className="px-4 py-2 rounded-xl bg-sky-600 hover:bg-sky-700 text-white text-xs font-semibold shadow-sm transition-colors flex items-center gap-1.5"
                >
                  <Clock className="w-3.5 h-3.5" />
                  Mark In Progress
                </button>
              </>
            )}

            {isClosed && (
              <span className="text-xs font-medium text-slate-500 bg-slate-100 px-3 py-1.5 rounded-xl">
                Complaint is currently {complaint.status.toLowerCase()}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Two Column Section: Timeline on Left, Comments on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Timeline */}
        <div className="lg:col-span-6 bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm space-y-5">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
            <Clock className="w-4 h-4 text-purple-600" />
            <h2 className="font-bold text-navy-900 text-base">Status Audit Timeline</h2>
          </div>

          <div className="relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
            {history.map((step, idx) => (
              <div key={step.history_id || idx} className="relative">
                <div className="absolute -left-6 top-1 w-3.5 h-3.5 rounded-full bg-white border-2 border-purple-600 ring-4 ring-purple-50"></div>
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-xs font-bold text-slate-900">{step.new_status}</span>
                    {step.old_status && (
                      <span className="text-[10px] text-slate-400">(from {step.old_status})</span>
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

        {/* Communication & Notes */}
        <div className="lg:col-span-6 bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm space-y-5">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-purple-600" />
              <h2 className="font-bold text-navy-900 text-base">Grievance Communications</h2>
            </div>
            <span className="text-xs text-slate-400">{comments.length} entries</span>
          </div>

          {/* Comments List */}
          <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
            {comments.length === 0 ? (
              <div className="p-4 text-center text-xs text-slate-400">
                No comments or investigation notes recorded yet.
              </div>
            ) : (
              comments.map((cm) => (
                <div
                  key={cm.comment_id}
                  className={`p-3.5 rounded-2xl border text-xs space-y-1.5 ${
                    cm.is_internal
                      ? 'bg-amber-50/80 border-amber-200 text-amber-950'
                      : 'bg-slate-50 border-slate-200/70 text-slate-800'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold flex items-center gap-1.5">
                      {cm.author_name}
                      <span className="font-normal opacity-70">({cm.author_role})</span>
                    </span>
                    {cm.is_internal && (
                      <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-amber-200/80 text-amber-900 text-[10px] font-bold">
                        <Lock className="w-2.5 h-2.5" />
                        Internal Faculty Note
                      </span>
                    )}
                  </div>
                  <p className="leading-relaxed whitespace-pre-wrap">{cm.message}</p>
                  <p className="text-[10px] opacity-60 text-right">{formatDate(cm.created_at)}</p>
                </div>
              ))
            )}
          </div>

          {/* Add Comment or Note Form */}
          <form onSubmit={handleCommentSubmit} className="pt-2 border-t border-slate-100 space-y-3">
            <textarea
              rows={3}
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="Add investigation notes or send an update to the student..."
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none"
            />

            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-600">
                <input
                  type="checkbox"
                  checked={isInternal}
                  onChange={(e) => setIsInternal(e.target.checked)}
                  className="rounded border-slate-300 text-purple-600 focus:ring-purple-500"
                />
                <span className="flex items-center gap-1 font-medium">
                  <Lock className="w-3 h-3 text-amber-600" />
                  Internal Note only (hidden from student)
                </span>
              </label>

              <button
                type="submit"
                disabled={submittingComment || !newComment.trim()}
                className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white font-semibold text-xs transition-colors flex items-center gap-1.5 shadow-sm"
              >
                {submittingComment ? (
                  <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                ) : (
                  <>
                    <Send className="w-3.5 h-3.5" />
                    Post Update
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Status Transition Modal */}
      <Modal
        isOpen={statusModalOpen}
        onClose={() => setStatusModalOpen(false)}
        title={`Transition Status to "${targetStatus}"`}
        maxWidth="max-w-md"
      >
        <form onSubmit={handleStatusSubmit} className="space-y-4 py-2">
          <p className="text-xs text-slate-600">
            {targetStatus === 'Resolved' &&
              'Provide comprehensive resolution remarks detailing the outcome, grade adjustments, or corrective actions taken.'}
            {targetStatus === 'Rejected' &&
              'Please provide clear rationale for rejecting this grievance ticket.'}
            {(targetStatus === 'Under Review' || targetStatus === 'In Progress') &&
              'Optionally enter investigation remarks or leave blank to record standard progression.'}
          </p>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5 uppercase tracking-wider">
              {targetStatus === 'Resolved' || targetStatus === 'Rejected'
                ? 'Mandatory Remarks *'
                : 'Remarks / Notes (Optional)'}
            </label>
            <textarea
              rows={4}
              required={targetStatus === 'Resolved' || targetStatus === 'Rejected'}
              value={statusRemarks}
              onChange={(e) => setStatusRemarks(e.target.value)}
              placeholder={
                targetStatus === 'Resolved'
                  ? 'e.g. Conducted re-evaluation with TA. Adjusted 4 marks on Portal and verified student records.'
                  : targetStatus === 'Rejected'
                  ? 'e.g. Inconclusive evidence provided. Policy requires physical verification within 3 business days.'
                  : 'Investigation progress notes...'
              }
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
            {(targetStatus === 'Resolved' || targetStatus === 'Rejected') && (
              <span className="text-[11px] text-slate-400 mt-1 block">
                Minimum 5 characters required ({statusRemarks.trim().length}/5)
              </span>
            )}
          </div>

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setStatusModalOpen(false)}
              className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={updatingStatus}
              className="px-5 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white font-semibold text-xs shadow-sm transition-colors flex items-center gap-2"
            >
              {updatingStatus ? (
                <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
              ) : (
                `Confirm ${targetStatus}`
              )}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
