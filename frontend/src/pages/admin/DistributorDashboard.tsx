import React, { useEffect, useState } from 'react'
import {
  Box,
  Container,
  VStack,
  Text,
  SimpleGrid,
  Card,
  CardBody,
  CardHeader,
  HStack,
  Icon,
  Button,
  Badge,
  Heading,
  Spinner,
  useToast,
  Alert,
  AlertIcon,
  AlertDescription,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  TableContainer,
  Progress,
  Flex,
  useColorModeValue,
} from '@chakra-ui/react'
import { FiUsers, FiMail, FiSettings, FiPlus, FiTrendingUp, FiServer, FiActivity, FiBarChart } from 'react-icons/fi'
import { MdBusiness } from 'react-icons/md'
import { useNavigate } from 'react-router-dom'
import { AdminLayout } from '../../components/layout/AdminLayout'
import { useAuthStore } from '../../stores/authStore'
import { statisticsAPI, formatBytes, type NetworkStats, type DealerPerformanceItem } from '../../services/api'

// Enhanced StatCard component for network metrics
const NetworkStatCard: React.FC<{
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
        </VStack>
        <Box p={2} borderRadius="md" bg={`${color.split('.')[0]}.100`}>
          <Icon as={icon} boxSize={5} color={color} />
        </Box>
      </Flex>
    </CardBody>
  </Card>
)

export const DistributorDashboard: React.FC = () => {
  const navigate = useNavigate()
  const { user } = useAuthStore()
  const cardBg = useColorModeValue('white', 'gray.700')
  const toast = useToast()

  const [networkStats, setNetworkStats] = useState<NetworkStats | null>(null)
  const [dealerPerformance, setDealerPerformance] = useState<DealerPerformanceItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)

  useEffect(() => {
    loadNetworkData()
  }, [])

  const loadNetworkData = async () => {
    try {
      setIsLoading(true)
      
      // Load network statistics
      const networkResponse = await statisticsAPI.getNetworkStats()
      if (networkResponse.data.success) {
        setNetworkStats(networkResponse.data.data)
      }
      
      // Load dealer performance
      const performanceResponse = await statisticsAPI.getDealerPerformance()
      if (performanceResponse.data.success) {
        setDealerPerformance(performanceResponse.data.data.dealer_performance)
      }
    } catch (error) {
      console.error('Failed to load network data:', error)
      toast({
        title: 'Failed to Load Network Data',
        description: 'Could not retrieve network statistics. Please refresh the page.',
        status: 'error',
        duration: 5000,
        isClosable: true,
      })
    } finally {
      setIsLoading(false)
    }
  }

  const refreshData = async () => {
    setIsRefreshing(true)
    await loadNetworkData()
    setIsRefreshing(false)
    toast({
      title: 'Data Refreshed',
      description: 'Network statistics have been updated.',
      status: 'success',
      duration: 3000,
      isClosable: true,
    })
  }

  // Check if user has distributor role (Level 2)
  if (user?.role?.level !== 2) {
    return (
      <AdminLayout>
        <Alert status="error" borderRadius="md">
          <AlertIcon />
          <AlertDescription>
            You don't have permission to access the distributor dashboard. This dashboard is only for distributor level users.
          </AlertDescription>
        </Alert>
      </AdminLayout>
    )
  }

  return (
    <AdminLayout>
      <Container maxW="7xl" py={8}>
        <VStack spacing={8} align="stretch">
          {/* Header */}
          <Box>
            <Heading size="lg" color="purple.500" mb={4}>
              Distributor Network Dashboard
            </Heading>
            <HStack spacing={4} wrap="wrap" mb={4}>
              <Badge colorScheme="purple" fontSize="sm" px={3} py={1}>
                Distributor Level
              </Badge>
              {user?.primary_org && (
                <Badge colorScheme="blue" fontSize="sm" px={3} py={1}>
                  {user.primary_org.name}
                </Badge>
              )}
              <Badge colorScheme="green" fontSize="sm" px={3} py={1}>
                Network Access
              </Badge>
            </HStack>
            <Text fontSize="md" color="gray.600">
              Manage your dealer network and monitor organization performance
            </Text>
          </Box>

          {/* Network Statistics */}
          <Box>
            <Heading size="md" mb={4}>Network Overview</Heading>
            {isLoading ? (
              <Box py={8} textAlign="center">
                <Spinner size="lg" color="purple.500" mb={4} />
                <Text color="gray.500">Loading network statistics...</Text>
              </Box>
            ) : networkStats ? (
              <SimpleGrid columns={{ base: 1, md: 2, lg: 4 }} spacing={6}>
                <NetworkStatCard
                  title="Total Dealers"
                  value={networkStats.total_dealers.toLocaleString()}
                  icon={MdBusiness}
                  color="purple.500"
                  helpText={`${networkStats.active_dealers} active dealers`}
                />
                <NetworkStatCard
                  title="Total Clients"
                  value={networkStats.total_clients.toLocaleString()}
                  icon={FiUsers}
                  color="blue.500"
                  helpText={`${networkStats.total_end_users} end users`}
                />
                <NetworkStatCard
                  title="Email Accounts"
                  value={networkStats.total_email_accounts.toLocaleString()}
                  icon={FiMail}
                  color="green.500"
                  helpText="Across entire network"
                />
                <NetworkStatCard
                  title="Network Storage"
                  value={formatBytes(networkStats.network_storage_bytes)}
                  icon={FiServer}
                  color="orange.500"
                  helpText={`${networkStats.network_storage_gb.toFixed(2)} GB total`}
                />
              </SimpleGrid>
            ) : (
              <Alert status="warning">
                <AlertIcon />
                <AlertDescription>
                  Could not load network statistics. Please check your connection and try again.
                </AlertDescription>
              </Alert>
            )}
          </Box>

          {/* Dealer Performance */}
          {dealerPerformance.length > 0 && (
            <Box>
              <Heading size="md" mb={4}>Dealer Performance</Heading>
              <Card>
                <CardBody>
                  <TableContainer>
                    <Table variant="simple" size="sm">
                      <Thead>
                        <Tr>
                          <Th>Dealer Name</Th>
                          <Th isNumeric>Clients</Th>
                          <Th isNumeric>Users</Th>
                          <Th isNumeric>Emails</Th>
                          <Th isNumeric>Storage</Th>
                          <Th>Status</Th>
                        </Tr>
                      </Thead>
                      <Tbody>
                        {dealerPerformance.map((dealer) => (
                          <Tr key={dealer.dealer_id}>
                            <Td fontWeight="medium">{dealer.dealer_name}</Td>
                            <Td isNumeric>{dealer.client_count}</Td>
                            <Td isNumeric>{dealer.user_count}</Td>
                            <Td isNumeric>{dealer.email_count.toLocaleString()}</Td>
                            <Td isNumeric>{formatBytes(dealer.storage_bytes)}</Td>
                            <Td>
                              <Badge
                                colorScheme={dealer.is_active ? 'green' : 'red'}
                                size="sm"
                              >
                                {dealer.is_active ? 'Active' : 'Inactive'}
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

          {/* Client Distribution */}
          {networkStats?.client_distribution && networkStats.client_distribution.length > 0 && (
            <Box>
              <Heading size="md" mb={4}>Client Distribution by Dealer</Heading>
              <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={4}>
                {networkStats.client_distribution.map((dist, index) => (
                  <Card key={index}>
                    <CardBody>
                      <VStack spacing={3}>
                        <Text fontWeight="bold" textAlign="center">
                          {dist.dealer_name}
                        </Text>
                        <Text fontSize="2xl" fontWeight="bold" color="blue.500" textAlign="center">
                          {dist.client_count}
                        </Text>
                        <Text fontSize="sm" color="gray.500" textAlign="center">
                          Active Clients
                        </Text>
                        {networkStats.total_clients > 0 && (
                          <Progress
                            value={(dist.client_count / networkStats.total_clients) * 100}
                            colorScheme="blue"
                            size="sm"
                            w="full"
                          />
                        )}
                      </VStack>
                    </CardBody>
                  </Card>
                ))}
              </SimpleGrid>
            </Box>
          )}

          {/* Recent Network Activity */}
          {networkStats?.recent_activity && networkStats.recent_activity.length > 0 && (
            <Box>
              <Heading size="md" mb={4}>Recent Network Activity</Heading>
              <Card>
                <CardBody>
                  <VStack spacing={3} align="stretch">
                    {networkStats.recent_activity.slice(0, 8).map((activity, index) => (
                      <Flex key={index} align="center" justify="space-between" p={3} borderRadius="md" bg="gray.50">
                        <HStack spacing={3}>
                          <Icon as={FiActivity} color="purple.500" />
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

          {/* Quick Actions */}
          <Box>
            <Heading size="md" mb={4}>Quick Actions</Heading>
            <SimpleGrid columns={{ base: 1, md: 2, lg: 4 }} spacing={4}>
              <Card cursor="pointer" onClick={() => navigate('/distributor/network')} _hover={{ bg: 'gray.50' }}>
                <CardBody textAlign="center" p={6}>
                  <Icon as={MdBusiness} boxSize={8} color="blue.500" mb={3} />
                  <Text fontWeight="medium">View Network</Text>
                  <Text fontSize="sm" color="gray.600">See your complete dealer and client network</Text>
                </CardBody>
              </Card>

              <Card cursor="pointer" onClick={() => navigate('/distributor/add-dealer')} _hover={{ bg: 'gray.50' }}>
                <CardBody textAlign="center" p={6}>
                  <Icon as={FiPlus} boxSize={8} color="green.500" mb={3} />
                  <Text fontWeight="medium">Add New Dealer</Text>
                  <Text fontSize="sm" color="gray.600">Create a new dealer organization</Text>
                </CardBody>
              </Card>

              <Card cursor="pointer" onClick={() => navigate('/distributor/statistics')} _hover={{ bg: 'gray.50' }}>
                <CardBody textAlign="center" p={6}>
                  <Icon as={FiMail} boxSize={8} color="orange.500" mb={3} />
                  <Text fontWeight="medium">Email Statistics</Text>
                  <Text fontSize="sm" color="gray.600">View network email usage statistics</Text>
                </CardBody>
              </Card>

              <Card cursor="pointer" onClick={refreshData} _hover={{ bg: 'gray.50' }}>
                <CardBody textAlign="center" p={6}>
                  <Icon as={FiTrendingUp} boxSize={8} color="purple.500" mb={3} />
                  <Text fontWeight="medium">Refresh Data</Text>
                  <Text fontSize="sm" color="gray.600">
                    {isRefreshing ? 'Updating...' : 'Update network statistics'}
                  </Text>
                  {isRefreshing && <Spinner size="sm" mt={2} color="purple.500" />}
                </CardBody>
              </Card>
            </SimpleGrid>
          </Box>

        {/* Network Health Summary */}
        {networkStats && (
          <SimpleGrid columns={{ base: 1, lg: 2 }} spacing={6}>
            <Card>
              <CardHeader pb={3}>
                <Heading size="sm" display="flex" alignItems="center">
                  <Icon as={FiActivity} mr={2} color="purple.500" />
                  Network Health
                </Heading>
              </CardHeader>
              <CardBody pt={0}>
                <VStack align="stretch" spacing={3}>
                  <Flex justify="space-between">
                    <Text fontSize="sm" color="gray.600">Active Dealers:</Text>
                    <Text fontSize="sm" fontWeight="medium">
                      {networkStats.active_dealers} / {networkStats.total_dealers}
                    </Text>
                  </Flex>
                  <Flex justify="space-between">
                    <Text fontSize="sm" color="gray.600">Network Utilization:</Text>
                    <Badge colorScheme={networkStats.total_email_accounts > 0 ? 'green' : 'yellow'} size="sm">
                      {networkStats.total_email_accounts > 0 ? 'Active' : 'Low'}
                    </Badge>
                  </Flex>
                  <Flex justify="space-between">
                    <Text fontSize="sm" color="gray.600">Storage per Account:</Text>
                    <Text fontSize="sm" fontWeight="medium" color="orange.500">
                      {formatBytes(networkStats.network_storage_bytes / Math.max(networkStats.total_email_accounts, 1))}
                    </Text>
                  </Flex>
                  <Flex justify="space-between">
                    <Text fontSize="sm" color="gray.600">Network Status:</Text>
                    <Badge colorScheme="green" size="sm">Optimal</Badge>
                  </Flex>
                </VStack>
              </CardBody>
            </Card>

            <Card>
              <CardHeader pb={3}>
                <Heading size="sm" display="flex" alignItems="center">
                  <Icon as={FiBarChart} mr={2} color="green.500" />
                  Performance Metrics
                </Heading>
              </CardHeader>
              <CardBody pt={0}>
                <VStack align="stretch" spacing={3}>
                  <Flex justify="space-between">
                    <Text fontSize="sm" color="gray.600">Growth Rate:</Text>
                    <Badge 
                      colorScheme={networkStats.total_clients > networkStats.total_dealers * 2 ? 'green' : 'blue'} 
                      size="sm"
                    >
                      {networkStats.total_clients > networkStats.total_dealers * 2 ? 'High' : 'Moderate'}
                    </Badge>
                  </Flex>
                  <Flex justify="space-between">
                    <Text fontSize="sm" color="gray.600">Email Volume:</Text>
                    <Badge 
                      colorScheme={networkStats.total_email_accounts > 50 ? 'purple' : 'blue'} 
                      size="sm"
                    >
                      {networkStats.total_email_accounts > 50 ? 'High Volume' : 'Standard'}
                    </Badge>
                  </Flex>
                  <Flex justify="space-between">
                    <Text fontSize="sm" color="gray.600">Network Efficiency:</Text>
                    <Text fontSize="sm" fontWeight="medium" color="green.500">Excellent</Text>
                  </Flex>
                  <Flex justify="space-between">
                    <Text fontSize="sm" color="gray.600">Last Updated:</Text>
                    <Text fontSize="sm" fontWeight="medium">{new Date().toLocaleString()}</Text>
                  </Flex>
                </VStack>
              </CardBody>
            </Card>
          </SimpleGrid>
        )}
        </VStack>
      </Container>
    </AdminLayout>
  )
}

export default DistributorDashboard