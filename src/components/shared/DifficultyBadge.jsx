import React from 'react';
import { cn } from '@/lib/utils';

const configs = {
    basic: { label: 'Basic', className: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20' },
    medium: { label: 'Medium', className: 'bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20' },
    experienced: { label: 'Experienced', className: 'bg-red-500/10 text-red-700 dark:text-red-400 border-red-500/20' },
};

export default function DifficultyBadge({ level, className }) {
    const cfg = configs[level] || configs.basic;
    return (
        <span className={cn('inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold border uppercase tracking-wide', cfg.className, className)}>
            {cfg.label}
        </span>
    );
}