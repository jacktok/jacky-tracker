import React, { forwardRef } from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helper?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(({
  label,
  error,
  helper,
  className = '',
  ...props
}, ref) => {
  return (
    <div className="space-y-1">
      {label && (
        <label className="text-sm font-semibold text-text-secondary">
          {label}
        </label>
      )}
      <input
        ref={ref}
        className={`input ${error ? 'border-danger' : ''} ${className}`}
        {...props}
      />
      {error && (
        <p className="text-xs text-danger">{error}</p>
      )}
      {helper && !error && (
        <p className="text-xs text-text-muted">{helper}</p>
      )}
    </div>
  );
});

