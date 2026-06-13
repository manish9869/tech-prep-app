import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Question, Topic } from '@/api/entities';
import PageHeader from '@/components/shared/PageHeader';
import EmptyState from '@/components/shared/EmptyState';
import QuestionFormDialog from '@/components/admin/QuestionFormDialog';
import QuestionViewDialog from '@/components/admin/QuestionViewDialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';
import { Plus, Search, MoreVertical, Pencil, Trash2, Eye, EyeOff, FileQuestion } from 'lucide-react';
import { toast } from 'sonner';
import { motion } from 'framer-motion';

const diffColors = {
    basic: 'bg-emerald-500/10 text-emerald-600',
    medium: 'bg-amber-500/10 text-amber-600',
    experienced: 'bg-red-500/10 text-red-600',
};
const statusColors = {
    draft: 'bg-slate-500/10 text-slate-600',
    review: 'bg-blue-500/10 text-blue-600',
    published: 'bg-emerald-500/10 text-emerald-600',
    archived: 'bg-amber-500/10 text-amber-600',
};

export default function QuestionManagement() {
    const [search, setSearch] = useState('');
    const [topicFilter, setTopicFilter] = useState('all');
    const [diffFilter, setDiffFilter] = useState('all');
    const [formOpen, setFormOpen] = useState(false);
    const [editQ, setEditQ] = useState(null);
    const [viewQ, setViewQ] = useState(null);
    const [deleteId, setDeleteId] = useState(null);
    const qc = useQueryClient();

    const { data: questions = [], isLoading } = useQuery({
        queryKey: ['questions'],
        queryFn: () => Question.list('created_at', false),
    });

    const { data: topics = [] } = useQuery({
        queryKey: ['topics'],
        queryFn: () => Topic.list(),
    });

    const deleteMut = useMutation({
        mutationFn: id => Question.delete(id),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ['questions'] });
            setDeleteId(null);
            toast.success('Question deleted');
        },
    });

    const toggleMut = useMutation({
        mutationFn: ({ id, val }) => Question.update(id, { is_visible: val }),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ['questions'] });
            toast.success('Updated');
        },
    });

    const statusMut = useMutation({
        mutationFn: ({ id, status }) => Question.update(id, { status }),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ['questions'] });
            toast.success('Status updated');
        },
    });

    const filtered = questions.filter(q => {
        if (search && !q.title?.toLowerCase().includes(search.toLowerCase())) return false;
        if (topicFilter !== 'all' && q.topic_id !== topicFilter) return false;
        if (diffFilter !== 'all' && q.difficulty !== diffFilter) return false;
        return true;
    });

    return (
        <div className="space-y-6">
            <PageHeader
                title="Questions"
                description={`${questions.length} questions total`}
                actions={
                    <Button onClick={() => { setEditQ(null); setFormOpen(true); }} className="rounded-xl">
                        <Plus className="w-4 h-4 mr-2" />Add Question
                    </Button>
                }
            />

            <div className="flex flex-wrap gap-3">
                <div className="relative flex-1 min-w-[200px] max-w-md">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                        placeholder="Search questions..."
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        className="pl-9 rounded-xl"
                    />
                </div>

                <Select value={topicFilter} onValueChange={setTopicFilter}>
                    <SelectTrigger className="w-[180px] rounded-xl">
                        <SelectValue placeholder="All Topics">
                            {topicFilter === 'all' ? 'All Topics' : (() => {
                                const t = topics.find(t => t.id === topicFilter);
                                return t ? (
                                    <span className="flex items-center gap-2">
                                        {t.logo_url
                                            ? <img src={t.logo_url} alt={t.name} className="w-4 h-4 object-contain" />
                                            : <span className="w-4 h-4 rounded-sm flex items-center justify-center text-white text-[9px] font-black" style={{ background: t.color || '#6366f1' }}>{t.name?.[0]}</span>
                                        }
                                        {t.name}
                                    </span>
                                ) : 'All Topics';
                            })()}
                        </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All Topics</SelectItem>
                        {topics.map(t => (
                            <SelectItem key={t.id} value={t.id}>
                                <span className="flex items-center gap-2">
                                    {t.logo_url
                                        ? <img src={t.logo_url} alt={t.name} className="w-4 h-4 object-contain" />
                                        : <span className="w-4 h-4 rounded-sm flex items-center justify-center text-white text-[9px] font-black" style={{ background: t.color || '#6366f1' }}>{t.name?.[0]}</span>
                                    }
                                    {t.name}
                                </span>
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>

                <Select value={diffFilter} onValueChange={setDiffFilter}>
                    <SelectTrigger className="w-[150px] rounded-xl"><SelectValue placeholder="Difficulty" /></SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All Levels</SelectItem>
                        <SelectItem value="basic">Basic</SelectItem>
                        <SelectItem value="medium">Medium</SelectItem>
                        <SelectItem value="experienced">Experienced</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            {isLoading ? (
                <div className="space-y-3">
                    {Array(5).fill(0).map((_, i) => <div key={i} className="h-20 bg-muted rounded-2xl animate-pulse" />)}
                </div>
            ) : filtered.length === 0 ? (
                <EmptyState icon={FileQuestion} title="No questions found" description="Add your first question to start building your question bank" />
            ) : (
                <div className="space-y-3">
                    {filtered.map((q, i) => (
                        <motion.div
                            key={q.id}
                            initial={{ opacity: 0, y: 8 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.03 }}
                            className={`bg-card border border-border rounded-2xl p-4 hover:shadow-md transition-all ${!q.is_visible ? 'opacity-60' : ''}`}
                        >
                            <div className="flex items-start gap-3">
                                <div className="flex-1 min-w-0">
                                    <h3 className="font-medium text-sm text-foreground line-clamp-1">{q.title}</h3>
                                    <div className="flex flex-wrap items-center gap-2 mt-2">
                                        <span className="text-xs text-muted-foreground">{q.topic_name || 'No topic'}</span>
                                        <Badge variant="secondary" className={`text-[10px] ${diffColors[q.difficulty] || ''}`}>{q.difficulty}</Badge>
                                        <Badge variant="secondary" className={`text-[10px] ${statusColors[q.status] || ''}`}>{q.status}</Badge>
                                        <Badge variant="outline" className="text-[10px]">{q.type}</Badge>
                                        {q.company_tags?.map(c => <Badge key={c} variant="outline" className="text-[10px]">{c}</Badge>)}
                                    </div>
                                </div>
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button variant="ghost" size="icon" className="h-8 w-8">
                                            <MoreVertical className="w-4 h-4" />
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end">
                                        <DropdownMenuItem onClick={() => setViewQ(q)}>
                                            <Eye className="w-3.5 h-3.5 mr-2" />View
                                        </DropdownMenuItem>
                                        <DropdownMenuItem onClick={() => { setEditQ(q); setFormOpen(true); }}>
                                            <Pencil className="w-3.5 h-3.5 mr-2" />Edit
                                        </DropdownMenuItem>
                                        <DropdownMenuItem onClick={() => toggleMut.mutate({ id: q.id, val: !q.is_visible })}>
                                            {q.is_visible
                                                ? <><EyeOff className="w-3.5 h-3.5 mr-2" />Hide</>
                                                : <><Eye className="w-3.5 h-3.5 mr-2" />Show</>
                                            }
                                        </DropdownMenuItem>
                                        {q.status === 'draft' && (
                                            <DropdownMenuItem onClick={() => statusMut.mutate({ id: q.id, status: 'review' })}>
                                                Submit for Review
                                            </DropdownMenuItem>
                                        )}
                                        {q.status === 'review' && (
                                            <DropdownMenuItem onClick={() => statusMut.mutate({ id: q.id, status: 'published' })}>
                                                Publish
                                            </DropdownMenuItem>
                                        )}
                                        {q.status === 'published' && (
                                            <DropdownMenuItem onClick={() => statusMut.mutate({ id: q.id, status: 'archived' })}>
                                                Archive
                                            </DropdownMenuItem>
                                        )}
                                        <DropdownMenuItem className="text-destructive" onClick={() => setDeleteId(q.id)}>
                                            <Trash2 className="w-3.5 h-3.5 mr-2" />Delete
                                        </DropdownMenuItem>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </div>
                        </motion.div>
                    ))}
                </div>
            )}

            <QuestionFormDialog open={formOpen} onOpenChange={setFormOpen} editQuestion={editQ} topics={topics} />
            <QuestionViewDialog open={!!viewQ} onOpenChange={() => setViewQ(null)} question={viewQ} />

            <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Delete this question?</AlertDialogTitle>
                        <AlertDialogDescription>This action cannot be undone.</AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={() => deleteMut.mutate(deleteId)}
                            className="bg-destructive text-destructive-foreground"
                        >
                            Delete
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}