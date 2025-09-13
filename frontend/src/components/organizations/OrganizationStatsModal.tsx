import React, { useState, useEffect } from 'react'
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  Button,
  VStack,
  HStack,
  SimpleGrid,
  Box,
  Text,
  Heading,
  Progress,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  StatArrow,
  Badge,
  Divider,
  Alert,
  AlertIcon,
  AlertDescription,
  Spinner,
  useColorModeValue,
  Icon,
} from '@chakra-ui/react'
import {
  FiUsers,
  FiMail,
  FiHardDrive,
  FiServer,
  FiTrendingUp,
  FiTrendingDown,
  FiMinus,
} from 'react-icons/fi'
import { apiClient, formatBytes } from '../../services/api'

interface OrganizationStats {
  organization_id: string
  user_count: number
  email_account_count: number
  total_emails: number
  total_storage_bytes: number
  total_storage_mb: number
  limits: {
    max_users?: number
    max_storage_gb?: number
    max_email_accounts?: number
  }
}

interface Organization {
  id: string
  name: string
  type: string
  is_active: boolean
}

interface OrganizationStatsModalProps {
  isOpen: boolean
  onClose: () => void
  organization: Organization | null
}

// Utility function to calculate percentage
const calculatePercentage = (current: number, max?: number) => {
  if (!max) return 0
  return Math.min((current / max) * 100, 100)
}

// Utility function to get progress color
const getProgressColor = (percentage: number) => {
  if (percentage >= 90) return 'red'
  if (percentage >= 70) return 'orange'
  if (percentage >= 50) return 'yellow'
  return 'green'
}

// Stat card component
const StatCard: React.FC<{
  title: string
  value: number | string
  icon: React.ElementType
  color: string
  helpText?: string
  progress?: number
  maxValue?: number
  format?: 'number' | 'bytes'
}> = ({ title, value, icon, color, helpText, progress, maxValue, format = 'number' }) => {
  const cardBg = useColorModeValue('white', 'gray.800')
  const borderColor = useColorModeValue('gray.200', 'gray.600')
  
  const formattedValue = format === 'bytes' ? formatBytes(Number(value)) : value.toLocaleString()
  const formattedMax = format === 'bytes' && maxValue ? formatBytes(maxValue * 1024 * 1024 * 1024) : maxValue?.toLocaleString()

  return (
    <Box
      p={6}
      bg={cardBg}
      borderRadius="lg"
      border="1px"
      borderColor={borderColor}
      transition="all 0.2s"
      _hover={{ transform: 'translateY(-2px)', boxShadow: 'md' }}
    >
      <VStack spacing={4} align="stretch">
        <HStack justify="space-between">
          <VStack align="flex-start" spacing={1}>
            <Text fontSize="sm" color="gray.500" fontWeight="medium">
              {title}
            </Text>
            <Text fontSize="2xl" fontWeight="bold" color={`${color}.600`}>
              {formattedValue}
            </Text>
            {maxValue && (
              <Text fontSize="sm" color="gray.400">
                of {formattedMax} max
              </Text>
            )}
          </VStack>
          <Box
            p={3}
            borderRadius="lg"
            bg={`${color}.50`}
          >
            <Icon as={icon} boxSize={6} color={`${color}.500`} />
          </Box>
        </HStack>
        
        {typeof progress === 'number' && (
          <Box>
            <Progress
              value={progress}
              colorScheme={getProgressColor(progress)}
              size="sm"
              borderRadius="full"
            />
            <Text fontSize="xs" color="gray.500" mt={1}>
              {progress.toFixed(1)}% utilized
            </Text>
          </Box>
        )}
        
        {helpText && (
          <Text fontSize="xs" color="gray.500">
            {helpText}
          </Text>
        )}
      </VStack>
    </Box>
  )
}

export const OrganizationStatsModal: React.FC<OrganizationStatsModalProps> = ({
  isOpen,
  onClose,
  organization,
}) => {
  const [stats, setStats] = useState<OrganizationStats | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Load organization stats
  useEffect(() => {
    if (isOpen && organization?.id) {
      loadStats()
    }
  }, [isOpen, organization?.id])

  const loadStats = async () => {
    if (!organization?.id) return

    setIsLoading(true)
    setError(null)
    try {
      const response = await apiClient.get(`/api/organizations/${organization.id}/stats`)
      setStats(response.data)
    } catch (error: any) {
      console.error('Failed to load organization stats:', error)
      setError(error.response?.data?.error || 'Failed to load statistics')
    } finally {
      setIsLoading(false)
    }
  }

  // Calculate progress percentages
  const userProgress = stats ? calculatePercentage(stats.user_count, stats.limits.max_users) : 0
  const storageProgress = stats ? calculatePercentage(
    stats.total_storage_bytes / (1024 * 1024 * 1024), 
    stats.limits.max_storage_gb
  ) : 0
  const accountProgress = stats ? calculatePercentage(
    stats.email_account_count, 
    stats.limits.max_email_accounts
  ) : 0

  if (!organization) {
    return null
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="4xl">
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>
          <VStack align="flex-start" spacing={1}>
            <Heading size="lg">{organization.name}</Heading>
            <HStack>
              <Badge colorScheme="blue" size="sm">
                {organization.type.charAt(0).toUpperCase() + organization.type.slice(1)}
              </Badge>
              <Badge
                colorScheme={organization.is_active ? 'green' : 'red'}
                size="sm"
              >
                {organization.is_active ? 'Active' : 'Inactive'}
              </Badge>
            </HStack>
          </VStack>
        </ModalHeader>
        <ModalCloseButton />
        
        <ModalBody>
          {isLoading ? (
            <VStack spacing={4} py={12}>
              <Spinner size="lg" color="blue.500" />
              <Text color="gray.500">Loading statistics...</Text>
            </VStack>
          ) : error ? (
            <Alert status="error" borderRadius="md">
              <AlertIcon />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          ) : stats ? (
            <VStack spacing={6} align="stretch">
              {/* Key Metrics */}
              <Box>
                <Text fontSize="sm" fontWeight="semibold" color="gray.600" mb={4}>
                  RESOURCE UTILIZATION
                </Text>
                <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={4}>
                  <StatCard
                    title="Users"
                    value={stats.user_count}
                    icon={FiUsers}
                    color="blue"
                    progress={stats.limits.max_users ? userProgress : undefined}
                    maxValue={stats.limits.max_users}
                    helpText={stats.limits.max_users ? `${stats.limits.max_users - stats.user_count} remaining` : 'No limit set'}
                  />
                  
                  <StatCard
                    title="Storage Used"
                    value={stats.total_storage_bytes}
                    icon={FiHardDrive}
                    color="orange"
                    format="bytes"
                    progress={stats.limits.max_storage_gb ? storageProgress : undefined}
                    maxValue={stats.limits.max_storage_gb}
                    helpText={stats.limits.max_storage_gb ? 
                      `${(stats.limits.max_storage_gb - (stats.total_storage_bytes / (1024 * 1024 * 1024))).toFixed(2)} GB remaining` : 
                      'No limit set'
                    }
                  />
                  
                  <StatCard
                    title="Email Accounts"
                    value={stats.email_account_count}
                    icon={FiMail}
                    color="green"
                    progress={stats.limits.max_email_accounts ? accountProgress : undefined}
                    maxValue={stats.limits.max_email_accounts}
                    helpText={stats.limits.max_email_accounts ? 
                      `${stats.limits.max_email_accounts - stats.email_account_count} remaining` : 
                      'No limit set'
                    }
                  />
                </SimpleGrid>
              </Box>

              <Divider />

              {/* Additional Stats */}
              <Box>
                <Text fontSize="sm" fontWeight="semibold" color="gray.600" mb={4}>
                  ACTIVITY OVERVIEW
                </Text>
                <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
                  <StatCard
                    title="Total Emails"
                    value={stats.total_emails}
                    icon={FiServer}
                    color="purple"
                    helpText="Total emails backed up"
                  />
                  
                  <StatCard
                    title="Average Storage per User"
                    value={stats.user_count > 0 ? Math.round(stats.total_storage_bytes / stats.user_count) : 0}
                    icon={FiTrendingUp}
                    color="teal"
                    format="bytes"
                    helpText="Storage usage per user"
                  />
                </SimpleGrid>
              </Box>

              {/* Resource Warnings */}
              {(userProgress > 90 || storageProgress > 90 || accountProgress > 90) && (
                <Box>
                  <Alert status="warning" borderRadius="md">
                    <AlertIcon />
                    <VStack align="flex-start" spacing={1}>
                      <Text fontWeight="medium">Resource Usage Warning</Text>
                      <VStack align="flex-start" spacing={0} fontSize="sm">
                        {userProgress > 90 && (
                          <Text>• User limit is {userProgress.toFixed(1)}% full</Text>
                        )}
                        {storageProgress > 90 && (
                          <Text>• Storage limit is {storageProgress.toFixed(1)}% full</Text>
                        )}
                        {accountProgress > 90 && (
                          <Text>• Email account limit is {accountProgress.toFixed(1)}% full</Text>
                        )}
                      </VStack>
                    </VStack>
                  </Alert>
                </Box>
              )}
            </VStack>
          ) : null}
        </ModalBody>

        <ModalFooter>
          <HStack spacing={3}>
            <Button variant="outline" onClick={loadStats} isLoading={isLoading}>
              Refresh
            </Button>
            <Button colorScheme="blue" onClick={onClose}>
              Close
            </Button>
          </HStack>
        </ModalFooter>
      </ModalContent>
    </Modal>
  )
}

export default OrganizationStatsModal