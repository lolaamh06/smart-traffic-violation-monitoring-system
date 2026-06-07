import React from 'react';
import { AlertTriangle } from 'lucide-react';
import { Modal } from './Modal';
import { Button } from './Button';

export const ConfirmDialog = ({
  isOpen, onClose, onConfirm,
  title = 'Are you sure?',
  message = 'This action cannot be undone.',
  confirmText = 'Confirm',
  cancelText  = 'Cancel',
  type = 'danger',   // 'danger' | 'safe' | 'warn'
  loading = false,
}) => (
  <Modal isOpen={isOpen} onClose={onClose} title={title} className="max-w-sm">
    <div className="space-y-5">
      <div className="flex items-start gap-4">
        <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${
          type === 'danger' ? 'bg-primary/10' : type === 'safe' ? 'bg-safe/10' : 'bg-warn/10'
        }`}>
          <AlertTriangle className={`w-5 h-5 ${
            type === 'danger' ? 'text-primary' : type === 'safe' ? 'text-safe' : 'text-warn'
          }`} />
        </div>
        <p className="text-sm text-text-secondary leading-relaxed">{message}</p>
      </div>
      <div className="flex gap-3">
        <Button variant="secondary" className="flex-1" onClick={onClose} disabled={loading}>
          {cancelText}
        </Button>
        <Button
          variant={type === 'danger' ? 'primary' : type}
          className="flex-1"
          onClick={onConfirm}
          loading={loading}
        >
          {confirmText}
        </Button>
      </div>
    </div>
  </Modal>
);

export default ConfirmDialog;
