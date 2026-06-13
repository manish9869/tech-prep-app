import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import ReactMarkdown from 'react-markdown';

const diffColors = {
    basic: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20',
    medium: 'bg-amber-500/10 text-amber-600 border-amber-500/20',
    experienced: 'bg-red-500/10 text-red-600 border-red-500/20',
};

const typeEmojis = { theory: '📖', coding: '💻', scenario: '🎭', interview: '🎤', mcq: '🔢' };

export default function QuestionViewDialog({ open, onOpenChange, question }) {
    if (!question) return null;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-2xl max-h-[90vh] p-0 overflow-hidden">
                <DialogHeader className="px-6 pt-5 pb-3 border-b border-border">
                    <div className="flex items-center gap-2 mb-1">
                        <span>{typeEmojis[question.type] || '📋'}</span>
                        <Badge className={`text-[10px] border ${diffColors[question.difficulty] || ''}`}>
                            {question.difficulty}
                        </Badge>
                        <Badge variant="outline" className="text-[10px]">{question.type}</Badge>
                        <Badge variant="outline" className="text-[10px]">{question.status}</Badge>
                    </div>
                    <DialogTitle className="font-heading text-lg leading-snug">{question.title}</DialogTitle>
                    {question.topic_name && (
                        <p className="text-xs text-muted-foreground mt-1">📂 {question.topic_name}</p>
                    )}
                </DialogHeader>

                <ScrollArea className="max-h-[calc(90vh-120px)]">
                    <div className="px-6 py-5 space-y-5">

                        {/* Description */}
                        {question.description && (
                            <div>
                                <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-2">Context</p>
                                <p className="text-sm text-foreground leading-relaxed bg-muted/40 p-3 border-l-2 border-primary">{question.description}</p>
                            </div>
                        )}

                        {/* Code snippet */}
                        {question.code_snippet && (
                            <div>
                                <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-2">Code Snippet · {question.code_language?.toUpperCase()}</p>
                                <pre className="bg-zinc-950 text-zinc-200 text-xs p-4 overflow-x-auto font-mono leading-relaxed scrollbar-thin">
                                    {question.code_snippet}
                                </pre>
                            </div>
                        )}

                        {/* MCQ Options */}
                        {question.type === 'mcq' && question.options?.length > 0 && (
                            <div>
                                <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-2">MCQ Options</p>
                                <div className="space-y-2">
                                    {question.options.map((opt, i) => (
                                        <div key={i} className={`flex items-center gap-3 p-3 border text-sm ${question.correct_option_index === i
                                            ? 'border-emerald-500/40 bg-emerald-500/5 text-emerald-700 dark:text-emerald-400'
                                            : 'border-border'
                                            }`}>
                                            <span className="font-black text-xs text-muted-foreground w-5">{String.fromCharCode(65 + i)}.</span>
                                            <span className="flex-1">{opt.text}</span>
                                            {question.correct_option_index === i && (
                                                <span className="text-[10px] font-black text-emerald-600 bg-emerald-500/10 px-2 py-0.5">✓ CORRECT</span>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Answer */}
                        {question.answer && (
                            <div>
                                <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-2">Answer</p>
                                <div className="prose prose-sm max-w-none dark:prose-invert text-sm leading-relaxed bg-muted/20 p-4 border-l-2 border-emerald-500">
                                    <ReactMarkdown>{question.answer}</ReactMarkdown>
                                </div>
                            </div>
                        )}

                        {/* Explanation */}
                        {question.explanation && (
                            <div>
                                <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-2">Explanation</p>
                                <div className="prose prose-sm max-w-none dark:prose-invert text-sm leading-relaxed bg-muted/20 p-4">
                                    <ReactMarkdown>{question.explanation}</ReactMarkdown>
                                </div>
                            </div>
                        )}

                        {/* Tags & Companies */}
                        <div className="flex flex-wrap gap-4">
                            {question.tags?.length > 0 && (
                                <div>
                                    <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-1.5">Tags</p>
                                    <div className="flex flex-wrap gap-1.5">
                                        {question.tags.map(t => <Badge key={t} variant="secondary" className="text-xs">{t}</Badge>)}
                                    </div>
                                </div>
                            )}
                            {question.company_tags?.length > 0 && (
                                <div>
                                    <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-1.5">Companies</p>
                                    <div className="flex flex-wrap gap-1.5">
                                        {question.company_tags.map(c => <Badge key={c} variant="outline" className="text-xs">🏢 {c}</Badge>)}
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* References */}
                        {question.references && (
                            <div>
                                <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-1.5">References</p>
                                <p className="text-xs text-muted-foreground">{question.references}</p>
                            </div>
                        )}
                    </div>
                </ScrollArea>
            </DialogContent>
        </Dialog>
    );
}