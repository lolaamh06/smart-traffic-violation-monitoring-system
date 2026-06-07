import React from 'react';

export const Spinner = ({ size = 'md', className = '' }) => {
  const sizes = { sm: 'w-4 h-4', md: 'w-7 h-7', lg: 'w-12 h-12' };
  return (
    <div className={`inline-flex flex-col items-center gap-3 ${className}`}>
      <svg
        className={`animate-spin text-accent ${sizes[size]}`}
        fill="none"
        viewBox="0 0 24 24"
      >
        <circle className="opacity-20" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
        <path className="opacity-80" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
      </svg>
      {size === 'lg' && (
        <p className="text-xs text-text-secondary font-medium animate-pulse">Loading…</p>
      )}
    </div>
  );
};

export default Spinner;
