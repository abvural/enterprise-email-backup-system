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
export interface Role {
  id: string
  name: string
  display_name: string
  level: number
  is_active: boolean
}

export interface Organization {
  id: string
  name: string
  type: 'system' | 'distributor' | 'dealer' | 'client'
  parent_org_id?: string
  created_by?: string
  settings?: string
  max_users?: number
  max_storage_gb?: number
  max_email_accounts?: number
  is_active: boolean
  created_at: string
  updated_at: string
  parent_org?: Organization
  child_orgs?: Organization[]
  creator?: User
}

export interface User {
  id: string
  email: string
  role?: Role
  primary_org?: Organization
  created_at: string
  updated_at: string
}

export interface EmailAccount {
  id: string
  user_id: string
  email: string
  provider: 'gmail' | 'exchange' | 'office365' | 'yahoo' | 'outlook' | 'custom_imap'
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

// Organizations API
export const organizationsAPI = {
  // Get all organizations (admin can see all, others see based on permissions)
  getOrganizations: (): Promise<AxiosResponse<Organization[]>> =>
    apiClient.get('/api/organizations'),

  // Get a specific organization by ID
  getOrganization: (orgId: string): Promise<AxiosResponse<Organization>> =>
    apiClient.get(`/api/organizations/${orgId}`),

  // Create a new organization
  createOrganization: (data: {
    name: string
    type: 'distributor' | 'dealer' | 'client'
    parent_org_id?: string
    max_users?: number
    max_storage_gb?: number
    max_email_accounts?: number
  }): Promise<AxiosResponse<Organization>> =>
    apiClient.post('/api/organizations', data),

  // Update an organization
  updateOrganization: (
    orgId: string,
    data: {
      name?: string
      max_users?: number
      max_storage_gb?: number
      max_email_accounts?: number
      is_active?: boolean
    }
  ): Promise<AxiosResponse<Organization>> =>
    apiClient.put(`/api/organizations/${orgId}`, data),

  // Deactivate an organization (soft delete)
  deleteOrganization: (orgId: string): Promise<AxiosResponse<{ message: string }>> =>
    apiClient.delete(`/api/organizations/${orgId}`),

  // Get organization statistics
  getOrganizationStats: (orgId: string): Promise<AxiosResponse<{
    organization_id: string
    user_count: number
    email_account_count: number
    total_emails: number
    total_storage_bytes: number
    total_storage_mb: number
    limits: {
      max_users?: number
      max_storage_gb?: number
      max_email_accounts?: number
    }
  }>> =>
    apiClient.get(`/api/organizations/${orgId}/stats`),

  // Get organization hierarchy
  getOrganizationHierarchy: (orgId: string): Promise<AxiosResponse<{
    hierarchy: Organization[]
    depth: number
  }>> =>
    apiClient.get(`/api/organizations/${orgId}/hierarchy`),
}

// Roles API
export const rolesAPI = {
  // Get all roles
  getRoles: (): Promise<AxiosResponse<Role[]>> =>
    apiClient.get('/api/roles'),

  // Get a specific role by ID
  getRole: (roleId: string): Promise<AxiosResponse<Role>> =>
    apiClient.get(`/api/roles/${roleId}`),

  // Create a new role
  createRole: (data: {
    name: string
    display_name: string
    level: number
  }): Promise<AxiosResponse<Role>> =>
    apiClient.post('/api/roles', data),

  // Update a role
  updateRole: (roleId: string, data: {
    display_name?: string
    level?: number
    is_active?: boolean
  }): Promise<AxiosResponse<Role>> =>
    apiClient.put(`/api/roles/${roleId}`, data),

  // Delete a role
  deleteRole: (roleId: string): Promise<AxiosResponse<{ message: string }>> =>
    apiClient.delete(`/api/roles/${roleId}`),
}

// Users API
export const usersAPI = {
  // Get all users (with organization filtering)
  getUsers: (params?: {
    organization_id?: string
    role_name?: string
    page?: number
    limit?: number
  }): Promise<AxiosResponse<{
    users: User[]
    pagination?: {
      page: number
      limit: number
      total: number
      pages: number
    }
  }>> =>
    apiClient.get('/api/users', { params }),

  // Get a specific user by ID
  getUser: (userId: string): Promise<AxiosResponse<User>> =>
    apiClient.get(`/api/users/${userId}`),

  // Create a new user
  createUser: (data: {
    email: string
    password: string
    role_id: string
    organization_id: string
  }): Promise<AxiosResponse<User>> =>
    apiClient.post('/api/users', data),

  // Update a user
  updateUser: (userId: string, data: {
    email?: string
    role_id?: string
    organization_id?: string
    is_active?: boolean
  }): Promise<AxiosResponse<User>> =>
    apiClient.put(`/api/users/${userId}`, data),

  // Delete a user
  deleteUser: (userId: string): Promise<AxiosResponse<{ message: string }>> =>
    apiClient.delete(`/api/users/${userId}`),

  // Reset user password
  resetPassword: (userId: string, newPassword: string): Promise<AxiosResponse<{ message: string }>> =>
    apiClient.post(`/api/users/${userId}/reset-password`, { password: newPassword }),

  // Get user statistics
  getUserStats: (userId: string): Promise<AxiosResponse<{
    user_id: string
    email_account_count: number
    total_emails: number
    total_storage_bytes: number
    last_login?: string
    created_at: string
  }>> =>
    apiClient.get(`/api/users/${userId}/stats`),
}

// Statistics Types
export interface SystemStats {
  total_users: number
  active_users: number
  total_organizations: number
  total_email_accounts: number
  total_emails: number
  total_storage_bytes: number
  total_storage_gb: number
  organization_counts: Record<string, number>
  role_counts: Record<string, number>
  provider_counts: Record<string, number>
  recent_activity: SystemActivityItem[]
  growth_metrics: SystemGrowthMetrics
}

export interface SystemActivityItem {
  type: string
  message: string
  timestamp: string
}

export interface SystemGrowthMetrics {
  users_growth: MonthlyGrowthPoint[]
  organizations_growth: MonthlyGrowthPoint[]
  emails_growth: MonthlyGrowthPoint[]
  storage_growth: MonthlyGrowthPoint[]
}

export interface MonthlyGrowthPoint {
  month: string
  count: number
  size?: number
}

export interface TopOrganization {
  id: string
  name: string
  type: string
  user_count: number
  email_count: number
  storage_bytes: number
  storage_gb: number
  last_activity: string
  is_active: boolean
}

export interface NetworkStats {
  total_dealers: number
  total_clients: number
  total_end_users: number
  total_email_accounts: number
  network_storage_bytes: number
  network_storage_gb: number
  active_dealers: number
  dealer_performance: DealerPerformanceItem[]
  client_distribution: ClientDistributionItem[]
  recent_activity: NetworkActivityItem[]
  growth_trends: NetworkGrowthTrends
}

export interface DealerPerformanceItem {
  dealer_id: string
  dealer_name: string
  client_count: number
  user_count: number
  email_count: number
  storage_bytes: number
  storage_gb: number
  last_activity: string
  is_active: boolean
}

export interface ClientDistributionItem {
  dealer_name: string
  client_count: number
}

export interface NetworkActivityItem {
  type: string
  message: string
  timestamp: string
  dealer_name?: string
  client_name?: string
}

export interface NetworkGrowthTrends {
  dealers_growth: MonthlyGrowthPoint[]
  clients_growth: MonthlyGrowthPoint[]
  users_growth: MonthlyGrowthPoint[]
  storage_growth: MonthlyGrowthPoint[]
}

export interface ClientStats {
  total_clients: number
  active_clients: number
  total_end_users: number
  total_email_accounts: number
  client_storage_bytes: number
  client_storage_gb: number
  client_performance: ClientPerformanceItem[]
  user_distribution: UserDistributionItem[]
  recent_client_activity: ClientActivityItem[]
  client_growth_trends: ClientGrowthTrends
}

export interface ClientPerformanceItem {
  client_id: string
  client_name: string
  user_count: number
  email_count: number
  storage_bytes: number
  storage_gb: number
  last_activity: string
  is_active: boolean
  health_score: number
}

export interface UserDistributionItem {
  client_name: string
  user_count: number
}

export interface ClientActivityItem {
  type: string
  message: string
  timestamp: string
  client_name: string
}

export interface ClientGrowthTrends {
  clients_growth: MonthlyGrowthPoint[]
  users_growth: MonthlyGrowthPoint[]
  emails_growth: MonthlyGrowthPoint[]
  storage_growth: MonthlyGrowthPoint[]
}

export interface UserStats {
  total_users: number
  active_users: number
  total_email_accounts: number
  total_emails: number
  user_storage_bytes: number
  user_storage_gb: number
  account_types: Record<string, number>
  user_performance: UserPerformanceItem[]
  sync_status: SyncStatusItem[]
  recent_user_activity: UserActivityItem[]
  storage_quota_usage: StorageQuotaUsage
}

export interface UserPerformanceItem {
  user_id: string
  user_email: string
  email_count: number
  storage_bytes: number
  storage_gb: number
  account_count: number
  last_sync_date?: string
  is_active: boolean
}

export interface SyncStatusItem {
  account_id: string
  email: string
  provider: string
  last_sync_date?: string
  is_active: boolean
  sync_status: string
}

export interface UserActivityItem {
  type: string
  message: string
  timestamp: string
  user_email: string
}

export interface StorageQuotaUsage {
  used_bytes: number
  used_gb: number
  quota_bytes?: number
  quota_gb?: number
  usage_percent: number
}

// Statistics API
export const statisticsAPI = {
  // Admin Statistics
  getSystemStats: (): Promise<AxiosResponse<{ success: boolean; data: SystemStats }>> =>
    apiClient.get('/api/admin/system-stats'),

  getTopOrganizations: (limit?: number): Promise<AxiosResponse<{ success: boolean; data: TopOrganization[]; count: number }>> =>
    apiClient.get(`/api/admin/top-organizations${limit ? `?limit=${limit}` : ''}`),

  // Distributor Statistics
  getNetworkStats: (): Promise<AxiosResponse<{ success: boolean; data: NetworkStats }>> =>
    apiClient.get('/api/distributor/network-stats'),

  getDealerPerformance: (): Promise<AxiosResponse<{ success: boolean; data: { dealer_performance: DealerPerformanceItem[]; client_distribution: ClientDistributionItem[] } }>> =>
    apiClient.get('/api/distributor/dealer-performance'),

  // Dealer Statistics
  getClientStats: (): Promise<AxiosResponse<{ success: boolean; data: ClientStats }>> =>
    apiClient.get('/api/dealer/client-stats'),

  getUsageTrends: (): Promise<AxiosResponse<{ success: boolean; data: { client_performance: ClientPerformanceItem[]; user_distribution: UserDistributionItem[]; recent_activity: ClientActivityItem[] } }>> =>
    apiClient.get('/api/dealer/usage-trends'),

  // Client Statistics
  getUserStats: (): Promise<AxiosResponse<{ success: boolean; data: UserStats }>> =>
    apiClient.get('/api/client/user-stats'),

  getStorageUsage: (): Promise<AxiosResponse<{ success: boolean; data: { total_storage: { bytes: number; gb: number }; quota_usage: StorageQuotaUsage; account_types: Record<string, number>; user_performance: UserPerformanceItem[] } }>> =>
    apiClient.get('/api/client/storage-usage'),
}

// Export token utilities for use in stores
export { setAuthToken, removeAuthToken, getAuthToken }