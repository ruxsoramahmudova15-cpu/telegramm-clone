import React, { InputHTMLAttributes, forwardRef } from 'react';
import { LucideIcon } from 'lucide-react';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  icon?: LucideIcon;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, icon: Icon, className = '', ...props }, ref) => {
    return (
      <div className="w-full">
        {label && (
          <label className="block text-sm font-medium text-telegram-text-secondary mb-2">
            {label}
          </label>
        )}
        <div className="relative">
          {Icon && (
            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-telegram-text-secondary">
              <Icon size={20} />
            </div>
          )}
          <input
            ref={ref}
            className={`
              w-full px-4 py-3.5 rounded-xl
              bg-telegram-bg-lighter border-2 border-transparent
              text-telegram-text placeholder-telegram-text-secondary
              focus:border-telegram-blue focus:bg-telegram-bg-light
              transition-all duration-200
              ${Icon ? 'pl-12' : ''}
              ${error ? 'border-telegram-error' : ''}
              ${className}
            `}
            {...props}
          />
        </div>
        {error && (
          <p className="mt-2 text-sm text-telegram-error">{error}</p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';