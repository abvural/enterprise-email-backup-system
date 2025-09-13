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
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  // Get user role
  const userRole = user?.role?.name || 'end_user'

  // Check if user has required role
  const hasRequiredRole = allowedRoles.includes(userRole)

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