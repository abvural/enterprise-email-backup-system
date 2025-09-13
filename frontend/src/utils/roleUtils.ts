import { type Role, type User } from '../services/api'

// Role levels (lower number = higher privilege)
export const ROLE_LEVELS = {
  ADMIN: 1,
  DISTRIBUTOR: 2,
  DEALER: 3,
  CLIENT: 4,
  END_USER: 5,
} as const

// Role names
export const ROLE_NAMES = {
  ADMIN: 'admin',
  DISTRIBUTOR: 'distributor',
  DEALER: 'dealer',
  CLIENT: 'client',
  END_USER: 'end_user',
} as const

// Organization types
export const ORG_TYPES = {
  SYSTEM: 'system',
  DISTRIBUTOR: 'distributor',
  DEALER: 'dealer',
  CLIENT: 'client',
} as const

// Decode JWT token to get user claims
export interface JWTClaims {
  user_id: string
  email: string
  role_name: string
  role_level: number
  organization_id: string
  org_type: string
  exp: number
  iat: number
}

export function decodeJWT(token: string): JWTClaims | null {
  try {
    // JWT has 3 parts separated by dots
    const parts = token.split('.')
    if (parts.length !== 3) {
      return null
    }

    // Decode the payload (second part)
    const payload = parts[1]
    
    // Add padding if needed for base64 decoding
    const padded = payload + '='.repeat((4 - payload.length % 4) % 4)
    
    // Decode base64
    const decoded = atob(padded.replace(/-/g, '+').replace(/_/g, '/'))
    
    // Parse JSON
    const claims = JSON.parse(decoded) as JWTClaims
    
    return claims
  } catch (error) {
    console.error('Failed to decode JWT:', error)
    return null
  }
}

// Get current user claims from localStorage token
export function getCurrentUserClaims(): JWTClaims | null {
  const token = localStorage.getItem('auth_token')
  if (!token) {
    return null
  }
  
  return decodeJWT(token)
}

// Check if token is expired
export function isTokenExpired(claims: JWTClaims): boolean {
  const now = Math.floor(Date.now() / 1000)
  return claims.exp < now
}

// Role checking functions
export function isAdmin(user: User | null | undefined): boolean {
  return user?.role?.name === ROLE_NAMES.ADMIN
}

export function isDistributor(user?: User): boolean {
  return user?.role?.name === ROLE_NAMES.DISTRIBUTOR
}

export function isDealer(user?: User): boolean {
  return user?.role?.name === ROLE_NAMES.DEALER
}

export function isClient(user?: User): boolean {
  return user?.role?.name === ROLE_NAMES.CLIENT
}

export function isEndUser(user?: User): boolean {
  return user?.role?.name === ROLE_NAMES.END_USER
}

// Check if user has at least the specified role level
export function hasRoleLevel(user: User | null | undefined, requiredLevel: number): boolean {
  if (!user?.role) {
    return false
  }
  return user.role.level <= requiredLevel
}

// Check if user can manage other users
export function canManageUsers(user?: User): boolean {
  return hasRoleLevel(user, ROLE_LEVELS.CLIENT) // admin, distributor, dealer, client
}

// Check if user can manage organizations
export function canManageOrganizations(user?: User): boolean {
  return hasRoleLevel(user, ROLE_LEVELS.DEALER) // admin, distributor, dealer
}

// Check if user can view system settings
export function canViewSystemSettings(user?: User): boolean {
  return hasRoleLevel(user, ROLE_LEVELS.ADMIN) // only admin
}

// Get user-friendly role display name
export function getRoleDisplayName(role?: Role): string {
  if (!role) {
    return 'Unknown'
  }
  
  const displayNames: Record<string, string> = {
    [ROLE_NAMES.ADMIN]: 'System Administrator',
    [ROLE_NAMES.DISTRIBUTOR]: 'Distributor',
    [ROLE_NAMES.DEALER]: 'Dealer',
    [ROLE_NAMES.CLIENT]: 'Client Administrator',
    [ROLE_NAMES.END_USER]: 'End User',
  }
  
  return displayNames[role.name] || role.display_name || role.name
}

// Get organization type display name
export function getOrgTypeDisplayName(orgType: string): string {
  const displayNames: Record<string, string> = {
    [ORG_TYPES.SYSTEM]: 'System',
    [ORG_TYPES.DISTRIBUTOR]: 'Distributor',
    [ORG_TYPES.DEALER]: 'Dealer',
    [ORG_TYPES.CLIENT]: 'Client',
  }
  
  return displayNames[orgType] || orgType
}

// Check if user can access a specific dashboard
export function canAccessDashboard(user: User | undefined, dashboardType: string): boolean {
  if (!user?.role) {
    return false
  }
  
  switch (dashboardType) {
    case 'admin':
      return isAdmin(user)
    case 'distributor':
      return isDistributor(user) || isAdmin(user)
    case 'dealer':
      return isDealer(user) || isDistributor(user) || isAdmin(user)
    case 'client':
      return isClient(user) || isDealer(user) || isDistributor(user) || isAdmin(user)
    case 'end-user':
      return true // All users can access end-user dashboard
    default:
      return false
  }
}

// Get appropriate dashboard route for user
export function getDashboardRoute(user?: User): string {
  if (!user?.role) {
    return '/dashboard' // default end-user dashboard
  }
  
  switch (user.role.name) {
    case ROLE_NAMES.ADMIN:
      return '/admin/dashboard'
    case ROLE_NAMES.DISTRIBUTOR:
      return '/distributor/dashboard'
    case ROLE_NAMES.DEALER:
      return '/dealer/dashboard'
    case ROLE_NAMES.CLIENT:
      return '/client/dashboard'
    case ROLE_NAMES.END_USER:
    default:
      return '/dashboard'
  }
}

// Permission checking
export type Permission = 
  | 'system.manage'
  | 'users.create' | 'users.read' | 'users.update' | 'users.delete'
  | 'organizations.create' | 'organizations.read' | 'organizations.update' | 'organizations.delete'
  | 'emails.read' | 'emails.manage'
  | 'accounts.create' | 'accounts.read' | 'accounts.update' | 'accounts.delete'
  | 'reports.view' | 'settings.manage'

export function hasPermission(user: User | undefined, permission: Permission): boolean {
  if (!user?.role) {
    return false
  }
  
  // Admin has all permissions
  if (isAdmin(user)) {
    return true
  }
  
  // Define role-based permissions
  const rolePermissions: Record<string, Permission[]> = {
    [ROLE_NAMES.DISTRIBUTOR]: [
      'users.create', 'users.read', 'users.update', 'users.delete',
      'organizations.read', 'organizations.update',
      'reports.view'
    ],
    [ROLE_NAMES.DEALER]: [
      'users.create', 'users.read', 'users.update', 'users.delete',
      'organizations.read', 'organizations.update',
      'reports.view'
    ],
    [ROLE_NAMES.CLIENT]: [
      'users.create', 'users.read', 'users.update', 'users.delete',
      'emails.read', 'emails.manage',
      'organizations.read', 'organizations.update',
      'reports.view'
    ],
    [ROLE_NAMES.END_USER]: [
      'emails.read', 'emails.manage',
      'accounts.create', 'accounts.read', 'accounts.update', 'accounts.delete'
    ]
  }
  
  const userPermissions = rolePermissions[user.role.name] || []
  return userPermissions.includes(permission)
}

// Generic access control function
export function canAccess(user: User | null | undefined, permissions: Permission[] = [], minRoleLevel?: number): boolean {
  if (!user?.role) {
    return false
  }
  
  // Check minimum role level if provided
  if (minRoleLevel !== undefined && !hasRoleLevel(user, minRoleLevel)) {
    return false
  }
  
  // Check specific permissions if provided
  if (permissions.length > 0) {
    return permissions.some(permission => hasPermission(user, permission))
  }
  
  // If no specific requirements, return true (user is authenticated)
  return true
}