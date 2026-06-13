import React from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import DifficultyBadge from './DifficultyBadge';
import { Bookmark, BookmarkCheck, ArrowRight, CheckCircle2, Code, Building2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';

export default function QuestionCard({ question, isBookmarked, isCompleted, onBookmark, linkTo, delay = 0 }) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay }}
        >
            <Card className={cn(
                'rounded-2xl border border-border hover:shadow-lg hover:border-primary/30 transition-all duration-200 group overflow-hidden',
                isCompleted && 'border-emerald-500/30 bg-emerald-500/5'
            )}>
                <CardContent className="p-5">
                    <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                            <div className="flex flex-wrap items-center gap-2 mb-2">
                                <DifficultyBadge level={question.difficulty} />
                                <Badge variant="outline" className="text-[10px] uppercase">{question.type}</Badge>
                                {isCompleted && (
                                    <span className="flex items-center gap-1 text-[10px] font-semibold text-emerald-600">
                                        <CheckCircle2 className="w-3 h-3" /> Done
                                    </span>
                                )}
                                {question.code_snippet && <Code className="w-3 h-3 text-muted-foreground" />}
                            </div>
                            <h3 className="font-semibold text-sm text-foreground group-hover:text-primary transition-colors line-clamp-2">
                                {question.title}
                            </h3>
                            {question.topic_name && (
                                <p className="text-xs text-muted-foreground mt-1.5 flex items-center gap-1">
                                    <span className="w-1.5 h-1.5 rounded-full bg-primary/50 inline-block" />
                                    {question.topic_name}
                                </p>
                            )}
                            {question.company_tags?.length > 0 && (
                                <div className="flex flex-wrap gap-1 mt-2">
                                    {question.company_tags.slice(0, 3).map(c => (
                                        <span key={c} className="inline-flex items-center gap-1 text-[9px] font-medium px-1.5 py-0.5 bg-muted rounded-md text-muted-foreground">
                                            <Building2 className="w-2.5 h-2.5" />{c}
                                        </span>
                                    ))}
                                    {question.company_tags.length > 3 && <span className="text-[9px] text-muted-foreground">+{question.company_tags.length - 3}</span>}
                                </div>
                            )}
                        </div>
                        <div className="flex flex-col items-end gap-2 flex-shrink-0">
                            {onBookmark && (
                                <button
                                    onClick={e => { e.preventDefault(); onBookmark(); }}
                                    className="p-1.5 rounded-lg hover:bg-muted transition-colors"
                                >
                                    {isBookmarked
                                        ? <BookmarkCheck className="w-4 h-4 text-primary" />
                                        : <Bookmark className="w-4 h-4 text-muted-foreground hover:text-primary transition-colors" />
                                    }
                                </button>
                            )}
                            {linkTo && (
                                <Link to={linkTo}>
                                    <Button size="sm" variant="ghost" className="rounded-xl text-xs px-2 h-7 text-primary hover:bg-primary/10">
                                        Open <ArrowRight className="w-3 h-3 ml-1" />
                                    </Button>
                                </Link>
                            )}
                        </div>
                    </div>
                </CardContent>
            </Card>
        </motion.div>
    );
}