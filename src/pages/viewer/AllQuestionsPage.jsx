import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getCurrentUser } from '@/api/auth';
import { Question, Topic, Bookmark, Progress } from '@/api/entities';
import PageHeader from '@/components/shared/PageHeader';
import QuestionCard from '@/components/shared/QuestionCard';
import EmptyState from '@/components/shared/EmptyState';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Search, FileQuestion, X } from 'lucide-react';

const COMPANIES = ['Amazon', 'Google', 'Microsoft', 'Meta', 'Netflix', 'Oracle', 'Deloitte', 'TCS', 'Infosys', 'Wipro'];

export default function AllQuestionsPage() {
    const [search, setSearch] = useState('');
    const [topicFilter, setTopicFilter] = useState('all');
    const [diffFilter, setDiffFilter] = useState('all');
    const [typeFilter, setTypeFilter] = useState('all');
    const [expFilter, setExpFilter] = useState('all');
    const [companyFilter, setCompanyFilter] = useState('all');
    const [sort, setSort] = useState('newest');
    const qc = useQueryClient();

    const { data: user } = useQuery({ queryKey: ['me'], queryFn: getCurrentUser });
    const { data: questions = [], isLoading } = useQuery({ queryKey: ['questions'], queryFn: () => Question.list('created_at', false) });
    const { data: topics = [] } = useQuery({ queryKey: ['topics'], queryFn: () => Topic.list() });
    const { data: bookmarks = [] } = useQuery({ queryKey: ['bookmarks', user?.id], queryFn: () => Bookmark.filter({ user_id: user.id }), enabled: !!user?.id });
    const { data: progress = [] } = useQuery({ queryKey: ['progress', user?.id], queryFn: () => Progress.filter({ user_id: user.id }, 'completed_at'), enabled: !!user?.id });

    const bookmarkMut = useMutation({
        mutationFn: (q) => {
            const bm = bookmarks.find(b => b.question_id === q.id);
            if (bm) return Bookmark.delete(bm.id);
            return Bookmark.create({ user_id: user.id, question_id: q.id, question_title: q.title, topic_name: q.topic_name, difficulty: q.difficulty });
        },
        onSuccess: () => qc.invalidateQueries({ queryKey: ['bookmarks'] }),
    });

    const bookmarkSet = new Set(bookmarks.map(b => b.question_id));
    const completedSet = new Set(progress.map(p => p.question_id));

    const visible = questions.filter(q => q.is_visible !== false && q.status === 'published');

    const filtered = useMemo(() => {
        let qs = visible;
        if (search) {
            const s = search.toLowerCase();
            qs = qs.filter(q => q.title?.toLowerCase().includes(s) || q.description?.toLowerCase().includes(s) || q.topic_name?.toLowerCase().includes(s) || q.tags?.some(t => t.toLowerCase().includes(s)));
        }
        if (topicFilter !== 'all') qs = qs.filter(q => q.topic_id === topicFilter);
        if (diffFilter !== 'all') qs = qs.filter(q => q.difficulty === diffFilter);
        if (typeFilter !== 'all') qs = qs.filter(q => q.type === typeFilter);
        if (expFilter !== 'all') qs = qs.filter(q => q.experience_level === expFilter);
        if (companyFilter !== 'all') qs = qs.filter(q => q.company_tags?.includes(companyFilter));
        if (sort === 'oldest') qs = [...qs].reverse();
        if (sort === 'difficulty_asc') qs = [...qs].sort((a, b) => ['basic', 'medium', 'experienced'].indexOf(a.difficulty) - ['basic', 'medium', 'experienced'].indexOf(b.difficulty));
        return qs;
    }, [visible, search, topicFilter, diffFilter, typeFilter, expFilter, companyFilter, sort]);

    const activeFilters = [topicFilter, diffFilter, typeFilter, expFilter, companyFilter].filter(f => f !== 'all').length;

    const clearFilters = () => { setTopicFilter('all'); setDiffFilter('all'); setTypeFilter('all'); setExpFilter('all'); setCompanyFilter('all'); setSearch(''); };

    return (
        <div className="space-y-6">
            <PageHeader
                title="All Questions"
                badge="Question Bank"
                description={`Browse ${visible.length} interview questions across all topics`}
            />

            <div className="space-y-3">
                <div className="flex gap-2">
                    <div className="relative flex-1 max-w-lg">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search questions, topics, tags..." className="pl-9 rounded-xl" />
                        {search && <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2"><X className="w-4 h-4 text-muted-foreground" /></button>}
                    </div>
                    {activeFilters > 0 && (
                        <Button variant="outline" size="sm" onClick={clearFilters} className="rounded-xl gap-1.5">
                            <X className="w-3 h-3" />Clear {activeFilters}
                        </Button>
                    )}
                </div>
                <div className="flex flex-wrap gap-2">
                    <Select value={topicFilter} onValueChange={setTopicFilter}>
                        <SelectTrigger className="w-[140px] rounded-xl h-8 text-xs"><SelectValue placeholder="Topic" /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Topics</SelectItem>
                            {topics.filter(t => t.is_visible !== false).map(t => <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>)}
                        </SelectContent>
                    </Select>
                    <Select value={diffFilter} onValueChange={setDiffFilter}>
                        <SelectTrigger className="w-[130px] rounded-xl h-8 text-xs"><SelectValue placeholder="Difficulty" /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Levels</SelectItem>
                            <SelectItem value="basic">Basic</SelectItem>
                            <SelectItem value="medium">Medium</SelectItem>
                            <SelectItem value="experienced">Experienced</SelectItem>
                        </SelectContent>
                    </Select>
                    <Select value={typeFilter} onValueChange={setTypeFilter}>
                        <SelectTrigger className="w-[140px] rounded-xl h-8 text-xs"><SelectValue placeholder="Type" /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Types</SelectItem>
                            <SelectItem value="theory">Theory</SelectItem>
                            <SelectItem value="coding">Coding</SelectItem>
                            <SelectItem value="scenario">Scenario</SelectItem>
                            <SelectItem value="interview">Interview</SelectItem>
                            <SelectItem value="mcq">MCQ</SelectItem>
                        </SelectContent>
                    </Select>
                    <Select value={expFilter} onValueChange={setExpFilter}>
                        <SelectTrigger className="w-[150px] rounded-xl h-8 text-xs"><SelectValue placeholder="Experience" /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Experience</SelectItem>
                            <SelectItem value="fresher">Fresher 0-1yr</SelectItem>
                            <SelectItem value="junior">Junior 1-3yr</SelectItem>
                            <SelectItem value="mid_level">Mid 3-6yr</SelectItem>
                            <SelectItem value="senior">Senior 6+yr</SelectItem>
                        </SelectContent>
                    </Select>
                    <Select value={companyFilter} onValueChange={setCompanyFilter}>
                        <SelectTrigger className="w-[140px] rounded-xl h-8 text-xs"><SelectValue placeholder="Company" /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Companies</SelectItem>
                            {COMPANIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                        </SelectContent>
                    </Select>
                    <Select value={sort} onValueChange={setSort}>
                        <SelectTrigger className="w-[130px] rounded-xl h-8 text-xs"><SelectValue /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="newest">Newest</SelectItem>
                            <SelectItem value="oldest">Oldest</SelectItem>
                            <SelectItem value="difficulty_asc">By Difficulty</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </div>

            <p className="text-sm text-muted-foreground">{filtered.length} questions found</p>

            {isLoading ? (
                <div className="grid sm:grid-cols-2 gap-3">{Array(6).fill(0).map((_, i) => <div key={i} className="h-28 bg-muted rounded-2xl animate-pulse" />)}</div>
            ) : filtered.length === 0 ? (
                <EmptyState icon={FileQuestion} title="No questions match" description="Try adjusting your search or filters" action={<Button variant="outline" onClick={clearFilters}>Clear Filters</Button>} />
            ) : (
                <div className="grid sm:grid-cols-2 gap-3">
                    {filtered.map((q, i) => (
                        <QuestionCard
                            key={q.id}
                            question={q}
                            isBookmarked={bookmarkSet.has(q.id)}
                            isCompleted={completedSet.has(q.id)}
                            onBookmark={() => bookmarkMut.mutate(q)}
                            linkTo={`/question/${q.id}`}
                            delay={i * 0.03}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}