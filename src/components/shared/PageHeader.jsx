import React from 'react';

export default function PageHeader({ title, description, actions, badge }) {
    return (
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-8 pb-6 border-b border-border">
            <div>
                {badge && (
                    <span className="inline-block text-[9px] font-black uppercase tracking-[0.2em] text-primary bg-primary/10 px-2.5 py-1 mb-3 border-l-2 border-primary">
                        {badge}
                    </span>
                )}
                <h1 className="text-2xl md:text-3xl font-black text-foreground tracking-tight leading-none">{title}</h1>
                {description && <p className="text-sm text-muted-foreground mt-2 max-w-2xl leading-relaxed">{description}</p>}
            </div>
            {actions && <div className="flex items-center gap-3 flex-shrink-0">{actions}</div>}
        </div>
    );
}