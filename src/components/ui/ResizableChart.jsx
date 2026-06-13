import React, { useState, useRef, useCallback } from 'react';
import { Maximize2, Minimize2, GripVertical } from 'lucide-react';

const SIZES = [
    { label: 'S', height: 140 },
    { label: 'M', height: 220 },
    { label: 'L', height: 320 },
    { label: 'XL', height: 450 },
];

const ACCENT_CLASSES = {
    emerald: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30',
    blue: 'text-blue-400 bg-blue-500/10 border-blue-500/30',
    purple: 'text-purple-400 bg-purple-500/10 border-purple-500/30',
    orange: 'text-orange-400 bg-orange-500/10 border-orange-500/30',
    pink: 'text-pink-400 bg-pink-500/10 border-pink-500/30',
    yellow: 'text-yellow-400 bg-yellow-500/10 border-yellow-500/30',
};

export default function ResizableChart({
    title,
    icon: IconComponent,
    children,
    defaultSize = 'M',
    accentColor = 'emerald',
    className = '',
}) {
    const [sizeIdx, setSizeIdx] = useState(SIZES.findIndex(s => s.label === defaultSize) ?? 1);
    const [customHeight, setCustomHeight] = useState(null); // null = use preset
    const [fullscreen, setFullscreen] = useState(false);
    const [isDragging, setIsDragging] = useState(false);
    const containerRef = useRef(null);
    const dragStartY = useRef(0);
    const dragStartH = useRef(0);

    const Icon = IconComponent;
    const presetHeight = SIZES[sizeIdx].height;
    const chartHeight = customHeight ?? presetHeight;

    const accent = ACCENT_CLASSES[accentColor] || ACCENT_CLASSES.emerald;
    const accentText = accent.split(' ')[0]; // just the text color

    // --- drag-to-resize ---
    const onDragStart = useCallback((e) => {
        e.preventDefault();
        setIsDragging(true);
        dragStartY.current = e.clientY;
        dragStartH.current = customHeight ?? presetHeight;

        const onMove = (ev) => {
            const delta = ev.clientY - dragStartY.current;
            const newH = Math.max(100, Math.min(700, dragStartH.current + delta));
            setCustomHeight(newH);
        };
        const onUp = () => {
            setIsDragging(false);
            document.removeEventListener('mousemove', onMove);
            document.removeEventListener('mouseup', onUp);
        };
        document.addEventListener('mousemove', onMove);
        document.addEventListener('mouseup', onUp);
    }, [customHeight, presetHeight]);

    const handleSizeSelect = (i) => {
        setSizeIdx(i);
        setCustomHeight(null); // reset free resize
        setFullscreen(false);
    };

    const contentHeight = fullscreen ? undefined : chartHeight;

    const inner = (
        <div
            ref={containerRef}
            className={`glass rounded-2xl border border-white/5 overflow-hidden flex flex-col ${fullscreen ? 'fixed inset-4 z-[60]' : ''} ${className}`}
            style={fullscreen ? {} : {}}
        >
            {/* Header */}
            <div className="flex items-center justify-between px-5 pt-4 pb-2 flex-shrink-0 gap-2">
                <h3 className="font-semibold flex items-center gap-2 text-sm min-w-0 truncate">
                    {Icon && <Icon className={`w-4 h-4 flex-shrink-0 ${accentText}`} />}
                    <span className="truncate">{title}</span>
                </h3>

                <div className="flex items-center gap-1.5 flex-shrink-0">
                    {/* Size pills */}
                    <div className="flex items-center glass rounded-lg px-1 py-0.5 border border-white/5">
                        {SIZES.map((s, i) => (
                            <button
                                key={s.label}
                                onClick={() => handleSizeSelect(i)}
                                className={`text-[10px] font-bold px-2 py-0.5 rounded transition-all ${sizeIdx === i && !customHeight
                                    ? `${accent} border`
                                    : 'text-muted-foreground/50 hover:text-muted-foreground'
                                    }`}
                            >
                                {s.label}
                            </button>
                        ))}
                    </div>

                    {/* Free resize indicator */}
                    {customHeight && (
                        <span className="text-[10px] text-muted-foreground/60 px-1">{customHeight}px</span>
                    )}

                    {/* Fullscreen toggle */}
                    <button
                        onClick={() => setFullscreen(f => !f)}
                        className="text-muted-foreground hover:text-white transition-colors p-1 rounded-lg hover:bg-white/5"
                    >
                        {fullscreen ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
                    </button>
                </div>
            </div>

            {/* Chart area */}
            <div
                className={`px-4 pb-2 flex-1 ${fullscreen ? 'overflow-auto' : ''}`}
                style={fullscreen ? {} : { height: chartHeight }}
            >
                {typeof children === 'function'
                    ? children({ height: fullscreen ? undefined : chartHeight - 8 })
                    : children}
            </div>

            {/* Drag handle */}
            {!fullscreen && (
                <div
                    onMouseDown={onDragStart}
                    className={`flex items-center justify-center h-5 cursor-row-resize hover:bg-white/5 transition-colors flex-shrink-0 ${isDragging ? 'bg-white/5' : ''}`}
                >
                    <GripVertical className="w-4 h-4 text-muted-foreground/30 rotate-90" />
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


