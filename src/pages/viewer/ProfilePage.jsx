import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { getCurrentUser } from '@/api/auth';
import { Progress as ProgressEntity, Bookmark as BookmarkEntity, QuizAttempt } from '@/api/entities';
import PageHeader from '@/components/shared/PageHeader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
    Mail, Calendar, CheckCircle2, Brain, Bookmark, Trophy, Flame,
    BookOpen, Star, TrendingUp
} from 'lucide-react';
import { motion } from 'framer-motion';
import { format } from 'date-fns';

const BADGES = [
    { id: 'first_question', icon: '🎯', title: 'First Step', check: ({ done }) => done >= 1 },
    { id: 'questions_10', icon: '⚡', title: 'On Fire', check: ({ done }) => done >= 10 },
    { id: 'questions_50', icon: '🏅', title: 'Half Century', check: ({ done }) => done >= 50 },
    { id: 'questions_100', icon: '💯', title: 'Century Club', check: ({ done }) => done >= 100 },
    { id: 'first_quiz', icon: '🧠', title: 'Quiz Taker', check: ({ quizzes }) => quizzes >= 1 },
    { id: 'quiz_80', icon: '🏆', title: 'High Achiever', check: ({ bestQuiz }) => bestQuiz >= 80 },
    { id: 'quiz_100', icon: '🎓', title: 'Perfectionist', check: ({ bestQuiz }) => bestQuiz >= 100 },
    { id: 'bookmark_5', icon: '🔖', title: 'Collector', check: ({ bookmarks }) => bookmarks >= 5 },
    { id: 'streak_3', icon: '🔥', title: 'Streak Starter', check: ({ streak }) => streak >= 3 },
    { id: 'streak_7', icon: '🌟', title: 'Streak Master', check: ({ streak }) => streak >= 7 },
    { id: 'topics_3', icon: '🗺️', title: 'Explorer', check: ({ topicsStarted }) => topicsStarted >= 3 },
];

export default function ProfilePage() {
    const { data: user } = useQuery({ queryKey: ['me'], queryFn: getCurrentUser });
    const { data: progress = [] } = useQuery({
        queryKey: ['progress', user?.id],
        queryFn: () => ProgressEntity.filter({ user_id: user.id }),
        enabled: !!user?.id,
    });
    const { data: bookmarks = [] } = useQuery({
        queryKey: ['bookmarks', user?.id],
        queryFn: () => BookmarkEntity.filter({ user_id: user.id }),
        enabled: !!user?.id,
    });
    const { data: quizzes = [] } = useQuery({
        queryKey: ['quizAttempts', user?.id],
        queryFn: () => QuizAttempt.filter({ user_id: user.id }),
        enabled: !!user?.id,
    });

    const done = new Set(progress.map(p => p.question_id)).size;
    const topicsStarted = new Set(progress.map(p => p.topic_id)).size;
    const bestQuiz = quizzes.length ? Math.max(...quizzes.map(q => q.score_percentage || 0)) : 0;
    const avgQuiz = quizzes.length ? Math.round(quizzes.reduce((a, q) => a + (q.score_percentage || 0), 0) / quizzes.length) : 0;
    const streak = user?.current_streak || 0;
    const longestStreak = user?.longest_streak || 0;
    const stats = { done, quizzes: quizzes.length, bestQuiz, bookmarks: bookmarks.length, streak, topicsStarted };
    const earnedBadges = BADGES.filter(b => b.check(stats));

    const joinedDate = user?.created_at ? format(new Date(user.created_at), 'MMMM d, yyyy') : '—';
    const initials = user?.full_name?.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() || '?';

    const profileStats = [
        { icon: CheckCircle2, label: 'Questions Completed', value: done, color: 'text-emerald-600', bg: 'bg-emerald-500/10' },
        { icon: BookOpen, label: 'Topics Started', value: topicsStarted, color: 'text-primary', bg: 'bg-primary/10' },
        { icon: Brain, label: 'Quiz Attempts', value: quizzes.length, color: 'text-violet-600', bg: 'bg-violet-500/10' },
        { icon: Star, label: 'Avg Quiz Score', value: `${avgQuiz}%`, color: 'text-amber-600', bg: 'bg-amber-500/10' },
        { icon: Trophy, label: 'Best Quiz Score', value: `${bestQuiz}%`, color: 'text-yellow-600', bg: 'bg-yellow-500/10' },
        { icon: Bookmark, label: 'Bookmarks', value: bookmarks.length, color: 'text-blue-600', bg: 'bg-blue-500/10' },
        { icon: Flame, label: 'Current Streak', value: `${streak}d`, color: 'text-orange-600', bg: 'bg-orange-500/10' },
        { icon: TrendingUp, label: 'Longest Streak', value: `${longestStreak}d`, color: 'text-rose-600', bg: 'bg-rose-500/10' },
    ];

    return (
        <div className="space-y-8 max-w-3xl">
            <PageHeader title="My Profile" badge="Account" description="Your learning journey at a glance" />

            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
                <Card className="rounded-3xl overflow-hidden">
                    <div className="h-24 bg-gradient-to-br from-primary via-primary/90 to-violet-700" />
                    <CardContent className="px-6 pb-6 -mt-12">
                        <div className="flex items-end gap-5 mb-5">
                            <div className="w-20 h-20 rounded-3xl bg-card border-4 border-card shadow-xl flex items-center justify-center text-2xl font-black text-primary">
                                {initials}
                            </div>
                            <div className="pb-1">
                                <h2 className="text-xl font-bold text-foreground">{user?.full_name || 'User'}</h2>
                                <div className="flex flex-wrap items-center gap-3 mt-1 text-sm text-muted-foreground">
                                    <span className="flex items-center gap-1"><Mail className="w-3.5 h-3.5" />{user?.email}</span>
                                    <span className="flex items-center gap-1"><Calendar className="w-3.5 h-3.5" />Joined {joinedDate}</span>
                                </div>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            <Badge className="capitalize rounded-full px-3 py-1">{user?.role || 'viewer'}</Badge>
                            {earnedBadges.length > 0 && (
                                <div className="flex items-center gap-1">
                                    {earnedBadges.slice(0, 5).map(b => (
                                        <span key={b.id} className="text-xl" title={b.title}>{b.icon}</span>
                                    ))}
                                    {earnedBadges.length > 5 && (
                                        <span className="text-xs text-muted-foreground ml-1">+{earnedBadges.length - 5} more</span>
                                    )}
                                </div>
                            )}
                        </div>
                    </CardContent>
                </Card>
            </motion.div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {profileStats.map((s, i) => (
                    <motion.div key={s.label} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
                        <Card className="rounded-2xl hover:shadow-md transition-all">
                            <CardContent className="p-4 flex flex-col items-center text-center gap-2">
                                <div className={`p-2.5 rounded-xl ${s.bg}`}>
                                    <s.icon className={`w-5 h-5 ${s.color}`} />
                                </div>
                                <p className="text-2xl font-black text-foreground">{s.value}</p>
                                <p className="text-xs text-muted-foreground leading-tight">{s.label}</p>
                            </CardContent>
                        </Card>
                    </motion.div>
                ))}
            </div>

            <Card className="rounded-2xl">
                <CardHeader className="pb-2">
                    <CardTitle className="text-base font-semibold flex items-center gap-2">
                        <Trophy className="w-4 h-4 text-primary" /> Achievements Earned
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    {earnedBadges.length === 0 ? (
                        <p className="text-sm text-muted-foreground py-4 text-center">Complete questions and quizzes to earn badges!</p>
                    ) : (
                        <div className="flex flex-wrap gap-3">
                            {earnedBadges.map(b => (
                                <div key={b.id} className="flex items-center gap-2 bg-muted rounded-xl px-3 py-2 text-sm font-medium">
                                    <span className="text-lg">{b.icon}</span>
                                    {b.title}
                                </div>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>

            {quizzes.length > 0 && (
                <Card className="rounded-2xl">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-base font-semibold">Recent Quiz Performance</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        {quizzes.slice(0, 5).map((q) => (
                            <div key={q.id} className="flex items-center gap-3">
                                <div className="text-xl">{q.score_percentage >= 80 ? '🏆' : q.score_percentage >= 60 ? '⭐' : '📖'}</div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium truncate">{q.topic_name || 'Mixed'} Quiz</p>
                                    <Progress value={q.score_percentage} className="h-1.5 mt-1" />
                                </div>
                                <span className="text-sm font-bold text-foreground">{q.score_percentage}%</span>
                            </div>
                        ))}
                    </CardContent>
                </Card>
            )}
        </div>
    );
}