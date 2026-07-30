'use client';

import React from 'react';
import { AlertTriangle, CheckCircle2 } from 'lucide-react';
import { Modal } from './Modal';
import { Button } from './Button';

type ConfirmTone = 'danger' | 'primary';

type Props = {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmLabel?: string;
  loading?: boolean;
  /** 'danger' (default) for destructive actions; 'primary' for affirmative ones (e.g. approve). */
  tone?: ConfirmTone;
};

export const ConfirmDialog = ({
  open, onClose, onConfirm, title, message, confirmLabel = 'Confirm', loading, tone = 'danger',
}: Props) => (
  <Modal open={open} onClose={onClose} size="sm">
    <div className="flex flex-col items-center gap-4 text-center">
      <div className={`flex h-12 w-12 items-center justify-center rounded-full ${tone === 'primary' ? 'bg-green-100' : 'bg-red-100'}`}>
        {tone === 'primary'
          ? <CheckCircle2 className="h-6 w-6 text-green-600" />
          : <AlertTriangle className="h-6 w-6 text-red-600" />}
      </div>
      <div className="space-y-1">
        <h3 className="text-base font-semibold text-slate-900">{title}</h3>
        <p className="text-sm text-slate-500">{message}</p>
      </div>
      <div className="flex w-full gap-3">
        <Button variant="muted" className="flex-1" onClick={onClose} disabled={loading}>
          Cancel
        </Button>
        <Button variant={tone === 'primary' ? 'primary' : 'danger'} className="flex-1" onClick={onConfirm} loading={loading}>
          {confirmLabel}
        </Button>
      </div>
    </div>
  </Modal>
);
