import React, { useState, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/api/supabaseClient'
import DifficultyBadge from '@/components/shared/DifficultyBadge';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
    Bookmark, BookmarkCheck, ChevronDown, ChevronUp,
    CheckCircle2, Code, StickyNote, Save, Trash2, Eye, EyeOff,
    Building2, ArrowLeft, Circle, Filter, Search, X
} from 'lucide-react';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';
import ReactMarkdown from 'react-markdown';

// ── Supabase helpers ──────────────────────────────────────────────────────────

const getUser = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    return user;
};

const getTopics = async () => {
    const { data, error } = await supabase.from('topics').select('*');
    if (error) throw error;
    return data ?? [];
};

const getQuestions = async () => {
    const { data, error } = await supabase
        .from('questions')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(500);
    if (error) throw error;
    return data ?? [];
};

const getProgress = async (userId) => {
    const { data, error } = await supabase
        .from('progress')
        .select('*')
        .eq('user_id', userId);
    if (error) throw error;
    return data ?? [];
};

const getBookmarks = async (userId) => {
    const { data, error } = await supabase
        .from('bookmarks')
        .select('*')
        .eq('user_id', userId);
    if (error) throw error;
    return data ?? [];
};

const getNotes = async (userId) => {
    const { data, error } = await supabase
        .from('notes')
        .select('*')
        .eq('user_id', userId);
    if (error) throw error;
    return data ?? [];
};

// ── QuestionRow ───────────────────────────────────────────────────────────────

function QuestionRow({ q, isCompleted, isBookmarked, note, onBookmark, onComplete, onUndo }) {
    const [open, setOpen] = useState(false);
    const [showAnswer, setShowAnswer] = useState(false);
    const [showNotes, setShowNotes] = useState(false);
    const [noteText, setNoteText] = useState(note?.content || '');
    const qc = useQueryClient();

    const { data: user } = useQuery({ queryKey: ['me'], queryFn: getUser });

    const saveNoteMut = useMutation({
        mutationFn: async () => {
            if (note) {
                const { error } = await supabase
                    .from('notes')
                    .update({ content: noteText })
                    .eq('id', note.id);
                if (error) throw error;
            } else {
                const { error } = await supabase
                    .from('notes')
                    .insert({ user_id: user.id, question_id: q.id, content: noteText });
                if (error) throw error;
            }
        },
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ['notes'] });
            toast.success('Note saved');
        },
        onError: () => toast.error('Failed to save note'),
    });

    const deleteNoteMut = useMutation({
        mutationFn: async () => {
            const { error } = await supabase.from('notes').delete().eq('id', note.id);
            if (error) throw error;
        },
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ['notes'] });
            setNoteText('');
            toast.success('Note deleted');
        },
        onError: () => toast.error('Failed to delete note'),
    });

    return (
        <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className={`rounded-2xl border transition-all duration-200 overflow-hidden ${isCompleted
                ? 'border-emerald-500/30 bg-emerald-500/5'
                : 'border-border bg-card hover:border-primary/30 hover:shadow-md'
                }`}
        >
            {/* Row header */}
            <button
                className="w-full text-left p-4 flex items-start gap-3"
                onClick={() => setOpen(o => !o)}
            >
                <div className="flex-shrink-0 mt-0.5">
                    {isCompleted
                        ? <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                        : <Circle className="w-5 h-5 text-muted-foreground/40" />
                    }
                </div>
                <div className="flex-1 min-w-0 text-left">
                    <div className="flex flex-wrap items-center gap-1.5 mb-1">
                        <DifficultyBadge level={q.difficulty} />
                        <Badge variant="outline" className="text-[10px] uppercase px-1.5 py-0">{q.type}</Badge>
                        {q.code_snippet && (
                            <Badge variant="outline" className="text-[10px] px-1.5 py-0 gap-1">
                                <Code className="w-2.5 h-2.5" />Code
                            </Badge>
                        )}
                    </div>
                    <p className={`font-semibold text-sm leading-snug ${isCompleted ? 'text-muted-foreground' : 'text-foreground'}`}>
                        {q.title}
                    </p>
                </div>
                <div className="flex items-center gap-1 flex-shrink-0 ml-2">
                    <button
                        onClick={e => { e.stopPropagation(); onBookmark(); }}
                        className="p-1.5 rounded-lg hover:bg-muted transition-colors"
                    >
                        {isBookmarked
                            ? <BookmarkCheck className="w-4 h-4 text-primary" />
                            : <Bookmark className="w-4 h-4 text-muted-foreground" />
                        }
                    </button>
                    {open
                        ? <ChevronUp className="w-4 h-4 text-muted-foreground" />
                        : <ChevronDown className="w-4 h-4 text-muted-foreground" />
                    }
                </div>
            </button>

            {/* Expanded detail */}
            <AnimatePresence>
                {open && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="overflow-hidden"
                    >
                        <div className="px-4 pb-4 pt-0 space-y-4 border-t border-border/60">

                            {q.description && (
                                <div className="prose prose-sm dark:prose-invert max-w-none text-muted-foreground pt-3">
                                    <ReactMarkdown>{q.description}</ReactMarkdown>
                                </div>
                            )}

                            {q.code_snippet && (
                                <div className="rounded-xl overflow-hidden border border-border">
                                    <div className="flex items-center gap-2 bg-zinc-900 px-4 py-2">
                                        <Code className="w-3.5 h-3.5 text-zinc-400" />
                                        <span className="text-xs text-zinc-400 font-mono uppercase">{q.code_language || 'code'}</span>
                                    </div>
                                    <pre className="bg-zinc-950 text-zinc-100 p-4 overflow-x-auto text-sm font-mono leading-relaxed scrollbar-thin">
                                        <code>{q.code_snippet}</code>
                                    </pre>
                                </div>
                            )}

                            {q.company_tags?.length > 0 && (
                                <div className="flex flex-wrap gap-1.5">
                                    {q.company_tags.map(c => (
                                        <span key={c} className="flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 bg-muted rounded-md text-muted-foreground border border-border">
                                            <Building2 className="w-2.5 h-2.5" />{c}
                                        </span>
                                    ))}
                                </div>
                            )}

                            {/* Answer reveal */}
                            <div>
                                <Button variant="outline" size="sm" onClick={() => setShowAnswer(a => !a)} className="rounded-xl font-semibold">
                                    {showAnswer ? <EyeOff className="w-3.5 h-3.5 mr-1.5" /> : <Eye className="w-3.5 h-3.5 mr-1.5" />}
                                    {showAnswer ? 'Hide Answer' : '👁 Reveal Answer'}
                                </Button>
                                <AnimatePresence>
                                    {showAnswer && (
                                        <motion.div
                                            initial={{ opacity: 0, height: 0 }}
                                            animate={{ opacity: 1, height: 'auto' }}
                                            exit={{ opacity: 0, height: 0 }}
                                            className="mt-3 space-y-3 overflow-hidden"
                                        >
                                            {q.answer && (
                                                <div className="rounded-xl bg-emerald-500/5 border border-emerald-500/20 p-4">
                                                    <p className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-widest mb-2">Answer</p>
                                                    <div className="prose prose-sm dark:prose-invert max-w-none"><ReactMarkdown>{q.answer}</ReactMarkdown></div>
                                                </div>
                                            )}
                                            {q.explanation && (
                                                <div className="rounded-xl bg-blue-500/5 border border-blue-500/20 p-4">
                                                    <p className="text-[10px] font-bold text-blue-600 dark:text-blue-400 uppercase tracking-widest mb-2">Explanation</p>
                                                    <div className="prose prose-sm dark:prose-invert max-w-none"><ReactMarkdown>{q.explanation}</ReactMarkdown></div>
                                                </div>
                                            )}
                                            {q.references && (
                                                <div className="rounded-xl bg-muted/50 p-3">
                                                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1">References</p>
                                                    <p className="text-xs text-muted-foreground">{q.references}</p>
                                                </div>
                                            )}
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>

                            {/* Notes */}
                            <div>
                                <button
                                    onClick={() => setShowNotes(n => !n)}
                                    className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors"
                                >
                                    <StickyNote className="w-3.5 h-3.5" />
                                    My Notes {note && <span className="text-[9px] px-1.5 py-0.5 bg-primary/10 text-primary rounded-full">saved</span>}
                                    {showNotes ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                                </button>
                                <AnimatePresence>
                                    {showNotes && (
                                        <motion.div
                                            initial={{ opacity: 0, height: 0 }}
                                            animate={{ opacity: 1, height: 'auto' }}
                                            exit={{ opacity: 0, height: 0 }}
                                            className="mt-2 space-y-2 overflow-hidden"
                                        >
                                            <Textarea
                                                value={noteText}
                                                onChange={e => setNoteText(e.target.value)}
                                                placeholder="Write your personal notes..."
                                                rows={3}
                                                className="text-xs rounded-xl resize-none"
                                            />
                                            <div className="flex gap-2">
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    onClick={() => saveNoteMut.mutate()}
                                                    disabled={!noteText.trim() || saveNoteMut.isPending}
                                                    className="rounded-xl h-7 text-xs"
                                                >
                                                    <Save className="w-3 h-3 mr-1" />Save
                                                </Button>
                                                {note && (
                                                    <Button
                                                        size="sm"
                                                        variant="ghost"
                                                        className="text-destructive rounded-xl h-7 text-xs"
                                                        onClick={() => deleteNoteMut.mutate()}
                                                        disabled={deleteNoteMut.isPending}
                                                    >
                                                        <Trash2 className="w-3 h-3 mr-1" />Delete
                                                    </Button>
                                                )}
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>

                            {/* Complete action */}
                            <div className="flex items-center gap-2 pt-1">
                                {!isCompleted ? (
                                    <Button
                                        size="sm"
                                        onClick={onComplete}
                                        className="rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white h-8 text-xs font-bold"
                                    >
                                        <CheckCircle2 className="w-3.5 h-3.5 mr-1.5" /> Mark as Done
                                    </Button>
                                ) : (
                                    <div className="flex items-center gap-2">
                                        <span className="flex items-center gap-1.5 text-xs font-semibold text-emerald-600">
                                            <CheckCircle2 className="w-4 h-4" /> Completed
                                        </span>
                                        <Button size="sm" variant="ghost" onClick={onUndo} className="h-7 text-[11px] text-muted-foreground rounded-xl">
                                            Undo
                                        </Button>
                                    </div>
                                )}
                            </div>

                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    );
}

// ── StudyPage ─────────────────────────────────────────────────────────────────

export default function StudyPage() {
    const { topicId } = useParams();
    const [diffFilter, setDiffFilter] = useState('all');
    const [typeFilter, setTypeFilter] = useState('all');
    const [search, setSearch] = useState('');
    const qc = useQueryClient();

    const { data: user } = useQuery({ queryKey: ['me'], queryFn: getUser });

    const { data: allTopics = [] } = useQuery({
        queryKey: ['topics'],
        queryFn: getTopics,
    });

    const topic = allTopics.find(t => t.id === topicId);

    const { data: allQuestions = [] } = useQuery({
        queryKey: ['questions'],
        queryFn: getQuestions,
    });

    const { data: progress = [] } = useQuery({
        queryKey: ['progress', user?.id],
        queryFn: () => getProgress(user.id),
        enabled: !!user?.id,
    });

    const { data: bookmarks = [] } = useQuery({
        queryKey: ['bookmarks', user?.id],
        queryFn: () => getBookmarks(user.id),
        enabled: !!user?.id,
    });

    const { data: notes = [] } = useQuery({
        queryKey: ['notes', user?.id],
        queryFn: () => getNotes(user.id),
        enabled: !!user?.id,
    });

    const questions = useMemo(() => {
        let qs = allQuestions.filter(
            q => q.topic_id === topicId && q.is_visible !== false && q.status === 'published'
        );
        if (diffFilter !== 'all') qs = qs.filter(q => q.difficulty === diffFilter);
        if (typeFilter !== 'all') qs = qs.filter(q => q.type === typeFilter);
        if (search.trim()) {
            const s = search.toLowerCase();
            qs = qs.filter(q =>
                q.title?.toLowerCase().includes(s) ||
                q.description?.toLowerCase().includes(s) ||
                q.tags?.some(t => t.toLowerCase().includes(s)) ||
                q.company_tags?.some(c => c.toLowerCase().includes(s))
            );
        }
        return qs;
    }, [allQuestions, topicId, diffFilter, typeFilter, search]);

    const completedIds = new Set(progress.map(p => p.question_id));
    const doneCount = questions.filter(x => completedIds.has(x.id)).length;
    const pct = questions.length > 0 ? Math.round((doneCount / questions.length) * 100) : 0;

    const completeMut = useMutation({
        mutationFn: async (qId) => {
            const { error } = await supabase.from('progress').insert({
                user_id: user.id,
                question_id: qId,
                topic_id: topicId,
                completed_at: new Date().toISOString(),
            });
            if (error) throw error;
        },
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ['progress'] });
            toast.success('✅ Marked as done!');
        },
        onError: () => toast.error('Failed to mark as done'),
    });

    const undoMut = useMutation({
        mutationFn: async (qId) => {
            const p = progress.find(x => x.question_id === qId);
            if (!p) return;
            const { error } = await supabase.from('progress').delete().eq('id', p.id);
            if (error) throw error;
        },
        onSuccess: () => qc.invalidateQueries({ queryKey: ['progress'] }),
        onError: () => toast.error('Failed to undo'),
    });

    const bookmarkMut = useMutation({
        mutationFn: async (q) => {
            const bm = bookmarks.find(b => b.question_id === q.id);
            if (bm) {
                const { error } = await supabase.from('bookmarks').delete().eq('id', bm.id);
                if (error) throw error;
            } else {
                const { error } = await supabase.from('bookmarks').insert({
                    user_id: user.id,
                    question_id: q.id,
                    question_title: q.title,
                    topic_name: topic?.name,
                    difficulty: q.difficulty,
                });
                if (error) throw error;
            }
        },
        onSuccess: () => qc.invalidateQueries({ queryKey: ['bookmarks'] }),
        onError: () => toast.error('Failed to update bookmark'),
    });

    if (!topic) return (
        <div className="flex items-center justify-center h-64">
            <div className="w-8 h-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
        </div>
    );

    return (
        <div className="space-y-6 max-w-3xl">

            {/* Header */}
            <div className="flex items-center gap-3">
                <Link to="/">
                    <Button variant="ghost" size="sm" className="rounded-xl">
                        <ArrowLeft className="w-4 h-4 mr-1" />Back
                    </Button>
                </Link>
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1.5">
                        {topic.logo_url
                            ? <img src={topic.logo_url} alt="" className="w-7 h-7 rounded-lg object-cover" />
                            : (
                                <div
                                    className="w-7 h-7 rounded-lg flex items-center justify-center text-white text-xs font-bold"
                                    style={{ background: topic.color || 'hsl(var(--primary))' }}
                                >
                                    {topic.name?.[0]}
                                </div>
                            )
                        }
                        <h1 className="text-xl font-bold font-heading">{topic.name}</h1>
                    </div>
                    <div className="flex items-center gap-3">
                        <Progress value={pct} className="h-2 flex-1 max-w-xs" />
                        <span className="text-xs text-muted-foreground whitespace-nowrap font-medium">
                            {doneCount}/{questions.length} done · {pct}%
                        </span>
                    </div>
                </div>
            </div>

            {/* Search + Filters */}
            <div className="space-y-2">
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                    <input
                        type="text"
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        placeholder="🔍 Search questions in this topic..."
                        className="w-full pl-9 pr-9 h-9 rounded-xl border border-input bg-background text-sm focus:outline-none focus:ring-1 focus:ring-ring placeholder:text-muted-foreground"
                    />
                    {search && (
                        <button
                            onClick={() => setSearch('')}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                        >
                            <X className="w-3.5 h-3.5" />
                        </button>
                    )}
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                    <Filter className="w-3.5 h-3.5 text-muted-foreground" />
                    <Select value={diffFilter} onValueChange={setDiffFilter}>
                        <SelectTrigger className="w-[130px] rounded-xl h-8 text-xs">
                            <SelectValue placeholder="Difficulty" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Levels</SelectItem>
                            <SelectItem value="basic">🟢 Basic</SelectItem>
                            <SelectItem value="medium">🟡 Medium</SelectItem>
                            <SelectItem value="experienced">🔴 Experienced</SelectItem>
                        </SelectContent>
                    </Select>
                    <Select value={typeFilter} onValueChange={setTypeFilter}>
                        <SelectTrigger className="w-[130px] rounded-xl h-8 text-xs">
                            <SelectValue placeholder="Type" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Types</SelectItem>
                            <SelectItem value="theory">📖 Theory</SelectItem>
                            <SelectItem value="coding">💻 Coding</SelectItem>
                            <SelectItem value="scenario">🎭 Scenario</SelectItem>
                            <SelectItem value="interview">🎤 Interview</SelectItem>
                            <SelectItem value="mcq">🔢 MCQ</SelectItem>
                        </SelectContent>
                    </Select>
                    <span className="text-xs text-muted-foreground ml-auto">
                        {questions.length} question{questions.length !== 1 ? 's' : ''}
                    </span>
                </div>
            </div>

            {/* Question list */}
            {questions.length === 0 ? (
                <Card className="rounded-2xl p-12 text-center border-dashed">
                    <p className="text-muted-foreground text-sm">No questions match your filter.</p>
                </Card>
            ) : (
                <div className="space-y-2.5">
                    {questions.map((q) => (
                        <QuestionRow
                            key={q.id}
                            q={q}
                            isCompleted={completedIds.has(q.id)}
                            isBookmarked={bookmarks.some(b => b.question_id === q.id)}
                            note={notes.find(n => n.question_id === q.id)}
                            onBookmark={() => bookmarkMut.mutate(q)}
                            onComplete={() => completeMut.mutate(q.id)}
                            onUndo={() => undoMut.mutate(q.id)}
                        />
                    ))}
                </div>
            )}

        </div>
    );
}