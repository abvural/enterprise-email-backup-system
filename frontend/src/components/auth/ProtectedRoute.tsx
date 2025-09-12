import { type ReactNode, useEffect } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { Center, Spinner, VStack, Text } from '@chakra-ui/react'
import { useAuthStore } from '../../stores/authStore'

interface ProtectedRouteProps {
  children: ReactNode
}

export const ProtectedRoute = ({ children }: ProtectedRouteProps) => {
  const { isAuthenticated, isLoading, initializeAuth } = useAuthStore()
  const location = useLocation()

  useEffect(() => {
    if (!isAuthenticated) {
      initializeAuth()
    }
  }, [isAuthenticated, initializeAuth])

  // Show loading spinner while checking authentication
  if (isLoading) {
    return (
      <Center height="100vh" bg="microsoft.gray.50">
        <VStack spacing={4}>
          <Spinner size="xl" color="microsoft.blue.500" thickness="4px" />
          <Text color="microsoft.gray.600" fontSize="lg">
            Authenticating...
          </Text>
        </VStack>
      </Center>
    )
  }

  // Redirect to login if not authenticated
  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  return <>{children}</>
}