import * as React from 'react';
import { cn } from '../../utils/cn';

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'secondary' | 'destructive' | 'outline' | 'success' | 'warning';
}

function Badge({ className, variant = 'default', ...props }: BadgeProps) {
  return (
    <div
      className={cn(
        'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2',
        {
          'border-transparent bg-blue-600 text-white hover:bg-blue-700': variant === 'default',
          'border-transparent bg-gray-100 text-gray-900 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-100': variant === 'secondary',
          'border-transparent bg-red-500 text-white hover:bg-red-600': variant === 'destructive',
          'text-gray-900 dark:text-gray-100': variant === 'outline',
          'border-transparent bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100': variant === 'success',
          'border-transparent bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-100': variant === 'warning',
        },
        className
      )}
      {...props}
    />
  );
}

export { Badge };
