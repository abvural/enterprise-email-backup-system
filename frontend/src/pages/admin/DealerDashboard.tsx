import React from 'react'
import {
  Box,
  VStack,
  Text,
  SimpleGrid,
  Card,
  CardBody,
  HStack,
  Icon,
  Button,
  Badge,
} from '@chakra-ui/react'
import { FiUsers, FiMail, FiSettings, FiPlus } from 'react-icons/fi'
import { MdBusiness } from 'react-icons/md'
import { useNavigate } from 'react-router-dom'
import { Layout } from '../../components/layout/Layout'
import { useAuthStore } from '../../stores/authStore'

const StatCard = ({ title, value, icon }: { title: string; value: string | number; icon: React.ElementType }) => (
  <Card>
    <CardBody>
      <HStack spacing={4}>
        <Box p={2} borderRadius="md" bg="gray.100">
          <Icon as={icon} boxSize={5} color="gray.600" />
        </Box>
        <VStack align="start" spacing={0}>
          <Text fontSize="2xl" fontWeight="bold">{value}</Text>
          <Text fontSize="sm" color="gray.600">{title}</Text>
        </VStack>
      </HStack>
    </CardBody>
  </Card>
)

export const DealerDashboard: React.FC = () => {
  const navigate = useNavigate()
  const { user } = useAuthStore()

  return (
    <Layout>
      <Box p={8} bg="white" minH="100vh">
        <VStack align="stretch" spacing={8} maxW="1200px" mx="auto">
          {/* Header */}
          <VStack align="start" spacing={1}>
            <Text fontSize="2xl" fontWeight="bold" color="gray.900">
              Dealer Dashboard
            </Text>
            <Text fontSize="md" color="gray.600">
              Manage your client organizations and users
            </Text>
            {user?.primary_org && (
              <Badge colorScheme="blue" variant="subtle">
                {user.primary_org.name}
              </Badge>
            )}
          </VStack>

          {/* Quick Actions */}
          <VStack align="stretch" spacing={4}>
            <Text fontSize="lg" fontWeight="semibold" color="gray.900">
              Quick Actions
            </Text>
            
            <SimpleGrid columns={{ base: 2, md: 4 }} spacing={4}>
              <Card cursor="pointer" onClick={() => navigate('/dealer/clients')} _hover={{ bg: 'gray.50' }}>
                <CardBody textAlign="center" p={6}>
                  <Icon as={MdBusiness} boxSize={8} color="blue.500" mb={3} />
                  <Text fontWeight="medium">View My Clients</Text>
                  <Text fontSize="sm" color="gray.600">See all your client organizations</Text>
                </CardBody>
              </Card>

              <Card cursor="pointer" onClick={() => navigate('/dealer/add-client')} _hover={{ bg: 'gray.50' }}>
                <CardBody textAlign="center" p={6}>
                  <Icon as={FiPlus} boxSize={8} color="green.500" mb={3} />
                  <Text fontWeight="medium">Add New Client</Text>
                  <Text fontSize="sm" color="gray.600">Create a new client organization</Text>
                </CardBody>
              </Card>

              <Card cursor="pointer" onClick={() => navigate('/dealer/reports')} _hover={{ bg: 'gray.50' }}>
                <CardBody textAlign="center" p={6}>
                  <Icon as={FiMail} boxSize={8} color="purple.500" mb={3} />
                  <Text fontWeight="medium">Email Statistics</Text>
                  <Text fontSize="sm" color="gray.600">View client email usage statistics</Text>
                </CardBody>
              </Card>

              <Card cursor="pointer" onClick={() => navigate('/settings')} _hover={{ bg: 'gray.50' }}>
                <CardBody textAlign="center" p={6}>
                  <Icon as={FiSettings} boxSize={8} color="orange.500" mb={3} />
                  <Text fontWeight="medium">Settings</Text>
                  <Text fontSize="sm" color="gray.600">Configure dealer settings</Text>
                </CardBody>
              </Card>
            </SimpleGrid>
          </VStack>

          {/* Statistics */}
          <VStack align="stretch" spacing={4}>
            <Text fontSize="lg" fontWeight="semibold" color="gray.900">
              Client Overview
            </Text>
            
            <SimpleGrid columns={{ base: 2, md: 4 }} spacing={4}>
              <StatCard
                title="Client Organizations"
                value="--"
                icon={MdBusiness}
              />
              <StatCard
                title="Client Users"
                value="--"
                icon={FiUsers}
              />
              <StatCard
                title="Total Storage"
                value="--"
                icon={FiMail}
              />
              <StatCard
                title="Active Accounts"
                value="--"
                icon={FiSettings}
              />
            </SimpleGrid>
          </VStack>

          {/* Recent Activity */}
          <Card>
            <CardBody>
              <Text fontSize="lg" fontWeight="semibold" mb={4}>
                Recent Activity
              </Text>
              <Text color="gray.500" textAlign="center" py={8}>
                Activity feed will be implemented based on requirements
              </Text>
            </CardBody>
          </Card>
        </VStack>
      </Box>
    </Layout>
  )
}

export default DealerDashboard