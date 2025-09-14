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
  Progress,
  Button,
} from '@chakra-ui/react'
import { 
  FiUsers, 
  FiMail, 
  FiSettings, 
  FiPlus, 
  FiActivity,
  FiUserPlus,
  FiBarChart,
  FiTarget,
  FiRefreshCw,
  FiEye,
  FiShield,
  FiDatabase,
  FiHardDrive,
  FiClock,
} from 'react-icons/fi'
import { MdPersonAdd, MdSupervisorAccount } from 'react-icons/md'
import { useNavigate } from 'react-router-dom'
import { AdminLayout } from '../../components/layout/AdminLayout'
import { StatCard, UserStatCard, EmailStatCard, StorageStatCard, ActivityStatCard } from '../../components/common/StatCard'
import { DataTable, type TableColumn } from '../../components/common/DataTable'
import { useAuthStore } from '../../stores/authStore'
import { canAccess, getRoleDisplayName } from '../../utils/roleUtils'
import { formatBytes } from '../../services/api'

// Client organization interfaces
interface ClientStats {
  total_users: number
  total_email_accounts: number
  total_emails: number
  total_storage: number
  active_users: number
  pending_users: number
  last_backup: string
  backup_frequency: string
}

interface EndUser {
  id: string
  name: string
  email: string
  department: string
  email_accounts: number
  storage_used: number
  last_activity: string
  status: 'active' | 'inactive' | 'pending'
  role: 'user' | 'manager' | 'admin'
}

interface TeamUsage {
  department: string
  users_count: number
  storage_used: number
  email_accounts: number
  activity_score: number
}

// Simple Stat Card (End User Dashboard style)
interface SimpleStatCardProps {
  title: string
  value: string | number
  icon: React.ElementType
  trend?: number
  color?: string
}

const SimpleStatCard = ({ title, value, icon, trend, color = 'blue.500' }: SimpleStatCardProps) => {
  return (
    <Card
      bg="white"
      border="1px solid"
      borderColor="gray.200"
      borderRadius="8px"
      transition="all 0.15s"
      _hover={{
        bg: 'gray.50',
      }}
    >
      <CardBody p={5}>
        <VStack align="stretch" spacing={4}>
          <HStack justify="space-between" align="start">
            <Box
              p={2}
              borderRadius="lg"
              bg={`${color.split('.')[0]}.50`}
            >
              <Icon as={icon} color={color} boxSize={5} />
            </Box>
            {trend !== undefined && (
              <Badge
                variant="subtle"
                colorScheme={trend > 0 ? 'green' : 'red'}
                fontSize="xs"
                borderRadius="full"
              >
                {trend > 0 ? '+' : ''}{trend}%
              </Badge>
            )}
          </HStack>
          
          <VStack align="start" spacing={1}>
            <Text 
              fontSize="2xl" 
              fontWeight="semibold" 
              color="gray.900"
              lineHeight="none"
            >
              {value}
            </Text>
            <Text 
              fontSize="sm" 
              color="gray.500" 
              fontWeight="normal"
            >
              {title}
            </Text>
          </VStack>
        </VStack>
      </CardBody>
    </Card>
  )
}

// User action card component
const UserActionCard: React.FC<{
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

export const ClientDashboard: React.FC = () => {
  const navigate = useNavigate()
  const { user } = useAuthStore()
  const toast = useToast()

  const [clientStats, setClientStats] = useState<ClientStats | null>(null)
  const [endUsers, setEndUsers] = useState<EndUser[]>([])
  const [teamUsage, setTeamUsage] = useState<TeamUsage[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    loadClientData()
  }, [])

  const loadClientData = async () => {
    try {
      setIsLoading(true)
      
      // Mock client statistics
      const mockStats: ClientStats = {
        total_users: 45,
        total_email_accounts: 68,
        total_emails: 28500,
        total_storage: 850000000, // bytes
        active_users: 42,
        pending_users: 3,
        last_backup: '2024-01-13T10:30:00Z',
        backup_frequency: 'Daily',
      }

      // Mock end users data
      const mockUsers: EndUser[] = [
        {
          id: '1',
          name: 'John Smith',
          email: 'john.smith@company.com',
          department: 'Engineering',
          email_accounts: 2,
          storage_used: 125000000,
          last_activity: '2024-01-13T15:45:00Z',
          status: 'active',
          role: 'manager',
        },
        {
          id: '2',
          name: 'Sarah Johnson',
          email: 'sarah.johnson@company.com',
          department: 'Marketing',
          email_accounts: 1,
          storage_used: 85000000,
          last_activity: '2024-01-13T14:20:00Z',
          status: 'active',
          role: 'user',
        },
        {
          id: '3',
          name: 'Mike Davis',
          email: 'mike.davis@company.com',
          department: 'Sales',
          email_accounts: 3,
          storage_used: 190000000,
          last_activity: '2024-01-12T16:30:00Z',
          status: 'active',
          role: 'admin',
        },
        {
          id: '4',
          name: 'Lisa Brown',
          email: 'lisa.brown@company.com',
          department: 'HR',
          email_accounts: 1,
          storage_used: 45000000,
          last_activity: '2024-01-11T09:15:00Z',
          status: 'pending',
          role: 'user',
        },
      ]

      // Mock team usage data
      const mockTeamUsage: TeamUsage[] = [
        {
          department: 'Engineering',
          users_count: 12,
          storage_used: 320000000,
          email_accounts: 18,
          activity_score: 92,
        },
        {
          department: 'Sales',
          users_count: 8,
          storage_used: 280000000,
          email_accounts: 15,
          activity_score: 88,
        },
        {
          department: 'Marketing',
          users_count: 6,
          storage_used: 150000000,
          email_accounts: 9,
          activity_score: 85,
        },
        {
          department: 'HR',
          users_count: 4,
          storage_used: 100000000,
          email_accounts: 6,
          activity_score: 78,
        },
      ]

      setClientStats(mockStats)
      setEndUsers(mockUsers)
      setTeamUsage(mockTeamUsage)
    } catch (error) {
      console.error('Failed to load client data:', error)
      toast({
        title: 'Failed to Load Organization Data',
        description: 'Could not retrieve user and usage information. Please try again.',
        status: 'error',
        duration: 5000,
        isClosable: true,
      })
    } finally {
      setIsLoading(false)
    }
  }

  if (user?.role?.level !== 4) {
    return (
      <AdminLayout title="Access Denied">
        <Alert status="error" borderRadius="md">
          <AlertIcon />
          <AlertDescription>
            You don't have permission to access the client dashboard.
          </AlertDescription>
        </Alert>
      </AdminLayout>
    )
  }

  // Table columns for end users
  const userColumns: TableColumn<EndUser>[] = [
    {
      key: 'name',
      title: 'User',
      sortable: true,
      render: (value, row) => (
        <VStack align="flex-start" spacing={1}>
          <Text fontWeight="semibold">{value}</Text>
          <Text fontSize="sm" color="gray.500">{row.email}</Text>
        </VStack>
      ),
    },
    {
      key: 'department',
      title: 'Department',
      sortable: true,
      align: 'center',
      render: (value) => (
        <Badge colorScheme="blue" variant="subtle">
          {value}
        </Badge>
      ),
    },
    {
      key: 'role',
      title: 'Role',
      sortable: true,
      align: 'center',
      render: (value) => (
        <Badge 
          colorScheme={value === 'admin' ? 'red' : value === 'manager' ? 'orange' : 'green'}
          variant="subtle"
        >
          {value}
        </Badge>
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

  // User management actions
  const userActions = [
    {
      title: 'Add New User',
      description: 'Invite new team members',
      icon: FiUserPlus,
      color: 'green.500',
      onClick: () => navigate('/client/add-user'),
    },
    {
      title: 'View All Users',
      description: 'See complete team roster',
      icon: FiEye,
      color: 'blue.500',
      onClick: () => navigate('/client/users'),
    },
    {
      title: 'User Permissions',
      description: 'Manage access controls',
      icon: FiShield,
      color: 'purple.500',
      onClick: () => navigate('/client/permissions'),
    },
    {
      title: 'Usage Reports',
      description: 'Generate team analytics',
      icon: FiBarChart,
      color: 'orange.500',
      onClick: () => navigate('/client/reports'),
    },
  ]

  return (
    <AdminLayout
      title="Team Management"
      breadcrumbs={[
        { label: 'Client' },
        { label: 'Team Overview' },
      ]}
    >
      <VStack spacing={8} align="stretch" maxW="full">
        {/* Welcome Header */}
        <Card variant="filled">
          <CardBody>
            <Flex justify="space-between" align="center" wrap="wrap" gap={4}>
              <VStack align="flex-start" spacing={2}>
                <Text fontSize="2xl" fontWeight="bold">
                  Welcome back, {user?.email?.split('@')[0]}
                </Text>
                <HStack spacing={3} wrap="wrap">
                  <Badge colorScheme="orange" px={3} py={1} borderRadius="full">
                    {getRoleDisplayName(user?.role)}
                  </Badge>
                  {user?.primary_org && (
                    <Badge colorScheme="purple" px={3} py={1} borderRadius="full">
                      {user.primary_org.name}
                    </Badge>
                  )}
                  <Badge colorScheme="green" px={3} py={1} borderRadius="full">
                    Team Administrator
                  </Badge>
                </HStack>
              </VStack>
              <Button
                leftIcon={<FiRefreshCw />}
                onClick={loadClientData}
                isLoading={isLoading}
                size="sm"
              >
                Refresh Data
              </Button>
            </Flex>
          </CardBody>
        </Card>

        {/* Organization Statistics */}
        <Box>
          <Heading size="md" mb={6} display="flex" alignItems="center">
            <Icon as={FiTarget} mr={3} color="orange.500" />
            Organization Overview
          </Heading>
          
          {clientStats ? (
            <SimpleGrid columns={{ base: 1, md: 2, lg: 4 }} spacing={6}>
              <SimpleStatCard
                title="Team Members"
                value={clientStats.total_users}
                icon={FiUsers}
                color="blue.500"
                trend={6}
              />
              <SimpleStatCard
                title="Email Accounts"
                value={clientStats.total_email_accounts}
                icon={FiMail}
                color="purple.500"
                trend={9}
              />
              <SimpleStatCard
                title="Total Storage"
                value={formatBytes(clientStats.total_storage)}
                icon={FiHardDrive}
                color="orange.500"
                trend={14}
              />
              <SimpleStatCard
                title="Backup Status"
                value={clientStats.backup_frequency}
                icon={FiClock}
                color="green.500"
                trend={2}
              />
            </SimpleGrid>
          ) : (
            <Alert status="warning" borderRadius="md">
              <AlertIcon />
              <AlertDescription>
                Could not load organization statistics. Please check your connection and try again.
              </AlertDescription>
            </Alert>
          )}
        </Box>

        {/* Team Management Actions */}
        <Box>
          <Heading size="md" mb={6} display="flex" alignItems="center">
            <Icon as={FiSettings} mr={3} color="orange.500" />
            Team Management
          </Heading>
          <SimpleGrid columns={{ base: 1, md: 2, lg: 4 }} spacing={6}>
            {userActions.map((action, index) => (
              <UserActionCard key={index} {...action} />
            ))}
          </SimpleGrid>
        </Box>

        {/* Team Members Table */}
        <Box>
          <DataTable
            title="Team Members"
            subtitle="Monitor team members and their activity"
            data={endUsers}
            columns={userColumns}
            loading={isLoading}
            searchable
            sortable
            pagination
            pageSize={10}
            height="500px"
            onRefresh={loadClientData}
            actions={[
              {
                key: 'view',
                label: 'View Profile',
                icon: FiEye,
                onClick: (row) => navigate(`/client/users/${row.id}`),
              },
              {
                key: 'permissions',
                label: 'Permissions',
                icon: FiShield,
                onClick: (row) => navigate(`/client/users/${row.id}/permissions`),
                disabled: (row) => row.status === 'pending',
              },
              {
                key: 'settings',
                label: 'Settings',
                icon: FiSettings,
                onClick: (row) => navigate(`/client/users/${row.id}/settings`),
              },
            ]}
          />
        </Box>

        {/* Department Usage Overview */}
        <Box>
          <Heading size="md" mb={6} display="flex" alignItems="center">
            <Icon as={MdSupervisorAccount} mr={3} color="purple.500" />
            Department Usage
          </Heading>
          <SimpleGrid columns={{ base: 1, md: 2, lg: 2 }} spacing={6}>
            {teamUsage.map((dept, index) => (
              <Card key={index} variant="outline">
                <CardHeader pb={3}>
                  <Flex justify="space-between" align="center">
                    <Heading size="sm">{dept.department}</Heading>
                    <Badge 
                      colorScheme={dept.activity_score >= 90 ? 'green' : dept.activity_score >= 80 ? 'yellow' : 'red'}
                      variant="subtle"
                    >
                      {dept.activity_score}% active
                    </Badge>
                  </Flex>
                </CardHeader>
                <CardBody pt={0}>
                  <VStack align="stretch" spacing={4}>
                    <SimpleGrid columns={3} spacing={4}>
                      <VStack spacing={1}>
                        <Text fontSize="2xl" fontWeight="bold" color="blue.500">
                          {dept.users_count}
                        </Text>
                        <Text fontSize="xs" color="gray.500">Users</Text>
                      </VStack>
                      <VStack spacing={1}>
                        <Text fontSize="2xl" fontWeight="bold" color="purple.500">
                          {dept.email_accounts}
                        </Text>
                        <Text fontSize="xs" color="gray.500">Accounts</Text>
                      </VStack>
                      <VStack spacing={1}>
                        <Text fontSize="lg" fontWeight="bold" color="orange.500">
                          {formatBytes(dept.storage_used)}
                        </Text>
                        <Text fontSize="xs" color="gray.500">Storage</Text>
                      </VStack>
                    </SimpleGrid>
                    <Progress 
                      value={dept.activity_score} 
                      colorScheme={dept.activity_score >= 90 ? 'green' : dept.activity_score >= 80 ? 'yellow' : 'red'}
                      size="sm"
                      borderRadius="full"
                    />
                  </VStack>
                </CardBody>
              </Card>
            ))}
          </SimpleGrid>
        </Box>

        {/* Organization Health Cards */}
        <SimpleGrid columns={{ base: 1, lg: 2 }} spacing={6}>
          <Card>
            <CardHeader pb={3}>
              <Heading size="sm" display="flex" alignItems="center">
                <Icon as={FiActivity} mr={2} color="blue.500" />
                Organization Health
              </Heading>
            </CardHeader>
            <CardBody pt={0}>
              <VStack align="stretch" spacing={3}>
                <Flex justify="space-between">
                  <Text fontSize="sm" color="gray.600">Active Users:</Text>
                  <Text fontSize="sm" fontWeight="medium">
                    {clientStats?.active_users || 0} / {clientStats?.total_users || 0}
                  </Text>
                </Flex>
                <Flex justify="space-between">
                  <Text fontSize="sm" color="gray.600">Backup Health:</Text>
                  <Badge colorScheme="green" size="sm">Excellent</Badge>
                </Flex>
                <Flex justify="space-between">
                  <Text fontSize="sm" color="gray.600">Security Score:</Text>
                  <Badge colorScheme="green" size="sm">98%</Badge>
                </Flex>
                <Flex justify="space-between">
                  <Text fontSize="sm" color="gray.600">Avg. Storage per User:</Text>
                  <Text fontSize="sm" fontWeight="medium" color="orange.500">
                    {clientStats ? formatBytes(clientStats.total_storage / clientStats.total_users) : '0 B'}
                  </Text>
                </Flex>
              </VStack>
            </CardBody>
          </Card>

          <Card>
            <CardHeader pb={3}>
              <Heading size="sm" display="flex" alignItems="center">
                <Icon as={FiDatabase} mr={2} color="green.500" />
                Backup Information
              </Heading>
            </CardHeader>
            <CardBody pt={0}>
              <VStack align="stretch" spacing={3}>
                <Flex justify="space-between">
                  <Text fontSize="sm" color="gray.600">Backup Frequency:</Text>
                  <Badge colorScheme="blue" size="sm">{clientStats?.backup_frequency || 'Daily'}</Badge>
                </Flex>
                <Flex justify="space-between">
                  <Text fontSize="sm" color="gray.600">Last Backup:</Text>
                  <Text fontSize="sm" fontWeight="medium">
                    {clientStats ? new Date(clientStats.last_backup).toLocaleString() : 'N/A'}
                  </Text>
                </Flex>
                <Flex justify="space-between">
                  <Text fontSize="sm" color="gray.600">Total Emails:</Text>
                  <Text fontSize="sm" fontWeight="medium" color="purple.500">
                    {clientStats?.total_emails.toLocaleString() || '0'}
                  </Text>
                </Flex>
                <Flex justify="space-between">
                  <Text fontSize="sm" color="gray.600">Data Retention:</Text>
                  <Badge colorScheme="purple" size="sm">7 Years</Badge>
                </Flex>
              </VStack>
            </CardBody>
          </Card>
        </SimpleGrid>
      </VStack>
    </AdminLayout>
  )
}

export default ClientDashboard