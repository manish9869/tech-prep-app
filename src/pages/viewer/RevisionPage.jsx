import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/api/supabaseClient';
import { Question, Progress, Bookmark, QuizAttempt } from '@/api/entities';
import PageHeader from '@/components/shared/PageHeader';
import QuestionCard from '@/components/shared/QuestionCard';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Target, XCircle, Clock, Zap, AlertTriangle } from 'lucide-react';
import { motion } from 'framer-motion';

function EmptyTab({ icon: Icon, title, desc }) {
    return (
        <div className="text-center py-16">
            <div className="w-14 h-14 rounded-2xl bg-muted flex items-center justify-center mx-auto mb-3">
                <Icon className="w-7 h-7 text-muted-foreground" />
            </div>
            <p className="font-semibold text-foreground text-sm mb-1">{title}</p>
            <p className="text-xs text-muted-foreground max-w-xs mx-auto">{desc}</p>
        </div>
    );
}

export default function RevisionPage() {
    const { data: user } = useQuery({
        queryKey: ['me'],
        queryFn: async () => {
            const { data: { user } } = await supabase.auth.getUser();
            return user;
        },
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

    const qc = useQueryClient();

    const bookmarkMut = useMutation({
        mutationFn: (q) => {
            const bm = bookmarks.find(b => b.question_id === q.id);
            if (bm) return Bookmark.delete(bm.id);
            return Bookmark.create({
                user_id: user.id,
                question_id: q.id,
                question_title: q.title,
                topic_name: q.topic_name,
                difficulty: q.difficulty,
            });
        },
        onSuccess: () => qc.invalidateQueries({ queryKey: ['bookmarks'] }),
    });

    const visible = allQs.filter(q => q.is_visible !== false && q.status === 'published');
    const completedIds = new Set(progress.map(p => p.question_id));
    const bookmarkIds = new Set(bookmarks.map(b => b.question_id));

    // ❌ Wrong answers from quizzes — needs re-study
    const wrongIds = new Set(
        quizzes.flatMap(q => (q.answers || []).filter(a => !a.is_correct).map(a => a.question_id))
    );
    const wrongQs = visible.filter(q => wrongIds.has(q.id));

    // 🎯 Not yet attempted (not completed) — start fresh
    const unansweredQs = visible.filter(q => !completedIds.has(q.id)).slice(0, 40);

    // ⚡ Quick revision — completed but bookmarked (want to revisit)
    const revisitQs = visible.filter(q => completedIds.has(q.id) && bookmarkIds.has(q.id));

    // 🕐 Recently completed — review what you just learned
    const recentlyDone = visible
        .filter(q => completedIds.has(q.id))
        .sort((a, b) => {
            const pa = progress.find(p => p.question_id === a.id);
            const pb = progress.find(p => p.question_id === b.id);
            return new Date(pb?.completed_at || 0) - new Date(pa?.completed_at || 0);
        })
        .slice(0, 25);

    const renderList = (qs, emptyComp) =>
        qs.length === 0 ? emptyComp : (
            <div className="grid sm:grid-cols-2 gap-3 mt-4">
                {qs.map((q, i) => (
                    <motion.div key={q.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}>
                        <QuestionCard
                            question={q}
                            isBookmarked={bookmarkIds.has(q.id)}
                            isCompleted={completedIds.has(q.id)}
                            onBookmark={() => bookmarkMut.mutate(q)}
                            linkTo={`/question/${q.id}`}
                        />
                    </motion.div>
                ))}
            </div>
        );

    const tabs = [
        {
            value: 'wrong',
            icon: XCircle,
            label: '❌ Wrong Answers',
            count: wrongQs.length,
            qs: wrongQs,
            empty: <EmptyTab icon={XCircle} title="No wrong answers yet!" desc="Your quiz wrong answers appear here so you can re-study them. Keep quizzing!" />,
        },
        {
            value: 'unanswered',
            icon: Target,
            label: '🎯 Not Started',
            count: unansweredQs.length,
            qs: unansweredQs,
            empty: <EmptyTab icon={Target} title="You've started everything!" desc="All available questions have been attempted. Amazing work!" />,
        },
        {
            value: 'revisit',
            icon: Zap,
            label: '⚡ Revisit',
            count: revisitQs.length,
            qs: revisitQs,
            empty: <EmptyTab icon={Zap} title="Nothing to revisit yet" desc="Bookmark a completed question to add it here for quick revision." />,
        },
        {
            value: 'recent',
            icon: Clock,
            label: '🕐 Recently Done',
            count: recentlyDone.length,
            qs: recentlyDone,
            empty: <EmptyTab icon={Clock} title="Nothing done yet" desc="Questions you've marked as completed will appear here." />,
        },
    ];

    return (
        <div className="space-y-6 max-w-4xl">
            <PageHeader
                title="🧠 Revision Center"
                badge="Smart Review"
                description="Focus on weak areas, unattempted questions, and recent study to maximize retention"
            />

            <div className="rounded-2xl border border-primary/20 bg-primary/5 p-4 flex gap-3 items-start">
                <AlertTriangle className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                <div className="text-sm">
                    <p className="font-semibold text-foreground mb-0.5">💡 Revision Center vs Bookmarks</p>
                    <p className="text-muted-foreground text-xs leading-relaxed">
                        <strong className="text-foreground">Bookmarks</strong> = questions you saved for reference (like a reading list). &nbsp;
                        <strong className="text-foreground">Revision Center</strong> = smart queue based on your <em>weak areas</em> — wrong quiz answers, unattempted questions, and recently studied topics.
                    </p>
                </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[
                    { label: 'Wrong Answers', value: wrongQs.length, color: 'bg-red-500/10 text-red-600', emoji: '❌' },
                    { label: 'Not Started', value: unansweredQs.length, color: 'bg-amber-500/10 text-amber-600', emoji: '🎯' },
                    { label: 'To Revisit', value: revisitQs.length, color: 'bg-primary/10 text-primary', emoji: '⚡' },
                    { label: 'Completed', value: completedIds.size, color: 'bg-emerald-500/10 text-emerald-600', emoji: '✅' },
                ].map(s => (
                    <div key={s.label} className={`rounded-2xl p-4 ${s.color} border border-current/10`}>
                        <p className="text-2xl font-bold font-heading">{s.emoji} {s.value}</p>
                        <p className="text-xs font-medium opacity-80 mt-0.5">{s.label}</p>
                    </div>
                ))}
            </div>

            <Tabs defaultValue="wrong">
                <TabsList className="flex-wrap h-auto gap-1 bg-muted p-1 rounded-2xl">
                    {tabs.map(t => (
                        <TabsTrigger key={t.value} value={t.value} className="rounded-xl text-xs gap-1.5">
                            {t.label}
                            <Badge variant="secondary" className="text-[10px] h-4 px-1.5 ml-0.5">{t.count}</Badge>
                        </TabsTrigger>
                    ))}
                </TabsList>

                {tabs.map(t => (
                    <TabsContent key={t.value} value={t.value}>
                        {renderList(t.qs, t.empty)}
                    </TabsContent>
                ))}
            </Tabs>
        </div>
    );
}