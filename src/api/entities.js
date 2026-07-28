import { http } from '@/api/httpClient'

// ── URL path per entity — independent of the DB table name, which only the backend needs to know ──
const ENTITY_PATHS = {
    Topic: 'topics',
    Question: 'questions',
    Company: 'companies',
    Bookmark: 'bookmarks',
    Note: 'notes',
    Progress: 'progress',
    RoadmapTopic: 'roadmap-topics',
    PageVisibility: 'page-visibility',
    ResumeAnalysis: 'resume-analyses',
    Profile: 'profiles',
}

function buildQuery(filters = {}, orderBy, ascending) {
    const params = new URLSearchParams()
    Object.entries(filters).forEach(([col, val]) => {
        if (val === undefined || val === null || val === '') return
        params.set(col, Array.isArray(val) ? val.join(',') : val)
    })
    if (orderBy) params.set('orderBy', orderBy)
    if (ascending) params.set('ascending', 'true')
    const qs = params.toString()
    return qs ? `?${qs}` : ''
}

// ── Generic entity factory — same public shape as the old supabase-backed version ──
function makeEntity(path) {
    return {
        async list(orderBy = 'created_at', ascending = false) {
            return http.get(`/${path}${buildQuery({}, orderBy, ascending)}`)
        },

        async filter(filters = {}, orderBy = 'created_at', ascending = false) {
            return http.get(`/${path}${buildQuery(filters, orderBy, ascending)}`)
        },

        async get(id) {
            return http.get(`/${path}/${id}`)
        },

        async create(payload) {
            return http.post(`/${path}`, payload)
        },

        async update(id, payload) {
            return http.patch(`/${path}/${id}`, payload)
        },

        async delete(id) {
            return http.delete(`/${path}/${id}`)
        },
    }
}

export const entities = Object.fromEntries(
    Object.entries(ENTITY_PATHS).map(([name, path]) => [name, makeEntity(path)])
)

// QuizAttempt is special: it's never written directly by the client (grading happens
// server-side in POST /quiz/submit) and reads are always scoped to "my history" except
// on the admin dashboard, which needs every user's attempts for aggregate stats.
entities.QuizAttempt = {
    async list() {
        return http.get('/quiz/admin/all')
    },
    async filter() {
        // user_id is always the caller, enforced server-side — the filter arg is accepted
        // for call-site compatibility but ignored.
        return http.get('/quiz/history')
    },
}

export const {
    Topic,
    Question,
    Company,
    Bookmark,
    Note,
    Progress,
    QuizAttempt,
    RoadmapTopic,
    PageVisibility,
    ResumeAnalysis,
    Profile,
} = entities

// ── File upload helpers — now server-mediated (multipart to Express), never direct-to-storage ──
export async function uploadTopicLogo(file) {
    const formData = new FormData()
    formData.append('file', file)
    const { file_url } = await http.post('/uploads/topic-logo', formData, { isFormData: true })
    return { file_url }
}

export async function uploadResume(file) {
    const formData = new FormData()
    formData.append('file', file)
    return http.post('/uploads/resume', formData, { isFormData: true })
}
