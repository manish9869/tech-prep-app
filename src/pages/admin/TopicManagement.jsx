import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Topic } from '@/api/entities';
import { uploadFile } from '@/api/entities';
import PageHeader from '@/components/shared/PageHeader';
import EmptyState from '@/components/shared/EmptyState';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Plus, Search, Pencil, Trash2, Eye, EyeOff, BookOpen, Upload, Wand2 } from 'lucide-react';
import { toast } from 'sonner';
import { motion } from 'framer-motion';

const defaultTopic = { name: '', description: '', logo_url: '', is_visible: true, color: '#6366f1' };

const TECH_LOGOS = {
    java: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/java/java-original.svg',
    javascript: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/javascript/javascript-original.svg',
    python: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/python/python-original.svg',
    react: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/react/react-original.svg',
    nodejs: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/nodejs/nodejs-original.svg',
    'node.js': 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/nodejs/nodejs-original.svg',
    typescript: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/typescript/typescript-original.svg',
    angular: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/angularjs/angularjs-original.svg',
    vue: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/vuejs/vuejs-original.svg',
    'vue.js': 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/vuejs/vuejs-original.svg',
    docker: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/docker/docker-original.svg',
    kubernetes: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/kubernetes/kubernetes-plain.svg',
    aws: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/amazonwebservices/amazonwebservices-original.svg',
    mongodb: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/mongodb/mongodb-original.svg',
    mysql: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/mysql/mysql-original.svg',
    postgresql: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/postgresql/postgresql-original.svg',
    postgres: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/postgresql/postgresql-original.svg',
    redis: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/redis/redis-original.svg',
    go: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/go/go-original.svg',
    golang: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/go/go-original.svg',
    rust: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/rust/rust-plain.svg',
    kotlin: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/kotlin/kotlin-original.svg',
    swift: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/swift/swift-original.svg',
    'c++': 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/cplusplus/cplusplus-original.svg',
    'c#': 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/csharp/csharp-original.svg',
    php: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/php/php-original.svg',
    spring: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/spring/spring-original.svg',
    django: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/django/django-plain.svg',
    flutter: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/flutter/flutter-original.svg',
    git: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/git/git-original.svg',
    linux: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/linux/linux-original.svg',
    nextjs: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/nextjs/nextjs-original.svg',
    'next.js': 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/nextjs/nextjs-original.svg',
    graphql: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/graphql/graphql-plain.svg',
};

function suggestLogo(name) {
    return TECH_LOGOS[name.toLowerCase().trim()] || null;
}

export default function TopicManagement() {
    const [search, setSearch] = useState('');
    const [dialogOpen, setDialogOpen] = useState(false);
    const [editTopic, setEditTopic] = useState(null);
    const [formData, setFormData] = useState(defaultTopic);
    const [deleteId, setDeleteId] = useState(null);
    const [uploading, setUploading] = useState(false);
    const qc = useQueryClient();

    const { data: topics = [], isLoading } = useQuery({
        queryKey: ['topics'],
        queryFn: () => Topic.list(),
    });

    const createMut = useMutation({
        mutationFn: d => Topic.create(d),
        onSuccess: () => { qc.invalidateQueries({ queryKey: ['topics'] }); setDialogOpen(false); toast.success('Topic created'); }
    });
    const updateMut = useMutation({
        mutationFn: ({ id, d }) => Topic.update(id, d),
        onSuccess: () => { qc.invalidateQueries({ queryKey: ['topics'] }); setDialogOpen(false); toast.success('Topic updated'); }
    });
    const deleteMut = useMutation({
        mutationFn: id => Topic.delete(id),
        onSuccess: () => { qc.invalidateQueries({ queryKey: ['topics'] }); setDeleteId(null); toast.success('Topic deleted'); }
    });
    const toggleMut = useMutation({
        mutationFn: ({ id, val }) => Topic.update(id, { is_visible: val }),
        onSuccess: () => { qc.invalidateQueries({ queryKey: ['topics'] }); toast.success('Visibility updated'); }
    });

    const openCreate = () => { setEditTopic(null); setFormData(defaultTopic); setDialogOpen(true); };
    const openEdit = t => {
        setEditTopic(t);
        setFormData({ name: t.name, description: t.description || '', logo_url: t.logo_url || '', is_visible: t.is_visible !== false, color: t.color || '#6366f1' });
        setDialogOpen(true);
    };

    const handleSave = () => {
        if (!formData.name.trim()) return toast.error('Topic name is required');
        if (editTopic) updateMut.mutate({ id: editTopic.id, d: formData });
        else createMut.mutate(formData);
    };

    // ✅ Changed: use Supabase storage instead of base44.integrations.Core.UploadFile
    const handleLogoUpload = async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setUploading(true);
        try {
            const { file_url } = await uploadFile(file, 'uploads', 'topics');
            setFormData(f => ({ ...f, logo_url: file_url }));
        } catch (err) {
            toast.error('Upload failed');
        } finally {
            setUploading(false);
        }
    };

    const filtered = topics.filter(t => t.name?.toLowerCase().includes(search.toLowerCase()));

    return (
        <div className="space-y-6">
            <PageHeader
                title="Topics"
                description={`${topics.length} topics total`}
                actions={<Button onClick={openCreate}><Plus className="w-4 h-4 mr-2" />Add Topic</Button>}
            />

            <div className="relative max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input placeholder="Search topics..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
            </div>

            {isLoading ? (
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {Array(6).fill(0).map((_, i) => <div key={i} className="h-44 bg-muted rounded-2xl animate-pulse" />)}
                </div>
            ) : filtered.length === 0 ? (
                <EmptyState icon={BookOpen} title="No topics found" description="Create your first topic to get started"
                    action={<Button onClick={openCreate}><Plus className="w-4 h-4 mr-2" />Create Topic</Button>} />
            ) : (
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filtered.map((t, i) => (
                        <motion.div key={t.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
                            <div className={`overflow-hidden border transition-all hover:-translate-y-0.5 hover:shadow-lg ${!t.is_visible ? 'opacity-55' : ''}`}
                                style={{ background: `linear-gradient(135deg, hsl(var(--card)) 0%, ${t.color || '#6366f1'}0a 100%)`, borderColor: `${t.color || '#6366f1'}30` }}>
                                <div className="h-1 w-full" style={{ background: `linear-gradient(90deg, ${t.color || '#6366f1'}, ${t.color || '#6366f1'}44)` }} />
                                <div className="p-5">
                                    <div className="flex items-start gap-3">
                                        {t.logo_url ? (
                                            <img src={t.logo_url} alt={t.name} className="w-12 h-12 object-contain p-1 border border-border bg-muted/30" />
                                        ) : (
                                            <div className="w-12 h-12 flex items-center justify-center text-white font-black text-lg flex-shrink-0"
                                                style={{ background: t.color || '#6366f1' }}>{t.name?.[0]?.toUpperCase()}</div>
                                        )}
                                        <div className="flex-1 min-w-0">
                                            <h3 className="font-black text-foreground truncate">{t.name}</h3>
                                            <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">{t.description || 'No description'}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center justify-between mt-4 pt-3 border-t" style={{ borderColor: `${t.color || '#6366f1'}20` }}>
                                        <span className={`text-[9px] font-black uppercase tracking-widest px-2 py-0.5 ${t.is_visible ? 'bg-emerald-500/10 text-emerald-600' : 'bg-amber-500/10 text-amber-600'}`}>
                                            {t.is_visible ? '● Visible' : '○ Hidden'}
                                        </span>
                                        <div className="flex gap-1">
                                            <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => toggleMut.mutate({ id: t.id, val: !t.is_visible })}>
                                                {t.is_visible ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                                            </Button>
                                            <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => openEdit(t)}>
                                                <Pencil className="w-3.5 h-3.5" />
                                            </Button>
                                            <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive" onClick={() => setDeleteId(t.id)}>
                                                <Trash2 className="w-3.5 h-3.5" />
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </div>
            )}

            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogContent className="max-w-lg">
                    <DialogHeader><DialogTitle>{editTopic ? 'Edit Topic' : 'Create Topic'}</DialogTitle></DialogHeader>
                    <div className="space-y-4">
                        <div>
                            <Label>Topic Name *</Label>
                            <Input value={formData.name} onChange={e => setFormData(f => ({ ...f, name: e.target.value }))} placeholder="e.g. Java, React, AWS" className="mt-1" />
                        </div>
                        <div>
                            <Label>Description</Label>
                            <Textarea value={formData.description} onChange={e => setFormData(f => ({ ...f, description: e.target.value }))} placeholder="Brief description..." className="mt-1" rows={3} />
                        </div>
                        <div>
                            <Label>Logo Image</Label>
                            <div className="mt-1 flex items-center gap-3 flex-wrap">
                                {formData.logo_url && <img src={formData.logo_url} alt="" className="w-12 h-12 object-contain border border-border bg-muted/30 p-1" />}
                                <label className="cursor-pointer">
                                    <div className="flex items-center gap-2 px-3 py-2 border text-sm hover:bg-muted transition-colors">
                                        <Upload className="w-4 h-4" />
                                        {uploading ? 'Uploading...' : 'Upload Logo'}
                                    </div>
                                    <input type="file" className="hidden" accept="image/*" onChange={handleLogoUpload} />
                                </label>
                                {suggestLogo(formData.name) && !formData.logo_url && (
                                    <Button type="button" variant="outline" size="sm" className="h-9 text-xs border-primary/40 text-primary hover:bg-primary/10"
                                        onClick={() => setFormData(f => ({ ...f, logo_url: suggestLogo(f.name) }))}>
                                        <Wand2 className="w-3.5 h-3.5 mr-1.5" /> Auto-fill Logo
                                    </Button>
                                )}
                            </div>
                            {formData.logo_url && (
                                <button onClick={() => setFormData(f => ({ ...f, logo_url: '' }))} className="text-[10px] text-destructive mt-1 hover:underline">Remove logo</button>
                            )}
                        </div>
                        <div>
                            <Label>Theme Color</Label>
                            <Input type="color" value={formData.color} onChange={e => setFormData(f => ({ ...f, color: e.target.value }))} className="mt-1 h-10 w-20" />
                        </div>
                        <div className="flex items-center gap-2">
                            <Switch checked={formData.is_visible} onCheckedChange={v => setFormData(f => ({ ...f, is_visible: v }))} />
                            <Label>Visible to viewers</Label>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
                        <Button onClick={handleSave} disabled={createMut.isPending || updateMut.isPending}>
                            {createMut.isPending || updateMut.isPending ? 'Saving...' : 'Save'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Delete Topic?</AlertDialogTitle>
                        <AlertDialogDescription>This action cannot be undone.</AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={() => deleteMut.mutate(deleteId)} className="bg-destructive text-destructive-foreground">Delete</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}