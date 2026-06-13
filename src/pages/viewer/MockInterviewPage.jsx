import React, { useState, useEffect, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/api/supabaseClient';
import { invokeLLM } from '@/api/llm';
import { Topic, Question } from '@/api/entities';
import PageHeader from '@/components/shared/PageHeader';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import {
    Mic, Clock, ChevronRight, ChevronLeft, RotateCcw, CheckCircle2,
    Brain, Zap, Sparkles, Loader2, ThumbsUp, ThumbsDown, AlertCircle,
    Target,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import ReactMarkdown from 'react-markdown';
import DifficultyBadge from '@/components/shared/DifficultyBadge';
import { toast } from 'sonner';

const MODES = [
    { id: 'technical', label: '💻 Technical Round', desc: 'DSA, system design, coding questions' },
    { id: 'hr', label: '👔 HR Round', desc: 'Behavioural, soft skills, scenario questions' },
    { id: 'mixed', label: '🔀 Mixed Round', desc: 'Combination of technical and HR questions' },
];

const EXP_LEVELS = [
    { value: 'fresher', label: 'Fresher (0–1 yr)' },
    { value: 'junior', label: 'Junior (1–3 yrs)' },
    { value: 'mid_level', label: 'Mid-Level (3–6 yrs)' },
    { value: 'senior', label: 'Senior (6+ yrs)' },
];

function ScoreRing({ score }) {
    const color = score >= 70 ? '#22c55e' : score >= 40 ? '#f59e0b' : '#ef4444';
    return (
        <div className="relative w-32 h-32 flex items-center justify-center">
            <svg className="absolute inset-0 w-full h-full -rotate-90" viewBox="0 0 120 120">
                <circle cx="60" cy="60" r="50" fill="none" stroke="hsl(var(--border))" strokeWidth="10" />
                <circle cx="60" cy="60" r="50" fill="none" stroke={color} strokeWidth="10"
                    strokeDasharray={`${2 * Math.PI * 50}`}
                    strokeDashoffset={`${2 * Math.PI * 50 * (1 - score / 100)}`}
                    strokeLinecap="round" style={{ transition: 'stroke-dashoffset 1s ease' }} />
            </svg>
            <div className="text-center">
                <p className="text-3xl font-black text-foreground">{score}%</p>
            </div>
        </div>
    );
}

export default function MockInterviewPage() {
    const [phase, setPhase] = useState('setup');
    const [config, setConfig] = useState({ topic_id: 'all', exp_level: 'junior', mode: 'technical', count: 10 });
    const [questions, setQuestions] = useState([]);
    const [current, setCurrent] = useState(0);
    const [userAnswers, setUserAnswers] = useState({});
    const [aiFeedback, setAiFeedback] = useState({});
    const [time, setTime] = useState(0);
    const [totalTime, setTotalTime] = useState(0);
    const [selfRatings, setSelfRatings] = useState({});
    const [showModelAnswer, setShowModelAnswer] = useState(false);
    const [loadingFeedback, setLoadingFeedback] = useState(false);

    const { data: topics = [] } = useQuery({
        queryKey: ['topics'],
        queryFn: () => Topic.list(),
    });

    const { data: allQs = [] } = useQuery({
        queryKey: ['questions'],
        queryFn: () => Question.list('created_at', false),
    });

    useEffect(() => {
        if (phase !== 'interview') return;
        const interval = setInterval(() => setTime(t => t + 1), 1000);
        return () => clearInterval(interval);
    }, [phase]);

    const formatTime = (s) => `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;

    const pool = useMemo(() => {
        let qs = allQs.filter(q => q.is_visible !== false && q.status === 'published');
        if (config.topic_id !== 'all') qs = qs.filter(q => q.topic_id === config.topic_id);
        if (config.exp_level !== 'all') qs = qs.filter(q => q.experience_level === config.exp_level || !q.experience_level);
        if (config.mode === 'technical') qs = qs.filter(q => ['theory', 'coding', 'scenario'].includes(q.type));
        if (config.mode === 'hr') qs = qs.filter(q => ['interview', 'scenario'].includes(q.type));
        return qs;
    }, [allQs, config]);

    const startInterview = () => {
        const shuffled = [...pool].sort(() => Math.random() - 0.5).slice(0, Math.min(config.count, pool.length));
        setQuestions(shuffled);
        setUserAnswers({});
        setSelfRatings({});
        setAiFeedback({});
        setCurrent(0);
        setShowModelAnswer(false);
        setTime(0);
        setPhase('interview');
    };

    const q = questions[current];
    const progressPct = questions.length > 0 ? ((current + 1) / questions.length) * 100 : 0;

    const getAIFeedback = async () => {
        const answer = userAnswers[q.id];
        if (!answer || answer.trim().length < 5) {
            toast.error('Please write at least a short answer first');
            return;
        }
        setLoadingFeedback(true);
        try {
            const prompt = `You are an expert technical interviewer. Evaluate this interview answer.

Question: "${q.title}"
${q.description ? `Context: ${q.description}` : ''}
${q.answer ? `Expected Answer: ${q.answer}` : ''}

Candidate's Answer: "${answer}"

Provide a concise evaluation with:
1. **Score** (0–100): Just the number
2. **Verdict**: "Strong", "Acceptable", or "Needs Work"  
3. **What was good**: 1–2 bullet points
4. **What's missing**: 1–2 bullet points  
5. **Key tip**: One specific improvement suggestion

Keep the entire response under 150 words. Be honest and constructive.`;

            const result = await invokeLLM({ prompt });
            setAiFeedback(prev => ({ ...prev, [q.id]: result }));

            // Auto-rate based on AI verdict
            const lower = result.toLowerCase();
            if (lower.includes('strong') || lower.includes('excellent') || lower.includes('good')) {
                setSelfRatings(prev => ({ ...prev, [q.id]: 'good' }));
            } else if (lower.includes('needs work') || lower.includes('missing') || lower.includes('weak')) {
                setSelfRatings(prev => ({ ...prev, [q.id]: 'review' }));
            }
        } catch (err) {
            toast.error('Failed to get AI feedback. Please try again.');
        } finally {
            setLoadingFeedback(false);
        }
    };

    const handleNext = () => {
        setShowModelAnswer(false);
        if (current + 1 < questions.length) {
            setCurrent(c => c + 1);
        } else {
            setTotalTime(time);
            setPhase('result');
        }
    };

    const handlePrev = () => {
        setShowModelAnswer(false);
        if (current > 0) setCurrent(c => c - 1);
    };

    const goodAnswers = Object.values(selfRatings).filter(r => r === 'good').length;
    const avgRating = questions.length > 0 ? Math.round((goodAnswers / questions.length) * 100) : 0;

    // ---- SETUP ----
    if (phase === 'setup') return (
        <div className="space-y-6 max-w-2xl">
            <PageHeader title="Mock Interview" badge="Practice Mode" description="Simulate a real interview. Get AI feedback on every answer." />
            <Card className="rounded-3xl overflow-hidden border border-border shadow-lg">
                <div className="h-1 bg-gradient-to-r from-primary via-violet-500 to-pink-500" />
                <CardContent className="p-8 space-y-6">
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center">
                            <Mic className="w-6 h-6 text-primary" />
                        </div>
                        <div>
                            <h2 className="font-bold text-lg font-heading">Configure Your Session</h2>
                            <p className="text-sm text-muted-foreground">AI will evaluate every answer you give</p>
                        </div>
                    </div>

                    <div>
                        <label className="text-sm font-semibold mb-3 block">Interview Mode</label>
                        <div className="space-y-2">
                            {MODES.map(m => (
                                <button key={m.id} onClick={() => setConfig(c => ({ ...c, mode: m.id }))}
                                    className={`w-full text-left px-4 py-3.5 rounded-xl border-2 transition-all ${config.mode === m.id ? 'border-primary bg-primary/5 shadow-sm' : 'border-border hover:border-primary/40'
                                        }`}>
                                    <p className="font-semibold text-sm">{m.label}</p>
                                    <p className="text-xs text-muted-foreground mt-0.5">{m.desc}</p>
                                </button>
                            ))}
                        </div>
                    </div>

                    <div>
                        <label className="text-sm font-semibold mb-2 block">Topic</label>
                        <Select value={config.topic_id} onValueChange={v => setConfig(c => ({ ...c, topic_id: v }))}>
                            <SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">🌐 All Topics</SelectItem>
                                {topics.filter(t => t.is_visible !== false).map(t => (
                                    <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div>
                        <label className="text-sm font-semibold mb-2 block">Experience Level</label>
                        <div className="grid grid-cols-2 gap-2">
                            {EXP_LEVELS.map(l => (
                                <button key={l.value} onClick={() => setConfig(c => ({ ...c, exp_level: l.value }))}
                                    className={`px-3 py-2.5 rounded-xl text-sm font-medium border-2 transition-all ${config.exp_level === l.value ? 'bg-primary text-primary-foreground border-primary' : 'border-border hover:border-primary/50'
                                        }`}>{l.label}</button>
                            ))}
                        </div>
                    </div>

                    <div>
                        <label className="text-sm font-semibold mb-2 block">Number of Questions</label>
                        <div className="flex gap-2 flex-wrap">
                            {[5, 10, 15, 20].map(n => (
                                <button key={n} onClick={() => setConfig(c => ({ ...c, count: n }))}
                                    className={`w-14 h-10 rounded-xl text-sm font-bold border-2 transition-all ${config.count === n ? 'bg-primary text-primary-foreground border-primary' : 'border-border hover:border-primary/50'
                                        }`}>{n}</button>
                            ))}
                        </div>
                    </div>

                    <div className="bg-muted/60 rounded-2xl p-4 flex items-center gap-3">
                        <Sparkles className="w-5 h-5 text-primary flex-shrink-0" />
                        <div>
                            <p className="text-sm font-medium">
                                <span className="text-primary font-bold">{pool.length}</span> questions match · AI feedback on every answer
                            </p>
                            <p className="text-xs text-muted-foreground mt-0.5">Type your answer → click "Get AI Feedback" → reveal model answer → rate yourself</p>
                        </div>
                    </div>

                    <Button onClick={startInterview} className="w-full rounded-xl h-12 text-base font-bold shadow-lg" disabled={pool.length === 0}>
                        <Mic className="w-5 h-5 mr-2" /> Start Interview
                    </Button>
                </CardContent>
            </Card>
        </div>
    );

    // ---- INTERVIEW ----
    if (phase === 'interview' && q) return (
        <div className="max-w-2xl space-y-4">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-foreground">Q{current + 1}</span>
                    <span className="text-sm text-muted-foreground">/ {questions.length}</span>
                </div>
                <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1.5 text-sm font-mono font-semibold bg-muted px-3 py-1 rounded-full">
                        <Clock className="w-3.5 h-3.5 text-muted-foreground" />{formatTime(time)}
                    </div>
                    <button onClick={() => { setTotalTime(time); setPhase('result'); }} className="text-xs text-muted-foreground hover:text-foreground underline">
                        End early
                    </button>
                </div>
            </div>
            <Progress value={progressPct} className="h-1.5 rounded-full" />

            <AnimatePresence mode="wait">
                <motion.div key={current} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                    <Card className="rounded-2xl overflow-hidden border border-border shadow-sm">
                        <div className="h-1 bg-gradient-to-r from-primary to-violet-500" />
                        <CardContent className="p-6 space-y-5">
                            <div>
                                <div className="flex flex-wrap items-center gap-2 mb-3">
                                    <DifficultyBadge level={q.difficulty} />
                                    {q.topic_name && <Badge variant="outline" className="text-[10px] uppercase">{q.topic_name}</Badge>}
                                    {q.experience_level && (
                                        <Badge variant="secondary" className="text-[10px] capitalize">
                                            {q.experience_level.replace('_', ' ')}
                                        </Badge>
                                    )}
                                </div>
                                <h3 className="text-lg font-bold leading-snug font-heading">{q.title}</h3>
                                {q.description && <p className="text-sm text-muted-foreground mt-1.5 leading-relaxed">{q.description}</p>}
                            </div>

                            {q.code_snippet && (
                                <pre className="bg-zinc-950 text-zinc-100 rounded-xl p-4 text-xs overflow-x-auto font-mono border border-zinc-800">{q.code_snippet}</pre>
                            )}

                            <div className="space-y-2">
                                <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest block">Your Answer</label>
                                <Textarea
                                    value={userAnswers[q.id] || ''}
                                    onChange={e => setUserAnswers(prev => ({ ...prev, [q.id]: e.target.value }))}
                                    placeholder="Type your answer here. Be as detailed as possible — the AI will evaluate it..."
                                    className="rounded-xl min-h-[120px] text-sm resize-none"
                                />
                            </div>

                            <Button
                                onClick={getAIFeedback}
                                disabled={loadingFeedback || !userAnswers[q.id]?.trim()}
                                variant="outline"
                                className="w-full rounded-xl border-primary/40 text-primary hover:bg-primary/5 font-semibold"
                            >
                                {loadingFeedback ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Sparkles className="w-4 h-4 mr-2" />}
                                {loadingFeedback ? 'Analyzing your answer...' : 'Get AI Feedback on My Answer'}
                            </Button>

                            <AnimatePresence>
                                {aiFeedback[q.id] && (
                                    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                                        <div className={`rounded-xl p-4 border ${selfRatings[q.id] === 'good'
                                            ? 'bg-emerald-500/5 border-emerald-500/25'
                                            : selfRatings[q.id] === 'review'
                                                ? 'bg-amber-500/5 border-amber-500/25'
                                                : 'bg-primary/5 border-primary/20'
                                            }`}>
                                            <div className="flex items-center gap-2 mb-2">
                                                <Sparkles className="w-4 h-4 text-primary" />
                                                <p className="text-xs font-bold text-primary uppercase tracking-widest">AI Feedback</p>
                                            </div>
                                            <div className="prose prose-sm dark:prose-invert max-w-none text-sm">
                                                <ReactMarkdown>{aiFeedback[q.id]}</ReactMarkdown>
                                            </div>
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>

                            <div>
                                <button onClick={() => setShowModelAnswer(a => !a)}
                                    className="flex items-center gap-2 text-sm font-semibold text-primary hover:opacity-80 transition-opacity">
                                    {showModelAnswer ? '▲ Hide Model Answer' : '▼ Reveal Model Answer'}
                                </button>
                                <AnimatePresence>
                                    {showModelAnswer && (q.answer || q.explanation) && (
                                        <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="mt-3 overflow-hidden">
                                            <div className="bg-emerald-500/5 border border-emerald-500/20 rounded-xl p-4 text-sm">
                                                <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest mb-2">Model Answer</p>
                                                <div className="prose prose-sm dark:prose-invert max-w-none">
                                                    <ReactMarkdown>{q.answer || q.explanation}</ReactMarkdown>
                                                </div>
                                            </div>
                                            <div className="mt-3">
                                                <p className="text-xs font-semibold text-muted-foreground mb-2">Compare with your answer — how did you do?</p>
                                                <div className="flex gap-2">
                                                    <Button size="sm"
                                                        variant={selfRatings[q.id] === 'good' ? 'default' : 'outline'}
                                                        className="rounded-xl flex-1 h-9"
                                                        onClick={() => setSelfRatings(prev => ({ ...prev, [q.id]: 'good' }))}>
                                                        <ThumbsUp className="w-3.5 h-3.5 mr-1" /> Got it!
                                                    </Button>
                                                    <Button size="sm"
                                                        variant={selfRatings[q.id] === 'review' ? 'default' : 'outline'}
                                                        className="rounded-xl flex-1 h-9 text-amber-600 border-amber-500/40 hover:bg-amber-50 dark:hover:bg-amber-950/30"
                                                        onClick={() => setSelfRatings(prev => ({ ...prev, [q.id]: 'review' }))}>
                                                        <ThumbsDown className="w-3.5 h-3.5 mr-1" /> Need Review
                                                    </Button>
                                                </div>
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>
                        </CardContent>
                    </Card>
                </motion.div>
            </AnimatePresence>

            <div className="flex gap-3">
                <Button variant="outline" onClick={handlePrev} disabled={current === 0} className="rounded-xl flex-1">
                    <ChevronLeft className="w-4 h-4 mr-1" /> Previous
                </Button>
                <Button onClick={handleNext} className="rounded-xl flex-1">
                    {current + 1 === questions.length ? '🏁 See Results' : 'Next Question'} <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
            </div>
        </div>
    );

    // ---- RESULT ----
    if (phase === 'result') {
        const reviewNeeded = questions.filter(q => selfRatings[q.id] === 'review' || !selfRatings[q.id]);
        const strongAnswers = questions.filter(q => selfRatings[q.id] === 'good');
        const answered = questions.filter(q => userAnswers[q.id]?.trim());

        return (
            <div className="max-w-2xl space-y-5">
                <PageHeader title="Interview Complete!" description="Here's your detailed performance report" />
                <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="space-y-4">
                    <Card className="rounded-2xl overflow-hidden border shadow-lg">
                        <div className="h-1 bg-gradient-to-r from-primary to-violet-500" />
                        <CardContent className="p-6">
                            <div className="flex flex-col sm:flex-row items-center gap-6">
                                <ScoreRing score={avgRating} />
                                <div className="flex-1 text-center sm:text-left">
                                    <p className="text-3xl font-black font-heading mb-1">
                                        {avgRating >= 70 ? '🏆 Great Job!' : avgRating >= 40 ? '📈 Keep Going!' : '📚 Keep Practicing!'}
                                    </p>
                                    <p className="text-muted-foreground text-sm">Based on your self-assessment after AI feedback</p>
                                    <p className="text-xs text-muted-foreground mt-1 font-mono">Time: {formatTime(totalTime)}</p>
                                </div>
                            </div>

                            <div className="grid grid-cols-3 gap-3 mt-5">
                                <div className="bg-emerald-500/10 rounded-xl p-3 text-center">
                                    <p className="text-2xl font-black text-emerald-600">{strongAnswers.length}</p>
                                    <p className="text-[11px] text-muted-foreground font-medium">Strong Answers</p>
                                </div>
                                <div className="bg-amber-500/10 rounded-xl p-3 text-center">
                                    <p className="text-2xl font-black text-amber-600">{reviewNeeded.length}</p>
                                    <p className="text-[11px] text-muted-foreground font-medium">Need Review</p>
                                </div>
                                <div className="bg-primary/10 rounded-xl p-3 text-center">
                                    <p className="text-2xl font-black text-primary">{answered.length}/{questions.length}</p>
                                    <p className="text-[11px] text-muted-foreground font-medium">Attempted</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {questions.length > 0 && (
                        <Card className="rounded-2xl border">
                            <CardContent className="p-5">
                                <p className="text-sm font-bold mb-3 flex items-center gap-2">
                                    <Target className="w-4 h-4 text-primary" /> Question Breakdown
                                </p>
                                <div className="space-y-2 max-h-72 overflow-y-auto scrollbar-thin pr-1">
                                    {questions.map((q, i) => {
                                        const rating = selfRatings[q.id];
                                        const hasFeedback = !!aiFeedback[q.id];
                                        return (
                                            <div key={q.id} className={`flex items-start gap-3 p-3 rounded-xl border text-sm ${rating === 'good' ? 'bg-emerald-500/5 border-emerald-500/20' :
                                                rating === 'review' ? 'bg-amber-500/5 border-amber-500/20' :
                                                    'bg-muted/30 border-border'
                                                }`}>
                                                <span className="text-xs font-bold text-muted-foreground w-5 flex-shrink-0 mt-0.5">Q{i + 1}</span>
                                                <div className="flex-1 min-w-0">
                                                    <p className="font-medium text-xs truncate">{q.title}</p>
                                                    {hasFeedback && (
                                                        <p className="text-[10px] text-muted-foreground mt-0.5 line-clamp-1">{aiFeedback[q.id].substring(0, 80)}...</p>
                                                    )}
                                                </div>
                                                <div className="flex-shrink-0">
                                                    {rating === 'good' ? <ThumbsUp className="w-4 h-4 text-emerald-500" /> :
                                                        rating === 'review' ? <ThumbsDown className="w-4 h-4 text-amber-500" /> :
                                                            <AlertCircle className="w-4 h-4 text-muted-foreground" />}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    <div className="flex gap-3">
                        <Button variant="outline" onClick={() => setPhase('setup')} className="flex-1 rounded-xl">
                            <RotateCcw className="w-4 h-4 mr-2" /> New Session
                        </Button>
                        <Button onClick={startInterview} className="flex-1 rounded-xl">
                            <Zap className="w-4 h-4 mr-2" /> Retry Same
                        </Button>
                    </div>
                </motion.div>
            </div>
        );
    }

    return null;
}