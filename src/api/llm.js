import { http } from '@/api/httpClient';

// All LLM calls now go through the backend, which holds the Groq API key server-side and
// rate-limits per authenticated user. Same function signatures as before, so every
// call site (ResumeUploadPanel, ResumeOptimizer, MockInterviewPage, CodeEditorPage,
// QuestionFormDialog) needed zero changes.
export async function invokeLLM({ prompt } = {}) {
    const { result } = await http.post('/llm/complete', { prompt, parseJSON: false });
    return result;
}

export async function invokeGroq({ prompt, parseJSON = false, maxTokens = 1024 } = {}) {
    const { result } = await http.post('/llm/complete', { prompt, parseJSON, maxTokens });
    return result;
}

export async function invokeResumeAnalysis(prompt) {
    return invokeGroq({ prompt, parseJSON: true, maxTokens: 8000 });
}
