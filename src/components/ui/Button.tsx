import React from 'react';
import { LucideIcon } from 'lucide-react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'icon' | 'outline' | 'destructive';
  size?: 'sm' | 'md' | 'lg';
  icon?: LucideIcon;
  loading?: boolean;
  children?: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'md',
  icon: Icon,
  loading = false,
  children,
  className = '',
  disabled,
  ...props
}) => {
  const baseClasses = 'inline-flex items-center justify-center gap-2 font-semibold rounded-lg transition-all duration-200 cursor-pointer relative overflow-hidden touch-manipulation';
  
  const variantClasses = {
    primary: 'btn bg-gradient-to-r from-accent to-accent-hover text-white shadow-custom hover:-translate-y-0.5 hover:shadow-custom-lg hover:brightness-110',
    secondary: 'btn-secondary bg-panel text-text border-2 border-border shadow-none hover:bg-panel-2 hover:border-accent hover:text-accent hover:shadow-custom',
    danger: 'btn-danger bg-gradient-to-r from-danger to-danger shadow-custom hover:shadow-custom-lg hover:brightness-110',
    destructive: 'btn-danger bg-gradient-to-r from-red-500 to-red-600 text-white shadow-custom hover:shadow-custom-lg hover:brightness-110',
    outline: 'btn-secondary bg-transparent text-text border-2 border-border shadow-none hover:bg-panel-2 hover:border-accent hover:text-accent hover:shadow-custom',
    icon: 'btn-icon bg-panel border border-border text-text hover:bg-panel-2 hover:border-accent hover:-translate-y-0.5 hover:shadow-custom'
  };

  const sizeClasses = {
    sm: 'px-3 py-2 text-xs min-h-[36px] sm:min-h-[28px]',
    md: 'px-4 py-2 text-sm min-h-[44px] sm:min-h-[36px]',
    lg: 'px-6 py-3 text-base min-h-[48px] sm:min-h-[44px]'
  };

  const classes = `${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${className}`;

  return (
    <button
      className={classes}
      disabled={disabled || loading}
      {...props}
    >
      {loading && (
        <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
      )}
      {Icon && !loading && <Icon size={16} />}
      {children}
    </button>
  );
};

