import React from 'react';

interface BadgeProps {
  variant?: 'default' | 'category';
  children: React.ReactNode;
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({
  variant = 'default',
  children,
  className = ''
}) => {
  const baseClasses = 'badge';
  const variantClasses = variant === 'category' ? 'badge-category' : '';
  
  const classes = `${baseClasses} ${variantClasses} ${className}`;

  return (
    <span className={classes}>
      {children}
    </span>
  );
};

