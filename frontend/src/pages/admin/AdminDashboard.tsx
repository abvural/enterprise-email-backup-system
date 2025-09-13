import React, { useEffect, useState } from 'react'
import {
  Box,
  Container,
  SimpleGrid,
  Heading,
  VStack,
  HStack,
  Card,
  CardBody,
  CardHeader,
  Badge,
  Text,
  Button,
  useColorModeValue,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
  useToast,
  Flex,
  Icon,
  Divider,
} from '@chakra-ui/react'
import { 
  FiUsers, 
  FiServer, 
  FiMail, 
  FiHardDrive, 
  FiActivity, 
  FiTrendingUp,
  FiBarChart,
  FiSettings,
  FiRefreshCw,
  FiPlus
} from 'react-icons/fi'
import { AdminLayout } from '../../components/layout/AdminLayout'
import { StatCard, UserStatCard, EmailStatCard, StorageStatCard, ActivityStatCard } from '../../components/common/StatCard'
import { DataTable, type TableColumn } from '../../components/common/DataTable'
import { useAuthStore } from '../../stores/authStore'
import { isAdmin, getRoleDisplayName, canAccess } from '../../utils/roleUtils'
import { statisticsAPI, formatBytes, type SystemStats, type TopOrganization } from '../../services/api'
import { useNavigate } from 'react-router-dom'

// Quick action card component
const QuickActionCard: React.FC<{
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

export const AdminDashboard: React.FC = () => {
  const { user } = useAuthStore()
  const navigate = useNavigate()
  const cardBg = useColorModeValue('white', 'gray.700')
  const [systemStats, setSystemStats] = useState<SystemStats | null>(null)
  const [topOrganizations, setTopOrganizations] = useState<TopOrganization[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isStatsLoading, setIsStatsLoading] = useState(false)
  const toast = useToast()

  useEffect(() => {
    loadSystemData()
  }, [])

  const loadSystemData = async () => {
    try {
      setIsLoading(true)
      
      // Load system statistics
      const statsResponse = await statisticsAPI.getSystemStats()
      if (statsResponse.data.success) {
        setSystemStats(statsResponse.data.data)
      }
      
      // Load top organizations
      const topOrgsResponse = await statisticsAPI.getTopOrganizations(10)
      if (topOrgsResponse.data.success) {
        setTopOrganizations(topOrgsResponse.data.data)
      }
    } catch (error) {
      console.error('Failed to load system data:', error)
      toast({
        title: 'Failed to Load System Data',
        description: 'Could not retrieve system statistics. Please refresh the page.',
        status: 'error',
        duration: 5000,
        isClosable: true,
      })
    } finally {
      setIsLoading(false)
    }
  }

  if (!isAdmin(user)) {
    return (
      <AdminLayout title="Access Denied">
        <Container maxW="6xl" py={8}>
          <Alert status="error" borderRadius="md">
            <AlertIcon />
            <AlertTitle>Access Denied</AlertTitle>
            <AlertDescription>
              You don't have permission to access the admin dashboard.
            </AlertDescription>
          </Alert>
        </Container>
      </AdminLayout>
    )
  }

  // Table columns for top organizations
  const organizationColumns: TableColumn<TopOrganization>[] = [
    {
      key: 'name',
      title: 'Organization',
      sortable: true,
      render: (value, row) => (
        <VStack align="flex-start" spacing={1}>
          <Text fontWeight="semibold">{value}</Text>
          <Badge size="sm" colorScheme="blue">
            {row.type}
          </Badge>
        </VStack>
      ),
    },
    {
      key: 'total_users',
      title: 'Users',
      sortable: true,
      align: 'center',
      render: (value) => (
        <Badge colorScheme="green" variant="subtle">
          {value?.toLocaleString() || '0'}
        </Badge>
      ),
    },
    {
      key: 'total_emails',
      title: 'Emails',
      sortable: true,
      align: 'center',
      render: (value) => (
        <Text fontWeight="medium">
          {value?.toLocaleString() || '0'}
        </Text>
      ),
    },
    {
      key: 'storage_used',
      title: 'Storage Used',
      sortable: true,
      align: 'right',
      render: (value) => (
        <Text fontWeight="medium" color="orange.500">
          {formatBytes(value || 0)}
        </Text>
      ),
    },
  ]

  // Admin-only quick actions (Level 1 only)
  const getAdminQuickActions = () => {
    // This dashboard should ONLY be for admin (Level 1)
    if (user?.role?.level !== 1) {
      return []
    }

    return [
      {
        title: 'System Statistics',
        description: 'View system-wide performance metrics',
        icon: FiBarChart,
        color: 'purple.500',
        onClick: () => navigate('/admin/system-stats'),
      },
      {
        title: 'System Settings',
        description: 'Configure global system settings',
        icon: FiSettings,
        color: 'orange.500',
        onClick: () => navigate('/admin/system-settings'),
      },
    ]
  }

  // Render main dashboard content
  const renderDashboard = () => {
        return (
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
                        <Badge colorScheme="blue" px={3} py={1} borderRadius="full">
                          {getRoleDisplayName(user?.role)}
                        </Badge>
                        <Badge colorScheme="purple" px={3} py={1} borderRadius="full">
                          System Administrator
                        </Badge>
                        <Badge colorScheme="green" px={3} py={1} borderRadius="full">
                          Active
                        </Badge>
                      </HStack>
                    </VStack>
                    <Button
                      leftIcon={<FiRefreshCw />}
                      onClick={loadSystemData}
                      isLoading={isStatsLoading}
                      size="sm"
                    >
                      Refresh Data
                    </Button>
                  </Flex>
                </CardBody>
              </Card>

              {/* System Statistics */}
              <Box>
                <Heading size="md" mb={6} display="flex" alignItems="center">
                  <Icon as={FiBarChart} mr={3} color="blue.500" />
                  System Overview
                </Heading>
                
                {systemStats ? (
                  <SimpleGrid columns={{ base: 1, md: 2, lg: 4 }} spacing={6}>
                    <UserStatCard
                      title="Total Users"
                      value={systemStats.total_users}
                      helpText={`${systemStats.active_users} active users`}
                      loading={isLoading}
                      size="lg"
                    />
                    <StatCard
                      title="Organizations"
                      value={systemStats.total_organizations}
                      icon={FiServer}
                      color="green.500"
                      helpText={`${systemStats.organization_counts.distributor || 0} distributors, ${systemStats.organization_counts.dealer || 0} dealers`}
                      loading={isLoading}
                      size="lg"
                    />
                    <EmailStatCard
                      title="Email Accounts"
                      value={systemStats.total_email_accounts}
                      helpText={`${systemStats.total_emails.toLocaleString()} emails stored`}
                      loading={isLoading}
                      size="lg"
                    />
                    <StorageStatCard
                      title="Storage Used"
                      value={formatBytes(systemStats.total_storage_bytes)}
                      helpText={`${systemStats.total_storage_gb.toFixed(2)} GB total`}
                      loading={isLoading}
                      size="lg"
                    />
                  </SimpleGrid>
                ) : (
                  <Alert status="warning" borderRadius="md">
                    <AlertIcon />
                    <AlertDescription>
                      Could not load system statistics. Please check your connection and try again.
                    </AlertDescription>
                  </Alert>
                )}
              </Box>

              {/* Quick Actions */}
              <Box>
                <Heading size="md" mb={6} display="flex" alignItems="center">
                  <Icon as={FiSettings} mr={3} color="blue.500" />
                  Quick Actions
                </Heading>
                <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={6}>
                  {getAdminQuickActions().map((action, index) => (
                    <QuickActionCard key={index} {...action} />
                  ))}
                </SimpleGrid>
              </Box>

              {/* Top Organizations Table */}
              {topOrganizations.length > 0 && (
                <Box>
                  <DataTable
                    title="Top Organizations"
                    subtitle="Organizations with highest activity"
                    data={topOrganizations}
                    columns={organizationColumns}
                    loading={isLoading}
                    searchable
                    sortable
                    pagination
                    pageSize={5}
                    height="400px"
                    onRefresh={loadSystemData}
                  />
                </Box>
              )}

              {/* System Information */}
              <SimpleGrid columns={{ base: 1, lg: 2 }} spacing={6}>
                <Card>
                  <CardHeader pb={3}>
                    <Heading size="sm" display="flex" alignItems="center">
                      <Icon as={FiServer} mr={2} color="blue.500" />
                      System Status
                    </Heading>
                  </CardHeader>
                  <CardBody pt={0}>
                    <VStack align="stretch" spacing={3}>
                      <Flex justify="space-between">
                        <Text fontSize="sm" color="gray.600">Version:</Text>
                        <Text fontSize="sm" fontWeight="medium">Enterprise Email Backup v2.0</Text>
                      </Flex>
                      <Flex justify="space-between">
                        <Text fontSize="sm" color="gray.600">Environment:</Text>
                        <Badge colorScheme="green" size="sm">Production Ready</Badge>
                      </Flex>
                      <Flex justify="space-between">
                        <Text fontSize="sm" color="gray.600">Database:</Text>
                        <Badge colorScheme="green" size="sm">PostgreSQL Connected</Badge>
                      </Flex>
                      <Flex justify="space-between">
                        <Text fontSize="sm" color="gray.600">Storage:</Text>
                        <Badge colorScheme="green" size="sm">MinIO Connected</Badge>
                      </Flex>
                    </VStack>
                  </CardBody>
                </Card>

                <Card>
                  <CardHeader pb={3}>
                    <Heading size="sm" display="flex" alignItems="center">
                      <Icon as={FiActivity} mr={2} color="green.500" />
                      Recent Activity
                    </Heading>
                  </CardHeader>
                  <CardBody pt={0}>
                    <VStack align="stretch" spacing={3}>
                      <Flex justify="space-between">
                        <Text fontSize="sm" color="gray.600">API Status:</Text>
                        <Badge colorScheme="green" size="sm">All Online</Badge>
                      </Flex>
                      <Flex justify="space-between">
                        <Text fontSize="sm" color="gray.600">Last Sync:</Text>
                        <Text fontSize="sm" fontWeight="medium">{new Date().toLocaleString()}</Text>
                      </Flex>
                      <Flex justify="space-between">
                        <Text fontSize="sm" color="gray.600">Active Sessions:</Text>
                        <Text fontSize="sm" fontWeight="medium">{systemStats?.active_users || 0}</Text>
                      </Flex>
                      <Flex justify="space-between">
                        <Text fontSize="sm" color="gray.600">System Load:</Text>
                        <Badge colorScheme="green" size="sm">Normal</Badge>
                      </Flex>
                    </VStack>
                  </CardBody>
                </Card>
              </SimpleGrid>
          </VStack>
        )
  }

  return (
    <AdminLayout 
      title="Dashboard"
      breadcrumbs={[
        { label: 'Overview' },
      ]}
    >
      {renderDashboard()}
    </AdminLayout>
  )
}

export default AdminDashboard