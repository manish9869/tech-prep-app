import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { refreshSession, getCurrentUser } from "@/api/auth";
import { setAccessToken } from "@/api/httpClient";
import { useAuth } from "@/lib/AuthContext";

// Google OAuth finishes with a full-page redirect from the backend, which also set an
// httpOnly refresh cookie for future silent refreshes. But frontend and backend live on
// different vercel.app subdomains, and browsers that block third-party cookies (increasingly
// the default) drop that cookie when we try to send it back cross-site via fetch — so login
// can't depend on it here. The backend also puts the access token straight in this URL,
// which sidesteps that entirely; the cookie-based refresh is only a fallback.
//
// Navigates client-side (not window.location.href) on success so AuthProvider never
// remounts here — a remount would re-run its own cookie-based refresh, which fails for the
// same third-party-cookie reason and would immediately clear the session we just established.
export default function OAuthComplete() {
    const navigate = useNavigate();
    const { applyUser } = useAuth();

    useEffect(() => {
        const token = new URLSearchParams(window.location.search).get("token");
        window.history.replaceState({}, document.title, window.location.pathname);

        const finish = token
            ? (() => { setAccessToken(token); return getCurrentUser(); })()
            : refreshSession();

        Promise.resolve(finish)
            .then((user) => {
                if (!user) throw new Error("no user");
                applyUser(user);
                navigate("/", { replace: true });
            })
            .catch(() => navigate("/login?error=google", { replace: true }));
    }, []);

    return (
        <div className="fixed inset-0 flex items-center justify-center bg-background">
            <div className="w-10 h-10 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
        </div>
    );
}
