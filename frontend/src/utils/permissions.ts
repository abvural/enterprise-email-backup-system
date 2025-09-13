/**
 * Permission checking utilities for role-based access control
 */

export type UserRole = 'admin' | 'distributor' | 'dealer' | 'client' | 'end_user'
export type OrganizationType = 'system' | 'distributor' | 'dealer' | 'client'

/**
 * Check if a user role can create a specific organization type
 */
export const canCreateOrganization = (
  userRole: UserRole, 
  targetType: OrganizationType
): boolean => {
  switch (userRole) {
    case 'admin':
      // Admin can create any type under any parent
      return true
    case 'distributor':
      // Distributors can create dealers and clients
      return ['dealer', 'client'].includes(targetType)
    case 'dealer':
      // Dealers can create only clients
      return targetType === 'client'
    case 'client':
    case 'end_user':
    default:
      // Clients and end users cannot create organizations
      return false
  }
}

/**
 * Check if a user role can manage organizations
 */
export const canManageOrganizations = (userRole: UserRole): boolean => {
  return ['admin', 'distributor', 'dealer'].includes(userRole)
}

/**
 * Check if a user role can manage users
 */
export const canManageUsers = (userRole: UserRole): boolean => {
  return ['admin', 'distributor', 'dealer', 'client'].includes(userRole)
}

/**
 * Check if a user role can access email functionality
 * SECURITY: Only end_user role should have email access
 */
export const canAccessEmails = (userRole: UserRole): boolean => {
  return userRole === 'end_user'
}

/**
 * Get available organization types that a role can create
 */
export const getAvailableOrganizationTypes = (
  userRole: UserRole
): Array<{ value: OrganizationType; label: string }> => {
  const allTypes = [
    { value: 'distributor' as OrganizationType, label: 'Distributor' },
    { value: 'dealer' as OrganizationType, label: 'Dealer' },
    { value: 'client' as OrganizationType, label: 'Client' },
  ]

  return allTypes.filter(type => canCreateOrganization(userRole, type.value))
}

/**
 * Get the allowed sub-organization types for a parent organization
 */
export const getAllowedSubOrganizationTypes = (
  parentType: OrganizationType
): Array<{ value: OrganizationType; label: string }> => {
  switch (parentType) {
    case 'system':
      return [
        { value: 'distributor', label: 'Distributor' },
        { value: 'dealer', label: 'Dealer' },
        { value: 'client', label: 'Client' },
      ]
    case 'distributor':
      return [
        { value: 'dealer', label: 'Dealer' },
        { value: 'client', label: 'Client' },
      ]
    case 'dealer':
      return [
        { value: 'client', label: 'Client' },
      ]
    case 'client':
    default:
      return []
  }
}

/**
 * Check if a user role can view the admin panel
 */
export const canAccessAdminPanel = (userRole: UserRole): boolean => {
  return userRole === 'admin'
}

/**
 * Check if a user role can access network management
 */
export const canAccessNetworkManagement = (userRole: UserRole): boolean => {
  return ['distributor', 'dealer'].includes(userRole)
}

/**
 * Check if a user role can access user management
 */
export const canAccessUserManagement = (userRole: UserRole): boolean => {
  return userRole === 'client'
}

/**
 * Get the default dashboard path for a user role
 */
export const getDefaultDashboardPath = (userRole: UserRole): string => {
  switch (userRole) {
    case 'admin':
      return '/admin/dashboard'
    case 'distributor':
      return '/distributor/dashboard'
    case 'dealer':
      return '/dealer/dashboard'
    case 'client':
      return '/client/dashboard'
    case 'end_user':
    default:
      return '/dashboard'
  }
}

/**
 * Check if a user role should see email functionality in the menu
 * SECURITY: Only end_user role should see email menus
 */
export const shouldShowEmailMenu = (userRole: UserRole): boolean => {
  return canAccessEmails(userRole) // Now returns true only for end_user
}

/**
 * Check if a user role should see organization management options
 */
export const shouldShowOrganizationMenu = (userRole: UserRole): boolean => {
  return canManageOrganizations(userRole) || userRole === 'admin'
}