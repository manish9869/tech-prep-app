import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getCurrentUser } from '@/api/auth';
import { Topic, Question, Progress } from '@/api/entities';
import { Link } from 'react-router-dom';
import PageHeader from '@/components/shared/PageHeader';
import EmptyState from '@/components/shared/EmptyState';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Progress as ProgressBar } from '@/components/ui/progress';
import { Search, BookOpen, ArrowRight, Star, FileText } from 'lucide-react';
import { exportTopicAsPDF } from '@/lib/exportTopicPDF';
import { motion } from 'framer-motion';

export default function ExplorePage() {
    const [search, setSearch] = useState('');

    const { data: user } = useQuery({ queryKey: ['me'], queryFn: getCurrentUser });
    const { data: topics = [], isLoading } = useQuery({ queryKey: ['topics'], queryFn: () => Topic.list() });
    const { data: questions = [] } = useQuery({ queryKey: ['questions'], queryFn: () => Question.list('created_at', false) });
    const { data: progress = [] } = useQuery({ queryKey: ['progress', user?.id], queryFn: () => Progress.filter({ user_id: user.id }, 'completed_at'), enabled: !!user?.id });

    const completedIds = new Set(progress.map(p => p.question_id));

    const handleExportPDF = (e, topic) => {
        e.preventDefault();
        const qs = questions.filter(q => q.topic_id === topic.id && q.is_visible !== false && q.status === 'published');
        exportTopicAsPDF(topic, qs);
    };
    const visibleTopics = topics.filter(t => t.is_visible !== false);
    const visibleQs = questions.filter(q => q.is_visible !== false && q.status === 'published');

    const enriched = useMemo(() => {
        return visibleTopics.map(t => {
            const tQs = visibleQs.filter(q => q.topic_id === t.id);
            const done = tQs.filter(q => completedIds.has(q.id)).length;
            const pct = tQs.length > 0 ? Math.round((done / tQs.length) * 100) : 0;
            return { ...t, totalQ: tQs.length, done, pct };
        }).filter(t => t.totalQ > 0);
    }, [visibleTopics, visibleQs, completedIds]);

    const filtered = enriched.filter(t => !search || t.name?.toLowerCase().includes(search.toLowerCase()) || t.description?.toLowerCase().includes(search.toLowerCase()));

    return (
        <div className="space-y-6">
            <PageHeader
                title="Explore Topics"
                badge="Learning Library"
                description="Master every technology with structured question sets"
            />

            <div className="relative max-w-lg">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search topics..." className="pl-9 rounded-xl" />
            </div>

            <p className="text-sm text-muted-foreground">{filtered.length} topics available</p>

            {isLoading ? (
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {Array(6).fill(0).map((_, i) => <div key={i} className="h-52 bg-muted rounded-2xl animate-pulse" />)}
                </div>
            ) : filtered.length === 0 ? (
                <EmptyState icon={BookOpen} title="No topics found" description={search ? 'Try a different search' : 'No topics available yet'} />
            ) : (
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {filtered.map((t, i) => (
                        <motion.div key={t.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
                            <div
                                className="overflow-hidden border transition-all hover:-translate-y-0.5 hover:shadow-lg h-full"
                                style={{
                                    background: `linear-gradient(135deg, hsl(var(--card)) 0%, ${t.color || '#6366f1'}0a 100%)`,
                                    borderColor: `${t.color || '#6366f1'}30`,
                                }}
                            >
                                {/* Accent bar — same as admin cards */}
                                <div className="h-1 w-full" style={{ background: `linear-gradient(90deg, ${t.color || '#6366f1'}, ${t.color || '#6366f1'}44)` }} />

                                <Link to={`/study/${t.id}`} className="block p-5">
                                    <div className="flex items-start gap-3">
                                        {t.logo_url ? (
                                            <img src={t.logo_url} alt={t.name} className="w-12 h-12 object-contain p-1 border border-border bg-muted/30 flex-shrink-0" />
                                        ) : (
                                            <div
                                                className="w-12 h-12 flex items-center justify-center text-white font-black text-lg flex-shrink-0"
                                                style={{ background: t.color || '#6366f1' }}
                                            >
                                                {t.name?.[0]?.toUpperCase()}
                                            </div>
                                        )}
                                        <div className="flex-1 min-w-0">
                                            <h3 className="font-black text-foreground truncate">{t.name}</h3>
                                            <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">{t.description || 'No description'}</p>
                                        </div>
                                    </div>

                                    {/* Progress — viewer-only addition */}
                                    <div className="mt-4 space-y-1.5">
                                        <div className="flex justify-between text-xs">
                                            <span className="text-muted-foreground">{t.done}/{t.totalQ} done</span>
                                            <span className="font-semibold text-foreground">{t.pct}%</span>
                                        </div>
                                        <ProgressBar value={t.pct} className="h-1.5" />
                                    </div>

                                    <div
                                        className="flex items-center justify-between mt-4 pt-3 border-t"
                                        style={{ borderColor: `${t.color || '#6366f1'}20` }}
                                    >
                                        <span className="text-[9px] font-black uppercase tracking-widest px-2 py-0.5 bg-muted text-muted-foreground">
                                            {t.totalQ} questions
                                        </span>
                                        <div className="flex items-center gap-2">
                                            <button
                                                onClick={(e) => handleExportPDF(e, t)}
                                                className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1 transition-colors"
                                                title="Export Q&A PDF"
                                            >
                                                <FileText className="w-3 h-3" /> PDF
                                            </button>
                                            <span className="text-xs font-semibold flex items-center gap-1" style={{ color: t.color || '#6366f1' }}>
                                                {t.done === 0 ? 'Start' : t.pct === 100 ? 'Review' : 'Continue'}
                                                <ArrowRight className="w-3 h-3" />
                                            </span>
                                        </div>
                                    </div>
                                </Link>
                            </div>
                        </motion.div>
                    ))}
                </div>
            )}
        </div>
    );
}