import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { cn } from '@/lib/utils';
import Sidebar from './Sidebar';
import MobileNav from './MobileNav';

export default function AppLayout({ user }) {
    const [collapsed, setCollapsed] = useState(false);

    return (
        <div className="min-h-screen bg-background">
            <div className="hidden lg:block">
                <Sidebar user={user} collapsed={collapsed} onToggle={() => setCollapsed(!collapsed)} />
            </div>
            <MobileNav user={user} />
            <main className={cn(
                "transition-all duration-300 min-h-screen",
                "pt-14 lg:pt-0",
                collapsed ? "lg:ml-[68px]" : "lg:ml-[260px]"
            )}>
                <div className="p-4 md:p-6 lg:p-8 max-w-[1440px] mx-auto">
                    <Outlet />
                </div>
            </main>
        </div>
    );
}