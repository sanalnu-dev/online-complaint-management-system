import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { complaintService } from '../services/complaintService';
import { useToast } from '../hooks/useToast';
import Modal from '../components/Modal';
import {
  PlusCircle,
  UploadCloud,
  File,
  X,
  AlertCircle,
  CheckCircle2,
  ArrowRight,
  ShieldAlert
} from 'lucide-react';

export default function SubmitComplaintPage() {
  const navigate = useNavigate();
  const { success, error: toastError } = useToast();

  const [categories, setCategories] = useState([]);
  const [loadingCategories, setLoadingCategories] = useState(true);

  const [formData, setFormData] = useState({
    title: '',
    category_id: '',
    location_department: '',
    priority: 'Medium',
    description: ''
  });

  const [attachment, setAttachment] = useState(null);
  const [filePreview, setFilePreview] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');

  // Confirmation modal state after successful submission
  const [successResult, setSuccessResult] = useState(null);

  useEffect(() => {
    async function loadCategories() {
      try {
        const res = await complaintService.getCategories();
        if (res.success && res.categories) {
          setCategories(res.categories);
          if (res.categories.length > 0) {
            setFormData((prev) => ({ ...prev, category_id: res.categories[0].category_id }));
          }
        }
      } catch (err) {
        toastError('Failed to load complaint categories');
      } finally {
        setLoadingCategories(false);
      }
    }
    loadCategories();
  }, [toastError]);

  const handleChange = (e) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
    setFormError('');
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validate size (5MB limit)
    if (file.size > 5 * 1024 * 1024) {
      setFormError('File size exceeds the 5MB limit. Please choose a smaller file.');
      return;
    }

    // Validate type
    const allowed = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];
    if (!allowed.includes(file.type)) {
      setFormError('Invalid file type. Only JPEG, PNG, WEBP, and PDF documents are allowed.');
      return;
    }

    setAttachment(file);
    setFormError('');

    if (file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFilePreview(reader.result);
      };
      reader.readAsDataURL(file);
    } else {
      setFilePreview(null);
    }
  };

  const removeAttachment = () => {
    setAttachment(null);
    setFilePreview(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');

    if (!formData.title.trim() || formData.title.trim().length < 5) {
      setFormError('Title must be at least 5 characters long.');
      return;
    }

    if (!formData.description.trim() || formData.description.trim().length < 10) {
      setFormError('Description must be at least 10 characters long.');
      return;
    }

    if (!formData.location_department.trim()) {
      setFormError('Please specify the location or department.');
      return;
    }

    setSubmitting(true);
    try {
      const payload = new FormData();
      payload.append('title', formData.title.trim());
      payload.append('category_id', formData.category_id);
      payload.append('location_department', formData.location_department.trim());
      payload.append('priority', formData.priority);
      payload.append('description', formData.description.trim());

      if (attachment) {
        payload.append('attachment', attachment);
      }

      const res = await complaintService.submitComplaint(payload);
      if (res.success) {
        success('Complaint submitted successfully!');
        setSuccessResult(res.complaint);
      } else {
        setFormError(res.message || 'Submission failed');
      }
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to submit complaint';
      setFormError(msg);
      toastError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Page Title */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-navy-900 tracking-tight">
          File a Complaint
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Submit your grievance ticket with details, department, priority, and optional evidence
        </p>
      </div>

      {formError && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-sm flex items-start gap-2.5">
          <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5 text-rose-500" />
          <span>{formError}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-sm space-y-6">
        {/* Title */}
        <div>
          <div className="flex justify-between items-center mb-1.5">
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider">
              Complaint Title <span className="text-rose-500">*</span>
            </label>
            <span className="text-[11px] text-slate-400 font-mono">
              {formData.title.length}/200
            </span>
          </div>
          <input
            type="text"
            name="title"
            required
            maxLength={200}
            value={formData.title}
            onChange={handleChange}
            placeholder="Brief summary of the issue (e.g. Projector audio failure in Room 101)"
            className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
          />
        </div>

        {/* Category & Location Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5 uppercase tracking-wider">
              Category <span className="text-rose-500">*</span>
            </label>
            <select
              name="category_id"
              required
              value={formData.category_id}
              onChange={handleChange}
              disabled={loadingCategories}
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all cursor-pointer"
            >
              {categories.map((cat) => (
                <option key={cat.category_id} value={cat.category_id}>
                  {cat.category_name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5 uppercase tracking-wider">
              Location / Department <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              name="location_department"
              required
              maxLength={150}
              value={formData.location_department}
              onChange={handleChange}
              placeholder="e.g. Block C - 2nd Floor, Room 204"
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
            />
          </div>
        </div>

        {/* Priority Selector */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-2 uppercase tracking-wider">
            Urgency / Priority Level <span className="text-rose-500">*</span>
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { level: 'Low', desc: 'Routine or non-critical', style: 'hover:border-slate-300' },
              { level: 'Medium', desc: 'Standard turnaround', style: 'hover:border-sky-300' },
              { level: 'High', desc: 'Important, time-sensitive', style: 'hover:border-amber-300' },
              { level: 'Urgent', desc: 'Emergency, immediate safety', style: 'hover:border-red-300' }
            ].map(({ level, desc, style }) => {
              const isSelected = formData.priority === level;
              return (
                <button
                  type="button"
                  key={level}
                  onClick={() => setFormData((prev) => ({ ...prev, priority: level }))}
                  className={`p-3 rounded-2xl border text-left transition-all ${style} ${
                    isSelected
                      ? 'border-primary-600 bg-primary-50/60 ring-2 ring-primary-500/20'
                      : 'border-slate-200 bg-white'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span
                      className={`text-sm font-bold ${
                        isSelected ? 'text-primary-700' : 'text-slate-800'
                      }`}
                    >
                      {level}
                    </span>
                    {isSelected && (
                      <span className="w-2 h-2 rounded-full bg-primary-600"></span>
                    )}
                  </div>
                  <p className="text-[11px] text-slate-500 mt-1 leading-tight">{desc}</p>
                </button>
              );
            })}
          </div>
        </div>

        {/* Description */}
        <div>
          <div className="flex justify-between items-center mb-1.5">
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider">
              Detailed Description <span className="text-rose-500">*</span>
            </label>
            <span className="text-[11px] text-slate-400 font-mono">
              {formData.description.length}/2000
            </span>
          </div>
          <textarea
            name="description"
            required
            rows={5}
            maxLength={2000}
            value={formData.description}
            onChange={handleChange}
            placeholder="Please provide full details, including specific equipment names, error behaviors, or frequency of the issue..."
            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all resize-y"
          ></textarea>
        </div>

        {/* Supporting Attachment Upload */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1.5 uppercase tracking-wider">
            Supporting Evidence <span className="text-slate-400 font-normal lowercase">(optional photo or PDF, max 5MB)</span>
          </label>

          {!attachment ? (
            <label className="border-2 border-dashed border-slate-200 hover:border-primary-400 rounded-2xl p-6 flex flex-col items-center justify-center cursor-pointer transition-colors bg-slate-50/50 hover:bg-primary-50/20">
              <UploadCloud className="w-8 h-8 text-slate-400 mb-2" />
              <span className="text-sm font-semibold text-slate-700">Click to upload or drag & drop</span>
              <span className="text-xs text-slate-400 mt-0.5">PNG, JPG, WEBP, or PDF up to 5MB</span>
              <input
                type="file"
                accept="image/png,image/jpeg,image/webp,application/pdf"
                onChange={handleFileChange}
                className="hidden"
              />
            </label>
          ) : (
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between">
              <div className="flex items-center gap-3 overflow-hidden">
                {filePreview ? (
                  <img
                    src={filePreview}
                    alt="Preview"
                    className="w-12 h-12 object-cover rounded-xl border border-slate-200"
                  />
                ) : (
                  <div className="w-12 h-12 rounded-xl bg-red-100 text-red-600 flex items-center justify-center flex-shrink-0">
                    <File className="w-6 h-6" />
                  </div>
                )}
                <div className="overflow-hidden">
                  <p className="text-sm font-semibold text-slate-800 truncate">
                    {attachment.name}
                  </p>
                  <p className="text-xs text-slate-500">
                    {(attachment.size / 1024 / 1024).toFixed(2)} MB • {attachment.type}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={removeAttachment}
                className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                title="Remove attachment"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          )}
        </div>

        {/* Submit Actions */}
        <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={() => navigate('/dashboard')}
            className="px-5 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={submitting}
            className="px-6 py-2.5 rounded-xl bg-primary-600 hover:bg-primary-700 text-white text-sm font-semibold shadow-md shadow-primary-600/20 focus:outline-none focus:ring-2 focus:ring-primary-500 transition-all flex items-center gap-2"
          >
            {submitting ? (
              <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
            ) : (
              <PlusCircle className="w-4 h-4" />
            )}
            Submit Ticket
          </button>
        </div>
      </form>

      {/* Confirmation Modal */}
      {successResult && (
        <Modal
          isOpen={Boolean(successResult)}
          onClose={() => navigate('/complaints')}
          title="Complaint Submitted"
          maxWidth="max-w-md"
          showClose={false}
        >
          <div className="text-center space-y-4 py-2">
            <div className="w-14 h-14 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <div>
              <h4 className="text-lg font-bold text-navy-900">
                Ticket Successfully Generated
              </h4>
              <p className="text-xs text-slate-500 mt-1">
                Your complaint has been registered and routed to administrators.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-center">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                Complaint Reference Number
              </span>
              <code className="text-lg font-mono font-bold text-primary-700 block mt-1 select-all">
                {successResult.referenceNumber}
              </code>
            </div>

            <div className="flex flex-col gap-2 pt-2">
              <button
                type="button"
                onClick={() => navigate(`/complaints/${successResult.complaintId}`)}
                className="w-full py-2.5 rounded-xl bg-primary-600 hover:bg-primary-700 text-white font-semibold text-sm shadow-sm transition-colors flex items-center justify-center gap-2"
              >
                Track Ticket Details
                <ArrowRight className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => navigate('/dashboard')}
                className="w-full py-2.5 rounded-xl bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 font-semibold text-sm transition-colors"
              >
                Back to Dashboard
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
