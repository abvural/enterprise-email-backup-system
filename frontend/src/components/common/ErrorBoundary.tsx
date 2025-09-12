import React, { Component, type ReactNode, type ErrorInfo } from 'react'
import {
  Box,
  Heading,
  Text,
  Button,
  VStack,
  Alert,
  AlertIcon,
  Center,
  Card,
  CardBody,
  useColorModeValue,
} from '@chakra-ui/react'
import { FiRefreshCw, FiAlertTriangle } from 'react-icons/fi'

interface Props {
  children: ReactNode
  fallback?: ReactNode
}

interface State {
  hasError: boolean
  error?: Error
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo)
    
    // In a production app, you would log this to an error reporting service
    // logErrorToService(error, errorInfo)
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: undefined })
  }

  render() {
    if (this.state.hasError) {
      // Custom fallback UI
      if (this.props.fallback) {
        return this.props.fallback
      }

      // Default error UI
      return <DefaultErrorFallback error={this.state.error} onRetry={this.handleRetry} />
    }

    return this.props.children
  }
}

interface DefaultErrorFallbackProps {
  error?: Error
  onRetry: () => void
}

const DefaultErrorFallback = ({ error, onRetry }: DefaultErrorFallbackProps) => {
  const bgColor = useColorModeValue('microsoft.gray.50', 'microsoft.gray.900')
  const cardBg = useColorModeValue('white', 'microsoft.gray.800')
  const textColor = useColorModeValue('microsoft.gray.800', 'microsoft.gray.100')

  return (
    <Center minHeight="100vh" bg={bgColor} p={4}>
      <Card maxW="md" bg={cardBg} shadow="xl">
        <CardBody>
          <VStack spacing={6} textAlign="center">
            <Box color="red.500">
              <FiAlertTriangle size={48} />
            </Box>
            
            <VStack spacing={2}>
              <Heading size="lg" color={textColor}>
                Something went wrong
              </Heading>
              <Text color="microsoft.gray.600" fontSize="md">
                We're sorry! An unexpected error occurred. Please try refreshing the page.
              </Text>
            </VStack>

            {error && process.env.NODE_ENV === 'development' && (
              <Alert status="error" borderRadius="md" textAlign="left">
                <AlertIcon />
                <Box fontSize="sm">
                  <Text fontWeight="bold">Error Details:</Text>
                  <Text fontFamily="monospace" fontSize="xs" mt={1}>
                    {error.message}
                  </Text>
                </Box>
              </Alert>
            )}

            <VStack spacing={3} width="full">
              <Button
                leftIcon={<FiRefreshCw />}
                onClick={onRetry}
                colorScheme="blue"
                size="lg"
                width="full"
              >
                Try Again
              </Button>
              
              <Button
                variant="outline"
                size="md"
                onClick={() => window.location.href = '/'}
              >
                Go to Dashboard
              </Button>
            </VStack>
          </VStack>
        </CardBody>
      </Card>
    </Center>
  )
}

// Hook version for functional components
export const useErrorHandler = () => {
  const [error, setError] = React.useState<Error | null>(null)

  const resetError = () => setError(null)

  const handleError = React.useCallback((error: Error) => {
    console.error('Error caught by useErrorHandler:', error)
    setError(error)
  }, [])

  React.useEffect(() => {
    if (error) {
      throw error
    }
  }, [error])

  return { handleError, resetError, error }
}