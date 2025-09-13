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
  Avatar,
  Input,
  InputGroup,
  InputLeftElement,
} from '@chakra-ui/react'
import { 
  MdPeople, 
  MdPersonAdd, 
  MdSearch,
  MdMoreVert,
  MdEdit,
  MdDelete,
  MdEmail,
  MdBlock,
  MdCheckCircle
} from 'react-icons/md'
import { FiSearch } from 'react-icons/fi'
import { useNavigate } from 'react-router-dom'
import { Layout } from '../layout/Layout'
import { useAuthStore } from '../../stores/authStore'

// Mock user data for demonstration - in real app, this would come from API
interface EndUser {
  id: string
  email: string
  firstName: string
  lastName: string
  isActive: boolean
  emailAccountsCount: number
  storageUsed: number
  lastLogin: string
  createdAt: string
}

interface UserStats {
  totalUsers: number
  activeUsers: number
  totalStorage: number
  totalEmailAccounts: number
}

export const ClientUserManagement: React.FC = () => {
  const navigate = useNavigate()
  const toast = useToast()
  const { user } = useAuthStore()
  
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [users, setUsers] = useState<EndUser[]>([])
  const [stats, setStats] = useState<UserStats>({
    totalUsers: 0,
    activeUsers: 0,
    totalStorage: 0,
    totalEmailAccounts: 0
  })

  // Mock data - replace with actual API call
  const fetchUsersData = async () => {
    try {
      setLoading(true)
      
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      // Mock users data
      const mockUsers: EndUser[] = [
        {
          id: '1',
          email: 'john.doe@client.com',
          firstName: 'John',
          lastName: 'Doe',
          isActive: true,
          emailAccountsCount: 2,
          storageUsed: 1.5,
          lastLogin: '2025-01-10T10:30:00Z',
          createdAt: '2025-01-01T00:00:00Z'
        },
        {
          id: '2',
          email: 'jane.smith@client.com',
          firstName: 'Jane',
          lastName: 'Smith',
          isActive: true,
          emailAccountsCount: 1,
          storageUsed: 0.8,
          lastLogin: '2025-01-09T15:45:00Z',
          createdAt: '2025-01-02T00:00:00Z'
        },
        {
          id: '3',
          email: 'bob.wilson@client.com',
          firstName: 'Bob',
          lastName: 'Wilson',
          isActive: false,
          emailAccountsCount: 0,
          storageUsed: 0,
          lastLogin: '2024-12-20T09:15:00Z',
          createdAt: '2024-12-15T00:00:00Z'
        }
      ]

      setUsers(mockUsers)

      // Calculate stats
      const activeUsers = mockUsers.filter(user => user.isActive).length
      const totalStorage = mockUsers.reduce((sum, user) => sum + user.storageUsed, 0)
      const totalEmailAccounts = mockUsers.reduce((sum, user) => sum + user.emailAccountsCount, 0)

      setStats({
        totalUsers: mockUsers.length,
        activeUsers,
        totalStorage,
        totalEmailAccounts
      })

    } catch (error: any) {
      toast({
        title: 'Error',
        description: 'Failed to load users data',
        status: 'error',
        duration: 5000,
        isClosable: true,
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchUsersData()
  }, [])

  const filteredUsers = users.filter(endUser =>
    endUser.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    endUser.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    endUser.email.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const handleEditUser = (endUser: EndUser) => {
    toast({
      title: 'Edit User',
      description: `Editing ${endUser.firstName} ${endUser.lastName} - Feature coming soon`,
      status: 'info',
      duration: 3000,
      isClosable: true,
    })
  }

  const handleToggleUserStatus = (endUser: EndUser) => {
    const action = endUser.isActive ? 'deactivate' : 'activate'
    toast({
      title: `${action.charAt(0).toUpperCase() + action.slice(1)} User`,
      description: `${action.charAt(0).toUpperCase() + action.slice(1)}ing ${endUser.firstName} ${endUser.lastName} - Feature coming soon`,
      status: 'info',
      duration: 3000,
      isClosable: true,
    })
  }

  const handleDeleteUser = (endUser: EndUser) => {
    toast({
      title: 'Delete User',
      description: `Deleting ${endUser.firstName} ${endUser.lastName} - Feature coming soon`,
      status: 'warning',
      duration: 3000,
      isClosable: true,
    })
  }

  const handleManageEmailAccounts = (endUser: EndUser) => {
    toast({
      title: 'Email Account Management',
      description: `Managing email accounts for ${endUser.firstName} ${endUser.lastName} - Feature coming soon`,
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
              <Icon as={MdPeople} boxSize={6} color="purple.500" />
              <VStack align="start" spacing={0}>
                <Text fontSize="2xl" fontWeight="bold" color="gray.900">
                  User Management
                </Text>
                <Text fontSize="md" color="gray.600">
                  Manage end users in your organization
                </Text>
              </VStack>
            </HStack>
            {user?.primary_org && (
              <Badge colorScheme="purple" variant="subtle">
                {user.primary_org.name}
              </Badge>
            )}
          </VStack>

          {/* Quick Actions */}
          <Card>
            <CardBody>
              <HStack spacing={4} wrap="wrap" justify="space-between">
                <HStack spacing={4}>
                  <Button
                    leftIcon={<Icon as={MdPersonAdd} />}
                    colorScheme="purple"
                    onClick={() => navigate('/client/add-user')}
                  >
                    Add New User
                  </Button>
                  <Button
                    leftIcon={<Icon as={MdPeople} />}
                    variant="outline"
                    onClick={() => navigate('/client/dashboard')}
                  >
                    Back to Dashboard
                  </Button>
                </HStack>
                
                <InputGroup maxW="300px">
                  <InputLeftElement pointerEvents="none">
                    <Icon as={FiSearch} color="gray.400" />
                  </InputLeftElement>
                  <Input
                    placeholder="Search users..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </InputGroup>
              </HStack>
            </CardBody>
          </Card>

          {/* User Statistics */}
          <SimpleGrid columns={{ base: 2, md: 4 }} spacing={6}>
            <Card>
              <CardBody>
                <Stat>
                  <StatLabel>Total Users</StatLabel>
                  <StatNumber color="purple.500">{stats.totalUsers}</StatNumber>
                  <StatHelpText>End users</StatHelpText>
                </Stat>
              </CardBody>
            </Card>
            <Card>
              <CardBody>
                <Stat>
                  <StatLabel>Active Users</StatLabel>
                  <StatNumber color="green.500">{stats.activeUsers}</StatNumber>
                  <StatHelpText>Currently active</StatHelpText>
                </Stat>
              </CardBody>
            </Card>
            <Card>
              <CardBody>
                <Stat>
                  <StatLabel>Email Accounts</StatLabel>
                  <StatNumber color="blue.500">{stats.totalEmailAccounts}</StatNumber>
                  <StatHelpText>Total configured</StatHelpText>
                </Stat>
              </CardBody>
            </Card>
            <Card>
              <CardBody>
                <Stat>
                  <StatLabel>Storage Used</StatLabel>
                  <StatNumber color="orange.500">{stats.totalStorage.toFixed(1)}GB</StatNumber>
                  <StatHelpText>Across all users</StatHelpText>
                </Stat>
              </CardBody>
            </Card>
          </SimpleGrid>

          {/* Users List */}
          <Card>
            <CardBody>
              <VStack align="stretch" spacing={4}>
                <HStack justify="space-between">
                  <Text fontSize="lg" fontWeight="semibold">
                    End Users ({filteredUsers.length})
                  </Text>
                </HStack>

                {filteredUsers.length > 0 ? (
                  <TableContainer>
                    <Table variant="simple">
                      <Thead>
                        <Tr>
                          <Th>User</Th>
                          <Th>Status</Th>
                          <Th isNumeric>Email Accounts</Th>
                          <Th isNumeric>Storage Used</Th>
                          <Th>Last Login</Th>
                          <Th>Created</Th>
                          <Th>Actions</Th>
                        </Tr>
                      </Thead>
                      <Tbody>
                        {filteredUsers.map(endUser => (
                          <Tr key={endUser.id}>
                            <Td>
                              <HStack spacing={3}>
                                <Avatar 
                                  size="sm" 
                                  name={`${endUser.firstName} ${endUser.lastName}`}
                                  bg="purple.500"
                                />
                                <VStack align="start" spacing={0}>
                                  <Text fontWeight="medium">
                                    {endUser.firstName} {endUser.lastName}
                                  </Text>
                                  <Text fontSize="sm" color="gray.500">
                                    {endUser.email}
                                  </Text>
                                </VStack>
                              </HStack>
                            </Td>
                            <Td>
                              <Badge colorScheme={endUser.isActive ? 'green' : 'red'}>
                                {endUser.isActive ? 'Active' : 'Inactive'}
                              </Badge>
                            </Td>
                            <Td isNumeric>
                              <HStack justify="flex-end">
                                <Icon as={MdEmail} color="gray.400" boxSize={4} />
                                <Text>{endUser.emailAccountsCount}</Text>
                              </HStack>
                            </Td>
                            <Td isNumeric>
                              {endUser.storageUsed.toFixed(1)}GB
                            </Td>
                            <Td>
                              <Text fontSize="sm">
                                {new Date(endUser.lastLogin).toLocaleDateString()}
                              </Text>
                            </Td>
                            <Td>
                              <Text fontSize="sm">
                                {new Date(endUser.createdAt).toLocaleDateString()}
                              </Text>
                            </Td>
                            <Td>
                              <Menu>
                                <MenuButton as={Button} variant="ghost" size="sm">
                                  <Icon as={MdMoreVert} />
                                </MenuButton>
                                <MenuList>
                                  <MenuItem 
                                    icon={<Icon as={MdEdit} />}
                                    onClick={() => handleEditUser(endUser)}
                                  >
                                    Edit User
                                  </MenuItem>
                                  <MenuItem 
                                    icon={<Icon as={MdEmail} />}
                                    onClick={() => handleManageEmailAccounts(endUser)}
                                  >
                                    Manage Email Accounts
                                  </MenuItem>
                                  <MenuItem 
                                    icon={<Icon as={endUser.isActive ? MdBlock : MdCheckCircle} />}
                                    onClick={() => handleToggleUserStatus(endUser)}
                                  >
                                    {endUser.isActive ? 'Deactivate' : 'Activate'}
                                  </MenuItem>
                                  <MenuItem 
                                    icon={<Icon as={MdDelete} />}
                                    onClick={() => handleDeleteUser(endUser)}
                                    color="red.500"
                                  >
                                    Delete User
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
                      <Text>
                        {searchTerm ? `No users found matching "${searchTerm}"` : 'No end users yet.'}
                      </Text>
                      {!searchTerm && (
                        <Button
                          size="sm"
                          leftIcon={<Icon as={MdPersonAdd} />}
                          colorScheme="purple"
                          onClick={() => navigate('/client/add-user')}
                        >
                          Add Your First User
                        </Button>
                      )}
                    </VStack>
                  </Alert>
                )}
              </VStack>
            </CardBody>
          </Card>

          {/* Organization Info */}
          <Card variant="outline">
            <CardBody>
              <VStack align="stretch" spacing={3}>
                <Text fontSize="md" fontWeight="semibold">
                  💡 Organization Limits
                </Text>
                <SimpleGrid columns={{ base: 1, md: 3 }} spacing={4}>
                  <VStack align="start" spacing={1}>
                    <Text fontSize="sm" fontWeight="medium">Users</Text>
                    <Text fontSize="sm" color="gray.600">
                      {user?.primary_org?.max_users || 'Unlimited'} maximum
                    </Text>
                  </VStack>
                  <VStack align="start" spacing={1}>
                    <Text fontSize="sm" fontWeight="medium">Storage</Text>
                    <Text fontSize="sm" color="gray.600">
                      {user?.primary_org?.max_storage_gb ? `${user.primary_org.max_storage_gb}GB` : 'Unlimited'} total
                    </Text>
                  </VStack>
                  <VStack align="start" spacing={1}>
                    <Text fontSize="sm" fontWeight="medium">Email Accounts</Text>
                    <Text fontSize="sm" color="gray.600">
                      {user?.primary_org?.max_email_accounts || 'Unlimited'} per user
                    </Text>
                  </VStack>
                </SimpleGrid>
              </VStack>
            </CardBody>
          </Card>
        </VStack>
      </Box>
    </Layout>
  )
}

export default ClientUserManagement