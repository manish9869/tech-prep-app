
// export async function invokeLLM({ prompt, response_json_schema } = {}) {
//     const response = await fetch('https://api.anthropic.com/v1/messages', {
//         method: 'POST',
//         headers: { 'Content-Type': 'application/json' },
//         body: JSON.stringify({
//             model: 'claude-sonnet-4-20250514',
//             max_tokens: 1000,
//             messages: [
//                 {
//                     role: 'user',
//                     content: response_json_schema
//                         ? `${prompt}\n\nRespond ONLY with valid JSON matching this schema: ${JSON.stringify(response_json_schema)}. No markdown, no explanation.`
//                         : prompt,
//                 },
//             ],
//         }),
//     });

//     const data = await response.json();
//     const text = data.content?.[0]?.text || '';

//     if (response_json_schema) {
//         try {
//             return JSON.parse(text.replace(/```json|```/g, '').trim());
//         } catch {
//             return {};
//         }
//     }
//     return text;
// }


// export async function invokeLLM({ prompt, response_json_schema } = {}) {
//     const response = await fetch(
//         `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${import.meta.env.VITE_GEMINI_API_KEY}`,
//         {
//             method: 'POST',
//             headers: { 'Content-Type': 'application/json' },
//             body: JSON.stringify({
//                 contents: [{
//                     parts: [{
//                         text: response_json_schema
//                             ? `${prompt}\n\nRespond ONLY with valid JSON matching this schema: ${JSON.stringify(response_json_schema)}. No markdown, no explanation.`
//                             : prompt
//                     }]
//                 }],
//                 generationConfig: { temperature: 0.7, maxOutputTokens: 1000 }
//             }),
//         }
//     );

//     const data = await response.json();
//     const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '';

//     if (response_json_schema) {
//         try {
//             return JSON.parse(text.replace(/```json|```/g, '').trim());
//         } catch {
//             return {};
//         }
//     }
//     return text;
// }

export async function invokeLLM({ prompt, response_json_schema } = {}) {
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${import.meta.env.VITE_GROQ_API_KEY}`,
        },
        body: JSON.stringify({
            model: 'llama-3.3-70b-versatile',
            messages: [{
                role: 'user',
                content: response_json_schema
                    ? `${prompt}\n\nRespond ONLY with valid JSON matching this schema: ${JSON.stringify(response_json_schema)}. No markdown, no explanation.`
                    : prompt
            }],
            max_tokens: 1000,
        }),
    });

    const data = await response.json();
    const text = data.choices?.[0]?.message?.content || '';

    if (response_json_schema) {
        try {
            return JSON.parse(text.replace(/```json|```/g, '').trim());
        } catch {
            return {};
        }
    }
    return text;
}
function extractJSON(text) {
    const stripped = text.replace(/```json\n?|```/g, '').trim(); // ✅ already has /g
    const start = stripped.search(/[{[]/);
    const end = Math.max(stripped.lastIndexOf('}'), stripped.lastIndexOf(']'));
    if (start === -1 || end === -1) throw new Error('No JSON found in response');
    try {
        return JSON.parse(stripped.slice(start, end + 1));
    } catch (e) {
        // Last resort: try to fix unescaped newlines in string values
        const fixed = stripped.slice(start, end + 1).replace(/:\s*"([\s\S]*?)"/g, (match) =>
            match.replace(/\n/g, '\\n')
        );
        return JSON.parse(fixed);
    }
}

const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';
const GROQ_MODEL = 'llama-3.3-70b-versatile';

export async function invokeGroq({ prompt, parseJSON = false, maxTokens = 1024 } = {}) {
    console.log('invokeGroq content being sent:', typeof prompt, String(prompt).slice(0, 80));

    const response = await fetch(GROQ_API_URL, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${import.meta.env.VITE_GROQ_API_KEY}`,
        },
        body: JSON.stringify({
            model: GROQ_MODEL,
            messages: [{ role: 'user', content: prompt }],
            max_tokens: maxTokens,
        }),
    });

    if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(`Groq error ${response.status}: ${err?.error?.message || 'Unknown'}`);
    }

    const data = await response.json();
    const text = data.choices?.[0]?.message?.content || '';

    if (parseJSON) {
        try {
            const result = extractJSON(text);
            if (!result) throw new Error('Empty JSON');
            return result;
        } catch (e) {
            console.error('invokeGroq JSON parse failed. Raw:', text);
            return null;
        }
    }

    return text;
}

export async function invokeResumeAnalysis(prompt) {
    console.log('invokeResumeAnalysis type:', typeof prompt, typeof prompt === 'string' ? '✅' : '❌ NOT A STRING');
    return invokeGroq({
        prompt,
        parseJSON: true,
        maxTokens: 8000,
    });
}