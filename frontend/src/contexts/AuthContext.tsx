'use client'

import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { supabase } from '@/lib/supabase'
import { Profile } from '@/lib/supabase'
import { User, Session } from '@supabase/supabase-js'

type AuthContextType = {
  user: User | null
  profile: Profile | null
  session: Session | null
  loading: boolean
  signIn: (email: string, password: string) => Promise<void>
  signUp: (email: string, password: string, companyName: string) => Promise<void>
  signOut: () => Promise<void>
  resetPassword: (email: string) => Promise<void>
  refreshProfile: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)

  const fetchProfile = async (userId: string) => {
    if (!supabase) return
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single()
      
      if (error) {
        console.error('Error fetching profile:', error)
      }

      if (data) {
        setProfile(data as Profile)
      }
    } catch (err) {
      console.error('Exception in fetchProfile:', err)
    }
  }

  const refreshProfile = async () => {
    if (user) {
      await fetchProfile(user.id)
    }
  }

  useEffect(() => {
    if (!supabase) {
      setLoading(false)
      return
    }

    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setUser(session?.user ?? null)
      if (session?.user) {
        fetchProfile(session.user.id)
        localStorage.setItem('access_token', session.access_token)
      }
      setLoading(false)
    }).catch(err => {
      console.error('Error getting session:', err)
      setLoading(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setSession(session)
        setUser(session?.user ?? null)
        
        if (session?.user) {
          try {
            await fetchProfile(session.user.id)
            localStorage.setItem('access_token', session.access_token)
          } catch (e) {
            console.error('Error in auth state change profile fetch:', e)
          }
        } else {
          setProfile(null)
          localStorage.removeItem('access_token')
        }
        setLoading(false)
      }
    )

    return () => subscription.unsubscribe()
  }, [])

  const signIn = async (email: string, password: string) => {
    if (!supabase) throw new Error('Supabase not configured')
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) {
      console.error('Sign in error:', error)
      throw error
    }
  }

  const signUp = async (email: string, password: string, companyName: string) => {
    if (!supabase) throw new Error('Supabase not configured')
    const { data, error } = await supabase.auth.signUp({ email, password })
    if (error) throw error
    
    if (data.user) {
      // Create profile manually if trigger fails or just to be safe (though trigger is preferred)
      // We rely on trigger usually, but let's see.
      // Wait, if trigger handles it, we don't need this unless we want to add extra fields not handled by trigger.
      // The trigger handles email and role. We need to add company_name.
      try {
         await supabase.from('profiles').update({
           company_name: companyName,
           // Ensure role is set if not by trigger, but trigger does it.
         }).eq('id', data.user.id)
      } catch (e) {
         console.error('Error updating profile after signup:', e)
      }
    }
  }

  const signOut = async () => {
    if (!supabase) return
    await supabase.auth.signOut()
    localStorage.removeItem('access_token')
    setUser(null)
    setProfile(null)
    setSession(null)
  }

  const resetPassword = async (email: string) => {
    if (!supabase) throw new Error('Supabase not configured')
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    })
    if (error) throw error
  }

  return (
    <AuthContext.Provider value={{ 
      user, 
      profile, 
      session, 
      loading, 
      signIn, 
      signUp, 
      signOut,
      resetPassword,
      refreshProfile 
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
