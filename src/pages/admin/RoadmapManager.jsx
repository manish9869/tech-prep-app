import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Topic, RoadmapTopic } from '@/api/entities';
import PageHeader from '@/components/shared/PageHeader';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Plus, Trash2, Pencil, Map, X, Sparkles, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { motion } from 'framer-motion';

const DUMMY_TEMPLATES = {
    java: [
        { phase_name: 'Learn the Basics', phase_order: 0, color: '#f59e0b', left_nodes: ['Basic Syntax', 'Data Types', 'Variables & Scope', 'Type Casting', 'Operators'], right_nodes: ['Strings & Methods', 'Math Operations', 'Arrays', 'Conditionals', 'Loops'] },
        { phase_name: 'Object-Oriented Java', phase_order: 1, color: '#b07219', left_nodes: ['Classes & Objects', 'Constructors', 'Inheritance', 'Polymorphism', 'Abstraction'], right_nodes: ['Interfaces', 'Encapsulation', 'Static & Final', 'Enums', 'Inner Classes'] },
        { phase_name: 'Core Libraries', phase_order: 2, color: '#d97706', left_nodes: ['Collections Framework', 'Generics', 'Exception Handling', 'File I/O', 'Streams API'], right_nodes: ['Lambda Expressions', 'Functional Interfaces', 'Optional', 'Date & Time', 'Regex'] },
        { phase_name: 'Advanced & Interview', phase_order: 3, color: '#ec4899', left_nodes: ['Multithreading', 'Concurrency', 'JVM Internals', 'Memory Management', 'Design Patterns'], right_nodes: ['Spring Boot', 'REST APIs', 'DSA in Java', 'System Design', 'Mock Interviews'] },
    ],
    javascript: [
        { phase_name: 'JS Fundamentals', phase_order: 0, color: '#f7df1e', left_nodes: ['Variables & Scope', 'Data Types', 'Functions', 'Arrays', 'Objects'], right_nodes: ['DOM Manipulation', 'Events', 'ES6 Features', 'Template Literals', 'Destructuring'] },
        { phase_name: 'Async JavaScript', phase_order: 1, color: '#f59e0b', left_nodes: ['Callbacks', 'Promises', 'Async/Await', 'Event Loop', 'Fetch API'], right_nodes: ['Error Handling', 'Modules (ESM)', 'Web APIs', 'Local Storage', 'WebSockets'] },
        { phase_name: 'Frameworks & Tools', phase_order: 2, color: '#61dafb', left_nodes: ['React / Vue / Angular', 'State Management', 'Routing', 'Build Tools (Vite)', 'Testing (Jest)'], right_nodes: ['TypeScript', 'Node.js', 'Express', 'REST + GraphQL', 'Deployment'] },
        { phase_name: 'Interview Ready', phase_order: 3, color: '#8b5cf6', left_nodes: ['Closures & Scope', 'Prototype Chain', 'Event Delegation', 'Performance', 'Security'], right_nodes: ['System Design', 'DSA in JS', 'LeetCode Patterns', 'Mock Interviews', 'Behavioral Round'] },
    ],
    python: [
        { phase_name: 'Python Basics', phase_order: 0, color: '#3572A5', left_nodes: ['Syntax & Indentation', 'Variables & Types', 'String Methods', 'Lists & Tuples', 'Dictionaries'], right_nodes: ['Conditionals', 'Loops', 'Functions', 'File I/O', 'Modules & Packages'] },
        { phase_name: 'OOP & Pythonic', phase_order: 1, color: '#2563eb', left_nodes: ['Classes & Objects', 'Inheritance', 'Magic Methods', 'Decorators', 'Generators'], right_nodes: ['List Comprehensions', 'Context Managers', 'Lambda & Map/Filter', 'Iterators', 'Closures'] },
        { phase_name: 'Ecosystem', phase_order: 2, color: '#059669', left_nodes: ['NumPy & Pandas', 'Requests & APIs', 'Django / Flask', 'SQLAlchemy', 'pytest'], right_nodes: ['Async Python', 'Celery', 'Docker', 'CI/CD', 'Deployment'] },
        { phase_name: 'Interview Ready', phase_order: 3, color: '#ec4899', left_nodes: ['DSA in Python', 'LeetCode Patterns', 'Recursion & DP', 'Sorting Algorithms', 'Trees & Graphs'], right_nodes: ['System Design', 'ML Concepts', 'Mock Interviews', 'Behavioral Round', 'Company Prep'] },
    ],
    react: [
        { phase_name: 'React Core', phase_order: 0, color: '#61dafb', left_nodes: ['JSX & Components', 'Props & State', 'Event Handling', 'Lists & Keys', 'Conditional Rendering'], right_nodes: ['Component Lifecycle', 'useState Hook', 'useEffect Hook', 'useRef Hook', 'Custom Hooks'] },
        { phase_name: 'State & Data', phase_order: 1, color: '#06b6d4', left_nodes: ['Context API', 'useReducer', 'React Query', 'Form Handling', 'File Uploads'], right_nodes: ['Redux / Zustand', 'Memoization', 'useMemo & useCallback', 'Suspense', 'Error Boundaries'] },
        { phase_name: 'Advanced Patterns', phase_order: 2, color: '#6366f1', left_nodes: ['Compound Components', 'Render Props', 'Higher Order Components', 'Portals', 'Lazy Loading'], right_nodes: ['Performance Optimization', 'Code Splitting', 'Accessibility', 'Testing (RTL)', 'TypeScript + React'] },
        { phase_name: 'Ecosystem & Interview', phase_order: 3, color: '#8b5cf6', left_nodes: ['React Router', 'Next.js / Remix', 'Deployment (Vercel)', 'Micro-frontends', 'Design Systems'], right_nodes: ['System Design', 'Component Design', 'Mock Interviews', 'Performance QA', 'Behavioral Round'] },
    ],
    default: [
        { phase_name: 'Fundamentals', phase_order: 0, color: '#6366f1', left_nodes: ['Core Concepts', 'Basic Syntax', 'Data Types', 'Variables', 'Control Flow'], right_nodes: ['Functions', 'Arrays', 'Strings', 'Loops', 'Conditionals'] },
        { phase_name: 'Intermediate', phase_order: 1, color: '#8b5cf6', left_nodes: ['OOP Concepts', 'Error Handling', 'Collections', 'Algorithms', 'Recursion'], right_nodes: ['File I/O', 'APIs', 'Testing', 'Debugging', 'Libraries'] },
        { phase_name: 'Advanced', phase_order: 2, color: '#a855f7', left_nodes: ['Design Patterns', 'Performance', 'Security', 'Architecture', 'Best Practices'], right_nodes: ['CI/CD', 'Docker', 'Cloud', 'Monitoring', 'Documentation'] },
        { phase_name: 'Interview Ready', phase_order: 3, color: '#ec4899', left_nodes: ['DSA', 'System Design', 'LLD', 'Mock Interviews', 'Behavioral'], right_nodes: ['Company Specific', 'LeetCode Top 100', 'Patterns', 'Communication', 'Portfolio'] },
    ],
};

function getTemplate(topicName) {
    const n = (topicName || '').toLowerCase();
    if (n.includes('java') && !n.includes('script')) return DUMMY_TEMPLATES.java;
    if (n.includes('javascript') || n.includes(' js') || n === 'js') return DUMMY_TEMPLATES.javascript;
    if (n.includes('python')) return DUMMY_TEMPLATES.python;
    if (n.includes('react')) return DUMMY_TEMPLATES.react;
    return DUMMY_TEMPLATES.default;
}

const defaultForm = { topic_id: '', phase_name: '', phase_order: 0, left_nodes: [], right_nodes: [], color: '#f59e0b' };

function NodeInput({ label, nodes, onChange }) {
    const [val, setVal] = useState('');
    const add = () => {
        if (!val.trim()) return;
        onChange([...nodes, val.trim()]);
        setVal('');
    };
    return (
        <div>
            <Label className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-2 block">{label}</Label>
            <div className="flex gap-2 mb-2">
                <Input value={val} onChange={e => setVal(e.target.value)} placeholder="Add topic node..." className="h-8 text-xs" onKeyDown={e => e.key === 'Enter' && add()} />
                <Button size="sm" onClick={add} className="h-8 px-3 text-xs">Add</Button>
            </div>
            <div className="flex flex-wrap gap-1.5">
                {nodes.map((n, i) => (
                    <span key={i} className="flex items-center gap-1 bg-amber-500/10 text-amber-700 border border-amber-500/30 px-2 py-0.5 text-xs font-semibold">
                        {n}
                        <button onClick={() => onChange(nodes.filter((_, idx) => idx !== i))} className="hover:text-red-500 ml-0.5">
                            <X className="w-2.5 h-2.5" />
                        </button>
                    </span>
                ))}
                {nodes.length === 0 && <span className="text-xs text-muted-foreground italic">No nodes added yet</span>}
            </div>
        </div>
    );
}

export default function RoadmapManager() {
    const qc = useQueryClient();
    const [dialogOpen, setDialogOpen] = useState(false);
    const [editItem, setEditItem] = useState(null);
    const [form, setForm] = useState(defaultForm);
    const [deleteId, setDeleteId] = useState(null);
    const [filterTopic, setFilterTopic] = useState('all');
    const [seeding, setSeeding] = useState(false);

    const { data: topics = [] } = useQuery({
        queryKey: ['topics'],
        queryFn: () => Topic.list(),
    });

    const { data: roadmapTopics = [], isLoading } = useQuery({
        queryKey: ['roadmap-topics'],
        queryFn: () => RoadmapTopic.list(),
    });

    const createMut = useMutation({
        mutationFn: d => RoadmapTopic.create(d),
        onSuccess: () => { qc.invalidateQueries({ queryKey: ['roadmap-topics'] }); setDialogOpen(false); toast.success('Phase created'); },
    });

    const updateMut = useMutation({
        mutationFn: ({ id, d }) => RoadmapTopic.update(id, d),
        onSuccess: () => { qc.invalidateQueries({ queryKey: ['roadmap-topics'] }); setDialogOpen(false); toast.success('Phase updated'); },
    });

    const deleteMut = useMutation({
        mutationFn: id => RoadmapTopic.delete(id),
        onSuccess: () => { qc.invalidateQueries({ queryKey: ['roadmap-topics'] }); setDeleteId(null); toast.success('Phase deleted'); },
    });

    const openCreate = () => { setEditItem(null); setForm(defaultForm); setDialogOpen(true); };
    const openEdit = (item) => {
        setEditItem(item);
        setForm({
            topic_id: item.topic_id,
            phase_name: item.phase_name,
            phase_order: item.phase_order || 0,
            left_nodes: item.left_nodes || [],
            right_nodes: item.right_nodes || [],
            color: item.color || '#f59e0b',
        });
        setDialogOpen(true);
    };

    const seedDummyData = async (topicId) => {
        const topic = topics.find(t => t.id === topicId);
        if (!topic) return toast.error('Topic not found');
        const existing = roadmapTopics.filter(r => r.topic_id === topicId);
        if (existing.length > 0) return toast.error('This topic already has roadmap phases. Delete them first.');
        setSeeding(true);
        const template = getTemplate(topic.name);
        for (const phase of template) {
            await RoadmapTopic.create({ ...phase, topic_id: topicId });
        }
        qc.invalidateQueries({ queryKey: ['roadmap-topics'] });
        setSeeding(false);
        toast.success(`Seeded ${template.length} phases for "${topic.name}"`);
    };

    const handleSave = () => {
        if (!form.topic_id) return toast.error('Select a topic');
        if (!form.phase_name.trim()) return toast.error('Phase name is required');
        const d = { ...form, phase_order: Number(form.phase_order) };
        if (editItem) updateMut.mutate({ id: editItem.id, d });
        else createMut.mutate(d);
    };

    const filtered = filterTopic === 'all' ? roadmapTopics : roadmapTopics.filter(r => r.topic_id === filterTopic);
    const topicName = id => topics.find(t => t.id === id)?.name || id;
    const topicColor = id => topics.find(t => t.id === id)?.color || '#6366f1';
    const topicLogo = id => topics.find(t => t.id === id)?.logo_url;

    const grouped = {};
    filtered.forEach(r => {
        if (!grouped[r.topic_id]) grouped[r.topic_id] = [];
        grouped[r.topic_id].push(r);
    });
    Object.keys(grouped).forEach(k => grouped[k].sort((a, b) => (a.phase_order || 0) - (b.phase_order || 0)));

    return (
        <div className="space-y-6">
            <PageHeader
                title="Roadmap Manager"
                badge="Admin"
                description="Define learning phases for each technology topic — shown visually to viewers"
                actions={<Button onClick={openCreate}><Plus className="w-4 h-4 mr-1.5" />Add Phase</Button>}
            />

            <div className="flex items-center gap-3 flex-wrap">
                <Select value={filterTopic} onValueChange={setFilterTopic}>
                    <SelectTrigger className="w-[200px]"><SelectValue placeholder="All Topics" /></SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All Topics</SelectItem>
                        {topics.map(t => <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>)}
                    </SelectContent>
                </Select>
                <span className="text-xs text-muted-foreground">{filtered.length} phases</span>
                {filterTopic !== 'all' && (
                    <Button
                        variant="outline"
                        size="sm"
                        className="h-8 text-xs border-amber-500/40 text-amber-600 hover:bg-amber-500/10"
                        disabled={seeding}
                        onClick={() => seedDummyData(filterTopic)}
                    >
                        {seeding ? <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5 mr-1.5" />}
                        Seed Dummy Data
                    </Button>
                )}
            </div>

            {isLoading ? (
                <div className="space-y-4">
                    {Array(3).fill(0).map((_, i) => <div key={i} className="h-24 bg-muted animate-pulse" />)}
                </div>
            ) : Object.keys(grouped).length === 0 ? (
                <div className="text-center py-16 border border-dashed border-border">
                    <Map className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
                    <p className="font-black text-foreground">No roadmap phases yet</p>
                    <p className="text-xs text-muted-foreground mt-1 mb-4">Add phases to build roadmaps for each topic</p>
                    <Button onClick={openCreate}><Plus className="w-4 h-4 mr-1.5" />Add First Phase</Button>
                </div>
            ) : (
                <div className="space-y-8">
                    {Object.entries(grouped).map(([topicId, phases]) => (
                        <div key={topicId}>
                            <div className="flex items-center gap-3 mb-3 pb-2 border-b border-border">
                                {topicLogo(topicId) ? (
                                    <img src={topicLogo(topicId)} alt="" className="w-7 h-7 object-contain" />
                                ) : (
                                    <div className="w-7 h-7 flex items-center justify-center text-white text-xs font-black" style={{ background: topicColor(topicId) }}>
                                        {topicName(topicId)?.[0]}
                                    </div>
                                )}
                                <h3 className="font-black text-base">{topicName(topicId)}</h3>
                                <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground bg-muted px-2 py-0.5">
                                    {phases.length} phases
                                </span>
                            </div>

                            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
                                {phases.map((phase, i) => (
                                    <motion.div key={phase.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
                                        <div className="bg-card border border-border hover:border-primary/40 transition-all overflow-hidden">
                                            <div className="h-1 w-full" style={{ background: phase.color || '#f59e0b' }} />
                                            <div className="p-4">
                                                <div className="flex items-start justify-between gap-2 mb-3">
                                                    <div>
                                                        <div className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-0.5">
                                                            Phase {(phase.phase_order || 0) + 1}
                                                        </div>
                                                        <h4 className="font-black text-sm text-foreground">{phase.phase_name}</h4>
                                                    </div>
                                                    <div className="flex gap-1 flex-shrink-0">
                                                        <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => openEdit(phase)}>
                                                            <Pencil className="w-3 h-3" />
                                                        </Button>
                                                        <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive" onClick={() => setDeleteId(phase.id)}>
                                                            <Trash2 className="w-3 h-3" />
                                                        </Button>
                                                    </div>
                                                </div>

                                                <div className="grid grid-cols-2 gap-2">
                                                    <div>
                                                        <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground mb-1">
                                                            Left ({(phase.left_nodes || []).length})
                                                        </p>
                                                        <div className="space-y-1">
                                                            {(phase.left_nodes || []).slice(0, 3).map((n, ni) => (
                                                                <div key={ni} className="text-[10px] px-2 py-0.5 bg-muted text-muted-foreground truncate">{n}</div>
                                                            ))}
                                                            {(phase.left_nodes || []).length > 3 && (
                                                                <div className="text-[10px] text-muted-foreground">+{phase.left_nodes.length - 3} more</div>
                                                            )}
                                                        </div>
                                                    </div>
                                                    <div>
                                                        <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground mb-1">
                                                            Right ({(phase.right_nodes || []).length})
                                                        </p>
                                                        <div className="space-y-1">
                                                            {(phase.right_nodes || []).slice(0, 3).map((n, ni) => (
                                                                <div key={ni} className="text-[10px] px-2 py-0.5 bg-muted text-muted-foreground truncate">{n}</div>
                                                            ))}
                                                            {(phase.right_nodes || []).length > 3 && (
                                                                <div className="text-[10px] text-muted-foreground">+{phase.right_nodes.length - 3} more</div>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </motion.div>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            )}

            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle className="font-black">{editItem ? 'Edit Phase' : 'Add Roadmap Phase'}</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-5">
                        <div>
                            <Label className="text-xs font-black uppercase tracking-widest text-muted-foreground">Topic *</Label>
                            <Select value={form.topic_id} onValueChange={v => setForm(f => ({ ...f, topic_id: v }))}>
                                <SelectTrigger className="mt-1"><SelectValue placeholder="Select topic..." /></SelectTrigger>
                                <SelectContent>
                                    {topics.map(t => <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>)}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <Label className="text-xs font-black uppercase tracking-widest text-muted-foreground">Phase Name *</Label>
                                <Input value={form.phase_name} onChange={e => setForm(f => ({ ...f, phase_name: e.target.value }))} placeholder="e.g. Learn the Basics" className="mt-1" />
                            </div>
                            <div>
                                <Label className="text-xs font-black uppercase tracking-widest text-muted-foreground">Order (0 = first)</Label>
                                <Input type="number" value={form.phase_order} onChange={e => setForm(f => ({ ...f, phase_order: e.target.value }))} className="mt-1" min={0} />
                            </div>
                        </div>
                        <div>
                            <Label className="text-xs font-black uppercase tracking-widest text-muted-foreground">Phase Color</Label>
                            <Input type="color" value={form.color} onChange={e => setForm(f => ({ ...f, color: e.target.value }))} className="mt-1 h-10 w-20" />
                        </div>
                        <NodeInput label="Left Nodes" nodes={form.left_nodes} onChange={v => setForm(f => ({ ...f, left_nodes: v }))} />
                        <NodeInput label="Right Nodes" nodes={form.right_nodes} onChange={v => setForm(f => ({ ...f, right_nodes: v }))} />
                    </div>
                    <DialogFooter className="mt-2">
                        <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
                        <Button onClick={handleSave} disabled={createMut.isPending || updateMut.isPending}>
                            {createMut.isPending || updateMut.isPending ? 'Saving...' : 'Save Phase'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Delete Phase?</AlertDialogTitle>
                        <AlertDialogDescription>This roadmap phase will be removed. This cannot be undone.</AlertDialogDescription>
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