import React, { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { ChevronDown, ChevronUp, Brain, Code2, Users, Layers, Star } from 'lucide-react';

const CATEGORY_META = {
    technical: { icon: Code2, color: '#6366f1', bg: '#6366f110' },
    behavioral: { icon: Users, color: '#10b981', bg: '#10b98110' },
    'system design': { icon: Layers, color: '#f59e0b', bg: '#f59e0b10' },
    'project-specific': { icon: Star, color: '#ec4899', bg: '#ec489910' },
    beginner: { icon: Brain, color: '#06b6d4', bg: '#06b6d410' },
    expert: { icon: Star, color: '#8b5cf6', bg: '#8b5cf610' },
};

const DIFF_COLOR = {
    beginner: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20',
    intermediate: 'bg-blue-500/10 text-blue-600 border-blue-500/20',
    advanced: 'bg-amber-500/10 text-amber-600 border-amber-500/20',
    expert: 'bg-red-500/10 text-red-500 border-red-500/20',
};

function QuestionRow({ q, index }) {
    const [open, setOpen] = useState(false);
    const cat = q.category?.toLowerCase() || 'technical';
    const meta = CATEGORY_META[cat] || CATEGORY_META.technical;
    const Icon = meta.icon;

    return (
        <div className="border border-border overflow-hidden transition-colors hover:bg-muted/10">
            <button
                onClick={() => setOpen(!open)}
                className="w-full flex items-start gap-4 p-4 text-left"
            >
                <div className="w-7 h-7 flex items-center justify-center flex-shrink-0 mt-0.5"
                    style={{ background: meta.bg, border: `1px solid ${meta.color}30` }}>
                    <Icon className="w-3.5 h-3.5" style={{ color: meta.color }} />
                </div>
                <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-foreground leading-snug">{q.question}</p>
                    <div className="flex flex-wrap gap-1.5 mt-2">
                        <span className="text-[9px] font-black uppercase tracking-widest px-2 py-0.5 border"
                            style={{ background: meta.bg, color: meta.color, borderColor: `${meta.color}30` }}>
                            {q.category}
                        </span>
                        <span className={`text-[9px] font-black uppercase tracking-widest px-2 py-0.5 border ${DIFF_COLOR[q.difficulty] || DIFF_COLOR.intermediate}`}>
                            {q.difficulty}
                        </span>
                    </div>
                </div>
                <div className="flex-shrink-0 mt-1">
                    {open ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
                </div>
            </button>

            {open && (
                <div className="px-4 pb-4 ml-11">
                    <div className="p-4 bg-muted/30 border border-border">
                        <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-2">Model Answer</p>
                        <p className="text-sm text-foreground leading-relaxed whitespace-pre-line">{q.answer}</p>
                    </div>
                </div>
            )}
        </div>
    );
}

export default function ResumeQuestions({ analysis }) {
    const questions = analysis.generated_questions || [];
    const [filter, setFilter] = useState('all');

    const categories = ['all', ...new Set(questions.map(q => q.category?.toLowerCase()))];
    const filtered = filter === 'all' ? questions : questions.filter(q => q.category?.toLowerCase() === filter);

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <div>
                    <p className="text-xs font-black uppercase tracking-widest text-muted-foreground">AI-Generated Questions</p>
                    <p className="text-sm text-foreground font-bold mt-0.5">{questions.length} personalized questions based on your resume</p>
                </div>
            </div>

            {/* Filter pills */}
            <div className="flex flex-wrap gap-2">
                {categories.map(cat => (
                    <button
                        key={cat}
                        onClick={() => setFilter(cat)}
                        className={`text-xs font-bold px-3 py-1.5 border transition-colors capitalize ${filter === cat
                            ? 'bg-primary text-primary-foreground border-primary'
                            : 'border-border text-muted-foreground hover:border-primary/40 hover:text-foreground'
                            }`}
                    >
                        {cat === 'all' ? `All (${questions.length})` : cat}
                    </button>
                ))}
            </div>

            {/* Questions */}
            <div className="space-y-2">
                {filtered.map((q, i) => <QuestionRow key={i} q={q} index={i} />)}
            </div>

            {filtered.length === 0 && (
                <div className="text-center py-12 text-muted-foreground text-sm">No questions in this category.</div>
            )}
        </div>
    );
}