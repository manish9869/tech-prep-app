import { useState, useCallback, useRef } from 'react';
import { cn } from '@/lib/utils';

const MIN_W = 180;
const MIN_H = 100;

/**
 * ResizableWidget — drag any edge or corner to resize.
 * Works in a flex-wrap parent: width is set in px so siblings reflow naturally.
 *
 * Props:
 *   defaultHeight  – initial height (px)
 *   defaultWidth   – initial width (px); omit to let CSS control width
 *   children       – render-prop fn(height) or regular children
 *   className      – extra classes
 */
export default function ResizableWidget({ children, defaultHeight = 300, defaultWidth, className }) {
    const [size, setSize] = useState({ w: defaultWidth ?? null, h: defaultHeight });
    const ref = useRef(null);
    const drag = useRef(null);

    const onMouseDown = useCallback((e, dir) => {
        e.preventDefault();
        e.stopPropagation();
        const rect = ref.current.getBoundingClientRect();
        drag.current = { dir, startX: e.clientX, startY: e.clientY, startW: rect.width, startH: rect.height };

        const move = (ev) => {
            if (!drag.current) return;
            const { dir: d, startX, startY, startW, startH } = drag.current;
            const dx = ev.clientX - startX;
            const dy = ev.clientY - startY;
            setSize(prev => {
                const w = prev.w;
                const h = prev.h;
                return {
                    w: d.includes('e') ? Math.max(MIN_W, startW + dx)
                        : d.includes('w') ? Math.max(MIN_W, startW - dx)
                            : w,
                    h: d.includes('s') ? Math.max(MIN_H, startH + dy)
                        : d.includes('n') ? Math.max(MIN_H, startH - dy)
                            : h,
                };
            });
        };

        const up = () => {
            drag.current = null;
            window.removeEventListener('mousemove', move);
            window.removeEventListener('mouseup', up);
        };
        window.addEventListener('mousemove', move);
        window.addEventListener('mouseup', up);
    }, []);

    const edge = 'absolute z-10 opacity-0 group-hover/rw:opacity-100 transition-opacity';

    return (
        <div
            ref={ref}
            style={{ height: size.h, width: size.w ?? undefined }}
            className={cn('relative overflow-hidden flex flex-col group/rw', className)}
        >
            <div className="flex-1 overflow-hidden min-h-0">
                {typeof children === 'function' ? children(size.h) : children}
            </div>

            {/* Edge handles */}
            <div className={cn(edge, 'bottom-0 left-3 right-3 h-2 cursor-s-resize flex items-end justify-center pb-0.5')}
                onMouseDown={e => onMouseDown(e, 's')}>
                <div className="w-10 h-1 rounded-full bg-white/30" />
            </div>
            <div className={cn(edge, 'top-3 bottom-3 right-0 w-2 cursor-e-resize')} onMouseDown={e => onMouseDown(e, 'e')} />
            <div className={cn(edge, 'top-3 bottom-3 left-0 w-2 cursor-w-resize')} onMouseDown={e => onMouseDown(e, 'w')} />
            <div className={cn(edge, 'top-0 left-3 right-3 h-2 cursor-n-resize')} onMouseDown={e => onMouseDown(e, 'n')} />

            {/* Corner handles */}
            <div className={cn(edge, 'top-0 left-0 w-3 h-3 cursor-nw-resize')} onMouseDown={e => onMouseDown(e, 'nw')} />
            <div className={cn(edge, 'top-0 right-0 w-3 h-3 cursor-ne-resize')} onMouseDown={e => onMouseDown(e, 'ne')} />
            <div className={cn(edge, 'bottom-0 left-0 w-3 h-3 cursor-sw-resize')} onMouseDown={e => onMouseDown(e, 'sw')} />

            {/* SE corner grip icon */}
            <div
                className="absolute bottom-0 right-0 w-4 h-4 cursor-se-resize z-20 opacity-0 group-hover/rw:opacity-60 transition-opacity"
                onMouseDown={e => onMouseDown(e, 'se')}
            >
                <svg viewBox="0 0 16 16" className="w-full h-full text-muted-foreground">
                    <path d="M14 14L8 14M14 14L14 8M14 14L10 10" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round" />
                </svg>
            </div>
        </div>
    );
}


