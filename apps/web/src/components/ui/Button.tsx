import React from 'react';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

const variants = {
  primary: 'bg-brand-500 text-white hover:bg-brand-600 focus-visible:ring-brand-500',
  secondary: 'border border-brand-500 text-brand-500 hover:bg-brand-50 focus-visible:ring-brand-500',
  danger: 'bg-red-600 text-white hover:bg-red-700 focus-visible:ring-red-500',
  ghost: 'text-brand-500 hover:bg-brand-50 focus-visible:ring-brand-500',
  muted: 'bg-surface-subtle text-slate-600 hover:bg-surface-border focus-visible:ring-slate-400',
};

const sizes = {
  sm: 'h-8 px-3 text-sm',
  md: 'h-10 px-4 text-sm',
  lg: 'h-11 px-6 text-base',
};

type Props = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: keyof typeof variants;
  size?: keyof typeof sizes;
  loading?: boolean;
  leftIcon?: React.ReactNode;
  asChild?: boolean;
};

export const Button = React.forwardRef<HTMLButtonElement, Props>(
  ({ variant = 'primary', size = 'md', loading, leftIcon, className, children, disabled, asChild, ...rest }, ref) => {
    const baseClass = cn(
      'inline-flex items-center justify-center gap-2 rounded-lg font-medium transition-colors',
      'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2',
      'disabled:pointer-events-none disabled:opacity-50',
      variants[variant],
      sizes[size],
      className
    );
    const content = (
      <>
        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : leftIcon}
        {children}
      </>
    );

    if (asChild && React.isValidElement(children)) {
      return React.cloneElement(children as React.ReactElement<{ className?: string }>, {
        className: cn(baseClass, (children as React.ReactElement<{ className?: string }>).props.className),
      });
    }

    return (
      <button ref={ref} disabled={disabled ?? loading} className={baseClass} {...rest}>
        {content}
      </button>
    );
  }
);

Button.displayName = 'Button';
