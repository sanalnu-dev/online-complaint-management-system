import React from 'react';
import Modal from './Modal';
import { AlertTriangle, AlertCircle } from 'lucide-react';

export default function ConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  isDanger = false,
  loading = false
}) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} maxWidth="max-w-md">
      <div className="flex items-start gap-4">
        <div
          className={`p-3 rounded-full flex-shrink-0 ${
            isDanger ? 'bg-rose-100 text-rose-600' : 'bg-amber-100 text-amber-600'
          }`}
        >
          {isDanger ? <AlertCircle className="w-6 h-6" /> : <AlertTriangle className="w-6 h-6" />}
        </div>
        <div className="flex-1 text-sm text-slate-600 leading-relaxed pt-1">
          {message}
        </div>
      </div>

      <div className="mt-6 flex justify-end gap-3 pt-3 border-t border-slate-100">
        <button
          type="button"
          onClick={onClose}
          disabled={loading}
          className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-xl hover:bg-slate-50 focus:outline-none transition-colors"
        >
          {cancelText}
        </button>
        <button
          type="button"
          onClick={onConfirm}
          disabled={loading}
          className={`px-4 py-2 text-sm font-medium text-white rounded-xl focus:outline-none shadow-sm transition-colors flex items-center gap-2 ${
            isDanger
              ? 'bg-rose-600 hover:bg-rose-700 focus:ring-rose-500'
              : 'bg-primary-600 hover:bg-primary-700 focus:ring-primary-500'
          }`}
        >
          {loading ? (
            <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
          ) : null}
          {confirmText}
        </button>
      </div>
    </Modal>
  );
}
