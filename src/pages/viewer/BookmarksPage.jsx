import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getCurrentUser } from '@/api/auth';
import { Bookmark as BookmarkEntity } from '@/api/entities';
import PageHeader from '@/components/shared/PageHeader';
import EmptyState from '@/components/shared/EmptyState';
import DifficultyBadge from '@/components/shared/DifficultyBadge';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Bookmark, Search, Trash2, ArrowRight, Star } from 'lucide-react';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';
import { motion } from 'framer-motion';

export default function BookmarksPage() {
    const [search, setSearch] = useState('');
    const qc = useQueryClient();

    const { data: user } = useQuery({ queryKey: ['me'], queryFn: getCurrentUser });
    const { data: bookmarks = [], isLoading } = useQuery({
        queryKey: ['bookmarks', user?.id],
        queryFn: () => BookmarkEntity.filter({ user_id: user.id }),
        enabled: !!user?.id,
    });

    const removeMut = useMutation({
        mutationFn: id => BookmarkEntity.delete(id),
        onSuccess: () => { qc.invalidateQueries({ queryKey: ['bookmarks'] }); toast.success('Bookmark removed'); },
    });

    const filtered = bookmarks.filter(b =>
        !search || b.question_title?.toLowerCase().includes(search.toLowerCase()) || b.topic_name?.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div className="space-y-6 max-w-3xl">
            <PageHeader
                title="My Bookmarks"
                badge="Saved Questions"
                description={`${bookmarks.length} questions saved for later review`}
            />

            {bookmarks.length > 0 && (
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search bookmarks..." className="pl-9 rounded-xl" />
                </div>
            )}

            {isLoading ? (
                <div className="space-y-3">{Array(4).fill(0).map((_, i) => <div key={i} className="h-20 bg-muted rounded-2xl animate-pulse" />)}</div>
            ) : filtered.length === 0 ? (
                <EmptyState
                    icon={Bookmark}
                    title={bookmarks.length === 0 ? 'No bookmarks yet' : 'No matches found'}
                    description={bookmarks.length === 0 ? 'Bookmark questions while studying to quickly find them later.' : 'Try a different search term.'}
                />
            ) : (
                <div className="space-y-3">
                    {filtered.map((bm, i) => (
                        <motion.div key={bm.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}>
                            <Card className="rounded-2xl hover:shadow-md hover:border-primary/30 transition-all group">
                                <CardContent className="p-4 flex items-center gap-4">
                                    <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center flex-shrink-0">
                                        <Star className="w-5 h-5 text-amber-500 fill-amber-500" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="font-semibold text-sm text-foreground group-hover:text-primary transition-colors truncate">{bm.question_title}</p>
                                        <div className="flex items-center gap-2 mt-1">
                                            {bm.topic_name && <span className="text-xs text-muted-foreground">{bm.topic_name}</span>}
                                            {bm.difficulty && <DifficultyBadge level={bm.difficulty} />}
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-1 flex-shrink-0">
                                        <Link to={`/question/${bm.question_id}`}>
                                            <Button variant="ghost" size="sm" className="rounded-xl text-xs text-primary hover:bg-primary/10">
                                                Open <ArrowRight className="w-3 h-3 ml-1" />
                                            </Button>
                                        </Link>
                                        <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive" onClick={() => removeMut.mutate(bm.id)}>
                                            <Trash2 className="w-3.5 h-3.5" />
                                        </Button>
                                    </div>
                                </CardContent>
                            </Card>
                        </motion.div>
                    ))}
                </div>
            )}
        </div>
    );
}