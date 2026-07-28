import React, { useEffect } from "react";
import { refreshSession } from "@/api/auth";

// Google OAuth finishes with a full-page redirect from the backend (which has already set
// the httpOnly refresh cookie) — this page's only job is to exchange that cookie for an
// access token via the same silent refresh AuthContext uses on load, then continue in.
export default function OAuthComplete() {
    useEffect(() => {
        refreshSession()
            .then(() => { window.location.href = "/"; })
            .catch(() => { window.location.href = "/login?error=google"; });
    }, []);

    return (
        <div className="fixed inset-0 flex items-center justify-center bg-background">
            <div className="w-10 h-10 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
        </div>
    );
}
