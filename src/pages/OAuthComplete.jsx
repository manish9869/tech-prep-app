import React, { useEffect } from "react";
import { refreshSession, getCurrentUser } from "@/api/auth";
import { setAccessToken } from "@/api/httpClient";

// Google OAuth finishes with a full-page redirect from the backend, which also set an
// httpOnly refresh cookie for future silent refreshes. But frontend and backend live on
// different vercel.app subdomains, and browsers that block third-party cookies (increasingly
// the default) drop that cookie when we try to send it back cross-site via fetch — so login
// can't depend on it here. The backend also puts the access token straight in this URL,
// which sidesteps that entirely; the cookie-based refresh is only a fallback.
export default function OAuthComplete() {
    useEffect(() => {
        const token = new URLSearchParams(window.location.search).get("token");
        window.history.replaceState({}, document.title, window.location.pathname);

        const finish = token
            ? (() => { setAccessToken(token); return getCurrentUser(); })()
            : refreshSession();

        Promise.resolve(finish)
            .then((user) => {
                if (!user) throw new Error("no user");
                window.location.href = "/";
            })
            .catch(() => { window.location.href = "/login?error=google"; });
    }, []);

    return (
        <div className="fixed inset-0 flex items-center justify-center bg-background">
            <div className="w-10 h-10 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
        </div>
    );
}
