import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react'

import type { Session } from '@supabase/supabase-js'
import { supabase } from './supabaseClient'
import { AuthApi } from './api'

import type { AuthUser } from '../type/auth'

interface AuthContextType {
  session: Session | null
  user: AuthUser | null
  loading: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(
  undefined
)

export function AuthProvider({
  children,
}: {
  children: ReactNode
}) {
  const [session, setSession] = useState<Session | null>(null)
  const [user, setUser] = useState<AuthUser | null>(null)
  const [loading, setLoading] = useState(true)


  const loadUser = async (currentSession: Session | null) => {
    if (!currentSession) {
      setUser(null)
      return
    }

    try {
      const userData = await AuthApi.me()
      setUser(userData)
    } catch (error) {
      console.error(
        'Failed to load authenticated user:',
        error
      )
      setUser(null)
    }
  }

  useEffect(() => {
    const initialize = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession()
      setSession(session)
      console.log('Current session:', session?.access_token)
      await loadUser(session)
      setLoading(false)
    }
    initialize()

    const {
      data: listener,
    } = supabase.auth.onAuthStateChange(
      async (_event, newSession) => {
        setSession(newSession)
        await loadUser(newSession)
      }
    )
    return () => {
      listener.subscription.unsubscribe()
    }
  }, [])

  return (
    <AuthContext.Provider value={{ session, user, loading }}>
      {children}
    </AuthContext.Provider>
  )
}


export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error(
      'useAuth must be used inside AuthProvider'
    )
  }
  return context
}