import React, { useMemo, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Topic, Question, Progress, Bookmark, QuizAttempt } from '@/api/entities';
import { useAuth } from '@/lib/AuthContext';
import { toast } from 'sonner';
import { Link } from 'react-router-dom';
import StatCard from '@/components/shared/StatCard';
import { Button } from '@/components/ui/button';
import {
    BookOpen, FileQuestion, Bookmark as BookmarkIcon, Brain, Flame, Trophy,
    ArrowRight, Sparkles, Zap, Target, RotateCcw, CheckCircle2, Mic, TrendingUp, FileText
} from 'lucide-react';
import { exportTopicAsPDF } from '@/lib/exportTopicPDF';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { motion } from 'framer-motion';

export default function ViewerDashboard() {
    const { profile: user } = useAuth();
    const qc = useQueryClient();
    const [resettingId, setResettingId] = useState(null);

    const { data: topics = [] } = useQuery({ queryKey: ['topics'], queryFn: () => Topic.list() });
    const { data: questions = [] } = useQuery({ queryKey: ['questions'], queryFn: () => Question.list() });
    const { data: progress = [] } = useQuery({
        queryKey: ['progress', user?.id],
        queryFn: () => Progress.filter({ user_id: user.id }, 'completed_at'),
        enabled: !!user?.id,
    });
    const { data: bookmarks = [] } = useQuery({
        queryKey: ['bookmarks', user?.id],
        queryFn: () => Bookmark.filter({ user_id: user.id }),
        enabled: !!user?.id,
    });
    const { data: quizzes = [] } = useQuery({
        queryKey: ['quizAttempts', user?.id],
        queryFn: () => QuizAttempt.filter({ user_id: user.id }),
        enabled: !!user?.id,
    });

    const handleExportPDF = (topic) => {
        const qs = questions.filter(q => q.topic_id === topic.id && q.is_visible !== false && q.status === 'published');
        exportTopicAsPDF(topic, qs);
    };

    const resetProgress = async (topicId) => {
        setResettingId(topicId);
        const topicProgress = progress.filter(p => p.topic_id === topicId);
        await Promise.all(topicProgress.map(p => Progress.delete(p.id)));
        qc.invalidateQueries({ queryKey: ['progress'] });
        toast.success('Progress reset');
        setResettingId(null);
    };

    const visibleTopics = topics.filter(t => t.is_visible !== false);
    const visibleQuestions = questions.filter(q => q.is_visible !== false && q.status === 'published');
    const completedIds = new Set(progress.map(p => p.question_id));
    const totalCompleted = completedIds.size;
    const avgQuiz = quizzes.length
        ? Math.round(quizzes.reduce((a, q) => a + (q.score_percentage || 0), 0) / quizzes.length)
        : 0;

    const topicProgress = useMemo(() => {
        return visibleTopics.map(t => {
            const tQs = visibleQuestions.filter(q => q.topic_id === t.id);
            const done = tQs.filter(q => completedIds.has(q.id)).length;
            const pct = tQs.length > 0 ? Math.round((done / tQs.length) * 100) : 0;
            return { ...t, totalQ: tQs.length, done, pct };
        }).filter(t => t.totalQ > 0);
    }, [visibleTopics, visibleQuestions, completedIds]);

    const chartData = topicProgress.slice(0, 8).map(t => ({ name: t.name?.slice(0, 8), pct: t.pct }));
    const bestTopic = [...topicProgress].sort((a, b) => b.pct - a.pct)[0];
    const weakestTopic = [...topicProgress].filter(t => t.pct < 100).sort((a, b) => a.pct - b.pct)[0];
    const firstName = user?.full_name?.split(' ')[0] || 'there';

    return (
        <div className="space-y-8">
            <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
                className="relative overflow-hidden bg-foreground text-background p-6 md:p-10">
                <div className="absolute top-0 right-0 w-64 h-full opacity-5 pointer-events-none"
                    style={{ background: 'repeating-linear-gradient(45deg, currentColor 0, currentColor 1px, transparent 0, transparent 50%)', backgroundSize: '12px 12px' }} />
                <div className="absolute top-0 left-0 w-1 h-full bg-primary" />
                <div className="relative z-10">
                    <div className="flex items-center gap-2 mb-3">
                        <Zap className="w-3.5 h-3.5 text-primary" />
                        <span className="text-[10px] font-black uppercase tracking-[0.2em] opacity-60">Interview Ready Mode</span>
                    </div>
                    <h1 className="text-3xl md:text-5xl font-black leading-none mb-3 tracking-tight">
                        {totalCompleted === 0 ? `Level up,` : `Keep going,`}
                        <br /><span className="text-primary">{firstName}.</span>
                    </h1>
                    <p className="opacity-60 text-sm md:text-base max-w-lg leading-relaxed mb-6">
                        {totalCompleted === 0
                            ? 'Your dream job is one question away. Start with a topic below.'
                            : `${totalCompleted} questions down. Keep the momentum going!`}
                    </p>
                    <div className="flex items-center gap-3 flex-wrap">
                        <Link to="/explore">
                            <Button className="bg-primary text-primary-foreground font-bold text-sm px-5 h-10">
                                <BookOpen className="w-4 h-4 mr-2" /> Explore Topics
                            </Button>
                        </Link>
                        <Link to="/quiz">
                            <Button variant="outline" className="border-background/30 text-background hover:bg-background/10 font-bold text-sm px-5 h-10">
                                <Brain className="w-4 h-4 mr-2" /> Take a Quiz
                            </Button>
                        </Link>
                    </div>
                </div>
            </motion.div>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                <StatCard title="Questions Done" value={totalCompleted} icon={CheckCircle2} color="success" delay={0.05} />
                <StatCard title="Topics Started" value={topicProgress.filter(t => t.done > 0).length} icon={BookOpen} color="primary" delay={0.1} />
                <StatCard title="Bookmarks" value={bookmarks.length} icon={BookmarkIcon} color="warning" delay={0.15} />
                <StatCard title="Avg Quiz Score" value={`${avgQuiz}%`} icon={Brain} color="violet" delay={0.2} />
            </div>

            <div className="grid md:grid-cols-2 gap-3">
                <motion.div initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.25 }}>
                    <div className="bg-card border border-border p-5 flex items-center gap-4 h-full border-l-4 border-l-orange-500">
                        <div className="w-12 h-12 bg-orange-500/10 flex items-center justify-center flex-shrink-0">
                            <Flame className="w-6 h-6 text-orange-500" />
                        </div>
                        <div>
                            <p className="text-[10px] font-black uppercase tracking-[0.15em] text-orange-600 mb-1">Study Streak 🔥</p>
                            <p className="text-4xl font-black text-foreground leading-none">
                                {user?.current_streak || 0}
                                <span className="text-base font-semibold text-muted-foreground ml-1.5">days</span>
                            </p>
                            <p className="text-xs text-muted-foreground mt-1">Best: {user?.longest_streak || 0} days</p>
                        </div>
                    </div>
                </motion.div>

                <motion.div initial={{ opacity: 0, x: 8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3 }}>
                    <div className="bg-card border border-border p-5 h-full border-l-4 border-l-primary">
                        <div className="flex items-center gap-2 mb-2">
                            <Sparkles className="w-3.5 h-3.5 text-primary" />
                            <p className="text-[10px] font-black uppercase tracking-[0.15em] text-primary">AI Insight</p>
                        </div>
                        <p className="text-sm text-foreground leading-relaxed">
                            {bestTopic && bestTopic.pct > 0
                                ? <>Strongest: <strong>{bestTopic.name}</strong> at {bestTopic.pct}%.{' '}
                                    {weakestTopic && weakestTopic.pct < 60 && <>Focus on <strong className="text-primary">{weakestTopic.name}</strong> — only {weakestTopic.pct}%.</>}
                                    {' '}Keep pushing! 🎯</>
                                : 'Start studying to unlock personalized AI insights about your strengths and weaknesses.'}
                        </p>
                    </div>
                </motion.div>
            </div>

            {chartData.length > 0 && (
                <div className="bg-card border border-border p-6">
                    <div className="flex items-center justify-between mb-5">
                        <div className="flex items-center gap-2">
                            <div className="w-0.5 h-4 bg-primary" />
                            <h3 className="font-bold text-foreground text-sm">Learning Progress by Topic</h3>
                        </div>
                        <span className="text-xs text-muted-foreground">{totalCompleted} completed</span>
                    </div>
                    <ResponsiveContainer width="100%" height={200}>
                        <BarChart data={chartData} barSize={24}>
                            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                            <XAxis dataKey="name" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }} axisLine={false} tickLine={false} />
                            <YAxis domain={[0, 100]} tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={v => `${v}%`} />
                            <Tooltip contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '0', fontSize: 12 }}
                                formatter={v => [`${v}%`, 'Progress']} cursor={{ fill: 'hsl(var(--muted))' }} />
                            <Bar dataKey="pct" fill="hsl(var(--primary))" />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            )}

            <div>
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                        <div className="w-0.5 h-5 bg-primary" />
                        <h2 className="text-lg font-black text-foreground">Study Roadmap</h2>
                    </div>
                    <Link to="/explore">
                        <Button variant="ghost" size="sm" className="text-primary text-xs font-bold h-8 px-3">
                            All Topics <ArrowRight className="w-3 h-3 ml-1" />
                        </Button>
                    </Link>
                </div>

                {topicProgress.length === 0 ? (
                    <div className="text-center py-12 border border-dashed border-border">
                        <Target className="w-8 h-8 text-muted-foreground mx-auto mb-3" />
                        <p className="font-bold text-foreground text-sm">No topics available yet</p>
                        <p className="text-xs text-muted-foreground mt-1">Topics will appear once published</p>
                    </div>
                ) : (
                    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        {topicProgress.map((t, i) => (
                            <motion.div key={t.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 + i * 0.04 }}>
                                <div
                                    className="group overflow-hidden border transition-all hover:-translate-y-0.5 hover:shadow-lg"
                                    style={{
                                        background: `linear-gradient(135deg, hsl(var(--card)) 0%, ${t.color || '#6366f1'}0a 100%)`,
                                        borderColor: `${t.color || '#6366f1'}30`,
                                    }}
                                >
                                    <div className="h-1 w-full" style={{ background: `linear-gradient(90deg, ${t.color || '#6366f1'}, ${t.color || '#6366f1'}44)` }} />

                                    <div className="p-5">
                                        <div className="flex items-start gap-3 mb-4">
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
                                                <h4 className="font-black text-sm text-foreground group-hover:text-primary transition-colors leading-tight truncate">
                                                    {t.name}
                                                </h4>
                                                <p className="text-[10px] text-muted-foreground mt-0.5 font-medium">
                                                    {t.totalQ} questions · {t.done} completed
                                                </p>
                                            </div>
                                            {t.pct === 100 && (
                                                <div className="bg-amber-400 text-amber-900 px-1.5 py-0.5 text-[9px] font-black uppercase tracking-widest flex items-center gap-1 flex-shrink-0">
                                                    <Trophy className="w-2.5 h-2.5" /> Done
                                                </div>
                                            )}
                                        </div>

                                        <div className="space-y-1.5 mb-4">
                                            <div className="flex justify-between text-[10px]">
                                                <span className="text-muted-foreground">{t.done}/{t.totalQ} done</span>
                                                <span className="font-bold text-foreground">{t.pct}%</span>
                                            </div>
                                            <div className="h-1.5 bg-muted overflow-hidden">
                                                <div
                                                    className="h-full transition-all duration-700"
                                                    style={{
                                                        width: `${t.pct}%`,
                                                        background: t.pct === 100 ? '#10b981' : (t.color || 'hsl(var(--primary))'),
                                                    }}
                                                />
                                            </div>
                                        </div>

                                        <div
                                            className="flex items-center justify-between pt-3 border-t gap-1.5"
                                            style={{ borderColor: `${t.color || '#6366f1'}20` }}
                                        >
                                            <Link to={`/study/${t.id}`} className="flex-1">
                                                <Button
                                                    size="sm"
                                                    variant="ghost"
                                                    className="w-full text-xs font-bold h-8 justify-start gap-1.5"
                                                    style={{ color: t.color || 'hsl(var(--primary))' }}
                                                >
                                                    {t.done === 0 ? 'Start' : t.pct === 100 ? 'Review' : 'Continue'}
                                                    <ArrowRight className="w-3 h-3" />
                                                </Button>
                                            </Link>
                                            <Button size="sm" variant="ghost" className="text-xs px-2 h-8 text-muted-foreground hover:text-foreground" onClick={() => handleExportPDF(t)}>
                                                <FileText className="w-3.5 h-3.5" />
                                            </Button>
                                            {t.done > 0 && (
                                                <Button size="sm" variant="ghost" className="text-xs px-2 h-8 text-muted-foreground hover:text-foreground"
                                                    onClick={() => resetProgress(t.id)} disabled={resettingId === t.id}>
                                                    <RotateCcw className={`w-3.5 h-3.5 ${resettingId === t.id ? 'animate-spin' : ''}`} />
                                                </Button>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                )}
            </div>

            <div>
                <div className="flex items-center gap-2 mb-4">
                    <div className="w-0.5 h-5 bg-primary" />
                    <h2 className="text-lg font-black text-foreground">Quick Actions</h2>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {[
                        { to: '/quiz', icon: Brain, label: 'Take Quiz', sub: 'Test your knowledge', color: 'bg-violet-500/10', ic: 'text-violet-600' },
                        { to: '/mock-interview', icon: Mic, label: 'Mock Interview', sub: 'Simulate real interviews', color: 'bg-pink-500/10', ic: 'text-pink-600' },
                        { to: '/revision', icon: Target, label: 'Revision', sub: 'Study weak areas', color: 'bg-blue-500/10', ic: 'text-blue-600' },
                        { to: '/analytics', icon: TrendingUp, label: 'Analytics', sub: 'Track your growth', color: 'bg-emerald-500/10', ic: 'text-emerald-600' },
                    ].map(item => (
                        <Link key={item.to} to={item.to}>
                            <div className="bg-card border border-border hover:border-primary/40 hover:shadow-md transition-all cursor-pointer group p-4">
                                <div className={`w-9 h-9 ${item.color} flex items-center justify-center mb-3 group-hover:scale-110 transition-transform`}>
                                    <item.icon className={`w-4 h-4 ${item.ic}`} />
                                </div>
                                <p className="text-sm font-bold text-foreground">{item.label}</p>
                                <p className="text-xs text-muted-foreground mt-0.5">{item.sub}</p>
                            </div>
                        </Link>
                    ))}
                </div>
            </div>
        </div>
    );
}