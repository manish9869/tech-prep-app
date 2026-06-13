import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { PageVisibility } from '@/api/entities';
import PageHeader from '@/components/shared/PageHeader';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import {
    Eye, EyeOff, LayoutDashboard, BookOpen, FileQuestion, Brain,
    Mic, Code2, Map, Bookmark, Target, Clock, Trophy, TrendingUp, User,
    CheckCircle2, XCircle, ToggleLeft, ToggleRight, Info
} from 'lucide-react';

const PAGE_META = {
    '/explore': { icon: BookOpen, color: '#6366f1', desc: 'Browse all topics & categories', category: 'Learning' },
    '/all-questions': { icon: FileQuestion, color: '#8b5cf6', desc: 'Full question bank with filters', category: 'Learning' },
    '/quiz': { icon: Brain, color: '#f59e0b', desc: 'MCQ quiz mode with scoring', category: 'Practice' },
    '/mock-interview': { icon: Mic, color: '#ef4444', desc: 'Simulated interview sessions', category: 'Practice' },
    '/code-editor': { icon: Code2, color: '#10b981', desc: 'DSA coding challenges (AI)', category: 'Practice' },
    '/roadmap': { icon: Map, color: '#06b6d4', desc: 'Visual learning path roadmap', category: 'Learning' },
    '/bookmarks': { icon: Bookmark, color: '#f97316', desc: 'Saved / bookmarked questions', category: 'Personal' },
    '/revision': { icon: Target, color: '#ec4899', desc: 'Focus on weak areas', category: 'Personal' },
    '/quiz-history': { icon: Clock, color: '#84cc16', desc: 'Past quiz attempts & scores', category: 'Personal' },
    '/achievements': { icon: Trophy, color: '#eab308', desc: 'Badges, streaks & milestones', category: 'Personal' },
    '/analytics': { icon: TrendingUp, color: '#3b82f6', desc: 'Progress charts & insights', category: 'Personal' },
    '/profile': { icon: User, color: '#a855f7', desc: 'Account & profile settings', category: 'Personal' },
};

const CATEGORY_ORDER = ['Learning', 'Practice', 'Personal'];

export default function PageVisibilityManager() {
    const qc = useQueryClient();
    const [pending, setPending] = useState(null);

    const { data: pages = [], isLoading } = useQuery({
        queryKey: ['page-visibility'],
        queryFn: () => PageVisibility.list(),
    });

    const updateMut = useMutation({
        mutationFn: ({ id, is_visible }) => PageVisibility.update(id, { is_visible }),
        onMutate: ({ id }) => setPending(id),
        onSettled: () => setPending(null),
        onSuccess: (_, vars) => {
            qc.invalidateQueries({ queryKey: ['page-visibility'] });
            toast.success(`Page ${vars.is_visible ? 'enabled' : 'disabled'} for viewers`);
        },
    });

    const bulkUpdate = (value) => {
        pages.forEach(p => updateMut.mutate({ id: p.id, is_visible: value }));
    };

    const visibleCount = pages.filter(p => p.is_visible !== false).length;
    const hiddenCount = pages.length - visibleCount;

    const grouped = CATEGORY_ORDER.map(cat => ({
        cat,
        items: pages.filter(p => (PAGE_META[p.page_key]?.category || 'Other') === cat),
    })).filter(g => g.items.length > 0);

    return (
        <div className="space-y-6">
            <PageHeader
                title="Page Visibility"
                badge="Viewer Control"
                description="Control which pages are accessible to viewer accounts. Changes apply instantly."
                actions={
                    <div className="flex items-center gap-2">
                        <div className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-500/10 border border-emerald-500/25">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                            <span className="text-xs font-black text-emerald-600">{visibleCount} visible</span>
                        </div>
                        <div className="flex items-center gap-1.5 px-3 py-1.5 bg-red-500/10 border border-red-500/25">
                            <XCircle className="w-3.5 h-3.5 text-red-500" />
                            <span className="text-xs font-black text-red-500">{hiddenCount} hidden</span>
                        </div>
                    </div>
                }
            />

            <div className="flex items-center justify-between px-4 py-3 bg-card border border-border">
                <div className="flex items-center gap-2">
                    <Info className="w-4 h-4 text-muted-foreground" />
                    <p className="text-xs text-muted-foreground">
                        Dashboard (/) is always visible and cannot be hidden.
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground font-semibold mr-1">Bulk:</span>
                    <Button size="sm" variant="outline"
                        className="h-7 text-xs gap-1.5 border-emerald-500/40 text-emerald-600 hover:bg-emerald-500/10"
                        onClick={() => bulkUpdate(true)}>
                        <ToggleRight className="w-3.5 h-3.5" /> Show All
                    </Button>
                    <Button size="sm" variant="outline"
                        className="h-7 text-xs gap-1.5 border-red-500/40 text-red-500 hover:bg-red-500/10"
                        onClick={() => bulkUpdate(false)}>
                        <ToggleLeft className="w-3.5 h-3.5" /> Hide All
                    </Button>
                </div>
            </div>

            {isLoading ? (
                <div className="space-y-2">
                    {Array(8).fill(0).map((_, i) => <div key={i} className="h-12 bg-muted animate-pulse" />)}
                </div>
            ) : (
                <div className="border border-border overflow-hidden bg-card">
                    <div className="grid grid-cols-[2rem_1fr_1fr_7rem_7rem] gap-0 bg-muted/50 border-b border-border px-4 py-2.5">
                        <div />
                        <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Page</p>
                        <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Description</p>
                        <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground text-center">Category</p>
                        <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground text-center">Visibility</p>
                    </div>

                    {grouped.map(({ cat, items }) => (
                        <div key={cat}>
                            <div className="px-4 py-2 bg-muted/20 border-b border-border flex items-center gap-2">
                                <div className="h-px flex-1 bg-border" />
                                <span className="text-[9px] font-black uppercase tracking-[0.2em] text-muted-foreground px-2">{cat}</span>
                                <div className="h-px flex-1 bg-border" />
                            </div>

                            {items.map((page) => {
                                const meta = PAGE_META[page.page_key] || { icon: LayoutDashboard, color: '#6366f1', desc: 'App page', category: 'Other' };
                                const Icon = meta.icon;
                                const isVisible = page.is_visible !== false;
                                const isUpdating = pending === page.id;

                                return (
                                    <div
                                        key={page.id}
                                        className={`grid grid-cols-[2rem_1fr_1fr_7rem_7rem] gap-0 items-center px-4 py-3 border-b border-border last:border-b-0 transition-colors hover:bg-muted/20 ${!isVisible ? 'opacity-60' : ''}`}
                                    >
                                        <div className="flex items-center justify-start">
                                            <div
                                                className="w-7 h-7 flex items-center justify-center flex-shrink-0"
                                                style={{ background: `${meta.color}18`, border: `1px solid ${meta.color}30` }}
                                            >
                                                <Icon className="w-3.5 h-3.5" style={{ color: meta.color }} />
                                            </div>
                                        </div>

                                        <div className="min-w-0 pl-3">
                                            <p className={`text-sm font-bold ${isVisible ? 'text-foreground' : 'text-muted-foreground line-through'}`}>
                                                {page.label}
                                            </p>
                                            <p className="text-[10px] font-mono text-muted-foreground/60 mt-0.5">{page.page_key}</p>
                                        </div>

                                        <p className="text-xs text-muted-foreground pr-4 hidden sm:block">{meta.desc}</p>

                                        <div className="flex justify-center">
                                            <span
                                                className="text-[9px] font-black uppercase tracking-widest px-2 py-0.5"
                                                style={{ background: `${meta.color}15`, color: meta.color }}
                                            >
                                                {meta.category}
                                            </span>
                                        </div>

                                        <div className="flex flex-col items-center gap-1">
                                            <Switch
                                                checked={isVisible}
                                                onCheckedChange={(val) => updateMut.mutate({ id: page.id, is_visible: val })}
                                                disabled={isUpdating}
                                            />
                                            <span className={`text-[8px] font-black uppercase tracking-widest transition-colors ${isVisible ? 'text-emerald-500' : 'text-red-400'
                                                }`}>
                                                {isVisible ? 'Visible' : 'Hidden'}
                                            </span>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}