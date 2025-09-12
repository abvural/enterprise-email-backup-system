import {
  Box,
  Flex,
  VStack,
  Text,
  Input,
  Button,
  FormControl,
  FormLabel,
  FormErrorMessage,
  Alert,
  AlertIcon,
  Link,
  Center,
} from '@chakra-ui/react'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useNavigate, useLocation } from 'react-router-dom'
import { FiEye, FiEyeOff } from 'react-icons/fi'
import { useAuthStore } from '../stores/authStore'

// Validation schema
const loginSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
})

type LoginFormData = z.infer<typeof loginSchema>

export const Login = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const { login, register, isLoading, error, clearError } = useAuthStore()
  const [isRegisterMode, setIsRegisterMode] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

  const {
    register: registerForm,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  })

  const onSubmit = async (data: LoginFormData) => {
    clearError()
    
    const success = isRegisterMode
      ? await register(data.email, data.password)
      : await login(data.email, data.password)

    if (success) {
      const from = (location.state as any)?.from?.pathname || '/dashboard'
      navigate(from, { replace: true })
    }
  }

  const toggleMode = () => {
    setIsRegisterMode(!isRegisterMode)
    clearError()
    reset()
  }

  return (
    <Flex minHeight="100vh" bg="white" align="center" justify="center" p={4}>
      <Box
        maxW="400px"
        w="full"
        bg="white"
        border="1px solid"
        borderColor="gray.200"
        borderRadius="8px"
        p={8}
      >
        <VStack spacing={6} align="stretch">
          {/* Header */}
          <VStack spacing={2} align="center">
            <Box w={2} h={2} bg="black" borderRadius="full" mb={2} />
            <Text fontSize="xl" fontWeight="semibold" color="gray.900">
              {isRegisterMode ? 'Create account' : 'Sign in'}
            </Text>
            <Text fontSize="sm" color="gray.500" textAlign="center">
              {isRegisterMode 
                ? 'Get started with Email Backup' 
                : 'Welcome back to Email Backup'}
            </Text>
          </VStack>

          {/* Error Alert */}
          {error && (
            <Alert status="error" borderRadius="6px" bg="red.50" border="1px solid" borderColor="red.200">
              <AlertIcon color="red.500" />
              <Text fontSize="sm" color="red.600">{error}</Text>
            </Alert>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit(onSubmit)}>
            <VStack spacing={5} align="stretch">
              {/* Email Field */}
              <FormControl isInvalid={!!errors.email}>
                <FormLabel 
                  color="gray.900" 
                  fontSize="sm" 
                  fontWeight="medium"
                  mb={2}
                >
                  Email
                </FormLabel>
                <Input
                  {...registerForm('email')}
                  type="email"
                  placeholder="Enter your email"
                  fontSize="md"
                  bg="gray.50"
                  border="1px solid"
                  borderColor="gray.200"
                  borderRadius="6px"
                  _focus={{
                    borderColor: 'gray.400',
                    boxShadow: 'none',
                    bg: 'white',
                  }}
                />
                <FormErrorMessage fontSize="sm" color="red.500">
                  {errors.email?.message}
                </FormErrorMessage>
              </FormControl>

              {/* Password Field */}
              <FormControl isInvalid={!!errors.password}>
                <FormLabel 
                  color="gray.900" 
                  fontSize="sm" 
                  fontWeight="medium"
                  mb={2}
                >
                  Password
                </FormLabel>
                <Box position="relative">
                  <Input
                    {...registerForm('password')}
                    type={showPassword ? 'text' : 'password'}
                    placeholder={isRegisterMode ? 'Create a password' : 'Enter your password'}
                    fontSize="md"
                    bg="gray.50"
                    border="1px solid"
                    borderColor="gray.200"
                    borderRadius="6px"
                    pr="40px"
                    _focus={{
                      borderColor: 'gray.400',
                      boxShadow: 'none',
                      bg: 'white',
                    }}
                  />
                  <Button
                    variant="ghost"
                    size="sm"
                    position="absolute"
                    right="2px"
                    top="2px"
                    height="32px"
                    width="32px"
                    minW="32px"
                    onClick={() => setShowPassword(!showPassword)}
                    color="gray.400"
                    _hover={{
                      color: 'gray.600',
                      bg: 'transparent',
                    }}
                  >
                    {showPassword ? <FiEyeOff size={16} /> : <FiEye size={16} />}
                  </Button>
                </Box>
                <FormErrorMessage fontSize="sm" color="red.500">
                  {errors.password?.message}
                </FormErrorMessage>
              </FormControl>

              {/* Submit Button */}
              <Button
                type="submit"
                width="full"
                variant="solid"
                size="md"
                isLoading={isLoading || isSubmitting}
                loadingText={isRegisterMode ? 'Creating account...' : 'Signing in...'}
                mt={2}
              >
                {isRegisterMode ? 'Create account' : 'Sign in'}
              </Button>
            </VStack>
          </form>

          {/* Mode Toggle */}
          <VStack spacing={4} pt={2}>
            <Text fontSize="sm" color="gray.500" textAlign="center">
              {isRegisterMode
                ? 'Already have an account?'
                : "Don't have an account?"}
              {' '}
              <Link
                color="gray.900"
                fontWeight="medium"
                onClick={toggleMode}
                cursor="pointer"
                _hover={{ textDecoration: 'underline' }}
              >
                {isRegisterMode ? 'Sign in' : 'Create one'}
              </Link>
            </Text>
          </VStack>
        </VStack>
      </Box>
    </Flex>
  )
}