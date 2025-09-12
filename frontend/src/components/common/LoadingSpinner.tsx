import {
  Box,
  Spinner,
  VStack,
  Text,
  Center,
  useColorModeValue,
} from '@chakra-ui/react'

interface LoadingSpinnerProps {
  message?: string
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl'
  fullScreen?: boolean
  color?: string
}

export const LoadingSpinner = ({
  message = 'Loading...',
  size = 'xl',
  fullScreen = false,
  color = 'gray.400',
}: LoadingSpinnerProps) => {
  const bgColor = useColorModeValue('white', 'gray.900')
  const textColor = useColorModeValue('gray.600', 'gray.400')

  const spinner = (
    <VStack spacing={4}>
      <Spinner size={size} color={color} thickness="2px" />
      {message && (
        <Text color={textColor} fontSize="sm" fontWeight="normal">
          {message}
        </Text>
      )}
    </VStack>
  )

  if (fullScreen) {
    return (
      <Center minHeight="100vh" bg={bgColor}>
        {spinner}
      </Center>
    )
  }

  return (
    <Center py={12}>
      {spinner}
    </Center>
  )
}

// Inline loading spinner for buttons, etc.
export const InlineSpinner = ({ size = 'sm', color = 'gray.400' }: Pick<LoadingSpinnerProps, 'size' | 'color'>) => (
  <Spinner size={size} color={color} thickness="2px" />
)

// Page loading component
export const PageLoading = ({ message = 'Loading page...' }: Pick<LoadingSpinnerProps, 'message'>) => (
  <LoadingSpinner message={message} fullScreen />
)

// Card loading component
export const CardLoading = ({ message = 'Loading...' }: Pick<LoadingSpinnerProps, 'message'>) => (
  <Box p={8} textAlign="center">
    <LoadingSpinner message={message} size="lg" />
  </Box>
)