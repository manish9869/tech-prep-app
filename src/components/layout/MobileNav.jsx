import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useTheme } from '@/lib/ThemeContext';
import { useAuth } from '@/lib/AuthContext';
import {
    LayoutDashboard, BookOpen, FileQuestion,
    Bookmark, Trophy, Clock, Brain, Sun, Moon, LogOut,
    Menu, Target, TestTube2, Upload, Mic, User, TrendingUp, Code2
} from 'lucide-react';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';

const adminLinks = [
    { to: '/', icon: LayoutDashboard, label: 'Dashboard' },
    { to: '/topics', icon: BookOpen, label: 'Topics' },
    { to: '/questions', icon: FileQuestion, label: 'Questions' },
    { to: '/import-export', icon: Upload, label: 'Import / Export' },
    { to: '/test-cases', icon: TestTube2, label: 'Test Cases' },
];

const viewerLinks = [
    { to: '/', icon: LayoutDashboard, label: 'Dashboard' },
    { to: '/explore', icon: BookOpen, label: 'Explore Topics' },
    { to: '/all-questions', icon: FileQuestion, label: 'All Questions' },
    { to: '/quiz', icon: Brain, label: 'Quiz' },
    { to: '/mock-interview', icon: Mic, label: 'Mock Interview' },
    { to: '/code-editor', icon: Code2, label: 'Code Editor' },
    { to: '/bookmarks', icon: Bookmark, label: 'Bookmarks' },
    { to: '/revision', icon: Target, label: 'Revision Center' },
    { to: '/quiz-history', icon: Clock, label: 'Quiz History' },
    { to: '/achievements', icon: Trophy, label: 'Achievements' },
    { to: '/analytics', icon: TrendingUp, label: 'Analytics' },
    { to: '/profile', icon: User, label: 'My Profile' },
];

export default function MobileNav({ user }) {
    const [open, setOpen] = useState(false);
    const location = useLocation();
    const { theme, toggleTheme } = useTheme();
    const { logout } = useAuth();
    const isAdmin = user?.role === 'admin';
    const links = isAdmin ? adminLinks : viewerLinks;

    return (
        <div className="lg:hidden fixed top-0 left-0 right-0 z-50 h-14 bg-card border-b border-border flex items-center justify-between px-4">
            <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 bg-primary flex items-center justify-center flex-shrink-0 font-black text-primary-foreground text-sm">T</div>
                <div className="flex items-baseline gap-1">
                    <span className="font-black text-sm tracking-tight text-foreground">Tech</span>
                    <span className="font-black text-sm tracking-tight text-primary">Prep</span>
                </div>
            </div>

            <Sheet open={open} onOpenChange={setOpen}>
                <SheetTrigger asChild>
                    <button className="p-2 hover:bg-muted transition-colors">
                        <Menu className="w-5 h-5" />
                    </button>
                </SheetTrigger>
                <SheetContent side="left" className="w-[272px] p-0 border-r" style={{ background: 'hsl(var(--sidebar-background))', borderColor: 'hsl(var(--sidebar-border))' }}>
                    <div className="h-14 flex items-center px-4 gap-3 border-b flex-shrink-0" style={{ borderColor: 'hsl(var(--sidebar-border))' }}>
                        <div className="w-8 h-8 flex items-center justify-center flex-shrink-0 font-black text-sm" style={{ background: 'hsl(var(--sidebar-primary))', color: 'hsl(var(--sidebar-primary-foreground))' }}>T</div>
                        <div className="flex items-baseline gap-1">
                            <span className="font-black text-sm font-heading" style={{ color: 'hsl(var(--sidebar-heading))' }}>Tech</span>
                            <span className="font-black text-sm font-heading" style={{ color: 'hsl(var(--sidebar-primary))' }}>Prep</span>
                        </div>
                    </div>

                    <nav className="py-3 px-2 space-y-px overflow-y-auto scrollbar-thin" style={{ maxHeight: 'calc(100vh - 120px)' }}>
                        <p className="text-[9px] font-bold uppercase tracking-[0.15em] px-3 mb-2" style={{ color: 'hsl(var(--sidebar-foreground) / 0.4)' }}>
                            {isAdmin ? 'Admin' : 'Menu'}
                        </p>
                        {links.map(link => {
                            const isActive = location.pathname === link.to || (link.to !== '/' && location.pathname.startsWith(link.to));
                            return (
                                <Link key={link.to} to={link.to} onClick={() => setOpen(false)}>
                                    <div
                                        className="flex items-center gap-3 px-3 py-2 text-sm font-medium transition-all duration-150"
                                        style={isActive
                                            ? { background: 'hsl(var(--sidebar-accent))', color: 'hsl(var(--sidebar-accent-foreground))', borderLeft: '2px solid hsl(var(--sidebar-primary))' }
                                            : { color: 'hsl(var(--sidebar-foreground))', borderLeft: '2px solid transparent' }
                                        }
                                    >
                                        <link.icon className="w-4 h-4 flex-shrink-0" />
                                        <span>{link.label}</span>
                                    </div>
                                </Link>
                            );
                        })}
                    </nav>

                    <div className="absolute bottom-0 left-0 right-0 p-2 border-t space-y-px" style={{ borderColor: 'hsl(var(--sidebar-border))' }}>
                        <button
                            onClick={toggleTheme}
                            className="flex items-center gap-3 px-3 py-2 text-sm font-medium w-full transition-colors"
                            style={{ color: 'hsl(var(--sidebar-foreground))', borderLeft: '2px solid transparent' }}
                        >
                            {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
                            <span>{theme === 'dark' ? 'Light Mode' : 'Dark Mode'}</span>
                        </button>

                        {/* ✅ Changed: use logout from useAuth instead of base44.auth.logout() */}
                        <button
                            onClick={logout}
                            className="flex items-center gap-3 px-3 py-2 text-sm font-medium w-full transition-colors"
                            style={{ color: 'hsl(4 72% 58%)', borderLeft: '2px solid transparent' }}
                        >
                            <LogOut className="w-4 h-4" />
                            <span>Log Out</span>
                        </button>
                    </div>
                </SheetContent>
            </Sheet>
        </div>
    );
}