import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/api/supabaseClient';
import { Progress, Bookmark, QuizAttempt } from '@/api/entities';
import PageHeader from '@/components/shared/PageHeader';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';

const BADGES = [
    { id: 'first_question', icon: '🎯', title: 'First Step', desc: 'Complete your first question', color: 'from-emerald-400 to-teal-500', check: ({ done }) => done >= 1 },
    { id: 'questions_10', icon: '⚡', title: 'On Fire', desc: 'Complete 10 questions', color: 'from-amber-400 to-orange-500', check: ({ done }) => done >= 10 },
    { id: 'questions_50', icon: '🏅', title: 'Half Century', desc: 'Complete 50 questions', color: 'from-blue-400 to-indigo-500', check: ({ done }) => done >= 50 },
    { id: 'questions_100', icon: '💯', title: 'Century Club', desc: 'Complete 100 questions', color: 'from-violet-400 to-purple-600', check: ({ done }) => done >= 100 },
    { id: 'first_quiz', icon: '🧠', title: 'Quiz Taker', desc: 'Complete your first quiz', color: 'from-pink-400 to-rose-500', check: ({ quizzes }) => quizzes >= 1 },
    { id: 'quiz_80', icon: '🏆', title: 'High Achiever', desc: 'Score 80%+ on a quiz', color: 'from-yellow-400 to-amber-500', check: ({ bestQuiz }) => bestQuiz >= 80 },
    { id: 'quiz_100', icon: '🎓', title: 'Perfectionist', desc: 'Score 100% on a quiz', color: 'from-emerald-500 to-green-600', check: ({ bestQuiz }) => bestQuiz >= 100 },
    { id: 'bookmark_5', icon: '🔖', title: 'Collector', desc: 'Bookmark 5 questions', color: 'from-cyan-400 to-blue-500', check: ({ bookmarks }) => bookmarks >= 5 },
    { id: 'bookmark_20', icon: '📚', title: 'Scholar', desc: 'Bookmark 20 questions', color: 'from-indigo-400 to-violet-500', check: ({ bookmarks }) => bookmarks >= 20 },
    { id: 'streak_3', icon: '🔥', title: 'Streak Starter', desc: '3-day study streak', color: 'from-orange-400 to-red-500', check: ({ streak }) => streak >= 3 },
    { id: 'streak_7', icon: '🌟', title: 'Streak Master', desc: '7-day study streak', color: 'from-yellow-400 to-orange-500', check: ({ streak }) => streak >= 7 },
    { id: 'topics_3', icon: '🗺️', title: 'Explorer', desc: 'Start 3 different topics', color: 'from-teal-400 to-emerald-500', check: ({ topicsStarted }) => topicsStarted >= 3 },
];

export default function AchievementsPage() {
    const { data: userData } = useQuery({
        queryKey: ['me'],
        queryFn: async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return null;
            const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single();
            return { ...user, ...profile };
        },
    });
    const user = userData;

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

    const done = new Set(progress.map(p => p.question_id)).size;
    const bestQuiz = quizzes.length ? Math.max(...quizzes.map(q => q.score_percentage || 0)) : 0;
    const topicsStarted = new Set(progress.map(p => p.topic_id)).size;
    const streak = user?.current_streak || 0;

    const stats = { done, quizzes: quizzes.length, bestQuiz, bookmarks: bookmarks.length, streak, topicsStarted };

    const earned = BADGES.filter(b => b.check(stats));
    const locked = BADGES.filter(b => !b.check(stats));

    return (
        <div className="space-y-8 max-w-3xl">
            <PageHeader
                title="Achievements"
                badge="Your Badges"
                description={`${earned.length} of ${BADGES.length} badges earned`}
            />

            {/* Progress Overview */}
            <Card className="rounded-2xl bg-gradient-to-br from-primary/5 to-violet-500/5 border-primary/20">
                <CardContent className="p-6">
                    <div className="flex items-center gap-4">
                        <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center text-3xl">🏆</div>
                        <div>
                            <p className="text-2xl font-black text-foreground">{earned.length}/{BADGES.length} <span className="text-base font-normal text-muted-foreground">badges earned</span></p>
                            <div className="flex gap-4 mt-1 text-xs text-muted-foreground">
                                <span>🎯 {done} questions done</span>
                                <span>🧠 {quizzes.length} quizzes taken</span>
                                <span>🔥 {streak}-day streak</span>
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Earned Badges */}
            {earned.length > 0 && (
                <div>
                    <h2 className="text-lg font-bold mb-4">🌟 Earned Badges</h2>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                        {earned.map((badge, i) => (
                            <motion.div key={badge.id} initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: i * 0.06, type: 'spring', stiffness: 200 }}>
                                <Card className="rounded-2xl overflow-hidden hover:shadow-lg transition-all hover:-translate-y-1">
                                    <div className={`h-24 bg-gradient-to-br ${badge.color} flex items-center justify-center text-4xl`}>
                                        {badge.icon}
                                    </div>
                                    <CardContent className="p-3 text-center">
                                        <p className="font-bold text-sm">{badge.title}</p>
                                        <p className="text-xs text-muted-foreground mt-0.5">{badge.desc}</p>
                                    </CardContent>
                                </Card>
                            </motion.div>
                        ))}
                    </div>
                </div>
            )}

            {/* Locked Badges */}
            {locked.length > 0 && (
                <div>
                    <h2 className="text-lg font-bold mb-4 text-muted-foreground">🔒 Locked Badges</h2>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                        {locked.map((badge, i) => (
                            <Card key={badge.id} className="rounded-2xl overflow-hidden opacity-50 grayscale">
                                <div className="h-24 bg-muted flex items-center justify-center text-4xl filter grayscale">
                                    {badge.icon}
                                </div>
                                <CardContent className="p-3 text-center">
                                    <p className="font-bold text-sm">{badge.title}</p>
                                    <p className="text-xs text-muted-foreground mt-0.5">{badge.desc}</p>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}