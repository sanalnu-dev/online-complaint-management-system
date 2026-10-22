import React, { useState, useEffect, useCallback } from 'react';
import { adminService } from '../services/adminService';
import { useToast } from '../hooks/useToast';
import Modal from '../components/Modal';
import ConfirmDialog from '../components/ConfirmDialog';
import LoadingSpinner from '../components/LoadingSpinner';
import EmptyState from '../components/EmptyState';
import {
  FolderTree,
  Plus,
  Edit2,
  Trash2,
  GraduationCap,
  Building,
  RotateCcw,
  CheckCircle2,
  AlertCircle,
  FileText
} from 'lucide-react';

export default function AdminCategoryManagementPage() {
  const { success, error: toastError } = useToast();

  const [categories, setCategories] = useState([]);
  const [facultyList, setFacultyList] = useState([]);
  const [loading, setLoading] = useState(true);

  // Create / Edit modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [formData, setFormData] = useState({
    category_name: '',
    description: '',
    department: '',
    default_faculty_id: ''
  });
  const [saving, setSaving] = useState(false);

  // Delete confirm dialog state
  const [deleteDialog, setDeleteDialog] = useState({
    isOpen: false,
    category: null
  });

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const [catRes, facRes] = await Promise.all([
        adminService.getCategories(),
        adminService.getFaculty()
      ]);

      if (catRes.success) {
        setCategories(catRes.categories);
      }
      if (facRes.success) {
        setFacultyList(facRes.faculty);
      }
    } catch (err) {
      toastError(err.response?.data?.message || 'Failed to load category metadata');
    } finally {
      setLoading(false);
    }
  }, [toastError]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const openCreateModal = () => {
    setEditingCategory(null);
    setFormData({
      category_name: '',
      description: '',
      department: '',
      default_faculty_id: ''
    });
    setModalOpen(true);
  };

  const openEditModal = (cat) => {
    setEditingCategory(cat);
    setFormData({
      category_name: cat.category_name,
      description: cat.description || '',
      department: cat.department || '',
      default_faculty_id: cat.default_faculty_id ? String(cat.default_faculty_id) : ''
    });
    setModalOpen(true);
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    if (!formData.category_name.trim() || formData.category_name.trim().length < 2) {
      toastError('Category name must be at least 2 characters.');
      return;
    }

    setSaving(true);
    try {
      const payload = {
        category_name: formData.category_name.trim(),
        description: formData.description.trim() || null,
        department: formData.department.trim() || null,
        default_faculty_id: formData.default_faculty_id ? parseInt(formData.default_faculty_id, 10) : null
      };

      if (editingCategory) {
        const res = await adminService.updateCategory(editingCategory.category_id, payload);
        if (res.success) {
          success(`Category "${payload.category_name}" updated successfully`);
          setModalOpen(false);
          fetchData();
        }
      } else {
        const res = await adminService.createCategory(payload);
        if (res.success) {
          success(`Category "${payload.category_name}" created successfully`);
          setModalOpen(false);
          fetchData();
        }
      }
    } catch (err) {
      toastError(err.response?.data?.message || 'Failed to save category');
    } finally {
      setSaving(false);
    }
  };

  const confirmDeleteCategory = async () => {
    if (!deleteDialog.category) return;
    try {
      const res = await adminService.deleteCategory(deleteDialog.category.category_id);
      if (res.success) {
        success('Category removed successfully');
        setDeleteDialog({ isOpen: false, category: null });
        fetchData();
      }
    } catch (err) {
      toastError(err.response?.data?.message || 'Cannot delete category');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-amber-700 bg-amber-50 px-2.5 py-1 rounded-lg border border-amber-200 mb-2">
            <FolderTree className="w-3.5 h-3.5" />
            Category &amp; Routing Engine
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-navy-900 tracking-tight">
            Complaint Categories &amp; Assignments
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Configure automated routing to default faculty advisors, responsible departments, and review workloads
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={fetchData}
            className="p-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 shadow-sm transition-colors"
            title="Refresh"
          >
            <RotateCcw className="w-4 h-4 text-slate-500" />
          </button>
          <button
            type="button"
            onClick={openCreateModal}
            className="px-4 py-2.5 rounded-xl bg-navy-900 hover:bg-navy-800 text-white text-xs font-semibold shadow-md shadow-navy-900/20 transition-all flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Add New Category
          </button>
        </div>
      </div>

      {/* Categories Table / Card Grid */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm overflow-hidden">
        {loading ? (
          <LoadingSpinner message="Loading complaint categories..." />
        ) : categories.length === 0 ? (
          <div className="p-8">
            <EmptyState
              title="No Categories Configured"
              description="Add your first grievance category to enable structured ticket submission."
              actionText="Add Category"
              onAction={openCreateModal}
            />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-600">
              <thead className="bg-slate-50/80 text-xs uppercase font-semibold text-slate-500 border-b border-slate-100">
                <tr>
                  <th className="px-6 py-4">Category Name</th>
                  <th className="px-6 py-4">Department</th>
                  <th className="px-6 py-4">Default Faculty Routing</th>
                  <th className="px-6 py-4">Description</th>
                  <th className="px-6 py-4 text-center">Active / Total</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {categories.map((cat) => (
                  <tr key={cat.category_id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="px-6 py-4 font-semibold text-slate-900 whitespace-nowrap">
                      {cat.category_name}
                    </td>
                    <td className="px-6 py-4 text-xs whitespace-nowrap">
                      {cat.department ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700 font-medium">
                          <Building className="w-3.5 h-3.5 text-slate-500" />
                          {cat.department}
                        </span>
                      ) : (
                        <span className="text-slate-400 italic">None specified</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-xs whitespace-nowrap">
                      {cat.default_faculty_name ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-purple-50 text-purple-700 font-medium border border-purple-200">
                          <GraduationCap className="w-3.5 h-3.5 text-purple-600" />
                          {cat.default_faculty_name}
                        </span>
                      ) : (
                        <span className="text-slate-400 italic">None (manual assignment)</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-xs text-slate-500 max-w-xs truncate">
                      {cat.description || '—'}
                    </td>
                    <td className="px-6 py-4 text-center whitespace-nowrap">
                      <span className="text-xs font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded mr-1">
                        {cat.active_complaints || 0} active
                      </span>
                      <span className="text-xs text-slate-400">/ {cat.total_complaints || 0} total</span>
                    </td>
                    <td className="px-6 py-4 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          type="button"
                          onClick={() => openEditModal(cat)}
                          className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-100 text-slate-600 transition-colors"
                          title="Edit Category"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeleteDialog({ isOpen: true, category: cat })}
                          disabled={Boolean(cat.total_complaints > 0)}
                          className="p-1.5 rounded-lg border border-slate-200 hover:bg-rose-50 text-slate-400 hover:text-rose-600 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                          title={cat.total_complaints > 0 ? 'Cannot delete category with tickets' : 'Delete Category'}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add / Edit Category Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingCategory ? 'Edit Complaint Category' : 'Create New Category'}
        maxWidth="max-w-md"
      >
        <form onSubmit={handleFormSubmit} className="space-y-4 py-2">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5 uppercase tracking-wider">
              Category Name *
            </label>
            <input
              type="text"
              required
              value={formData.category_name}
              onChange={(e) => setFormData((prev) => ({ ...prev, category_name: e.target.value }))}
              placeholder="e.g. Teaching & Academics, Hostels, Transport"
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-navy-900"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5 uppercase tracking-wider">
              Responsible Department
            </label>
            <input
              type="text"
              value={formData.department}
              onChange={(e) => setFormData((prev) => ({ ...prev, department: e.target.value }))}
              placeholder="e.g. Academic Affairs, Estate Office, IT Cell"
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-navy-900"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5 uppercase tracking-wider">
              Default Responsible Faculty Member
            </label>
            <select
              value={formData.default_faculty_id}
              onChange={(e) => setFormData((prev) => ({ ...prev, default_faculty_id: e.target.value }))}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-navy-900 cursor-pointer"
            >
              <option value="">-- No default faculty (Assign manually) --</option>
              {facultyList.map((fac) => (
                <option key={fac.user_id} value={fac.user_id}>
                  {fac.full_name} ({fac.email})
                </option>
              ))}
            </select>
            <p className="text-[11px] text-slate-400 mt-1">
              Complaints logged under this category will automatically route to this faculty member if none is selected by student.
            </p>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5 uppercase tracking-wider">
              Description (Optional)
            </label>
            <textarea
              rows={3}
              value={formData.description}
              onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
              placeholder="Brief description of grievances covered by this category..."
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-navy-900 resize-none"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setModalOpen(false)}
              className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-5 py-2 rounded-xl bg-navy-900 hover:bg-navy-800 disabled:opacity-50 text-white font-semibold text-xs shadow-sm transition-colors flex items-center gap-2"
            >
              {saving ? (
                <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
              ) : editingCategory ? (
                'Save Changes'
              ) : (
                'Create Category'
              )}
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={deleteDialog.isOpen}
        onClose={() => setDeleteDialog({ isOpen: false, category: null })}
        onConfirm={confirmDeleteCategory}
        title="Delete Category"
        message={`Are you sure you want to delete the category "${deleteDialog.category?.category_name}"? This action cannot be undone.`}
        confirmText="Delete Category"
        isDanger={true}
      />
    </div>
  );
}
