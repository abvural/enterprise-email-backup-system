import React, { useState } from 'react'
import {
  Box,
  VStack,
  HStack,
  Text,
  Button,
  Icon,
} from '@chakra-ui/react'
import { MdAdd, MdArrowBack } from 'react-icons/md'
import { useNavigate } from 'react-router-dom'
import { Layout } from '../../components/layout/Layout'
import { OrganizationForm } from '../../components/organizations/OrganizationForm'

export const CreateOrganization: React.FC = () => {
  const navigate = useNavigate()
  const [isFormOpen, setIsFormOpen] = useState(true)

  const handleSuccess = () => {
    setIsFormOpen(false)
    navigate('/admin/organizations')
  }

  const handleClose = () => {
    setIsFormOpen(false)
    navigate('/admin/organizations')
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
                onClick={() => navigate('/admin/organizations')}
              >
                Back to Organizations
              </Button>
            </HStack>
            <HStack spacing={3}>
              <Icon as={MdAdd} boxSize={6} color="blue.500" />
              <VStack align="start" spacing={0}>
                <Text fontSize="2xl" fontWeight="bold" color="gray.900">
                  Create Organization
                </Text>
                <Text fontSize="md" color="gray.600">
                  Create a new organization in the system
                </Text>
              </VStack>
            </HStack>
          </VStack>

          <OrganizationForm
            isOpen={isFormOpen}
            onClose={handleClose}
            onSuccess={handleSuccess}
          />
        </VStack>
      </Box>
    </Layout>
  )
}

export default CreateOrganization