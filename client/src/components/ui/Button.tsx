import React from 'react';
import { Loader2 } from 'lucide-react';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger' | 'success';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  isLoading = false,
  leftIcon,
  rightIcon,
  className = '',
  disabled,
  ...props
}) => {
  const baseStyles = 'inline-flex items-center justify-center font-medium transition-all duration-150 rounded-xl focus:outline-none focus:ring-2 focus:ring-offset-1 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer';

  const sizeStyles = {
    sm: 'text-xs px-3 py-1.5 gap-1.5',
    md: 'text-sm px-4 py-2.5 gap-2',
    lg: 'text-base px-5 py-3 gap-2.5',
  };

  const variantStyles = {
    primary: 'bg-[#3568ed] text-white hover:bg-[#2555d4] shadow-[0_4px_14px_rgba(53,104,237,0.25)] focus:ring-[#3568ed]',
    secondary: 'bg-[#edf2fe] text-[#2b59d9] hover:bg-[#e0e8fd] focus:ring-[#3568ed]',
    outline: 'border border-[#d7e0f2] bg-white text-[#344054] hover:bg-[#f8faff] hover:border-[#b8c9ec] focus:ring-[#3568ed]',
    ghost: 'text-[#475467] hover:bg-[#f2f5fc] hover:text-[#1d2939] focus:ring-[#3568ed]',
    danger: 'bg-[#ef4444] text-white hover:bg-[#dc2626] shadow-[0_4px_14px_rgba(239,68,68,0.25)] focus:ring-[#ef4444]',
    success: 'bg-[#10b981] text-white hover:bg-[#059669] shadow-[0_4px_14px_rgba(16,185,129,0.25)] focus:ring-[#10b981]',
  };

  return (
    <button
      className={`${baseStyles} ${sizeStyles[size]} ${variantStyles[variant]} ${className}`}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        leftIcon && <span className="shrink-0">{leftIcon}</span>
      )}
      <span>{children}</span>
      {!isLoading && rightIcon && <span className="shrink-0">{rightIcon}</span>}
    </button>
  );
};
