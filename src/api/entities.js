import { supabase } from '@/api/supabaseClient'

// ── Add new tables here — CRUD is auto-generated ──────────────────────────────
const TABLE_MAP = {
    Topic: 'topics',
    Question: 'questions',
    Company: 'companies',
    Bookmark: 'bookmarks',
    Note: 'notes',
    Progress: 'progress',
    QuizAttempt: 'quiz_attempts',
    ResumeAnalysis: 'resume_analyses',
    RoadmapTopic: 'roadmap_topics',
    PageVisibility: 'page_visibility',
    Profile: 'profiles',
}

// ── Tables that don't have created_at — map to their actual timestamp column ──
const ORDER_COLUMN_MAP = {
    progress: 'completed_at',
}

function getOrderColumn(tableName, requestedColumn = 'created_at') {
    if (requestedColumn === 'created_at') {
        return ORDER_COLUMN_MAP[tableName] ?? 'created_at'
    }
    return requestedColumn
}

// ── Generic entity factory ────────────────────────────────────────────────────
function makeEntity(tableName) {
    return {

        // Fetch all rows
        async list(orderBy = 'created_at', ascending = false) {
            const { data, error } = await supabase
                .from(tableName)
                .select('*')
                .order(getOrderColumn(tableName, orderBy), { ascending })
            if (error) throw error
            return data
        },

        // Filter by exact-match object
        // Supports array values as .in() filters
        // e.g. filter({ difficulty: ['basic', 'medium'] })
        async filter(filters = {}, orderBy = 'created_at', ascending = false) {
            let query = supabase.from(tableName).select('*')
            Object.entries(filters).forEach(([col, val]) => {
                if (val === undefined || val === null || val === '') return
                if (Array.isArray(val)) query = query.in(col, val)
                else query = query.eq(col, val)
            })
            query = query.order(getOrderColumn(tableName, orderBy), { ascending })
            const { data, error } = await query
            if (error) throw error
            return data
        },

        // Fetch single row by id
        async get(id) {
            const { data, error } = await supabase
                .from(tableName)
                .select('*')
                .eq('id', id)
                .single()
            if (error) throw error
            return data
        },

        // Insert and return new row
        async create(payload) {
            const { data, error } = await supabase
                .from(tableName)
                .insert([payload])
                .select()
                .single()
            if (error) throw error
            return data
        },

        // Update by id and return updated row
        async update(id, payload) {
            const { data, error } = await supabase
                .from(tableName)
                .update({ ...payload, updated_at: new Date().toISOString() })
                .eq('id', id)
                .select()
                .single()
            if (error) throw error
            return data
        },

        // Delete by id
        async delete(id) {
            const { error } = await supabase
                .from(tableName)
                .delete()
                .eq('id', id)
            if (error) throw error
            return { success: true }
        },

        // Upsert — insert or update on conflict
        // e.g. upsert({ user_id: '...', question_id: '...' }, 'user_id, question_id')
        async upsert(payload, onConflict = 'id') {
            const { data, error } = await supabase
                .from(tableName)
                .upsert([payload], { onConflict })
                .select()
                .single()
            if (error) throw error
            return data
        },

        // Count rows with optional filters
        async count(filters = {}) {
            let query = supabase.from(tableName).select('*', { count: 'exact', head: true })
            Object.entries(filters).forEach(([col, val]) => {
                if (val !== undefined && val !== null) query = query.eq(col, val)
            })
            const { count, error } = await query
            if (error) throw error
            return count
        },

        // Paginate results
        async paginate({ page = 1, pageSize = 20, filters = {}, orderBy = 'created_at', ascending = false } = {}) {
            const from = (page - 1) * pageSize
            const to = from + pageSize - 1
            let query = supabase.from(tableName).select('*', { count: 'exact' })
            Object.entries(filters).forEach(([col, val]) => {
                if (val !== undefined && val !== null) query = query.eq(col, val)
            })
            const { data, count, error } = await query
                .order(getOrderColumn(tableName, orderBy), { ascending })
                .range(from, to)
            if (error) throw error
            return { data, count, page, pageSize, totalPages: Math.ceil(count / pageSize) }
        },

        // Upload file to Supabase Storage
        async uploadFile(file, bucket = 'uploads') {
            const ext = file.name.split('.').pop()
            const path = `${tableName}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`
            const { error: uploadError } = await supabase.storage
                .from(bucket)
                .upload(path, file, { upsert: false })
            if (uploadError) throw uploadError
            const { data } = supabase.storage.from(bucket).getPublicUrl(path)
            return { file_url: data.publicUrl }
        },
    }
}

// ── Build one accessor per entity ─────────────────────────────────────────────
export const entities = Object.fromEntries(
    Object.entries(TABLE_MAP).map(([name, table]) => [name, makeEntity(table)])
)

// ── Named exports for cleaner imports ─────────────────────────────────────────
// Usage: import { Topic, Question } from '@/api/entities'
// OR:    import { entities } from '@/api/entities'  → entities.Topic.list()
export const {
    Topic,
    Question,
    Company,
    Bookmark,
    Note,
    Progress,
    QuizAttempt,
    ResumeAnalysis,
    RoadmapTopic,
    PageVisibility,
    Profile,
} = entities

// ── Standalone file upload helper ─────────────────────────────────────────────
export async function uploadFile(file, bucket = 'uploads', folder = 'misc') {
    const ext = file.name.split('.').pop()
    const path = `${folder}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`
    const { error } = await supabase.storage.from(bucket).upload(path, file)
    if (error) throw error
    const { data } = supabase.storage.from(bucket).getPublicUrl(path)
    return { file_url: data.publicUrl }
}