import React from 'react';

interface BadgeProps {
  variant?: 'default' | 'category' | 'secondary' | 'outline';
  children: React.ReactNode;
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({
  variant = 'default',
  children,
  className = ''
}) => {
  const baseClasses = 'badge';
  const variantClasses = {
    default: '',
    category: 'badge-category',
    secondary: 'badge-secondary',
    outline: 'badge-outline'
  }[variant];
  
  const classes = `${baseClasses} ${variantClasses} ${className}`;

  return (
    <span className={classes}>
      {children}
    </span>
  );
};

