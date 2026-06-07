import React from 'react';

const VARIANTS = {
  default: 'bg-surface-2 text-text-secondary border-border',
  primary: 'bg-surface-2 text-text-secondary border-border',
  danger:  'bg-primary/10 text-primary border-primary/30',
  warn:    'bg-warn/10 text-warn border-warn/30',
  safe:    'bg-safe/10 text-safe border-safe/30',
  accent:  'bg-accent/10 text-accent border-accent/30',
  info:    'bg-info/10 text-info border-info/30',
};

export const Badge = ({ children, variant = 'default', className = '' }) => {
  const cls = VARIANTS[variant] || VARIANTS.default;
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold border ${cls} ${className}`}>
      {children}
    </span>
  );
};

export default Badge;
