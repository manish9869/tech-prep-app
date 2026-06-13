import React, { useEffect, useState } from 'react';

export default function AnimatedCounter({ value, duration = 1500, prefix = '', suffix = '', className = '' }) {
    const [display, setDisplay] = useState(0);

    useEffect(() => {
        const target = Number(value) || 0;
        const start = display;
        const diff = target - start;
        const startTime = Date.now();

        const tick = () => {
            const elapsed = Date.now() - startTime;
            const progress = Math.min(elapsed / duration, 1);
            const eased = 1 - Math.pow(1 - progress, 3);
            setDisplay(Math.round(start + diff * eased));
            if (progress < 1) requestAnimationFrame(tick);
        };
        requestAnimationFrame(tick);
    }, [value]);

    return (
        <span className={className}>
            {prefix}{display.toLocaleString()}{suffix}
        </span>
    );
}


