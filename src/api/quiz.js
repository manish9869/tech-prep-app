import { http } from '@/api/httpClient';

// Questions come back with the answer key stripped server-side — grading happens only
// after submit, so there's nothing in the network response for the browser to read early.
export async function getQuizQuestions({ topic_id, difficulty, count }) {
    const params = new URLSearchParams();
    if (topic_id) params.set('topic_id', topic_id);
    if (difficulty) params.set('difficulty', difficulty);
    if (count) params.set('count', count);
    return http.get(`/quiz/questions?${params.toString()}`);
}

export async function submitQuiz({ topic_id, difficulty, time_taken, answers }) {
    return http.post('/quiz/submit', { topic_id, difficulty, time_taken, answers });
}

// Reveals a single question's correct answer — called only at the moment the user commits
// to an answer for that question, so the rest of the quiz's answer key stays hidden.
export async function revealQuizAnswer(questionId) {
    return http.get(`/quiz/questions/${questionId}/answer`);
}
