import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

export default function GlassCard({ children, className, glowColor = 'green', animate = true, ...props }) {
    const glowClasses = {
        green: 'hover:shadow-[0_0_30px_hsl(142_71%_45%/0.15)]',
        blue: 'hover:shadow-[0_0_30px_hsl(217_91%_60%/0.15)]',
        purple: 'hover:shadow-[0_0_30px_hsl(270_70%_60%/0.15)]',
        none: '',
    };

    const Component = animate ? motion.div : 'div';
    const animateProps = animate ? {
        initial: { opacity: 0, y: 20 },
        animate: { opacity: 1, y: 0 },
        transition: { duration: 0.5 },
    } : {};

    return (
        <Component
            className={cn(
                'glass rounded-2xl p-6 transition-all duration-300',
                glowClasses[glowColor],
                className
            )}
            {...animateProps}
            {...props}
        >
            {children}
        </Component>
    );
}


