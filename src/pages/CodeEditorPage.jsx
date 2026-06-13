import React, { useState, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
    Play, RotateCcw, Copy, CheckCheck, Loader2, Terminal, Code2,
    Lightbulb, Sparkles, Download, Wand2, ChevronRight, Shuffle, Zap, Target
} from 'lucide-react';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';
import ReactMarkdown from 'react-markdown';
import { invokeGroq } from '@/api/llm';

const LANGUAGES = [
    { id: 'javascript', label: 'JavaScript', color: '#f7df1e', ext: 'js', starter: '// Write your solution here\n\nfunction solution() {\n  \n}\n\nconsole.log(solution());' },
    { id: 'python', label: 'Python', color: '#3572A5', ext: 'py', starter: '# Write your solution here\n\ndef solution():\n    pass\n\nprint(solution())' },
    { id: 'java', label: 'Java', color: '#b07219', ext: 'java', starter: 'public class Main {\n    public static void main(String[] args) {\n        System.out.println(solution());\n    }\n    \n    static Object solution() {\n        // Write your solution here\n        return null;\n    }\n}' },
    { id: 'typescript', label: 'TypeScript', color: '#2b7489', ext: 'ts', starter: '// Write your solution here\n\nfunction solution(): any {\n  \n}\n\nconsole.log(solution());' },
    { id: 'cpp', label: 'C++', color: '#f34b7d', ext: 'cpp', starter: '#include <iostream>\nusing namespace std;\n\nint main() {\n    // Write your solution here\n    cout << "Output" << endl;\n    return 0;\n}' },
    { id: 'go', label: 'Go', color: '#00ADD8', ext: 'go', starter: 'package main\n\nimport "fmt"\n\nfunc main() {\n    // Write your solution here\n    fmt.Println("Output")\n}' },
    { id: 'rust', label: 'Rust', color: '#dea584', ext: 'rs', starter: 'fn main() {\n    // Write your solution here\n    println!("Output");\n}' },
    { id: 'sql', label: 'SQL', color: '#e38c00', ext: 'sql', starter: '-- Write your SQL query here\nSELECT * FROM your_table\nWHERE condition = true;' },
];

const DIFFICULTY_CONFIGS = {
    easy: { label: 'Easy', color: '#10b981', bg: 'bg-emerald-500/10', text: 'text-emerald-400', icon: '🟢' },
    medium: { label: 'Medium', color: '#f59e0b', bg: 'bg-amber-500/10', text: 'text-amber-400', icon: '🟡' },
    hard: { label: 'Hard', color: '#ef4444', bg: 'bg-red-500/10', text: 'text-red-400', icon: '🔴' },
};

const CATEGORIES = [
    { id: 'arrays', label: '📦 Arrays' },
    { id: 'strings', label: '🔤 Strings' },
    { id: 'linkedlist', label: '🔗 Linked Lists' },
    { id: 'trees', label: '🌳 Trees & Graphs' },
    { id: 'dp', label: '🧮 Dynamic Programming' },
    { id: 'sorting', label: '📊 Sorting & Searching' },
    { id: 'hashmap', label: '#️⃣ Hash Maps' },
    { id: 'stack_queue', label: '📚 Stack & Queue' },
    { id: 'math', label: '➕ Math & Bit Ops' },
    { id: 'backtracking', label: '🔄 Backtracking' },
];

// Robustly extract and parse JSON from a raw LLM string.
// Handles: markdown fences, literal newlines inside string values, stray backticks.
function extractJSON(raw) {
    // 1. Strip markdown code fences if present
    let cleaned = raw.replace(/^```(?:json)?\s*/i, '').replace(/```\s*$/i, '').trim();

    // 2. Pull out the outermost { ... } block
    const start = cleaned.indexOf('{');
    const end = cleaned.lastIndexOf('}');
    if (start === -1 || end === -1) throw new Error('No JSON object found in response.');
    cleaned = cleaned.slice(start, end + 1);

    // 3. Try a straight parse first
    try {
        return JSON.parse(cleaned);
    } catch (_) { /* fall through */ }

    // 4. Fix literal newlines/tabs inside JSON string values
    //    Walk char-by-char, and when inside a string, replace bare \n/\r/\t with escape sequences.
    let fixed = '';
    let inString = false;
    let escaped = false;
    for (let i = 0; i < cleaned.length; i++) {
        const ch = cleaned[i];
        if (escaped) {
            fixed += ch;
            escaped = false;
            continue;
        }
        if (ch === '\\') {
            escaped = true;
            fixed += ch;
            continue;
        }
        if (ch === '"') {
            inString = !inString;
            fixed += ch;
            continue;
        }
        if (inString) {
            if (ch === '\n') { fixed += '\\n'; continue; }
            if (ch === '\r') { fixed += '\\r'; continue; }
            if (ch === '\t') { fixed += '\\t'; continue; }
        }
        fixed += ch;
    }

    return JSON.parse(fixed);
}

export default function CodeEditorPage() {
    const [lang, setLang] = useState(LANGUAGES[0]);
    const [code, setCode] = useState(LANGUAGES[0].starter);
    const [output, setOutput] = useState('');
    const [isRunning, setIsRunning] = useState(false);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [isOptimizing, setIsOptimizing] = useState(false);
    const [isGenerating, setIsGenerating] = useState(false);
    const [analysis, setAnalysis] = useState('');
    const [optimized, setOptimized] = useState('');
    const [copied, setCopied] = useState(false);
    const [tab, setTab] = useState('output');
    const [difficulty, setDifficulty] = useState('medium');
    const [category, setCategory] = useState('arrays');
    const [currentChallenge, setCurrentChallenge] = useState(null);
    const textareaRef = useRef(null);

    const handleLangChange = (langId) => {
        const l = LANGUAGES.find(x => x.id === langId);
        if (l) { setLang(l); setCode(l.starter); setOutput(''); setAnalysis(''); setOptimized(''); }
    };

    const handleKeyDown = useCallback((e) => {
        const ta = textareaRef.current;
        if (!ta) return;
        if (e.key === 'Tab') {
            e.preventDefault();
            const start = ta.selectionStart, end = ta.selectionEnd;
            const newCode = code.substring(0, start) + '  ' + code.substring(end);
            setCode(newCode);
            setTimeout(() => { ta.selectionStart = ta.selectionEnd = start + 2; }, 0);
        }
        if (e.key === 'Enter') {
            const start = ta.selectionStart;
            const lineStart = code.lastIndexOf('\n', start - 1) + 1;
            const currentLine = code.substring(lineStart, start);
            const indent = currentLine.match(/^(\s*)/)?.[1] || '';
            const addExtra = /[{(\[:]$/.test(currentLine.trim()) ? '  ' : '';
            e.preventDefault();
            const newCode = code.substring(0, start) + '\n' + indent + addExtra + code.substring(start);
            setCode(newCode);
            setTimeout(() => { ta.selectionStart = ta.selectionEnd = start + 1 + indent.length + addExtra.length; }, 0);
        }
        if ((e.ctrlKey || e.metaKey) && e.key === '/') {
            e.preventDefault();
            const start = ta.selectionStart;
            const lineStart = code.lastIndexOf('\n', start - 1) + 1;
            const lineEnd = code.indexOf('\n', start);
            const line = code.substring(lineStart, lineEnd === -1 ? code.length : lineEnd);
            const commentChar = lang.id === 'python' || lang.id === 'sql' ? '#' : '//';
            const isCommented = line.trimStart().startsWith(commentChar);
            const newLine = isCommented
                ? line.replace(commentChar + ' ', '').replace(commentChar, '')
                : commentChar + ' ' + line;
            setCode(code.substring(0, lineStart) + newLine + code.substring(lineEnd === -1 ? code.length : lineEnd));
        }
    }, [code, lang]);

    const generateChallenge = async () => {
        setIsGenerating(true);
        setCurrentChallenge(null);
        setOutput(''); setAnalysis(''); setOptimized(''); setTab('output');
        try {
            const diffConf = DIFFICULTY_CONFIGS[difficulty];
            const cat = CATEGORIES.find(c => c.id === category);

            const prompt = `Generate a unique ${diffConf.label} difficulty coding challenge in the "${cat?.label}" category for a ${lang.label} developer.

The challenge should be NEW and UNIQUE — not a common well-known problem. Be creative.

Return ONLY a valid JSON object with these exact fields. No markdown, no code fences, no extra text.
For the starter_code field, use \\n for newlines (not actual line breaks) and escape any backslashes or double quotes inside the string.

{
  "title": "Challenge title (creative name)",
  "difficulty": "${difficulty}",
  "category": "${category}",
  "description": "Clear problem description with context",
  "examples": [{"input": "example input", "output": "expected output", "explanation": "why"}],
  "constraints": ["constraint 1", "constraint 2"],
  "hints": ["hint 1 (subtle)", "hint 2 (more direct)"],
  "starter_code": "function solution() {\\n  // Write your code here\\n}\\n\\nconsole.log(solution());"
}`;

            // Get raw string — do NOT use parseJSON:true so we control parsing ourselves
            const raw = await invokeGroq({ prompt, maxTokens: 2000 });

            const result = extractJSON(raw);

            if (!result || typeof result !== 'object' || !result.title) {
                throw new Error('AI returned invalid data. Please try again.');
            }

            setCurrentChallenge(result);
            if (result.starter_code) {
                // Clean up any stray markdown fences that snuck into the starter code value
                const cleanStarter = result.starter_code
                    .replace(/^```[\w]*\n?/, '')
                    .replace(/```$/, '')
                    .trim();
                setCode(cleanStarter);
            }
            toast.success(`Challenge ready: ${result.title}`);
        } catch (err) {
            toast.error('Failed to generate challenge: ' + err.message);
            console.error(err);
        } finally {
            setIsGenerating(false);
        }
    };

    const runCode = async () => {
        setIsRunning(true); setOutput(''); setTab('output');
        try {
            const prompt = `You are a ${lang.label} code executor. Run this code and return ONLY the terminal output — no explanations, no markdown, no code blocks.\n\n\`\`\`${lang.id}\n${code}\n\`\`\``;
            const result = await invokeGroq({ prompt });
            setOutput(result || '(No output)');
        } catch (err) {
            toast.error('Failed to run code');
            setOutput('Error: Could not execute code.');
        } finally {
            setIsRunning(false);
        }
    };

    const analyzeCode = async () => {
        setIsAnalyzing(true); setTab('analysis');
        try {
            const prompt = `Analyze this ${lang.label} code:\n1. **Time Complexity** (Big O)\n2. **Space Complexity**\n3. **Code Quality** issues\n4. **Top 3 Improvements**\n${currentChallenge ? `\nContext: This is solving "${currentChallenge.title}" (${currentChallenge.difficulty})` : ''}\n\n\`\`\`${lang.id}\n${code}\n\`\`\``;
            const result = await invokeGroq({ prompt });
            setAnalysis(result);
        } catch (err) {
            toast.error('Failed to analyze code');
        } finally {
            setIsAnalyzing(false);
        }
    };

    const optimizeCode = async () => {
        setIsOptimizing(true); setTab('optimized');
        try {
            const prompt = `Optimize this ${lang.label} code for best time/space complexity. Return ONLY the improved code with brief inline comments. No markdown fences.\n\n\`\`\`${lang.id}\n${code}\n\`\`\``;
            const result = await invokeGroq({ prompt });
            setOptimized(result.replace(/^```[\w]*\n?/, '').replace(/```$/, '').trim());
        } catch (err) {
            toast.error('Failed to optimize code');
        } finally {
            setIsOptimizing(false);
        }
    };

    const copyCode = () => {
        navigator.clipboard.writeText(code);
        setCopied(true);
        setTimeout(() => setCopied(false), 1500);
        toast.success('Copied!');
    };

    const downloadCode = () => {
        const blob = new Blob([code], { type: 'text/plain' });
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = `solution.${lang.ext}`;
        a.click();
        toast.success(`Downloaded solution.${lang.ext}`);
    };

    const useOptimized = () => {
        if (optimized) { setCode(optimized); setOptimized(''); setTab('output'); toast.success('Applied!'); }
    };

    const resetCode = () => {
        setCode(currentChallenge?.starter_code?.replace(/^```[\w]*\n?/, '').replace(/```$/, '').trim() || lang.starter);
        setOutput(''); setAnalysis(''); setOptimized('');
    };

    const lineCount = code.split('\n').length;

    return (
        <div className="space-y-4">
            {/* Header */}
            <div className="flex items-center justify-between flex-wrap gap-3">
                <div>
                    <h1 className="text-2xl font-black font-heading flex items-center gap-2">
                        <Code2 className="w-6 h-6 text-primary" /> Code Editor
                    </h1>
                    <p className="text-xs text-muted-foreground mt-0.5">AI-Powered · DSA Practice · LeetCode-style Challenges</p>
                </div>
                <Select value={lang.id} onValueChange={handleLangChange}>
                    <SelectTrigger className="w-[150px] h-9 bg-zinc-900 border-zinc-700 text-zinc-200">
                        <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: lang.color }} />
                            <span>{lang.label}</span>
                        </div>
                    </SelectTrigger>
                    <SelectContent>
                        {LANGUAGES.map(l => (
                            <SelectItem key={l.id} value={l.id}>
                                <div className="flex items-center gap-2">
                                    <div className="w-2 h-2 rounded-full" style={{ background: l.color }} />
                                    {l.label}
                                </div>
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>

            {/* Challenge Generator Panel */}
            <div className="bg-zinc-950 border border-zinc-800 p-4">
                <div className="flex items-center gap-2 mb-3">
                    <Zap className="w-4 h-4 text-amber-400" />
                    <span className="text-xs font-black uppercase tracking-widest text-zinc-300">AI Challenge Generator</span>
                    <span className="text-[10px] text-zinc-600 ml-1">— Fresh unique problems every time</span>
                </div>

                <div className="flex flex-wrap gap-3 items-end">
                    <div>
                        <div className="text-[10px] font-black uppercase tracking-widest text-zinc-500 mb-1.5">Difficulty</div>
                        <div className="flex gap-1.5">
                            {Object.entries(DIFFICULTY_CONFIGS).map(([key, conf]) => (
                                <button
                                    key={key}
                                    type="button"
                                    onClick={() => setDifficulty(key)}
                                    className={`px-3 py-1.5 text-xs font-bold border transition-all ${difficulty === key
                                        ? `border-current ${conf.text} ${conf.bg}`
                                        : 'border-zinc-700 text-zinc-500 hover:border-zinc-500 hover:text-zinc-300'
                                        }`}
                                >
                                    {conf.icon} {conf.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="flex-1 min-w-[160px]">
                        <div className="text-[10px] font-black uppercase tracking-widest text-zinc-500 mb-1.5">Topic / Category</div>
                        <Select value={category} onValueChange={setCategory}>
                            <SelectTrigger className="h-9 bg-zinc-900 border-zinc-700 text-zinc-200 text-xs">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                {CATEGORIES.map(c => (
                                    <SelectItem key={c.id} value={c.id} className="text-xs">{c.label}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <Button
                        onClick={generateChallenge}
                        disabled={isGenerating}
                        className="h-9 px-5 bg-amber-500 hover:bg-amber-600 text-black font-black text-xs flex-shrink-0"
                    >
                        {isGenerating
                            ? <><Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />Generating…</>
                            : <><Shuffle className="w-3.5 h-3.5 mr-1.5" />New Challenge</>
                        }
                    </Button>
                </div>

                <AnimatePresence mode="wait">
                    {/* Skeleton while generating */}
                    {isGenerating && (
                        <motion.div
                            key="skeleton"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="mt-4 border border-zinc-800 bg-zinc-900/30 p-6 flex items-center gap-3"
                        >
                            <Loader2 className="w-4 h-4 text-amber-400 animate-spin flex-shrink-0" />
                            <div className="space-y-2 flex-1">
                                <div className="h-2.5 bg-zinc-800 rounded w-1/3 animate-pulse" />
                                <div className="h-2 bg-zinc-800 rounded w-2/3 animate-pulse" />
                                <div className="h-2 bg-zinc-800 rounded w-1/2 animate-pulse" />
                            </div>
                        </motion.div>
                    )}

                    {/* Challenge card — keyed by title so re-generating forces remount + animation */}
                    {currentChallenge && !isGenerating && (
                        <motion.div
                            key={currentChallenge.title}
                            initial={{ opacity: 0, y: 6 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -6 }}
                            transition={{ duration: 0.2 }}
                            className="mt-4 border border-zinc-700 bg-zinc-900/50"
                        >
                            <div className="flex items-start gap-3 p-4">
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 mb-2 flex-wrap">
                                        <span className={`text-[10px] font-black uppercase tracking-widest px-2 py-0.5 ${DIFFICULTY_CONFIGS[currentChallenge.difficulty]?.bg} ${DIFFICULTY_CONFIGS[currentChallenge.difficulty]?.text}`}>
                                            {currentChallenge.difficulty}
                                        </span>
                                        <span className="text-[10px] font-mono text-zinc-500">
                                            {CATEGORIES.find(c => c.id === currentChallenge.category)?.label || currentChallenge.category}
                                        </span>
                                    </div>
                                    <h3 className="font-black text-sm text-white mb-2">{currentChallenge.title}</h3>
                                    <p className="text-xs text-zinc-400 leading-relaxed mb-3">{currentChallenge.description}</p>

                                    {currentChallenge.examples?.length > 0 && (
                                        <div className="space-y-1.5 mb-3">
                                            <div className="text-[9px] font-black uppercase tracking-widest text-zinc-600">Examples</div>
                                            {currentChallenge.examples.map((ex, ei) => (
                                                <div key={ei} className="bg-zinc-950 border border-zinc-800 px-3 py-2 text-xs font-mono">
                                                    <span className="text-zinc-500">Input: </span><span className="text-emerald-400">{ex.input}</span>
                                                    <span className="text-zinc-500 ml-3">→ Output: </span><span className="text-blue-400">{ex.output}</span>
                                                    {ex.explanation && <div className="text-zinc-600 mt-0.5 font-sans">// {ex.explanation}</div>}
                                                </div>
                                            ))}
                                        </div>
                                    )}

                                    {currentChallenge.constraints?.length > 0 && (
                                        <div className="mb-3">
                                            <div className="text-[9px] font-black uppercase tracking-widest text-zinc-600 mb-1">Constraints</div>
                                            <div className="flex flex-wrap gap-1.5">
                                                {currentChallenge.constraints.map((c, ci) => (
                                                    <span key={ci} className="text-[10px] px-2 py-0.5 border border-zinc-700 text-zinc-500 font-mono">{c}</span>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {currentChallenge.hints?.length > 0 && (
                                        <details className="cursor-pointer">
                                            <summary className="text-[10px] font-black uppercase tracking-widest text-amber-500/70 hover:text-amber-400 cursor-pointer select-none">
                                                💡 Hints ({currentChallenge.hints.length})
                                            </summary>
                                            <div className="mt-2 space-y-1">
                                                {currentChallenge.hints.map((h, hi) => (
                                                    <div key={hi} className="text-xs text-zinc-500 pl-3 border-l border-amber-500/30">
                                                        Hint {hi + 1}: {h}
                                                    </div>
                                                ))}
                                            </div>
                                        </details>
                                    )}
                                </div>
                            </div>
                        </motion.div>
                    )}

                    {/* Empty state */}
                    {!currentChallenge && !isGenerating && (
                        <motion.div
                            key="empty"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="mt-4 border border-dashed border-zinc-800 py-6 text-center"
                        >
                            <Target className="w-8 h-8 text-zinc-700 mx-auto mb-2" />
                            <p className="text-zinc-600 text-xs">Select difficulty + category, then click <span className="text-amber-400 font-bold">New Challenge</span></p>
                            <p className="text-zinc-700 text-[10px] mt-1">Every challenge is AI-generated and unique 🤖</p>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* Editor + Output */}
            <div className="grid lg:grid-cols-2 gap-4" style={{ minHeight: 500 }}>
                {/* Code Editor */}
                <div className="bg-zinc-950 border border-zinc-800 flex flex-col overflow-hidden">
                    <div className="flex items-center justify-between px-4 py-2.5 bg-zinc-900 border-b border-zinc-800">
                        <div className="flex items-center gap-3">
                            <div className="flex gap-1.5">
                                <div className="w-3 h-3 rounded-full bg-red-500/70" />
                                <div className="w-3 h-3 rounded-full bg-amber-500/70" />
                                <div className="w-3 h-3 rounded-full bg-emerald-500/70" />
                            </div>
                            <div className="flex items-center gap-1.5">
                                <div className="w-2 h-2 rounded-full" style={{ background: lang.color }} />
                                <span className="text-xs text-zinc-400 font-mono">{lang.label}</span>
                                {currentChallenge && (
                                    <span className={`text-[10px] px-1.5 py-0.5 font-black ${DIFFICULTY_CONFIGS[currentChallenge.difficulty]?.bg} ${DIFFICULTY_CONFIGS[currentChallenge.difficulty]?.text}`}>
                                        {currentChallenge.title}
                                    </span>
                                )}
                            </div>
                        </div>
                        <div className="flex items-center gap-1">
                            <button onClick={copyCode} className="h-7 px-2 text-zinc-500 hover:text-white hover:bg-zinc-800 flex items-center">
                                {copied ? <CheckCheck className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                            </button>
                            <button onClick={downloadCode} className="h-7 px-2 text-zinc-500 hover:text-white hover:bg-zinc-800 flex items-center" title="Download">
                                <Download className="w-3.5 h-3.5" />
                            </button>
                            <button onClick={resetCode} className="h-7 px-2 text-zinc-500 hover:text-white hover:bg-zinc-800 flex items-center" title="Reset">
                                <RotateCcw className="w-3.5 h-3.5" />
                            </button>
                        </div>
                    </div>

                    <div className="relative flex-1 flex overflow-hidden">
                        <div className="bg-zinc-900/60 w-12 flex-shrink-0 pt-4 select-none overflow-hidden">
                            {Array.from({ length: lineCount }, (_, i) => (
                                <div key={i} className="text-zinc-600 text-[11px] font-mono leading-6 text-right pr-3">{i + 1}</div>
                            ))}
                        </div>
                        <textarea
                            ref={textareaRef}
                            value={code}
                            onChange={e => setCode(e.target.value)}
                            onKeyDown={handleKeyDown}
                            spellCheck={false}
                            autoComplete="off"
                            autoCorrect="off"
                            className="flex-1 min-h-[420px] bg-transparent text-zinc-100 font-mono text-sm leading-6 resize-none outline-none px-4 pt-4 pb-4 scrollbar-thin"
                            style={{ caretColor: lang.color }}
                        />
                    </div>

                    <div className="flex items-center gap-2 px-4 py-2.5 bg-zinc-900 border-t border-zinc-800 flex-wrap">
                        <Button onClick={runCode} disabled={isRunning} className="h-8 px-4 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black">
                            {isRunning ? <><Loader2 className="w-3 h-3 mr-1.5 animate-spin" />Running…</> : <><Play className="w-3 h-3 mr-1.5" />Run</>}
                        </Button>
                        <Button onClick={analyzeCode} disabled={isAnalyzing} variant="outline" className="h-8 px-3 text-xs font-semibold border-zinc-700 text-zinc-300 hover:bg-zinc-800 hover:text-white">
                            {isAnalyzing ? <Loader2 className="w-3 h-3 mr-1.5 animate-spin" /> : <Sparkles className="w-3 h-3 mr-1.5 text-violet-400" />}
                            Analyze
                        </Button>
                        <Button onClick={optimizeCode} disabled={isOptimizing} variant="outline" className="h-8 px-3 text-xs font-semibold border-zinc-700 text-zinc-300 hover:bg-zinc-800 hover:text-white">
                            {isOptimizing ? <Loader2 className="w-3 h-3 mr-1.5 animate-spin" /> : <Wand2 className="w-3 h-3 mr-1.5 text-blue-400" />}
                            Optimize
                        </Button>
                        <span className="text-[10px] text-zinc-600 font-mono ml-auto">{lineCount}L · {code.length}C</span>
                    </div>
                </div>

                {/* Output / Analysis Panel */}
                <div className="bg-zinc-950 border border-zinc-800 flex flex-col overflow-hidden">
                    <div className="flex items-center gap-0 px-3 bg-zinc-900 border-b border-zinc-800">
                        {[
                            { id: 'output', label: 'Output', icon: Terminal, color: 'emerald' },
                            { id: 'analysis', label: 'AI Analysis', icon: Lightbulb, color: 'violet' },
                            { id: 'optimized', label: 'Optimized', icon: Wand2, color: 'blue' },
                        ].map(t => {
                            const Icon = t.icon;
                            const colorClass = {
                                emerald: 'text-emerald-400 border-emerald-500',
                                violet: 'text-violet-400 border-violet-500',
                                blue: 'text-blue-400 border-blue-500',
                            }[t.color];
                            return (
                                <button
                                    key={t.id}
                                    type="button"
                                    onClick={() => setTab(t.id)}
                                    className={`flex items-center gap-1.5 px-3 py-2.5 text-xs font-semibold border-b-2 transition-colors ${tab === t.id ? colorClass : 'border-transparent text-zinc-500 hover:text-zinc-300'}`}
                                >
                                    <Icon className="w-3.5 h-3.5" /> {t.label}
                                    {t.id === 'optimized' && optimized && <span className="w-1.5 h-1.5 bg-blue-400 rounded-full ml-1" />}
                                </button>
                            );
                        })}
                    </div>

                    <div className="flex-1 p-4 overflow-y-auto scrollbar-thin min-h-[420px]">
                        <AnimatePresence mode="wait">
                            {tab === 'output' && (
                                <motion.div key="output" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                                    {isRunning ? (
                                        <div className="flex items-center gap-2 text-emerald-400 text-sm font-mono">
                                            <Loader2 className="w-4 h-4 animate-spin" /> Executing {lang.label} code…
                                        </div>
                                    ) : output ? (
                                        <div>
                                            <div className="flex items-center gap-2 mb-3">
                                                <div className="w-2 h-2 rounded-full bg-emerald-500" />
                                                <span className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Terminal Output</span>
                                            </div>
                                            <pre className="text-sm font-mono text-emerald-300 leading-relaxed whitespace-pre-wrap">{output}</pre>
                                        </div>
                                    ) : (
                                        <div className="flex flex-col items-center justify-center h-52 gap-3 text-center">
                                            <Terminal className="w-10 h-10 text-zinc-800" />
                                            <p className="text-zinc-600 text-sm">Press <span className="text-emerald-500 font-bold">Run</span> to execute</p>
                                        </div>
                                    )}
                                </motion.div>
                            )}

                            {tab === 'analysis' && (
                                <motion.div key="analysis" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                                    {isAnalyzing ? (
                                        <div className="flex items-center gap-2 text-violet-400 text-sm font-mono">
                                            <Loader2 className="w-4 h-4 animate-spin" /> Analyzing…
                                        </div>
                                    ) : analysis ? (
                                        <div>
                                            <div className="flex items-center gap-2 mb-3">
                                                <div className="w-2 h-2 rounded-full bg-violet-500" />
                                                <span className="text-[10px] font-black uppercase tracking-widest text-zinc-500">AI Code Analysis</span>
                                            </div>
                                            <div className="prose prose-sm prose-invert max-w-none">
                                                <ReactMarkdown
                                                    components={{
                                                        h1: ({ children }) => <h1 className="text-violet-300 font-bold text-sm mt-4 mb-2">{children}</h1>,
                                                        h2: ({ children }) => <h2 className="text-violet-300 font-bold text-sm mt-3 mb-1.5">{children}</h2>,
                                                        strong: ({ children }) => <strong className="text-violet-200">{children}</strong>,
                                                        p: ({ children }) => <p className="text-zinc-300 text-xs leading-relaxed my-1.5">{children}</p>,
                                                        li: ({ children }) => <li className="text-zinc-300 text-xs my-0.5">{children}</li>,
                                                        code: ({ children }) => <code className="bg-zinc-800 text-emerald-300 px-1 py-0.5 text-xs font-mono">{children}</code>,
                                                    }}
                                                >
                                                    {analysis}
                                                </ReactMarkdown>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="flex flex-col items-center justify-center h-52 gap-3 text-center">
                                            <Sparkles className="w-10 h-10 text-zinc-800" />
                                            <p className="text-zinc-600 text-sm">Click <span className="text-violet-400 font-bold">Analyze</span> for AI insights</p>
                                        </div>
                                    )}
                                </motion.div>
                            )}

                            {tab === 'optimized' && (
                                <motion.div key="optimized" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                                    {isOptimizing ? (
                                        <div className="flex items-center gap-2 text-blue-400 text-sm font-mono">
                                            <Loader2 className="w-4 h-4 animate-spin" /> Optimizing…
                                        </div>
                                    ) : optimized ? (
                                        <div>
                                            <div className="flex items-center justify-between mb-3">
                                                <div className="flex items-center gap-2">
                                                    <div className="w-2 h-2 rounded-full bg-blue-500" />
                                                    <span className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Optimized Code</span>
                                                </div>
                                                <Button size="sm" onClick={useOptimized} className="h-6 px-3 text-[10px] font-black bg-blue-600 hover:bg-blue-700 text-white">
                                                    <ChevronRight className="w-3 h-3 mr-1" /> Use This
                                                </Button>
                                            </div>
                                            <pre className="text-xs font-mono text-blue-200 leading-relaxed whitespace-pre-wrap bg-zinc-900/50 p-3 border border-zinc-800">{optimized}</pre>
                                        </div>
                                    ) : (
                                        <div className="flex flex-col items-center justify-center h-52 gap-3 text-center">
                                            <Wand2 className="w-10 h-10 text-zinc-800" />
                                            <p className="text-zinc-600 text-sm">Click <span className="text-blue-400 font-bold">Optimize</span> for improved code</p>
                                        </div>
                                    )}
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </div>
            </div>

            {/* Keyboard Shortcuts */}
            <div className="flex gap-4 flex-wrap">
                {[['Tab', 'Indent'], ['Ctrl+/', 'Toggle comment'], ['Run', 'Execute code'], ['Analyze', 'AI review'], ['Optimize', 'AI refactor']].map(([key, desc]) => (
                    <div key={key} className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <kbd className="bg-muted border border-border px-1.5 py-0.5 text-[10px] font-mono font-bold">{key}</kbd>
                        <span>{desc}</span>
                    </div>
                ))}
            </div>
        </div>
    );
}