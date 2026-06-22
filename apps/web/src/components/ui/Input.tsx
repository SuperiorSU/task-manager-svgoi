import React from 'react';
import { AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

type Props = React.InputHTMLAttributes<HTMLInputElement> & {
  label?: string;
  error?: string;
  leftIcon?: React.ReactNode;
};

export const Input = React.forwardRef<HTMLInputElement, Props>(
  ({ label, error, leftIcon, className, id, ...rest }, ref) => {
    const inputId = id ?? label?.toLowerCase().replace(/\s+/g, '-');
    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label htmlFor={inputId} className="text-sm font-medium text-slate-700">
            {label}
          </label>
        )}
        <div className="relative">
          {leftIcon && (
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
              {leftIcon}
            </span>
          )}
          <input
            ref={ref}
            id={inputId}
            className={cn(
              'h-10 w-full rounded-lg border bg-white px-3 text-sm text-slate-900 placeholder-slate-400',
              'transition-colors focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500',
              error
                ? 'border-red-400 focus:ring-red-400'
                : 'border-surface-border hover:border-slate-300',
              leftIcon && 'pl-9',
              className
            )}
            {...rest}
          />
        </div>
        {error && (
          <div className="flex items-center gap-1.5 text-sm text-red-600">
            <AlertCircle className="h-3.5 w-3.5 shrink-0" />
            {error}
          </div>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';
