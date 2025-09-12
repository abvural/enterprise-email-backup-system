import {
  Box,
  VStack,
  HStack,
  Text,
  Progress,
  Button,
  Alert,
  AlertIcon,
  useColorModeValue,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  Spinner,
  Badge,
  Divider,
  List,
  ListItem,
  ListIcon,
  Icon,
} from '@chakra-ui/react'
import { useEffect, useState, useRef } from 'react'
import { FiRefreshCw, FiCheck, FiX, FiClock, FiMail, FiAlertCircle } from 'react-icons/fi'
import { getAuthToken } from '../services/api'

interface SyncProgressData {
  account_id: string
  status: 'connecting' | 'authenticating' | 'fetching' | 'processing' | 'completed' | 'failed'
  total_emails: number
  processed_emails: number
  successful_emails: number
  failed_emails: number
  current_email_subject?: string
  current_operation: string
  time_elapsed: number
  estimated_time_remaining?: number
  error_message?: string
  last_updated: string
  is_completed: boolean
  start_time: string
  end_time?: string
}

interface SyncProgressProps {
  accountId: string
  isOpen: boolean
  onClose: () => void
  onComplete?: () => void
}

export const SyncProgress = ({ accountId, isOpen, onClose, onComplete }: SyncProgressProps) => {
  const [progress, setProgress] = useState<SyncProgressData | null>(null)
  const [isConnecting, setIsConnecting] = useState(true)
  const [connectionError, setConnectionError] = useState<string | null>(null)
  const [logs, setLogs] = useState<string[]>([])
  const eventSourceRef = useRef<EventSource | null>(null)
  const maxLogs = 50 // Keep only last 50 log entries


  const bgColor = useColorModeValue('white', 'gray.800')
  const borderColor = useColorModeValue('gray.200', 'gray.600')

  // Format time in seconds to human readable format
  const formatTime = (seconds: number): string => {
    if (seconds < 60) return `${seconds}s`
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = seconds % 60
    return `${minutes}m ${remainingSeconds}s`
  }

  // Get progress percentage
  const getProgressPercentage = (): number => {
    if (!progress || progress.total_emails === 0) return 0
    return Math.round((progress.processed_emails / progress.total_emails) * 100)
  }

  // Get status color
  const getStatusColor = (status: string): string => {
    switch (status) {
      case 'connecting':
      case 'authenticating':
      case 'fetching':
        return 'blue'
      case 'processing':
        return 'yellow'
      case 'completed':
        return 'green'
      case 'failed':
        return 'red'
      default:
        return 'gray'
    }
  }

  // Get status icon
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'connecting':
      case 'authenticating':
      case 'fetching':
      case 'processing':
        return <Spinner size="sm" />
      case 'completed':
        return <Icon as={FiCheck} color="green.500" />
      case 'failed':
        return <Icon as={FiX} color="red.500" />
      default:
        return <Icon as={FiClock} color="gray.500" />
    }
  }

  // Add log entry
  const addLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString()
    const logEntry = `[${timestamp}] ${message}`
    setLogs(prev => {
      const newLogs = [...prev, logEntry]
      return newLogs.slice(-maxLogs) // Keep only last maxLogs entries
    })
  }

  // Start SSE connection
  const startSSEConnection = () => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close()
    }

    const token = getAuthToken()
    if (!token) {
      setConnectionError('Authentication token not found')
      setIsConnecting(false)
      return
    }

    console.log('🔑 SyncProgress - Token length:', token.length)
    console.log('🔗 SyncProgress - Connecting to SSE for account:', accountId)

    // EventSource doesn't support headers, so we'll use token as query param
    const eventSource = new EventSource(
      `http://localhost:8081/api/accounts/${accountId}/sync-stream?token=${encodeURIComponent(token)}`
    )

    eventSourceRef.current = eventSource

    eventSource.onopen = () => {
      setIsConnecting(false)
      setConnectionError(null)
      addLog('Connected to sync progress stream')
    }

    eventSource.onmessage = (event) => {
      try {
        const data: SyncProgressData = JSON.parse(event.data)
        setProgress(data)
        
        // Add log for progress updates
        if (data.current_operation) {
          addLog(data.current_operation)
        }
        
        // Check if completed
        if (data.is_completed) {
          if (data.status === 'completed') {
            addLog(`Sync completed! ${data.successful_emails} emails synced successfully`)
            if (onComplete) {
              onComplete()
            }
          } else if (data.status === 'failed') {
            addLog(`Sync failed: ${data.error_message || 'Unknown error'}`)
          }
          
          // Keep connection open to allow user to see results
          console.log('🎉 Sync completed, keeping modal open for user review')
          setTimeout(() => {
            console.log('🔌 Auto-closing SSE connection after completion delay')
            eventSource.close()
          }, 5000) // Increased delay to 5 seconds
        }
      } catch (error) {
        console.error('Failed to parse SSE data:', error)
        addLog('Error parsing progress data')
      }
    }

    eventSource.onerror = (error) => {
      console.error('SSE connection error:', error)
      
      // Check if it's an authentication error
      if (error.type === 'error') {
        setConnectionError('Authentication failed. Please refresh and try again.')
      } else {
        setConnectionError('Connection to sync progress failed')
      }
      
      setIsConnecting(false)
      eventSource.close()
    }
  }

  // Start connection when modal opens
  useEffect(() => {
    if (isOpen && accountId && accountId.trim() !== '') {
      setProgress(null)
      setLogs([])
      setIsConnecting(true)
      setConnectionError(null)
      startSSEConnection()
    }

    return () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close()
        eventSourceRef.current = null
      }
    }
  }, [isOpen, accountId])

  // Handle modal close
  const handleClose = () => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close()
      eventSourceRef.current = null
    }
    onClose()
  }

  
  return (
    <Modal 
      isOpen={isOpen} 
      onClose={handleClose} 
      size="xl" 
      closeOnOverlayClick={false}
      isCentered
      preserveScrollBarGap
    >
      <ModalOverlay />
      <ModalContent bg={bgColor} maxH="90vh">
        <ModalHeader>
          <HStack>
            <Icon as={FiRefreshCw} />
            <Text>Email Sync Progress</Text>
          </HStack>
        </ModalHeader>
        <ModalCloseButton isDisabled={isConnecting || (progress && !progress.is_completed && progress.status !== 'completed' && progress.status !== 'failed')} />
        
        <ModalBody>
          <VStack spacing={4} align="stretch">
            {/* Connection Status */}
            {isConnecting && (
              <HStack>
                <Spinner size="sm" />
                <Text>Connecting to sync progress stream...</Text>
              </HStack>
            )}

            {connectionError && (
              <Alert status="error" variant="subtle">
                <AlertIcon />
                <Text>{connectionError}</Text>
              </Alert>
            )}

            {/* Progress Information */}
            {progress && (
              <>
                {/* Status and Progress Bar */}
                <Box p={4} border="1px" borderColor={borderColor} borderRadius="md">
                  <VStack spacing={3} align="stretch">
                    <HStack justify="space-between">
                      <HStack>
                        {getStatusIcon(progress.status)}
                        <Badge colorScheme={getStatusColor(progress.status)} size="sm">
                          {progress.status.toUpperCase()}
                        </Badge>
                      </HStack>
                      <HStack spacing={4}>
                        <Text fontSize="sm" color="gray.600">
                          {formatTime(progress.time_elapsed)} elapsed
                        </Text>
                        {progress.estimated_time_remaining && progress.estimated_time_remaining > 0 && (
                          <Text fontSize="sm" color="gray.600">
                            ~{formatTime(progress.estimated_time_remaining)} remaining
                          </Text>
                        )}
                      </HStack>
                    </HStack>

                    <Text fontWeight="medium">{progress.current_operation}</Text>

                    {progress.total_emails > 0 && (
                      <>
                        <Progress 
                          value={getProgressPercentage()} 
                          colorScheme={getStatusColor(progress.status)}
                          size="lg"
                          borderRadius="md"
                        />
                        <HStack justify="space-between" fontSize="sm">
                          <Text>
                            {progress.processed_emails} of {progress.total_emails} emails processed ({getProgressPercentage()}%)
                          </Text>
                          <HStack spacing={4}>
                            <HStack spacing={1}>
                              <Icon as={FiCheck} color="green.500" boxSize={3} />
                              <Text color="green.600">{progress.successful_emails}</Text>
                            </HStack>
                            {progress.failed_emails > 0 && (
                              <HStack spacing={1}>
                                <Icon as={FiX} color="red.500" boxSize={3} />
                                <Text color="red.600">{progress.failed_emails}</Text>
                              </HStack>
                            )}
                          </HStack>
                        </HStack>
                      </>
                    )}

                    {progress.current_email_subject && (
                      <HStack>
                        <Icon as={FiMail} boxSize={4} color="blue.500" />
                        <Text fontSize="sm" color="gray.600" noOfLines={1}>
                          Current: {progress.current_email_subject}
                        </Text>
                      </HStack>
                    )}
                  </VStack>
                </Box>

                {/* Error Message */}
                {progress.error_message && (
                  <Alert status="error" variant="subtle">
                    <AlertIcon />
                    <Box>
                      <Text fontWeight="medium">Sync Error</Text>
                      <Text fontSize="sm">{progress.error_message}</Text>
                    </Box>
                  </Alert>
                )}
              </>
            )}

            {/* Activity Log */}
            <Box>
              <Text fontWeight="medium" mb={2}>Activity Log</Text>
              <Box
                border="1px"
                borderColor={borderColor}
                borderRadius="md"
                p={3}
                maxH="200px"
                overflowY="auto"
                bg={useColorModeValue('gray.50', 'gray.700')}
              >
                {logs.length > 0 ? (
                  <List spacing={1}>
                    {logs.map((log, index) => (
                      <ListItem key={index} fontSize="sm" fontFamily="mono">
                        <Text color="gray.600">{log}</Text>
                      </ListItem>
                    ))}
                  </List>
                ) : (
                  <Text fontSize="sm" color="gray.500" textAlign="center">
                    No activity yet...
                  </Text>
                )}
              </Box>
            </Box>
          </VStack>
        </ModalBody>

        <ModalFooter>
          <Button 
            onClick={handleClose}
            isDisabled={isConnecting}
            variant="ghost"
            mr={3}
          >
            {progress && progress.is_completed ? 'Close' : 'Cancel'}
          </Button>
          {progress && progress.is_completed && progress.status === 'completed' && (
            <Button colorScheme="blue" onClick={handleClose}>
              Done
            </Button>
          )}
          {progress && progress.is_completed && progress.status === 'failed' && (
            <Button colorScheme="red" onClick={handleClose}>
              Close
            </Button>
          )}
        </ModalFooter>
      </ModalContent>
    </Modal>
  )
}