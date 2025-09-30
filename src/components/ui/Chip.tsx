import React from 'react';

interface ChipProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  active?: boolean;
  variant?: 'default' | 'category';
  children: React.ReactNode;
}

export const Chip: React.FC<ChipProps> = ({
  active = false,
  variant = 'default',
  children,
  className = '',
  ...props
}) => {
  const baseClasses = 'chip';
  const variantClasses = variant === 'category' ? 'chip-category' : '';
  const activeClasses = active && variant === 'category' ? 'chip-active' : '';
  
  const classes = `${baseClasses} ${variantClasses} ${activeClasses} ${className}`;

  return (
    <button
      type="button"
      className={classes}
      {...props}
    >
      {children}
    </button>
  );
};

