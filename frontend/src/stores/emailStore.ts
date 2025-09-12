import { create } from 'zustand'
import { accountsAPI, emailsAPI, type EmailAccount, type EmailIndex, type FullEmailData } from '../services/api'

interface EmailState {
  // Accounts
  accounts: EmailAccount[]
  isAccountsLoading: boolean
  accountsError: string | null
  
  // Emails
  emails: EmailIndex[]
  selectedEmail: EmailIndex | null
  selectedEmailContent: FullEmailData | null
  currentAccount: EmailAccount | null
  isEmailsLoading: boolean
  isEmailContentLoading: boolean
  emailsError: string | null
  emailContentError: string | null
  
  // Pagination
  pagination: {
    page: number
    limit: number
    total: number
    pages: number
  }
  
  // Sync status
  syncStatus: { [accountId: string]: 'idle' | 'syncing' | 'success' | 'error' }
  
  // Actions
  loadAccounts: () => Promise<void>
  addGmailAccount: (email: string, password: string) => Promise<boolean>
  addExchangeAccount: (data: {
    email: string
    password: string
    server_url: string
    domain?: string
    username: string
  }) => Promise<boolean>
  syncAccount: (accountId: string) => Promise<boolean>
  
  loadEmails: (accountId: string, page?: number, limit?: number) => Promise<void>
  selectEmail: (email: EmailIndex) => void
  loadEmailContent: (emailId: string) => Promise<void>
  clearSelectedEmail: () => void
  setCurrentAccount: (account: EmailAccount | null) => void
  
  clearAccountsError: () => void
  clearEmailsError: () => void
  clearEmailContentError: () => void
}

export const useEmailStore = create<EmailState>((set, get) => ({
  // Initial state
  accounts: [],
  isAccountsLoading: false,
  accountsError: null,
  
  emails: [],
  selectedEmail: null,
  selectedEmailContent: null,
  currentAccount: null,
  isEmailsLoading: false,
  isEmailContentLoading: false,
  emailsError: null,
  emailContentError: null,
  
  pagination: {
    page: 1,
    limit: 20,
    total: 0,
    pages: 0,
  },
  
  syncStatus: {},

  // Account actions
  loadAccounts: async () => {
    set({ isAccountsLoading: true, accountsError: null })
    
    try {
      const response = await accountsAPI.getAccounts()
      set({
        accounts: response.data.accounts,
        isAccountsLoading: false,
      })
    } catch (error: any) {
      const errorMessage = error.response?.data?.error || 'Failed to load accounts'
      set({
        accounts: [],
        isAccountsLoading: false,
        accountsError: errorMessage,
      })
    }
  },

  addGmailAccount: async (email: string, password: string): Promise<boolean> => {
    set({ isAccountsLoading: true, accountsError: null })
    
    try {
      const response = await accountsAPI.addGmailAccount(email, password)
      const newAccount = response.data.account
      
      set((state) => ({
        accounts: [...state.accounts, newAccount],
        isAccountsLoading: false,
      }))
      
      return true
    } catch (error: any) {
      const errorMessage = error.response?.data?.error || 'Failed to add Gmail account'
      set({
        isAccountsLoading: false,
        accountsError: errorMessage,
      })
      return false
    }
  },

  addExchangeAccount: async (data: {
    email: string
    password: string
    server_url: string
    domain?: string
    username: string
  }): Promise<boolean> => {
    set({ isAccountsLoading: true, accountsError: null })
    
    try {
      const response = await accountsAPI.addExchangeAccount(data)
      const newAccount = response.data.account
      
      set((state) => ({
        accounts: [...state.accounts, newAccount],
        isAccountsLoading: false,
      }))
      
      return true
    } catch (error: any) {
      const errorMessage = error.response?.data?.error || 'Failed to add Exchange account'
      set({
        isAccountsLoading: false,
        accountsError: errorMessage,
      })
      return false
    }
  },

  syncAccount: async (accountId: string): Promise<boolean> => {
    set((state) => ({
      syncStatus: { ...state.syncStatus, [accountId]: 'syncing' }
    }))
    
    try {
      await accountsAPI.syncAccount(accountId)
      set((state) => ({
        syncStatus: { ...state.syncStatus, [accountId]: 'success' }
      }))
      
      // Refresh emails if this is the current account
      const currentAccount = get().currentAccount
      if (currentAccount && currentAccount.id === accountId) {
        get().loadEmails(accountId)
      }
      
      return true
    } catch (error: any) {
      set((state) => ({
        syncStatus: { ...state.syncStatus, [accountId]: 'error' }
      }))
      return false
    }
  },

  // Email actions
  loadEmails: async (accountId: string, page = 1, limit = 20) => {
    set({ isEmailsLoading: true, emailsError: null })
    
    try {
      const response = await emailsAPI.getAccountEmails(accountId, page, limit)
      const { emails, pagination } = response.data
      
      set({
        emails,
        pagination,
        isEmailsLoading: false,
      })
    } catch (error: any) {
      const errorMessage = error.response?.data?.error || 'Failed to load emails'
      set({
        emails: [],
        pagination: { page: 1, limit: 20, total: 0, pages: 0 },
        isEmailsLoading: false,
        emailsError: errorMessage,
      })
    }
  },

  selectEmail: (email: EmailIndex) => {
    set({ selectedEmail: email, selectedEmailContent: null, emailContentError: null })
    // Automatically load the email content
    get().loadEmailContent(email.id)
  },

  loadEmailContent: async (emailId: string) => {
    set({ isEmailContentLoading: true, emailContentError: null })
    
    try {
      const response = await emailsAPI.getEmail(emailId)
      const { full_email, error } = response.data
      
      if (full_email) {
        set({
          selectedEmailContent: full_email,
          isEmailContentLoading: false,
        })
      } else {
        set({
          selectedEmailContent: null,
          isEmailContentLoading: false,
          emailContentError: error || 'Failed to load email content',
        })
      }
    } catch (error: any) {
      const errorMessage = error.response?.data?.error || 'Failed to load email content'
      set({
        selectedEmailContent: null,
        isEmailContentLoading: false,
        emailContentError: errorMessage,
      })
    }
  },

  clearSelectedEmail: () => {
    set({ selectedEmail: null, selectedEmailContent: null, emailContentError: null })
  },

  setCurrentAccount: (account: EmailAccount | null) => {
    set({ 
      currentAccount: account,
      emails: [],
      selectedEmail: null,
      selectedEmailContent: null,
      emailContentError: null,
      pagination: { page: 1, limit: 20, total: 0, pages: 0 }
    })
  },

  clearAccountsError: () => {
    set({ accountsError: null })
  },

  clearEmailsError: () => {
    set({ emailsError: null })
  },

  clearEmailContentError: () => {
    set({ emailContentError: null })
  },
}))

// UI Store for general UI state
interface UIState {
  sidebarCollapsed: boolean
  currentTheme: 'light' | 'dark'
  isLoading: boolean
  notifications: Array<{
    id: string
    type: 'success' | 'error' | 'info' | 'warning'
    message: string
    duration?: number
  }>
  
  // Actions
  toggleSidebar: () => void
  setSidebarCollapsed: (collapsed: boolean) => void
  toggleTheme: () => void
  setLoading: (loading: boolean) => void
  addNotification: (notification: Omit<UIState['notifications'][0], 'id'>) => void
  removeNotification: (id: string) => void
  clearNotifications: () => void
}

export const useUIStore = create<UIState>((set, get) => ({
  sidebarCollapsed: false,
  currentTheme: 'light',
  isLoading: false,
  notifications: [],

  toggleSidebar: () => {
    set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed }))
  },

  setSidebarCollapsed: (collapsed: boolean) => {
    set({ sidebarCollapsed: collapsed })
  },

  toggleTheme: () => {
    set((state) => ({
      currentTheme: state.currentTheme === 'light' ? 'dark' : 'light'
    }))
  },

  setLoading: (loading: boolean) => {
    set({ isLoading: loading })
  },

  addNotification: (notification) => {
    const id = Date.now().toString()
    set((state) => ({
      notifications: [...state.notifications, { ...notification, id }]
    }))

    // Auto-remove after duration (default 5 seconds)
    const duration = notification.duration ?? 5000
    if (duration > 0) {
      setTimeout(() => {
        get().removeNotification(id)
      }, duration)
    }
  },

  removeNotification: (id: string) => {
    set((state) => ({
      notifications: state.notifications.filter(n => n.id !== id)
    }))
  },

  clearNotifications: () => {
    set({ notifications: [] })
  },
}))