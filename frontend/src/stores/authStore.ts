import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { authAPI, setAuthToken, removeAuthToken, getAuthToken, type User } from '../services/api'
import { getCurrentUserClaims, isTokenExpired, type JWTClaims } from '../utils/roleUtils'

interface AuthState {
  user: User | null
  token: string | null
  isAuthenticated: boolean
  isLoading: boolean
  error: string | null
  claims: JWTClaims | null
  
  // Actions
  login: (email: string, password: string) => Promise<boolean>
  register: (email: string, password: string) => Promise<boolean>
  logout: () => void
  checkAuth: () => Promise<boolean>
  clearError: () => void
  initializeAuth: () => void
  refreshClaims: () => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,
      claims: null,

      login: async (email: string, password: string): Promise<boolean> => {
        set({ isLoading: true, error: null })
        
        try {
          const response = await authAPI.login(email, password)
          const { token, user } = response.data
          
          // SECURITY DEBUG: Log login data
          console.log('🔐 Login response data:', {
            token: token ? 'present' : 'missing',
            user,
            userRole: user?.role?.name,
            userEmail: user?.email
          })
          
          setAuthToken(token)
          
          // Get JWT claims for role/organization info
          const claims = getCurrentUserClaims()
          
          console.log('🔐 JWT Claims after login:', claims)
          
          set({
            user,
            token,
            claims,
            isAuthenticated: true,
            isLoading: false,
            error: null,
          })
          
          // SECURITY DEBUG: Log final auth state
          console.log('🔐 Final auth state after login:', {
            user,
            isAuthenticated: true,
            userRole: user?.role?.name
          })
          
          return true
        } catch (error: any) {
          const errorMessage = error.response?.data?.error || 'Login failed'
          set({
            user: null,
            token: null,
            claims: null,
            isAuthenticated: false,
            isLoading: false,
            error: errorMessage,
          })
          return false
        }
      },

      register: async (email: string, password: string): Promise<boolean> => {
        set({ isLoading: true, error: null })
        
        try {
          const response = await authAPI.register(email, password)
          const { token, user } = response.data
          
          setAuthToken(token)
          
          // Get JWT claims for role/organization info
          const claims = getCurrentUserClaims()
          
          set({
            user,
            token,
            claims,
            isAuthenticated: true,
            isLoading: false,
            error: null,
          })
          
          return true
        } catch (error: any) {
          const errorMessage = error.response?.data?.error || 'Registration failed'
          set({
            user: null,
            token: null,
            claims: null,
            isAuthenticated: false,
            isLoading: false,
            error: errorMessage,
          })
          return false
        }
      },

      logout: () => {
        removeAuthToken()
        set({
          user: null,
          token: null,
          claims: null,
          isAuthenticated: false,
          error: null,
        })
      },

      checkAuth: async (): Promise<boolean> => {
        const token = getAuthToken()
        if (!token) {
          set({ isAuthenticated: false, claims: null })
          return false
        }

        // Check if token is expired using JWT claims
        const claims = getCurrentUserClaims()
        if (!claims || isTokenExpired(claims)) {
          removeAuthToken()
          set({
            user: null,
            token: null,
            claims: null,
            isAuthenticated: false,
            error: null,
          })
          return false
        }

        set({ isLoading: true })
        
        try {
          const response = await authAPI.getMe()
          const { user_id, email } = response.data
          
          // Create user object from /me response
          const user: User = {
            id: user_id,
            email: email,
            created_at: '', // Not provided by /me endpoint
            updated_at: '', // Not provided by /me endpoint
          }
          
          set({
            user,
            token,
            claims,
            isAuthenticated: true,
            isLoading: false,
            error: null,
          })
          
          return true
        } catch (error) {
          removeAuthToken()
          set({
            user: null,
            token: null,
            claims: null,
            isAuthenticated: false,
            isLoading: false,
            error: null,
          })
          return false
        }
      },

      clearError: () => {
        set({ error: null })
      },

      refreshClaims: () => {
        const claims = getCurrentUserClaims()
        set({ claims })
      },

      initializeAuth: () => {
        const token = getAuthToken()
        if (token) {
          const claims = getCurrentUserClaims()
          set({ token, claims })
          get().checkAuth()
        }
      },
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
)