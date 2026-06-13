import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/api/supabaseClient';
import { QuizAttempt } from '@/api/entities';
import PageHeader from '@/components/shared/PageHeader';
import EmptyState from '@/components/shared/EmptyState';
import StatCard from '@/components/shared/StatCard';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Clock, Brain, CheckCircle2, Trophy } from 'lucide-react';
import { format } from 'date-fns';
import { motion } from 'framer-motion';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export default function QuizHistoryPage() {
    const { data: user } = useQuery({
        queryKey: ['me'],
        queryFn: async () => {
            const { data: { user } } = await supabase.auth.getUser();
            return user;
        },
    });

    const { data: quizzes = [], isLoading } = useQuery({
        queryKey: ['quizAttempts', user?.id],
        queryFn: () => QuizAttempt.filter({ user_id: user.id }, 'created_at', false),
        enabled: !!user?.id,
    });

    const avgScore = quizzes.length
        ? Math.round(quizzes.reduce((a, q) => a + (q.score_percentage || 0), 0) / quizzes.length)
        : 0;
    const bestScore = quizzes.length ? Math.max(...quizzes.map(q => q.score_percentage || 0)) : 0;
    const totalQ = quizzes.reduce((a, q) => a + (q.total_questions || 0), 0);

    // Show last 10 in chronological order for the trend chart
    const chartData = [...quizzes].slice(0, 10).reverse().map((q, i) => ({
        name: `#${i + 1}`,
        score: q.score_percentage || 0,
    }));

    const formatTime = s => s ? `${Math.floor(s / 60)}m ${s % 60}s` : '—';

    return (
        <div className="space-y-6 max-w-4xl">
            <PageHeader title="Quiz History" badge="Performance" description="Track your quiz performance over time" />

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <StatCard title="Total Quizzes" value={quizzes.length} icon={Brain} color="primary" />
                <StatCard title="Avg Score" value={`${avgScore}%`} icon={CheckCircle2} color="success" />
                <StatCard title="Best Score" value={`${bestScore}%`} icon={Trophy} color="warning" />
                <StatCard title="Questions Done" value={totalQ} icon={Clock} color="violet" />
            </div>

            {chartData.length > 1 && (
                <Card className="rounded-2xl">
                    <CardContent className="p-6">
                        <h3 className="text-sm font-semibold mb-4">Score Trend (Last 10 Quizzes)</h3>
                        <ResponsiveContainer width="100%" height={180}>
                            <LineChart data={chartData}>
                                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                                <XAxis dataKey="name" tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} axisLine={false} tickLine={false} />
                                <YAxis domain={[0, 100]} tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} axisLine={false} tickLine={false} tickFormatter={v => `${v}%`} />
                                <Tooltip contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '12px', fontSize: 12 }} formatter={v => [`${v}%`, 'Score']} />
                                <Line type="monotone" dataKey="score" stroke="hsl(var(--primary))" strokeWidth={2.5} dot={{ r: 4, fill: 'hsl(var(--primary))' }} />
                            </LineChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>
            )}

            {isLoading ? (
                <div className="space-y-3">{Array(4).fill(0).map((_, i) => <div key={i} className="h-20 bg-muted rounded-2xl animate-pulse" />)}</div>
            ) : quizzes.length === 0 ? (
                <EmptyState icon={Brain} title="No quizzes yet" description="Take your first quiz to see your performance history here" />
            ) : (
                <div className="space-y-3">
                    {quizzes.map((q, i) => (
                        <motion.div key={q.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}>
                            <Card className="rounded-2xl hover:shadow-md transition-all">
                                <CardContent className="p-4 flex items-center gap-4">
                                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-black text-sm flex-shrink-0 ${(q.score_percentage || 0) >= 80 ? 'bg-emerald-500/10 text-emerald-600' :
                                        (q.score_percentage || 0) >= 60 ? 'bg-amber-500/10 text-amber-600' :
                                            'bg-red-500/10 text-red-600'
                                        }`}>
                                        {q.score_percentage || 0}%
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="font-semibold text-sm">{q.topic_name || 'Mixed'}</p>
                                        <div className="flex items-center gap-3 mt-0.5">
                                            <span className="text-xs text-muted-foreground flex items-center gap-1">
                                                <CheckCircle2 className="w-3 h-3 text-emerald-500" />{q.correct_answers}/{q.total_questions} correct
                                            </span>
                                            <span className="text-xs text-muted-foreground flex items-center gap-1">
                                                <Clock className="w-3 h-3" />{formatTime(q.time_taken)}
                                            </span>
                                            {q.difficulty && q.difficulty !== 'all' && (
                                                <Badge variant="outline" className="text-[10px]">{q.difficulty}</Badge>
                                            )}
                                        </div>
                                    </div>
                                    <span className="text-xs text-muted-foreground whitespace-nowrap">
                                        {q.created_at ? format(new Date(q.created_at), 'MMM d') : ''}
                                    </span>
                                </CardContent>
                            </Card>
                        </motion.div>
                    ))}
                </div>
            )}
        </div>
    );
}