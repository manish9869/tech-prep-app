import React from 'react';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';

export default function EmptyState({ icon: Icon, title, description, action, className }) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className={cn('flex flex-col items-center justify-center py-20 px-4 text-center', className)}
        >
            {Icon && (
                <div className="w-20 h-20 rounded-3xl bg-primary/10 flex items-center justify-center mb-5 ring-1 ring-primary/20">
                    <Icon className="w-10 h-10 text-primary" />
                </div>
            )}
            <h3 className="text-xl font-semibold text-foreground">{title}</h3>
            {description && <p className="text-sm text-muted-foreground mt-2 max-w-sm">{description}</p>}
            {action && <div className="mt-6">{action}</div>}
        </motion.div>
    );
}