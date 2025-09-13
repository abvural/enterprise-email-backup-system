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
  Box,
  Text,
  Heading,
  Badge,
  Divider,
  SimpleGrid,
  Alert,
  AlertIcon,
  AlertDescription,
  Spinner,
  useColorModeValue,
  Icon,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  TableContainer,
} from '@chakra-ui/react'
import {
  FiServer,
  FiUsers,
  FiHome,
  FiCalendar,
  FiUser,
  FiChevronRight,
  FiInfo,
  FiSettings,
} from 'react-icons/fi'
import { FaBuilding } from 'react-icons/fa'
import { apiClient, type Organization } from '../../services/api'

// Use Organization type from api.ts

interface OrganizationHierarchy {
  hierarchy: Array<{
    id: string
    name: string
    type: string
  }>
  depth: number
}

interface OrganizationDetailsModalProps {
  isOpen: boolean
  onClose: () => void
  organization: Organization | null
  onEdit?: (org: Organization) => void
}

// Detail section component
const DetailSection: React.FC<{
  title: string
  icon: React.ElementType
  children: React.ReactNode
}> = ({ title, icon, children }) => {
  const borderColor = useColorModeValue('gray.200', 'gray.600')
  
  return (
    <Box>
      <HStack spacing={3} mb={4}>
        <Icon as={icon} color="blue.500" />
        <Text fontSize="sm" fontWeight="semibold" color="gray.600">
          {title.toUpperCase()}
        </Text>
      </HStack>
      <Box pl={7} borderLeft="2px" borderColor={borderColor}>
        {children}
      </Box>
    </Box>
  )
}

export const OrganizationDetailsModal: React.FC<OrganizationDetailsModalProps> = ({
  isOpen,
  onClose,
  organization,
  onEdit,
}) => {
  const [fullOrganization, setFullOrganization] = useState<Organization | null>(null)
  const [hierarchy, setHierarchy] = useState<OrganizationHierarchy | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const cardBg = useColorModeValue('white', 'gray.800')
  const borderColor = useColorModeValue('gray.200', 'gray.600')

  // Load full organization details
  useEffect(() => {
    if (isOpen && organization?.id) {
      loadOrganizationDetails()
      loadOrganizationHierarchy()
    }
  }, [isOpen, organization?.id])

  const loadOrganizationDetails = async () => {
    if (!organization?.id) return

    setIsLoading(true)
    setError(null)
    try {
      const response = await apiClient.get(`/api/organizations/${organization.id}`)
      setFullOrganization(response.data)
    } catch (error: any) {
      console.error('Failed to load organization details:', error)
      setError(error.response?.data?.error || 'Failed to load organization details')
    } finally {
      setIsLoading(false)
    }
  }

  const loadOrganizationHierarchy = async () => {
    if (!organization?.id) return

    try {
      const response = await apiClient.get(`/api/organizations/${organization.id}/hierarchy`)
      setHierarchy(response.data)
    } catch (error) {
      console.error('Failed to load organization hierarchy:', error)
      // Don't set error for hierarchy as it's not critical
    }
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'system': return FiServer
      case 'distributor': return FaBuilding
      case 'dealer': return FiUsers
      case 'client': return FiHome
      default: return FiServer
    }
  }

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'system': return 'purple'
      case 'distributor': return 'blue'
      case 'dealer': return 'green'
      case 'client': return 'orange'
      default: return 'gray'
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  if (!organization) {
    return null
  }

  const org = fullOrganization || organization

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="4xl">
      <ModalOverlay />
      <ModalContent maxH="90vh" overflowY="auto">
        <ModalHeader>
          <HStack spacing={3}>
            <Box
              p={2}
              borderRadius="lg"
              bg={`${getTypeColor(org.type)}.50`}
            >
              <Icon
                as={getTypeIcon(org.type)}
                boxSize={6}
                color={`${getTypeColor(org.type)}.500`}
              />
            </Box>
            <VStack align="flex-start" spacing={1}>
              <Heading size="lg">{org.name}</Heading>
              <HStack>
                <Badge colorScheme={getTypeColor(org.type)} size="sm">
                  {org.type.charAt(0).toUpperCase() + org.type.slice(1)}
                </Badge>
                <Badge
                  colorScheme={org.is_active ? 'green' : 'red'}
                  size="sm"
                >
                  {org.is_active ? 'Active' : 'Inactive'}
                </Badge>
              </HStack>
            </VStack>
          </HStack>
        </ModalHeader>
        <ModalCloseButton />
        
        <ModalBody>
          {isLoading ? (
            <VStack spacing={4} py={12}>
              <Spinner size="lg" color="blue.500" />
              <Text color="gray.500">Loading organization details...</Text>
            </VStack>
          ) : error ? (
            <Alert status="error" borderRadius="md">
              <AlertIcon />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          ) : (
            <VStack spacing={6} align="stretch">
              {/* Basic Information */}
              <DetailSection title="Basic Information" icon={FiInfo}>
                <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
                  <Box>
                    <Text fontSize="sm" color="gray.500">Organization ID</Text>
                    <Text fontSize="sm" fontFamily="mono" color="gray.700">
                      {org.id}
                    </Text>
                  </Box>
                  <Box>
                    <Text fontSize="sm" color="gray.500">Type</Text>
                    <Text fontSize="sm" fontWeight="medium">
                      {org.type.charAt(0).toUpperCase() + org.type.slice(1)}
                    </Text>
                  </Box>
                  <Box>
                    <Text fontSize="sm" color="gray.500">Status</Text>
                    <Badge
                      colorScheme={org.is_active ? 'green' : 'red'}
                      size="sm"
                    >
                      {org.is_active ? 'Active' : 'Inactive'}
                    </Badge>
                  </Box>
                  <Box>
                    <Text fontSize="sm" color="gray.500">Created</Text>
                    <Text fontSize="sm">{formatDate(org.created_at)}</Text>
                  </Box>
                </SimpleGrid>
              </DetailSection>

              <Divider />

              {/* Hierarchy */}
              {hierarchy && (
                <>
                  <DetailSection title="Organization Hierarchy" icon={FaBuilding}>
                    <VStack align="stretch" spacing={2}>
                      <Text fontSize="sm" color="gray.500">
                        Hierarchy Path (Level {hierarchy.depth})
                      </Text>
                      <HStack spacing={2} wrap="wrap">
                        {hierarchy.hierarchy.map((item, index) => (
                          <React.Fragment key={item.id}>
                            {index > 0 && (
                              <Icon as={FiChevronRight} color="gray.400" boxSize={3} />
                            )}
                            <Badge
                              colorScheme={getTypeColor(item.type)}
                              variant="subtle"
                              size="sm"
                            >
                              {item.name}
                            </Badge>
                          </React.Fragment>
                        ))}
                      </HStack>
                    </VStack>

                    {org.parent_org && (
                      <Box mt={4}>
                        <Text fontSize="sm" color="gray.500">Parent Organization</Text>
                        <HStack spacing={2} mt={1}>
                          <Badge
                            colorScheme={getTypeColor(org.parent_org.type)}
                            variant="outline"
                            size="sm"
                          >
                            {org.parent_org.name}
                          </Badge>
                          <Text fontSize="xs" color="gray.400">
                            ({org.parent_org.type})
                          </Text>
                        </HStack>
                      </Box>
                    )}
                  </DetailSection>

                  <Divider />
                </>
              )}

              {/* Resource Limits */}
              <DetailSection title="Resource Limits" icon={FiSettings}>
                <SimpleGrid columns={{ base: 1, md: 3 }} spacing={4}>
                  <Box textAlign="center" p={4} bg={cardBg} borderRadius="md" border="1px" borderColor={borderColor}>
                    <Icon as={FiUsers} boxSize={6} color="blue.500" mb={2} />
                    <Text fontSize="sm" color="gray.500">Max Users</Text>
                    <Text fontSize="lg" fontWeight="bold">
                      {org.max_users || '∞'}
                    </Text>
                  </Box>
                  <Box textAlign="center" p={4} bg={cardBg} borderRadius="md" border="1px" borderColor={borderColor}>
                    <Icon as={FiServer} boxSize={6} color="orange.500" mb={2} />
                    <Text fontSize="sm" color="gray.500">Max Storage</Text>
                    <Text fontSize="lg" fontWeight="bold">
                      {org.max_storage_gb ? `${org.max_storage_gb} GB` : '∞'}
                    </Text>
                  </Box>
                  <Box textAlign="center" p={4} bg={cardBg} borderRadius="md" border="1px" borderColor={borderColor}>
                    <Icon as={FiUsers} boxSize={6} color="green.500" mb={2} />
                    <Text fontSize="sm" color="gray.500">Max Email Accounts</Text>
                    <Text fontSize="lg" fontWeight="bold">
                      {org.max_email_accounts || '∞'}
                    </Text>
                  </Box>
                </SimpleGrid>
              </DetailSection>

              <Divider />

              {/* Child Organizations */}
              {org.child_orgs && org.child_orgs.length > 0 && (
                <>
                  <DetailSection title="Child Organizations" icon={FaBuilding}>
                    <TableContainer>
                      <Table size="sm">
                        <Thead>
                          <Tr>
                            <Th>Name</Th>
                            <Th>Type</Th>
                            <Th>Status</Th>
                          </Tr>
                        </Thead>
                        <Tbody>
                          {org.child_orgs.map((child) => (
                            <Tr key={child.id}>
                              <Td>
                                <Text fontWeight="medium">{child.name}</Text>
                              </Td>
                              <Td>
                                <Badge
                                  colorScheme={getTypeColor(child.type)}
                                  size="sm"
                                  variant="subtle"
                                >
                                  {child.type}
                                </Badge>
                              </Td>
                              <Td>
                                <Badge
                                  colorScheme={child.is_active ? 'green' : 'red'}
                                  size="sm"
                                >
                                  {child.is_active ? 'Active' : 'Inactive'}
                                </Badge>
                              </Td>
                            </Tr>
                          ))}
                        </Tbody>
                      </Table>
                    </TableContainer>
                  </DetailSection>

                  <Divider />
                </>
              )}

              {/* Metadata */}
              <DetailSection title="Metadata" icon={FiCalendar}>
                <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
                  <Box>
                    <Text fontSize="sm" color="gray.500">Created At</Text>
                    <Text fontSize="sm">{formatDate(org.created_at)}</Text>
                  </Box>
                  <Box>
                    <Text fontSize="sm" color="gray.500">Last Updated</Text>
                    <Text fontSize="sm">{formatDate(org.updated_at)}</Text>
                  </Box>
                  {org.creator && (
                    <Box>
                      <Text fontSize="sm" color="gray.500">Created By</Text>
                      <HStack spacing={2}>
                        <Icon as={FiUser} boxSize={3} color="gray.400" />
                        <Text fontSize="sm">{org.creator.email}</Text>
                      </HStack>
                    </Box>
                  )}
                </SimpleGrid>
              </DetailSection>
            </VStack>
          )}
        </ModalBody>

        <ModalFooter>
          <HStack spacing={3}>
            {onEdit && (
              <Button variant="outline" onClick={() => onEdit(org)}>
                Edit Organization
              </Button>
            )}
            <Button colorScheme="blue" onClick={onClose}>
              Close
            </Button>
          </HStack>
        </ModalFooter>
      </ModalContent>
    </Modal>
  )
}

export default OrganizationDetailsModal