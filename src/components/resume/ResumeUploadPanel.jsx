import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Upload, CheckCircle2, X, Sparkles, Loader2, ChevronDown } from 'lucide-react';
import { toast } from 'sonner';
import { useQuery } from '@tanstack/react-query';
import { Topic, ResumeAnalysis } from '@/api/entities';
import { supabase } from '@/api/supabaseClient';
import { invokeLLM } from '@/api/llm';
import * as pdfjsLib from 'pdfjs-dist';
import pdfjsWorker from 'pdfjs-dist/build/pdf.worker.min.mjs?url';
import mammoth from 'mammoth';

pdfjsLib.GlobalWorkerOptions.workerSrc = pdfjsWorker;

const EXPERIENCE_LEVELS = [
    { value: 'fresher', label: 'Fresher (0–1 years)', emoji: '🌱' },
    { value: 'junior', label: 'Junior (1–3 years)', emoji: '🚀' },
    { value: 'mid_level', label: 'Mid-Level (3–6 years)', emoji: '⚡' },
    { value: 'senior', label: 'Senior (6–10 years)', emoji: '🏆' },
    { value: 'lead', label: 'Lead / Architect (10+ years)', emoji: '👑' },
];

const INTERVIEW_TYPES = [
    { value: 'frontend', label: 'Frontend Engineer' },
    { value: 'backend', label: 'Backend Engineer' },
    { value: 'fullstack', label: 'Full Stack Engineer' },
    { value: 'devops', label: 'DevOps / Cloud Engineer' },
    { value: 'data', label: 'Data Engineer / Scientist' },
    { value: 'mobile', label: 'Mobile Developer' },
    { value: 'general', label: 'General Software Engineer' },
];

const FOCUS_AREAS = [
    { value: 'ats_optimization', label: 'ATS Optimization', icon: '📊' },
    { value: 'keyword_gaps', label: 'Keyword Gap Analysis', icon: '🔍' },
    { value: 'interview_prep', label: 'Interview Preparation', icon: '🎯' },
    { value: 'resume_rewrite', label: 'Resume Rewrite Tips', icon: '✍️' },
    { value: 'salary_insights', label: 'Salary Benchmarks', icon: '💰' },
];

async function uploadFileToSupabase(file) {
    const ext = file.name.split('.').pop();
    const path = `resumes/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
    const { error } = await supabase.storage.from('uploads').upload(path, file);
    if (error) throw error;
    const { data } = supabase.storage.from('uploads').getPublicUrl(path);
    return data.publicUrl;
}

// ── Extract plain text from PDF / DOCX / DOC / TXT ────────────────────────────
async function extractTextFromFile(file) {
    const ext = file.name.split('.').pop().toLowerCase();

    if (ext === 'txt') {
        return await file.text();
    }

    if (ext === 'pdf') {
        const arrayBuffer = await file.arrayBuffer();
        const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
        let text = '';
        for (let i = 1; i <= pdf.numPages; i++) {
            const page = await pdf.getPage(i);
            const content = await page.getTextContent();
            text += content.items.map(item => item.str).join(' ') + '\n';
        }
        return text;
    }

    if (ext === 'docx') {
        const arrayBuffer = await file.arrayBuffer();
        const result = await mammoth.extractRawText({ arrayBuffer });
        return result.value;
    }

    if (ext === 'doc') {
        // mammoth doesn't support legacy .doc; best-effort fallback
        throw new Error('Legacy .doc files are not supported for text extraction. Please upload PDF, DOCX, or TXT.');
    }

    throw new Error('Unsupported file type');
}

export default function ResumeUploadPanel({ user, onComplete, analyzing, setAnalyzing }) {
    const [file, setFile] = useState(null);
    const [jdText, setJdText] = useState('');
    const [targetRole, setTargetRole] = useState('');
    const [experienceLevel, setExperienceLevel] = useState('junior');
    const [interviewType, setInterviewType] = useState('fullstack');
    const [focusAreas, setFocusAreas] = useState(['ats_optimization', 'interview_prep']);
    const [questionCount, setQuestionCount] = useState(15);
    const [dragOver, setDragOver] = useState(false);
    const fileRef = useRef();

    const { data: topics = [] } = useQuery({
        queryKey: ['topics'],
        queryFn: () => Topic.list(),
    });

    const handleFile = (f) => {
        if (!f) return;
        if (!f.name.match(/\.(pdf|doc|docx|txt)$/i)) {
            toast.error('Please upload a PDF, DOC, DOCX, or TXT file');
            return;
        }
        setFile(f);
    };

    const toggleFocus = (val) => {
        setFocusAreas(prev => prev.includes(val) ? prev.filter(x => x !== val) : [...prev, val]);
    };

    const handleAnalyze = async () => {
        if (!file) { toast.error('Please upload a resume file first'); return; }
        if (focusAreas.length === 0) { toast.error('Select at least one focus area'); return; }
        setAnalyzing(true);

        try {
            // Extract resume text and upload file in parallel
            const [resumeText, file_url] = await Promise.all([
                extractTextFromFile(file),
                uploadFileToSupabase(file),
            ]);

            if (!resumeText || resumeText.trim().length < 50) {
                throw new Error('Could not extract readable text from this file. Try a different file.');
            }

            // Truncate to keep prompt within token limits
            const truncatedResumeText = resumeText.slice(0, 8000);

            const expInfo = EXPERIENCE_LEVELS.find(e => e.value === experienceLevel);
            const typeInfo = INTERVIEW_TYPES.find(t => t.value === interviewType);
            const focusLabels = focusAreas.map(f => FOCUS_AREAS.find(x => x.value === f)?.label).join(', ');

            const prompt = `You are a world-class ATS resume analyzer, technical recruiter, and career coach. Analyze this resume with precision.

ANALYSIS CONFIGURATION:
- Experience Level: ${expInfo?.label}
- Interview Type: ${typeInfo?.label}
- Target Role: ${targetRole || 'Not specified — infer from resume'}
- Focus Areas: ${focusLabels}
- Questions to generate: ${questionCount}
${jdText ? `\nJOB DESCRIPTION TO MATCH AGAINST:\n${jdText}` : ''}

RESUME CONTENT:
${truncatedResumeText}

Return a JSON object with exactly these fields:
{
  "skills": ["skill1", "skill2"],
  "experience_years": 3,
  "education": "B.Tech Computer Science, XYZ University, 2020",
  "projects": ["Project 1 - description", "Project 2 - description"],
  "strengths": ["strength 1", "strength 2", "strength 3", "strength 4", "strength 5"],
  "improvements": ["improvement 1", "improvement 2", "improvement 3", "improvement 4", "improvement 5"],
  "ai_summary": "3-sentence professional narrative about the candidate",
  "ats_score": 72,
  "jd_match_score": 65,
  "matched_keywords": ["keyword1", "keyword2"],
  "missing_keywords": ["keyword3", "keyword4"],
  "generated_questions": [
    {
      "question": "question text",
      "category": "technical",
      "difficulty": "intermediate",
      "answer": "detailed model answer"
    }
  ]
}`;

            const result = await invokeLLM({
                prompt,
                response_json_schema: {
                    skills: ["string"],
                    experience_years: "number",
                    education: "string",
                    projects: ["string"],
                    strengths: ["string"],
                    improvements: ["string"],
                    ai_summary: "string",
                    ats_score: "number",
                    jd_match_score: "number",
                    matched_keywords: ["string"],
                    missing_keywords: ["string"],
                    generated_questions: [
                        {
                            question: "string",
                            category: "string",
                            difficulty: "string",
                            answer: "string"
                        }
                    ]
                }
            });

            if (!result || !result.skills) {
                throw new Error('AI returned no usable data. Please try again.');
            }

            const analysis = {
                ...result,
                file_name: file.name,
                file_url,
                jd_text: jdText,
                target_role: targetRole,
                experience_level: experienceLevel,
                interview_type: interviewType,
                focus_areas: focusAreas,
            };

            if (user) {
                await ResumeAnalysis.create({
                    user_id: user.id,
                    file_name: file.name,
                    file_url,
                    jd_text: jdText,
                    target_role: targetRole,
                    status: 'complete',
                    ...result,
                });
            }

            onComplete(analysis);
            toast.success('Resume analyzed! Scroll through your results.');
        } catch (err) {
            toast.error('Analysis failed: ' + err.message);
        } finally {
            setAnalyzing(false);
        }
    };

    return (
        <div className="space-y-6">
            <div className="grid lg:grid-cols-2 gap-6">
                <div className="space-y-4">
                    <div>
                        <h2 className="text-sm font-black uppercase tracking-widest text-foreground mb-1">1. Upload Resume</h2>
                        <p className="text-xs text-muted-foreground">PDF, DOC, DOCX, or TXT — max 10MB</p>
                    </div>
                    <div
                        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                        onDragLeave={() => setDragOver(false)}
                        onDrop={(e) => { e.preventDefault(); setDragOver(false); handleFile(e.dataTransfer.files[0]); }}
                        onClick={() => !file && fileRef.current?.click()}
                        className={`relative border-2 border-dashed transition-all cursor-pointer flex flex-col items-center justify-center p-8 text-center min-h-[160px] ${dragOver ? 'border-primary bg-primary/5' : file ? 'border-emerald-500/50 bg-emerald-500/5 cursor-default' : 'border-border hover:border-primary/40 hover:bg-muted/30'
                            }`}
                    >
                        {file ? (
                            <div className="flex flex-col items-center gap-3">
                                <CheckCircle2 className="w-10 h-10 text-emerald-500" />
                                <div>
                                    <p className="font-bold text-sm text-foreground">{file.name}</p>
                                    <p className="text-xs text-muted-foreground mt-0.5">{(file.size / 1024).toFixed(1)} KB</p>
                                </div>
                                <button onClick={(e) => { e.stopPropagation(); setFile(null); }} className="text-xs text-red-500 hover:underline flex items-center gap-1">
                                    <X className="w-3 h-3" /> Remove
                                </button>
                            </div>
                        ) : (
                            <>
                                <Upload className="w-10 h-10 text-muted-foreground mb-3" />
                                <p className="font-bold text-sm">Drop your resume here</p>
                                <p className="text-xs text-muted-foreground mt-1">or click to browse</p>
                            </>
                        )}
                    </div>
                    <input ref={fileRef} type="file" accept=".pdf,.doc,.docx,.txt" className="hidden" onChange={(e) => handleFile(e.target.files?.[0])} />

                    <div>
                        <label className="text-xs font-black uppercase tracking-widest text-muted-foreground block mb-1.5">Target Job Role</label>
                        <input type="text" value={targetRole} onChange={(e) => setTargetRole(e.target.value)}
                            placeholder="e.g. Senior Full Stack Engineer, DevOps Lead"
                            className="w-full px-3 py-2 text-sm border border-border bg-background focus:outline-none focus:ring-1 focus:ring-primary" />
                    </div>
                </div>

                <div className="space-y-4">
                    <div>
                        <h2 className="text-sm font-black uppercase tracking-widest text-foreground mb-1">2. Job Description (Optional)</h2>
                        <p className="text-xs text-muted-foreground">Enables ATS match score and keyword gap analysis</p>
                    </div>
                    <Textarea value={jdText} onChange={(e) => setJdText(e.target.value)}
                        placeholder="Paste the full job description here for precise ATS matching, keyword gap analysis, and tailored interview questions..."
                        className="min-h-[200px] text-sm resize-none" />
                    {jdText && (
                        <div className="flex items-center gap-2 text-xs text-emerald-600">
                            <CheckCircle2 className="w-3.5 h-3.5" /> JD detected — keyword matching enabled
                        </div>
                    )}
                </div>
            </div>

            <div className="border border-border p-5 space-y-5 bg-muted/20">
                <h2 className="text-sm font-black uppercase tracking-widest text-foreground">3. Customize Analysis</h2>
                <div className="grid sm:grid-cols-3 gap-4">
                    <div>
                        <label className="text-xs font-black uppercase tracking-widest text-muted-foreground block mb-2">Experience Level</label>
                        <div className="relative">
                            <select value={experienceLevel} onChange={(e) => setExperienceLevel(e.target.value)}
                                className="w-full px-3 py-2 text-sm border border-border bg-background focus:outline-none focus:ring-1 focus:ring-primary appearance-none pr-8">
                                {EXPERIENCE_LEVELS.map(e => <option key={e.value} value={e.value}>{e.emoji} {e.label}</option>)}
                            </select>
                            <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                        </div>
                    </div>

                    <div>
                        <label className="text-xs font-black uppercase tracking-widest text-muted-foreground block mb-2">Interview Type</label>
                        <div className="relative">
                            <select value={interviewType} onChange={(e) => setInterviewType(e.target.value)}
                                className="w-full px-3 py-2 text-sm border border-border bg-background focus:outline-none focus:ring-1 focus:ring-primary appearance-none pr-8">
                                {INTERVIEW_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                            </select>
                            <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                        </div>
                    </div>

                    <div>
                        <label className="text-xs font-black uppercase tracking-widest text-muted-foreground block mb-2">Questions to Generate</label>
                        <div className="flex gap-1.5 flex-wrap">
                            {[10, 15, 20, 25].map(n => (
                                <button key={n} onClick={() => setQuestionCount(n)}
                                    className={`px-3 py-2 text-sm font-bold border transition-colors ${questionCount === n ? 'bg-primary text-primary-foreground border-primary' : 'border-border hover:border-primary/40'
                                        }`}>{n}</button>
                            ))}
                        </div>
                    </div>
                </div>

                <div>
                    <label className="text-xs font-black uppercase tracking-widest text-muted-foreground block mb-2">Focus Areas (select multiple)</label>
                    <div className="flex flex-wrap gap-2">
                        {FOCUS_AREAS.map(f => (
                            <button key={f.value} onClick={() => toggleFocus(f.value)}
                                className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold border transition-colors ${focusAreas.includes(f.value)
                                    ? 'bg-primary text-primary-foreground border-primary'
                                    : 'border-border text-muted-foreground hover:border-primary/40 hover:text-foreground'
                                    }`}>
                                <span>{f.icon}</span> {f.label}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            <Button onClick={handleAnalyze} disabled={!file || analyzing} className="w-full h-12 text-sm font-black uppercase tracking-widest gap-3" size="lg">
                {analyzing
                    ? <><Loader2 className="w-4 h-4 animate-spin" /> Analyzing with AI...</>
                    : <><Sparkles className="w-4 h-4" /> Analyze Resume ({questionCount} Questions, {focusAreas.length} Focus Areas)</>
                }
            </Button>
            {analyzing && (
                <div className="space-y-1.5 text-center">
                    <p className="text-xs text-muted-foreground animate-pulse">Extracting skills · Scoring ATS compatibility · Generating personalized questions...</p>
                    <p className="text-[10px] text-muted-foreground">This takes ~15–20 seconds</p>
                </div>
            )}
        </div>
    );
}