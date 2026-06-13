import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Calendar, ChevronDown, X } from 'lucide-react';
import { PRESETS } from '@/lib/useDateFilter';
import { format, parseISO } from 'date-fns';

export default function DateFilter({ preset, startDate, endDate, isCustom, onSelectPreset, onSelectCustom }) {
    const [open, setOpen] = useState(false);
    const [customStart, setCustomStart] = useState(startDate);
    const [customEnd, setCustomEnd] = useState(endDate);
    const [showCustom, setShowCustom] = useState(false);

    const handlePreset = (p) => {
        onSelectPreset(p);
        setOpen(false);
        setShowCustom(false);
    };

    const handleCustomApply = () => {
        if (customStart && customEnd && customStart <= customEnd) {
            onSelectCustom(customStart, customEnd);
            setOpen(false);
            setShowCustom(false);
        }
    };

    const displayLabel = isCustom
        ? `${format(parseISO(startDate), 'MMM d')} → ${format(parseISO(endDate), 'MMM d')}`
        : preset;

    return (
        <div className="relative">
            <button
                onClick={() => setOpen(o => !o)}
                className="flex items-center gap-2 glass px-3 py-2 rounded-xl border border-white/10 hover:border-white/20 transition-all text-sm font-medium"
            >
                <Calendar className="w-4 h-4 text-emerald-400" />
                <span>{displayLabel}</span>
                <ChevronDown className={`w-3.5 h-3.5 text-muted-foreground transition-transform ${open ? 'rotate-180' : ''}`} />
            </button>

            <AnimatePresence>
                {open && (
                    <>
                        {/* Backdrop */}
                        <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />

                        <motion.div
                            initial={{ opacity: 0, y: -8, scale: 0.96 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: -8, scale: 0.96 }}
                            transition={{ duration: 0.15 }}
                            className="absolute right-0 top-11 z-50 glass rounded-2xl border border-white/10 p-3 min-w-[200px] shadow-2xl shadow-black/40"
                        >
                            {/* Presets */}
                            <div className="space-y-1 mb-2">
                                {PRESETS.map(p => (
                                    <button
                                        key={p.label}
                                        onClick={() => handlePreset(p)}
                                        className={`w-full text-left px-3 py-2 rounded-xl text-sm transition-all ${preset === p.label && !isCustom
                                            ? 'bg-emerald-500/20 text-emerald-400 font-semibold'
                                            : 'hover:bg-white/5 text-muted-foreground hover:text-white'
                                            }`}
                                    >
                                        {p.label}
                                    </button>
                                ))}
                            </div>

                            {/* Custom range */}
                            <div className="border-t border-white/5 pt-2">
                                <button
                                    onClick={() => setShowCustom(v => !v)}
                                    className={`w-full text-left px-3 py-2 rounded-xl text-sm transition-all flex items-center justify-between ${isCustom ? 'text-emerald-400' : 'text-muted-foreground hover:text-white hover:bg-white/5'}`}
                                >
                                    <span>Custom Range</span>
                                    <ChevronDown className={`w-3.5 h-3.5 transition-transform ${showCustom ? 'rotate-180' : ''}`} />
                                </button>

                                <AnimatePresence>
                                    {showCustom && (
                                        <motion.div
                                            initial={{ opacity: 0, height: 0 }}
                                            animate={{ opacity: 1, height: 'auto' }}
                                            exit={{ opacity: 0, height: 0 }}
                                            className="overflow-hidden"
                                        >
                                            <div className="px-3 pt-2 pb-1 space-y-2">
                                                <div>
                                                    <label className="text-[10px] text-muted-foreground mb-1 block">From</label>
                                                    <input
                                                        type="date"
                                                        value={customStart}
                                                        onChange={e => setCustomStart(e.target.value)}
                                                        className="w-full bg-white/5 border border-white/10 rounded-lg px-2 py-1.5 text-xs text-white focus:outline-none focus:border-emerald-500/50"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="text-[10px] text-muted-foreground mb-1 block">To</label>
                                                    <input
                                                        type="date"
                                                        value={customEnd}
                                                        onChange={e => setCustomEnd(e.target.value)}
                                                        className="w-full bg-white/5 border border-white/10 rounded-lg px-2 py-1.5 text-xs text-white focus:outline-none focus:border-emerald-500/50"
                                                    />
                                                </div>
                                                <button
                                                    onClick={handleCustomApply}
                                                    disabled={!customStart || !customEnd || customStart > customEnd}
                                                    className="w-full bg-emerald-500 hover:bg-emerald-400 disabled:opacity-40 text-black font-semibold text-xs py-2 rounded-lg transition-all"
                                                >
                                                    Apply
                                                </button>
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </div>
    );
}