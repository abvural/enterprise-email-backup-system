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
  FormControl,
  FormLabel,
  Input,
  Select,
  NumberInput,
  NumberInputField,
  NumberInputStepper,
  NumberIncrementStepper,
  NumberDecrementStepper,
  VStack,
  Text,
  Alert,
  AlertIcon,
  Switch,
  HStack,
  FormErrorMessage,
  useToast,
} from '@chakra-ui/react'
import { type Organization, organizationsAPI } from '../../services/api'

interface OrganizationFormProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
  editOrganization?: Organization | null
  parentOrganization?: Organization | null
}

interface FormData {
  name: string
  type: 'distributor' | 'dealer' | 'client'
  parent_org_id?: string
  max_users?: number
  max_storage_gb?: number
  max_email_accounts?: number
  is_active: boolean
}

interface FormErrors {
  name?: string
  type?: string
}

export const OrganizationForm: React.FC<OrganizationFormProps> = ({
  isOpen,
  onClose,
  onSuccess,
  editOrganization,
  parentOrganization,
}) => {
  const toast = useToast()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState<FormData>({
    name: '',
    type: 'distributor',
    is_active: true,
  })
  const [errors, setErrors] = useState<FormErrors>({})

  const isEdit = !!editOrganization
  const modalTitle = isEdit ? 'Edit Organization' : 'Create Organization'
  const submitButtonText = isEdit ? 'Update Organization' : 'Create Organization'

  useEffect(() => {
    if (isOpen) {
      if (editOrganization) {
        // Populate form with existing organization data
        setFormData({
          name: editOrganization.name,
          type: editOrganization.type === 'system' ? 'distributor' : editOrganization.type,
          parent_org_id: editOrganization.parent_org_id,
          max_users: editOrganization.max_users || undefined,
          max_storage_gb: editOrganization.max_storage_gb || undefined,
          max_email_accounts: editOrganization.max_email_accounts || undefined,
          is_active: editOrganization.is_active,
        })
      } else {
        // Reset form for new organization
        setFormData({
          name: '',
          type: 'distributor',
          parent_org_id: parentOrganization?.id,
          is_active: true,
        })
      }
      setErrors({})
    }
  }, [isOpen, editOrganization, parentOrganization])

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {}

    if (!formData.name.trim()) {
      newErrors.name = 'Organization name is required'
    }

    if (!formData.type) {
      newErrors.type = 'Organization type is required'
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
        type: formData.type,
        ...(formData.parent_org_id && { parent_org_id: formData.parent_org_id }),
        ...(formData.max_users && { max_users: formData.max_users }),
        ...(formData.max_storage_gb && { max_storage_gb: formData.max_storage_gb }),
        ...(formData.max_email_accounts && { max_email_accounts: formData.max_email_accounts }),
      }

      if (isEdit && editOrganization) {
        // Update existing organization
        await organizationsAPI.updateOrganization(editOrganization.id, {
          name: submitData.name,
          max_users: submitData.max_users,
          max_storage_gb: submitData.max_storage_gb,
          max_email_accounts: submitData.max_email_accounts,
          is_active: formData.is_active,
        })
        
        toast({
          title: 'Organization Updated',
          description: `${submitData.name} has been updated successfully.`,
          status: 'success',
          duration: 3000,
          isClosable: true,
        })
      } else {
        // Create new organization
        await organizationsAPI.createOrganization(submitData)
        
        toast({
          title: 'Organization Created',
          description: `${submitData.name} has been created successfully.`,
          status: 'success',
          duration: 3000,
          isClosable: true,
        })
      }

      onSuccess()
      onClose()
    } catch (error: any) {
      const errorMessage = error.response?.data?.error || 'Failed to save organization'
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

  const handleClose = () => {
    if (!loading) {
      onClose()
    }
  }

  const getAvailableTypes = (): Array<{ value: 'distributor' | 'dealer' | 'client'; label: string }> => {
    // System organizations can create distributors, dealers, and clients
    // Distributors can create dealers and clients
    // Dealers can create clients
    // Clients cannot create child organizations
    
    if (parentOrganization?.type === 'system') {
      return [
        { value: 'distributor', label: 'Distributor' },
        { value: 'dealer', label: 'Dealer' },
        { value: 'client', label: 'Client' },
      ]
    } else if (parentOrganization?.type === 'distributor') {
      return [
        { value: 'dealer', label: 'Dealer' },
        { value: 'client', label: 'Client' },
      ]
    } else if (parentOrganization?.type === 'dealer') {
      return [
        { value: 'client', label: 'Client' },
      ]
    }
    
    // Default for edit mode or unknown parent
    return [
      { value: 'distributor', label: 'Distributor' },
      { value: 'dealer', label: 'Dealer' },
      { value: 'client', label: 'Client' },
    ]
  }

  return (
    <Modal isOpen={isOpen} onClose={handleClose} size="md">
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>{modalTitle}</ModalHeader>
        <ModalCloseButton isDisabled={loading} />
        
        <ModalBody>
          <VStack spacing={4} align="stretch">
            {parentOrganization && !isEdit && (
              <Alert status="info">
                <AlertIcon />
                <Text fontSize="sm">
                  Creating organization under: <strong>{parentOrganization.name}</strong>
                </Text>
              </Alert>
            )}

            <FormControl isRequired isInvalid={!!errors.name}>
              <FormLabel>Organization Name</FormLabel>
              <Input
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Enter organization name"
                isDisabled={loading}
              />
              <FormErrorMessage>{errors.name}</FormErrorMessage>
            </FormControl>

            <FormControl isRequired isInvalid={!!errors.type} isDisabled={isEdit}>
              <FormLabel>Organization Type</FormLabel>
              <Select
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value as any })}
                isDisabled={loading || isEdit}
              >
                {getAvailableTypes().map((type) => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </Select>
              <FormErrorMessage>{errors.type}</FormErrorMessage>
              {isEdit && (
                <Text fontSize="xs" color="gray.500" mt={1}>
                  Organization type cannot be changed after creation
                </Text>
              )}
            </FormControl>

            <FormControl>
              <FormLabel>Maximum Users</FormLabel>
              <NumberInput
                min={1}
                value={formData.max_users || ''}
                onChange={(_, value) => setFormData({ ...formData, max_users: isNaN(value) ? undefined : value })}
                isDisabled={loading}
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
              >
                <NumberInputField placeholder="Unlimited" />
                <NumberInputStepper>
                  <NumberIncrementStepper />
                  <NumberDecrementStepper />
                </NumberInputStepper>
              </NumberInput>
            </FormControl>

            <FormControl>
              <FormLabel>Maximum Email Accounts</FormLabel>
              <NumberInput
                min={1}
                value={formData.max_email_accounts || ''}
                onChange={(_, value) => setFormData({ ...formData, max_email_accounts: isNaN(value) ? undefined : value })}
                isDisabled={loading}
              >
                <NumberInputField placeholder="Unlimited" />
                <NumberInputStepper>
                  <NumberIncrementStepper />
                  <NumberDecrementStepper />
                </NumberInputStepper>
              </NumberInput>
            </FormControl>

            {isEdit && (
              <FormControl>
                <HStack justify="space-between">
                  <FormLabel mb={0}>Active Status</FormLabel>
                  <Switch
                    isChecked={formData.is_active}
                    onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                    isDisabled={loading}
                  />
                </HStack>
              </FormControl>
            )}
          </VStack>
        </ModalBody>

        <ModalFooter>
          <Button variant="ghost" mr={3} onClick={handleClose} isDisabled={loading}>
            Cancel
          </Button>
          <Button colorScheme="blue" onClick={handleSubmit} isLoading={loading}>
            {submitButtonText}
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  )
}

export default OrganizationForm