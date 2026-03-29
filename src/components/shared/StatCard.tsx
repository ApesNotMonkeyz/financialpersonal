import { type LucideIcon } from 'lucide-react';
import { Card, CardContent } from '../ui/card';
import { cn } from '../../utils/cn';

interface StatCardProps {
  title: string;
  value: string;
  subtitle?: string;
  icon?: LucideIcon;
  iconColor?: string;
  valueColor?: string;
  trend?: 'up' | 'down' | 'neutral';
}

export function StatCard({ title, value, subtitle, icon: Icon, iconColor, valueColor, trend }: StatCardProps) {
  return (
    <Card>
      <CardContent className="p-5">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">{title}</p>
            <p className={cn('text-2xl font-bold mt-1 tracking-tight', valueColor ?? 'text-gray-900 dark:text-gray-100')}>
              {value}
            </p>
            {subtitle && (
              <p className={cn(
                'text-xs mt-1',
                trend === 'up' ? 'text-green-600 dark:text-green-400' :
                trend === 'down' ? 'text-red-500 dark:text-red-400' :
                'text-gray-500 dark:text-gray-400'
              )}>
                {subtitle}
              </p>
            )}
          </div>
          {Icon && (
            <div className={cn('p-2 rounded-lg', iconColor ?? 'bg-blue-50 dark:bg-blue-900/20')}>
              <Icon className={cn('h-5 w-5', iconColor ? 'text-white' : 'text-blue-600 dark:text-blue-400')} />
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
