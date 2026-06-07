import React from 'react';

const VARIANTS = {
  primary:   'bg-primary/10 border border-primary/30 text-primary hover:bg-primary hover:text-white',
  secondary: 'bg-surface-2 border border-border text-text-secondary hover:border-accent/50 hover:text-text-primary',
  safe:      'bg-safe/10 border border-safe/30 text-safe hover:bg-safe hover:text-white',
  warn:      'bg-warn/10 border border-warn/30 text-warn hover:bg-warn hover:text-white',
  accent:    'bg-accent/10 border border-accent/30 text-accent hover:bg-accent hover:text-white',
  ghost:     'bg-transparent border-transparent text-text-secondary hover:text-text-primary hover:bg-surface-2',
};

export const Button = ({
  children, variant = 'primary', className = '',
  loading = false, disabled = false, type = 'button',
  onClick, ...props
}) => {
  const base = 'inline-flex items-center justify-center gap-2 px-4 py-2 rounded-md text-sm font-semibold font-display transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-accent/40 disabled:opacity-50 disabled:cursor-not-allowed';
  const variantClass = VARIANTS[variant] || VARIANTS.primary;

  return (
    <button
      type={type}
      disabled={disabled || loading}
      onClick={onClick}
      className={`${base} ${variantClass} ${className}`}
      {...props}
    >
      {loading ? (
        <>
          <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          <span>Processing…</span>
        </>
      ) : children}
    </button>
  );
};

export default Button;
