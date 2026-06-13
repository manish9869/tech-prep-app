// components/ui/DateRangePicker.jsx
// Drop-in replacement / enhancement for the existing DateFilter component
// Usage: <DateRangePicker {...dateFilter} />
// Works identically to the existing DateFilter props API so no other files need to change.

import React, { useState, useRef, useEffect } from 'react';
import { format, subDays, startOfMonth, endOfMonth, startOfYear, addDays, isSameDay, isWithinInterval, parseISO } from 'date-fns';
import { Calendar, ChevronLeft, ChevronRight, ChevronDown, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const PRESETS = [
    { label: 'Today', value: 'today', days: 0 },
    { label: 'Yesterday', value: 'yesterday', days: 1, offset: 1 },
    { label: '7 Days', value: '7d', days: 7 },
    { label: '14 Days', value: '14d', days: 14 },
    { label: '30 Days', value: '30d', days: 30 },
    { label: '90 Days', value: '90d', days: 90 },
    { label: 'This Month', value: 'month', special: 'month' },
    { label: 'This Year', value: 'year', special: 'year' },
];

const DAY_NAMES = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];
const todayStr = () => format(new Date(), 'yyyy-MM-dd');

function miniCal(year, month) {
    const first = new Date(year, month, 1);
    const last = new Date(year, month + 1, 0);
    const startPad = first.getDay();
    const days = [];
    for (let i = 0; i < startPad; i++) days.push(null);
    for (let d = 1; d <= last.getDate(); d++) days.push(new Date(year, month, d));
    return days;
}

export default function DateRangePicker({
    preset,
    startDate,
    endDate,
    isCustom,
    onSelectPreset,
    onSelectCustom,
}) {
    const [open, setOpen] = useState(false);
    const [view, setView] = useState('presets'); // 'presets' | 'calendar'
    const [calYear, setCalYear] = useState(new Date().getFullYear());
    const [calMonth, setCalMonth] = useState(new Date().getMonth());
    const [hoverDate, setHoverDate] = useState(null);
    const [rangeStart, setRangeStart] = useState(null); // picking state
    const ref = useRef(null);

    // Close on outside click
    useEffect(() => {
        const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);

    // Label shown on the button
    const buttonLabel = () => {
        if (isCustom) {
            if (startDate === endDate) return format(parseISO(startDate), 'MMM d, yyyy');
            return `${format(parseISO(startDate), 'MMM d')} – ${format(parseISO(endDate), 'MMM d, yyyy')}`;
        }
        const p = PRESETS.find(p => p.value === preset);
        return p?.label ?? 'Select range';
    };

    const days = miniCal(calYear, calMonth);

    const inRange = (d) => {
        if (!d) return false;
        const ds = format(d, 'yyyy-MM-dd');
        if (rangeStart) {
            // while picking second point show hover range
            const s = rangeStart < (hoverDate ?? rangeStart) ? rangeStart : (hoverDate ?? rangeStart);
            const e = rangeStart < (hoverDate ?? rangeStart) ? (hoverDate ?? rangeStart) : rangeStart;
            return ds >= s && ds <= e;
        }
        return ds >= startDate && ds <= endDate;
    };
    const isStart = (d) => d && format(d, 'yyyy-MM-dd') === (rangeStart ?? startDate);
    const isEnd = (d) => d && !rangeStart && format(d, 'yyyy-MM-dd') === endDate;
    const isToday = (d) => d && format(d, 'yyyy-MM-dd') === todayStr();

    const handleDayClick = (d) => {
        const ds = format(d, 'yyyy-MM-dd');
        if (!rangeStart) {
            setRangeStart(ds);
        } else {
            const s = rangeStart <= ds ? rangeStart : ds;
            const e = rangeStart <= ds ? ds : rangeStart;
            onSelectCustom(s, e);
            setRangeStart(null);
            setOpen(false);
        }
    };

    const prevMonth = () => {
        if (calMonth === 0) { setCalMonth(11); setCalYear(y => y - 1); }
        else setCalMonth(m => m - 1);
    };
    const nextMonth = () => {
        if (calMonth === 11) { setCalMonth(0); setCalYear(y => y + 1); }
        else setCalMonth(m => m + 1);
    };

    return (
        <div className="relative" ref={ref}>
            {/* Trigger button */}
            <button
                onClick={() => { setOpen(o => !o); setView('presets'); setRangeStart(null); }}
                className="flex items-center gap-2 px-3 py-2 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 transition-all text-sm font-medium text-white/80 hover:text-white"
            >
                <Calendar className="w-3.5 h-3.5 text-blue-400 flex-shrink-0" />
                <span className="max-w-[160px] truncate">{buttonLabel()}</span>
                <ChevronDown className={`w-3.5 h-3.5 text-white/40 transition-transform ${open ? 'rotate-180' : ''}`} />
            </button>

            <AnimatePresence>
                {open && (
                    <motion.div
                        initial={{ opacity: 0, y: 6, scale: 0.97 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 4, scale: 0.97 }}
                        transition={{ duration: 0.15 }}
                        className="absolute right-0 top-full mt-2 z-50 w-72 rounded-2xl border border-white/10 bg-[#0f1117]/95 backdrop-blur-xl shadow-2xl overflow-hidden"
                    >
                        {/* Tab bar */}
                        <div className="flex border-b border-white/5">
                            {['presets', 'calendar'].map(t => (
                                <button key={t} onClick={() => { setView(t); setRangeStart(null); }}
                                    className={`flex-1 py-2.5 text-xs font-medium capitalize transition-colors ${view === t ? 'text-white border-b-2 border-blue-400' : 'text-white/40 hover:text-white/70'
                                        }`}>
                                    {t === 'presets' ? '⚡ Quick Select' : '📅 Date Picker'}
                                </button>
                            ))}
                        </div>

                        {view === 'presets' ? (
                            <div className="p-3 grid grid-cols-2 gap-1.5">
                                {PRESETS.map(p => {
                                    const active = !isCustom && preset === p.value;
                                    return (
                                        <button key={p.value}
                                            onClick={() => { onSelectPreset(p.value); setOpen(false); }}
                                            className={`py-2 px-3 rounded-xl text-xs font-medium text-left transition-all ${active
                                                ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                                                : 'hover:bg-white/5 text-white/60 hover:text-white border border-transparent'
                                                }`}>
                                            {p.label}
                                        </button>
                                    );
                                })}

                            </div>
                        ) : (
                            <div className="p-3">
                                {rangeStart && (
                                    <div className="mb-2 flex items-center justify-between text-xs px-1">
                                        <span className="text-blue-400">From: <b>{format(parseISO(rangeStart), 'MMM d')}</b></span>
                                        <span className="text-white/40">Click end date</span>
                                        <button onClick={() => setRangeStart(null)} className="text-white/30 hover:text-white/60"><X className="w-3 h-3" /></button>
                                    </div>
                                )}
                                {/* Month nav */}
                                <div className="flex items-center justify-between mb-3 px-1">
                                    <button onClick={prevMonth} className="p-1 rounded-lg hover:bg-white/5 text-white/40 hover:text-white transition-colors">
                                        <ChevronLeft className="w-4 h-4" />
                                    </button>
                                    <span className="text-sm font-semibold text-white/80">
                                        {format(new Date(calYear, calMonth, 1), 'MMMM yyyy')}
                                    </span>
                                    <button onClick={nextMonth} className="p-1 rounded-lg hover:bg-white/5 text-white/40 hover:text-white transition-colors">
                                        <ChevronRight className="w-4 h-4" />
                                    </button>
                                </div>
                                {/* Day headers */}
                                <div className="grid grid-cols-7 mb-1">
                                    {DAY_NAMES.map(n => (
                                        <div key={n} className="text-center text-[10px] text-white/25 py-1">{n}</div>
                                    ))}
                                </div>
                                {/* Days */}
                                <div className="grid grid-cols-7 gap-px">
                                    {days.map((d, i) => {
                                        if (!d) return <div key={i} />;
                                        const ds = format(d, 'yyyy-MM-dd');
                                        const inR = inRange(d);
                                        const start = isStart(d);
                                        const end = isEnd(d);
                                        const today = isToday(d);
                                        const future = ds > todayStr();
                                        return (
                                            <button key={i}
                                                disabled={future}
                                                onMouseEnter={() => rangeStart && setHoverDate(ds)}
                                                onMouseLeave={() => setHoverDate(null)}
                                                onClick={() => !future && handleDayClick(d)}
                                                className={`
                          relative h-8 text-xs font-medium transition-all rounded-lg
                          ${future ? 'opacity-20 cursor-not-allowed' : 'cursor-pointer'}
                          ${inR ? 'bg-blue-500/15 text-blue-200 rounded-none' : ''}
                          ${start || end ? 'bg-blue-500 text-white rounded-lg z-10' : ''}
                          ${!inR && !start && !end ? 'hover:bg-white/8 text-white/60 hover:text-white' : ''}
                          ${today && !start && !end ? 'ring-1 ring-blue-400/40' : ''}
                        `}>
                                                {d.getDate()}
                                            </button>
                                        );
                                    })}
                                </div>
                                {/* Single day shortcut */}
                                <button
                                    onClick={() => { onSelectCustom(todayStr(), todayStr()); setOpen(false); setRangeStart(null); }}
                                    className="mt-3 w-full py-2 rounded-xl text-xs text-white/40 hover:text-blue-300 border border-white/5 hover:border-blue-500/30 transition-all">
                                    Jump to today
                                </button>
                            </div>
                        )}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}