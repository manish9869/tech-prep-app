import React, { createContext, useState, useContext, useEffect } from 'react'
import { getCurrentUser, logout as apiLogout, refreshSession } from '@/api/auth'

const AuthContext = createContext()

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null)
    const [profile, setProfile] = useState(null)
    const [isAuthenticated, setIsAuthenticated] = useState(false)
    const [isLoadingAuth, setIsLoadingAuth] = useState(true)
    const [isLoadingPublicSettings] = useState(false) // kept for App.jsx compatibility
    const [authError, setAuthError] = useState(null)

    const applyUser = (data) => {
        setUser(data)
        setProfile(data)
        setIsAuthenticated(true)
    }

    const clearUser = () => {
        setUser(null)
        setProfile(null)
        setIsAuthenticated(false)
    }

    useEffect(() => {
        // OAuthComplete owns establishing the session on that page (it sets the access
        // token straight from the redirect URL) — this effect running concurrently on the
        // same fresh page load would race it: if the cookie-based refresh below fails first,
        // its failure path clears the access token OAuthComplete just set out from under it.
        if (window.location.pathname === '/oauth-complete') {
            setIsLoadingAuth(false)
            return
        }
        // Silently exchange the httpOnly refresh cookie (if any) for a fresh access token
        // on every app load — this is what keeps a user logged in across a hard refresh.
        (async () => {
            try {
                const data = await refreshSession()
                applyUser(data)
            } catch {
                clearUser()
            } finally {
                setIsLoadingAuth(false)
            }
        })()
    }, [])

    const fetchProfile = async () => {
        try {
            const data = await getCurrentUser()
            if (!data) throw new Error('Not authenticated')
            applyUser(data)
        } catch (err) {
            setAuthError({ type: 'profile_error', message: err.message })
        }
    }

    const logout = async () => {
        await apiLogout()
        clearUser()
    }

    const navigateToLogin = () => {
        window.location.href = '/login'
    }

    return (
        <AuthContext.Provider value={{
            user,
            profile,
            isAuthenticated,
            isLoadingAuth,
            isLoadingPublicSettings,
            authError,
            logout,
            navigateToLogin,
            fetchProfile,
            applyUser,
        }}>
            {children}
        </AuthContext.Provider>
    )
}

export const useAuth = () => {
    const context = useContext(AuthContext)
    if (!context) throw new Error('useAuth must be used within an AuthProvider')
    return context
}
