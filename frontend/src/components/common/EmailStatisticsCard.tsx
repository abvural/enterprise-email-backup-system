import React from 'react'
import {
  Card,
  CardBody,
  VStack,
  Text,
  SimpleGrid,
  Badge,
  HStack,
  Icon,
  Divider,
  Box,
} from '@chakra-ui/react'
import { FiMail, FiHardDrive, FiUsers, FiActivity } from 'react-icons/fi'

interface EmailStatistics {
  totalEmailAccounts: number
  totalEmails: number
  totalStorageBytes: number
  activeUsers: number
  providerBreakdown: {
    [provider: string]: number
  }
  organizationName?: string
  lastUpdated?: string
}

interface EmailStatisticsCardProps {
  statistics: EmailStatistics
  title?: string
  showDetails?: boolean
}

const formatBytes = (bytes: number): string => {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

export const EmailStatisticsCard: React.FC<EmailStatisticsCardProps> = ({ 
  statistics, 
  title = "Email Usage Statistics",
  showDetails = true 
}) => {
  const {
    totalEmailAccounts,
    totalEmails,
    totalStorageBytes,
    activeUsers,
    providerBreakdown,
    organizationName,
    lastUpdated
  } = statistics

  return (
    <Card>
      <CardBody>
        <VStack spacing={4} align="stretch">
          {/* Header */}
          <Box>
            <Text fontSize="lg" fontWeight="semibold" color="gray.900">
              {title}
            </Text>
            {organizationName && (
              <Text fontSize="sm" color="gray.600" mt={1}>
                {organizationName}
              </Text>
            )}
          </Box>

          {/* Key Metrics */}
          <SimpleGrid columns={{ base: 2, md: 4 }} spacing={4}>
            <Box textAlign="center" p={3} borderRadius="md" bg="blue.50">
              <Icon as={FiMail} boxSize={6} color="blue.500" mb={2} />
              <Text fontSize="2xl" fontWeight="bold" color="blue.600">
                {totalEmailAccounts.toLocaleString()}
              </Text>
              <Text fontSize="sm" color="blue.700">
                Email Accounts
              </Text>
            </Box>

            <Box textAlign="center" p={3} borderRadius="md" bg="green.50">
              <Icon as={FiActivity} boxSize={6} color="green.500" mb={2} />
              <Text fontSize="2xl" fontWeight="bold" color="green.600">
                {totalEmails.toLocaleString()}
              </Text>
              <Text fontSize="sm" color="green.700">
                Total Emails
              </Text>
            </Box>

            <Box textAlign="center" p={3} borderRadius="md" bg="purple.50">
              <Icon as={FiHardDrive} boxSize={6} color="purple.500" mb={2} />
              <Text fontSize="2xl" fontWeight="bold" color="purple.600">
                {formatBytes(totalStorageBytes)}
              </Text>
              <Text fontSize="sm" color="purple.700">
                Storage Used
              </Text>
            </Box>

            <Box textAlign="center" p={3} borderRadius="md" bg="orange.50">
              <Icon as={FiUsers} boxSize={6} color="orange.500" mb={2} />
              <Text fontSize="2xl" fontWeight="bold" color="orange.600">
                {activeUsers.toLocaleString()}
              </Text>
              <Text fontSize="sm" color="orange.700">
                Active Users
              </Text>
            </Box>
          </SimpleGrid>

          {/* Provider Breakdown */}
          {showDetails && Object.keys(providerBreakdown).length > 0 && (
            <>
              <Divider />
              <Box>
                <Text fontSize="md" fontWeight="semibold" mb={3}>
                  Email Provider Distribution
                </Text>
                <HStack spacing={2} flexWrap="wrap">
                  {Object.entries(providerBreakdown).map(([provider, count]) => (
                    <Badge 
                      key={provider}
                      colorScheme={
                        provider === 'gmail' ? 'red' :
                        provider === 'exchange' ? 'blue' :
                        provider === 'office365' ? 'purple' :
                        provider === 'yahoo' ? 'yellow' :
                        provider === 'outlook' ? 'cyan' :
                        'gray'
                      }
                      variant="subtle"
                      fontSize="sm"
                      px={3}
                      py={1}
                    >
                      {provider.toUpperCase()}: {count}
                    </Badge>
                  ))}
                </HStack>
              </Box>
            </>
          )}

          {/* Important Notice */}
          <Box bg="gray.50" p={3} borderRadius="md" borderLeft="4px" borderColor="gray.400">
            <Text fontSize="sm" color="gray.700">
              <strong>Note:</strong> This shows aggregated statistics only. 
              Only end users can manage email accounts and view email content directly.
            </Text>
          </Box>

          {/* Last Updated */}
          {lastUpdated && (
            <Text fontSize="xs" color="gray.500" textAlign="center">
              Last updated: {lastUpdated}
            </Text>
          )}
        </VStack>
      </CardBody>
    </Card>
  )
}