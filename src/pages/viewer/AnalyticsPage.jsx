import React, { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/api/supabaseClient';
import { Topic, Question, Progress, Bookmark, QuizAttempt } from '@/api/entities';
import PageHeader from '@/components/shared/PageHeader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import StatCard from '@/components/shared/StatCard';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    LineChart, Line, PieChart, Pie, Cell, Legend,
} from 'recharts';
import { CheckCircle2, Brain, Bookmark as BookmarkIcon, BookOpen, TrendingUp, Zap } from 'lucide-react';
import { motion } from 'framer-motion';
import { format, subDays } from 'date-fns';

const PIE_COLORS = ['hsl(245,58%,51%)', 'hsl(152,60%,40%)', 'hsl(38,92%,50%)', 'hsl(0,72%,51%)', 'hsl(280,65%,60%)'];

export default function AnalyticsPage() {
    const { data: user } = useQuery({
        queryKey: ['me'],
        queryFn: async () => {
            const { data: { user } } = await supabase.auth.getUser();
            return user;
        },
    });

    const { data: topics = [] } = useQuery({
        queryKey: ['topics'],
        queryFn: () => Topic.list(),
    });

    const { data: allQs = [] } = useQuery({
        queryKey: ['questions'],
        queryFn: () => Question.list('created_at', false),
    });

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

    const visibleQs = allQs.filter(q => q.is_visible !== false && q.status === 'published');
    const completedIds = new Set(progress.map(p => p.question_id));
    const totalCompleted = completedIds.size;
    const avgQuiz = quizzes.length
        ? Math.round(quizzes.reduce((a, q) => a + (q.score_percentage || 0), 0) / quizzes.length)
        : 0;

    // Topic progress chart
    const topicChartData = useMemo(() => {
        const visibleTopics = topics.filter(t => t.is_visible !== false);
        return visibleTopics.map(t => {
            const tQs = visibleQs.filter(q => q.topic_id === t.id);
            const done = tQs.filter(q => completedIds.has(q.id)).length;
            const pct = tQs.length > 0 ? Math.round((done / tQs.length) * 100) : 0;
            return { name: t.name?.slice(0, 10), pct, done, total: tQs.length };
        }).filter(d => d.total > 0);
    }, [topics, visibleQs, completedIds]);

    // Quiz performance by topic
    const quizTopicData = useMemo(() => {
        const byTopic = {};
        quizzes.forEach(q => {
            if (!q.topic_name) return;
            if (!byTopic[q.topic_name]) byTopic[q.topic_name] = { scores: [], name: q.topic_name };
            byTopic[q.topic_name].scores.push(q.score_percentage || 0);
        });
        return Object.values(byTopic).map(t => ({
            name: t.name.slice(0, 10),
            avg: Math.round(t.scores.reduce((a, b) => a + b, 0) / t.scores.length),
        }));
    }, [quizzes]);

    // Daily activity last 14 days
    const activityData = useMemo(() => {
        return Array.from({ length: 14 }, (_, i) => {
            const d = subDays(new Date(), 13 - i);
            const key = format(d, 'yyyy-MM-dd');
            const count = progress.filter(
                p => p.completed_at && format(new Date(p.completed_at), 'yyyy-MM-dd') === key
            ).length;
            return { day: format(d, 'MMM d'), count };
        });
    }, [progress]);

    // Difficulty breakdown
    const diffData = [
        {
            name: 'Basic',
            value: progress.filter(p => allQs.find(q => q.id === p.question_id)?.difficulty === 'basic').length,
        },
        {
            name: 'Medium',
            value: progress.filter(p => allQs.find(q => q.id === p.question_id)?.difficulty === 'medium').length,
        },
        {
            name: 'Experienced',
            value: progress.filter(p => allQs.find(q => q.id === p.question_id)?.difficulty === 'experienced').length,
        },
    ].filter(d => d.value > 0);

    const sorted = [...topicChartData].sort((a, b) => b.pct - a.pct);
    const bestTopic = sorted[0];
    const weakestTopic = sorted[sorted.length - 1];

    const summary = () => {
        const parts = [];
        if (bestTopic && bestTopic.pct > 0)
            parts.push(`Your strongest topic is ${bestTopic.name} with ${bestTopic.pct}% completion.`);
        if (weakestTopic && weakestTopic.pct < bestTopic?.pct)
            parts.push(`Focus more on ${weakestTopic.name} — you're only at ${weakestTopic.pct}%.`);
        if (avgQuiz > 0) parts.push(`Your average quiz score is ${avgQuiz}%.`);
        if (quizzes.length > 0) {
            const lowScoreTopic = [...quizTopicData].sort((a, b) => a.avg - b.avg)[0];
            if (lowScoreTopic && lowScoreTopic.avg < 60)
                parts.push(`Recommended: Review ${lowScoreTopic.name} — quiz average below 60%.`);
        }
        return parts.length ? parts.join(' ') : 'Start studying to unlock personalized learning insights!';
    };

    const topicsStarted = topicChartData.filter(t => t.done > 0).length;

    return (
        <div className="space-y-8">
            <PageHeader title="Learning Analytics" badge="Insights" description="Deep dive into your learning performance and patterns" />

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard title="Questions Completed" value={totalCompleted} icon={CheckCircle2} color="success" delay={0} />
                <StatCard title="Topics Started" value={topicsStarted} icon={BookOpen} color="primary" delay={0.05} />
                <StatCard title="Bookmarks" value={bookmarks.length} icon={BookmarkIcon} color="warning" delay={0.1} />
                <StatCard title="Avg Quiz Score" value={`${avgQuiz}%`} icon={Brain} color="violet" delay={0.15} />
            </div>

            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
                <Card className="rounded-2xl border-primary/20 bg-gradient-to-br from-primary/5 to-violet-500/5">
                    <CardContent className="p-5">
                        <div className="flex items-start gap-3">
                            <div className="p-2 rounded-xl bg-primary/10 flex-shrink-0 mt-0.5">
                                <Zap className="w-4 h-4 text-primary" />
                            </div>
                            <div>
                                <p className="text-xs font-semibold text-primary uppercase tracking-wider mb-1">Personalized Learning Summary</p>
                                <p className="text-sm text-foreground leading-relaxed">{summary()}</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </motion.div>

            <div className="grid md:grid-cols-2 gap-6">
                <Card className="rounded-2xl">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-base font-semibold flex items-center gap-2">
                            <TrendingUp className="w-4 h-4 text-primary" /> Topic Completion %
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        {topicChartData.length > 0 ? (
                            <ResponsiveContainer width="100%" height={240}>
                                <BarChart data={topicChartData} barSize={22}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                                    <XAxis dataKey="name" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }} axisLine={false} tickLine={false} />
                                    <YAxis domain={[0, 100]} tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={v => `${v}%`} />
                                    <Tooltip contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '12px', fontSize: 12 }} formatter={v => [`${v}%`, 'Progress']} />
                                    <Bar dataKey="pct" fill="hsl(var(--primary))" radius={[6, 6, 0, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="h-52 flex items-center justify-center text-sm text-muted-foreground">Start studying to see progress</div>
                        )}
                    </CardContent>
                </Card>

                <Card className="rounded-2xl">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-base font-semibold flex items-center gap-2">
                            <Brain className="w-4 h-4 text-violet-600" /> Quiz Score by Topic
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        {quizTopicData.length > 0 ? (
                            <ResponsiveContainer width="100%" height={240}>
                                <BarChart data={quizTopicData} barSize={22}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                                    <XAxis dataKey="name" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }} axisLine={false} tickLine={false} />
                                    <YAxis domain={[0, 100]} tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={v => `${v}%`} />
                                    <Tooltip contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '12px', fontSize: 12 }} formatter={v => [`${v}%`, 'Avg Score']} />
                                    <Bar dataKey="avg" fill="hsl(280,65%,60%)" radius={[6, 6, 0, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="h-52 flex items-center justify-center text-sm text-muted-foreground">Take quizzes to see performance</div>
                        )}
                    </CardContent>
                </Card>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
                <Card className="rounded-2xl">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-base font-semibold">Daily Activity (Last 14 Days)</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <ResponsiveContainer width="100%" height={200}>
                            <LineChart data={activityData}>
                                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                                <XAxis dataKey="day" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 9 }} axisLine={false} tickLine={false} interval={2} />
                                <YAxis tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }} axisLine={false} tickLine={false} allowDecimals={false} />
                                <Tooltip contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '12px', fontSize: 12 }} formatter={v => [v, 'Questions']} />
                                <Line type="monotone" dataKey="count" stroke="hsl(var(--primary))" strokeWidth={2.5} dot={{ r: 3, fill: 'hsl(var(--primary))' }} />
                            </LineChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>

                <Card className="rounded-2xl">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-base font-semibold">Difficulty Breakdown</CardTitle>
                    </CardHeader>
                    <CardContent>
                        {diffData.length > 0 ? (
                            <ResponsiveContainer width="100%" height={200}>
                                <PieChart>
                                    <Pie data={diffData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={4} dataKey="value">
                                        {diffData.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} strokeWidth={0} />)}
                                    </Pie>
                                    <Legend formatter={v => <span style={{ fontSize: 12, color: 'hsl(var(--foreground))' }}>{v}</span>} />
                                    <Tooltip contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '12px', fontSize: 12 }} />
                                </PieChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="h-48 flex items-center justify-center text-sm text-muted-foreground">Complete questions to see breakdown</div>
                        )}
                    </CardContent>
                </Card>
            </div>

            {(bestTopic || weakestTopic) && (
                <div className="grid sm:grid-cols-2 gap-4">
                    {bestTopic && bestTopic.pct > 0 && (
                        <Card className="rounded-2xl border-emerald-500/20 bg-emerald-500/5">
                            <CardContent className="p-5 flex items-center gap-4">
                                <div className="text-3xl">🌟</div>
                                <div>
                                    <p className="text-xs font-semibold text-emerald-600 uppercase tracking-wider">Best Topic</p>
                                    <p className="text-lg font-bold text-foreground">{bestTopic.name}</p>
                                    <p className="text-sm text-muted-foreground">{bestTopic.pct}% completed • {bestTopic.done}/{bestTopic.total} questions</p>
                                </div>
                            </CardContent>
                        </Card>
                    )}
                    {weakestTopic && weakestTopic.pct < (bestTopic?.pct || 0) && (
                        <Card className="rounded-2xl border-amber-500/20 bg-amber-500/5">
                            <CardContent className="p-5 flex items-center gap-4">
                                <div className="text-3xl">🎯</div>
                                <div>
                                    <p className="text-xs font-semibold text-amber-600 uppercase tracking-wider">Needs Attention</p>
                                    <p className="text-lg font-bold text-foreground">{weakestTopic.name}</p>
                                    <p className="text-sm text-muted-foreground">{weakestTopic.pct}% completed • {weakestTopic.done}/{weakestTopic.total} questions</p>
                                </div>
                            </CardContent>
                        </Card>
                    )}
                </div>
            )}
        </div>
    );
}