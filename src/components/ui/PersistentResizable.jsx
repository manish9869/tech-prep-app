import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Maximize2, Minimize2, GripHorizontal } from 'lucide-react';

/**
 * PersistentResizable — a freely resizable container that persists
 * its width + height to the database via onSizeChange callback.
 *
 * Props:
 *  - widgetId: unique string key (used for storage)
 *  - savedSize: { width?: number, height?: number } from DB
 *  - onSizeChange: (widgetId, {width, height}) => void
 *  - defaultWidth: number | null (null = 100%)
 *  - defaultHeight: number
 *  - minWidth: number
 *  - maxWidth: number
 *  - minHeight: number
 *  - maxHeight: number
 *  - title: string
 *  - icon: React component
 *  - accentColor: string (css color)
 *  - children: (height) => ReactNode  OR  ReactNode
 *  - className: string
 */
export default function PersistentResizable({
    widgetId,
    savedSize = {},
    onSizeChange,
    defaultHeight = 260,
    minWidth = 280,
    maxWidth = 2400,
    minHeight = 120,
    maxHeight = 800,
    title,
    icon: Icon,
    accentColor = '#22c55e',
    children,
    className = '',
}) {
    const [height, setHeight] = useState(savedSize?.height || defaultHeight);
    const [fullscreen, setFullscreen] = useState(false);
    const [isDragging, setIsDragging] = useState(false);

    const containerRef = useRef(null);
    const dragStartY = useRef(0);
    const dragStartH = useRef(0);
    const saveTimer = useRef(null);

    // Sync from DB when savedSize changes (initial load)
    useEffect(() => {
        if (savedSize?.height && !isDragging) {
            setHeight(savedSize.height);
        }
    }, [savedSize?.height]);

    const triggerSave = useCallback((newH) => {
        if (!onSizeChange) return;
        clearTimeout(saveTimer.current);
        saveTimer.current = setTimeout(() => {
            onSizeChange(widgetId, { height: newH });
        }, 800); // debounce 800ms
    }, [onSizeChange, widgetId]);

    const onDragStart = useCallback((e) => {
        e.preventDefault();
        setIsDragging(true);
        dragStartY.current = e.clientY;
        dragStartH.current = height;

        const onMove = (ev) => {
            const delta = ev.clientY - dragStartY.current;
            const newH = Math.max(minHeight, Math.min(maxHeight, dragStartH.current + delta));
            setHeight(newH);
        };

        const onUp = (ev) => {
            setIsDragging(false);
            const delta = ev.clientY - dragStartY.current;
            const finalH = Math.max(minHeight, Math.min(maxHeight, dragStartH.current + delta));
            setHeight(finalH);
            triggerSave(finalH);
            document.removeEventListener('mousemove', onMove);
            document.removeEventListener('mouseup', onUp);
        };

        document.addEventListener('mousemove', onMove);
        document.addEventListener('mouseup', onUp);
    }, [height, minHeight, maxHeight, triggerSave]);

    const displayHeight = fullscreen ? undefined : height;

    const inner = (
        <div
            ref={containerRef}
            className={`glass rounded-2xl border border-white/5 overflow-hidden flex flex-col ${fullscreen ? 'fixed inset-4 z-[60]' : ''} ${className}`}
        >
            {/* Header */}
            <div className="flex items-center justify-between px-5 pt-4 pb-2 flex-shrink-0 gap-2">
                <h3 className="font-semibold flex items-center gap-2 text-sm truncate">
                    {Icon && <Icon className="w-4 h-4 flex-shrink-0" style={{ color: accentColor }} />}
                    <span className="truncate">{title}</span>
                </h3>
                <div className="flex items-center gap-2 flex-shrink-0">
                    {!fullscreen && (
                        <span className="text-[10px] text-muted-foreground/40 select-none hidden sm:block">
                            {height}px · drag ↕ to resize
                        </span>
                    )}
                    <button
                        onClick={() => setFullscreen(f => !f)}
                        className="text-muted-foreground hover:text-white transition-colors p-1 rounded-lg hover:bg-white/5"
                    >
                        {fullscreen ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
                    </button>
                </div>
            </div>

            {/* Content */}
            <div
                className={`px-4 pb-2 flex-1 overflow-hidden ${fullscreen ? 'overflow-auto' : ''}`}
                style={fullscreen ? {} : { height }}
            >
                {typeof children === 'function'
                    ? children(fullscreen ? undefined : height - 8)
                    : children}
            </div>

            {/* Drag handle — bottom */}
            {!fullscreen && (
                <div
                    onMouseDown={onDragStart}
                    className={`flex items-center justify-center h-5 cursor-row-resize group transition-colors flex-shrink-0 ${isDragging ? 'bg-white/8' : 'hover:bg-white/5'}`}
                    title="Drag to resize (saves automatically)"
                >
                    <GripHorizontal className="w-5 h-5 text-muted-foreground/25 group-hover:text-muted-foreground/60 transition-colors" />
                </div>
            )}
        </div>
    );

    return (
        <>
            {inner}
            {fullscreen && (
                <div className="fixed inset-0 bg-black/70 z-50" onClick={() => setFullscreen(false)} />
            )}
        </>
    );
}


