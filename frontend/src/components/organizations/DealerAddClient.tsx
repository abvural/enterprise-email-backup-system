import React, { useState } from 'react'
import {
  Box,
  VStack,
  Text,
  FormControl,
  FormLabel,
  Input,
  NumberInput,
  NumberInputField,
  NumberInputStepper,
  NumberIncrementStepper,
  NumberDecrementStepper,
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
} from '@chakra-ui/react'
import { MdBusiness, MdArrowBack } from 'react-icons/md'
import { useNavigate } from 'react-router-dom'
import { Layout } from '../layout/Layout'
import { useAuthStore } from '../../stores/authStore'
import { organizationsAPI } from '../../services/api'

interface FormData {
  name: string
  max_users?: number
  max_storage_gb?: number
  max_email_accounts?: number
}

interface FormErrors {
  name?: string
}

export const DealerAddClient: React.FC = () => {
  const navigate = useNavigate()
  const toast = useToast()
  const { user } = useAuthStore()
  
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState<FormData>({
    name: '',
  })
  const [errors, setErrors] = useState<FormErrors>({})

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {}

    if (!formData.name.trim()) {
      newErrors.name = 'Client name is required'
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

      const submitData = {
        name: formData.name.trim(),
        type: 'client' as const,
        parent_org_id: user?.primary_org?.id,
        ...(formData.max_users && { max_users: formData.max_users }),
        ...(formData.max_storage_gb && { max_storage_gb: formData.max_storage_gb }),
        ...(formData.max_email_accounts && { max_email_accounts: formData.max_email_accounts }),
      }

      await organizationsAPI.createOrganization(submitData)
      
      toast({
        title: 'Client Created',
        description: `${submitData.name} has been created successfully.`,
        status: 'success',
        duration: 3000,
        isClosable: true,
      })

      // Navigate back to dealer clients view
      navigate('/dealer/clients')
    } catch (error: any) {
      const errorMessage = error.response?.data?.error || 'Failed to create client'
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

  return (
    <Layout>
      <Box p={8} bg="white" minH="100vh">
        <VStack align="stretch" spacing={6} maxW="600px" mx="auto">
          {/* Header */}
          <VStack align="start" spacing={1}>
            <HStack>
              <Button
                variant="ghost"
                size="sm"
                leftIcon={<Icon as={MdArrowBack} />}
                onClick={() => navigate('/dealer/clients')}
              >
                Back to My Clients
              </Button>
            </HStack>
            <HStack spacing={3}>
              <Icon as={MdBusiness} boxSize={6} color="green.500" />
              <VStack align="start" spacing={0}>
                <Text fontSize="2xl" fontWeight="bold" color="gray.900">
                  Add New Client
                </Text>
                <Text fontSize="md" color="gray.600">
                  Create a new client organization for your dealership
                </Text>
              </VStack>
            </HStack>
          </VStack>

          <Card>
            <CardHeader>
              <Alert status="info">
                <AlertIcon />
                <Text fontSize="sm">
                  Creating client under: <strong>{user?.primary_org?.name}</strong>
                </Text>
              </Alert>
            </CardHeader>

            <CardBody>
              <VStack spacing={6} align="stretch">
                <FormControl isRequired isInvalid={!!errors.name}>
                  <FormLabel>Client Organization Name</FormLabel>
                  <Input
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Enter client organization name"
                    isDisabled={loading}
                    size="lg"
                  />
                  <FormErrorMessage>{errors.name}</FormErrorMessage>
                </FormControl>

                <Alert status="warning" variant="left-accent">
                  <AlertIcon />
                  <Text fontSize="sm">
                    Client organizations can only create end user accounts, not sub-organizations.
                  </Text>
                </Alert>

                <Text fontSize="lg" fontWeight="semibold" color="gray.900">
                  Resource Limits (Optional)
                </Text>

                <FormControl>
                  <FormLabel>Maximum End Users</FormLabel>
                  <NumberInput
                    min={1}
                    value={formData.max_users || ''}
                    onChange={(_, value) => setFormData({ ...formData, max_users: isNaN(value) ? undefined : value })}
                    isDisabled={loading}
                    size="lg"
                  >
                    <NumberInputField placeholder="Unlimited" />
                    <NumberInputStepper>
                      <NumberIncrementStepper />
                      <NumberDecrementStepper />
                    </NumberInputStepper>
                  </NumberInput>
                </FormControl>

                <FormControl>
                  <FormLabel>Maximum Storage (GB)</FormLabel>
                  <NumberInput
                    min={1}
                    value={formData.max_storage_gb || ''}
                    onChange={(_, value) => setFormData({ ...formData, max_storage_gb: isNaN(value) ? undefined : value })}
                    isDisabled={loading}
                    size="lg"
                  >
                    <NumberInputField placeholder="Unlimited" />
                    <NumberInputStepper>
                      <NumberIncrementStepper />
                      <NumberDecrementStepper />
                    </NumberInputStepper>
                  </NumberInput>
                </FormControl>

                <FormControl>
                  <FormLabel>Maximum Email Accounts per User</FormLabel>
                  <NumberInput
                    min={1}
                    value={formData.max_email_accounts || ''}
                    onChange={(_, value) => setFormData({ ...formData, max_email_accounts: isNaN(value) ? undefined : value })}
                    isDisabled={loading}
                    size="lg"
                  >
                    <NumberInputField placeholder="Unlimited" />
                    <NumberInputStepper>
                      <NumberIncrementStepper />
                      <NumberDecrementStepper />
                    </NumberInputStepper>
                  </NumberInput>
                </FormControl>

                <HStack spacing={4} pt={4}>
                  <Button
                    variant="outline"
                    onClick={() => navigate('/dealer/clients')}
                    isDisabled={loading}
                    flex={1}
                  >
                    Cancel
                  </Button>
                  <Button
                    colorScheme="green"
                    onClick={handleSubmit}
                    isLoading={loading}
                    loadingText="Creating..."
                    leftIcon={<Icon as={MdBusiness} />}
                    flex={1}
                  >
                    Create Client
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

export default DealerAddClient