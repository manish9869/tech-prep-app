
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