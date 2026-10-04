import React, { useState, useEffect, useCallback } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { complaintService } from '../services/complaintService';
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
  FileText,
  Calendar,
  MapPin,
  User,
  ShieldCheck,
  AlertCircle,
  Clock,
  RotateCcw,
  MessageSquare,
  Send,
  ExternalLink,
  Download
} from 'lucide-react';

export default function ComplaintDetailsPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, isAdmin } = useAuth();
  const { success, error: toastError } = useToast();

  const [complaint, setComplaint] = useState(null);
  const [history, setHistory] = useState([]);
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  // New comment state
  const [commentText, setCommentText] = useState('');
  const [submittingComment, setSubmittingComment] = useState(false);

  // Reopen Modal state
  const [reopenModalOpen, setReopenModalOpen] = useState(false);
  const [reopenRemarks, setReopenRemarks] = useState('');
  const [reopening, setReopening] = useState(false);

  const fetchComplaintDetails = useCallback(async () => {
    try {
      setLoading(true);
      const res = await complaintService.getComplaintById(id);
      if (res.success) {
        setComplaint(res.complaint);
        setHistory(res.history || []);
        setComments(res.comments || []);
      }
    } catch (err) {
      toastError(err.response?.data?.message || 'Failed to load complaint details');
      if (err.response?.status === 403) {
        navigate('/unauthorized');
      } else if (err.response?.status === 404) {
        navigate('/404');
      }
    } finally {
      setLoading(false);
    }
  }, [id, navigate, toastError]);

  useEffect(() => {
    fetchComplaintDetails();
  }, [fetchComplaintDetails]);

  const copyRefNumber = () => {
    if (complaint?.reference_number) {
      navigator.clipboard.writeText(complaint.reference_number);
      setCopied(true);
      success('Reference number copied to clipboard');
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleAddComment = async (e) => {
    e.preventDefault();
    if (!commentText.trim()) return;

    setSubmittingComment(true);
    try {
      const res = await complaintService.addComment(id, commentText.trim(), false);
      if (res.success) {
        setComments((prev) => [...prev, res.comment]);
        setCommentText('');
        success('Response posted successfully');
      }
    } catch (err) {
      toastError(err.response?.data?.message || 'Failed to post comment');
    } finally {
      setSubmittingComment(false);
    }
  };

  const handleReopenComplaint = async (e) => {
    e.preventDefault();
    if (!reopenRemarks.trim() || reopenRemarks.trim().length < 5) {
      toastError('Please provide a reason for reopening (minimum 5 characters)');
      return;
    }

    setReopening(true);
    try {
      const res = await complaintService.reopenComplaint(id, reopenRemarks.trim());
      if (res.success) {
        success('Complaint reopened successfully for review');
        setReopenModalOpen(false);
        setReopenRemarks('');
        fetchComplaintDetails();
      }
    } catch (err) {
      toastError(err.response?.data?.message || 'Failed to reopen complaint');
    } finally {
      setReopening(false);
    }
  };

  if (loading) {
    return <LoadingSpinner fullPage message="Loading complaint details..." />;
  }

  if (!complaint) {
    return null;
  }

  const isOwner = user?.userId === complaint.user_id;
  const canReopen = isOwner && (complaint.status === 'Resolved' || complaint.status === 'Rejected');

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Top Navigation Back Link */}
      <div className="flex items-center justify-between">
        <Link
          to={isAdmin ? '/admin/complaints' : '/complaints'}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          {isAdmin ? 'Back to Admin Queue' : 'Back to My Complaints'}
        </Link>

        {/* Reopen Action button if applicable */}
        {canReopen && (
          <button
            type="button"
            onClick={() => setReopenModalOpen(true)}
            className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-orange-50 hover:bg-orange-100 text-orange-700 border border-orange-200 text-xs font-semibold transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Reopen Complaint
          </button>
        )}
      </div>

      {/* Main Header Card */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 border-b border-slate-100 pb-6">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-mono text-sm font-bold text-primary-700 bg-primary-50 px-2.5 py-1 rounded-lg border border-primary-200 flex items-center gap-1.5">
                {complaint.reference_number}
                <button
                  type="button"
                  onClick={copyRefNumber}
                  title="Copy reference number"
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

        {/* Metadata Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/60 flex items-center gap-3">
            <MapPin className="w-4 h-4 text-slate-400 flex-shrink-0" />
            <div>
              <p className="text-slate-400 uppercase tracking-wider font-semibold text-[10px]">Location</p>
              <p className="font-semibold text-slate-800 mt-0.5">{complaint.location_department}</p>
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/60 flex items-center gap-3">
            <Calendar className="w-4 h-4 text-slate-400 flex-shrink-0" />
            <div>
              <p className="text-slate-400 uppercase tracking-wider font-semibold text-[10px]">Submitted Date</p>
              <p className="font-semibold text-slate-800 mt-0.5">{formatDate(complaint.created_at)}</p>
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/60 flex items-center gap-3">
            <ShieldCheck className="w-4 h-4 text-slate-400 flex-shrink-0" />
            <div>
              <p className="text-slate-400 uppercase tracking-wider font-semibold text-[10px]">Assigned Admin</p>
              <p className="font-semibold text-slate-800 mt-0.5">
                {complaint.assigned_admin_name || 'Pending assignment'}
              </p>
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

        {/* Attached Document or Evidence */}
        {complaint.attachment_path && (
          <div className="space-y-2">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Attached Supporting Evidence
            </h3>
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <FileText className="w-6 h-6 text-primary-600" />
                <div>
                  <span className="text-sm font-semibold text-slate-800 block">
                    {complaint.attachment_path.split('/').pop()}
                  </span>
                  <span className="text-xs text-slate-400">Attached during submission</span>
                </div>
              </div>

              <a
                href={complaint.attachment_path}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white border border-slate-200 hover:bg-slate-50 text-xs font-semibold text-primary-700 transition-colors shadow-sm"
              >
                <Download className="w-3.5 h-3.5" />
                View Attachment
              </a>
            </div>
          </div>
        )}

        {/* Resolution Remarks (when Resolved or Rejected) */}
        {complaint.resolution_remarks && (
          <div
            className={`p-5 rounded-2xl border ${
              complaint.status === 'Resolved'
                ? 'bg-emerald-50/80 border-emerald-200 text-emerald-900'
                : 'bg-rose-50/80 border-rose-200 text-rose-900'
            }`}
          >
            <div className="flex items-center gap-2 mb-2 font-bold text-sm">
              <ShieldCheck className="w-4 h-4" />
              Official Resolution Remarks
              {complaint.resolved_at && (
                <span className="text-xs font-normal opacity-80">
                  (Closed on {formatDate(complaint.resolved_at)})
                </span>
              )}
            </div>
            <p className="text-xs sm:text-sm leading-relaxed whitespace-pre-wrap">
              {complaint.resolution_remarks}
            </p>
          </div>
        )}
      </div>

      {/* Two Column Section: Timeline on Left, Comments on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Status History Audit Timeline */}
        <div className="lg:col-span-6 bg-white rounded-3xl p-6 sm:p-7 border border-slate-200/80 shadow-sm space-y-5">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
            <Clock className="w-4 h-4 text-primary-600" />
            <h2 className="font-bold text-navy-900 text-base">Status Audit Timeline</h2>
          </div>

          <div className="relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
            {history.map((step, idx) => (
              <div key={step.history_id || idx} className="relative">
                {/* Timeline node circle */}
                <div className="absolute -left-6 top-1 w-3.5 h-3.5 rounded-full bg-white border-2 border-primary-600 ring-4 ring-primary-50"></div>
                <div>
                  <div className="flex flex-wrap items-center gap-2">
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

        {/* Discussion / Responses Feed */}
        <div className="lg:col-span-6 bg-white rounded-3xl p-6 sm:p-7 border border-slate-200/80 shadow-sm space-y-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 border-b border-slate-100 pb-3 mb-4">
              <MessageSquare className="w-4 h-4 text-primary-600" />
              <h2 className="font-bold text-navy-900 text-base">Conversation Thread</h2>
            </div>

            <div className="space-y-3 max-h-[350px] overflow-y-auto pr-1">
              {comments.length === 0 ? (
                <p className="text-xs text-slate-400 italic text-center py-8">
                  No comments or responses yet.
                </p>
              ) : (
                comments.map((comment) => {
                  const isAdminAuthor = comment.author_role === 'ADMIN';
                  return (
                    <div
                      key={comment.comment_id}
                      className={`p-3.5 rounded-2xl text-xs leading-relaxed ${
                        isAdminAuthor
                          ? 'bg-blue-50/80 border border-blue-200/70 text-slate-800'
                          : 'bg-slate-50 border border-slate-200 text-slate-800'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="font-bold text-slate-900 flex items-center gap-1.5">
                          {comment.author_name}
                          {isAdminAuthor && (
                            <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-navy-900 text-white">
                              STAFF
                            </span>
                          )}
                        </span>
                        <span className="text-[10px] text-slate-400">
                          {formatDate(comment.created_at)}
                        </span>
                      </div>
                      <p className="text-slate-700 whitespace-pre-wrap">{comment.message}</p>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Comment Form */}
          <form onSubmit={handleAddComment} className="pt-3 border-t border-slate-100 space-y-2">
            <textarea
              rows={2}
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              placeholder="Type a message or response regarding this ticket..."
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary-500 transition-all resize-none"
            />
            <div className="flex justify-end">
              <button
                type="submit"
                disabled={submittingComment || !commentText.trim()}
                className="px-4 py-2 rounded-xl bg-primary-600 hover:bg-primary-700 text-white text-xs font-semibold transition-colors disabled:opacity-50 flex items-center gap-1.5"
              >
                <Send className="w-3 h-3" />
                Send Message
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Reopen Complaint Modal */}
      {reopenModalOpen && (
        <Modal
          isOpen={reopenModalOpen}
          onClose={() => setReopenModalOpen(false)}
          title="Reopen Grievance Ticket"
          maxWidth="max-w-md"
        >
          <form onSubmit={handleReopenComplaint} className="space-y-4">
            <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs leading-relaxed">
              If the problem was not solved satisfactorily or has recurred, please explain the issue below. The ticket will return to Under Review.
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Reason for Reopening <span className="text-rose-500">*</span>
              </label>
              <textarea
                rows={3}
                required
                value={reopenRemarks}
                onChange={(e) => setReopenRemarks(e.target.value)}
                placeholder="Explain why the resolution was insufficient..."
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setReopenModalOpen(false)}
                className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={reopening || reopenRemarks.trim().length < 5}
                className="px-4 py-2 rounded-xl bg-orange-600 hover:bg-orange-700 text-white text-xs font-semibold shadow-sm transition-colors flex items-center gap-1.5 disabled:opacity-50"
              >
                {reopening ? (
                  <span className="inline-block w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                ) : (
                  <RotateCcw className="w-3.5 h-3.5" />
                )}
                Confirm Reopen
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
