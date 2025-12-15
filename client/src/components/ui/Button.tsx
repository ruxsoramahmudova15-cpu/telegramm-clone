import React, { ButtonHTMLAttributes, forwardRef } from 'react';
import { Loader2 } from 'lucide-react';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ children, variant = 'primary', size = 'md', isLoading, className = '', disabled, ...props }, ref) => {
    const baseStyles = `
      font-semibold rounded-xl transition-all duration-200
      flex items-center justify-center gap-2
      disabled:opacity-50 disabled:cursor-not-allowed
    `;

    const variants = {
      primary: 'bg-telegram-blue hover:bg-telegram-blue-dark text-white shadow-lg shadow-telegram-blue/25',
      secondary: 'bg-telegram-bg-lighter hover:bg-telegram-bg-light text-telegram-text',
      outline: 'border-2 border-telegram-blue text-telegram-blue hover:bg-telegram-blue hover:text-white'
    };

    const sizes = {
      sm: 'px-4 py-2 text-sm',
      md: 'px-6 py-3.5 text-base',
      lg: 'px-8 py-4 text-lg'
    };

    return (
      <button
        ref={ref}
        className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`}
        disabled={disabled || isLoading}
        {...props}
      >
        {isLoading && <Loader2 className="animate-spin" size={20} />}
        {children}
      </button>
    );
  }
);

Button.displayName = 'Button';