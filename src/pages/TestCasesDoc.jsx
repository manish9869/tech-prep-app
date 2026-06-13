import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, XCircle, AlertCircle, ChevronDown, ChevronUp, TestTube2, Shield, Brain, BookOpen, User, Settings, Zap } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const TEST_SUITES = [
    {
        id: 'auth',
        icon: Shield,
        color: 'text-blue-600',
        bg: 'bg-blue-500/10',
        title: 'Authentication & Authorization',
        description: 'Login, register, role detection, and route protection',
        cases: [
            { id: 'TC-001', title: 'User Registration — valid data', steps: ['Go to /register', 'Enter full name, email, password, confirm password', 'Click Register'], expected: 'Account created, OTP sent to email, OTP screen shown', priority: 'Critical' },
            { id: 'TC-002', title: 'User Registration — password mismatch', steps: ['Enter different passwords', 'Click Register'], expected: 'Error: "Passwords do not match" shown', priority: 'High' },
            { id: 'TC-003', title: 'User Registration — existing email', steps: ['Register with an email that already exists'], expected: 'Error message: email already in use', priority: 'High' },
            { id: 'TC-004', title: 'Login — valid credentials (Viewer)', steps: ['Go to /login', 'Enter viewer email & password', 'Click Login'], expected: 'Redirected to Viewer Dashboard with learning UI', priority: 'Critical' },
            { id: 'TC-005', title: 'Login — valid credentials (Admin)', steps: ['Login with admin account'], expected: 'Redirected to Admin Dashboard with admin sidebar', priority: 'Critical' },
            { id: 'TC-006', title: 'Login — wrong password', steps: ['Enter correct email, wrong password'], expected: 'Error: invalid credentials, no redirect', priority: 'Critical' },
            { id: 'TC-007', title: 'Protected route — unauthenticated', steps: ['Visit /explore without login'], expected: 'Redirected to /login automatically', priority: 'Critical' },
            { id: 'TC-008', title: 'Logout', steps: ['Click Log Out in sidebar'], expected: 'Session cleared, redirected to login page', priority: 'High' },
            { id: 'TC-009', title: 'Forgot Password flow', steps: ['Click forgot password', 'Enter email', 'Check email for reset link'], expected: 'Reset email sent, success message shown', priority: 'Medium' },
        ]
    },
    {
        id: 'admin-topics',
        icon: Settings,
        color: 'text-violet-600',
        bg: 'bg-violet-500/10',
        title: 'Admin — Topic Management',
        description: 'Create, edit, delete, hide/show topics',
        cases: [
            { id: 'TC-010', title: 'Create Topic — valid data', steps: ['Go to /topics', 'Click Add Topic', 'Enter name, description, color', 'Click Save'], expected: 'Topic created, appears in grid immediately', priority: 'Critical' },
            { id: 'TC-011', title: 'Create Topic — missing name', steps: ['Submit form without name'], expected: 'Error: "Topic name is required"', priority: 'High' },
            { id: 'TC-012', title: 'Upload topic logo', steps: ['Click Upload Logo', 'Select image file'], expected: 'Image uploaded, preview shown in form', priority: 'Medium' },
            { id: 'TC-013', title: 'Edit Topic', steps: ['Click pencil icon on topic', 'Change name/description', 'Save'], expected: 'Topic updated, card reflects new data', priority: 'High' },
            { id: 'TC-014', title: 'Delete Topic', steps: ['Click trash icon', 'Confirm in dialog'], expected: 'Topic removed from grid, confirmation toast', priority: 'High' },
            { id: 'TC-015', title: 'Hide Topic', steps: ['Click eye-off icon on a visible topic'], expected: 'Topic badge changes to "Hidden", topic disappears from viewer explore page', priority: 'Critical' },
            { id: 'TC-016', title: 'Unhide Topic', steps: ['Click eye icon on hidden topic'], expected: 'Topic becomes visible again for viewers', priority: 'High' },
            { id: 'TC-017', title: 'Search Topics', steps: ['Type "Java" in search box'], expected: 'Only Java topic shown, others hidden', priority: 'Medium' },
            { id: 'TC-018', title: 'Hidden topic hides questions', steps: ['Hide "React" topic', 'Log in as viewer', 'Check All Questions page'], expected: 'React questions no longer visible to viewer', priority: 'Critical' },
        ]
    },
    {
        id: 'admin-questions',
        icon: TestTube2,
        color: 'text-emerald-600',
        bg: 'bg-emerald-500/10',
        title: 'Admin — Question Management',
        description: 'Add, edit, delete, filter, and manage question lifecycle',
        cases: [
            { id: 'TC-019', title: 'Create Question — Theory type', steps: ['Click Add Question', 'Select topic, enter title, difficulty, type=theory', 'Add answer & explanation', 'Click Save'], expected: 'Question created, appears in list with correct badges', priority: 'Critical' },
            { id: 'TC-020', title: 'Create MCQ question', steps: ['Set type = MCQ', 'Go to Code & MCQ tab', 'Add 4 options, select correct one', 'Save'], expected: 'Question saved with options and correct answer stored', priority: 'Critical' },
            { id: 'TC-021', title: 'AI Generate Answer', steps: ['Enter question title', 'Click AI Generate on Answer field'], expected: 'AI-generated answer populates in the textarea', priority: 'High' },
            { id: 'TC-022', title: 'AI Generate Explanation', steps: ['Enter question title', 'Click AI Generate on Explanation field'], expected: 'Detailed explanation with examples generated', priority: 'High' },
            { id: 'TC-023', title: 'Add company tags', steps: ['Go to Tags & Meta tab', 'Click Amazon, Google badges'], expected: 'Companies selected (filled badge style), stored on save', priority: 'Medium' },
            { id: 'TC-024', title: 'Filter questions by topic', steps: ['Select "Java" in topic dropdown filter'], expected: 'Only Java questions shown in list', priority: 'High' },
            { id: 'TC-025', title: 'Filter questions by difficulty', steps: ['Select "Experienced" in difficulty filter'], expected: 'Only experienced-level questions displayed', priority: 'High' },
            { id: 'TC-026', title: 'Search questions', steps: ['Type "event loop" in search'], expected: 'Node.js event loop question appears in results', priority: 'Medium' },
            { id: 'TC-027', title: 'Question status workflow', steps: ['Create draft question', 'Change status to review', 'Then to published'], expected: 'Status badge updates at each step, published questions visible to viewers', priority: 'Critical' },
            { id: 'TC-028', title: 'Hide/Show question', steps: ['Click eye-off on a question'], expected: 'Question hidden from viewers immediately', priority: 'High' },
            { id: 'TC-029', title: 'Delete question with confirmation', steps: ['Click delete icon', 'Confirm in alert dialog'], expected: 'Question removed, list refreshes', priority: 'High' },
            { id: 'TC-030', title: 'Add code snippet', steps: ['Go to Code & MCQ tab', 'Select language, enter code'], expected: 'Code saved and displayed with syntax highlighting on viewer side', priority: 'Medium' },
        ]
    },
    {
        id: 'viewer-study',
        icon: BookOpen,
        color: 'text-amber-600',
        bg: 'bg-amber-500/10',
        title: 'Viewer — Study & Progress',
        description: 'Topic study flow, progress tracking, notes, and bookmarks',
        cases: [
            { id: 'TC-031', title: 'View Viewer Dashboard', steps: ['Login as viewer', 'Go to /'], expected: 'Motivational hero banner, stat cards, topic progress cards all load', priority: 'Critical' },
            { id: 'TC-032', title: 'Start learning a topic', steps: ['Click "Start Learning" on Java card'], expected: 'Navigates to /study/{id}, first question shown', priority: 'Critical' },
            { id: 'TC-033', title: 'Auto-mark question as complete', steps: ['Open any question in study mode', 'Wait 2-3 seconds'], expected: 'Question auto-marked complete, progress bar updates', priority: 'Critical' },
            { id: 'TC-034', title: 'Manual mark question complete', steps: ['Click "Mark Done" button on question'], expected: 'Green checkmark appears, progress counter updates', priority: 'High' },
            { id: 'TC-035', title: 'Progress calculation accuracy', steps: ['Complete 2 of 5 Java questions'], expected: 'Dashboard shows Java at 40%, "2/5" count', priority: 'Critical' },
            { id: 'TC-036', title: 'Navigate Previous/Next questions', steps: ['Click Next button multiple times', 'Click Previous'], expected: 'Questions change with animation, progress maintained', priority: 'High' },
            { id: 'TC-037', title: 'Filter questions by difficulty in study', steps: ['Select "Experienced" in difficulty dropdown'], expected: 'Only experienced questions shown, index resets to 0', priority: 'Medium' },
            { id: 'TC-038', title: 'Reveal Answer', steps: ['Click "Reveal Answer" button'], expected: 'Answer and explanation slide in with green/blue styling', priority: 'High' },
            { id: 'TC-039', title: 'Bookmark a question', steps: ['Click bookmark icon on a question'], expected: 'Icon becomes filled, question appears in /bookmarks', priority: 'High' },
            { id: 'TC-040', title: 'Remove bookmark', steps: ['Click filled bookmark icon'], expected: 'Bookmark removed, question disappears from bookmarks page', priority: 'High' },
            { id: 'TC-041', title: 'Add personal note', steps: ['Click Personal Notes button', 'Type note text', 'Click Save'], expected: 'Note saved, note count badge appears', priority: 'High' },
            { id: 'TC-042', title: 'Edit and delete note', steps: ['Open existing note', 'Change text, save', 'Then delete'], expected: 'Note updates, then disappears completely', priority: 'Medium' },
            { id: 'TC-043', title: 'Question sidebar list', steps: ['Open study page', 'Click any question in right sidebar'], expected: 'Main panel navigates to that question', priority: 'Medium' },
            { id: 'TC-044', title: 'Code snippet renders correctly', steps: ['Open a coding question with code snippet'], expected: 'Dark code block shown with correct language label', priority: 'Medium' },
            { id: 'TC-045', title: 'Company tags visible on question', steps: ['Open a question tagged with Amazon, Google'], expected: 'Company badges shown with building icon', priority: 'Low' },
        ]
    },
    {
        id: 'quiz',
        icon: Brain,
        color: 'text-red-600',
        bg: 'bg-red-500/10',
        title: 'Quiz Module',
        description: 'Quiz setup, taking quiz, scoring, and history',
        cases: [
            { id: 'TC-046', title: 'Configure and start quiz', steps: ['Go to /quiz', 'Select topic, difficulty, question count', 'Click Start Quiz'], expected: 'Quiz begins with first MCQ question shown', priority: 'Critical' },
            { id: 'TC-047', title: 'Quiz with no MCQ questions', steps: ['Select a topic with no MCQ questions', 'Click Start'], expected: 'Error toast: "No MCQ questions available for this selection"', priority: 'High' },
            { id: 'TC-048', title: 'Answer correct option', steps: ['Click the correct option on a MCQ'], expected: 'Option highlights green, next question appears after 1.2s', priority: 'Critical' },
            { id: 'TC-049', title: 'Answer wrong option', steps: ['Click wrong option'], expected: 'Wrong option highlights red, correct option highlights green, next question loads', priority: 'Critical' },
            { id: 'TC-050', title: 'Quiz timer runs', steps: ['Start quiz', 'Watch timer'], expected: 'Timer counts up in MM:SS format', priority: 'High' },
            { id: 'TC-051', title: 'Progress indicator updates', steps: ['Answer each question', 'Watch progress bar'], expected: 'Progress bar fills as questions are answered', priority: 'Medium' },
            { id: 'TC-052', title: 'Quiz result screen', steps: ['Complete all quiz questions'], expected: 'Score %, correct/wrong counts, time taken shown with color-coded grade', priority: 'Critical' },
            { id: 'TC-053', title: 'Answer review after quiz', steps: ['Scroll down on result screen'], expected: 'List of all questions with ✅/❌ icons visible', priority: 'High' },
            { id: 'TC-054', title: 'Retry same quiz', steps: ['Click Retry on result screen'], expected: 'Same topic/difficulty quiz starts fresh with reshuffled questions', priority: 'Medium' },
            { id: 'TC-055', title: 'New quiz after completion', steps: ['Click New Quiz on result'], expected: 'Returns to quiz setup page', priority: 'Medium' },
            { id: 'TC-056', title: 'Quiz saved to history', steps: ['Complete a quiz', 'Go to /quiz-history'], expected: 'Quiz appears at top with score, topic, date, and time', priority: 'Critical' },
            { id: 'TC-057', title: 'Quiz history stats', steps: ['Complete multiple quizzes', 'Check /quiz-history'], expected: 'Avg score, best score, total quizzes stats calculated correctly', priority: 'High' },
            { id: 'TC-058', title: 'Score trend chart', steps: ['Complete 3+ quizzes', 'Check history page'], expected: 'Line chart shows score progression over time', priority: 'Medium' },
        ]
    },
    {
        id: 'explore-search',
        icon: Zap,
        color: 'text-cyan-600',
        bg: 'bg-cyan-500/10',
        title: 'Explore, Search & All Questions',
        description: 'Topic browsing, search, and multi-filter functionality',
        cases: [
            { id: 'TC-059', title: 'Explore topics page loads', steps: ['Go to /explore'], expected: 'All visible topics shown as cards with logo, progress, and button', priority: 'Critical' },
            { id: 'TC-060', title: 'Search topics', steps: ['Type "docker" in explore search'], expected: 'Only Docker card shown', priority: 'High' },
            { id: 'TC-061', title: 'Topic completion star badge', steps: ['Complete all questions in a topic'], expected: 'Gold star appears on topic card in explore page', priority: 'Medium' },
            { id: 'TC-062', title: 'All Questions page loads', steps: ['Go to /all-questions'], expected: 'All published, visible questions displayed as cards', priority: 'Critical' },
            { id: 'TC-063', title: 'Search questions by title', steps: ['Search "event loop"'], expected: 'Node.js event loop question appears', priority: 'High' },
            { id: 'TC-064', title: 'Filter by topic', steps: ['Select Java in topic dropdown'], expected: 'Only Java questions shown', priority: 'High' },
            { id: 'TC-065', title: 'Filter by difficulty', steps: ['Select Experienced'], expected: 'Only experienced questions shown', priority: 'High' },
            { id: 'TC-066', title: 'Filter by experience level', steps: ['Select Senior (6+yr)'], expected: 'Only senior-level questions shown', priority: 'Medium' },
            { id: 'TC-067', title: 'Filter by company', steps: ['Select Amazon in company dropdown'], expected: 'Only Amazon-tagged questions shown', priority: 'Medium' },
            { id: 'TC-068', title: 'Combined filters', steps: ['Set Topic=React, Difficulty=Basic'], expected: 'Only basic React questions shown', priority: 'High' },
            { id: 'TC-069', title: 'Clear all filters', steps: ['Apply filters', 'Click Clear button'], expected: 'All filters reset, all questions shown', priority: 'Medium' },
            { id: 'TC-070', title: 'Open question from All Questions', steps: ['Click Open on any question card'], expected: 'Navigates to /question/{id} detail page', priority: 'High' },
        ]
    },
    {
        id: 'achievements',
        icon: User,
        color: 'text-orange-600',
        bg: 'bg-orange-500/10',
        title: 'Achievements, Revision & Bookmarks',
        description: 'Badge system, revision center, and bookmark management',
        cases: [
            { id: 'TC-071', title: 'Achievements page loads', steps: ['Go to /achievements'], expected: 'Earned badges shown in color, locked badges shown greyed out', priority: 'High' },
            { id: 'TC-072', title: 'First Question badge earned', steps: ['Complete first question', 'Check achievements'], expected: '"First Step 🎯" badge now shows as earned', priority: 'High' },
            { id: 'TC-073', title: 'First Quiz badge', steps: ['Complete any quiz', 'Check achievements'], expected: '"Quiz Taker 🧠" badge earned', priority: 'High' },
            { id: 'TC-074', title: 'High Achiever badge (80%+)', steps: ['Score 80%+ on a quiz'], expected: '"High Achiever 🏆" badge earned', priority: 'Medium' },
            { id: 'TC-075', title: 'Revision Center — Bookmarked tab', steps: ['Go to /revision', 'Click Bookmarked tab'], expected: 'All bookmarked questions shown as cards', priority: 'High' },
            { id: 'TC-076', title: 'Revision Center — Wrong Answers tab', steps: ['Answer some quiz questions wrong', 'Check Wrong Answers tab'], expected: 'Incorrectly answered questions appear here', priority: 'High' },
            { id: 'TC-077', title: 'Revision Center — Unanswered tab', steps: ['Check Unanswered tab'], expected: 'Questions never viewed shown (up to 30)', priority: 'Medium' },
            { id: 'TC-078', title: 'Bookmarks page search', steps: ['Go to /bookmarks', 'Search for a question title'], expected: 'Only matching bookmarks shown', priority: 'Medium' },
            { id: 'TC-079', title: 'Remove bookmark from bookmarks page', steps: ['Click trash icon on a bookmark'], expected: 'Bookmark removed immediately, toast shown', priority: 'High' },
            { id: 'TC-080', title: 'Open bookmarked question', steps: ['Click Open on a bookmark'], expected: 'Navigates to question detail page', priority: 'Medium' },
        ]
    },
    {
        id: 'ux',
        icon: Zap,
        color: 'text-pink-600',
        bg: 'bg-pink-500/10',
        title: 'UI/UX & Cross-Cutting',
        description: 'Theme, responsiveness, empty states, loading, toast notifications',
        cases: [
            { id: 'TC-081', title: 'Dark/Light mode toggle', steps: ['Click moon/sun icon in sidebar'], expected: 'Entire app switches theme, persists on refresh', priority: 'High' },
            { id: 'TC-082', title: 'Mobile responsive — viewer dashboard', steps: ['Resize to 375px width', 'Check dashboard'], expected: 'Cards stack in 2 columns, hamburger menu works, no overflow', priority: 'High' },
            { id: 'TC-083', title: 'Mobile responsive — study page', steps: ['Open study page on mobile'], expected: 'Question panel full width, sidebar list hidden/below', priority: 'High' },
            { id: 'TC-084', title: 'Loading skeletons', steps: ['Open dashboard on slow network'], expected: 'Skeleton placeholders shown while data loads', priority: 'Medium' },
            { id: 'TC-085', title: 'Empty state — no topics', steps: ['Open explore page with no visible topics'], expected: 'Empty state illustration and message shown', priority: 'Medium' },
            { id: 'TC-086', title: 'Empty state — no questions', steps: ['Open All Questions with no data'], expected: 'Friendly empty state with icon and text', priority: 'Medium' },
            { id: 'TC-087', title: 'Toast notifications', steps: ['Create, update, or delete any item'], expected: 'Sonner toast appears bottom-right with correct message', priority: 'Medium' },
            { id: 'TC-088', title: 'Sidebar collapse (desktop)', steps: ['Click the small toggle button on sidebar edge'], expected: 'Sidebar collapses to icon-only mode, content expands', priority: 'Low' },
            { id: 'TC-089', title: 'Confirmation dialog before delete', steps: ['Click delete on any topic or question'], expected: 'Alert dialog appears asking for confirmation before proceeding', priority: 'High' },
            { id: 'TC-090', title: 'Framer Motion animations', steps: ['Navigate between pages, open questions'], expected: 'Smooth entrance animations on cards, question transitions', priority: 'Low' },
        ]
    }
];

const priorityConfig = {
    Critical: { color: 'bg-red-500/10 text-red-700 dark:text-red-400 border-red-500/20', dot: 'bg-red-500' },
    High: { color: 'bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20', dot: 'bg-amber-500' },
    Medium: { color: 'bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/20', dot: 'bg-blue-500' },
    Low: { color: 'bg-slate-500/10 text-slate-600 dark:text-slate-400 border-slate-500/20', dot: 'bg-slate-400' },
};

function SuiteCard({ suite }) {
    const [open, setOpen] = useState(false);
    const critical = suite.cases.filter(c => c.priority === 'Critical').length;
    const high = suite.cases.filter(c => c.priority === 'High').length;

    return (
        <Card className="rounded-2xl overflow-hidden border-border hover:shadow-md transition-all">
            <button onClick={() => setOpen(!open)} className="w-full text-left">
                <div className="p-5 flex items-center gap-4">
                    <div className={`p-2.5 rounded-xl ${suite.bg} flex-shrink-0`}>
                        <suite.icon className={`w-5 h-5 ${suite.color}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                            <h3 className="font-bold text-foreground">{suite.title}</h3>
                            <span className="text-xs text-muted-foreground">({suite.cases.length} tests)</span>
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5">{suite.description}</p>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-red-500/10 text-red-600 font-semibold">{critical} Critical</span>
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-600 font-semibold">{high} High</span>
                        {open ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
                    </div>
                </div>
            </button>

            <AnimatePresence>
                {open && (
                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                        <div className="border-t border-border divide-y divide-border">
                            {suite.cases.map(tc => {
                                const pc = priorityConfig[tc.priority];
                                return (
                                    <div key={tc.id} className="px-5 py-4">
                                        <div className="flex items-start gap-3">
                                            <div className="flex-shrink-0 mt-0.5">
                                                <CheckCircle2 className="w-4 h-4 text-muted-foreground/40" />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex flex-wrap items-center gap-2 mb-1">
                                                    <span className="text-[10px] font-mono font-semibold text-muted-foreground bg-muted px-2 py-0.5 rounded">{tc.id}</span>
                                                    <span className={`text-[10px] px-2 py-0.5 rounded-full border font-semibold ${pc.color}`}>{tc.priority}</span>
                                                </div>
                                                <p className="text-sm font-semibold text-foreground mb-2">{tc.title}</p>
                                                <div className="grid sm:grid-cols-2 gap-3">
                                                    <div>
                                                        <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1">Steps</p>
                                                        <ol className="space-y-0.5">
                                                            {tc.steps.map((s, i) => (
                                                                <li key={i} className="text-xs text-muted-foreground flex gap-1.5">
                                                                    <span className="text-primary font-semibold flex-shrink-0">{i + 1}.</span>{s}
                                                                </li>
                                                            ))}
                                                        </ol>
                                                    </div>
                                                    <div>
                                                        <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1">Expected Result</p>
                                                        <p className="text-xs text-foreground bg-emerald-500/5 border border-emerald-500/20 rounded-xl px-3 py-2">{tc.expected}</p>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </Card>
    );
}

export default function TestCasesDoc() {
    const totalCases = TEST_SUITES.reduce((a, s) => a + s.cases.length, 0);
    const critical = TEST_SUITES.reduce((a, s) => a + s.cases.filter(c => c.priority === 'Critical').length, 0);
    const high = TEST_SUITES.reduce((a, s) => a + s.cases.filter(c => c.priority === 'High').length, 0);
    const medium = TEST_SUITES.reduce((a, s) => a + s.cases.filter(c => c.priority === 'Medium').length, 0);
    const low = TEST_SUITES.reduce((a, s) => a + s.cases.filter(c => c.priority === 'Low').length, 0);

    return (
        <div className="space-y-6 max-w-5xl">
            {/* Header */}
            <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 to-slate-800 p-8 text-white">
                <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 rounded-full -translate-y-1/3 translate-x-1/3" />
                <div className="relative z-10">
                    <div className="flex items-center gap-2 mb-2">
                        <TestTube2 className="w-5 h-5 text-primary" />
                        <span className="text-xs font-semibold text-white/60 uppercase tracking-widest">QA Documentation</span>
                    </div>
                    <h1 className="text-3xl font-black mb-2">Test Case Suite</h1>
                    <p className="text-white/70 text-sm max-w-xl">Comprehensive test cases for TechPrep Interview Platform — covering all modules, user flows, edge cases, and UI/UX scenarios.</p>
                    <div className="flex flex-wrap gap-3 mt-5">
                        <div className="bg-white/10 backdrop-blur rounded-xl px-4 py-2 text-center">
                            <p className="text-2xl font-black">{totalCases}</p>
                            <p className="text-xs text-white/60">Total Tests</p>
                        </div>
                        <div className="bg-red-500/20 rounded-xl px-4 py-2 text-center">
                            <p className="text-2xl font-black text-red-300">{critical}</p>
                            <p className="text-xs text-red-300/70">Critical</p>
                        </div>
                        <div className="bg-amber-500/20 rounded-xl px-4 py-2 text-center">
                            <p className="text-2xl font-black text-amber-300">{high}</p>
                            <p className="text-xs text-amber-300/70">High</p>
                        </div>
                        <div className="bg-blue-500/20 rounded-xl px-4 py-2 text-center">
                            <p className="text-2xl font-black text-blue-300">{medium}</p>
                            <p className="text-xs text-blue-300/70">Medium</p>
                        </div>
                        <div className="bg-slate-500/20 rounded-xl px-4 py-2 text-center">
                            <p className="text-2xl font-black text-slate-300">{low}</p>
                            <p className="text-xs text-slate-300/70">Low</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Info */}
            <Card className="rounded-2xl border-amber-500/20 bg-amber-500/5">
                <CardContent className="p-4 flex gap-3">
                    <AlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                    <div className="text-sm">
                        <p className="font-semibold text-amber-700 dark:text-amber-400">How to use these test cases</p>
                        <p className="text-muted-foreground text-xs mt-0.5">Click each suite to expand its test cases. For automated testing, use Base44's Testing Agent — click the test-tube icon in the side panel and describe the goal in plain English (e.g. "Login as admin and create a new topic"). Run Critical tests first before High and Medium.</p>
                    </div>
                </CardContent>
            </Card>

            {/* Priority Legend */}
            <div className="flex flex-wrap gap-3">
                {Object.entries(priorityConfig).map(([p, c]) => (
                    <div key={p} className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full border font-semibold ${c.color}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${c.dot}`} />{p}
                    </div>
                ))}
                <span className="text-xs text-muted-foreground self-center ml-2">— Run in priority order: Critical → High → Medium → Low</span>
            </div>

            {/* Test Suites */}
            <div className="space-y-3">
                {TEST_SUITES.map(suite => <SuiteCard key={suite.id} suite={suite} />)}
            </div>

            <div className="text-center py-4">
                <p className="text-xs text-muted-foreground">TechPrep QA Suite • {totalCases} test cases across {TEST_SUITES.length} modules • Version 1.0</p>
            </div>
        </div>
    );
}