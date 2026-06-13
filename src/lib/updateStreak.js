import { supabase } from '@/api/supabaseClient';
export async function updateStreak(userId) {

    const today = new Date().toISOString().slice(0, 10);

    const { data: profile, error } = await supabase
        .from('profiles')
        .select('current_streak, longest_streak, last_study_date')
        .eq('id', userId)
        .single();


    if (!profile) {

        return;
    }

    const last = profile.last_study_date;
    const diffDays = last
        ? Math.floor((new Date(today) - new Date(last)) / 86400000)
        : null;

    let newStreak = profile.current_streak || 0;
    if (diffDays === null || diffDays > 1) newStreak = 1;
    else if (diffDays === 1) newStreak += 1;


    const { data, error: updateError } = await supabase
        .from('profiles')
        .update({
            current_streak: newStreak,
            longest_streak: Math.max(newStreak, profile.longest_streak || 0),
            last_study_date: today,
        })
        .eq('id', userId)
        .select(); // ← add .select() to confirm what was updated

}