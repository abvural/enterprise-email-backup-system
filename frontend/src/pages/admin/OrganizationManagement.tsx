import React, { useState, useEffect } from 'react'
import {
  Box,
  Container,
  VStack,
  HStack,
  Heading,
  Button,
  Card,
  CardBody,
  CardHeader,
  Text,
  Badge,
  SimpleGrid,
  Flex,
  Icon,
  IconButton,
  useDisclosure,
  useToast,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
  Divider,
  Spinner,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  MenuDivider,
  Input,
  InputGroup,
  InputLeftElement,
  Select,
  useColorModeValue,
} from '@chakra-ui/react'
import {
  FiPlus,
  FiSearch,
  FiFilter,
  FiMoreVertical,
  FiEdit3,
  FiTrash2,
  FiUsers,
  FiBarChart,
  FiSettings,
  FiChevronRight,
  FiServer,
  FiHome,
  FiRefreshCw,
  FiEye,
} from 'react-icons/fi'
import { FaBuilding } from 'react-icons/fa'
import { AdminLayout } from '../../components/layout/AdminLayout'
import { useAuthStore } from '../../stores/authStore'
import { isAdmin, getRoleDisplayName, canAccess } from '../../utils/roleUtils'
import { apiClient, formatBytes, type Organization } from '../../services/api'
import OrganizationFormModal from '../../components/organizations/OrganizationFormModal'
import OrganizationStatsModal from '../../components/organizations/OrganizationStatsModal'
import OrganizationDeleteModal from '../../components/organizations/OrganizationDeleteModal'
import OrganizationDetailsModal from '../../components/organizations/OrganizationDetailsModal'

// Types

interface OrganizationStats {
  organization_id: string
  user_count: number
  email_account_count: number
  total_emails: number
  total_storage_bytes: number
  total_storage_mb: number
  limits: {
    max_users?: number
    max_storage_gb?: number
    max_email_accounts?: number
  }
}

// Organization card component
const OrganizationCard: React.FC<{
  org: Organization
  onEdit: (org: Organization) => void
  onDelete: (org: Organization) => void
  onViewStats: (org: Organization) => void
  onViewDetails: (org: Organization) => void
}> = ({ org, onEdit, onDelete, onViewStats, onViewDetails }) => {
  const cardBg = useColorModeValue('white', 'gray.800')
  const borderColor = useColorModeValue('gray.200', 'gray.600')
  const mutedColor = useColorModeValue('gray.500', 'gray.400')
  
  const getTypeColor = (type: string) => {
    switch (type) {
      case 'system': return 'purple'
      case 'distributor': return 'blue'
      case 'dealer': return 'green'
      case 'client': return 'orange'
      default: return 'gray'
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

  return (
    <Card
      bg={cardBg}
      borderColor={borderColor}
      transition="all 0.2s ease-in-out"
      _hover={{
        transform: 'translateY(-2px)',
        boxShadow: 'md',
      }}
    >
      <CardHeader pb={3}>
        <Flex justify="space-between" align="flex-start">
          <HStack spacing={3} flex={1}>
            <Box
              p={2}
              borderRadius="lg"
              bg={`${getTypeColor(org.type)}.50`}
            >
              <Icon
                as={getTypeIcon(org.type)}
                boxSize={5}
                color={`${getTypeColor(org.type)}.500`}
              />
            </Box>
            <VStack align="flex-start" spacing={1} flex={1}>
              <Text fontSize="lg" fontWeight="semibold" isTruncated>
                {org.name}
              </Text>
              <HStack spacing={2}>
                <Badge colorScheme={getTypeColor(org.type)} size="sm">
                  {org.type.charAt(0).toUpperCase() + org.type.slice(1)}
                </Badge>
                <Badge
                  colorScheme={org.is_active ? 'green' : 'red'}
                  size="sm"
                  variant="subtle"
                >
                  {org.is_active ? 'Active' : 'Inactive'}
                </Badge>
              </HStack>
            </VStack>
          </HStack>
          
          <Menu>
            <MenuButton
              as={IconButton}
              icon={<FiMoreVertical />}
              variant="ghost"
              size="sm"
              _focus={{ boxShadow: 'none' }}
            />
            <MenuList>
              <MenuItem icon={<FiEye />} onClick={() => onViewDetails(org)}>
                View Details
              </MenuItem>
              <MenuItem icon={<FiBarChart />} onClick={() => onViewStats(org)}>
                View Statistics
              </MenuItem>
              <MenuDivider />
              <MenuItem icon={<FiEdit3 />} onClick={() => onEdit(org)}>
                Edit Organization
              </MenuItem>
              <MenuItem 
                icon={<FiTrash2 />} 
                onClick={() => onDelete(org)}
                color="red.500"
              >
                Delete Organization
              </MenuItem>
            </MenuList>
          </Menu>
        </Flex>
      </CardHeader>
      
      <CardBody pt={0}>
        <VStack spacing={3} align="stretch">
          {/* Parent organization */}
          {org.parent_org && (
            <Flex align="center" fontSize="sm" color={mutedColor}>
              <Text>Parent:</Text>
              <Icon as={FiChevronRight} mx={1} />
              <Text fontWeight="medium">{org.parent_org.name}</Text>
            </Flex>
          )}
          
          {/* Limits */}
          <VStack spacing={2} align="stretch">
            <Text fontSize="sm" fontWeight="medium" color={mutedColor}>
              Resource Limits
            </Text>
            <SimpleGrid columns={3} spacing={2}>
              <Box textAlign="center">
                <Text fontSize="xs" color={mutedColor}>Users</Text>
                <Text fontSize="sm" fontWeight="semibold">
                  {org.max_users || '∞'}
                </Text>
              </Box>
              <Box textAlign="center">
                <Text fontSize="xs" color={mutedColor}>Storage</Text>
                <Text fontSize="sm" fontWeight="semibold">
                  {org.max_storage_gb ? `${org.max_storage_gb} GB` : '∞'}
                </Text>
              </Box>
              <Box textAlign="center">
                <Text fontSize="xs" color={mutedColor}>Accounts</Text>
                <Text fontSize="sm" fontWeight="semibold">
                  {org.max_email_accounts || '∞'}
                </Text>
              </Box>
            </SimpleGrid>
          </VStack>
          
          {/* Child organizations count */}
          {org.child_orgs && org.child_orgs.length > 0 && (
            <Flex align="center" justify="space-between" fontSize="sm">
              <Text color={mutedColor}>Child Organizations:</Text>
              <Badge colorScheme="blue" variant="subtle">
                {org.child_orgs.length}
              </Badge>
            </Flex>
          )}
        </VStack>
      </CardBody>
    </Card>
  )
}

export const OrganizationManagement: React.FC = () => {
  const { user } = useAuthStore()
  const toast = useToast()
  
  // State
  const [organizations, setOrganizations] = useState<Organization[]>([])
  const [filteredOrganizations, setFilteredOrganizations] = useState<Organization[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterType, setFilterType] = useState('all')
  const [filterStatus, setFilterStatus] = useState('all')

  // Modal states
  const [selectedOrganization, setSelectedOrganization] = useState<Organization | null>(null)
  const [isFormModalOpen, setIsFormModalOpen] = useState(false)
  const [isStatsModalOpen, setIsStatsModalOpen] = useState(false)
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false)

  // Load organizations
  useEffect(() => {
    loadOrganizations()
  }, [])

  // Filter organizations
  useEffect(() => {
    let filtered = organizations

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(org =>
        org.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        org.type.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    // Type filter
    if (filterType !== 'all') {
      filtered = filtered.filter(org => org.type === filterType)
    }

    // Status filter
    if (filterStatus !== 'all') {
      filtered = filtered.filter(org => 
        filterStatus === 'active' ? org.is_active : !org.is_active
      )
    }

    setFilteredOrganizations(filtered)
  }, [organizations, searchTerm, filterType, filterStatus])

  const loadOrganizations = async () => {
    try {
      setIsLoading(true)
      const response = await apiClient.get('/api/organizations')
      setOrganizations(response.data || [])
    } catch (error) {
      console.error('Failed to load organizations:', error)
      toast({
        title: 'Error Loading Organizations',
        description: 'Failed to load organizations. Please try again.',
        status: 'error',
        duration: 5000,
        isClosable: true,
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleEdit = (org: Organization) => {
    setSelectedOrganization(org)
    setIsFormModalOpen(true)
  }

  const handleDelete = (org: Organization) => {
    setSelectedOrganization(org)
    setIsDeleteModalOpen(true)
  }

  const handleViewStats = (org: Organization) => {
    setSelectedOrganization(org)
    setIsStatsModalOpen(true)
  }

  const handleViewDetails = (org: Organization) => {
    setSelectedOrganization(org)
    setIsDetailsModalOpen(true)
  }

  const handleCreateNew = () => {
    setSelectedOrganization(null)
    setIsFormModalOpen(true)
  }

  // Modal handlers
  const handleModalSuccess = () => {
    loadOrganizations()
  }

  const handleEditFromDetails = (org: Organization) => {
    setIsDetailsModalOpen(false)
    setSelectedOrganization(org)
    setIsFormModalOpen(true)
  }

  // Check admin permissions
  if (!isAdmin(user)) {
    return (
      <AdminLayout title="Access Denied">
        <Container maxW="6xl" py={8}>
          <Alert status="error" borderRadius="md">
            <AlertIcon />
            <AlertTitle>Access Denied</AlertTitle>
            <AlertDescription>
              You don't have permission to access organization management.
            </AlertDescription>
          </Alert>
        </Container>
      </AdminLayout>
    )
  }

  return (
    <AdminLayout 
      title="Organization Management"
      breadcrumbs={[
        { label: 'System Management' },
        { label: 'Organizations' }
      ]}
    >
      <VStack spacing={6} align="stretch">
        {/* Header Actions */}
        <Card>
          <CardBody>
            <Flex justify="space-between" align="center" wrap="wrap" gap={4}>
              <VStack align="flex-start" spacing={1}>
                <Heading size="lg" color="blue.600">
                  Organization Management
                </Heading>
                <Text color="gray.500" fontSize="sm">
                  Manage your organizational hierarchy and resource allocation
                </Text>
              </VStack>
              
              <HStack spacing={3}>
                <Button
                  leftIcon={<FiRefreshCw />}
                  variant="outline"
                  size="sm"
                  onClick={loadOrganizations}
                  isLoading={isLoading}
                >
                  Refresh
                </Button>
                <Button
                  leftIcon={<FiPlus />}
                  colorScheme="blue"
                  size="sm"
                  onClick={handleCreateNew}
                >
                  New Organization
                </Button>
              </HStack>
            </Flex>
          </CardBody>
        </Card>

        {/* Filters and Search */}
        <Card>
          <CardBody>
            <VStack spacing={4} align="stretch">
              <Text fontWeight="semibold" fontSize="sm" color="gray.600">
                FILTERS & SEARCH
              </Text>
              
              <HStack spacing={4} wrap="wrap">
                <InputGroup maxW="300px">
                  <InputLeftElement>
                    <Icon as={FiSearch} color="gray.400" />
                  </InputLeftElement>
                  <Input
                    placeholder="Search organizations..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    size="sm"
                  />
                </InputGroup>
                
                <Select
                  value={filterType}
                  onChange={(e) => setFilterType(e.target.value)}
                  size="sm"
                  maxW="200px"
                >
                  <option value="all">All Types</option>
                  <option value="system">System</option>
                  <option value="distributor">Distributor</option>
                  <option value="dealer">Dealer</option>
                  <option value="client">Client</option>
                </Select>
                
                <Select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  size="sm"
                  maxW="200px"
                >
                  <option value="all">All Status</option>
                  <option value="active">Active Only</option>
                  <option value="inactive">Inactive Only</option>
                </Select>
              </HStack>
            </VStack>
          </CardBody>
        </Card>

        {/* Results Summary */}
        {!isLoading && (
          <Flex justify="space-between" align="center">
            <Text fontSize="sm" color="gray.500">
              Showing {filteredOrganizations.length} of {organizations.length} organizations
            </Text>
            <HStack spacing={2}>
              {['system', 'distributor', 'dealer', 'client'].map(type => {
                const count = organizations.filter(org => org.type === type).length
                return count > 0 ? (
                  <Badge key={type} variant="subtle" size="sm">
                    {count} {type}
                  </Badge>
                ) : null
              })}
            </HStack>
          </Flex>
        )}

        {/* Organizations Grid */}
        {isLoading ? (
          <Flex justify="center" py={12}>
            <VStack spacing={4}>
              <Spinner size="lg" color="blue.500" />
              <Text color="gray.500">Loading organizations...</Text>
            </VStack>
          </Flex>
        ) : filteredOrganizations.length === 0 ? (
          <Card>
            <CardBody py={12} textAlign="center">
              <VStack spacing={4}>
                <Icon as={FaBuilding} boxSize={12} color="gray.300" />
                <VStack spacing={2}>
                  <Text fontSize="lg" fontWeight="semibold" color="gray.500">
                    {organizations.length === 0 ? 'No Organizations Found' : 'No Results Found'}
                  </Text>
                  <Text color="gray.400" fontSize="sm">
                    {organizations.length === 0 
                      ? 'Create your first organization to get started'
                      : 'Try adjusting your search or filters'
                    }
                  </Text>
                </VStack>
                {organizations.length === 0 && (
                  <Button leftIcon={<FiPlus />} colorScheme="blue" onClick={handleCreateNew}>
                    Create First Organization
                  </Button>
                )}
              </VStack>
            </CardBody>
          </Card>
        ) : (
          <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={6}>
            {filteredOrganizations.map((org) => (
              <OrganizationCard
                key={org.id}
                org={org}
                onEdit={handleEdit}
                onDelete={handleDelete}
                onViewStats={handleViewStats}
                onViewDetails={handleViewDetails}
              />
            ))}
          </SimpleGrid>
        )}

        {/* Modals */}
        <OrganizationFormModal
          isOpen={isFormModalOpen}
          onClose={() => setIsFormModalOpen(false)}
          onSuccess={handleModalSuccess}
          organization={selectedOrganization}
          parentOrganizations={organizations.filter(org => org.is_active)}
        />

        <OrganizationStatsModal
          isOpen={isStatsModalOpen}
          onClose={() => setIsStatsModalOpen(false)}
          organization={selectedOrganization}
        />

        <OrganizationDeleteModal
          isOpen={isDeleteModalOpen}
          onClose={() => setIsDeleteModalOpen(false)}
          onSuccess={handleModalSuccess}
          organization={selectedOrganization}
        />

        <OrganizationDetailsModal
          isOpen={isDetailsModalOpen}
          onClose={() => setIsDetailsModalOpen(false)}
          organization={selectedOrganization}
          onEdit={handleEditFromDetails}
        />
      </VStack>
    </AdminLayout>
  )
}

export default OrganizationManagement