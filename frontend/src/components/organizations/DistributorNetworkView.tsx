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
  Divider,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  useToast,
  Spinner,
  Alert,
  AlertIcon,
  Accordion,
  AccordionItem,
  AccordionButton,
  AccordionPanel,
  AccordionIcon,
} from '@chakra-ui/react'
import { 
  MdStorefront, 
  MdBusiness, 
  MdPeople, 
  MdAdd, 
  MdAccountTree, 
  MdTrendingUp,
  MdEmail
} from 'react-icons/md'
import { useNavigate } from 'react-router-dom'
import { Layout } from '../layout/Layout'
import { useAuthStore } from '../../stores/authStore'
import { organizationsAPI, type Organization } from '../../services/api'

interface NetworkStats {
  totalDealers: number
  totalClients: number
  totalUsers: number
  totalStorage: number
}

export const DistributorNetworkView: React.FC = () => {
  const navigate = useNavigate()
  const toast = useToast()
  const { user } = useAuthStore()
  
  const [loading, setLoading] = useState(true)
  const [dealers, setDealers] = useState<Organization[]>([])
  const [clients, setClients] = useState<Organization[]>([])
  const [stats, setStats] = useState<NetworkStats>({
    totalDealers: 0,
    totalClients: 0,
    totalUsers: 0,
    totalStorage: 0
  })

  const fetchNetworkData = async () => {
    try {
      setLoading(true)
      // Fetch all organizations to find dealers and clients under this distributor
      const orgsResponse = await organizationsAPI.getOrganizations()
      const allOrgs = orgsResponse.data || []
      
      // Filter dealers and clients that belong to this distributor
      const userOrgId = user?.primary_org?.id
      const dealerOrgs = allOrgs.filter(org => 
        org.type === 'dealer' && org.parent_org_id === userOrgId
      )
      const clientOrgs = allOrgs.filter(org => 
        org.type === 'client' && (
          org.parent_org_id === userOrgId || // Direct clients
          dealerOrgs.some(dealer => dealer.id === org.parent_org_id) // Clients under dealers
        )
      )

      setDealers(dealerOrgs)
      setClients(clientOrgs)

      // Calculate stats
      const totalStorage = [...dealerOrgs, ...clientOrgs]
        .reduce((sum, org) => sum + (org.max_storage_gb || 0), 0)
      
      const totalUsers = [...dealerOrgs, ...clientOrgs]
        .reduce((sum, org) => sum + (org.max_users || 0), 0)

      setStats({
        totalDealers: dealerOrgs.length,
        totalClients: clientOrgs.length,
        totalUsers,
        totalStorage
      })

    } catch (error: any) {
      toast({
        title: 'Error',
        description: 'Failed to load network data',
        status: 'error',
        duration: 5000,
        isClosable: true,
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchNetworkData()
  }, [])

  const getClientsForDealer = (dealerId: string): Organization[] => {
    return clients.filter(client => client.parent_org_id === dealerId)
  }

  const getDirectClients = (): Organization[] => {
    const userOrgId = user?.primary_org?.id
    return clients.filter(client => client.parent_org_id === userOrgId)
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
              <Icon as={MdAccountTree} boxSize={6} color="blue.500" />
              <VStack align="start" spacing={0}>
                <Text fontSize="2xl" fontWeight="bold" color="gray.900">
                  Network Overview
                </Text>
                <Text fontSize="md" color="gray.600">
                  Manage your dealer and client network
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
                  leftIcon={<Icon as={MdStorefront} />}
                  colorScheme="blue"
                  onClick={() => navigate('/distributor/add-dealer')}
                >
                  Add New Dealer
                </Button>
                <Button
                  leftIcon={<Icon as={MdBusiness} />}
                  colorScheme="green"
                  variant="outline"
                  onClick={() => navigate('/distributor/add-client')}
                >
                  Add New Client
                </Button>
                <Button
                  leftIcon={<Icon as={MdTrendingUp} />}
                  variant="outline"
                  onClick={() => navigate('/distributor/statistics')}
                >
                  View Statistics
                </Button>
              </HStack>
            </CardBody>
          </Card>

          {/* Network Statistics */}
          <SimpleGrid columns={{ base: 2, md: 4 }} spacing={6}>
            <Card>
              <CardBody>
                <Stat>
                  <StatLabel>Dealers</StatLabel>
                  <StatNumber color="blue.500">{stats.totalDealers}</StatNumber>
                  <StatHelpText>Organizations</StatHelpText>
                </Stat>
              </CardBody>
            </Card>
            <Card>
              <CardBody>
                <Stat>
                  <StatLabel>Clients</StatLabel>
                  <StatNumber color="green.500">{stats.totalClients}</StatNumber>
                  <StatHelpText>Organizations</StatHelpText>
                </Stat>
              </CardBody>
            </Card>
            <Card>
              <CardBody>
                <Stat>
                  <StatLabel>Total Users</StatLabel>
                  <StatNumber color="purple.500">{stats.totalUsers || 'Unlimited'}</StatNumber>
                  <StatHelpText>Across network</StatHelpText>
                </Stat>
              </CardBody>
            </Card>
            <Card>
              <CardBody>
                <Stat>
                  <StatLabel>Storage Limit</StatLabel>
                  <StatNumber color="orange.500">
                    {stats.totalStorage ? `${stats.totalStorage}GB` : 'Unlimited'}
                  </StatNumber>
                  <StatHelpText>Total allocated</StatHelpText>
                </Stat>
              </CardBody>
            </Card>
          </SimpleGrid>

          {/* Network Structure */}
          <VStack align="stretch" spacing={6}>
            <Text fontSize="xl" fontWeight="semibold" color="gray.900">
              Network Structure
            </Text>

            {/* Direct Clients */}
            {getDirectClients().length > 0 && (
              <Card>
                <CardBody>
                  <VStack align="stretch" spacing={4}>
                    <HStack>
                      <Icon as={MdBusiness} color="green.500" />
                      <Text fontSize="lg" fontWeight="semibold">
                        Direct Clients ({getDirectClients().length})
                      </Text>
                    </HStack>
                    <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
                      {getDirectClients().map(client => (
                        <Card key={client.id} variant="outline" size="sm">
                          <CardBody>
                            <HStack justify="space-between">
                              <VStack align="start" spacing={1}>
                                <Text fontWeight="medium">{client.name}</Text>
                                <HStack spacing={4}>
                                  <Text fontSize="sm" color="gray.600">
                                    Users: {client.max_users || 'Unlimited'}
                                  </Text>
                                  <Text fontSize="sm" color="gray.600">
                                    Storage: {client.max_storage_gb ? `${client.max_storage_gb}GB` : 'Unlimited'}
                                  </Text>
                                </HStack>
                              </VStack>
                              <Badge colorScheme={client.is_active ? 'green' : 'gray'}>
                                {client.is_active ? 'Active' : 'Inactive'}
                              </Badge>
                            </HStack>
                          </CardBody>
                        </Card>
                      ))}
                    </SimpleGrid>
                  </VStack>
                </CardBody>
              </Card>
            )}

            {/* Dealers and their Clients */}
            {dealers.length > 0 ? (
              <Accordion allowMultiple defaultIndex={[0]}>
                {dealers.map(dealer => {
                  const dealerClients = getClientsForDealer(dealer.id)
                  return (
                    <AccordionItem key={dealer.id}>
                      <AccordionButton>
                        <Box flex="1" textAlign="left">
                          <HStack>
                            <Icon as={MdStorefront} color="blue.500" />
                            <Text fontWeight="semibold">{dealer.name}</Text>
                            <Badge colorScheme="blue" variant="subtle">
                              Dealer
                            </Badge>
                            <Text fontSize="sm" color="gray.600">
                              ({dealerClients.length} clients)
                            </Text>
                          </HStack>
                        </Box>
                        <AccordionIcon />
                      </AccordionButton>
                      <AccordionPanel pb={4}>
                        <VStack align="stretch" spacing={4}>
                          <HStack justify="space-between" p={4} bg="gray.50" borderRadius="md">
                            <VStack align="start" spacing={1}>
                              <Text fontSize="sm" color="gray.600">Limits:</Text>
                              <HStack spacing={4}>
                                <Text fontSize="sm">
                                  Users: {dealer.max_users || 'Unlimited'}
                                </Text>
                                <Text fontSize="sm">
                                  Storage: {dealer.max_storage_gb ? `${dealer.max_storage_gb}GB` : 'Unlimited'}
                                </Text>
                              </HStack>
                            </VStack>
                            <Badge colorScheme={dealer.is_active ? 'green' : 'gray'}>
                              {dealer.is_active ? 'Active' : 'Inactive'}
                            </Badge>
                          </HStack>

                          {dealerClients.length > 0 ? (
                            <VStack align="stretch" spacing={2}>
                              <Text fontSize="md" fontWeight="medium">
                                Clients ({dealerClients.length})
                              </Text>
                              <SimpleGrid columns={{ base: 1, md: 2 }} spacing={3}>
                                {dealerClients.map(client => (
                                  <Card key={client.id} variant="outline" size="sm">
                                    <CardBody>
                                      <HStack justify="space-between">
                                        <VStack align="start" spacing={1}>
                                          <Text fontWeight="medium">{client.name}</Text>
                                          <HStack spacing={3}>
                                            <Text fontSize="xs" color="gray.600">
                                              Users: {client.max_users || 'Unlimited'}
                                            </Text>
                                            <Text fontSize="xs" color="gray.600">
                                              Storage: {client.max_storage_gb ? `${client.max_storage_gb}GB` : 'Unlimited'}
                                            </Text>
                                          </HStack>
                                        </VStack>
                                        <Badge size="sm" colorScheme={client.is_active ? 'green' : 'gray'}>
                                          {client.is_active ? 'Active' : 'Inactive'}
                                        </Badge>
                                      </HStack>
                                    </CardBody>
                                  </Card>
                                ))}
                              </SimpleGrid>
                            </VStack>
                          ) : (
                            <Alert status="info">
                              <AlertIcon />
                              <Text fontSize="sm">This dealer has no clients yet.</Text>
                            </Alert>
                          )}
                        </VStack>
                      </AccordionPanel>
                    </AccordionItem>
                  )
                })}
              </Accordion>
            ) : (
              <Card>
                <CardBody>
                  <Alert status="info">
                    <AlertIcon />
                    <VStack align="start" spacing={2}>
                      <Text>No dealers in your network yet.</Text>
                      <Button
                        size="sm"
                        leftIcon={<Icon as={MdAdd} />}
                        colorScheme="blue"
                        onClick={() => navigate('/distributor/add-dealer')}
                      >
                        Create Your First Dealer
                      </Button>
                    </VStack>
                  </Alert>
                </CardBody>
              </Card>
            )}
          </VStack>
        </VStack>
      </Box>
    </Layout>
  )
}

export default DistributorNetworkView