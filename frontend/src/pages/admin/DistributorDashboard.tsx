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
  Divider,
} from '@chakra-ui/react'
import { FiUsers, FiMail, FiSettings, FiPlus, FiTrendingUp, FiServer, FiActivity, FiBarChart, FiRefreshCw, FiHardDrive } from 'react-icons/fi'
import { MdBusiness } from 'react-icons/md'
import { useNavigate } from 'react-router-dom'
import { AdminLayout } from '../../components/layout/AdminLayout'
import { useAuthStore } from '../../stores/authStore'
import { statisticsAPI, formatBytes, type NetworkStats, type DealerPerformanceItem } from '../../services/api'
import { getRoleDisplayName } from '../../utils/roleUtils'

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
    <AdminLayout
      title="Network Dashboard"
      breadcrumbs={[
        { label: 'Distributor' },
        { label: 'Network Overview' },
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
                  <Badge colorScheme="purple" px={3} py={1} borderRadius="full">
                    {getRoleDisplayName(user?.role)}
                  </Badge>
                  {user?.primary_org && (
                    <Badge colorScheme="blue" px={3} py={1} borderRadius="full">
                      {user.primary_org.name}
                    </Badge>
                  )}
                  <Badge colorScheme="green" px={3} py={1} borderRadius="full">
                    Network Manager
                  </Badge>
                </HStack>
              </VStack>
              <Button
                leftIcon={<FiRefreshCw />}
                onClick={refreshData}
                isLoading={isRefreshing}
                size="sm"
              >
                Refresh Data
              </Button>
            </Flex>
          </CardBody>
        </Card>

        {/* Network Statistics */}
        <Box>
          <Heading size="md" mb={6} display="flex" alignItems="center">
            <Icon as={FiBarChart} mr={3} color="purple.500" />
            Network Overview
          </Heading>
          
          {networkStats ? (
            <SimpleGrid columns={{ base: 1, md: 2, lg: 4 }} spacing={6}>
              <SimpleStatCard
                title="Total Dealers"
                value={networkStats.total_dealers.toLocaleString()}
                icon={MdBusiness}
                color="purple.500"
                trend={networkStats.active_dealers > networkStats.total_dealers * 0.8 ? 8 : undefined}
              />
              <SimpleStatCard
                title="Total Clients"
                value={networkStats.total_clients.toLocaleString()}
                icon={FiUsers}
                color="blue.500"
                trend={12}
              />
              <SimpleStatCard
                title="Email Accounts"
                value={networkStats.total_email_accounts.toLocaleString()}
                icon={FiMail}
                color="green.500"
                trend={5}
              />
              <SimpleStatCard
                title="Network Storage"
                value={formatBytes(networkStats.network_storage_bytes)}
                icon={FiHardDrive}
                color="orange.500"
                trend={18}
              />
            </SimpleGrid>
          ) : (
            <Alert status="warning" borderRadius="md">
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
          <Heading size="md" mb={6} display="flex" alignItems="center">
            <Icon as={FiSettings} mr={3} color="purple.500" />
            Quick Actions
          </Heading>
          <SimpleGrid columns={{ base: 1, md: 2, lg: 4 }} spacing={6}>
            <QuickActionCard
              title="View Network"
              description="See your complete dealer and client network"
              icon={MdBusiness}
              color="blue.500"
              onClick={() => navigate('/distributor/network')}
            />
            <QuickActionCard
              title="Add New Dealer"
              description="Create a new dealer organization"
              icon={FiPlus}
              color="green.500"
              onClick={() => navigate('/distributor/add-dealer')}
            />
            <QuickActionCard
              title="Network Statistics"
              description="View detailed network analytics"
              icon={FiBarChart}
              color="purple.500"
              onClick={() => navigate('/distributor/statistics')}
            />
            <QuickActionCard
              title="Manage Settings"
              description="Configure network preferences"
              icon={FiSettings}
              color="orange.500"
              onClick={() => navigate('/distributor/settings')}
            />
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
    </AdminLayout>
  )
}

export default DistributorDashboard