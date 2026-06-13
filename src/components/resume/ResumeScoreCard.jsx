import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, XCircle, AlertTriangle, TrendingUp, RefreshCw, User, Briefcase, Code2, Star } from 'lucide-react';

function ScoreRing({ score, label, color }) {
    const radius = 36;
    const circ = 2 * Math.PI * radius;
    const offset = circ - (score / 100) * circ;
    return (
        <div className="flex flex-col items-center gap-2">
            <div className="relative w-24 h-24">
                <svg className="w-24 h-24 -rotate-90" viewBox="0 0 96 96">
                    <circle cx="48" cy="48" r={radius} fill="none" stroke="hsl(var(--border))" strokeWidth="8" />
                    <circle
                        cx="48" cy="48" r={radius} fill="none"
                        stroke={color} strokeWidth="8"
                        strokeDasharray={circ} strokeDashoffset={offset}
                        strokeLinecap="square"
                        style={{ transition: 'stroke-dashoffset 1s ease' }}
                    />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-2xl font-black text-foreground">{score}</span>
                </div>
            </div>
            <span className="text-xs font-black uppercase tracking-widest text-muted-foreground">{label}</span>
        </div>
    );
}

export default function ResumeScoreCard({ analysis, onRefresh }) {
    const atsColor = analysis.ats_score >= 80 ? '#10b981' : analysis.ats_score >= 60 ? '#f59e0b' : '#ef4444';
    const jdColor = analysis.jd_match_score >= 80 ? '#10b981' : analysis.jd_match_score >= 60 ? '#f59e0b' : '#ef4444';

    return (
        <div className="space-y-6">
            {/* Score Cards */}
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* ATS Score */}
                <div className="glass border border-border p-6 flex flex-col items-center gap-3">
                    <ScoreRing score={analysis.ats_score} label="ATS Score" color={atsColor} />
                    <p className="text-xs text-center text-muted-foreground">
                        {analysis.ats_score >= 80 ? 'Excellent ATS compatibility' : analysis.ats_score >= 60 ? 'Good but improvable' : 'Needs significant improvements'}
                    </p>
                </div>

                {/* JD Match */}
                <div className="glass border border-border p-6 flex flex-col items-center gap-3">
                    <ScoreRing score={analysis.jd_match_score || 0} label="JD Match" color={jdColor} />
                    <p className="text-xs text-center text-muted-foreground">
                        {analysis.jd_text ? 'Based on provided JD' : 'No JD provided'}
                    </p>
                </div>

                {/* Experience */}
                <div className="glass border border-border p-6 flex flex-col items-center justify-center gap-2 text-center">
                    <Briefcase className="w-8 h-8 text-primary" />
                    <div className="text-3xl font-black text-foreground">{analysis.experience_years || 0}</div>
                    <span className="text-xs font-black uppercase tracking-widest text-muted-foreground">Years Exp.</span>
                    {analysis.education && <p className="text-[10px] text-muted-foreground mt-1">{analysis.education}</p>}
                </div>

                {/* Skills Count */}
                <div className="glass border border-border p-6 flex flex-col items-center justify-center gap-2 text-center">
                    <Code2 className="w-8 h-8 text-violet-500" />
                    <div className="text-3xl font-black text-foreground">{analysis.skills?.length || 0}</div>
                    <span className="text-xs font-black uppercase tracking-widest text-muted-foreground">Skills Found</span>
                    <p className="text-[10px] text-muted-foreground mt-1">{analysis.projects?.length || 0} projects detected</p>
                </div>
            </div>

            {/* AI Summary */}
            {analysis.ai_summary && (
                <div className="glass border border-border p-5">
                    <div className="flex items-center gap-2 mb-3">
                        <User className="w-4 h-4 text-primary" />
                        <span className="text-xs font-black uppercase tracking-widest text-muted-foreground">AI Career Profile</span>
                    </div>
                    <p className="text-sm text-foreground leading-relaxed">{analysis.ai_summary}</p>
                    {analysis.target_role && (
                        <div className="mt-3 flex items-center gap-2">
                            <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Target Role:</span>
                            <Badge variant="outline" className="text-xs">{analysis.target_role}</Badge>
                        </div>
                    )}
                </div>
            )}

            {/* Skills */}
            {analysis.skills?.length > 0 && (
                <div className="glass border border-border p-5">
                    <p className="text-xs font-black uppercase tracking-widest text-muted-foreground mb-3">Detected Skills</p>
                    <div className="flex flex-wrap gap-2">
                        {analysis.skills.map((s, i) => (
                            <span key={i} className="text-xs px-2.5 py-1 bg-primary/10 text-primary border border-primary/20 font-semibold">{s}</span>
                        ))}
                    </div>
                </div>
            )}

            {/* Strengths & Improvements */}
            <div className="grid sm:grid-cols-2 gap-4">
                <div className="glass border border-emerald-500/20 p-5">
                    <div className="flex items-center gap-2 mb-3">
                        <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                        <span className="text-xs font-black uppercase tracking-widest text-emerald-600">Strengths</span>
                    </div>
                    <ul className="space-y-2">
                        {analysis.strengths?.map((s, i) => (
                            <li key={i} className="text-xs text-foreground flex items-start gap-2">
                                <Star className="w-3 h-3 text-emerald-500 mt-0.5 flex-shrink-0" />{s}
                            </li>
                        ))}
                    </ul>
                </div>

                <div className="glass border border-amber-500/20 p-5">
                    <div className="flex items-center gap-2 mb-3">
                        <AlertTriangle className="w-4 h-4 text-amber-500" />
                        <span className="text-xs font-black uppercase tracking-widest text-amber-600">Improvements</span>
                    </div>
                    <ul className="space-y-2">
                        {analysis.improvements?.map((s, i) => (
                            <li key={i} className="text-xs text-foreground flex items-start gap-2">
                                <TrendingUp className="w-3 h-3 text-amber-500 mt-0.5 flex-shrink-0" />{s}
                            </li>
                        ))}
                    </ul>
                </div>
            </div>

            {/* Keyword Analysis */}
            {analysis.jd_text && (
                <div className="grid sm:grid-cols-2 gap-4">
                    {analysis.matched_keywords?.length > 0 && (
                        <div className="glass border border-border p-5">
                            <p className="text-xs font-black uppercase tracking-widest text-muted-foreground mb-3">✅ Matched Keywords</p>
                            <div className="flex flex-wrap gap-1.5">
                                {analysis.matched_keywords.map((k, i) => (
                                    <span key={i} className="text-[10px] px-2 py-0.5 bg-emerald-500/10 text-emerald-600 border border-emerald-500/20 font-bold">{k}</span>
                                ))}
                            </div>
                        </div>
                    )}
                    {analysis.missing_keywords?.length > 0 && (
                        <div className="glass border border-border p-5">
                            <p className="text-xs font-black uppercase tracking-widest text-muted-foreground mb-3">❌ Missing Keywords</p>
                            <div className="flex flex-wrap gap-1.5">
                                {analysis.missing_keywords.map((k, i) => (
                                    <span key={i} className="text-[10px] px-2 py-0.5 bg-red-500/10 text-red-500 border border-red-500/20 font-bold">{k}</span>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            )}

            <Button variant="outline" size="sm" onClick={onRefresh} className="gap-2">
                <RefreshCw className="w-3.5 h-3.5" /> Upload New Resume
            </Button>
        </div>
    );
}