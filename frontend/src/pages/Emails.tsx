import {
  Box,
  Container,
  Heading,
  Text,
  Button,
  VStack,
  HStack,
  Select,
  Input,
  InputGroup,
  InputLeftElement,
  Badge,
  Avatar,
  useColorModeValue,
  Card,
  CardBody,
  IconButton,
  Spinner,
  Alert,
  AlertIcon,
  Divider,
  Checkbox,
  Flex,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  MenuDivider,
  Icon,
} from '@chakra-ui/react'
import { useEffect, useState } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import {
  FiSearch,
  FiRefreshCw,
  FiMail,
  FiChevronDown,
  FiStar,
  FiArchive,
  FiTrash2,
  FiClock,
  FiInbox,
  FiSend,
  FiFile,
  FiAlertCircle,
  FiFolder,
  FiEdit3,
  FiFilter,
  FiPaperclip,
} from 'react-icons/fi'
import { MdEmail, MdAttachFile } from 'react-icons/md'
import { useEmailStore } from '../stores/emailStore'
import { Layout } from '../components/layout/Layout'
import { SyncProgress } from '../components/SyncProgress'
import { getAuthToken } from '../services/api'
import { type EmailIndex } from '../services/api'

interface OutlookEmailItemProps {
  email: EmailIndex
  isSelected: boolean
  onSelect: (email: EmailIndex) => void
}

const OutlookEmailItem = ({ email, isSelected, onSelect }: OutlookEmailItemProps) => {
  const borderColor = useColorModeValue('gray.200', 'gray.700')
  const selectedBg = useColorModeValue('blue.50', 'blue.900')
  const hoverBg = useColorModeValue('gray.50', 'gray.700')
  const textColor = useColorModeValue('gray.900', 'white')
  
  const formatTime = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diff = now.getTime() - date.getTime()
    const days = Math.floor(diff / (1000 * 60 * 60 * 24))

    if (days === 0) {
      return date.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
      })
    } else if (days < 7) {
      return date.toLocaleDateString('en-US', { weekday: 'short' })
    } else {
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
      })
    }
  }

  return (
    <Box
      px={3}
      py={2}
      cursor="pointer"
      borderBottom="1px"
      borderColor={borderColor}
      bg={isSelected ? selectedBg : 'transparent'}
      onClick={() => onSelect(email)}
      _hover={{ bg: isSelected ? selectedBg : hoverBg }}
    >
      <HStack justify="space-between" mb={1}>
        <Text
          fontSize="13px"
          fontWeight="400"
          color={isSelected ? 'blue.600' : textColor}
        >
          {email.sender_name || email.sender_email.split('@')[0]}
        </Text>
        <Text fontSize="11px" color="gray.500">
          {formatTime(email.date)}
        </Text>
      </HStack>
      <Text
        fontSize="13px"
        fontWeight="400"
        noOfLines={1}
        mb={1}
      >
        {email.subject || '(No subject)'}
      </Text>
      <Text fontSize="12px" color="gray.600" noOfLines={2}>
        Email from {email.sender_email} in {email.folder} folder
      </Text>
      {email.minio_path && (
        <HStack mt={1}>
          <Icon as={FiPaperclip} boxSize={3} color="gray.400" />
          <Text fontSize="11px" color="gray.500">Has attachment</Text>
        </HStack>
      )}
    </Box>
  )
}

interface FolderItemProps {
  folder: { id: string; label: string; icon: any; count: number }
  isSelected: boolean
  onSelect: (folderId: string) => void
}

const FolderItem = ({ folder, isSelected, onSelect }: FolderItemProps) => {
  const folderHoverBg = useColorModeValue('gray.50', 'gray.700')
  const folderSelectedBg = useColorModeValue('gray.100', 'gray.600')
  
  return (
    <HStack
      px={3}
      py={2}
      cursor="pointer"
      _hover={{ bg: folderHoverBg }}
      bg={isSelected ? folderSelectedBg : 'transparent'}
      onClick={() => onSelect(folder.id)}
      justify="space-between"
    >
      <HStack spacing={2}>
        <Icon 
          as={folder.icon} 
          boxSize={4} 
          color={isSelected ? 'blue.600' : 'gray.500'}
        />
        <Text 
          fontSize="13px" 
          fontWeight={isSelected ? '500' : '400'}
          color={isSelected ? 'blue.600' : 'inherit'}
        >
          {folder.label}
        </Text>
      </HStack>
      {folder.count > 0 && (
        <Badge size="sm" colorScheme="gray" borderRadius="full" fontSize="11px">
          {folder.count}
        </Badge>
      )}
    </HStack>
  )
}

export const Emails = () => {
  const [searchParams, setSearchParams] = useSearchParams()
  const navigate = useNavigate()
  
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedFolder, setSelectedFolder] = useState('inbox')
  const [selectedEmailForReading, setSelectedEmailForReading] = useState<EmailIndex | null>(null)
  const [showSyncProgress, setShowSyncProgress] = useState(false)
  const [syncingAccountId, setSyncingAccountId] = useState<string | null>(null)

  const {
    accounts,
    emails,
    selectedEmail,
    selectedEmailContent,
    currentAccount,
    isEmailsLoading,
    isEmailContentLoading,
    emailsError,
    emailContentError,
    pagination,
    loadAccounts,
    loadEmails,
    selectEmail,
    setCurrentAccount,
  } = useEmailStore()

  const bgColor = useColorModeValue('white', 'gray.800')
  const borderColor = useColorModeValue('gray.200', 'gray.700')
  const folderHoverBg = useColorModeValue('gray.50', 'gray.700')
  const folderSelectedBg = useColorModeValue('gray.100', 'gray.600')
  
  // Define folder structure similar to Outlook
  const folders = [
    { id: 'inbox', label: 'Inbox', icon: FiInbox, count: 0 },
    { id: 'sent', label: 'Sent Items', icon: FiSend, count: 0 },
    { id: 'drafts', label: 'Drafts', icon: FiFile, count: 0 },
    { id: 'deleted', label: 'Deleted Items', icon: FiTrash2, count: 0 },
    { id: 'archive', label: 'Archive', icon: FiArchive, count: 0 },
    { id: 'junk', label: 'Junk Email', icon: FiAlertCircle, count: 0 },
  ]

  useEffect(() => {
    loadAccounts()
  }, [loadAccounts])

  useEffect(() => {
    const accountId = searchParams.get('account')
    if (accountId && accounts.length > 0) {
      const account = accounts.find(acc => acc.id === accountId)
      if (account) {
        setCurrentAccount(account)
        loadEmails(accountId)
      }
    }
  }, [searchParams, accounts, setCurrentAccount, loadEmails])

  const handleAccountChange = (accountId: string) => {
    if (accountId === 'all') {
      setCurrentAccount(null)
      setSearchParams({})
    } else {
      const account = accounts.find(acc => acc.id === accountId)
      if (account) {
        setCurrentAccount(account)
        setSearchParams({ account: accountId })
        loadEmails(accountId)
      }
    }
  }

  const handlePageChange = (page: number) => {
    if (currentAccount) {
      loadEmails(currentAccount.id, page)
    }
  }

  const handleEmailSelect = (email: EmailIndex) => {
    setSelectedEmailForReading(email)
    selectEmail(email)
  }

  const handleFolderSelect = (folderId: string) => {
    setSelectedFolder(folderId)
    // In a real implementation, this would filter emails by folder
  }

  const handleSyncAccount = async (accountId: string) => {
    if (syncingAccountId) return // Prevent multiple syncs

    try {
      const token = getAuthToken()
      
      // First set the states to show modal immediately
      setSyncingAccountId(accountId)
      setShowSyncProgress(true)
      
      // Give React time to render the modal before making API call
      await new Promise(resolve => setTimeout(resolve, 100))
      
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
        // Reset states on error
        setSyncingAccountId(null)
        setShowSyncProgress(false)
      }
    } catch (error) {
      console.error('❌ Sync request failed:', error)
      // Reset states on error
      setSyncingAccountId(null)
      setShowSyncProgress(false)
    }
  }

  const handleSyncComplete = () => {
    // Reload emails after sync completes
    if (syncingAccountId) {
      loadEmails(syncingAccountId)
    }
  }

  const handleCloseSyncProgress = () => {
    setShowSyncProgress(false)
    setSyncingAccountId(null)
  }

  const filteredEmails = emails.filter(email => {
    const matchesSearch = searchTerm === '' || 
      email.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
      email.sender_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      email.sender_email.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesFolder = selectedFolder === 'inbox' || 
                         (selectedFolder === 'sent' && email.folder.toLowerCase().includes('sent')) ||
                         (selectedFolder === 'drafts' && email.folder.toLowerCase().includes('draft')) ||
                         (selectedFolder === 'deleted' && email.folder.toLowerCase().includes('trash')) ||
                         (selectedFolder === 'archive' && email.folder.toLowerCase().includes('archive')) ||
                         (selectedFolder === 'junk' && email.folder.toLowerCase().includes('junk')) ||
                         email.folder.toLowerCase().includes(selectedFolder.toLowerCase())
    
    return matchesSearch && matchesFolder
  })

  // Update folder counts
  folders.forEach(folder => {
    folder.count = emails.filter(email => {
      if (folder.id === 'inbox') return !email.folder.toLowerCase().includes('sent') && !email.folder.toLowerCase().includes('draft') && !email.folder.toLowerCase().includes('trash')
      return email.folder.toLowerCase().includes(folder.id)
    }).length
  })

  return (
    <Layout>
      <Box bg={bgColor} h="calc(100vh - 60px)">
        <Flex h="full" borderRadius="lg" overflow="hidden" border="1px" borderColor={borderColor}>
          {/* Left Panel - Folder Navigation */}
          <Box w="200px" borderRight="1px" borderColor={borderColor} bg={useColorModeValue('gray.50', 'gray.900')}>
            {/* Account Selector */}
            <Box px={3} py={3} borderBottom="1px" borderColor={borderColor}>
              <Menu>
                <MenuButton
                  as={Button}
                  size="sm"
                  width="full"
                  textAlign="left"
                  rightIcon={<FiChevronDown />}
                  variant="ghost"
                  fontWeight="500"
                  fontSize="13px"
                >
                  {currentAccount?.email || 'Select Account'}
                </MenuButton>
                <MenuList fontSize="13px" data-testid="account-list">
                  {accounts.map(account => (
                    <MenuItem 
                      key={account.id} 
                      icon={<FiMail />}
                      onClick={() => handleAccountChange(account.id)}
                    >
                      {account.email}
                    </MenuItem>
                  ))}
                  <MenuDivider />
                  <MenuItem icon={<FiEdit3 />} onClick={() => navigate('/accounts')}>
                    Add account...
                  </MenuItem>
                </MenuList>
              </Menu>
            </Box>
            
            {/* Favorites Section */}
            <Box>
              <Box px={3} py={2}>
                <Text fontSize="11px" fontWeight="600" color="gray.500" letterSpacing="0.05em">
                  FAVORITES
                </Text>
              </Box>
              <VStack spacing={0} align="stretch" pb={2}>
                <HStack
                  px={3}
                  py={1.5}
                  cursor="pointer"
                  _hover={{ bg: folderHoverBg }}
                >
                  <Icon as={FiStar} boxSize={3.5} color="yellow.500" />
                  <Text fontSize="13px">Important</Text>
                </HStack>
                <HStack
                  px={3}
                  py={1.5}
                  cursor="pointer"
                  _hover={{ bg: folderHoverBg }}
                >
                  <Icon as={FiClock} boxSize={3.5} color="blue.500" />
                  <Text fontSize="13px">Scheduled</Text>
                </HStack>
              </VStack>
            </Box>
            
            <Divider borderColor={borderColor} />
            
            {/* Folders Section */}
            <Box px={3} py={2}>
              <Text fontSize="11px" fontWeight="600" color="gray.500" letterSpacing="0.05em">
                FOLDERS
              </Text>
            </Box>
            <VStack spacing={0} align="stretch">
              {folders.map((folder) => (
                <FolderItem
                  key={folder.id}
                  folder={folder}
                  isSelected={selectedFolder === folder.id}
                  onSelect={handleFolderSelect}
                />
              ))}
            </VStack>
          </Box>

          {/* Middle Panel - Email List */}
          <Box w="35%" borderRight="1px" borderColor={borderColor}>
            {/* Outlook Toolbar */}
            <HStack px={3} py={2} borderBottom="1px" borderColor={borderColor} bg="gray.50">
              <Button size="sm" colorScheme="blue" leftIcon={<FiMail />}>
                New
              </Button>
              <IconButton aria-label="Delete" icon={<FiTrash2 />} size="sm" variant="ghost" />
              <IconButton aria-label="Archive" icon={<FiArchive />} size="sm" variant="ghost" />
              <Divider orientation="vertical" h="20px" />
              <IconButton aria-label="Reply" icon={<FiSend />} size="sm" variant="ghost" />
              <IconButton aria-label="Filter" icon={<FiFilter />} size="sm" variant="ghost" />
              <Flex flex={1} />
              {currentAccount && (
                <>
                  <IconButton
                    aria-label="Sync Emails"
                    icon={<FiRefreshCw />}
                    size="sm"
                    variant="ghost"
                    onClick={() => handleSyncAccount(currentAccount.id)}
                    isLoading={syncingAccountId === currentAccount.id}
                    title="Sync emails with real-time progress"
                  />
                </>
              )}
            </HStack>

            {/* Search Bar */}
            <Box px={3} py={2} borderBottom="1px" borderColor={borderColor}>
              <InputGroup size="sm">
                <InputLeftElement pointerEvents="none">
                  <FiSearch size={14} color="gray" />
                </InputLeftElement>
                <Input
                  placeholder="Search emails..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  bg="white"
                  border="1px"
                  borderColor="gray.200"
                />
              </InputGroup>
            </Box>

            {/* Email List */}
            {!currentAccount ? (
              <Box textAlign="center" py={20} px={6}>
                <VStack spacing={4}>
                  <MdEmail size={48} color="gray" />
                  <VStack spacing={2}>
                    <Text fontSize="md" fontWeight="medium">
                      Select an email account
                    </Text>
                    <Text fontSize="sm" color="gray.600">
                      Choose an email account to view your messages.
                    </Text>
                  </VStack>
                  {accounts.length === 0 && (
                    <Button
                      size="sm"
                      onClick={() => navigate('/accounts')}
                      variant="outline"
                    >
                      Add Email Account
                    </Button>
                  )}
                </VStack>
              </Box>
            ) : emailsError ? (
              <Alert status="error" variant="subtle" mx={3} my={4}>
                <AlertIcon />
                <Text fontSize="sm">{emailsError}</Text>
              </Alert>
            ) : isEmailsLoading ? (
              <Box textAlign="center" py={20}>
                <VStack spacing={4}>
                  <Spinner size="lg" color="gray.400" thickness="2px" />
                  <Text fontSize="sm" color="gray.600">Loading emails...</Text>
                </VStack>
              </Box>
            ) : filteredEmails.length === 0 ? (
              <Box textAlign="center" py={20} px={6}>
                <VStack spacing={4}>
                  <FiMail size={48} color="gray" />
                  <VStack spacing={2}>
                    <Text fontSize="md" fontWeight="medium">
                      No emails found
                    </Text>
                    <Text fontSize="sm" color="gray.600">
                      {searchTerm
                        ? 'Try adjusting your search terms.'
                        : 'This folder has no emails yet.'
                      }
                    </Text>
                  </VStack>
                </VStack>
              </Box>
            ) : (
              <VStack spacing={0} align="stretch" overflowY="auto" maxH="calc(100vh - 200px)">
                {filteredEmails.map((email) => (
                  <OutlookEmailItem
                    key={email.id}
                    email={email}
                    isSelected={selectedEmailForReading?.id === email.id}
                    onSelect={handleEmailSelect}
                  />
                ))}
              </VStack>
            )}
          </Box>

          {/* Right Panel - Reading Pane */}
          <Box flex={1} p={4} overflowY="auto" bg={useColorModeValue('white', 'gray.800')}>
            {selectedEmailForReading ? (
              <VStack align="stretch" spacing={4}>
                <Box>
                  <HStack justify="space-between" mb={2}>
                    <Heading size="md">{selectedEmailForReading.subject || '(No subject)'}</Heading>
                    <HStack>
                      <IconButton
                        aria-label="Reply"
                        icon={<FiSend />}
                        size="sm"
                        variant="outline"
                      />
                      <IconButton
                        aria-label="Delete"
                        icon={<FiTrash2 />}
                        size="sm"
                        variant="outline"
                      />
                    </HStack>
                  </HStack>
                  <HStack spacing={3}>
                    <Avatar 
                      size="sm" 
                      name={selectedEmailForReading.sender_name || selectedEmailForReading.sender_email}
                    />
                    <Box>
                      <Text fontSize="14px" fontWeight="500">
                        {selectedEmailForReading.sender_name || selectedEmailForReading.sender_email.split('@')[0]}
                      </Text>
                      <Text fontSize="12px" color="gray.600">
                        {selectedEmailForReading.sender_email}
                      </Text>
                    </Box>
                    <Flex flex={1} />
                    <Text fontSize="12px" color="gray.500">
                      {new Date(selectedEmailForReading.date).toLocaleDateString()} at {new Date(selectedEmailForReading.date).toLocaleTimeString()}
                    </Text>
                  </HStack>
                </Box>
                <Divider />
                
                {/* Email Content */}
                <Box>
                  {isEmailContentLoading ? (
                    <Box textAlign="center" py={8}>
                      <VStack spacing={4}>
                        <Spinner size="lg" color="gray.400" thickness="2px" />
                        <Text fontSize="sm" color="gray.600">Loading email content...</Text>
                      </VStack>
                    </Box>
                  ) : emailContentError ? (
                    <Alert status="error" variant="subtle">
                      <AlertIcon />
                      <Box>
                        <Text fontSize="sm" fontWeight="medium">Failed to load email content</Text>
                        <Text fontSize="sm">{emailContentError}</Text>
                      </Box>
                    </Alert>
                  ) : selectedEmailContent ? (
                    <Box>
                      {/* Email Headers */}
                      <VStack align="stretch" spacing={2} mb={4} p={3} bg={useColorModeValue('gray.50', 'gray.700')} borderRadius="md">
                        <HStack justify="space-between">
                          <Text fontSize="12px" fontWeight="600" color="gray.600">FROM:</Text>
                          <Text fontSize="12px">{selectedEmailContent.from_name || selectedEmailContent.from}</Text>
                        </HStack>
                        <HStack justify="space-between">
                          <Text fontSize="12px" fontWeight="600" color="gray.600">DATE:</Text>
                          <Text fontSize="12px">{new Date(selectedEmailContent.date).toLocaleString()}</Text>
                        </HStack>
                        <HStack justify="space-between">
                          <Text fontSize="12px" fontWeight="600" color="gray.600">FOLDER:</Text>
                          <Text fontSize="12px">{selectedEmailContent.folder}</Text>
                        </HStack>
                      </VStack>
                      
                      {/* Email Body */}
                      <Box 
                        p={4} 
                        border="1px" 
                        borderColor={useColorModeValue('gray.200', 'gray.600')} 
                        borderRadius="md"
                        bg={useColorModeValue('white', 'gray.800')}
                      >
                        <Text fontSize="14px" lineHeight="1.6" whiteSpace="pre-wrap">
                          {selectedEmailContent.body || 'No content available'}
                        </Text>
                      </Box>
                    </Box>
                  ) : (
                    <Box textAlign="center" py={8}>
                      <Text fontSize="14px" color="gray.600">
                        No email content available
                      </Text>
                    </Box>
                  )}
                </Box>
                
                {/* Attachments */}
                {selectedEmailContent?.attachments && selectedEmailContent.attachments.length > 0 && (
                  <Box>
                    <Text fontSize="12px" fontWeight="600" mb={2}>Attachments ({selectedEmailContent.attachments.length})</Text>
                    <VStack spacing={2} align="stretch">
                      {selectedEmailContent.attachments.map((attachment, index) => (
                        <HStack
                          key={index}
                          p={2}
                          border="1px"
                          borderColor="gray.200"
                          borderRadius="md"
                          cursor="pointer"
                          _hover={{ bg: 'gray.50' }}
                        >
                          <Icon as={MdAttachFile} color="gray.500" />
                          <VStack align="start" spacing={0}>
                            <Text fontSize="13px" fontWeight="medium">{attachment.name}</Text>
                            <Text fontSize="11px" color="gray.500">
                              {Math.round(attachment.size / 1024)}KB • {attachment.type}
                            </Text>
                          </VStack>
                        </HStack>
                      ))}
                    </VStack>
                  </Box>
                )}
              </VStack>
            ) : (
              <Box textAlign="center" py={20}>
                <VStack spacing={4}>
                  <FiMail size={48} color="gray" />
                  <VStack spacing={2}>
                    <Text fontSize="md" fontWeight="medium">
                      Select an email to read
                    </Text>
                    <Text fontSize="sm" color="gray.600">
                      Choose an email from the list to view its contents here.
                    </Text>
                  </VStack>
                </VStack>
              </Box>
            )}
          </Box>
        </Flex>
      </Box>

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