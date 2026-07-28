import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { invokeGroq } from '@/api/llm';
import { Topic, Question } from '@/api/entities';
import PageHeader from '@/components/shared/PageHeader';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import {
    Mic, Volume2, VolumeX, Clock, ChevronRight, ChevronLeft, RotateCcw,
    Brain, Zap, Sparkles, Loader2, ThumbsUp, ThumbsDown, AlertCircle,
    Target,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import ReactMarkdown from 'react-markdown';
import DifficultyBadge from '@/components/shared/DifficultyBadge';
import { toast } from 'sonner';

// Free, instant, client-side answer-coverage check — no network call, no AI. Compares the
// candidate's answer against significant keywords pulled from the model answer, so there's
// a useful signal even before (or without ever) spending an AI call on full evaluation.
const STOPWORDS = new Set([
    'the', 'a', 'an', 'is', 'are', 'was', 'were', 'be', 'been', 'being', 'to', 'of', 'in', 'on',
    'at', 'for', 'with', 'and', 'or', 'but', 'it', 'its', 'this', 'that', 'these', 'those', 'as',
    'by', 'from', 'can', 'will', 'would', 'should', 'could', 'which', 'what', 'when', 'where',
    'how', 'why', 'not', 'no', 'do', 'does', 'did', 'has', 'have', 'had', 'if', 'then', 'than',
    'so', 'such', 'also', 'you', 'your', 'we', 'our', 'i', 'they', 'their', 'them', 'into', 'about',
]);

function extractKeywords(text) {
    return [...new Set(
        (text || '')
            .toLowerCase()
            .replace(/[^a-z0-9\s]/g, ' ')
            .split(/\s+/)
            .filter(w => w.length > 2 && !STOPWORDS.has(w))
    )];
}

function computeKeywordMatch(userAnswer, modelAnswer) {
    const modelKeywords = extractKeywords(modelAnswer);
    if (modelKeywords.length === 0 || !userAnswer?.trim()) return null;
    const userLower = userAnswer.toLowerCase();
    const matched = modelKeywords.filter(kw => userLower.includes(kw));
    return {
        score: Math.round((matched.length / modelKeywords.length) * 100),
        matched: matched.length,
        total: modelKeywords.length,
    };
}

// No dedicated "round" field exists on questions — rounds are derived from the existing
// `type`/`difficulty` columns instead of requiring a schema change + re-tagging every
// question. `match` decides which questions belong to a given round.
const ROUNDS = [
    {
        id: 'screening',
        label: '1st Round · Screening',
        icon: '📋',
        desc: 'Foundational MCQs & theory basics',
        match: (q) => ['mcq', 'theory'].includes(q.type),
    },
    {
        id: 'technical',
        label: '2nd Round · Technical',
        icon: '💻',
        desc: 'In-depth theory & coding questions',
        match: (q) => ['theory', 'coding'].includes(q.type),
    },
    {
        id: 'manager',
        label: 'Final Round · Manager',
        icon: '🎯',
        desc: 'Advanced coding & decision-making questions',
        match: (q) => q.type === 'coding' || (q.type === 'interview' && q.difficulty === 'experienced'),
    },
    {
        id: 'hr',
        label: 'HR Round',
        icon: '👔',
        desc: 'Behavioural & soft-skill questions',
        match: (q) => q.type === 'interview',
    },
];

const EXP_LEVELS = [
    { value: 'fresher', label: 'Fresher (0–1 yr)' },
    { value: 'junior', label: 'Junior (1–3 yrs)' },
    { value: 'mid_level', label: 'Mid-Level (3–6 yrs)' },
    { value: 'senior', label: 'Senior (6+ yrs)' },
];

const SPEECH_RECOGNITION_CTOR =
    typeof window !== 'undefined' ? window.SpeechRecognition || window.webkitSpeechRecognition : null;
const SPEECH_SYNTHESIS_SUPPORTED = typeof window !== 'undefined' && !!window.speechSynthesis;

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
    const [phase, setPhase] = useState('setup-tech');
    const [config, setConfig] = useState({ topic_ids: [], exp_level: 'junior', round: 'technical', count: 10 });
    const [questions, setQuestions] = useState([]);
    const [current, setCurrent] = useState(0);
    const [userAnswers, setUserAnswers] = useState({});
    const [aiFeedback, setAiFeedback] = useState({});
    const [time, setTime] = useState(0);
    const [totalTime, setTotalTime] = useState(0);
    const [selfRatings, setSelfRatings] = useState({});
    const [showModelAnswer, setShowModelAnswer] = useState(false);
    const [loadingFeedback, setLoadingFeedback] = useState(false);
    const [isSpeaking, setIsSpeaking] = useState(false);
    const [isRecording, setIsRecording] = useState(false);
    const recognitionRef = useRef(null);

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

    // Stop any in-flight speech/recording when the question changes or the page leaves
    // the interview phase — a stale utterance/recognition session should never carry over.
    useEffect(() => {
        return () => {
            if (SPEECH_SYNTHESIS_SUPPORTED) window.speechSynthesis.cancel();
            recognitionRef.current?.stop();
        };
    }, [current, phase]);

    const formatTime = (s) => `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;

    const visibleQs = useMemo(
        () => allQs.filter(q => q.is_visible !== false && q.status === 'published'),
        [allQs]
    );

    const techFilteredQs = useMemo(() => {
        if (config.topic_ids.length === 0) return visibleQs;
        return visibleQs.filter(q => config.topic_ids.includes(q.topic_id));
    }, [visibleQs, config.topic_ids]);

    const pool = useMemo(() => {
        let qs = techFilteredQs;
        if (config.exp_level !== 'all') qs = qs.filter(q => q.experience_level === config.exp_level || !q.experience_level);
        const round = ROUNDS.find(r => r.id === config.round);
        // Admin-tagged `round` wins when present; untagged questions (round === null,
        // not yet re-tagged since this field was added) fall back to the old
        // type/difficulty heuristic so they still show up somewhere.
        if (round) qs = qs.filter(q => (q.round ? q.round === config.round : round.match(q)));
        return qs;
    }, [techFilteredQs, config.exp_level, config.round]);

    const toggleTopic = (topicId) => {
        setConfig(c => ({
            ...c,
            topic_ids: c.topic_ids.includes(topicId)
                ? c.topic_ids.filter(id => id !== topicId)
                : [...c.topic_ids, topicId],
        }));
    };

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

    // Free instant signal, recomputed on every keystroke — no AI call involved.
    const keywordMatch = useMemo(
        () => (q ? computeKeywordMatch(userAnswers[q.id], q.answer || q.explanation) : null),
        [q, userAnswers]
    );

    const speakQuestion = () => {
        if (!SPEECH_SYNTHESIS_SUPPORTED || !q) return;
        window.speechSynthesis.cancel();
        if (isSpeaking) {
            setIsSpeaking(false);
            return;
        }
        const text = [q.title, q.description].filter(Boolean).join('. ');
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.onend = () => setIsSpeaking(false);
        utterance.onerror = () => setIsSpeaking(false);
        window.speechSynthesis.speak(utterance);
        setIsSpeaking(true);
    };

    const toggleRecording = () => {
        if (!SPEECH_RECOGNITION_CTOR || !q) {
            toast.error('Voice input is not supported in this browser. Try Chrome or Edge.');
            return;
        }
        if (isRecording) {
            recognitionRef.current?.stop();
            return;
        }

        const recognition = new SPEECH_RECOGNITION_CTOR();
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = 'en-US';

        const baseText = userAnswers[q.id]?.trim() ? userAnswers[q.id].trim() + ' ' : '';
        let finalTranscript = baseText;

        recognition.onresult = (event) => {
            let interim = '';
            for (let i = event.resultIndex; i < event.results.length; i++) {
                const transcript = event.results[i][0].transcript;
                if (event.results[i].isFinal) {
                    finalTranscript += transcript + ' ';
                } else {
                    interim += transcript;
                }
            }
            setUserAnswers(prev => ({ ...prev, [q.id]: finalTranscript + interim }));
        };

        recognition.onerror = (event) => {
            if (event.error === 'not-allowed' || event.error === 'permission-denied') {
                toast.error('Microphone access was denied.');
            } else if (event.error !== 'no-speech' && event.error !== 'aborted') {
                toast.error('Voice recognition error. Please try again.');
            }
        };

        recognition.onend = () => setIsRecording(false);

        recognitionRef.current = recognition;
        recognition.start();
        setIsRecording(true);
    };

    const getAIFeedback = async () => {
        const answer = userAnswers[q.id];
        if (!answer || answer.trim().length < 5) {
            toast.error('Please write at least a short answer first');
            return;
        }
        setLoadingFeedback(true);
        try {
            // Kept deliberately short — this is a supplementary pass on top of the free
            // keyword-coverage check above, not the sole evaluation, so it doesn't need a
            // long prompt or a big response budget.
            const prompt = `Interviewer, evaluate this answer in under 60 words total.
Question: "${q.title}"
${q.answer ? `Expected: ${q.answer}` : ''}
Answer: "${answer}"

Reply in exactly this format:
Score: <0-100>
Verdict: Strong | Acceptable | Needs Work
Tip: <one short sentence>`;

            const result = await invokeGroq({ prompt, maxTokens: 120 });
            setAiFeedback(prev => ({ ...prev, [q.id]: result }));

            // Auto-rate based on AI verdict
            const lower = result.toLowerCase();
            if (lower.includes('strong') || lower.includes('excellent') || lower.includes('good')) {
                setSelfRatings(prev => ({ ...prev, [q.id]: 'good' }));
            } else if (lower.includes('needs work') || lower.includes('missing') || lower.includes('weak')) {
                setSelfRatings(prev => ({ ...prev, [q.id]: 'review' }));
            }
        } catch {
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

    // ---- SETUP: TECHNOLOGIES ----
    if (phase === 'setup-tech') return (
        <div className="space-y-6 max-w-2xl">
            <PageHeader title="Mock Interview" badge="Practice Mode" description="Simulate a real interview. Get AI feedback on every answer." />
            <Card className="rounded-3xl overflow-hidden border border-border shadow-lg">
                <div className="h-1 bg-gradient-to-r from-primary via-violet-500 to-pink-500" />
                <CardContent className="p-8 space-y-6">
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center">
                            <Brain className="w-6 h-6 text-primary" />
                        </div>
                        <div>
                            <h2 className="font-bold text-lg font-heading">Choose Your Technologies</h2>
                            <p className="text-sm text-muted-foreground">Pick one or more — leave blank for all topics</p>
                        </div>
                    </div>

                    <div>
                        <label className="text-sm font-semibold mb-3 block">Technologies</label>
                        <div className="flex flex-wrap gap-2">
                            {topics.filter(t => t.is_visible !== false).map(t => (
                                <button key={t.id} onClick={() => toggleTopic(t.id)}
                                    className={`px-3.5 py-2 rounded-xl text-sm font-medium border-2 transition-all ${config.topic_ids.includes(t.id) ? 'bg-primary text-primary-foreground border-primary' : 'border-border hover:border-primary/50'
                                        }`}>
                                    {t.name}
                                </button>
                            ))}
                        </div>
                        {config.topic_ids.length === 0 && (
                            <p className="text-xs text-muted-foreground mt-2">🌐 No selection = all topics included</p>
                        )}
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

                    <Button onClick={() => setPhase('setup-round')} className="w-full rounded-xl h-12 text-base font-bold shadow-lg">
                        Next: Choose Round <ChevronRight className="w-5 h-5 ml-1" />
                    </Button>
                </CardContent>
            </Card>
        </div>
    );

    // ---- SETUP: ROUND ----
    if (phase === 'setup-round') return (
        <div className="space-y-6 max-w-2xl">
            <PageHeader title="Mock Interview" badge="Practice Mode" description="Which round do you want to simulate?" />
            <Card className="rounded-3xl overflow-hidden border border-border shadow-lg">
                <div className="h-1 bg-gradient-to-r from-primary via-violet-500 to-pink-500" />
                <CardContent className="p-8 space-y-6">
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center">
                            <Mic className="w-6 h-6 text-primary" />
                        </div>
                        <div>
                            <h2 className="font-bold text-lg font-heading">Choose Interview Round</h2>
                            <p className="text-sm text-muted-foreground">Questions are matched to the round you pick</p>
                        </div>
                    </div>

                    <div className="space-y-2">
                        {ROUNDS.map(r => (
                            <button key={r.id} onClick={() => setConfig(c => ({ ...c, round: r.id }))}
                                className={`w-full text-left px-4 py-3.5 rounded-xl border-2 transition-all ${config.round === r.id ? 'border-primary bg-primary/5 shadow-sm' : 'border-border hover:border-primary/40'
                                    }`}>
                                <p className="font-semibold text-sm">{r.icon} {r.label}</p>
                                <p className="text-xs text-muted-foreground mt-0.5">{r.desc}</p>
                            </button>
                        ))}
                    </div>

                    <div className="bg-muted/60 rounded-2xl p-4 flex items-center gap-3">
                        <Sparkles className="w-5 h-5 text-primary flex-shrink-0" />
                        <div>
                            <p className="text-sm font-medium">
                                <span className="text-primary font-bold">{pool.length}</span> questions match · AI feedback on every answer
                            </p>
                            <p className="text-xs text-muted-foreground mt-0.5">Type or speak your answer → click the speaker icon to hear the question read aloud</p>
                        </div>
                    </div>

                    <div className="flex gap-3">
                        <Button variant="outline" onClick={() => setPhase('setup-tech')} className="rounded-xl h-12">
                            <ChevronLeft className="w-5 h-5 mr-1" /> Back
                        </Button>
                        <Button onClick={startInterview} className="flex-1 rounded-xl h-12 text-base font-bold shadow-lg" disabled={pool.length === 0}>
                            <Mic className="w-5 h-5 mr-2" /> Start Interview
                        </Button>
                    </div>
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
                                <div className="flex items-start gap-2">
                                    <h3 className="text-lg font-bold leading-snug font-heading flex-1">{q.title}</h3>
                                    {SPEECH_SYNTHESIS_SUPPORTED && (
                                        <button
                                            onClick={speakQuestion}
                                            title={isSpeaking ? 'Stop reading' : 'Read question aloud'}
                                            className={`flex-shrink-0 w-9 h-9 rounded-full flex items-center justify-center border-2 transition-all ${isSpeaking ? 'bg-primary text-primary-foreground border-primary' : 'border-border hover:border-primary/50 text-muted-foreground hover:text-primary'
                                                }`}>
                                            {isSpeaking ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                                        </button>
                                    )}
                                </div>
                                {q.description && <p className="text-sm text-muted-foreground mt-1.5 leading-relaxed">{q.description}</p>}
                            </div>

                            {q.code_snippet && (
                                <pre className="bg-zinc-950 text-zinc-100 rounded-xl p-4 text-xs overflow-x-auto font-mono border border-zinc-800">{q.code_snippet}</pre>
                            )}

                            <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                    <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest block">Your Answer</label>
                                    {SPEECH_RECOGNITION_CTOR ? (
                                        <button
                                            onClick={toggleRecording}
                                            className={`flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full border transition-all ${isRecording ? 'bg-red-500/10 border-red-500/40 text-red-600' : 'border-border text-muted-foreground hover:text-primary hover:border-primary/40'
                                                }`}>
                                            {isRecording
                                                ? <><span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" /> Recording… tap to stop</>
                                                : <><Mic className="w-3 h-3" /> Speak your answer</>}
                                        </button>
                                    ) : (
                                        <span className="text-[10px] text-muted-foreground">Voice input needs Chrome/Edge</span>
                                    )}
                                </div>
                                <Textarea
                                    value={userAnswers[q.id] || ''}
                                    onChange={e => setUserAnswers(prev => ({ ...prev, [q.id]: e.target.value }))}
                                    placeholder="Type your answer, or click 'Speak your answer' above — the AI will evaluate it either way..."
                                    className="rounded-xl min-h-[120px] text-sm resize-none"
                                />
                                {keywordMatch && (
                                    <div className="flex items-center gap-2 text-xs">
                                        <div className="flex-1 h-1.5 rounded-full bg-muted overflow-hidden">
                                            <div
                                                className={`h-full rounded-full transition-all ${keywordMatch.score >= 60 ? 'bg-emerald-500' : keywordMatch.score >= 30 ? 'bg-amber-500' : 'bg-red-500'}`}
                                                style={{ width: `${keywordMatch.score}%` }}
                                            />
                                        </div>
                                        <span className="text-muted-foreground font-medium flex-shrink-0">
                                            {keywordMatch.score}% keyword coverage ({keywordMatch.matched}/{keywordMatch.total})
                                        </span>
                                    </div>
                                )}
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
                        <Button variant="outline" onClick={() => setPhase('setup-tech')} className="flex-1 rounded-xl">
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
