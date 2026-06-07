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
      className={`bg-surface-2 border rounded-md px-3 py-2.5 text-sm text-text-primary placeholder-text-muted focus:outline-none transition-all
        ${error ? 'border-primary focus:border-primary' : 'border-border focus:border-accent'}
        ${inputClassName}`}
      {...props}
    />
    {error && <p className="text-xs text-primary">{error}</p>}
    {hint && !error && <p className="text-xs text-text-muted">{hint}</p>}
  </div>
);

export default Input;
