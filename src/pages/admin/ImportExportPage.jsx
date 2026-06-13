import React, { useState, useRef } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Topic, Question } from '@/api/entities';
import PageHeader from '@/components/shared/PageHeader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Upload, Download, FileJson, AlertCircle, CheckCircle2, Loader2, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';

const SAMPLE_JSON = [
    {
        topic_name: "Java",
        title: "What is the difference between == and .equals() in Java?",
        description: "Explain with examples when to use each.",
        difficulty: "basic",
        type: "theory",
        experience_level: "fresher",
        answer: "== compares references, .equals() compares content.",
        explanation: "Use == for primitives, .equals() for objects.",
        tags: ["java", "equality"],
        company_tags: ["TCS", "Infosys"],
        status: "published"
    }
];

export default function ImportExportPage() {
    const [exportTopic, setExportTopic] = useState('all');
    const [exportDifficulty, setExportDifficulty] = useState('all');
    const [exportFormat, setExportFormat] = useState('json');
    const [importing, setImporting] = useState(false);
    const [importResults, setImportResults] = useState(null);
    const fileRef = useRef();
    const qc = useQueryClient();

    const { data: topics = [] } = useQuery({
        queryKey: ['topics'],
        queryFn: () => Topic.list(),
    });

    const { data: questions = [] } = useQuery({
        queryKey: ['questions'],
        queryFn: () => Question.list('created_at', false),
    });

    const handleExport = () => {
        let qs = [...questions];
        if (exportTopic !== 'all') qs = qs.filter(q => q.topic_id === exportTopic);
        if (exportDifficulty !== 'all') qs = qs.filter(q => q.difficulty === exportDifficulty);

        const clean = qs.map(({ id, created_at, updated_at, ...rest }) => rest);

        if (exportFormat === 'json') {
            const blob = new Blob([JSON.stringify(clean, null, 2)], { type: 'application/json' });
            downloadBlob(blob, 'questions.json');
        } else if (exportFormat === 'csv') {
            const headers = ['topic_name', 'title', 'description', 'difficulty', 'type', 'experience_level', 'answer', 'explanation', 'tags', 'company_tags', 'status'];
            const rows = clean.map(q => headers.map(h => {
                const v = q[h];
                if (Array.isArray(v)) return `"${v.join('; ')}"`;
                if (typeof v === 'string' && v.includes(',')) return `"${v.replace(/"/g, '""')}"`;
                return v ?? '';
            }).join(','));
            const csv = [headers.join(','), ...rows].join('\n');
            const blob = new Blob([csv], { type: 'text/csv' });
            downloadBlob(blob, 'questions.csv');
        }
        toast.success(`Exported ${clean.length} questions as ${exportFormat.toUpperCase()}`);
    };

    const downloadBlob = (blob, filename) => {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        a.click();
        URL.revokeObjectURL(url);
    };

    const handleFileChange = async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setImporting(true);
        setImportResults(null);

        const text = await file.text();
        let parsed = [];

        try {
            if (file.name.endsWith('.json')) {
                parsed = JSON.parse(text);
                if (!Array.isArray(parsed)) parsed = [parsed];
            } else if (file.name.endsWith('.csv')) {
                const lines = text.split('\n').filter(l => l.trim());
                const headers = lines[0].split(',').map(h => h.trim());
                parsed = lines.slice(1).map(line => {
                    const vals = line.split(',');
                    const obj = {};
                    headers.forEach((h, i) => { obj[h] = vals[i]?.replace(/^"|"$/g, '').trim() || ''; });
                    return obj;
                });
            } else {
                throw new Error('Unsupported file format');
            }
        } catch (err) {
            toast.error('Failed to parse file: ' + err.message);
            setImporting(false);
            return;
        }

        const topicMap = {};
        topics.forEach(t => { topicMap[t.name.toLowerCase()] = t.id; });

        let created = 0, failed = 0, errors = [];

        for (const row of parsed) {
            const topicId = topicMap[row.topic_name?.toLowerCase()] || null;
            if (!topicId) {
                failed++;
                errors.push(`Topic not found: "${row.topic_name}" for question "${row.title}"`);
                continue;
            }
            if (!row.title) {
                failed++;
                errors.push('Missing title for a row');
                continue;
            }
            const payload = {
                topic_id: topicId,
                topic_name: row.topic_name,
                title: row.title,
                description: row.description || '',
                difficulty: ['basic', 'medium', 'experienced'].includes(row.difficulty) ? row.difficulty : 'basic',
                type: ['theory', 'coding', 'scenario', 'interview', 'mcq'].includes(row.type) ? row.type : 'theory',
                experience_level: row.experience_level || 'fresher',
                answer: row.answer || '',
                explanation: row.explanation || '',
                code_snippet: row.code_snippet || '',
                tags: row.tags ? row.tags.split(';').map(t => t.trim()).filter(Boolean) : [],
                company_tags: row.company_tags ? row.company_tags.split(';').map(t => t.trim()).filter(Boolean) : [],
                status: row.status === 'published' ? 'published' : 'draft',
                is_visible: true,
            };
            try {
                await Question.create(payload);
                created++;
            } catch {
                failed++;
                errors.push(`Failed to create: "${row.title}"`);
            }
        }

        setImportResults({ created, failed, total: parsed.length, errors });
        qc.invalidateQueries({ queryKey: ['questions'] });
        setImporting(false);
        if (created > 0) toast.success(`Imported ${created} questions successfully!`);
        e.target.value = '';
    };

    const downloadSample = () => {
        const blob = new Blob([JSON.stringify(SAMPLE_JSON, null, 2)], { type: 'application/json' });
        downloadBlob(blob, 'sample_questions.json');
    };

    return (
        <div className="space-y-8 max-w-3xl">
            <PageHeader title="Import & Export" badge="Data Management" description="Bulk import questions from JSON/CSV or export your question bank" />

            {/* IMPORT */}
            <Card className="rounded-2xl">
                <CardHeader className="pb-2">
                    <CardTitle className="text-base font-semibold flex items-center gap-2">
                        <Upload className="w-4 h-4 text-primary" /> Import Questions
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <p className="text-sm text-muted-foreground">
                        Upload a <strong>JSON</strong> or <strong>CSV</strong> file. Topics must already exist in the system. Unmatched topics will be skipped.
                    </p>

                    <div
                        className="border-2 border-dashed border-border rounded-2xl p-8 text-center hover:border-primary/50 transition-colors cursor-pointer"
                        onClick={() => fileRef.current?.click()}
                    >
                        {importing ? (
                            <div className="flex flex-col items-center gap-2">
                                <Loader2 className="w-8 h-8 text-primary animate-spin" />
                                <p className="text-sm font-medium">Importing questions...</p>
                            </div>
                        ) : (
                            <div className="flex flex-col items-center gap-2">
                                <Upload className="w-8 h-8 text-muted-foreground" />
                                <p className="font-semibold text-sm">Click to upload or drag & drop</p>
                                <p className="text-xs text-muted-foreground">JSON, CSV supported</p>
                            </div>
                        )}
                    </div>
                    <input ref={fileRef} type="file" accept=".json,.csv" className="hidden" onChange={handleFileChange} />

                    <div className="flex items-center gap-3">
                        <Button variant="outline" size="sm" className="rounded-xl" onClick={downloadSample}>
                            <FileJson className="w-4 h-4 mr-2" /> Download Sample JSON
                        </Button>
                    </div>

                    <AnimatePresence>
                        {importResults && (
                            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="rounded-2xl border p-4 space-y-3">
                                <div className="flex items-center gap-3">
                                    {importResults.failed === 0
                                        ? <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                                        : <AlertCircle className="w-5 h-5 text-amber-500" />
                                    }
                                    <div>
                                        <p className="font-semibold text-sm">Import Complete</p>
                                        <p className="text-xs text-muted-foreground">
                                            {importResults.created} imported · {importResults.failed} failed · {importResults.total} total
                                        </p>
                                    </div>
                                    <button onClick={() => setImportResults(null)} className="ml-auto text-muted-foreground hover:text-foreground">
                                        <X className="w-4 h-4" />
                                    </button>
                                </div>
                                {importResults.errors.length > 0 && (
                                    <div className="text-xs space-y-1 max-h-28 overflow-y-auto scrollbar-thin">
                                        {importResults.errors.map((e, i) => (
                                            <div key={i} className="flex items-start gap-1.5 text-amber-600">
                                                <AlertCircle className="w-3 h-3 flex-shrink-0 mt-0.5" />{e}
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </motion.div>
                        )}
                    </AnimatePresence>
                </CardContent>
            </Card>

            {/* EXPORT */}
            <Card className="rounded-2xl">
                <CardHeader className="pb-2">
                    <CardTitle className="text-base font-semibold flex items-center gap-2">
                        <Download className="w-4 h-4 text-emerald-600" /> Export Questions
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid sm:grid-cols-3 gap-4">
                        <div>
                            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1.5 block">Topic</label>
                            <Select value={exportTopic} onValueChange={setExportTopic}>
                                <SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Topics</SelectItem>
                                    {topics.map(t => <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>)}
                                </SelectContent>
                            </Select>
                        </div>
                        <div>
                            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1.5 block">Difficulty</label>
                            <Select value={exportDifficulty} onValueChange={setExportDifficulty}>
                                <SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Difficulties</SelectItem>
                                    <SelectItem value="basic">Basic</SelectItem>
                                    <SelectItem value="medium">Medium</SelectItem>
                                    <SelectItem value="experienced">Experienced</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div>
                            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1.5 block">Format</label>
                            <div className="flex gap-2">
                                {['json', 'csv'].map(f => (
                                    <button key={f} onClick={() => setExportFormat(f)}
                                        className={`flex-1 px-3 py-2 rounded-xl text-sm font-bold border-2 uppercase transition-all ${exportFormat === f ? 'bg-primary text-primary-foreground border-primary' : 'border-border hover:border-primary/40'
                                            }`}>{f}</button>
                                ))}
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center justify-between bg-muted/50 rounded-xl p-4">
                        <div>
                            <p className="text-sm font-medium">
                                {questions.filter(q =>
                                    (exportTopic === 'all' || q.topic_id === exportTopic) &&
                                    (exportDifficulty === 'all' || q.difficulty === exportDifficulty)
                                ).length} questions will be exported
                            </p>
                            <p className="text-xs text-muted-foreground mt-0.5">as {exportFormat.toUpperCase()} file</p>
                        </div>
                        <Button onClick={handleExport} className="rounded-xl">
                            <Download className="w-4 h-4 mr-2" /> Export
                        </Button>
                    </div>
                </CardContent>
            </Card>

            {/* Field Reference */}
            <Card className="rounded-2xl">
                <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-semibold text-muted-foreground">Import Field Reference</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                        {[
                            { field: 'topic_name', req: true, desc: 'Must match existing topic' },
                            { field: 'title', req: true, desc: 'Question title' },
                            { field: 'description', req: false, desc: 'Question body' },
                            { field: 'difficulty', req: false, desc: 'basic / medium / experienced' },
                            { field: 'type', req: false, desc: 'theory / coding / mcq / ...' },
                            { field: 'experience_level', req: false, desc: 'fresher / junior / ...' },
                            { field: 'answer', req: false, desc: 'Model answer' },
                            { field: 'explanation', req: false, desc: 'Detailed explanation' },
                            { field: 'tags', req: false, desc: 'Semicolon-separated' },
                            { field: 'company_tags', req: false, desc: 'Semicolon-separated' },
                            { field: 'code_snippet', req: false, desc: 'Code example' },
                            { field: 'status', req: false, desc: 'published / draft' },
                        ].map(f => (
                            <div key={f.field} className="bg-muted/50 rounded-xl p-2.5">
                                <div className="flex items-center gap-1.5 mb-0.5">
                                    <code className="text-xs font-mono font-bold text-foreground">{f.field}</code>
                                    {f.req && <Badge className="text-[9px] h-4 px-1 rounded-full">Required</Badge>}
                                </div>
                                <p className="text-[11px] text-muted-foreground">{f.desc}</p>
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}