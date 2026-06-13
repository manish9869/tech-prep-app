import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { useTheme } from '@/lib/ThemeContext';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/lib/AuthContext';
import { PageVisibility } from '@/api/entities';
import {
    LayoutDashboard, BookOpen, FileQuestion,
    Bookmark, Trophy, Clock, Brain, Sun, Moon, LogOut, ChevronLeft,
    ChevronRight, Target, TestTube2, Upload, Mic, User, TrendingUp, Code2, Map, Eye, FileSearch
} from 'lucide-react';

const adminLinks = [
    { to: '/', icon: LayoutDashboard, label: 'Dashboard' },
    { to: '/topics', icon: BookOpen, label: 'Topics' },
    { to: '/questions', icon: FileQuestion, label: 'Questions' },
    { to: '/roadmap-manager', icon: Map, label: 'Roadmap Manager' },
    { to: '/page-visibility', icon: Eye, label: 'Page Visibility' },
    { to: '/import-export', icon: Upload, label: 'Import / Export' },
    { to: '/test-cases', icon: TestTube2, label: 'Test Cases' },
];

const ALL_VIEWER_LINKS = [
    { to: '/', icon: LayoutDashboard, label: 'Dashboard', alwaysShow: true },
    { to: '/explore', icon: BookOpen, label: 'Explore Topics' },
    { to: '/all-questions', icon: FileQuestion, label: 'All Questions' },
    { to: '/quiz', icon: Brain, label: 'Quiz' },
    { to: '/mock-interview', icon: Mic, label: 'Mock Interview' },
    { to: '/code-editor', icon: Code2, label: 'Code Editor' },
    { to: '/roadmap', icon: Map, label: 'Roadmap' },
    { to: '/bookmarks', icon: Bookmark, label: 'Bookmarks' },
    { to: '/revision', icon: Target, label: 'Revision Center' },
    { to: '/quiz-history', icon: Clock, label: 'Quiz History' },
    { to: '/achievements', icon: Trophy, label: 'Achievements' },
    { to: '/analytics', icon: TrendingUp, label: 'Analytics' },
    { to: '/resume-analyzer', icon: FileSearch, label: 'Resume Analyzer' },
    { to: '/profile', icon: User, label: 'My Profile' },
];

export default function Sidebar({ user, collapsed, onToggle }) {
    const location = useLocation();
    const { theme, toggleTheme } = useTheme();
    const { logout } = useAuth();
    const isAdmin = user?.role === 'admin';

    // ✅ Changed: use Supabase entity instead of base44
    const { data: pageVisibility = [] } = useQuery({
        queryKey: ['page-visibility'],
        queryFn: () => PageVisibility.list(),
        enabled: !isAdmin,
        staleTime: 30000,
    });

    const viewerLinks = !isAdmin
        ? ALL_VIEWER_LINKS.filter(link => {
            if (link.alwaysShow || link.to === '/') return true;
            const record = pageVisibility.find(p => p.page_key === link.to);
            if (!record) return true;
            return record.is_visible !== false;
        })
        : [];

    const links = isAdmin ? adminLinks : viewerLinks;

    return (
        <aside
            className={cn(
                'fixed left-0 top-0 z-40 h-screen flex flex-col transition-all duration-300',
                'border-r',
                collapsed ? 'w-[64px]' : 'w-[256px]'
            )}
            style={{
                background: 'hsl(var(--sidebar-background))',
                borderColor: 'hsl(var(--sidebar-border))',
            }}
        >
            {/* Logo */}
            <div
                className="h-16 flex items-center px-4 gap-3 border-b flex-shrink-0"
                style={{ borderColor: 'hsl(var(--sidebar-border))' }}
            >
                {collapsed ? (
                    <div
                        className="w-8 h-8 flex items-center justify-center flex-shrink-0 font-black text-base"
                        style={{ background: 'hsl(var(--sidebar-primary))', color: 'hsl(var(--sidebar-primary-foreground))' }}
                    >
                        T
                    </div>
                ) : (
                    <div className="flex items-center gap-3 min-w-0 overflow-hidden">
                        <div
                            className="w-9 h-9 flex items-center justify-center flex-shrink-0 font-black text-lg"
                            style={{ background: 'hsl(var(--sidebar-primary))', color: 'hsl(var(--sidebar-primary-foreground))' }}
                        >
                            T
                        </div>
                        <div className="min-w-0">
                            <div className="flex items-baseline gap-1.5">
                                <span className="font-black text-base tracking-tight font-heading leading-none" style={{ color: 'hsl(var(--sidebar-heading))' }}>Tech</span>
                                <span className="font-black text-base tracking-tight font-heading leading-none" style={{ color: 'hsl(var(--sidebar-primary))' }}>Prep</span>
                            </div>
                            <p className="text-[9px] uppercase tracking-[0.18em] mt-0.5" style={{ color: 'hsl(var(--sidebar-foreground))' }}>
                                Interview Mastery
                            </p>
                        </div>
                    </div>
                )}
            </div>

            {/* Nav */}
            <nav className="flex-1 py-3 px-2 overflow-y-auto scrollbar-thin space-y-px">
                {!collapsed && (
                    <p className="text-[9px] font-bold uppercase tracking-[0.15em] px-3 mb-2 mt-1" style={{ color: 'hsl(var(--sidebar-foreground) / 0.4)' }}>
                        {isAdmin ? 'Admin' : 'Menu'}
                    </p>
                )}
                {links.map(link => {
                    const isActive = location.pathname === link.to || (link.to !== '/' && location.pathname.startsWith(link.to));
                    return (
                        <Link key={link.to} to={link.to}>
                            <div
                                className={cn('flex items-center gap-3 px-3 py-2 text-sm font-medium transition-all duration-150', collapsed ? 'justify-center' : '')}
                                style={
                                    isActive
                                        ? { background: 'hsl(var(--sidebar-accent))', color: 'hsl(var(--sidebar-accent-foreground))', borderLeft: '2px solid hsl(var(--sidebar-primary))' }
                                        : { color: 'hsl(var(--sidebar-foreground))', borderLeft: '2px solid transparent' }
                                }
                                onMouseEnter={e => { if (!isActive) { e.currentTarget.style.background = 'hsl(var(--sidebar-accent) / 0.5)'; e.currentTarget.style.color = 'hsl(var(--sidebar-heading))'; } }}
                                onMouseLeave={e => { if (!isActive) { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'hsl(var(--sidebar-foreground))'; } }}
                            >
                                <link.icon className="w-4 h-4 flex-shrink-0" />
                                {!collapsed && <span className="truncate">{link.label}</span>}
                            </div>
                        </Link>
                    );
                })}
            </nav>

            {/* Bottom */}
            <div className="p-2 border-t space-y-px flex-shrink-0" style={{ borderColor: 'hsl(var(--sidebar-border))' }}>
                <button
                    onClick={toggleTheme}
                    className="flex items-center gap-3 px-3 py-2 text-sm font-medium w-full transition-all duration-150"
                    style={{ color: 'hsl(var(--sidebar-foreground))', borderLeft: '2px solid transparent' }}
                    onMouseEnter={e => { e.currentTarget.style.background = 'hsl(var(--sidebar-accent) / 0.5)'; e.currentTarget.style.color = 'hsl(var(--sidebar-heading))'; }}
                    onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'hsl(var(--sidebar-foreground))'; }}
                >
                    {theme === 'dark' ? <Sun className="w-4 h-4 flex-shrink-0" /> : <Moon className="w-4 h-4 flex-shrink-0" />}
                    {!collapsed && <span>{theme === 'dark' ? 'Light Mode' : 'Dark Mode'}</span>}
                </button>

                {/* ✅ Changed: use logout from useAuth instead of base44.auth.logout() */}
                <button
                    onClick={logout}
                    className="flex items-center gap-3 px-3 py-2 text-sm font-medium w-full transition-all duration-150"
                    style={{ color: 'hsl(4 72% 58%)', borderLeft: '2px solid transparent' }}
                    onMouseEnter={e => { e.currentTarget.style.background = 'hsl(4 72% 58% / 0.08)'; }}
                    onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}
                >
                    <LogOut className="w-4 h-4 flex-shrink-0" />
                    {!collapsed && <span>Log Out</span>}
                </button>
            </div>

            {/* Collapse toggle */}
            <button
                onClick={onToggle}
                className="absolute -right-3 top-16 w-6 h-6 flex items-center justify-center shadow-md border transition-colors z-10"
                style={{ background: 'hsl(var(--sidebar-background))', borderColor: 'hsl(var(--sidebar-border))', color: 'hsl(var(--sidebar-foreground))' }}
                onMouseEnter={e => { e.currentTarget.style.background = 'hsl(var(--sidebar-accent))'; }}
                onMouseLeave={e => { e.currentTarget.style.background = 'hsl(var(--sidebar-background))'; }}
            >
                {collapsed ? <ChevronRight className="w-3 h-3" /> : <ChevronLeft className="w-3 h-3" />}
            </button>
        </aside>
    );
}