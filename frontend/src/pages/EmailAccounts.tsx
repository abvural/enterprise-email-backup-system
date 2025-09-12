import {
  Box,
  Text,
  Button,
  VStack,
  HStack,
  Icon,
  Badge,
  useDisclosure,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  FormControl,
  FormLabel,
  Input,
  FormErrorMessage,
  Alert,
  AlertIcon,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
  Table,
  Tbody,
  Td,
  Th,
  Thead,
  Tr,
  Center,
  IconButton,
  Tooltip,
  useToast,
} from '@chakra-ui/react'
import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import {
  FiPlus,
  FiRefreshCw,
  FiSettings,
  FiTrash2,
  FiMail,
  FiMoreHorizontal,
} from 'react-icons/fi'
import { MdEmail, MdAccountBox } from 'react-icons/md'
import { useEmailStore } from '../stores/emailStore'
import { Layout } from '../components/layout/Layout'
import { SyncProgress } from '../components/SyncProgress'
import { type EmailAccount, getAuthToken } from '../services/api'

// Validation schemas
const gmailSchema = z.object({
  email: z.string().email('Please enter a valid Gmail address'),
  password: z.string().min(1, 'App password is required'),
})

const exchangeSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  username: z.string().min(1, 'Username is required'),
  password: z.string().min(1, 'Password is required'),
  server_url: z.string().url('Please enter a valid server URL'),
  domain: z.string().optional(),
})

type GmailFormData = z.infer<typeof gmailSchema>
type ExchangeFormData = z.infer<typeof exchangeSchema>

// Minimal Linear/Notion style helper functions
const getProviderIcon = (provider: string) => {
  switch (provider) {
    case 'gmail':
      return MdEmail
    case 'exchange':
      return MdAccountBox
    default:
      return MdEmail
  }
}

export const EmailAccounts = () => {
  const { isOpen, onOpen, onClose } = useDisclosure()
  const [activeTab, setActiveTab] = useState(0)
  const [showSyncProgress, setShowSyncProgress] = useState(false)
  const [syncingAccountId, setSyncingAccountId] = useState<string | null>(null)
  const toast = useToast()
  
  const {
    accounts,
    isAccountsLoading,
    accountsError,
    syncStatus,
    loadAccounts,
    addGmailAccount,
    addExchangeAccount,
    syncAccount,
    clearAccountsError,
  } = useEmailStore()

  // Gmail form
  const gmailForm = useForm<GmailFormData>({
    resolver: zodResolver(gmailSchema),
  })

  // Exchange form
  const exchangeForm = useForm<ExchangeFormData>({
    resolver: zodResolver(exchangeSchema),
    defaultValues: {
      server_url: 'https://exchange01.teknolojikutusu.com/EWS/Exchange.asmx',
      domain: 'bilisimcenter.com',
    },
  })

  useEffect(() => {
    loadAccounts()
  }, [loadAccounts])

  const handleAddGmail = async (data: GmailFormData) => {
    const success = await addGmailAccount(data.email, data.password)
    if (success) {
      toast({
        title: 'Gmail account added',
        description: `Successfully added ${data.email}`,
        status: 'success',
        duration: 3000,
      })
      gmailForm.reset()
      onClose()
    }
  }

  const handleAddExchange = async (data: ExchangeFormData) => {
    const success = await addExchangeAccount(data)
    if (success) {
      toast({
        title: 'Exchange account added',
        description: `Successfully added ${data.email}`,
        status: 'success',
        duration: 3000,
      })
      exchangeForm.reset()
      onClose()
    }
  }

  const handleSync = async (accountId: string) => {
    if (syncingAccountId) return // Prevent multiple syncs

    try {
      const token = getAuthToken()
      
      // First set the states to show modal immediately
      setSyncingAccountId(accountId)
      setShowSyncProgress(true)
      
      // Give React time to render the modal before making API call
      await new Promise(resolve => setTimeout(resolve, 100))
      
      if (!token) {
        toast({
          title: 'Authentication Error',
          description: 'Please login again',
          status: 'error',
          duration: 3000,
        })
        setSyncingAccountId(null)
        setShowSyncProgress(false)
        return
      }

      console.log('🔄 Starting sync for account:', accountId)
      console.log('🔑 Token length:', token.length)

      const response = await fetch(`http://localhost:8081/api/accounts/${accountId}/sync`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      })

      if (!response.ok) {
        const error = await response.json()
        console.error('❌ Sync failed:', error)
        toast({
          title: 'Sync Failed',
          description: error.error || 'Failed to start sync',
          status: 'error',
          duration: 3000,
        })
        // Reset states on error
        setSyncingAccountId(null)
        setShowSyncProgress(false)
      }
    } catch (error) {
      console.error('❌ Sync request failed:', error)
      toast({
        title: 'Sync Failed',
        description: 'Failed to connect to server',
        status: 'error',
        duration: 3000,
      })
      // Reset states on error
      setSyncingAccountId(null)
      setShowSyncProgress(false)
    }
  }

  const handleSyncComplete = () => {
    // Reload accounts after sync completes to update sync status
    if (syncingAccountId) {
      loadAccounts()
    }
  }

  const handleCloseSyncProgress = () => {
    setShowSyncProgress(false)
    setSyncingAccountId(null)
  }

  const openAddModal = () => {
    clearAccountsError()
    gmailForm.reset()
    exchangeForm.reset()
    onOpen()
  }

  return (
    <Layout>
      <Box p={8} bg="white" minH="100vh">
        <VStack align="stretch" spacing={6} maxW="1200px" mx="auto">
          {/* Minimal Header */}
          <HStack justify="space-between" align="center">
            <VStack align="start" spacing={1}>
              <Text fontSize="xl" fontWeight="semibold" color="gray.900">
                Email Accounts
              </Text>
              <Text fontSize="sm" color="gray.500">
                Manage your email accounts for backup and synchronization
              </Text>
            </VStack>
            <Button
              leftIcon={<FiPlus size={16} />}
              onClick={openAddModal}
              variant="solid"
              size="md"
            >
              Add Account
            </Button>
          </HStack>

          {/* Error Alert */}
          {accountsError && (
            <Alert status="error" borderRadius="6px" bg="red.50" border="1px solid" borderColor="red.200">
              <AlertIcon color="red.500" />
              <Text fontSize="sm" color="red.600">{accountsError}</Text>
            </Alert>
          )}

          {/* Accounts Table */}
          {isAccountsLoading ? (
            <Center py={20}>
              <VStack spacing={3}>
                <Text color="gray.500" fontSize="sm">Loading accounts...</Text>
              </VStack>
            </Center>
          ) : accounts.length === 0 ? (
            <Center py={20}>
              <VStack spacing={6}>
                <Icon as={FiMail} boxSize={12} color="gray.300" />
                <VStack spacing={2}>
                  <Text fontSize="md" fontWeight="medium" color="gray.900">
                    No email accounts configured
                  </Text>
                  <Text color="gray.500" fontSize="sm" textAlign="center" maxW="md">
                    Add your first email account to start backing up and managing your emails.
                    We support both Gmail and Exchange accounts.
                  </Text>
                </VStack>
                <Button
                  leftIcon={<FiPlus size={16} />}
                  onClick={openAddModal}
                  variant="solid"
                  size="md"
                >
                  Add Your First Account
                </Button>
              </VStack>
            </Center>
          ) : (
            <Box border="1px solid" borderColor="gray.200" borderRadius="8px" overflow="hidden">
              <Table variant="simple">
                <Thead>
                  <Tr bg="gray.50">
                    <Th py={4} px={6} color="gray.500" fontWeight="medium" fontSize="xs" letterSpacing="wide">
                      ACCOUNT
                    </Th>
                    <Th py={4} px={6} color="gray.500" fontWeight="medium" fontSize="xs" letterSpacing="wide">
                      PROVIDER
                    </Th>
                    <Th py={4} px={6} color="gray.500" fontWeight="medium" fontSize="xs" letterSpacing="wide">
                      STATUS
                    </Th>
                    <Th py={4} px={6} color="gray.500" fontWeight="medium" fontSize="xs" letterSpacing="wide">
                      ADDED
                    </Th>
                    <Th py={4} px={6} color="gray.500" fontWeight="medium" fontSize="xs" letterSpacing="wide" textAlign="right">
                      ACTIONS
                    </Th>
                  </Tr>
                </Thead>
                <Tbody>
                  {accounts.map((account, index) => (
                    <Tr 
                      key={account.id} 
                      bg={index % 2 === 0 ? 'white' : 'gray.50'}
                      _hover={{ bg: 'gray.100' }}
                      transition="background-color 0.15s"
                    >
                      <Td py={4} px={6} borderColor="gray.200">
                        <HStack spacing={3}>
                          <Box
                            p={2}
                            borderRadius="6px"
                            bg="gray.100"
                          >
                            <Icon
                              as={getProviderIcon(account.provider)}
                              color="gray.600"
                              boxSize={4}
                            />
                          </Box>
                          <Text fontSize="sm" fontWeight="medium" color="gray.900">
                            {account.email}
                          </Text>
                        </HStack>
                      </Td>
                      <Td py={4} px={6} borderColor="gray.200">
                        <Badge variant="subtle" colorScheme="gray" fontSize="xs">
                          {account.provider.toUpperCase()}
                        </Badge>
                      </Td>
                      <Td py={4} px={6} borderColor="gray.200">
                        <Badge
                          variant="subtle"
                          colorScheme={account.is_active ? 'green' : 'gray'}
                          fontSize="xs"
                        >
                          {account.is_active ? 'Active' : 'Inactive'}
                        </Badge>
                      </Td>
                      <Td py={4} px={6} borderColor="gray.200">
                        <Text fontSize="sm" color="gray.500">
                          {new Date(account.created_at).toLocaleDateString()}
                        </Text>
                      </Td>
                      <Td py={4} px={6} borderColor="gray.200" textAlign="right">
                        <HStack spacing={2} justify="flex-end">
                          <Button
                            size="sm"
                            variant="ghost"
                            leftIcon={<FiRefreshCw size={14} />}
                            onClick={() => handleSync(account.id)}
                            isLoading={syncingAccountId === account.id}
                            fontSize="xs"
                            title="Sync emails with real-time progress"
                          >
                            Sync
                          </Button>
                          <IconButton
                            aria-label="More options"
                            icon={<FiMoreHorizontal size={16} />}
                            size="sm"
                            variant="ghost"
                          />
                        </HStack>
                      </Td>
                    </Tr>
                  ))}
                </Tbody>
              </Table>
            </Box>
          )}
        </VStack>
      </Box>

      {/* Add Account Modal - Linear/Notion Style */}
      <Modal isOpen={isOpen} onClose={onClose} size="md">
        <ModalOverlay bg="blackAlpha.300" />
        <ModalContent borderRadius="8px" border="1px solid" borderColor="gray.200">
          <ModalHeader py={4} px={6} fontSize="md" fontWeight="semibold" color="gray.900">
            Add Email Account
          </ModalHeader>
          <ModalCloseButton />
          <ModalBody px={6} py={0}>
            <Tabs index={activeTab} onChange={setActiveTab} variant="line">
              <TabList borderColor="gray.200" mb={6}>
                <Tab fontSize="sm" color="gray.600" _selected={{ color: 'gray.900', borderColor: 'gray.900' }}>
                  <HStack spacing={2}>
                    <Icon as={MdEmail} color="gray.600" boxSize={4} />
                    <Text>Gmail</Text>
                  </HStack>
                </Tab>
                <Tab fontSize="sm" color="gray.600" _selected={{ color: 'gray.900', borderColor: 'gray.900' }}>
                  <HStack spacing={2}>
                    <Icon as={MdAccountBox} color="gray.600" boxSize={4} />
                    <Text>Exchange</Text>
                  </HStack>
                </Tab>
              </TabList>

              <TabPanels>
                {/* Gmail Panel */}
                <TabPanel px={0} py={0}>
                  <form onSubmit={gmailForm.handleSubmit(handleAddGmail)}>
                    <VStack spacing={5} align="stretch">
                      <Alert status="info" borderRadius="6px" bg="blue.50" border="1px solid" borderColor="blue.200">
                        <AlertIcon color="blue.500" />
                        <Text fontSize="sm" color="blue.700">
                          Use your Gmail address and an app-specific password for secure access.
                        </Text>
                      </Alert>

                      <FormControl isInvalid={!!gmailForm.formState.errors.email}>
                        <FormLabel fontSize="sm" fontWeight="medium" color="gray.900" mb={2}>
                          Gmail Address
                        </FormLabel>
                        <Input
                          {...gmailForm.register('email')}
                          placeholder="your.email@gmail.com"
                          type="email"
                          fontSize="md"
                          bg="gray.50"
                          border="1px solid"
                          borderColor="gray.200"
                          borderRadius="6px"
                          _focus={{
                            borderColor: 'gray.400',
                            boxShadow: 'none',
                            bg: 'white',
                          }}
                        />
                        <FormErrorMessage fontSize="sm" color="red.500">
                          {gmailForm.formState.errors.email?.message}
                        </FormErrorMessage>
                      </FormControl>

                      <FormControl isInvalid={!!gmailForm.formState.errors.password}>
                        <FormLabel fontSize="sm" fontWeight="medium" color="gray.900" mb={2}>
                          App Password
                        </FormLabel>
                        <Input
                          {...gmailForm.register('password')}
                          placeholder="Enter your app-specific password"
                          type="password"
                          fontSize="md"
                          bg="gray.50"
                          border="1px solid"
                          borderColor="gray.200"
                          borderRadius="6px"
                          _focus={{
                            borderColor: 'gray.400',
                            boxShadow: 'none',
                            bg: 'white',
                          }}
                        />
                        <FormErrorMessage fontSize="sm" color="red.500">
                          {gmailForm.formState.errors.password?.message}
                        </FormErrorMessage>
                      </FormControl>
                    </VStack>
                  </form>
                </TabPanel>

                {/* Exchange Panel */}
                <TabPanel px={0} py={0}>
                  <form onSubmit={exchangeForm.handleSubmit(handleAddExchange)}>
                    <VStack spacing={5} align="stretch">
                      <Alert status="info" borderRadius="6px" bg="blue.50" border="1px solid" borderColor="blue.200">
                        <AlertIcon color="blue.500" />
                        <Text fontSize="sm" color="blue.700">
                          Connect to your Exchange server using EWS (Exchange Web Services).
                        </Text>
                      </Alert>

                      <FormControl isInvalid={!!exchangeForm.formState.errors.email}>
                        <FormLabel fontSize="sm" fontWeight="medium" color="gray.900" mb={2}>
                          Email Address
                        </FormLabel>
                        <Input
                          {...exchangeForm.register('email')}
                          placeholder="your.email@company.com"
                          type="email"
                          fontSize="md"
                          bg="gray.50"
                          border="1px solid"
                          borderColor="gray.200"
                          borderRadius="6px"
                          _focus={{
                            borderColor: 'gray.400',
                            boxShadow: 'none',
                            bg: 'white',
                          }}
                        />
                        <FormErrorMessage fontSize="sm" color="red.500">
                          {exchangeForm.formState.errors.email?.message}
                        </FormErrorMessage>
                      </FormControl>

                      <FormControl isInvalid={!!exchangeForm.formState.errors.username}>
                        <FormLabel fontSize="sm" fontWeight="medium" color="gray.900" mb={2}>
                          Username
                        </FormLabel>
                        <Input
                          {...exchangeForm.register('username')}
                          placeholder="Enter your username"
                          fontSize="md"
                          bg="gray.50"
                          border="1px solid"
                          borderColor="gray.200"
                          borderRadius="6px"
                          _focus={{
                            borderColor: 'gray.400',
                            boxShadow: 'none',
                            bg: 'white',
                          }}
                        />
                        <FormErrorMessage fontSize="sm" color="red.500">
                          {exchangeForm.formState.errors.username?.message}
                        </FormErrorMessage>
                      </FormControl>

                      <FormControl isInvalid={!!exchangeForm.formState.errors.password}>
                        <FormLabel fontSize="sm" fontWeight="medium" color="gray.900" mb={2}>
                          Password
                        </FormLabel>
                        <Input
                          {...exchangeForm.register('password')}
                          placeholder="Enter your password"
                          type="password"
                          fontSize="md"
                          bg="gray.50"
                          border="1px solid"
                          borderColor="gray.200"
                          borderRadius="6px"
                          _focus={{
                            borderColor: 'gray.400',
                            boxShadow: 'none',
                            bg: 'white',
                          }}
                        />
                        <FormErrorMessage fontSize="sm" color="red.500">
                          {exchangeForm.formState.errors.password?.message}
                        </FormErrorMessage>
                      </FormControl>

                      <FormControl isInvalid={!!exchangeForm.formState.errors.server_url}>
                        <FormLabel fontSize="sm" fontWeight="medium" color="gray.900" mb={2}>
                          Server URL
                        </FormLabel>
                        <Input
                          {...exchangeForm.register('server_url')}
                          placeholder="https://mail.company.com/EWS/Exchange.asmx"
                          fontSize="md"
                          bg="gray.50"
                          border="1px solid"
                          borderColor="gray.200"
                          borderRadius="6px"
                          _focus={{
                            borderColor: 'gray.400',
                            boxShadow: 'none',
                            bg: 'white',
                          }}
                        />
                        <FormErrorMessage fontSize="sm" color="red.500">
                          {exchangeForm.formState.errors.server_url?.message}
                        </FormErrorMessage>
                      </FormControl>

                      <FormControl isInvalid={!!exchangeForm.formState.errors.domain}>
                        <FormLabel fontSize="sm" fontWeight="medium" color="gray.900" mb={2}>
                          Domain (Optional)
                        </FormLabel>
                        <Input
                          {...exchangeForm.register('domain')}
                          placeholder="company.com"
                          fontSize="md"
                          bg="gray.50"
                          border="1px solid"
                          borderColor="gray.200"
                          borderRadius="6px"
                          _focus={{
                            borderColor: 'gray.400',
                            boxShadow: 'none',
                            bg: 'white',
                          }}
                        />
                        <FormErrorMessage fontSize="sm" color="red.500">
                          {exchangeForm.formState.errors.domain?.message}
                        </FormErrorMessage>
                      </FormControl>
                    </VStack>
                  </form>
                </TabPanel>
              </TabPanels>
            </Tabs>

            {/* Error Display */}
            {accountsError && (
              <Alert status="error" borderRadius="6px" bg="red.50" border="1px solid" borderColor="red.200" mt={4}>
                <AlertIcon color="red.500" />
                <Text fontSize="sm" color="red.600">{accountsError}</Text>
              </Alert>
            )}
          </ModalBody>

          <ModalFooter px={6} py={4} borderTop="1px solid" borderColor="gray.200">
            <Button variant="ghost" mr={3} onClick={onClose} size="md">
              Cancel
            </Button>
            <Button
              variant="solid"
              isLoading={isAccountsLoading}
              onClick={() => {
                if (activeTab === 0) {
                  gmailForm.handleSubmit(handleAddGmail)()
                } else {
                  exchangeForm.handleSubmit(handleAddExchange)()
                }
              }}
              size="md"
            >
              Add Account
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Sync Progress Modal */}
      <SyncProgress
        accountId={syncingAccountId || ''}
        isOpen={showSyncProgress}
        onClose={handleCloseSyncProgress}
        onComplete={handleSyncComplete}
      />
    </Layout>
  )
}