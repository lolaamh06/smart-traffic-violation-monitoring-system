import React from 'react';

export const Input = ({
  label, error, hint, className = '', inputClassName = '',
  type = 'text', ...props
}) => (
  <div className={`flex flex-col gap-1 ${className}`}>
    {label && (
      <label className="text-xs font-semibold text-text-secondary font-display uppercase tracking-wider">
        {label}
      </label>
    )}
    <input
      type={type}
      className={`bg-surface-2 border rounded-xl px-4 py-3.5 text-sm text-text-primary placeholder-text-muted focus:outline-none transition-all duration-200
        ${error ? 'border-primary focus:border-primary shadow-glow-primary/10' : 'border-border focus:border-accent focus:shadow-glow-accent/10'}
        ${inputClassName}`}
      {...props}
    />
    {error && <p className="text-xs text-primary">{error}</p>}
    {hint && !error && <p className="text-xs text-text-muted">{hint}</p>}
  </div>
);

export default Input;
