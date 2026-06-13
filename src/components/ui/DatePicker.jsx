import React, { useState } from 'react';
import { format, subDays } from 'date-fns';
import { Calendar as CalIcon, ChevronLeft, ChevronRight, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { cn } from '@/lib/utils';

const PRESETS = [
    { label: 'Today', days: 0 },
    { label: 'Yesterday', days: 1 },
    { label: '3 days ago', days: 3 },
    { label: '7 days ago', days: 7 },
];

/**
 * DatePicker — a reusable single-date selector for all tracker pages.
 * Props:
 *   date: string (YYYY-MM-DD)
 *   onChange: (dateStr: string) => void
 *   className: string
 */
export default function DatePicker({ date, onChange, className }) {
    const [open, setOpen] = useState(false);
    const todayStr = format(new Date(), 'yyyy-MM-dd');
    const isToday = date === todayStr;

    const handleSelect = (d) => {
        if (!d) return;
        onChange(format(d, 'yyyy-MM-dd'));
        setOpen(false);
    };

    const shift = (delta) => {
        const d = new Date(date + 'T12:00:00');
        d.setDate(d.getDate() + delta);
        onChange(format(d, 'yyyy-MM-dd'));
    };

    const displayLabel = isToday
        ? 'Today'
        : date === format(subDays(new Date(), 1), 'yyyy-MM-dd')
            ? 'Yesterday'
            : format(new Date(date + 'T12:00:00'), 'MMM d, yyyy');

    return (
        <div className={cn('flex items-center gap-1', className)}>
            <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg border border-white/10 hover:bg-white/5" onClick={() => shift(-1)}>
                <ChevronLeft className="w-4 h-4" />
            </Button>

            <Popover open={open} onOpenChange={setOpen}>
                <PopoverTrigger asChild>
                    <Button variant="outline" className="h-8 px-3 gap-2 rounded-lg border-white/10 bg-white/5 hover:bg-white/10 text-sm font-medium min-w-[130px]">
                        <CalIcon className="w-3.5 h-3.5 text-muted-foreground" />
                        {displayLabel}
                    </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0 glass border-white/10" align="center">
                    <div className="flex gap-1 p-2 border-b border-white/10 flex-wrap">
                        {PRESETS.map(p => (
                            <button key={p.label}
                                onClick={() => handleSelect(subDays(new Date(), p.days))}
                                className="text-xs px-2 py-1 rounded-md bg-white/5 hover:bg-white/10 transition-colors">
                                {p.label}
                            </button>
                        ))}
                    </div>
                    <Calendar
                        mode="single"
                        selected={new Date(date + 'T12:00:00')}
                        onSelect={handleSelect}
                        disabled={(d) => d > new Date()}
                        initialFocus
                    />
                </PopoverContent>
            </Popover>

            <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg border border-white/10 hover:bg-white/5" onClick={() => shift(1)} disabled={isToday}>
                <ChevronRight className="w-4 h-4" />
            </Button>

            {!isToday && (
                <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg hover:bg-white/5 text-muted-foreground hover:text-white" title="Back to today" onClick={() => onChange(todayStr)}>
                    <X className="w-3.5 h-3.5" />
                </Button>
            )}
        </div>
    );
}