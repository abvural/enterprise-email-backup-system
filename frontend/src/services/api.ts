import axios, { type AxiosResponse, type InternalAxiosRequestConfig } from 'axios'

// API Base URL - in production, this should come from environment variables
const API_BASE_URL = import.meta.env.PROD ? '' : 'http://localhost:8081'
const STORAGE_API_URL = import.meta.env.PROD ? '' : 'http://localhost:8082'

// Create axios instance
export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Create storage API client
export const storageApiClient = axios.create({
  baseURL: STORAGE_API_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Token management utilities
const getAuthToken = (): string | null => {
  return localStorage.getItem('auth_token')
}

const setAuthToken = (token: string) => {
  localStorage.setItem('auth_token', token)
  apiClient.defaults.headers.common['Authorization'] = `Bearer ${token}`
}

const removeAuthToken = () => {
  localStorage.removeItem('auth_token')
  delete apiClient.defaults.headers.common['Authorization']
}

// Request interceptor to add auth token
apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = getAuthToken()
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Response interceptor to handle auth errors
apiClient.interceptors.response.use(
  (response: AxiosResponse) => {
    return response
  },
  (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid - clear auth and redirect to login
      removeAuthToken()
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

// Add interceptors for storage API client
storageApiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = getAuthToken()
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

storageApiClient.interceptors.response.use(
  (response: AxiosResponse) => {
    return response
  },
  (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid - clear auth and redirect to login
      removeAuthToken()
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

// Types based on backend API analysis
export interface User {
  id: string
  email: string
  created_at: string
  updated_at: string
}

export interface EmailAccount {
  id: string
  user_id: string
  email: string
  provider: 'gmail' | 'exchange'
  server_url?: string
  domain?: string
  username?: string
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface EmailIndex {
  id: string
  account_id: string
  message_id: string
  subject: string
  sender_email: string
  sender_name: string
  date: string
  folder: string
  minio_path: string
  created_at: string
  updated_at: string
  account?: EmailAccount
}

export interface AuthResponse {
  token: string
  user: User
}

export interface PaginatedEmailResponse {
  emails: EmailIndex[]
  pagination: {
    page: number
    limit: number
    total: number
    pages: number
  }
}

export interface AttachmentInfo {
  name: string
  size: number
  type: string
}

export interface FullEmailData {
  message_id: string
  subject: string
  from: string
  from_name: string
  date: string
  body: string
  body_html: string
  folder: string
  attachments: AttachmentInfo[]
  headers: { [key: string]: string }
}

export interface EmailDetailResponse {
  email: EmailIndex
  full_email: FullEmailData | null
  message: string
  error?: string
}

export interface ApiResponse<T> {
  data?: T
  message?: string
  error?: string
}

// Storage Statistics Types
export interface StorageStats {
  total_emails: number
  total_size: number
  content_size: number
  attachment_size: number
  attachment_count: number
  last_calculated?: string
  formatted: {
    total_size: string
    content_size: string
    attachment_size: string
  }
}

export interface TotalStorageStats extends StorageStats {
  total_accounts: number
}

export interface AccountStorageStats extends StorageStats {
  account_id: string
}

export interface FolderStorageStats extends StorageStats {
  folder_name: string
}

export interface AccountWithStorageStats {
  id: string
  email: string
  provider: string
  is_active: boolean
  last_sync_date?: string
  storage: StorageStats
}

// Auth API
export const authAPI = {
  register: (email: string, password: string): Promise<AxiosResponse<AuthResponse>> =>
    apiClient.post('/auth/register', { email, password }),

  login: (email: string, password: string): Promise<AxiosResponse<AuthResponse>> =>
    apiClient.post('/auth/login', { email, password }),

  getMe: (): Promise<AxiosResponse<{ user_id: string; email: string }>> =>
    apiClient.get('/api/me'),
}

// Email Accounts API
export const accountsAPI = {
  getAccounts: (): Promise<AxiosResponse<{ accounts: EmailAccount[] }>> =>
    apiClient.get('/api/accounts'),

  addGmailAccount: (email: string, password: string): Promise<AxiosResponse<{ message: string; account: EmailAccount }>> =>
    apiClient.post('/api/accounts/gmail', { email, password }),

  addExchangeAccount: (data: {
    email: string
    password: string
    server_url: string
    domain?: string
    username: string
  }): Promise<AxiosResponse<{ message: string; account: EmailAccount }>> =>
    apiClient.post('/api/accounts/exchange', data),

  syncAccount: (accountId: string): Promise<AxiosResponse<{ message: string }>> =>
    apiClient.post(`/api/accounts/${accountId}/sync`),
}

// Emails API
export const emailsAPI = {
  getAccountEmails: (
    accountId: string,
    page = 1,
    limit = 20
  ): Promise<AxiosResponse<PaginatedEmailResponse>> =>
    apiClient.get(`/api/accounts/${accountId}/emails?page=${page}&limit=${limit}`),

  getEmail: (emailId: string): Promise<AxiosResponse<EmailDetailResponse>> =>
    apiClient.get(`/api/emails/${emailId}`),
}

// Health check API
export const healthAPI = {
  check: (): Promise<AxiosResponse<{
    status: string
    service: string
    version: string
    database: string
    minio: string
  }>> => apiClient.get('/health'),
}

// Storage Statistics API
export const storageAPI = {
  // Get total storage statistics for the user
  getTotalStats: (): Promise<AxiosResponse<{ success: boolean; data: TotalStorageStats }>> =>
    storageApiClient.get('/api/storage/total'),

  // Get all accounts with storage statistics
  getAccountsWithStats: (): Promise<AxiosResponse<{ success: boolean; data: AccountWithStorageStats[] }>> =>
    storageApiClient.get('/api/storage/accounts'),

  // Get storage statistics for a specific account
  getAccountStats: (accountId: string): Promise<AxiosResponse<{ success: boolean; data: AccountStorageStats }>> =>
    storageApiClient.get(`/api/storage/account/${accountId}`),

  // Get folder storage statistics for an account
  getFolderStats: (accountId: string): Promise<AxiosResponse<{ success: boolean; data: FolderStorageStats[] }>> =>
    storageApiClient.get(`/api/storage/account/${accountId}/folders`),

  // Recalculate storage statistics for a specific account
  recalculateAccountStats: (accountId: string): Promise<AxiosResponse<{ success: boolean; message: string }>> =>
    storageApiClient.post(`/api/storage/account/${accountId}/recalculate`),

  // Recalculate storage statistics for all user accounts
  recalculateAllStats: (): Promise<AxiosResponse<{ success: boolean; message: string }>> =>
    storageApiClient.post('/api/storage/recalculate-all'),
}

// Utility function to format bytes
export const formatBytes = (bytes: number, decimals: number = 1): string => {
  if (bytes === 0) return '0 B'
  
  const k = 1024
  const dm = decimals < 0 ? 0 : decimals
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB', 'PB']
  
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`
}

// Export token utilities for use in stores
export { setAuthToken, removeAuthToken, getAuthToken }