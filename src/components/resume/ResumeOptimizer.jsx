import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Sparkles, Download, Loader2, Copy, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';

async function invokeLLMJSON(prompt) {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            model: 'claude-sonnet-4-6',
            max_tokens: 1000,
            messages: [{
                role: 'user',
                content: prompt + '\n\nRespond ONLY with a valid JSON object. No markdown, no backticks, no explanation.',
            }],
        }),
    });
    const data = await response.json();
    const text = data.content?.[0]?.text ?? '{}';
    return JSON.parse(text);
}

export default function ResumeOptimizer({ analysis, setAnalysis }) {
    const [optimizing, setOptimizing] = useState(false);
    const [copied, setCopied] = useState(false);

    const handleOptimize = async () => {
        setOptimizing(true);
        try {
            const prompt = `You are an expert ATS resume writer and career coach.

Original resume file: ${analysis.file_name}
Target role: ${analysis.target_role || 'Software Engineer'}
${analysis.jd_text ? `Job Description:\n${analysis.jd_text}` : ''}

Based on the analysis:
- ATS Score: ${analysis.ats_score}/100
- Missing keywords: ${analysis.missing_keywords?.join(', ') || 'none'}
- Improvements needed: ${analysis.improvements?.join('; ') || 'none'}
- Detected skills: ${analysis.skills?.join(', ') || 'none'}

Generate a fully optimized, ATS-friendly resume in clean text format. Include:
1. Professional Summary (2-3 strong sentences with target role keywords)
2. Skills section (organized by category, include missing keywords where applicable)
3. Experience section (use STAR method, strong action verbs, quantified achievements)
4. Projects section (include technical stack, impact metrics)
5. Education section
6. Certifications (if mentioned in original)

Return a JSON object with exactly these fields:
{
  "optimized_resume": "full resume text here",
  "changes_made": ["change 1", "change 2"],
  "new_ats_score": 85
}`;

            const result = await invokeLLMJSON(prompt);
            setAnalysis(prev => ({
                ...prev,
                optimized_resume: result.optimized_resume,
                new_ats_score: result.new_ats_score,
                changes_made: result.changes_made,
            }));
            toast.success('Resume optimized! ATS score improved.');
        } catch (err) {
            toast.error('Optimization failed: ' + err.message);
        } finally {
            setOptimizing(false);
        }
    };

    const handleCopy = () => {
        navigator.clipboard.writeText(analysis.optimized_resume);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
        toast.success('Copied to clipboard!');
    };

    const handleDownload = (format) => {
        const blob = new Blob([analysis.optimized_resume], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `optimized_resume.${format}`;
        a.click();
        URL.revokeObjectURL(url);
        toast.success(`Downloaded as ${format.toUpperCase()}`);
    };

    return (
        <div className="space-y-6">
            {!analysis.optimized_resume ? (
                <div className="glass border border-border p-10 text-center space-y-4">
                    <Sparkles className="w-12 h-12 text-primary mx-auto" />
                    <div>
                        <h3 className="text-lg font-black text-foreground">AI Resume Optimizer</h3>
                        <p className="text-sm text-muted-foreground mt-2 max-w-md mx-auto">
                            Our AI will rewrite your resume to maximize ATS compatibility, incorporate missing keywords, and strengthen your impact statements.
                        </p>
                    </div>
                    {analysis.improvements?.length > 0 && (
                        <div className="text-left max-w-md mx-auto space-y-1.5">
                            <p className="text-xs font-black uppercase tracking-widest text-muted-foreground">Will address:</p>
                            {analysis.improvements.slice(0, 4).map((imp, i) => (
                                <div key={i} className="flex items-start gap-2 text-xs text-foreground">
                                    <CheckCircle2 className="w-3.5 h-3.5 text-primary mt-0.5 flex-shrink-0" />{imp}
                                </div>
                            ))}
                        </div>
                    )}
                    <Button onClick={handleOptimize} disabled={optimizing} className="gap-2 font-black uppercase tracking-widest" size="lg">
                        {optimizing ? <><Loader2 className="w-4 h-4 animate-spin" /> Optimizing...</> : <><Sparkles className="w-4 h-4" /> Optimize Resume</>}
                    </Button>
                </div>
            ) : (
                <div className="space-y-4">
                    {analysis.new_ats_score && (
                        <div className="flex items-center gap-4 p-4 glass border border-emerald-500/20">
                            <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                            <div>
                                <p className="text-sm font-black text-foreground">ATS Score Improved</p>
                                <p className="text-xs text-muted-foreground">
                                    {analysis.ats_score} → <span className="text-emerald-500 font-black">{analysis.new_ats_score}</span> (+{analysis.new_ats_score - analysis.ats_score} pts)
                                </p>
                            </div>
                        </div>
                    )}

                    {analysis.changes_made?.length > 0 && (
                        <div className="glass border border-border p-4">
                            <p className="text-xs font-black uppercase tracking-widest text-muted-foreground mb-2">Changes Made</p>
                            <div className="space-y-1">
                                {analysis.changes_made.map((c, i) => (
                                    <div key={i} className="flex items-start gap-2 text-xs text-foreground">
                                        <span className="text-emerald-500 font-black">+</span>{c}
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    <div className="glass border border-border">
                        <div className="flex items-center justify-between p-3 border-b border-border">
                            <span className="text-xs font-black uppercase tracking-widest text-muted-foreground">Optimized Resume</span>
                            <div className="flex items-center gap-2">
                                <Button size="sm" variant="ghost" onClick={handleCopy} className="h-7 gap-1.5 text-xs">
                                    {copied ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                                    {copied ? 'Copied!' : 'Copy'}
                                </Button>
                                <Button size="sm" variant="outline" onClick={() => handleDownload('txt')} className="h-7 gap-1.5 text-xs">
                                    <Download className="w-3.5 h-3.5" /> TXT
                                </Button>
                            </div>
                        </div>
                        <pre className="p-5 text-xs text-foreground leading-relaxed whitespace-pre-wrap font-mono max-h-[500px] overflow-y-auto scrollbar-thin">
                            {analysis.optimized_resume}
                        </pre>
                    </div>

                    <Button variant="outline" size="sm" onClick={handleOptimize} disabled={optimizing} className="gap-2">
                        {optimizing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
                        Re-optimize
                    </Button>
                </div>
            )}
        </div>
    );
}