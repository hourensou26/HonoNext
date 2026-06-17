import type { HTMLAttributes } from 'react';

import { cn } from '@/shared/lib/cn';

export const Card = ({ className, ...props }: HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn('rounded-2xl border border-slate-200 bg-white p-6 shadow-sm', className)}
    {...props}
  />
);
