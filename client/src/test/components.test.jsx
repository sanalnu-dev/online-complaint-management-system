import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import StatusBadge from '../components/StatusBadge';
import PriorityBadge from '../components/PriorityBadge';
import StatCard from '../components/StatCard';
import EmptyState from '../components/EmptyState';
import Modal from '../components/Modal';
import ConfirmDialog from '../components/ConfirmDialog';
import { FileText } from 'lucide-react';

describe('OCMS Frontend Reusable UI Component Suite', () => {
  it('renders StatusBadge with appropriate text and styling', () => {
    const { rerender } = render(<StatusBadge status="Resolved" />);
    expect(screen.getByText('Resolved')).toBeInTheDocument();

    rerender(<StatusBadge status="In Progress" />);
    expect(screen.getByText('In Progress')).toBeInTheDocument();

    rerender(<StatusBadge status="Under Review" />);
    expect(screen.getByText('Under Review')).toBeInTheDocument();
  });

  it('renders PriorityBadge with correct priority label', () => {
    const { rerender } = render(<PriorityBadge priority="Urgent" />);
    expect(screen.getByText('Urgent')).toBeInTheDocument();

    rerender(<PriorityBadge priority="Low" />);
    expect(screen.getByText('Low')).toBeInTheDocument();
  });

  it('renders StatCard with title, value, and subtitle', () => {
    render(
      <StatCard
        title="Total Complaints"
        value={42}
        subtitle="Across all departments"
        icon={FileText}
        color="blue"
      />
    );
    expect(screen.getByText('Total Complaints')).toBeInTheDocument();
    expect(screen.getByText('42')).toBeInTheDocument();
    expect(screen.getByText('Across all departments')).toBeInTheDocument();
  });

  it('renders EmptyState with custom title, description, and click callback', () => {
    const handleAction = vi.fn();
    render(
      <EmptyState
        title="No Tickets Found"
        description="Try clearing your search query"
        actionText="Reset Filters"
        onAction={handleAction}
      />
    );
    expect(screen.getByText('No Tickets Found')).toBeInTheDocument();
    expect(screen.getByText('Try clearing your search query')).toBeInTheDocument();

    const button = screen.getByText('Reset Filters');
    fireEvent.click(button);
    expect(handleAction).toHaveBeenCalledTimes(1);
  });

  it('renders Modal only when isOpen is true', () => {
    const handleClose = vi.fn();
    const { rerender } = render(
      <Modal isOpen={false} onClose={handleClose} title="Test Modal">
        <p>Modal content hidden</p>
      </Modal>
    );
    expect(screen.queryByText('Test Modal')).not.toBeInTheDocument();

    rerender(
      <Modal isOpen={true} onClose={handleClose} title="Test Modal">
        <p>Modal content visible</p>
      </Modal>
    );
    expect(screen.getByText('Test Modal')).toBeInTheDocument();
    expect(screen.getByText('Modal content visible')).toBeInTheDocument();
  });

  it('renders ConfirmDialog and triggers confirmation action', () => {
    const handleConfirm = vi.fn();
    const handleClose = vi.fn();
    render(
      <ConfirmDialog
        isOpen={true}
        onClose={handleClose}
        onConfirm={handleConfirm}
        title="Confirm Deletion"
        message="Are you sure you wish to delete this record?"
        confirmText="Yes, Delete"
        isDanger={true}
      />
    );
    expect(screen.getByText('Confirm Deletion')).toBeInTheDocument();
    expect(screen.getByText('Are you sure you wish to delete this record?')).toBeInTheDocument();

    const confirmButton = screen.getByText('Yes, Delete');
    fireEvent.click(confirmButton);
    expect(handleConfirm).toHaveBeenCalledTimes(1);
  });
});
