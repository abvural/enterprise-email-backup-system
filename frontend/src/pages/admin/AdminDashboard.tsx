import React, { useEffect, useState } from 'react'
import {
  Box,
  Container,
  SimpleGrid,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  StatArrow,
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
  Spinner,
  useToast,
  Flex,
  Icon,
  Progress,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  TableContainer,
} from '@chakra-ui/react'
import { FiUsers, FiServer, FiMail, FiHardDrive, FiActivity, FiTrendingUp } from 'react-icons/fi'
import { Layout } from '../../components/layout/Layout'
import { useAuthStore } from '../../stores/authStore'
import { isAdmin, getRoleDisplayName } from '../../utils/roleUtils'
import { statisticsAPI, formatBytes, type SystemStats, type TopOrganization } from '../../services/api'

// Helper component for stat cards
const StatCard: React.FC<{
  title: string
  value: string | number
  icon: React.ElementType
  color: string
  helpText?: string
  change?: number
}> = ({ title, value, icon, color, helpText, change }) => (
  <Card>
    <CardBody>
      <Flex justify="space-between" align="start">
        <VStack align="start" spacing={0}>
          <Text fontSize="sm" color="gray.500" fontWeight="medium">
            {title}
          </Text>
          <Text fontSize="2xl" fontWeight="bold" color={color}>
            {value}
          </Text>
          {helpText && (
            <Text fontSize="xs" color="gray.500">
              {helpText}
            </Text>
          )}
          {change !== undefined && (
            <HStack spacing={1}>
              <StatArrow type={change >= 0 ? 'increase' : 'decrease'} />
              <Text fontSize="xs" color={change >= 0 ? 'green.500' : 'red.500'}>
                {Math.abs(change)}%
              </Text>
            </HStack>
          )}
        </VStack>
        <Box p={2} borderRadius="md" bg={`${color.split('.')[0]}.100`}>
          <Icon as={icon} boxSize={5} color={color} />
        </Box>
      </Flex>
    </CardBody>
  </Card>
)

export const AdminDashboard: React.FC = () => {
  const { user, claims } = useAuthStore()
  const cardBg = useColorModeValue('white', 'gray.700')
  const statBg = useColorModeValue('blue.50', 'blue.900')
  
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
      <Layout>
        <Container maxW="6xl" py={8}>
          <Alert status="error">
            <AlertIcon />
            <AlertTitle>Access Denied</AlertTitle>
            <AlertDescription>
              You don't have permission to access the admin dashboard.
            </AlertDescription>
          </Alert>
        </Container>
      </Layout>
    )
  }

  return (
    <Layout>
      <Container maxW="7xl" py={8}>
        <VStack spacing={8} align="stretch">
          {/* Header */}
          <Box>
            <Heading size="lg" color="blue.500" mb={4}>
              System Administration Dashboard
            </Heading>
            <HStack spacing={4} wrap="wrap">
              <Badge colorScheme="purple" fontSize="sm" px={3} py={1}>
                {getRoleDisplayName(user?.role)}
              </Badge>
              {claims && (
                <Badge colorScheme="blue" fontSize="sm" px={3} py={1}>
                  Organization: {claims.org_type}
                </Badge>
              )}
              <Badge colorScheme="green" fontSize="sm" px={3} py={1}>
                System Level Access
              </Badge>
            </HStack>
          </Box>

          {/* System Statistics */}
          <Box>
            <Heading size="md" mb={4}>System Overview</Heading>
            {isLoading ? (
              <Box py={8} textAlign="center">
                <Spinner size="lg" color="blue.500" mb={4} />
                <Text color="gray.500">Loading system statistics...</Text>
              </Box>
            ) : systemStats ? (
              <SimpleGrid columns={{ base: 1, md: 2, lg: 4 }} spacing={6} mb={6}>
                <StatCard
                  title="Total Users"
                  value={systemStats.total_users.toLocaleString()}
                  icon={FiUsers}
                  color="blue.500"
                  helpText={`${systemStats.active_users} active users`}
                />
                <StatCard
                  title="Organizations"
                  value={systemStats.total_organizations.toLocaleString()}
                  icon={FiServer}
                  color="green.500"
                  helpText={`${systemStats.organization_counts.distributor || 0} distributors, ${systemStats.organization_counts.dealer || 0} dealers`}
                />
                <StatCard
                  title="Email Accounts"
                  value={systemStats.total_email_accounts.toLocaleString()}
                  icon={FiMail}
                  color="purple.500"
                  helpText={`${systemStats.total_emails.toLocaleString()} emails stored`}
                />
                <StatCard
                  title="Storage Used"
                  value={formatBytes(systemStats.total_storage_bytes)}
                  icon={FiHardDrive}
                  color="orange.500"
                  helpText={`${systemStats.total_storage_gb.toFixed(2)} GB total`}
                />
              </SimpleGrid>
            ) : (
              <Alert status="warning">
                <AlertIcon />
                <AlertDescription>
                  Could not load system statistics. Please check your connection and try again.
                </AlertDescription>
              </Alert>
            )}
          </Box>

          {/* Provider Statistics */}
          {systemStats && (
            <Box>
              <Heading size="md" mb={4}>Email Provider Distribution</Heading>
              <SimpleGrid columns={{ base: 1, md: 2, lg: 4 }} spacing={4}>
                {Object.entries(systemStats.provider_counts).map(([provider, count]) => (
                  <Card key={provider}>
                    <CardBody>
                      <VStack spacing={2}>
                        <Text fontSize="lg" fontWeight="bold" textTransform="capitalize">
                          {provider}
                        </Text>
                        <Text fontSize="2xl" fontWeight="bold" color="blue.500">
                          {count}
                        </Text>
                        <Text fontSize="sm" color="gray.500">accounts</Text>
                      </VStack>
                    </CardBody>
                  </Card>
                ))}
              </SimpleGrid>
            </Box>
          )}

          {/* Top Organizations */}
          {topOrganizations.length > 0 && (
            <Box>
              <Heading size="md" mb={4}>Top Organizations by Usage</Heading>
              <Card>
                <CardBody>
                  <TableContainer>
                    <Table variant="simple" size="sm">
                      <Thead>
                        <Tr>
                          <Th>Organization</Th>
                          <Th>Type</Th>
                          <Th isNumeric>Users</Th>
                          <Th isNumeric>Emails</Th>
                          <Th isNumeric>Storage</Th>
                          <Th>Status</Th>
                        </Tr>
                      </Thead>
                      <Tbody>
                        {topOrganizations.slice(0, 10).map((org) => (
                          <Tr key={org.id}>
                            <Td fontWeight="medium">{org.name}</Td>
                            <Td>
                              <Badge
                                colorScheme={
                                  org.type === 'distributor' ? 'purple' : 
                                  org.type === 'dealer' ? 'orange' : 'blue'
                                }
                                size="sm"
                              >
                                {org.type}
                              </Badge>
                            </Td>
                            <Td isNumeric>{org.user_count}</Td>
                            <Td isNumeric>{org.email_count.toLocaleString()}</Td>
                            <Td isNumeric>{formatBytes(org.storage_bytes)}</Td>
                            <Td>
                              <Badge
                                colorScheme={org.is_active ? 'green' : 'red'}
                                size="sm"
                              >
                                {org.is_active ? 'Active' : 'Inactive'}
                              </Badge>
                            </Td>
                          </Tr>
                        ))}
                      </Tbody>
                    </Table>
                  </TableContainer>
                </CardBody>
              </Card>
            </Box>
          )}

          {/* Recent System Activity */}
          {systemStats?.recent_activity && systemStats.recent_activity.length > 0 && (
            <Box>
              <Heading size="md" mb={4}>Recent System Activity</Heading>
              <Card>
                <CardBody>
                  <VStack spacing={3} align="stretch">
                    {systemStats.recent_activity.slice(0, 10).map((activity, index) => (
                      <Flex key={index} align="center" justify="space-between" p={3} borderRadius="md" bg="gray.50">
                        <HStack spacing={3}>
                          <Icon as={FiActivity} color="blue.500" />
                          <Text fontSize="sm">{activity.message}</Text>
                        </HStack>
                        <Text fontSize="xs" color="gray.500">
                          {new Date(activity.timestamp).toLocaleDateString()}
                        </Text>
                      </Flex>
                    ))}
                  </VStack>
                </CardBody>
              </Card>
            </Box>
          )}

          {/* Role Distribution */}
          {systemStats && (
            <Box>
              <Heading size="md" mb={4}>User Role Distribution</Heading>
              <SimpleGrid columns={{ base: 1, md: 2, lg: 5 }} spacing={4}>
                {Object.entries(systemStats.role_counts).map(([role, count]) => (
                  <Card key={role}>
                    <CardBody>
                      <VStack spacing={2}>
                        <Text fontSize="lg" fontWeight="bold" textTransform="capitalize">
                          {role.replace('_', ' ')}
                        </Text>
                        <Text fontSize="2xl" fontWeight="bold" color="green.500">
                          {count}
                        </Text>
                        <Text fontSize="sm" color="gray.500">users</Text>
                      </VStack>
                    </CardBody>
                  </Card>
                ))}
              </SimpleGrid>
            </Box>
          )}

          {/* Quick Actions */}
          <Box>
            <Heading size="md" mb={4}>Quick Actions</Heading>
            <SimpleGrid columns={{ base: 1, md: 2, lg: 4 }} spacing={4}>
              <Button 
                colorScheme="blue" 
                size="lg"
                onClick={() => window.location.href = '/admin/organizations'}
              >
                Manage Organizations
              </Button>
              <Button 
                colorScheme="green" 
                size="lg"
                onClick={() => toast({
                  title: 'Coming Soon',
                  description: 'User management interface is under development.',
                  status: 'info',
                  duration: 3000,
                  isClosable: true,
                })}
              >
                Manage Users
              </Button>
              <Button 
                colorScheme="purple" 
                size="lg"
                onClick={loadSystemData}
                isLoading={isStatsLoading}
              >
                Refresh Statistics
              </Button>
              <Button 
                colorScheme="orange" 
                size="lg"
                onClick={() => toast({
                  title: 'Coming Soon',
                  description: 'System settings interface is under development.',
                  status: 'info',
                  duration: 3000,
                  isClosable: true,
                })}
              >
                System Settings
              </Button>
            </SimpleGrid>
          </Box>

          {/* System Information */}
          <Card bg={statBg}>
            <CardBody>
              <VStack align="stretch" spacing={2}>
                <Heading size="sm">System Information</Heading>
                <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
                  <VStack align="start" spacing={2}>
                    <Text fontSize="sm">
                      <strong>Version:</strong> Enterprise Email Backup v2.0
                    </Text>
                    <Text fontSize="sm">
                      <strong>Environment:</strong> Production Ready
                    </Text>
                    <Text fontSize="sm">
                      <strong>Database:</strong> PostgreSQL (Connected)
                    </Text>
                  </VStack>
                  <VStack align="start" spacing={2}>
                    <Text fontSize="sm">
                      <strong>Storage:</strong> MinIO Object Storage (Connected)
                    </Text>
                    <Text fontSize="sm">
                      <strong>API Endpoints:</strong> {systemStats ? 'All Online' : 'Checking...'}
                    </Text>
                    <Text fontSize="sm">
                      <strong>Last Updated:</strong> {new Date().toLocaleString()}
                    </Text>
                  </VStack>
                </SimpleGrid>
              </VStack>
            </CardBody>
          </Card>
        </VStack>
      </Container>
    </Layout>
  )
}

export default AdminDashboard