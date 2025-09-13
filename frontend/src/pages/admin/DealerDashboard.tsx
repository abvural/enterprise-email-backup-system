import React, { useEffect, useState } from 'react'
import {
  Box,
  VStack,
  Text,
  SimpleGrid,
  Card,
  CardBody,
  CardHeader,
  HStack,
  Icon,
  Badge,
  Heading,
  useToast,
  Alert,
  AlertIcon,
  AlertDescription,
  Flex,
  useColorModeValue,
} from '@chakra-ui/react'
import { 
  FiUsers, 
  FiMail, 
  FiSettings, 
  FiPlus, 
  FiServer,
  FiBarChart,
  FiTarget,
  FiRefreshCw,
  FiEye,
  FiUserPlus,
  FiActivity,
} from 'react-icons/fi'
import { MdBusiness } from 'react-icons/md'
import { useNavigate } from 'react-router-dom'
import { AdminLayout } from '../../components/layout/AdminLayout'
import { StatCard, UserStatCard, EmailStatCard, StorageStatCard } from '../../components/common/StatCard'
import { DataTable, type TableColumn } from '../../components/common/DataTable'
import { useAuthStore } from '../../stores/authStore'
import { canAccess, getRoleDisplayName } from '../../utils/roleUtils'
import { formatBytes } from '../../services/api'

// Dealer portfolio interfaces
interface DealerStats {
  total_clients: number
  total_users: number
  total_email_accounts: number
  total_emails: number
  total_storage: number
  active_clients: number
  pending_clients: number
}

interface ClientPortfolio {
  id: string
  name: string
  contact_email: string
  users_count: number
  email_accounts: number
  storage_used: number
  last_activity: string
  status: 'active' | 'inactive' | 'pending'
  client_type: string
}

// Client action card component
const ClientActionCard: React.FC<{
  title: string
  description: string
  icon: React.ElementType
  color: string
  onClick: () => void
  disabled?: boolean
}> = ({ title, description, icon, color, onClick, disabled = false }) => {
  const cardBg = useColorModeValue('white', 'gray.800')
  const hoverBg = useColorModeValue('gray.50', 'gray.700')
  
  return (
    <Card
      cursor={disabled ? 'not-allowed' : 'pointer'}
      onClick={disabled ? undefined : onClick}
      transition="all 0.1s ease-in-out"
      _hover={disabled ? {} : {
        transform: 'translateY(-2px)',
        boxShadow: 'md',
        bg: hoverBg,
      }}
      opacity={disabled ? 0.6 : 1}
      bg={cardBg}
    >
      <CardBody p={6}>
        <VStack spacing={4} align="flex-start">
          <Box
            p={3}
            borderRadius="lg"
            bg={`${color.split('.')[0]}.50`}
          >
            <Icon as={icon} boxSize={6} color={color} />
          </Box>
          <VStack align="flex-start" spacing={1}>
            <Text fontSize="lg" fontWeight="semibold">
              {title}
            </Text>
            <Text fontSize="sm" color="gray.500">
              {description}
            </Text>
          </VStack>
        </VStack>
      </CardBody>
    </Card>
  )
}

export const DealerDashboard: React.FC = () => {
  const navigate = useNavigate()
  const { user } = useAuthStore()
  const toast = useToast()

  const [dealerStats, setDealerStats] = useState<DealerStats | null>(null)
  const [clientPortfolio, setClientPortfolio] = useState<ClientPortfolio[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    loadDealerData()
  }, [])

  const loadDealerData = async () => {
    try {
      setIsLoading(true)
      
      // Mock dealer statistics
      const mockStats: DealerStats = {
        total_clients: 8,
        total_users: 156,
        total_email_accounts: 234,
        total_emails: 45000,
        total_storage: 1800000000, // bytes
        active_clients: 7,
        pending_clients: 1,
      }

      // Mock client portfolio data
      const mockClients: ClientPortfolio[] = [
        {
          id: '1',
          name: 'TechCorp Solutions',
          contact_email: 'admin@techcorp.com',
          users_count: 25,
          email_accounts: 35,
          storage_used: 450000000,
          last_activity: '2024-01-13T14:30:00Z',
          status: 'active',
          client_type: 'Enterprise',
        },
        {
          id: '2',
          name: 'StartupXYZ',
          contact_email: 'contact@startupxyz.com',
          users_count: 12,
          email_accounts: 18,
          storage_used: 220000000,
          last_activity: '2024-01-12T09:45:00Z',
          status: 'active',
          client_type: 'Startup',
        },
        {
          id: '3',
          name: 'NewCompany Ltd',
          contact_email: 'info@newcompany.com',
          users_count: 0,
          email_accounts: 0,
          storage_used: 0,
          last_activity: '2024-01-10T16:20:00Z',
          status: 'pending',
          client_type: 'SMB',
        },
      ]

      setDealerStats(mockStats)
      setClientPortfolio(mockClients)
    } catch (error) {
      console.error('Failed to load dealer data:', error)
      toast({
        title: 'Failed to Load Dealer Data',
        description: 'Could not retrieve portfolio information. Please try again.',
        status: 'error',
        duration: 5000,
        isClosable: true,
      })
    } finally {
      setIsLoading(false)
    }
  }

  if (user?.role?.level !== 3) {
    return (
      <AdminLayout title="Access Denied">
        <Alert status="error" borderRadius="md">
          <AlertIcon />
          <AlertDescription>
            You don't have permission to access the dealer dashboard.
          </AlertDescription>
        </Alert>
      </AdminLayout>
    )
  }

  // Table columns for client portfolio
  const clientColumns: TableColumn<ClientPortfolio>[] = [
    {
      key: 'name',
      title: 'Client',
      sortable: true,
      render: (value, row) => (
        <VStack align="flex-start" spacing={1}>
          <Text fontWeight="semibold">{value}</Text>
          <Text fontSize="sm" color="gray.500">{row.contact_email}</Text>
        </VStack>
      ),
    },
    {
      key: 'client_type',
      title: 'Type',
      sortable: true,
      align: 'center',
      render: (value) => (
        <Badge 
          colorScheme={value === 'Enterprise' ? 'purple' : value === 'SMB' ? 'blue' : 'green'}
          variant="subtle"
        >
          {value}
        </Badge>
      ),
    },
    {
      key: 'users_count',
      title: 'Users',
      sortable: true,
      align: 'center',
      render: (value) => (
        <Text fontWeight="medium">{value}</Text>
      ),
    },
    {
      key: 'email_accounts',
      title: 'Email Accounts',
      sortable: true,
      align: 'center',
      render: (value) => (
        <Text fontWeight="medium">{value}</Text>
      ),
    },
    {
      key: 'storage_used',
      title: 'Storage',
      sortable: true,
      align: 'right',
      render: (value) => (
        <Text fontWeight="medium" color="orange.500">
          {formatBytes(value)}
        </Text>
      ),
    },
    {
      key: 'status',
      title: 'Status',
      sortable: true,
      align: 'center',
      render: (value) => (
        <Badge 
          colorScheme={value === 'active' ? 'green' : value === 'inactive' ? 'red' : 'yellow'}
          variant="subtle"
        >
          {value}
        </Badge>
      ),
    },
  ]

  // Client management actions
  const clientActions = [
    {
      title: 'Add New Client',
      description: 'Create a new client organization',
      icon: FiPlus,
      color: 'green.500',
      onClick: () => navigate('/dealer/add-client'),
    },
    {
      title: 'View All Clients',
      description: 'See your complete client portfolio',
      icon: FiEye,
      color: 'blue.500',
      onClick: () => navigate('/dealer/clients'),
    },
    {
      title: 'Manage Users',
      description: 'Add and manage client users',
      icon: FiUserPlus,
      color: 'purple.500',
      onClick: () => navigate('/dealer/users'),
    },
    {
      title: 'Client Reports',
      description: 'Generate client activity reports',
      icon: FiBarChart,
      color: 'orange.500',
      onClick: () => navigate('/dealer/reports'),
    },
  ]

  return (
    <AdminLayout
      title="Client Portfolio"
      breadcrumbs={[
        { label: 'Dealer' },
        { label: 'Portfolio Overview' },
      ]}
    >
      <VStack spacing={8} align="stretch" maxW="full">
        {/* Welcome Header */}
        <Card variant="filled">
          <CardBody>
            <Flex justify="space-between" align="center" wrap="wrap" gap={4}>
              <VStack align="flex-start" spacing={2}>
                <Text fontSize="2xl" fontWeight="bold">
                  Client Portfolio Management
                </Text>
                <HStack spacing={3} wrap="wrap">
                  <Badge colorScheme="teal" px={3} py={1} borderRadius="full">
                    {getRoleDisplayName(user?.role)}
                  </Badge>
                  {user?.primary_org && (
                    <Badge colorScheme="blue" px={3} py={1} borderRadius="full">
                      {user.primary_org.name}
                    </Badge>
                  )}
                  <Badge colorScheme="green" px={3} py={1} borderRadius="full">
                    Portfolio Manager
                  </Badge>
                </HStack>
                <Text fontSize="sm" color="gray.500">
                  Manage your client organizations and their users
                </Text>
              </VStack>
              <ClientActionCard
                title="Refresh"
                description="Update portfolio data"
                icon={FiRefreshCw}
                color="teal.500"
                onClick={loadDealerData}
                disabled={isLoading}
              />
            </Flex>
          </CardBody>
        </Card>

        {/* Portfolio Statistics */}
        <Box>
          <Heading size="md" mb={6} display="flex" alignItems="center">
            <Icon as={FiTarget} mr={3} color="teal.500" />
            Portfolio Overview
          </Heading>
          
          {dealerStats ? (
            <SimpleGrid columns={{ base: 1, md: 2, lg: 4 }} spacing={6}>
              <StatCard
                title="Total Clients"
                value={dealerStats.total_clients}
                icon={FiServer}
                color="teal.500"
                helpText={`${dealerStats.active_clients} active, ${dealerStats.pending_clients} pending`}
                loading={isLoading}
                size="lg"
              />
              <UserStatCard
                title="Total Users"
                value={dealerStats.total_users}
                helpText="Across all clients"
                loading={isLoading}
                size="lg"
              />
              <EmailStatCard
                title="Email Accounts"
                value={dealerStats.total_email_accounts}
                helpText={`${dealerStats.total_emails.toLocaleString()} emails stored`}
                loading={isLoading}
                size="lg"
              />
              <StorageStatCard
                title="Total Storage"
                value={formatBytes(dealerStats.total_storage)}
                helpText="Portfolio usage"
                loading={isLoading}
                size="lg"
              />
            </SimpleGrid>
          ) : (
            <Alert status="warning" borderRadius="md">
              <AlertIcon />
              <AlertDescription>
                Could not load portfolio statistics. Please check your connection and try again.
              </AlertDescription>
            </Alert>
          )}
        </Box>

        {/* Client Management Actions */}
        <Box>
          <Heading size="md" mb={6} display="flex" alignItems="center">
            <Icon as={FiSettings} mr={3} color="teal.500" />
            Client Management
          </Heading>
          <SimpleGrid columns={{ base: 1, md: 2, lg: 4 }} spacing={6}>
            {clientActions.map((action, index) => (
              <ClientActionCard key={index} {...action} />
            ))}
          </SimpleGrid>
        </Box>

        {/* Client Portfolio Table */}
        <Box>
          <DataTable
            title="Client Portfolio"
            subtitle="Monitor your clients and their activity"
            data={clientPortfolio}
            columns={clientColumns}
            loading={isLoading}
            searchable
            sortable
            pagination
            pageSize={10}
            height="500px"
            onRefresh={loadDealerData}
            actions={[
              {
                key: 'view',
                label: 'View Details',
                icon: FiEye,
                onClick: (row) => navigate(`/dealer/clients/${row.id}`),
              },
              {
                key: 'manage',
                label: 'Manage Users',
                icon: FiUsers,
                onClick: (row) => navigate(`/dealer/clients/${row.id}/users`),
                disabled: (row) => row.status === 'pending',
              },
              {
                key: 'settings',
                label: 'Settings',
                icon: FiSettings,
                onClick: (row) => navigate(`/dealer/clients/${row.id}/settings`),
              },
            ]}
          />
        </Box>

        {/* Portfolio Health Cards */}
        <SimpleGrid columns={{ base: 1, lg: 2 }} spacing={6}>
          <Card>
            <CardHeader pb={3}>
              <Heading size="sm" display="flex" alignItems="center">
                <Icon as={FiActivity} mr={2} color="teal.500" />
                Portfolio Health
              </Heading>
            </CardHeader>
            <CardBody pt={0}>
              <VStack align="stretch" spacing={3}>
                <Flex justify="space-between">
                  <Text fontSize="sm" color="gray.600">Active Clients:</Text>
                  <Text fontSize="sm" fontWeight="medium">
                    {dealerStats?.active_clients || 0} / {dealerStats?.total_clients || 0}
                  </Text>
                </Flex>
                <Flex justify="space-between">
                  <Text fontSize="sm" color="gray.600">Portfolio Growth:</Text>
                  <Badge colorScheme="green" size="sm">+15% this quarter</Badge>
                </Flex>
                <Flex justify="space-between">
                  <Text fontSize="sm" color="gray.600">Client Satisfaction:</Text>
                  <Badge colorScheme="green" size="sm">95%</Badge>
                </Flex>
                <Flex justify="space-between">
                  <Text fontSize="sm" color="gray.600">Avg. Users per Client:</Text>
                  <Text fontSize="sm" fontWeight="medium">
                    {dealerStats ? Math.round(dealerStats.total_users / dealerStats.total_clients) : 0}
                  </Text>
                </Flex>
              </VStack>
            </CardBody>
          </Card>

          <Card>
            <CardHeader pb={3}>
              <Heading size="sm" display="flex" alignItems="center">
                <Icon as={FiBarChart} mr={2} color="purple.500" />
                Performance Metrics
              </Heading>
            </CardHeader>
            <CardBody pt={0}>
              <VStack align="stretch" spacing={3}>
                <Flex justify="space-between">
                  <Text fontSize="sm" color="gray.600">Revenue Growth:</Text>
                  <Text fontSize="sm" fontWeight="medium" color="green.500">+22% YoY</Text>
                </Flex>
                <Flex justify="space-between">
                  <Text fontSize="sm" color="gray.600">Client Retention:</Text>
                  <Badge colorScheme="green" size="sm">98%</Badge>
                </Flex>
                <Flex justify="space-between">
                  <Text fontSize="sm" color="gray.600">Avg. Storage per Client:</Text>
                  <Text fontSize="sm" fontWeight="medium" color="orange.500">
                    {dealerStats ? formatBytes(dealerStats.total_storage / dealerStats.total_clients) : '0 B'}
                  </Text>
                </Flex>
                <Flex justify="space-between">
                  <Text fontSize="sm" color="gray.600">Last Updated:</Text>
                  <Text fontSize="sm" fontWeight="medium">{new Date().toLocaleString()}</Text>
                </Flex>
              </VStack>
            </CardBody>
          </Card>
        </SimpleGrid>
      </VStack>
    </AdminLayout>
  )
}

export default DealerDashboard