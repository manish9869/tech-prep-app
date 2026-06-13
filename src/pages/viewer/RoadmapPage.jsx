import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Topic, RoadmapTopic } from '@/api/entities';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronRight, ChevronLeft, Map, Zap, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import PageHeader from '@/components/shared/PageHeader';

function MindMapPhase({ phase, index, isActive, onClick }) {
    const leftNodes = phase.left_nodes || [];
    const rightNodes = phase.right_nodes || [];
    const color = phase.color || '#6366f1';

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.08 }}
            onClick={onClick}
            className={`relative cursor-pointer overflow-hidden transition-all duration-200 group ${isActive
                ? 'ring-2 ring-primary shadow-xl shadow-primary/10'
                : 'hover:shadow-lg hover:-translate-y-0.5'
                }`}
            style={{
                background: isActive
                    ? 'linear-gradient(135deg, hsl(var(--card)) 0%, hsl(var(--accent)/0.3) 100%)'
                    : 'hsl(var(--card))',
                border: `1px solid ${isActive ? 'hsl(var(--primary)/0.4)' : 'hsl(var(--border))'}`,
                backdropFilter: 'blur(12px)',
            }}
        >
            <div className="h-1 w-full" style={{ background: `linear-gradient(90deg, ${color}, ${color}88)` }} />
            <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity"
                style={{ background: `linear-gradient(135deg, ${color}05, ${color}10)` }} />

            <div className="p-4 relative z-10">
                <div className="flex items-center gap-2 mb-3">
                    <div className="w-6 h-6 flex items-center justify-center text-[11px] font-black text-white flex-shrink-0"
                        style={{ background: color }}>
                        {index + 1}
                    </div>
                    <h3 className="font-black text-sm text-foreground">{phase.phase_name}</h3>
                    {isActive && (
                        <span className="ml-auto text-[9px] font-black uppercase tracking-widest text-primary bg-primary/10 px-1.5 py-0.5 border border-primary/20">
                            Active
                        </span>
                    )}
                </div>

                <div className="flex gap-2">
                    <div className="flex-1 space-y-1">
                        {leftNodes.length > 0 && (
                            <div className="text-[8px] font-black uppercase tracking-widest text-muted-foreground mb-1.5">Cover</div>
                        )}
                        {leftNodes.slice(0, 4).map((node, ni) => (
                            <div key={ni} className="flex items-center gap-1.5 px-2 py-1 text-[10px] font-semibold border-l-2"
                                style={{ borderLeftColor: color, background: `${color}08` }}>
                                <div className="w-1 h-1 flex-shrink-0 rounded-full" style={{ background: color }} />
                                <span className="truncate text-foreground/80">{node}</span>
                            </div>
                        ))}
                        {leftNodes.length > 4 && <div className="text-[9px] text-muted-foreground pl-2">+{leftNodes.length - 4} more</div>}
                    </div>

                    <div className="w-px flex-shrink-0 self-stretch" style={{ background: `${color}30` }} />

                    <div className="flex-1 space-y-1">
                        {rightNodes.length > 0 && (
                            <div className="text-[8px] font-black uppercase tracking-widest text-muted-foreground mb-1.5">Learn</div>
                        )}
                        {rightNodes.slice(0, 4).map((node, ni) => (
                            <div key={ni} className="flex items-center gap-1.5 px-2 py-1 text-[10px] font-semibold border-r-2 text-right justify-end"
                                style={{ borderRightColor: color, background: `${color}05` }}>
                                <span className="truncate text-foreground/80">{node}</span>
                                <div className="w-1 h-1 flex-shrink-0 rounded-full" style={{ background: color }} />
                            </div>
                        ))}
                        {rightNodes.length > 4 && <div className="text-[9px] text-muted-foreground text-right pr-2">+{rightNodes.length - 4} more</div>}
                    </div>
                </div>

                <div className="mt-3 pt-2 border-t flex items-center justify-between" style={{ borderColor: `${color}20` }}>
                    <span className="text-[9px] text-muted-foreground">{leftNodes.length + rightNodes.length} topics</span>
                    <ArrowRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" style={{ color }} />
                </div>
            </div>
        </motion.div>
    );
}

export default function RoadmapPage() {
    const [selectedTopicId, setSelectedTopicId] = useState(null);
    const [activePhase, setActivePhase] = useState(0);

    const { data: topics = [] } = useQuery({
        queryKey: ['topics'],
        queryFn: () => Topic.list(),
    });

    const { data: roadmapPhases = [], isLoading } = useQuery({
        queryKey: ['roadmap-topics'],
        queryFn: () => RoadmapTopic.list(),
    });

    const visibleTopics = topics.filter(t => t.is_visible !== false);
    const activeTopic = visibleTopics.find(t => t.id === selectedTopicId) || visibleTopics[0];

    const phases = useMemo(() => {
        if (!activeTopic) return [];
        return roadmapPhases
            .filter(r => r.topic_id === activeTopic.id)
            .sort((a, b) => (a.phase_order || 0) - (b.phase_order || 0));
    }, [activeTopic, roadmapPhases]);

    const hasRoadmap = phases.length > 0;

    return (
        <div className="space-y-6">
            <PageHeader
                title="Learning Roadmap"
                badge="Study Path"
                description="Structured learning paths for each technology — follow the phases to master your topic"
            />

            {visibleTopics.length > 0 && (
                <div className="flex flex-wrap gap-2">
                    {visibleTopics.map(t => {
                        const isSelected = activeTopic?.id === t.id;
                        const topicPhases = roadmapPhases.filter(r => r.topic_id === t.id);
                        return (
                            <button
                                key={t.id}
                                onClick={() => { setSelectedTopicId(t.id); setActivePhase(0); }}
                                className={`flex items-center gap-2 px-3 py-1.5 text-xs font-bold border-2 transition-all ${isSelected
                                    ? 'border-primary bg-primary/10 text-primary'
                                    : 'border-border bg-card text-muted-foreground hover:border-primary/40 hover:text-foreground'
                                    }`}
                            >
                                {t.logo_url ? (
                                    <img src={t.logo_url} alt={t.name} className="w-4 h-4 object-contain" />
                                ) : (
                                    <div className="w-4 h-4 flex items-center justify-center text-[9px] font-black text-white"
                                        style={{ background: t.color || 'hsl(var(--primary))' }}>
                                        {t.name?.[0]}
                                    </div>
                                )}
                                {t.name}
                                {topicPhases.length > 0 && (
                                    <span className="text-[9px] opacity-60">{topicPhases.length} phases</span>
                                )}
                            </button>
                        );
                    })}
                </div>
            )}

            {isLoading ? (
                <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {Array(4).fill(0).map((_, i) => <div key={i} className="h-52 bg-muted animate-pulse" />)}
                </div>
            ) : activeTopic && (
                <AnimatePresence mode="wait">
                    <motion.div key={activeTopic.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }}>

                        <div className="relative overflow-hidden mb-6 p-5 flex items-center gap-5"
                            style={{
                                background: `linear-gradient(135deg, hsl(var(--foreground)) 0%, hsl(var(--foreground)/0.9) 100%)`,
                                color: 'hsl(var(--background))',
                            }}>
                            <div className="absolute inset-0 opacity-5"
                                style={{ background: 'repeating-linear-gradient(45deg, currentColor 0, currentColor 1px, transparent 0, transparent 8px)' }} />
                            <div className="absolute left-0 top-0 bottom-0 w-1"
                                style={{ background: activeTopic.color || 'hsl(var(--primary))' }} />

                            {activeTopic.logo_url ? (
                                <img src={activeTopic.logo_url} alt={activeTopic.name} className="w-12 h-12 object-contain relative z-10 flex-shrink-0" />
                            ) : (
                                <div className="w-12 h-12 flex items-center justify-center text-2xl font-black text-white flex-shrink-0 relative z-10"
                                    style={{ background: activeTopic.color || 'hsl(var(--primary))' }}>
                                    {activeTopic.name?.[0]}
                                </div>
                            )}
                            <div className="flex-1 relative z-10">
                                <div className="text-[9px] font-black uppercase tracking-[0.2em] opacity-50 mb-1">Learning Roadmap</div>
                                <h2 className="text-xl font-black">{activeTopic.name} Roadmap</h2>
                                <p className="text-xs opacity-60 mt-0.5">
                                    {hasRoadmap ? `${phases.length} phase${phases.length !== 1 ? 's' : ''} · Admin-curated path` : 'No roadmap defined yet'}
                                </p>
                            </div>
                            {hasRoadmap && (
                                <div className="relative z-10 flex-shrink-0 flex gap-2">
                                    {phases.map((ph, pi) => (
                                        <div
                                            key={pi}
                                            onClick={() => setActivePhase(pi)}
                                            className={`w-2 h-2 cursor-pointer transition-all ${activePhase === pi ? 'scale-125' : 'opacity-40'}`}
                                            style={{ background: ph.color || activeTopic.color || '#fff' }}
                                        />
                                    ))}
                                </div>
                            )}
                        </div>

                        {!hasRoadmap ? (
                            <div className="text-center py-16 border border-dashed border-border bg-card/50">
                                <Map className="w-12 h-12 text-muted-foreground mx-auto mb-3 opacity-40" />
                                <p className="font-black text-foreground">No roadmap defined for {activeTopic.name}</p>
                                <p className="text-xs text-muted-foreground mt-2">An admin needs to set up the learning path for this topic.</p>
                            </div>
                        ) : (
                            <>
                                <div className="flex items-center gap-2 mb-5 overflow-x-auto pb-1 scrollbar-thin">
                                    {phases.map((phase, pi) => (
                                        <React.Fragment key={pi}>
                                            <button
                                                onClick={() => setActivePhase(pi)}
                                                className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold border whitespace-nowrap transition-all flex-shrink-0 ${activePhase === pi
                                                    ? 'border-primary bg-primary/10 text-primary'
                                                    : 'border-border text-muted-foreground hover:text-foreground hover:border-primary/40'
                                                    }`}
                                            >
                                                <div className="w-2 h-2 flex-shrink-0" style={{ background: phase.color || '#f59e0b' }} />
                                                {phase.phase_name}
                                            </button>
                                            {pi < phases.length - 1 && <ChevronRight className="w-3 h-3 text-muted-foreground flex-shrink-0" />}
                                        </React.Fragment>
                                    ))}
                                </div>

                                <div className="grid sm:grid-cols-2 xl:grid-cols-4 gap-4">
                                    {phases.map((phase, pi) => (
                                        <MindMapPhase
                                            key={phase.id || pi}
                                            phase={phase}
                                            index={pi}
                                            isActive={activePhase === pi}
                                            onClick={() => setActivePhase(pi)}
                                        />
                                    ))}
                                </div>

                                {phases[activePhase] && (
                                    <motion.div
                                        key={activePhase}
                                        initial={{ opacity: 0, y: 12 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        className="mt-6 border border-border overflow-hidden"
                                        style={{
                                            background: 'linear-gradient(135deg, hsl(var(--card)) 0%, hsl(var(--accent)/0.15) 100%)',
                                            backdropFilter: 'blur(16px)',
                                        }}
                                    >
                                        <div className="h-1 w-full" style={{ background: `linear-gradient(90deg, ${phases[activePhase].color || '#6366f1'}, ${phases[activePhase].color || '#6366f1'}44)` }} />
                                        <div className="p-6">
                                            <div className="flex items-center gap-3 mb-6">
                                                <div className="w-1 h-8 flex-shrink-0" style={{ background: phases[activePhase].color || '#6366f1' }} />
                                                <div>
                                                    <div className="text-[9px] font-black uppercase tracking-widest text-muted-foreground">Phase {activePhase + 1} of {phases.length}</div>
                                                    <h3 className="font-black text-lg">{phases[activePhase].phase_name}</h3>
                                                </div>
                                                <div className="ml-auto flex gap-2">
                                                    <Button variant="outline" size="sm" disabled={activePhase === 0} onClick={() => setActivePhase(p => p - 1)} className="h-7 px-2">
                                                        <ChevronLeft className="w-3.5 h-3.5" />
                                                    </Button>
                                                    <Button variant="outline" size="sm" disabled={activePhase === phases.length - 1} onClick={() => setActivePhase(p => p + 1)} className="h-7 px-2">
                                                        <ChevronRight className="w-3.5 h-3.5" />
                                                    </Button>
                                                </div>
                                            </div>

                                            <div className="grid sm:grid-cols-2 gap-6">
                                                <div>
                                                    <div className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-3 flex items-center gap-2">
                                                        <div className="w-3 h-0.5" style={{ background: phases[activePhase].color || '#6366f1' }} />
                                                        Topics to Cover
                                                    </div>
                                                    <div className="space-y-2">
                                                        {(phases[activePhase].left_nodes || []).map((node, ni) => (
                                                            <motion.div
                                                                key={ni}
                                                                initial={{ opacity: 0, x: -8 }}
                                                                animate={{ opacity: 1, x: 0 }}
                                                                transition={{ delay: ni * 0.04 }}
                                                                className="flex items-center gap-3 px-3 py-2.5 border-l-2 text-sm font-semibold"
                                                                style={{
                                                                    borderLeftColor: phases[activePhase].color || '#6366f1',
                                                                    background: `${phases[activePhase].color || '#6366f1'}0a`,
                                                                }}
                                                            >
                                                                <div className="w-1.5 h-1.5 flex-shrink-0 rounded-full" style={{ background: phases[activePhase].color || '#6366f1' }} />
                                                                {node}
                                                            </motion.div>
                                                        ))}
                                                    </div>
                                                </div>

                                                <div>
                                                    <div className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-3 flex items-center gap-2">
                                                        <div className="w-3 h-0.5" style={{ background: phases[activePhase].color || '#6366f1' }} />
                                                        You'll Be Able To
                                                    </div>
                                                    <div className="space-y-2">
                                                        {(phases[activePhase].right_nodes || []).map((node, ni) => (
                                                            <motion.div
                                                                key={ni}
                                                                initial={{ opacity: 0, x: 8 }}
                                                                animate={{ opacity: 1, x: 0 }}
                                                                transition={{ delay: ni * 0.04 }}
                                                                className="flex items-center gap-3 px-3 py-2.5 border-r-2 text-sm font-semibold"
                                                                style={{
                                                                    borderRightColor: phases[activePhase].color || '#6366f1',
                                                                    background: `${phases[activePhase].color || '#6366f1'}12`,
                                                                }}
                                                            >
                                                                <Zap className="w-3 h-3 flex-shrink-0" style={{ color: phases[activePhase].color || '#6366f1' }} />
                                                                {node}
                                                            </motion.div>
                                                        ))}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </motion.div>
                                )}
                            </>
                        )}
                    </motion.div>
                </AnimatePresence>
            )}
        </div>
    );
}