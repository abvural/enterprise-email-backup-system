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
import { FiUsers, FiMail, FiSettings, FiPlus, FiActivity } from 'react-icons/fi'
import { MdPersonAdd } from 'react-icons/md'
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

export const ClientDashboard: React.FC = () => {
  const navigate = useNavigate()
  const { user } = useAuthStore()

  return (
    <Layout>
      <Box p={8} bg="white" minH="100vh">
        <VStack align="stretch" spacing={8} maxW="1200px" mx="auto">
          {/* Header */}
          <VStack align="start" spacing={1}>
            <Text fontSize="2xl" fontWeight="bold" color="gray.900">
              Client Dashboard
            </Text>
            <Text fontSize="md" color="gray.600">
              Manage your organization's email backup and users
            </Text>
            {user?.primary_org && (
              <Badge colorScheme="orange" variant="subtle">
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
              <Card cursor="pointer" onClick={() => navigate('/client/users')} _hover={{ bg: 'gray.50' }}>
                <CardBody textAlign="center" p={6}>
                  <Icon as={FiUsers} boxSize={8} color="purple.500" mb={3} />
                  <Text fontWeight="medium">User Management</Text>
                  <Text fontSize="sm" color="gray.600">View and manage end users</Text>
                </CardBody>
              </Card>

              <Card cursor="pointer" onClick={() => navigate('/client/add-user')} _hover={{ bg: 'gray.50' }}>
                <CardBody textAlign="center" p={6}>
                  <Icon as={MdPersonAdd} boxSize={8} color="green.500" mb={3} />
                  <Text fontWeight="medium">Add New User</Text>
                  <Text fontSize="sm" color="gray.600">Create a new end user account</Text>
                </CardBody>
              </Card>

              <Card cursor="pointer" onClick={() => navigate('/client/reports')} _hover={{ bg: 'gray.50' }}>
                <CardBody textAlign="center" p={6}>
                  <Icon as={FiMail} boxSize={8} color="blue.500" mb={3} />
                  <Text fontWeight="medium">User Email Reports</Text>
                  <Text fontSize="sm" color="gray.600">View organization email statistics</Text>
                </CardBody>
              </Card>

              <Card cursor="pointer" onClick={() => navigate('/settings')} _hover={{ bg: 'gray.50' }}>
                <CardBody textAlign="center" p={6}>
                  <Icon as={FiSettings} boxSize={8} color="orange.500" mb={3} />
                  <Text fontWeight="medium">Settings</Text>
                  <Text fontSize="sm" color="gray.600">Configure organization settings</Text>
                </CardBody>
              </Card>
            </SimpleGrid>
          </VStack>

          {/* Statistics */}
          <VStack align="stretch" spacing={4}>
            <Text fontSize="lg" fontWeight="semibold" color="gray.900">
              Organization Overview
            </Text>
            
            <SimpleGrid columns={{ base: 2, md: 4 }} spacing={4}>
              <StatCard
                title="Organization Users"
                value="--"
                icon={FiUsers}
              />
              <StatCard
                title="Email Accounts"
                value="--"
                icon={FiMail}
              />
              <StatCard
                title="Total Storage"
                value="--"
                icon={FiActivity}
              />
              <StatCard
                title="Active Backups"
                value="--"
                icon={FiSettings}
              />
            </SimpleGrid>
          </VStack>

          {/* Important Notice */}
          <Card borderLeft="4px" borderColor="blue.500" bg="blue.50">
            <CardBody>
              <Text fontSize="lg" fontWeight="semibold" mb={4} color="blue.700">
                Email Account Management
              </Text>
              <Text color="blue.600" mb={2}>
                <strong>Important:</strong> Only end users can add, manage, and access email accounts directly.
              </Text>
              <Text color="blue.600" fontSize="sm">
                As a client administrator, you can create end user accounts who will then manage their own email accounts independently. You can view usage statistics and reports for your organization.
              </Text>
            </CardBody>
          </Card>

          {/* Usage and Limits */}
          <Card>
            <CardBody>
              <Text fontSize="lg" fontWeight="semibold" mb={4}>
                Usage & Limits
              </Text>
              <Text color="gray.500" textAlign="center" py={8}>
                Usage tracking and limits will be displayed here
              </Text>
            </CardBody>
          </Card>
        </VStack>
      </Box>
    </Layout>
  )
}

export default ClientDashboard