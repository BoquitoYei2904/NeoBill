import { supabase } from './supabaseClient'
import type { AuthUser } from '../type/auth'

const API_URL =
  import.meta.env.VITE_API_URL ?? 'http://localhost:3000'

export const AuthApi = {
  me: async (): Promise<AuthUser> => {
    const {
      data: { session },
    } = await supabase.auth.getSession()

    if (!session) {
      throw new Error('Not signed in')
    }

    const response = await fetch(`${API_URL}/auth/me`, {
      method: 'GET',
      headers: {
        Accept: 'application/json',
        Authorization: `Bearer ${session.access_token}`,
      },
    })

    if (!response.ok) {
      const body = await response.json().catch(() => ({}))

      throw new Error(
        body?.message ?? `Request failed: ${response.status}`
      )
    }

    return response.json()
  },
}