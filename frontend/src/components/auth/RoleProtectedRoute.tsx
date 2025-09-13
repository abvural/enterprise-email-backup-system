import { type ReactNode } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { Center, VStack, Text, Alert, AlertIcon, AlertTitle, AlertDescription } from '@chakra-ui/react'
import { useAuthStore } from '../../stores/authStore'

interface RoleProtectedRouteProps {
  children: ReactNode
  allowedRoles: string[]
  fallbackPath?: string
}

export const RoleProtectedRoute = ({ 
  children, 
  allowedRoles, 
  fallbackPath = '/dashboard' 
}: RoleProtectedRouteProps) => {
  const { user, isAuthenticated, isLoading } = useAuthStore()
  const location = useLocation()

  // SECURITY DEBUG: Log access attempt
  console.log('🔐 RoleProtectedRoute Check:', {
    path: location.pathname,
    isAuthenticated,
    isLoading,
    user: user?.email,
    userRole: user?.role?.name,
    allowedRoles,
    timestamp: new Date().toISOString()
  })

  // Show loading if auth is still being checked
  if (isLoading) {
    return (
      <Center height="100vh" bg="white">
        <Text>Loading...</Text>
      </Center>
    )
  }

  // Redirect to login if not authenticated
  if (!isAuthenticated) {
    console.log('❌ SECURITY: Redirecting to login - not authenticated')
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  // Get user role - CRITICAL: Don't default to end_user if undefined!
  const userRole = user?.role?.name
  
  // SECURITY FIX: If role is undefined, block access completely
  if (!userRole) {
    console.log('🚨 CRITICAL SECURITY: User role is undefined, blocking access')
    return (
      <Center height="100vh" bg="white" px={4}>
        <Alert status="error" variant="subtle" flexDirection="column" alignItems="center" justifyContent="center" textAlign="center" height="250px" maxW="md">
          <AlertIcon boxSize="40px" mr={0} />
          <AlertTitle mt={4} mb={1} fontSize="lg">🚨 ROLE UNDEFINED</AlertTitle>
          <AlertDescription maxWidth="sm">
            User role is undefined. Please re-login to refresh your session.
          </AlertDescription>
          <Text mt={4} fontSize="sm" color="red.600" fontWeight="bold">
            Security Error: No valid role detected
          </Text>
        </Alert>
      </Center>
    )
  }

  // CRITICAL SECURITY: Admin should NEVER access email functionality
  if (userRole === 'admin' && (location.pathname.includes('/accounts') || location.pathname.includes('/emails'))) {
    console.log('🚨 SECURITY VIOLATION: Admin attempting to access email functionality:', location.pathname)
    return (
      <Center height="100vh" bg="white" px={4}>
        <Alert status="error" variant="subtle" flexDirection="column" alignItems="center" justifyContent="center" textAlign="center" height="250px" maxW="md">
          <AlertIcon boxSize="40px" mr={0} />
          <AlertTitle mt={4} mb={1} fontSize="lg">🚨 SECURITY VIOLATION</AlertTitle>
          <AlertDescription maxWidth="sm">
            Administrators are NOT allowed to access email functionality. This action has been logged.
          </AlertDescription>
          <Text mt={4} fontSize="sm" color="red.600" fontWeight="bold">
            Your role: ADMIN - Email access is FORBIDDEN
          </Text>
        </Alert>
      </Center>
    )
  }

  // Check if user has required role
  const hasRequiredRole = allowedRoles.includes(userRole)
  
  // SECURITY LOG
  if (!hasRequiredRole) {
    console.log('❌ SECURITY: Access denied:', {
      userRole,
      allowedRoles,
      path: location.pathname
    })
  } else {
    console.log('✅ SECURITY: Access granted:', {
      userRole,
      allowedRoles,
      path: location.pathname
    })
  }

  // If user doesn't have required role, show access denied
  if (!hasRequiredRole) {
    return (
      <Center height="100vh" bg="white" px={4}>
        <Alert
          status="error"
          variant="subtle"
          flexDirection="column"
          alignItems="center"
          justifyContent="center"
          textAlign="center"
          height="200px"
          maxW="md"
        >
          <AlertIcon boxSize="40px" mr={0} />
          <AlertTitle mt={4} mb={1} fontSize="lg">
            Access Denied
          </AlertTitle>
          <AlertDescription maxWidth="sm">
            You don't have the required permissions to access this page. 
            {userRole === 'end_user' ? 
              " Only organization managers can access this area." :
              " Only end users can manage email accounts and view email content."
            }
          </AlertDescription>
          <Text mt={4} fontSize="sm" color="gray.600">
            Your role: <strong>{userRole.replace('_', ' ')}</strong>
          </Text>
          <Text fontSize="sm" color="gray.600">
            Required roles: <strong>{allowedRoles.join(', ').replace(/_/g, ' ')}</strong>
          </Text>
        </Alert>
      </Center>
    )
  }

  return <>{children}</>
}