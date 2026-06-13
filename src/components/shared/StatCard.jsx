import React from 'react';
import { motion } from 'framer-motion';

const colorMap = {
    primary: { bg: 'bg-primary/8', text: 'text-primary', icon: 'text-primary', border: 'border-primary/20' },
    blue: { bg: 'bg-blue-500/8', text: 'text-blue-600 dark:text-blue-400', icon: 'text-blue-500', border: 'border-blue-500/20' },
    success: { bg: 'bg-emerald-500/8', text: 'text-emerald-600 dark:text-emerald-400', icon: 'text-emerald-500', border: 'border-emerald-500/20' },
    warning: { bg: 'bg-amber-500/8', text: 'text-amber-600 dark:text-amber-400', icon: 'text-amber-500', border: 'border-amber-500/20' },
    violet: { bg: 'bg-violet-500/8', text: 'text-violet-600 dark:text-violet-400', icon: 'text-violet-500', border: 'border-violet-500/20' },
    orange: { bg: 'bg-orange-500/8', text: 'text-orange-600 dark:text-orange-400', icon: 'text-orange-500', border: 'border-orange-500/20' },
};

export default function StatCard({ title, value, icon: Icon, color = 'primary', delay = 0, trend, trendUp }) {
    const c = colorMap[color] || colorMap.primary;

    return (
        <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay, duration: 0.3 }}
            className={`bg-card border border-border p-5 group hover:border-primary/40 transition-colors duration-200 relative overflow-hidden`}
        >
            {/* top accent line */}
            <div className={`absolute top-0 left-0 right-0 h-0.5 ${c.bg} opacity-0 group-hover:opacity-100 transition-opacity`}
                style={{ background: `currentColor` }} />
            <div className="absolute top-0 left-0 w-0.5 h-full opacity-0 group-hover:opacity-100 transition-opacity"
                style={{ background: `hsl(var(--primary))` }} />

            <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                    <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-muted-foreground mb-2">{title}</p>
                    <p className={`text-3xl font-black font-heading leading-none ${c.text}`}>{value}</p>
                    {trend !== undefined && (
                        <p className={`text-xs mt-1.5 font-medium ${trendUp ? 'text-emerald-500' : 'text-muted-foreground'}`}>
                            {trendUp ? '↑' : '→'} {trend}
                        </p>
                    )}
                </div>
                <div className={`p-2.5 ${c.bg} flex-shrink-0`}>
                    <Icon className={`w-5 h-5 ${c.icon}`} />
                </div>
            </div>
        </motion.div>
    );
}