import React, { createContext, useState, useContext, useEffect } from 'react'
import { supabase } from '@/api/supabaseClient'

const AuthContext = createContext()

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null)
    const [profile, setProfile] = useState(null)
    const [isAuthenticated, setIsAuthenticated] = useState(false)
    const [isLoadingAuth, setIsLoadingAuth] = useState(true)
    const [isLoadingPublicSettings] = useState(false) // kept for App.jsx compatibility
    const [authError, setAuthError] = useState(null)

    useEffect(() => {
        // Get initial session on mount
        supabase.auth.getSession().then(({ data: { session } }) => {
            if (session?.user) {
                setUser(session.user)
                setIsAuthenticated(true)
                fetchProfile(session.user.id)
            } else {
                setIsLoadingAuth(false)
            }
        })

        // Listen for login / logout / token refresh
        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            if (session?.user) {
                setUser(session.user)
                setIsAuthenticated(true)
                fetchProfile(session.user.id)
            } else {
                setUser(null)
                setProfile(null)
                setIsAuthenticated(false)
                setIsLoadingAuth(false)
            }
        })

        return () => subscription.unsubscribe()
    }, [])

    const fetchProfile = async (userId) => {
        try {
            const { data, error } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', userId)
                .single()
            if (error) throw error
            setProfile(data)
        } catch (err) {
            console.error('Profile fetch error:', err)
            setAuthError({ type: 'profile_error', message: err.message })
        } finally {
            setIsLoadingAuth(false)
        }
    }

    const logout = async () => {
        await supabase.auth.signOut()
        setUser(null)
        setProfile(null)
        setIsAuthenticated(false)
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