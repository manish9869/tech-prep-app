import React, { useState, useEffect, useMemo } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/api/supabaseClient';
import { Topic, Question, QuizAttempt } from '@/api/entities';
import PageHeader from '@/components/shared/PageHeader';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Brain, Clock, Trophy, CheckCircle2, XCircle, RotateCcw, Zap } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import DifficultyBadge from '@/components/shared/DifficultyBadge';

export default function QuizPage() {
    const [phase, setPhase] = useState('setup');
    const [config, setConfig] = useState({ topic_id: 'all', difficulty: 'all', count: 10 });
    const [quizQuestions, setQuizQuestions] = useState([]);
    const [current, setCurrent] = useState(0);
    const [selected, setSelected] = useState(null);
    const [answers, setAnswers] = useState([]);
    const [time, setTime] = useState(0);
    const [totalTime, setTotalTime] = useState(0);
    const qc = useQueryClient();

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

    const mcqPool = useMemo(() => {
        let qs = allQs.filter(q => q.is_visible !== false && q.status === 'published' && q.type === 'mcq' && (q.options?.length >= 2));
        if (config.topic_id !== 'all') qs = qs.filter(q => q.topic_id === config.topic_id);
        if (config.difficulty !== 'all') qs = qs.filter(q => q.difficulty === config.difficulty);
        return qs;
    }, [allQs, config.topic_id, config.difficulty]);

    useEffect(() => {
        if (phase !== 'quiz') return;
        const interval = setInterval(() => setTime(t => t + 1), 1000);
        return () => clearInterval(interval);
    }, [phase]);

    const formatTime = (s) => `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;

    const startQuiz = () => {
        if (mcqPool.length === 0) return toast.error('No MCQ questions available for this selection. Add MCQ questions first!');
        const shuffled = [...mcqPool].sort(() => Math.random() - 0.5).slice(0, Math.min(config.count, mcqPool.length));
        setQuizQuestions(shuffled);
        setAnswers([]);
        setCurrent(0);
        setSelected(null);
        setTime(0);
        setPhase('quiz');
    };

    const handleAnswer = (optIdx) => {
        if (selected !== null) return;
        setSelected(optIdx);
        const q = quizQuestions[current];
        const isCorrect = optIdx === q.correct_option_index;
        setTimeout(() => {
            const newAnswers = [...answers, { question_id: q.id, selected_answer: optIdx, is_correct: isCorrect }];
            setAnswers(newAnswers);
            if (current + 1 < quizQuestions.length) {
                setCurrent(c => c + 1);
                setSelected(null);
            } else {
                setTotalTime(time);
                setPhase('result');
                saveResult(newAnswers);
            }
        }, 1200);
    };

    const saveResult = async (finalAnswers) => {
        if (!user?.id) return;
        const correct = finalAnswers.filter(a => a.is_correct).length;
        const pct = Math.round((correct / quizQuestions.length) * 100);
        const topic = topics.find(t => t.id === config.topic_id);
        try {
            await QuizAttempt.create({
                user_id: user.id,
                topic_id: config.topic_id === 'all' ? null : config.topic_id,
                topic_name: config.topic_id === 'all' ? 'Mixed' : topic?.name || '',
                difficulty: config.difficulty,
                total_questions: quizQuestions.length,
                correct_answers: correct,
                wrong_answers: quizQuestions.length - correct,
                score_percentage: pct,
                time_taken: time,
                answers: finalAnswers,
            });
            qc.invalidateQueries({ queryKey: ['quizAttempts'] });
        } catch (err) {
            console.error('Failed to save quiz result:', err);
        }
    };

    const correct = answers.filter(a => a.is_correct).length;
    const pct = quizQuestions.length > 0 ? Math.round((correct / quizQuestions.length) * 100) : 0;

    // ---- SETUP ----
    if (phase === 'setup') return (
        <div className="space-y-6 max-w-2xl">
            <PageHeader title="Take a Quiz" badge="Quiz Mode" description="Test your knowledge and track your performance" />
            <Card className="rounded-3xl border-2 border-primary/10 overflow-hidden">
                <div className="h-1.5 bg-gradient-to-r from-primary to-violet-500" />
                <CardContent className="p-8 space-y-6">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center">
                            <Brain className="w-6 h-6 text-primary" />
                        </div>
                        <div>
                            <h2 className="font-bold text-lg">Configure Your Quiz</h2>
                            <p className="text-sm text-muted-foreground">Only MCQ-type questions are used in quizzes</p>
                        </div>
                    </div>

                    <div className="space-y-5">
                        {/* Topic */}
                        <div>
                            <label className="text-sm font-semibold mb-2 block">Topic</label>
                            <Select value={config.topic_id} onValueChange={v => setConfig(c => ({ ...c, topic_id: v }))}>
                                <SelectTrigger className="rounded-xl">
                                    <SelectValue placeholder="Select topic" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">
                                        <div className="flex items-center gap-2">🌐 All Topics (Mixed)</div>
                                    </SelectItem>
                                    {topics.filter(t => t.is_visible !== false).map(t => (
                                        <SelectItem key={t.id} value={t.id}>
                                            <div className="flex items-center gap-2">
                                                {t.logo_url
                                                    ? <img src={t.logo_url} alt={t.name} className="w-4 h-4 object-contain" />
                                                    : <span className="w-4 h-4 flex items-center justify-center text-white text-[9px] font-black" style={{ background: t.color || '#6366f1' }}>{t.name?.[0]}</span>
                                                }
                                                {t.name}
                                            </div>
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Difficulty */}
                        <div>
                            <label className="text-sm font-semibold mb-2 block">Difficulty</label>
                            <div className="flex gap-2 flex-wrap">
                                {[
                                    { value: 'all', label: 'All Levels' },
                                    { value: 'basic', label: '🟢 Basic' },
                                    { value: 'medium', label: '🟡 Medium' },
                                    { value: 'experienced', label: '🔴 Experienced' },
                                ].map(d => (
                                    <button
                                        key={d.value}
                                        type="button"
                                        onClick={() => setConfig(c => ({ ...c, difficulty: d.value }))}
                                        className={`px-4 py-2 rounded-xl text-sm font-medium border transition-all ${config.difficulty === d.value
                                            ? 'bg-primary text-primary-foreground border-primary'
                                            : 'border-border hover:border-primary/50 hover:bg-muted'
                                            }`}
                                    >
                                        {d.label}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Question count */}
                        <div>
                            <label className="text-sm font-semibold mb-2 block">Number of Questions</label>
                            <div className="flex gap-2 flex-wrap">
                                {[5, 10, 15, 20, 25].map(n => (
                                    <button
                                        key={n}
                                        type="button"
                                        onClick={() => setConfig(c => ({ ...c, count: n }))}
                                        className={`w-14 h-10 rounded-xl text-sm font-bold border transition-all ${config.count === n
                                            ? 'bg-primary text-primary-foreground border-primary'
                                            : 'border-border hover:border-primary/50 hover:bg-muted'
                                            }`}
                                    >
                                        {n}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>

                    <div className="bg-muted/50 rounded-2xl p-4 text-sm text-muted-foreground">
                        <p><span className="font-semibold text-foreground">{mcqPool.length}</span> MCQ questions match your selection</p>
                    </div>

                    <Button onClick={startQuiz} className="w-full rounded-xl h-12 text-base font-bold shadow-lg" disabled={mcqPool.length === 0}>
                        <Zap className="w-5 h-5 mr-2" /> Start Quiz!
                    </Button>
                </CardContent>
            </Card>
        </div>
    );

    // ---- QUIZ ----
    if (phase === 'quiz') {
        const q = quizQuestions[current];
        const progress = (current / quizQuestions.length) * 100;
        return (
            <div className="max-w-2xl space-y-4">
                <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-semibold text-muted-foreground">Q{current + 1} / {quizQuestions.length}</span>
                    <div className="flex items-center gap-1.5 text-sm font-mono font-semibold text-foreground bg-muted px-3 py-1 rounded-full">
                        <Clock className="w-3.5 h-3.5" />{formatTime(time)}
                    </div>
                </div>
                <Progress value={progress} className="h-2 rounded-full" />

                <AnimatePresence mode="wait">
                    <motion.div key={current} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}>
                        <Card className="rounded-2xl overflow-hidden">
                            <div className="h-1.5 bg-gradient-to-r from-primary to-violet-500" />
                            <CardContent className="p-6">
                                <div className="flex items-start gap-2 mb-4">
                                    <DifficultyBadge level={q.difficulty} />
                                    <Badge variant="outline" className="text-[10px] uppercase">{q.topic_name}</Badge>
                                </div>
                                <h3 className="text-lg font-bold mb-6 leading-snug">{q.title}</h3>
                                {q.description && <p className="text-sm text-muted-foreground mb-5">{q.description}</p>}

                                <div className="space-y-3">
                                    {(q.options || []).map((opt, i) => {
                                        let btnClass = 'border-border hover:border-primary/50 hover:bg-primary/5';
                                        if (selected !== null) {
                                            if (i === q.correct_option_index) btnClass = 'border-emerald-500 bg-emerald-500/10 text-emerald-700';
                                            else if (i === selected && selected !== q.correct_option_index) btnClass = 'border-red-500 bg-red-500/10 text-red-700';
                                            else btnClass = 'border-border opacity-50';
                                        }
                                        return (
                                            <button
                                                key={i}
                                                type="button"
                                                onClick={() => handleAnswer(i)}
                                                className={`w-full text-left px-4 py-3.5 rounded-xl border-2 text-sm font-medium transition-all flex items-center gap-3 ${btnClass}`}
                                            >
                                                <span className="w-7 h-7 rounded-full border-2 border-current flex items-center justify-center text-xs font-bold flex-shrink-0">
                                                    {selected !== null && i === q.correct_option_index
                                                        ? <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                                                        : selected !== null && i === selected && selected !== q.correct_option_index
                                                            ? <XCircle className="w-4 h-4 text-red-600" />
                                                            : String.fromCharCode(65 + i)}
                                                </span>
                                                {opt.text}
                                            </button>
                                        );
                                    })}
                                </div>
                            </CardContent>
                        </Card>
                    </motion.div>
                </AnimatePresence>
            </div>
        );
    }

    // ---- RESULT ----
    if (phase === 'result') {
        const grade = pct >= 80 ? '🏆 Excellent!' : pct >= 60 ? '👍 Good Job!' : '📚 Keep Practicing!';
        return (
            <div className="max-w-xl space-y-6">
                <PageHeader title="Quiz Complete!" description="Here's how you performed" />
                <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}>
                    <Card className="rounded-3xl overflow-hidden">
                        <div className={`p-8 text-center text-white ${pct >= 80 ? 'bg-gradient-to-br from-emerald-500 to-teal-600' : pct >= 60 ? 'bg-gradient-to-br from-primary to-violet-600' : 'bg-gradient-to-br from-amber-500 to-orange-600'}`}>
                            <div className="text-5xl mb-2">{pct >= 80 ? '🏆' : pct >= 60 ? '⭐' : '📖'}</div>
                            <p className="text-6xl font-black mb-1">{pct}%</p>
                            <p className="text-xl font-semibold opacity-90">{grade}</p>
                        </div>
                        <CardContent className="p-6 space-y-4">
                            <div className="grid grid-cols-3 gap-3 text-center">
                                <div className="bg-emerald-500/10 rounded-2xl p-4">
                                    <p className="text-2xl font-black text-emerald-600">{correct}</p>
                                    <p className="text-xs text-muted-foreground font-medium">Correct</p>
                                </div>
                                <div className="bg-red-500/10 rounded-2xl p-4">
                                    <p className="text-2xl font-black text-red-600">{quizQuestions.length - correct}</p>
                                    <p className="text-xs text-muted-foreground font-medium">Wrong</p>
                                </div>
                                <div className="bg-muted rounded-2xl p-4">
                                    <p className="text-2xl font-black text-foreground font-mono">{formatTime(totalTime)}</p>
                                    <p className="text-xs text-muted-foreground font-medium">Time</p>
                                </div>
                            </div>

                            <div className="space-y-2 max-h-60 overflow-y-auto scrollbar-thin">
                                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Answer Review</p>
                                {quizQuestions.map((q, i) => {
                                    const ans = answers[i];
                                    return (
                                        <div key={q.id} className={`flex items-start gap-2 p-2.5 rounded-xl text-sm ${ans?.is_correct ? 'bg-emerald-500/5' : 'bg-red-500/5'}`}>
                                            {ans?.is_correct
                                                ? <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0 mt-0.5" />
                                                : <XCircle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />}
                                            <span className="text-xs">{q.title}</span>
                                        </div>
                                    );
                                })}
                            </div>

                            <div className="flex gap-3 pt-2">
                                <Button variant="outline" onClick={() => setPhase('setup')} className="flex-1 rounded-xl">
                                    <RotateCcw className="w-4 h-4 mr-2" /> New Quiz
                                </Button>
                                <Button onClick={startQuiz} className="flex-1 rounded-xl">
                                    <Zap className="w-4 h-4 mr-2" /> Retry
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </motion.div>
            </div>
        );
    }

    return null;
}