import React from 'react';
import { FileX } from 'lucide-react';

export const EmptyState = ({
  icon: Icon = FileX,
  title = 'No data found',
  message = '',
  action = null,
  className = '',
}) => (
  <div className={`flex flex-col items-center justify-center py-16 text-center gap-3 ${className}`}>
    <div className="w-16 h-16 rounded-full bg-surface-2 border border-border flex items-center justify-center">
      <Icon className="w-8 h-8 text-text-muted" />
    </div>
    <div>
      <p className="font-display font-bold text-base text-text-primary">{title}</p>
      {message && <p className="text-sm text-text-secondary mt-1 max-w-xs mx-auto">{message}</p>}
    </div>
    {action}
  </div>
);

export default EmptyState;
