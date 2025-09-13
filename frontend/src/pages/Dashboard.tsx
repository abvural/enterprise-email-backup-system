import {
  Box,
  Grid,
  GridItem,
  Text,
  Card,
  CardBody,
  HStack,
  VStack,
  Icon,
  Button,
  Badge,
  Progress,
  SimpleGrid,
  Flex,
  Spinner,
  useToast,
} from '@chakra-ui/react'
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  FiMail,
  FiUsers,
  FiSettings,
  FiPlus,
  FiRefreshCw,
  FiActivity,
  FiDatabase,
  FiCloud,
  FiArrowRight,
  FiInbox,
  FiFolder,
  FiHardDrive,
  FiPieChart,
  FiArchive,
} from 'react-icons/fi'
import { MdEmail, MdAccountBox, MdBusiness, MdWork } from 'react-icons/md'
import { useEmailStore } from '../stores/emailStore'
import { useAuthStore } from '../stores/authStore'
import { Layout } from '../components/layout/Layout'
import { storageAPI, type TotalStorageStats, formatBytes } from '../services/api'

interface ActionCardProps {
  title: string
  subtitle?: string
  icon: React.ElementType
  onClick: () => void
  badge?: string
}

// Minimal Linear/Notion style action card
const ActionCard = ({ 
  title, 
  subtitle, 
  icon, 
  onClick, 
  badge 
}: ActionCardProps) => {
  return (
    <Card
      bg="white"
      cursor="pointer"
      onClick={onClick}
      transition="all 0.15s"
      _hover={{
        bg: 'gray.50',
      }}
      border="1px solid"
      borderColor="gray.200"
      borderRadius="8px"
      overflow="hidden"
    >
      <CardBody p={5}>
        <VStack align="start" spacing={3}>
          <HStack justify="space-between" w="full">
            <Box
              p={2}
              borderRadius="6px"
              bg="gray.100"
            >
              <Icon as={icon} color="gray.600" boxSize={5} />
            </Box>
            {badge && (
              <Badge 
                variant="subtle"
                colorScheme="gray"
                fontSize="xs"
                px={2}
                py={1}
              >
                {badge}
              </Badge>
            )}
          </HStack>
          
          <VStack align="start" spacing={1}>
            <Text 
              color="gray.900" 
              fontSize="md" 
              fontWeight="medium"
              lineHeight="tight"
            >
              {title}
            </Text>
            {subtitle && (
              <Text 
                color="gray.500" 
                fontSize="sm"
                lineHeight="normal"
              >
                {subtitle}
              </Text>
            )}
          </VStack>
        </VStack>
      </CardBody>
    </Card>
  )
}

interface StatCardProps {
  title: string
  value: string | number
  icon: React.ElementType
  trend?: number
}

// Minimal Linear/Notion style stat card
const StatCard = ({ title, value, icon, trend }: StatCardProps) => {
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
              borderRadius="6px"
              bg="gray.100"
            >
              <Icon as={icon} color="gray.600" boxSize={5} />
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

interface AccountCardProps {
  account: any
  onSync: (accountId: string) => void
  syncStatus: 'idle' | 'syncing' | 'success' | 'error'
}

// Minimal Linear/Notion style account card
const AccountCard = ({ account, onSync, syncStatus }: AccountCardProps) => {
  const navigate = useNavigate()

  const getProviderIcon = (provider: string) => {
    switch (provider) {
      case 'gmail':
        return MdEmail
      case 'exchange':
        return MdAccountBox
      case 'office365':
        return MdBusiness
      case 'yahoo':
        return MdWork
      case 'outlook':
        return MdWork
      case 'custom_imap':
        return FiMail
      default:
        return MdEmail
    }
  }

  return (
    <Card bg="white" border="1px solid" borderColor="gray.200" borderRadius="8px">
      <CardBody p={4}>
        <VStack align="stretch" spacing={3}>
          <HStack justify="space-between">
            <HStack spacing={3}>
              <Box
                p={2}
                borderRadius="6px"
                bg="gray.100"
              >
                <Icon
                  as={getProviderIcon(account.provider)}
                  color="gray.600"
                  boxSize={5}
                />
              </Box>
              <VStack align="start" spacing={0}>
                <Text fontWeight="medium" fontSize="sm" color="gray.900">
                  {account.email}
                </Text>
                <Text fontSize="xs" color="gray.500">
                  {account.provider.toUpperCase()}
                </Text>
              </VStack>
            </HStack>
            <Badge
              variant="subtle"
              colorScheme={account.is_active ? 'green' : 'gray'}
              fontSize="xs"
            >
              {account.is_active ? 'Active' : 'Inactive'}
            </Badge>
          </HStack>

          <HStack justify="flex-end" spacing={2}>
            <Button
              size="sm"
              leftIcon={<FiRefreshCw size={14} />}
              onClick={() => onSync(account.id)}
              isLoading={syncStatus === 'syncing'}
              loadingText="Syncing..."
              variant="ghost"
            >
              Sync
            </Button>
            <Button
              size="sm"
              onClick={() => navigate(`/emails?account=${account.id}`)}
              variant="outline"
            >
              View
            </Button>
          </HStack>
        </VStack>
      </CardBody>
    </Card>
  )
}

export const Dashboard = () => {
  const navigate = useNavigate()
  const toast = useToast()
  const { user } = useAuthStore()
  const { accounts, loadAccounts, syncAccount, syncStatus, isAccountsLoading } = useEmailStore()
  const [storageStats, setStorageStats] = useState<TotalStorageStats | null>(null)
  const [isStorageLoading, setIsStorageLoading] = useState(true)

  useEffect(() => {
    loadAccounts()
  }, [loadAccounts])

  // Load storage stats when accounts change
  useEffect(() => {
    if (accounts.length >= 0) { // Check if accounts have been loaded
      loadStorageStats()
    }
  }, [accounts.length])

  const loadStorageStats = async () => {
    try {
      setIsStorageLoading(true)
      const response = await storageAPI.getTotalStats()
      setStorageStats(response.data.data)
    } catch (error) {
      console.error('Failed to load storage stats:', error)
      // If API endpoints are not available (404), provide mock data based on accounts
      if (error.response?.status === 404) {
        // Create mock storage stats based on existing account data
        const mockStats: TotalStorageStats = {
          total_emails: accounts.length * 150, // Assume 150 emails per account average
          total_size: accounts.length * 524288000, // Assume ~500MB per account
          content_size: accounts.length * 419430400, // ~400MB content
          attachment_size: accounts.length * 104857600, // ~100MB attachments
          attachment_count: accounts.length * 25, // ~25 attachments per account
          total_accounts: accounts.length,
          last_calculated: 'mock-data-' + new Date().toISOString(), // Mark as mock data
          formatted: {
            total_size: formatBytes(accounts.length * 524288000),
            content_size: formatBytes(accounts.length * 419430400),
            attachment_size: formatBytes(accounts.length * 104857600)
          }
        }
        setStorageStats(mockStats)
      }
      // Don't show error toast for storage stats - it's not critical
    } finally {
      setIsStorageLoading(false)
    }
  }

  const handleRecalculateStats = async () => {
    try {
      await storageAPI.recalculateAllStats()
      await loadStorageStats()
      toast({
        title: 'Storage Statistics Recalculated',
        description: 'All storage statistics have been updated successfully.',
        status: 'success',
        duration: 3000,
        isClosable: true,
      })
    } catch (error) {
      console.error('Recalculate stats error:', error)
      if (error.response?.status === 404) {
        // API endpoint not available - simulate recalculation by reloading mock data
        await loadStorageStats()
        toast({
          title: 'Statistics Refreshed',
          description: 'Storage statistics have been refreshed. (Storage API not available - showing estimated data)',
          status: 'info',
          duration: 4000,
          isClosable: true,
        })
      } else {
        toast({
          title: 'Recalculation Failed',
          description: 'Failed to recalculate storage statistics.',
          status: 'error',
          duration: 3000,
          isClosable: true,
        })
      }
    }
  }

  const handleSync = async (accountId: string) => {
    await syncAccount(accountId)
    // Refresh storage stats after sync
    await loadStorageStats()
  }

  // Calculate statistics
  const totalAccounts = accounts.length
  const activeAccounts = accounts.filter(acc => acc.is_active).length
  const gmailAccounts = accounts.filter(acc => acc.provider === 'gmail').length
  const exchangeAccounts = accounts.filter(acc => acc.provider === 'exchange').length
  const office365Accounts = accounts.filter(acc => acc.provider === 'office365').length
  const otherAccounts = accounts.filter(acc => !['gmail', 'exchange', 'office365'].includes(acc.provider)).length

  // Get user's first name
  const firstName = user?.email?.split('@')[0]?.split('.')[0] || 'User'
  const capitalizedFirstName = firstName.charAt(0).toUpperCase() + firstName.slice(1)

  return (
    <Layout>
      <Box p={8} bg="white" minH="100vh">
        <VStack align="stretch" spacing={8} maxW="1200px" mx="auto">
          {/* Minimal Header */}
          <Flex justify="space-between" align="center">
            <VStack align="start" spacing={1}>
              <Text fontSize="xl" fontWeight="semibold" color="gray.900">
                Good {new Date().getHours() < 12 ? 'morning' : new Date().getHours() < 17 ? 'afternoon' : 'evening'}, {capitalizedFirstName}
              </Text>
              <Text fontSize="sm" color="gray.500">
                Manage your email accounts and backup activity
              </Text>
            </VStack>
            
            <Button
              leftIcon={<FiPlus size={16} />}
              variant="solid"
              size="md"
              onClick={() => navigate('/accounts')}
            >
              Add Account
            </Button>
          </Flex>

          {/* Quick Actions */}
          <VStack align="stretch" spacing={4}>
            <Text fontSize="md" fontWeight="medium" color="gray.900">
              Quick Actions
            </Text>
            
            <SimpleGrid columns={{ base: 2, md: 4 }} spacing={4}>
              <ActionCard
                title="Add Account"
                subtitle="Connect any email provider"
                icon={FiPlus}
                onClick={() => navigate('/accounts')}
              />
              
              <ActionCard
                title="View Emails"
                subtitle="Browse your backups"
                icon={FiInbox}
                onClick={() => navigate('/emails')}
                badge={totalAccounts > 0 ? 'Ready' : undefined}
              />
              
              <ActionCard
                title="Sync All"
                subtitle="Update all accounts"
                icon={FiRefreshCw}
                onClick={() => {
                  accounts.forEach(acc => syncAccount(acc.id))
                }}
              />
              
              <ActionCard
                title="Settings"
                subtitle="Configure backup"
                icon={FiSettings}
                onClick={() => navigate('/settings')}
              />
            </SimpleGrid>
          </VStack>

          {/* Statistics */}
          <VStack align="stretch" spacing={4}>
            <Text fontSize="md" fontWeight="medium" color="gray.900">
              Overview
            </Text>
            
            <SimpleGrid columns={{ base: 2, md: 4 }} spacing={4}>
              <StatCard
                title="Total Accounts"
                value={totalAccounts}
                icon={FiUsers}
              />
              <StatCard
                title="Active Accounts"
                value={activeAccounts}
                icon={FiActivity}
                trend={activeAccounts > 0 ? 12 : undefined}
              />
              <StatCard
                title="Gmail Accounts"
                value={gmailAccounts}
                icon={MdEmail}
              />
              <StatCard
                title="Office 365"
                value={office365Accounts}
                icon={MdBusiness}
              />
            </SimpleGrid>
          </VStack>

          {/* Storage Statistics */}
          <VStack align="stretch" spacing={4}>
            <HStack justify="space-between" align="center">
              <VStack align="start" spacing={0}>
                <Text fontSize="md" fontWeight="medium" color="gray.900">
                  Storage Statistics
                </Text>
                {storageStats && storageStats.last_calculated?.includes('mock-data') && (
                  <Text fontSize="xs" color="orange.500">
                    Estimated data - Storage API not available
                  </Text>
                )}
              </VStack>
              <Button
                variant="ghost"
                size="sm"
                leftIcon={<FiRefreshCw size={14} />}
                onClick={handleRecalculateStats}
                isLoading={isStorageLoading}
              >
                {storageStats && storageStats.last_calculated?.includes('mock-data') ? 'Refresh' : 'Recalculate'}
              </Button>
            </HStack>
            
            {isStorageLoading ? (
              <Box py={8} textAlign="center">
                <Progress size="xs" isIndeterminate colorScheme="gray" mb={4} />
                <Text color="gray.500" fontSize="sm">
                  Loading storage statistics...
                </Text>
              </Box>
            ) : storageStats ? (
              <SimpleGrid columns={{ base: 2, md: 4 }} spacing={4}>
                <StatCard
                  title="Total Storage"
                  value={storageStats.formatted.total_size}
                  icon={FiHardDrive}
                />
                <StatCard
                  title="Total Emails"
                  value={storageStats.total_emails.toLocaleString()}
                  icon={FiMail}
                />
                <StatCard
                  title="Content Size"
                  value={storageStats.formatted.content_size}
                  icon={FiArchive}
                />
                <StatCard
                  title="Attachments"
                  value={`${storageStats.attachment_count.toLocaleString()} (${storageStats.formatted.attachment_size})`}
                  icon={FiPieChart}
                />
              </SimpleGrid>
            ) : (
              <Box py={8} textAlign="center">
                <Icon as={FiHardDrive} boxSize={10} color="gray.300" mb={4} />
                <VStack spacing={2}>
                  <Text fontSize="md" fontWeight="medium" color="gray.900">
                    No storage data available
                  </Text>
                  <Text fontSize="sm" color="gray.500">
                    Add and sync email accounts to see storage statistics.
                  </Text>
                </VStack>
              </Box>
            )}
          </VStack>

          {/* Accounts Section */}
          <Card bg="white" border="1px solid" borderColor="gray.200" borderRadius="8px">
            <CardBody p={6}>
              <VStack align="stretch" spacing={4}>
                <HStack justify="space-between" align="center">
                  <Text fontSize="md" fontWeight="medium" color="gray.900">
                    Email Accounts
                  </Text>
                  <Button
                    variant="ghost"
                    size="sm"
                    rightIcon={<FiArrowRight size={14} />}
                    onClick={() => navigate('/accounts')}
                  >
                    View all
                  </Button>
                </HStack>

                {isAccountsLoading ? (
                  <Box py={8} textAlign="center">
                    <Progress size="xs" isIndeterminate colorScheme="gray" mb={4} />
                    <Text color="gray.500" fontSize="sm">
                      Loading accounts...
                    </Text>
                  </Box>
                ) : accounts.length === 0 ? (
                  <VStack spacing={4} py={8} textAlign="center">
                    <Icon as={FiMail} size={10} color="gray.300" />
                    <VStack spacing={2}>
                      <Text fontSize="md" fontWeight="medium" color="gray.900">
                        No accounts connected
                      </Text>
                      <Text fontSize="sm" color="gray.500">
                        Connect your first email account to get started with backups.
                      </Text>
                    </VStack>
                    <Button
                      leftIcon={<FiPlus size={16} />}
                      onClick={() => navigate('/accounts')}
                      variant="solid"
                      size="sm"
                    >
                      Add Account
                    </Button>
                  </VStack>
                ) : (
                  <VStack align="stretch" spacing={3}>
                    {accounts.slice(0, 3).map((account) => (
                      <AccountCard
                        key={account.id}
                        account={account}
                        onSync={handleSync}
                        syncStatus={syncStatus[account.id] || 'idle'}
                      />
                    ))}
                    {accounts.length > 3 && (
                      <HStack justify="center" pt={2}>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => navigate('/accounts')}
                        >
                          View all {accounts.length} accounts
                        </Button>
                      </HStack>
                    )}
                  </VStack>
                )}
              </VStack>
            </CardBody>
          </Card>
        </VStack>
      </Box>
    </Layout>
  )
}