import React, { useState, useEffect } from 'react'
import {
  Box,
  VStack,
  HStack,
  Text,
  Button,
  Card,
  CardBody,
  SimpleGrid,
  Icon,
  Badge,
  Flex,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  useToast,
  Spinner,
  Alert,
  AlertIcon,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  TableContainer,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
} from '@chakra-ui/react'
import { 
  MdBusiness, 
  MdPeople, 
  MdAdd, 
  MdGroup,
  MdEmail,
  MdMoreVert,
  MdEdit,
  MdVisibility
} from 'react-icons/md'
import { useNavigate } from 'react-router-dom'
import { Layout } from '../layout/Layout'
import { useAuthStore } from '../../stores/authStore'
import { organizationsAPI, type Organization } from '../../services/api'

interface ClientStats {
  totalClients: number
  activeClients: number
  totalUsers: number
  totalStorage: number
}

export const DealerClientsView: React.FC = () => {
  const navigate = useNavigate()
  const toast = useToast()
  const { user } = useAuthStore()
  
  const [loading, setLoading] = useState(true)
  const [clients, setClients] = useState<Organization[]>([])
  const [stats, setStats] = useState<ClientStats>({
    totalClients: 0,
    activeClients: 0,
    totalUsers: 0,
    totalStorage: 0
  })

  const fetchClientsData = async () => {
    try {
      setLoading(true)
      // Fetch all organizations to find clients under this dealer
      const orgsResponse = await organizationsAPI.getOrganizations()
      const allOrgs = orgsResponse.data || []
      
      // Filter clients that belong to this dealer
      const userOrgId = user?.primary_org?.id
      const clientOrgs = allOrgs.filter(org => 
        org.type === 'client' && org.parent_org_id === userOrgId
      )

      setClients(clientOrgs)

      // Calculate stats
      const activeClients = clientOrgs.filter(client => client.is_active).length
      const totalStorage = clientOrgs
        .reduce((sum, org) => sum + (org.max_storage_gb || 0), 0)
      
      const totalUsers = clientOrgs
        .reduce((sum, org) => sum + (org.max_users || 0), 0)

      setStats({
        totalClients: clientOrgs.length,
        activeClients,
        totalUsers,
        totalStorage
      })

    } catch (error: any) {
      toast({
        title: 'Error',
        description: 'Failed to load clients data',
        status: 'error',
        duration: 5000,
        isClosable: true,
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchClientsData()
  }, [])

  const handleViewClient = (client: Organization) => {
    // Navigate to client details or user management
    // For now, we'll show a toast - this can be extended later
    toast({
      title: 'Client Details',
      description: `Viewing details for ${client.name}`,
      status: 'info',
      duration: 3000,
      isClosable: true,
    })
  }

  const handleEditClient = (client: Organization) => {
    // Navigate to edit client form
    toast({
      title: 'Edit Client',
      description: `Editing ${client.name} - Feature coming soon`,
      status: 'info',
      duration: 3000,
      isClosable: true,
    })
  }

  if (loading) {
    return (
      <Layout>
        <Box p={8} bg="white" minH="100vh">
          <Flex justify="center" align="center" minH="200px">
            <Spinner size="xl" color="blue.500" />
          </Flex>
        </Box>
      </Layout>
    )
  }

  return (
    <Layout>
      <Box p={8} bg="white" minH="100vh">
        <VStack align="stretch" spacing={8} maxW="1200px" mx="auto">
          {/* Header */}
          <VStack align="start" spacing={1}>
            <HStack spacing={3}>
              <Icon as={MdGroup} boxSize={6} color="green.500" />
              <VStack align="start" spacing={0}>
                <Text fontSize="2xl" fontWeight="bold" color="gray.900">
                  My Clients
                </Text>
                <Text fontSize="md" color="gray.600">
                  Manage your client organizations
                </Text>
              </VStack>
            </HStack>
            {user?.primary_org && (
              <Badge colorScheme="blue" variant="subtle">
                {user.primary_org.name}
              </Badge>
            )}
          </VStack>

          {/* Quick Actions */}
          <Card>
            <CardBody>
              <HStack spacing={4} wrap="wrap">
                <Button
                  leftIcon={<Icon as={MdAdd} />}
                  colorScheme="green"
                  onClick={() => navigate('/dealer/add-client')}
                >
                  Add New Client
                </Button>
                <Button
                  leftIcon={<Icon as={MdPeople} />}
                  variant="outline"
                  onClick={() => navigate('/dealer/dashboard')}
                >
                  Back to Dashboard
                </Button>
              </HStack>
            </CardBody>
          </Card>

          {/* Client Statistics */}
          <SimpleGrid columns={{ base: 2, md: 4 }} spacing={6}>
            <Card>
              <CardBody>
                <Stat>
                  <StatLabel>Total Clients</StatLabel>
                  <StatNumber color="green.500">{stats.totalClients}</StatNumber>
                  <StatHelpText>Organizations</StatHelpText>
                </Stat>
              </CardBody>
            </Card>
            <Card>
              <CardBody>
                <Stat>
                  <StatLabel>Active Clients</StatLabel>
                  <StatNumber color="blue.500">{stats.activeClients}</StatNumber>
                  <StatHelpText>Currently active</StatHelpText>
                </Stat>
              </CardBody>
            </Card>
            <Card>
              <CardBody>
                <Stat>
                  <StatLabel>Total Users</StatLabel>
                  <StatNumber color="purple.500">{stats.totalUsers || 'Unlimited'}</StatNumber>
                  <StatHelpText>Across all clients</StatHelpText>
                </Stat>
              </CardBody>
            </Card>
            <Card>
              <CardBody>
                <Stat>
                  <StatLabel>Storage Allocation</StatLabel>
                  <StatNumber color="orange.500">
                    {stats.totalStorage ? `${stats.totalStorage}GB` : 'Unlimited'}
                  </StatNumber>
                  <StatHelpText>Total allocated</StatHelpText>
                </Stat>
              </CardBody>
            </Card>
          </SimpleGrid>

          {/* Clients List */}
          <Card>
            <CardBody>
              <VStack align="stretch" spacing={4}>
                <HStack justify="space-between">
                  <Text fontSize="lg" fontWeight="semibold">
                    Client Organizations ({clients.length})
                  </Text>
                </HStack>

                {clients.length > 0 ? (
                  <TableContainer>
                    <Table variant="simple">
                      <Thead>
                        <Tr>
                          <Th>Organization Name</Th>
                          <Th>Status</Th>
                          <Th isNumeric>Max Users</Th>
                          <Th isNumeric>Storage Limit</Th>
                          <Th isNumeric>Email Accounts</Th>
                          <Th>Created</Th>
                          <Th>Actions</Th>
                        </Tr>
                      </Thead>
                      <Tbody>
                        {clients.map(client => (
                          <Tr key={client.id}>
                            <Td>
                              <VStack align="start" spacing={0}>
                                <Text fontWeight="medium">{client.name}</Text>
                                <Text fontSize="xs" color="gray.500">
                                  ID: {client.id.slice(0, 8)}...
                                </Text>
                              </VStack>
                            </Td>
                            <Td>
                              <Badge colorScheme={client.is_active ? 'green' : 'red'}>
                                {client.is_active ? 'Active' : 'Inactive'}
                              </Badge>
                            </Td>
                            <Td isNumeric>
                              {client.max_users || 'Unlimited'}
                            </Td>
                            <Td isNumeric>
                              {client.max_storage_gb ? `${client.max_storage_gb}GB` : 'Unlimited'}
                            </Td>
                            <Td isNumeric>
                              {client.max_email_accounts || 'Unlimited'}
                            </Td>
                            <Td>
                              <Text fontSize="sm">
                                {new Date(client.created_at).toLocaleDateString()}
                              </Text>
                            </Td>
                            <Td>
                              <Menu>
                                <MenuButton as={Button} variant="ghost" size="sm">
                                  <Icon as={MdMoreVert} />
                                </MenuButton>
                                <MenuList>
                                  <MenuItem 
                                    icon={<Icon as={MdVisibility} />}
                                    onClick={() => handleViewClient(client)}
                                  >
                                    View Details
                                  </MenuItem>
                                  <MenuItem 
                                    icon={<Icon as={MdEdit} />}
                                    onClick={() => handleEditClient(client)}
                                  >
                                    Edit Client
                                  </MenuItem>
                                  <MenuItem 
                                    icon={<Icon as={MdPeople} />}
                                    onClick={() => toast({
                                      title: 'User Management',
                                      description: 'User management for clients coming soon',
                                      status: 'info',
                                      duration: 3000,
                                      isClosable: true,
                                    })}
                                  >
                                    Manage Users
                                  </MenuItem>
                                </MenuList>
                              </Menu>
                            </Td>
                          </Tr>
                        ))}
                      </Tbody>
                    </Table>
                  </TableContainer>
                ) : (
                  <Alert status="info">
                    <AlertIcon />
                    <VStack align="start" spacing={2}>
                      <Text>No client organizations yet.</Text>
                      <Button
                        size="sm"
                        leftIcon={<Icon as={MdAdd} />}
                        colorScheme="green"
                        onClick={() => navigate('/dealer/add-client')}
                      >
                        Create Your First Client
                      </Button>
                    </VStack>
                  </Alert>
                )}
              </VStack>
            </CardBody>
          </Card>

          {/* Quick Tips */}
          <Card variant="outline">
            <CardBody>
              <VStack align="stretch" spacing={3}>
                <Text fontSize="md" fontWeight="semibold">
                  💡 Quick Tips
                </Text>
                <VStack align="start" spacing={2}>
                  <Text fontSize="sm" color="gray.600">
                    • Client organizations can only create end user accounts, not sub-organizations
                  </Text>
                  <Text fontSize="sm" color="gray.600">
                    • Set appropriate user and storage limits based on your agreement with clients
                  </Text>
                  <Text fontSize="sm" color="gray.600">
                    • Monitor client usage to ensure they stay within their allocated limits
                  </Text>
                </VStack>
              </VStack>
            </CardBody>
          </Card>
        </VStack>
      </Box>
    </Layout>
  )
}

export default DealerClientsView