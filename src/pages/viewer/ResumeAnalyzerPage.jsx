import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/api/supabaseClient';
import PageHeader from '@/components/shared/PageHeader';
import { Upload, BarChart2, Brain, Sparkles } from 'lucide-react';
import ResumeUploadPanel from '@/components/resume/ResumeUploadPanel';
import ResumeScoreCard from '@/components/resume/ResumeScoreCard';
import ResumeQuestions from '@/components/resume/ResumeQuestions';
import ResumeOptimizer from '@/components/resume/ResumeOptimizer';

const TABS = [
    { id: 'upload', label: 'Upload & Analyze', icon: Upload },
    { id: 'scores', label: 'ATS Score & JD Match', icon: BarChart2 },
    { id: 'questions', label: 'Interview Questions', icon: Brain },
    { id: 'optimizer', label: 'Resume Optimizer', icon: Sparkles },
];

export default function ResumeAnalyzerPage() {
    const [activeTab, setActiveTab] = useState('upload');
    const [analysis, setAnalysis] = useState(null);
    const [analyzing, setAnalyzing] = useState(false);

    const { data: user } = useQuery({
        queryKey: ['me'],
        queryFn: async () => {
            const { data: { user } } = await supabase.auth.getUser();
            return user;
        },
    });

    const handleAnalysisComplete = (data) => {
        setAnalysis(data);
        setActiveTab('scores');
    };

    return (
        <div className="space-y-6">
            <PageHeader
                title="AI Resume Analyzer"
                badge="Career Tools"
                description="Upload your resume for instant AI analysis, ATS scoring, JD matching, and personalized interview prep."
            />

            {/* Tab Navigation */}
            <div className="flex overflow-x-auto border-b border-border gap-0 scrollbar-thin">
                {TABS.map(({ id, label, icon: Icon }) => {
                    const isDisabled = id !== 'upload' && !analysis;
                    return (
                        <button
                            key={id}
                            disabled={isDisabled}
                            onClick={() => !isDisabled && setActiveTab(id)}
                            className={`flex items-center gap-2 px-5 py-3 text-sm font-bold whitespace-nowrap border-b-2 transition-all flex-shrink-0 ${activeTab === id
                                ? 'border-primary text-primary bg-primary/5'
                                : isDisabled
                                    ? 'border-transparent text-muted-foreground/40 cursor-not-allowed'
                                    : 'border-transparent text-muted-foreground hover:text-foreground hover:border-border'
                                }`}
                        >
                            <Icon className="w-4 h-4" />
                            {label}
                        </button>
                    );
                })}
            </div>

            {/* Tab Content */}
            <div>
                {activeTab === 'upload' && (
                    <ResumeUploadPanel
                        user={user}
                        onComplete={handleAnalysisComplete}
                        analyzing={analyzing}
                        setAnalyzing={setAnalyzing}
                    />
                )}
                {activeTab === 'scores' && analysis && (
                    <ResumeScoreCard analysis={analysis} onRefresh={() => setActiveTab('upload')} />
                )}
                {activeTab === 'questions' && analysis && (
                    <ResumeQuestions analysis={analysis} />
                )}
                {activeTab === 'optimizer' && analysis && (
                    <ResumeOptimizer analysis={analysis} setAnalysis={setAnalysis} />
                )}
            </div>
        </div>
    );
}