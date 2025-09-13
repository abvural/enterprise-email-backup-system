import React, { useState } from 'react'
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
  Text,
  Alert,
  AlertIcon,
  AlertDescription,
  Input,
  FormControl,
  FormLabel,
  FormHelperText,
  FormErrorMessage,
  useToast,
  Icon,
  Box,
} from '@chakra-ui/react'
import { FiAlertTriangle, FiTrash2 } from 'react-icons/fi'
import { apiClient } from '../../services/api'

interface Organization {
  id: string
  name: string
  type: string
  is_active: boolean
}

interface OrganizationDeleteModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
  organization: Organization | null
}

export const OrganizationDeleteModal: React.FC<OrganizationDeleteModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  organization,
}) => {
  const toast = useToast()
  const [confirmationText, setConfirmationText] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const expectedText = organization?.name || ''
  const isConfirmationValid = confirmationText === expectedText

  const handleDelete = async () => {
    if (!organization?.id || !isConfirmationValid) return

    setIsLoading(true)
    try {
      await apiClient.delete(`/api/organizations/${organization.id}`)
      
      toast({
        title: 'Organization Deleted',
        description: `${organization.name} has been deactivated successfully.`,
        status: 'success',
        duration: 3000,
        isClosable: true,
      })

      onSuccess()
      onClose()
    } catch (error: any) {
      console.error('Failed to delete organization:', error)
      toast({
        title: 'Error',
        description: error.response?.data?.error || 'Failed to delete organization. Please try again.',
        status: 'error',
        duration: 5000,
        isClosable: true,
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleClose = () => {
    setConfirmationText('')
    onClose()
  }

  if (!organization) return null

  return (
    <Modal isOpen={isOpen} onClose={handleClose} size="md">
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>
          <HStack spacing={3}>
            <Icon as={FiAlertTriangle} color="red.500" boxSize={6} />
            <Text>Delete Organization</Text>
          </HStack>
        </ModalHeader>
        <ModalCloseButton />
        
        <ModalBody>
          <VStack spacing={6} align="stretch">
            {/* Warning Alert */}
            <Alert status="error" borderRadius="md">
              <AlertIcon />
              <AlertDescription fontSize="sm">
                This action will deactivate the organization and restrict access for all users.
                This cannot be undone easily.
              </AlertDescription>
            </Alert>

            {/* Organization Info */}
            <Box
              p={4}
              bg="gray.50"
              borderRadius="md"
              border="1px"
              borderColor="gray.200"
            >
              <VStack align="flex-start" spacing={2}>
                <Text fontSize="sm" color="gray.600">Organization to delete:</Text>
                <Text fontSize="lg" fontWeight="semibold">{organization.name}</Text>
                <HStack spacing={2}>
                  <Text fontSize="sm" color="gray.500">
                    Type: <strong>{organization.type}</strong>
                  </Text>
                  <Text fontSize="sm" color="gray.500">
                    Status: <strong>{organization.is_active ? 'Active' : 'Inactive'}</strong>
                  </Text>
                </HStack>
              </VStack>
            </Box>

            {/* Impact Warning */}
            <Alert status="warning" borderRadius="md">
              <AlertIcon />
              <VStack align="flex-start" spacing={2} fontSize="sm">
                <Text fontWeight="medium">This will impact:</Text>
                <VStack align="flex-start" spacing={1} pl={2}>
                  <Text>• All users in this organization will lose access</Text>
                  <Text>• Child organizations may be affected</Text>
                  <Text>• Email backup services will be suspended</Text>
                  <Text>• Data will remain but become inaccessible</Text>
                </VStack>
              </VStack>
            </Alert>

            {/* Confirmation Input */}
            <FormControl isInvalid={confirmationText.length > 0 && !isConfirmationValid}>
              <FormLabel fontSize="sm" fontWeight="semibold">
                Confirmation Required
              </FormLabel>
              <Input
                value={confirmationText}
                onChange={(e) => setConfirmationText(e.target.value)}
                placeholder={`Type "${expectedText}" to confirm`}
                focusBorderColor="red.500"
              />
              <FormHelperText fontSize="xs">
                Type the organization name exactly as shown above to confirm deletion.
              </FormHelperText>
              {confirmationText.length > 0 && !isConfirmationValid && (
                <FormErrorMessage fontSize="xs">
                  The text doesn't match the organization name.
                </FormErrorMessage>
              )}
            </FormControl>
          </VStack>
        </ModalBody>

        <ModalFooter>
          <HStack spacing={3}>
            <Button variant="ghost" onClick={handleClose}>
              Cancel
            </Button>
            <Button
              colorScheme="red"
              onClick={handleDelete}
              isLoading={isLoading}
              loadingText="Deleting..."
              leftIcon={<FiTrash2 />}
              isDisabled={!isConfirmationValid}
            >
              Delete Organization
            </Button>
          </HStack>
        </ModalFooter>
      </ModalContent>
    </Modal>
  )
}

export default OrganizationDeleteModal