import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getCurrentUser } from '@/api/auth';
import { Question, Progress, Bookmark as BookmarkEntity, Note } from '@/api/entities';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import DifficultyBadge from '@/components/shared/DifficultyBadge';
import {
    Bookmark, BookmarkCheck, CheckCircle2, Code, StickyNote,
    Save, Trash2, Eye, EyeOff, Building2, ArrowLeft
} from 'lucide-react';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';
import ReactMarkdown from 'react-markdown';

export default function QuestionDetailPage() {
    const { questionId } = useParams();
    const navigate = useNavigate();
    const [showAnswer, setShowAnswer] = useState(false);
    const [showNotes, setShowNotes] = useState(false);
    const [noteText, setNoteText] = useState('');
    const qc = useQueryClient();

    const { data: user } = useQuery({ queryKey: ['me'], queryFn: getCurrentUser });
    const { data: allQs = [] } = useQuery({ queryKey: ['questions'], queryFn: () => Question.list('created_at', false) });
    const q = allQs.find(x => x.id === questionId);

    const { data: progress = [] } = useQuery({ queryKey: ['progress', user?.id], queryFn: () => Progress.filter({ user_id: user.id }, 'completed_at'), enabled: !!user?.id });
    const { data: bookmarks = [] } = useQuery({ queryKey: ['bookmarks', user?.id], queryFn: () => BookmarkEntity.filter({ user_id: user.id }), enabled: !!user?.id });
    const { data: notes = [] } = useQuery({ queryKey: ['notes', user?.id], queryFn: () => Note.filter({ user_id: user.id }), enabled: !!user?.id });

    const completedIds = new Set(progress.map(p => p.question_id));
    const isCompleted = q && completedIds.has(q.id);
    const isBookmarked = q && bookmarks.some(b => b.question_id === q.id);
    const currentNote = q ? notes.find(n => n.question_id === q.id) : null;

    useEffect(() => { setNoteText(currentNote?.content || ''); }, [currentNote?.id, q?.id]);

    const completeMut = useMutation({
        mutationFn: () => Progress.create({ user_id: user.id, question_id: q.id, topic_id: q.topic_id, completed_at: new Date().toISOString() }),
        onSuccess: () => { qc.invalidateQueries({ queryKey: ['progress'] }); toast.success('Marked as completed!'); },
    });
    const bookmarkMut = useMutation({
        mutationFn: () => {
            const bm = bookmarks.find(b => b.question_id === q.id);
            if (bm) return BookmarkEntity.delete(bm.id);
            return BookmarkEntity.create({ user_id: user.id, question_id: q.id, question_title: q.title, topic_name: q.topic_name, difficulty: q.difficulty });
        },
        onSuccess: () => qc.invalidateQueries({ queryKey: ['bookmarks'] }),
    });
    const saveNoteMut = useMutation({
        mutationFn: () => currentNote ? Note.update(currentNote.id, { content: noteText }) : Note.create({ user_id: user.id, question_id: q.id, content: noteText }),
        onSuccess: () => { qc.invalidateQueries({ queryKey: ['notes'] }); toast.success('Note saved'); },
    });
    const deleteNoteMut = useMutation({
        mutationFn: () => Note.delete(currentNote.id),
        onSuccess: () => { qc.invalidateQueries({ queryKey: ['notes'] }); setNoteText(''); },
    });

    if (!q) return (
        <div className="flex items-center justify-center h-64">
            <div className="w-8 h-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
        </div>
    );

    return (
        <div className="max-w-3xl space-y-4">
            <div className="flex items-center gap-2">
                <Button variant="ghost" size="sm" onClick={() => navigate(-1)} className="rounded-xl">
                    <ArrowLeft className="w-4 h-4 mr-1" />Back
                </Button>
            </div>

            <Card className="rounded-2xl overflow-hidden">
                <div className="h-1.5 bg-gradient-to-r from-primary to-violet-500" />
                <CardContent className="p-6 space-y-5">
                    <div className="flex items-start justify-between gap-3">
                        <div className="flex-1">
                            <div className="flex flex-wrap items-center gap-2 mb-3">
                                <DifficultyBadge level={q.difficulty} />
                                <Badge variant="outline" className="text-[10px] uppercase">{q.type}</Badge>
                                {q.topic_name && (
                                    <Link to={`/study/${q.topic_id}`}>
                                        <Badge variant="secondary" className="text-[10px] hover:bg-primary/10 cursor-pointer">{q.topic_name}</Badge>
                                    </Link>
                                )}
                                {q.experience_level && <Badge variant="outline" className="text-[10px]">{q.experience_level.replace('_', '-')}</Badge>}
                                {isCompleted && <span className="flex items-center gap-1 text-[11px] font-semibold text-emerald-600"><CheckCircle2 className="w-3.5 h-3.5" />Completed</span>}
                            </div>
                            <h1 className="text-xl font-bold text-foreground">{q.title}</h1>
                        </div>
                        <button onClick={() => bookmarkMut.mutate()} className="p-2 rounded-xl hover:bg-muted transition-colors">
                            {isBookmarked ? <BookmarkCheck className="w-5 h-5 text-primary" /> : <Bookmark className="w-5 h-5 text-muted-foreground" />}
                        </button>
                    </div>

                    {q.description && (
                        <div className="prose prose-sm dark:prose-invert max-w-none text-muted-foreground">
                            <ReactMarkdown>{q.description}</ReactMarkdown>
                        </div>
                    )}

                    {q.code_snippet && (
                        <div className="rounded-xl overflow-hidden border border-border">
                            <div className="flex items-center gap-2 bg-slate-900 px-4 py-2.5">
                                <Code className="w-3.5 h-3.5 text-slate-400" />
                                <span className="text-xs text-slate-400 font-mono uppercase">{q.code_language || 'code'}</span>
                            </div>
                            <pre className="bg-slate-950 text-slate-100 p-4 overflow-x-auto text-sm font-mono leading-relaxed">
                                <code>{q.code_snippet}</code>
                            </pre>
                        </div>
                    )}

                    {q.company_tags?.length > 0 && (
                        <div className="flex flex-wrap gap-1.5">
                            {q.company_tags.map(c => (
                                <span key={c} className="flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 bg-muted rounded-md text-muted-foreground border">
                                    <Building2 className="w-2.5 h-2.5" />{c}
                                </span>
                            ))}
                        </div>
                    )}

                    <div className="border-t border-border pt-4">
                        <Button onClick={() => setShowAnswer(!showAnswer)} variant="outline" className="rounded-xl mb-4 font-semibold">
                            {showAnswer ? <EyeOff className="w-4 h-4 mr-2" /> : <Eye className="w-4 h-4 mr-2" />}
                            {showAnswer ? 'Hide Answer' : '👁 Reveal Answer'}
                        </Button>
                        <AnimatePresence>
                            {showAnswer && (
                                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-4">
                                    {q.answer && (
                                        <div className="rounded-2xl bg-emerald-500/5 border border-emerald-500/20 p-5">
                                            <p className="text-xs font-semibold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider mb-2">Answer</p>
                                            <div className="prose prose-sm dark:prose-invert max-w-none"><ReactMarkdown>{q.answer}</ReactMarkdown></div>
                                        </div>
                                    )}
                                    {q.explanation && (
                                        <div className="rounded-2xl bg-blue-500/5 border border-blue-500/20 p-5">
                                            <p className="text-xs font-semibold text-blue-700 dark:text-blue-400 uppercase tracking-wider mb-2">Explanation</p>
                                            <div className="prose prose-sm dark:prose-invert max-w-none"><ReactMarkdown>{q.explanation}</ReactMarkdown></div>
                                        </div>
                                    )}
                                    {q.reference_links && (
                                        <div className="rounded-xl bg-muted/50 p-4">
                                            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">References</p>
                                            <p className="text-xs text-muted-foreground">{q.reference_links}</p>
                                        </div>
                                    )}
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>

                    <div className="border-t border-border pt-4">
                        <button onClick={() => setShowNotes(!showNotes)} className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors font-medium mb-3">
                            <StickyNote className="w-4 h-4" /> Personal Notes {currentNote && <span className="text-[10px] px-1.5 py-0.5 bg-primary/10 text-primary rounded-full">1</span>}
                        </button>
                        <AnimatePresence>
                            {showNotes && (
                                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="space-y-2 overflow-hidden">
                                    <Textarea value={noteText} onChange={e => setNoteText(e.target.value)} placeholder="Your notes..." rows={3} className="text-sm rounded-xl resize-none" />
                                    <div className="flex gap-2">
                                        <Button size="sm" variant="outline" onClick={() => saveNoteMut.mutate()} disabled={!noteText.trim()} className="rounded-xl"><Save className="w-3 h-3 mr-1" />Save</Button>
                                        {currentNote && <Button size="sm" variant="ghost" className="text-destructive rounded-xl" onClick={() => deleteNoteMut.mutate()}><Trash2 className="w-3 h-3 mr-1" />Delete</Button>}
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>

                    {!isCompleted && (
                        <div className="pt-2">
                            <Button onClick={() => completeMut.mutate()} variant="outline" className="rounded-xl text-emerald-600 border-emerald-500/30 hover:bg-emerald-500/10">
                                <CheckCircle2 className="w-4 h-4 mr-2" />Mark as Completed
                            </Button>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}