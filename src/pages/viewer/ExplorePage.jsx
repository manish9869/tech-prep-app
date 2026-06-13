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
                            <Card className="rounded-2xl overflow-hidden hover:shadow-xl hover:-translate-y-1 transition-all duration-200 group cursor-pointer h-full border-border hover:border-primary/30">
                                <Link to={`/study/${t.id}`} className="block h-full">
                                    <div className="relative h-28 flex items-center justify-center" style={{ background: `linear-gradient(135deg, ${t.color || 'hsl(var(--primary))'}, ${t.color || 'hsl(var(--primary))'}99)` }}>
                                        {t.logo_url ? (
                                            <img src={t.logo_url} alt={t.name} className="w-16 h-16 object-contain drop-shadow-lg" />
                                        ) : (
                                            <span className="text-5xl font-black text-white/90 drop-shadow">{t.name?.[0]}</span>
                                        )}
                                        {t.pct === 100 && (
                                            <div className="absolute top-3 right-3 bg-white/20 backdrop-blur-sm rounded-full p-1.5">
                                                <Star className="w-4 h-4 text-yellow-300 fill-yellow-300" />
                                            </div>
                                        )}
                                    </div>
                                    <CardContent className="p-4">
                                        <h3 className="font-bold text-foreground group-hover:text-primary transition-colors">{t.name}</h3>
                                        {t.description && <p className="text-xs text-muted-foreground line-clamp-2 mt-1">{t.description}</p>}
                                        <div className="mt-3 space-y-1.5">
                                            <div className="flex justify-between text-xs">
                                                <span className="text-muted-foreground">{t.done}/{t.totalQ} done</span>
                                                <span className="font-semibold text-foreground">{t.pct}%</span>
                                            </div>
                                            <ProgressBar value={t.pct} className="h-1.5 rounded-full" />
                                        </div>
                                        <div className="flex items-center justify-between mt-3">
                                            <span className="text-xs text-muted-foreground">{t.totalQ} questions</span>
                                            <div className="flex items-center gap-2">
                                                <button
                                                    onClick={(e) => handleExportPDF(e, t)}
                                                    className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1 transition-colors"
                                                    title="Export Q&A PDF"
                                                >
                                                    <FileText className="w-3 h-3" /> PDF
                                                </button>
                                                <span className="text-xs text-primary font-semibold flex items-center gap-1">
                                                    {t.done === 0 ? 'Start' : t.pct === 100 ? 'Review' : 'Continue'}
                                                    <ArrowRight className="w-3 h-3" />
                                                </span>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Link>
                            </Card>
                        </motion.div>
                    ))}
                </div>
            )}
        </div>
    );
}