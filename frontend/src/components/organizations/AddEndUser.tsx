import React, { useState } from 'react'
import {
  Box,
  VStack,
  Text,
  FormControl,
  FormLabel,
  Input,
  Button,
  Card,
  CardHeader,
  CardBody,
  Alert,
  AlertIcon,
  FormErrorMessage,
  useToast,
  HStack,
  Icon,
  Switch,
  Textarea,
  SimpleGrid,
} from '@chakra-ui/react'
import { MdPersonAdd, MdArrowBack } from 'react-icons/md'
import { useNavigate } from 'react-router-dom'
import { Layout } from '../layout/Layout'
import { useAuthStore } from '../../stores/authStore'

interface FormData {
  firstName: string
  lastName: string
  email: string
  password: string
  confirmPassword: string
  sendWelcomeEmail: boolean
  notes?: string
}

interface FormErrors {
  firstName?: string
  lastName?: string
  email?: string
  password?: string
  confirmPassword?: string
}

export const AddEndUser: React.FC = () => {
  const navigate = useNavigate()
  const toast = useToast()
  const { user } = useAuthStore()
  
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState<FormData>({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
    sendWelcomeEmail: true,
    notes: '',
  })
  const [errors, setErrors] = useState<FormErrors>({})

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {}

    if (!formData.firstName.trim()) {
      newErrors.firstName = 'First name is required'
    }

    if (!formData.lastName.trim()) {
      newErrors.lastName = 'Last name is required'
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required'
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address'
    }

    if (!formData.password) {
      newErrors.password = 'Password is required'
    } else if (formData.password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters long'
    }

    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async () => {
    if (!validateForm()) {
      return
    }

    try {
      setLoading(true)

      // Mock API call - replace with actual user creation API
      const userData = {
        firstName: formData.firstName.trim(),
        lastName: formData.lastName.trim(),
        email: formData.email.trim(),
        password: formData.password,
        organizationId: user?.primary_org?.id,
        role: 'end_user',
        sendWelcomeEmail: formData.sendWelcomeEmail,
        notes: formData.notes?.trim(),
      }

      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 2000))

      console.log('Creating user:', userData)
      
      toast({
        title: 'User Created',
        description: `${formData.firstName} ${formData.lastName} has been created successfully.`,
        status: 'success',
        duration: 3000,
        isClosable: true,
      })

      // Navigate back to user management
      navigate('/client/users')
    } catch (error: any) {
      const errorMessage = error.response?.data?.error || 'Failed to create user'
      toast({
        title: 'Error',
        description: errorMessage,
        status: 'error',
        duration: 5000,
        isClosable: true,
      })
    } finally {
      setLoading(false)
    }
  }

  const generateRandomPassword = () => {
    const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*'
    let password = ''
    for (let i = 0; i < 12; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length))
    }
    setFormData({ ...formData, password, confirmPassword: password })
  }

  return (
    <Layout>
      <Box p={8} bg="white" minH="100vh">
        <VStack align="stretch" spacing={6} maxW="700px" mx="auto">
          {/* Header */}
          <VStack align="start" spacing={1}>
            <HStack>
              <Button
                variant="ghost"
                size="sm"
                leftIcon={<Icon as={MdArrowBack} />}
                onClick={() => navigate('/client/users')}
              >
                Back to User Management
              </Button>
            </HStack>
            <HStack spacing={3}>
              <Icon as={MdPersonAdd} boxSize={6} color="purple.500" />
              <VStack align="start" spacing={0}>
                <Text fontSize="2xl" fontWeight="bold" color="gray.900">
                  Add New End User
                </Text>
                <Text fontSize="md" color="gray.600">
                  Create a new end user account in your organization
                </Text>
              </VStack>
            </HStack>
          </VStack>

          <Card>
            <CardHeader>
              <Alert status="info">
                <AlertIcon />
                <Text fontSize="sm">
                  Creating end user for: <strong>{user?.primary_org?.name}</strong>
                </Text>
              </Alert>
            </CardHeader>

            <CardBody>
              <VStack spacing={6} align="stretch">
                {/* Personal Information */}
                <VStack align="stretch" spacing={4}>
                  <Text fontSize="lg" fontWeight="semibold" color="gray.900">
                    Personal Information
                  </Text>
                  
                  <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
                    <FormControl isRequired isInvalid={!!errors.firstName}>
                      <FormLabel>First Name</FormLabel>
                      <Input
                        value={formData.firstName}
                        onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                        placeholder="Enter first name"
                        isDisabled={loading}
                        size="lg"
                      />
                      <FormErrorMessage>{errors.firstName}</FormErrorMessage>
                    </FormControl>

                    <FormControl isRequired isInvalid={!!errors.lastName}>
                      <FormLabel>Last Name</FormLabel>
                      <Input
                        value={formData.lastName}
                        onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                        placeholder="Enter last name"
                        isDisabled={loading}
                        size="lg"
                      />
                      <FormErrorMessage>{errors.lastName}</FormErrorMessage>
                    </FormControl>
                  </SimpleGrid>

                  <FormControl isRequired isInvalid={!!errors.email}>
                    <FormLabel>Email Address</FormLabel>
                    <Input
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      placeholder="Enter email address"
                      isDisabled={loading}
                      size="lg"
                    />
                    <FormErrorMessage>{errors.email}</FormErrorMessage>
                  </FormControl>
                </VStack>

                {/* Password Section */}
                <VStack align="stretch" spacing={4}>
                  <HStack justify="space-between">
                    <Text fontSize="lg" fontWeight="semibold" color="gray.900">
                      Password
                    </Text>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={generateRandomPassword}
                      isDisabled={loading}
                    >
                      Generate Random
                    </Button>
                  </HStack>

                  <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
                    <FormControl isRequired isInvalid={!!errors.password}>
                      <FormLabel>Password</FormLabel>
                      <Input
                        type="password"
                        value={formData.password}
                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                        placeholder="Enter password (min 8 characters)"
                        isDisabled={loading}
                        size="lg"
                      />
                      <FormErrorMessage>{errors.password}</FormErrorMessage>
                    </FormControl>

                    <FormControl isRequired isInvalid={!!errors.confirmPassword}>
                      <FormLabel>Confirm Password</FormLabel>
                      <Input
                        type="password"
                        value={formData.confirmPassword}
                        onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                        placeholder="Confirm password"
                        isDisabled={loading}
                        size="lg"
                      />
                      <FormErrorMessage>{errors.confirmPassword}</FormErrorMessage>
                    </FormControl>
                  </SimpleGrid>
                </VStack>

                {/* Additional Options */}
                <VStack align="stretch" spacing={4}>
                  <Text fontSize="lg" fontWeight="semibold" color="gray.900">
                    Options
                  </Text>

                  <FormControl>
                    <HStack justify="space-between">
                      <VStack align="start" spacing={0}>
                        <FormLabel mb={0}>Send Welcome Email</FormLabel>
                        <Text fontSize="sm" color="gray.600">
                          Send login credentials and welcome message to the user
                        </Text>
                      </VStack>
                      <Switch
                        isChecked={formData.sendWelcomeEmail}
                        onChange={(e) => setFormData({ ...formData, sendWelcomeEmail: e.target.checked })}
                        isDisabled={loading}
                        colorScheme="purple"
                      />
                    </HStack>
                  </FormControl>

                  <FormControl>
                    <FormLabel>Notes (Optional)</FormLabel>
                    <Textarea
                      value={formData.notes}
                      onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                      placeholder="Add any notes about this user..."
                      isDisabled={loading}
                      resize="vertical"
                      minH="100px"
                    />
                  </FormControl>
                </VStack>

                {/* Organization Limits Info */}
                <Alert status="info" variant="left-accent">
                  <AlertIcon />
                  <VStack align="start" spacing={1}>
                    <Text fontSize="sm" fontWeight="medium">
                      User will have the following limits:
                    </Text>
                    <Text fontSize="sm">
                      • Email Accounts: {user?.primary_org?.max_email_accounts || 'Unlimited'} per user
                    </Text>
                    <Text fontSize="sm">
                      • Organization Storage: {user?.primary_org?.max_storage_gb ? `${user.primary_org.max_storage_gb}GB` : 'Unlimited'} total
                    </Text>
                  </VStack>
                </Alert>

                <HStack spacing={4} pt={4}>
                  <Button
                    variant="outline"
                    onClick={() => navigate('/client/users')}
                    isDisabled={loading}
                    flex={1}
                  >
                    Cancel
                  </Button>
                  <Button
                    colorScheme="purple"
                    onClick={handleSubmit}
                    isLoading={loading}
                    loadingText="Creating User..."
                    leftIcon={<Icon as={MdPersonAdd} />}
                    flex={1}
                  >
                    Create End User
                  </Button>
                </HStack>
              </VStack>
            </CardBody>
          </Card>
        </VStack>
      </Box>
    </Layout>
  )
}

export default AddEndUser