import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Topic, Question, QuizAttempt, Profile } from '@/api/entities';
import StatCard from '@/components/shared/StatCard';
import PageHeader from '@/components/shared/PageHeader';
import {
    BookOpen, FileQuestion, Users, Eye, EyeOff, Brain, Clock,
    TrendingUp, Plus, Upload, ArrowRight, Zap, CheckCircle2, AlertTriangle, FileText
} from 'lucide-react';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
    ResponsiveContainer, PieChart, Pie, Cell, Legend
} from 'recharts';
import { Skeleton } from '@/components/ui/skeleton';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { exportTopicAsPDF } from '@/lib/exportTopicPDF';

const diffColors = {
    basic: 'bg-emerald-500/10 text-emerald-600',
    medium: 'bg-amber-500/10 text-amber-600',
    experienced: 'bg-red-500/10 text-red-600',
};
const PIE_COLORS = ['hsl(152,60%,40%)', 'hsl(38,92%,50%)', 'hsl(0,72%,51%)'];

const quickActions = [
    { to: '/questions', icon: Plus, label: 'Add Question', sub: 'Create new question', color: 'bg-primary/10 text-primary' },
    { to: '/topics', icon: BookOpen, label: 'Manage Topics', sub: 'Add or edit topics', color: 'bg-blue-500/10 text-blue-600' },
    { to: '/import-export', icon: Upload, label: 'Import / Export', sub: 'Bulk data operations', color: 'bg-emerald-500/10 text-emerald-600' },
    { to: '/questions', icon: FileText, label: 'Review Drafts', sub: 'Publish pending items', color: 'bg-amber-500/10 text-amber-600' },
];

export default function AdminDashboard() {
    const { data: topics = [], isLoading: tL } = useQuery({ queryKey: ['topics'], queryFn: () => Topic.list() });
    const { data: questions = [], isLoading: qL } = useQuery({ queryKey: ['questions'], queryFn: () => Question.list() });
    const { data: users = [] } = useQuery({ queryKey: ['profiles'], queryFn: () => Profile.list() });
    const { data: quizzes = [] } = useQuery({ queryKey: ['quizAttempts'], queryFn: () => QuizAttempt.list() });

    const isLoading = tL || qL;
    const publishedQ = questions.filter(q => q.is_visible && q.status === 'published');
    const hiddenQ = questions.filter(q => !q.is_visible || q.status !== 'published');
    const drafts = questions.filter(q => q.status === 'draft');
    const reviewQ = questions.filter(q => q.status === 'review');

    const topicChartData = topics.map(t => ({
        name: t.name?.slice(0, 9),
        count: questions.filter(q => q.topic_id === t.id).length,
    })).filter(d => d.count > 0).slice(0, 10);

    const diffChartData = [
        { name: 'Basic', value: questions.filter(q => q.difficulty === 'basic').length },
        { name: 'Medium', value: questions.filter(q => q.difficulty === 'medium').length },
        { name: 'Experienced', value: questions.filter(q => q.difficulty === 'experienced').length },
    ].filter(d => d.value > 0);

    const avgQuizScore = quizzes.length
        ? Math.round(quizzes.reduce((a, q) => a + (q.score_percentage || 0), 0) / quizzes.length)
        : 0;

    const handleExportTopic = (topic) => {
        const qs = questions.filter(q => q.topic_id === topic.id && q.status === 'published');
        exportTopicAsPDF(topic, qs);
    };

    if (isLoading) {
        return (
            <div className="space-y-6">
                <Skeleton className="h-10 w-64" />
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                    {Array(8).fill(0).map((_, i) => <Skeleton key={i} className="h-24" />)}
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-8">
            <PageHeader
                title="Admin Dashboard"
                badge="Control Panel"
                description="Full platform overview — content, users, quizzes and performance."
                actions={
                    <Link to="/questions">
                        <Button className="font-bold text-xs px-5 h-9">
                            <Plus className="w-3.5 h-3.5 mr-1.5" /> New Question
                        </Button>
                    </Link>
                }
            />

            <div className="grid grid-cols-2 md:grid-cols-4 gap-0 border border-border overflow-hidden">
                {[
                    { label: 'Total Questions', value: questions.length, sub: `${publishedQ.length} published`, color: '#6333e6' },
                    { label: 'Topics', value: topics.length, sub: `${topics.filter(t => t.is_visible).length} visible`, color: '#0ea5e9' },
                    { label: 'Users', value: users.length, sub: 'registered learners', color: '#10b981' },
                    { label: 'Avg Quiz Score', value: `${avgQuizScore}%`, sub: `from ${quizzes.length} attempts`, color: '#f59e0b' },
                ].map((m, i) => (
                    <div key={i} className="bg-card p-5 border-r border-b border-border last:border-r-0 relative overflow-hidden group hover:bg-muted/30 transition-colors">
                        <div className="absolute top-0 left-0 w-full h-0.5" style={{ background: m.color }} />
                        <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-muted-foreground mb-1">{m.label}</p>
                        <p className="text-3xl font-black font-heading leading-none" style={{ color: m.color }}>{m.value}</p>
                        <p className="text-xs text-muted-foreground mt-1.5">{m.sub}</p>
                    </div>
                ))}
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                <StatCard title="Published" value={publishedQ.length} icon={Eye} color="success" delay={0} />
                <StatCard title="Drafts" value={drafts.length} icon={EyeOff} color="warning" delay={0.05} />
                <StatCard title="In Review" value={reviewQ.length} icon={AlertTriangle} color="blue" delay={0.1} />
                <StatCard title="Quiz Attempts" value={quizzes.length} icon={Brain} color="violet" delay={0.15} />
            </div>

            <div>
                <div className="flex items-center gap-2 mb-4">
                    <div className="w-0.5 h-5 bg-primary" />
                    <h2 className="text-base font-black text-foreground">Quick Actions</h2>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {quickActions.map(item => (
                        <Link key={item.to} to={item.to}>
                            <div className="bg-card border border-border hover:border-primary/40 hover:shadow-md transition-all cursor-pointer group p-4">
                                <div className={`w-10 h-10 ${item.color} flex items-center justify-center mb-3 group-hover:scale-110 transition-transform`}>
                                    <item.icon className="w-5 h-5" />
                                </div>
                                <p className="text-sm font-bold text-foreground">{item.label}</p>
                                <p className="text-xs text-muted-foreground mt-0.5">{item.sub}</p>
                            </div>
                        </Link>
                    ))}
                </div>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
                <div className="bg-card border border-border p-6">
                    <div className="flex items-center gap-2 mb-1">
                        <div className="w-0.5 h-4 bg-primary" />
                        <h3 className="text-sm font-bold text-foreground">Questions by Topic</h3>
                    </div>
                    <p className="text-xs text-muted-foreground mb-5 pl-2.5">Distribution across all topics</p>
                    {topicChartData.length > 0 ? (
                        <ResponsiveContainer width="100%" height={220}>
                            <BarChart data={topicChartData} barSize={18}>
                                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                                <XAxis dataKey="name" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }} axisLine={false} tickLine={false} />
                                <YAxis tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }} axisLine={false} tickLine={false} />
                                <Tooltip contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 0, fontSize: 12 }} cursor={{ fill: 'hsl(var(--muted))' }} />
                                <Bar dataKey="count" name="Questions" fill="hsl(var(--primary))" />
                            </BarChart>
                        </ResponsiveContainer>
                    ) : (
                        <div className="h-48 flex items-center justify-center text-muted-foreground text-sm border border-dashed border-border">
                            Add topics & questions to see data
                        </div>
                    )}
                </div>

                <div className="bg-card border border-border p-6">
                    <div className="flex items-center gap-2 mb-1">
                        <div className="w-0.5 h-4 bg-primary" />
                        <h3 className="text-sm font-bold text-foreground">Difficulty Distribution</h3>
                    </div>
                    <p className="text-xs text-muted-foreground mb-5 pl-2.5">Questions by difficulty level</p>
                    {diffChartData.length > 0 ? (
                        <ResponsiveContainer width="100%" height={220}>
                            <PieChart>
                                <Pie data={diffChartData} cx="50%" cy="50%" innerRadius={55} outerRadius={90} paddingAngle={2} dataKey="value">
                                    {diffChartData.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} strokeWidth={0} />)}
                                </Pie>
                                <Legend formatter={v => <span style={{ fontSize: 12, color: 'hsl(var(--foreground))' }}>{v}</span>} />
                                <Tooltip contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 0, fontSize: 12 }} />
                            </PieChart>
                        </ResponsiveContainer>
                    ) : (
                        <div className="h-48 flex items-center justify-center text-muted-foreground text-sm border border-dashed border-border">No questions yet</div>
                    )}
                </div>
            </div>

            <div className="bg-card border border-border">
                <div className="flex items-center justify-between px-6 py-4 border-b border-border">
                    <div className="flex items-center gap-2">
                        <div className="w-0.5 h-4 bg-primary" />
                        <h3 className="text-sm font-bold text-foreground">Topics — Export Q&A PDF</h3>
                    </div>
                    <Link to="/topics"><Button variant="ghost" size="sm" className="text-primary text-xs font-bold h-7 px-3">Manage Topics →</Button></Link>
                </div>
                <div className="divide-y divide-border max-h-80 overflow-y-auto scrollbar-thin">
                    {topics.length === 0 ? (
                        <div className="text-center py-8 text-sm text-muted-foreground">No topics yet.</div>
                    ) : topics.map((t, i) => {
                        const tQs = questions.filter(q => q.topic_id === t.id);
                        const pub = tQs.filter(q => q.status === 'published').length;
                        return (
                            <motion.div key={t.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.03 }}
                                className="flex items-center justify-between px-6 py-3.5 gap-4 hover:bg-muted/20 transition-colors">
                                <div className="flex items-center gap-3 min-w-0 flex-1">
                                    {t.logo_url ? (
                                        <img src={t.logo_url} alt={t.name} className="w-8 h-8 object-cover border border-border flex-shrink-0" />
                                    ) : (
                                        <div className="w-8 h-8 flex items-center justify-center text-white font-black text-sm flex-shrink-0"
                                            style={{ background: t.color || 'hsl(var(--primary))' }}>{t.name?.[0]}</div>
                                    )}
                                    <div className="min-w-0">
                                        <p className="text-sm font-bold text-foreground truncate">{t.name}</p>
                                        <p className="text-xs text-muted-foreground">{tQs.length} total · {pub} published</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2 flex-shrink-0">
                                    <span className={`text-[10px] px-2 py-0.5 font-bold uppercase ${t.is_visible ? 'bg-emerald-500/10 text-emerald-600' : 'bg-muted text-muted-foreground'}`}>
                                        {t.is_visible ? 'Visible' : 'Hidden'}
                                    </span>
                                    <Button size="sm" variant="outline" className="text-xs font-bold h-7 px-3 gap-1.5"
                                        onClick={() => handleExportTopic(t)} disabled={pub === 0}>
                                        <FileText className="w-3.5 h-3.5" /> PDF
                                    </Button>
                                </div>
                            </motion.div>
                        );
                    })}
                </div>
            </div>

            <div className="bg-card border border-border">
                <div className="flex items-center justify-between px-6 py-4 border-b border-border">
                    <div className="flex items-center gap-2">
                        <div className="w-0.5 h-4 bg-primary" />
                        <h3 className="text-sm font-bold text-foreground">Recent Questions</h3>
                    </div>
                    <Link to="/questions"><Button variant="ghost" size="sm" className="text-primary text-xs font-bold h-7 px-3">View All →</Button></Link>
                </div>
                <div className="divide-y divide-border max-h-80 overflow-y-auto scrollbar-thin">
                    {questions.length === 0 ? (
                        <div className="text-center py-10 text-sm text-muted-foreground">
                            No questions yet.{' '}<Link to="/questions" className="text-primary font-semibold hover:underline">Add one →</Link>
                        </div>
                    ) : questions.slice(0, 8).map((q, i) => (
                        <motion.div key={q.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.03 }}
                            className="flex items-center justify-between px-6 py-3 gap-4 hover:bg-muted/20 transition-colors">
                            <div className="flex items-center gap-3 min-w-0 flex-1">
                                <div className="w-0.5 h-8 bg-border flex-shrink-0" />
                                <div className="min-w-0">
                                    <p className="text-sm font-semibold text-foreground truncate">{q.title}</p>
                                    <p className="text-xs text-muted-foreground mt-0.5">{q.topic_name || '—'}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-2 flex-shrink-0">
                                <span className={`text-[10px] px-2 py-0.5 font-bold uppercase ${diffColors[q.difficulty] || ''}`}>{q.difficulty}</span>
                                <span className={`text-[10px] px-2 py-0.5 font-bold uppercase ${q.status === 'published' ? 'bg-emerald-500/10 text-emerald-600' :
                                    q.status === 'draft' ? 'bg-slate-400/10 text-slate-500' :
                                        q.status === 'review' ? 'bg-blue-500/10 text-blue-600' :
                                            'bg-amber-500/10 text-amber-600'}`}>{q.status}</span>
                            </div>
                        </motion.div>
                    ))}
                </div>
            </div>
        </div>
    );
}