import React, { useState, useEffect } from 'react'
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  Button,
  VStack,
  HStack,
  FormControl,
  FormLabel,
  FormErrorMessage,
  FormHelperText,
  Input,
  Select,
  NumberInput,
  NumberInputField,
  NumberInputStepper,
  NumberIncrementStepper,
  NumberDecrementStepper,
  Switch,
  Text,
  Divider,
  useToast,
  Icon,
  Box,
} from '@chakra-ui/react'
import { FiServer, FiUsers, FiHome } from 'react-icons/fi'
import { FaBuilding } from 'react-icons/fa'
import { apiClient, type Organization as ApiOrganization } from '../../services/api'

// Using partial Organization type for form
interface Organization extends Partial<ApiOrganization> {
  id?: string
  name: string
  type: 'system' | 'distributor' | 'dealer' | 'client'
  is_active: boolean
}

interface OrganizationFormModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
  organization?: Organization | null
  parentOrganizations?: Array<{ id: string; name: string; type: string }>
}

export const OrganizationFormModal: React.FC<OrganizationFormModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  organization = null,
  parentOrganizations = [],
}) => {
  const toast = useToast()
  const isEdit = !!organization

  // Form state
  const [formData, setFormData] = useState<Organization>({
    name: '',
    type: 'client',
    parent_org_id: '',
    is_active: true,
    max_users: undefined,
    max_storage_gb: undefined,
    max_email_accounts: undefined,
  })

  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isLoading, setIsLoading] = useState(false)

  // Initialize form data
  useEffect(() => {
    if (isOpen) {
      if (organization) {
        setFormData({
          name: organization.name,
          type: organization.type,
          parent_org_id: organization.parent_org_id || '',
          is_active: organization.is_active,
          max_users: organization.max_users,
          max_storage_gb: organization.max_storage_gb,
          max_email_accounts: organization.max_email_accounts,
        })
      } else {
        setFormData({
          name: '',
          type: 'client',
          parent_org_id: '',
          is_active: true,
          max_users: undefined,
          max_storage_gb: undefined,
          max_email_accounts: undefined,
        })
      }
      setErrors({})
    }
  }, [isOpen, organization])

  // Validation
  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (!formData.name.trim()) {
      newErrors.name = 'Organization name is required'
    } else if (formData.name.length < 2) {
      newErrors.name = 'Organization name must be at least 2 characters'
    }

    if (!formData.type) {
      newErrors.type = 'Organization type is required'
    }

    // Validate numeric fields
    if (formData.max_users !== undefined && formData.max_users < 1) {
      newErrors.max_users = 'Maximum users must be at least 1'
    }

    if (formData.max_storage_gb !== undefined && formData.max_storage_gb < 1) {
      newErrors.max_storage_gb = 'Maximum storage must be at least 1 GB'
    }

    if (formData.max_email_accounts !== undefined && formData.max_email_accounts < 1) {
      newErrors.max_email_accounts = 'Maximum email accounts must be at least 1'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  // Handle form submission
  const handleSubmit = async () => {
    if (!validateForm()) return

    setIsLoading(true)
    try {
      const submitData = {
        ...formData,
        parent_org_id: formData.parent_org_id || undefined,
        max_users: formData.max_users || null,
        max_storage_gb: formData.max_storage_gb || null,
        max_email_accounts: formData.max_email_accounts || null,
      }

      if (isEdit && organization?.id) {
        await apiClient.put(`/api/organizations/${organization.id}`, submitData)
        toast({
          title: 'Organization Updated',
          description: `${formData.name} has been updated successfully.`,
          status: 'success',
          duration: 3000,
          isClosable: true,
        })
      } else {
        await apiClient.post('/api/organizations', submitData)
        toast({
          title: 'Organization Created',
          description: `${formData.name} has been created successfully.`,
          status: 'success',
          duration: 3000,
          isClosable: true,
        })
      }

      onSuccess()
      onClose()
    } catch (error: any) {
      console.error('Failed to save organization:', error)
      toast({
        title: 'Error',
        description: error.response?.data?.error || 'Failed to save organization. Please try again.',
        status: 'error',
        duration: 5000,
        isClosable: true,
      })
    } finally {
      setIsLoading(false)
    }
  }

  // Get type icon
  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'system': return FiServer
      case 'distributor': return FaBuilding
      case 'dealer': return FiUsers
      case 'client': return FiHome
      default: return FiServer
    }
  }

  // Filter parent organizations based on hierarchy rules
  const getAvailableParents = () => {
    const typeHierarchy = {
      'distributor': ['system'],
      'dealer': ['distributor'],
      'client': ['dealer'],
    }
    
    const allowedParentTypes = typeHierarchy[formData.type as keyof typeof typeHierarchy]
    if (!allowedParentTypes) return []
    
    return parentOrganizations.filter(org => allowedParentTypes.includes(org.type))
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="xl">
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>
          <HStack spacing={3}>
            <Icon as={getTypeIcon(formData.type)} color="blue.500" />
            <Text>{isEdit ? 'Edit Organization' : 'Create New Organization'}</Text>
          </HStack>
        </ModalHeader>
        <ModalCloseButton />
        
        <ModalBody>
          <VStack spacing={6} align="stretch">
            {/* Basic Information */}
            <Box>
              <Text fontSize="sm" fontWeight="semibold" color="gray.600" mb={4}>
                BASIC INFORMATION
              </Text>
              
              <VStack spacing={4} align="stretch">
                <FormControl isInvalid={!!errors.name} isRequired>
                  <FormLabel>Organization Name</FormLabel>
                  <Input
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Enter organization name"
                  />
                  <FormErrorMessage>{errors.name}</FormErrorMessage>
                </FormControl>

                <FormControl isInvalid={!!errors.type} isRequired>
                  <FormLabel>Organization Type</FormLabel>
                  <Select
                    value={formData.type}
                    onChange={(e) => setFormData({ 
                      ...formData, 
                      type: e.target.value as Organization['type'],
                      parent_org_id: '' // Reset parent when type changes
                    })}
                    disabled={isEdit} // Don't allow changing type for existing orgs
                  >
                    <option value="distributor">Distributor</option>
                    <option value="dealer">Dealer</option>
                    <option value="client">Client</option>
                  </Select>
                  <FormHelperText>
                    {isEdit ? 'Organization type cannot be changed after creation' : 'Choose the organization type in your hierarchy'}
                  </FormHelperText>
                  <FormErrorMessage>{errors.type}</FormErrorMessage>
                </FormControl>

                <FormControl>
                  <FormLabel>Parent Organization</FormLabel>
                  <Select
                    value={formData.parent_org_id}
                    onChange={(e) => setFormData({ ...formData, parent_org_id: e.target.value })}
                  >
                    <option value="">Select parent organization (optional)</option>
                    {getAvailableParents().map((org) => (
                      <option key={org.id} value={org.id}>
                        {org.name} ({org.type})
                      </option>
                    ))}
                  </Select>
                  <FormHelperText>
                    Choose the parent organization in the hierarchy
                  </FormHelperText>
                </FormControl>

                <FormControl>
                  <FormLabel>Status</FormLabel>
                  <HStack>
                    <Switch
                      isChecked={formData.is_active}
                      onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                    />
                    <Text fontSize="sm" color={formData.is_active ? 'green.600' : 'red.600'}>
                      {formData.is_active ? 'Active' : 'Inactive'}
                    </Text>
                  </HStack>
                  <FormHelperText>
                    Inactive organizations cannot be used by users
                  </FormHelperText>
                </FormControl>
              </VStack>
            </Box>

            <Divider />

            {/* Resource Limits */}
            <Box>
              <Text fontSize="sm" fontWeight="semibold" color="gray.600" mb={4}>
                RESOURCE LIMITS
              </Text>
              
              <VStack spacing={4} align="stretch">
                <FormControl isInvalid={!!errors.max_users}>
                  <FormLabel>Maximum Users</FormLabel>
                  <NumberInput
                    value={formData.max_users || ''}
                    onChange={(_, num) => setFormData({ 
                      ...formData, 
                      max_users: isNaN(num) ? undefined : num 
                    })}
                    min={1}
                  >
                    <NumberInputField placeholder="Unlimited" />
                    <NumberInputStepper>
                      <NumberIncrementStepper />
                      <NumberDecrementStepper />
                    </NumberInputStepper>
                  </NumberInput>
                  <FormHelperText>
                    Maximum number of users allowed (leave empty for unlimited)
                  </FormHelperText>
                  <FormErrorMessage>{errors.max_users}</FormErrorMessage>
                </FormControl>

                <FormControl isInvalid={!!errors.max_storage_gb}>
                  <FormLabel>Maximum Storage (GB)</FormLabel>
                  <NumberInput
                    value={formData.max_storage_gb || ''}
                    onChange={(_, num) => setFormData({ 
                      ...formData, 
                      max_storage_gb: isNaN(num) ? undefined : num 
                    })}
                    min={1}
                  >
                    <NumberInputField placeholder="Unlimited" />
                    <NumberInputStepper>
                      <NumberIncrementStepper />
                      <NumberDecrementStepper />
                    </NumberInputStepper>
                  </NumberInput>
                  <FormHelperText>
                    Maximum storage in gigabytes (leave empty for unlimited)
                  </FormHelperText>
                  <FormErrorMessage>{errors.max_storage_gb}</FormErrorMessage>
                </FormControl>

                <FormControl isInvalid={!!errors.max_email_accounts}>
                  <FormLabel>Maximum Email Accounts</FormLabel>
                  <NumberInput
                    value={formData.max_email_accounts || ''}
                    onChange={(_, num) => setFormData({ 
                      ...formData, 
                      max_email_accounts: isNaN(num) ? undefined : num 
                    })}
                    min={1}
                  >
                    <NumberInputField placeholder="Unlimited" />
                    <NumberInputStepper>
                      <NumberIncrementStepper />
                      <NumberDecrementStepper />
                    </NumberInputStepper>
                  </NumberInput>
                  <FormHelperText>
                    Maximum number of email accounts allowed (leave empty for unlimited)
                  </FormHelperText>
                  <FormErrorMessage>{errors.max_email_accounts}</FormErrorMessage>
                </FormControl>
              </VStack>
            </Box>
          </VStack>
        </ModalBody>

        <ModalFooter>
          <HStack spacing={3}>
            <Button variant="ghost" onClick={onClose}>
              Cancel
            </Button>
            <Button
              colorScheme="blue"
              onClick={handleSubmit}
              isLoading={isLoading}
              loadingText={isEdit ? 'Updating...' : 'Creating...'}
            >
              {isEdit ? 'Update Organization' : 'Create Organization'}
            </Button>
          </HStack>
        </ModalFooter>
      </ModalContent>
    </Modal>
  )
}

export default OrganizationFormModal