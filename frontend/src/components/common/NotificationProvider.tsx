import { type ReactNode } from 'react'
import {
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
  CloseButton,
  VStack,
  Box,
  useColorModeValue,
} from '@chakra-ui/react'
import { AnimatePresence, motion } from 'framer-motion'
import { useUIStore } from '../../stores/emailStore'

interface NotificationProviderProps {
  children: ReactNode
}

const MotionBox = motion(Box)

export const NotificationProvider = ({ children }: NotificationProviderProps) => {
  const { notifications, removeNotification } = useUIStore()
  
  const containerBg = useColorModeValue('white', 'microsoft.gray.800')
  const shadowColor = useColorModeValue('microsoft.gray.200', 'microsoft.gray.700')

  return (
    <>
      {children}
      
      {/* Notification Container */}
      <Box
        position="fixed"
        top={4}
        right={4}
        zIndex={9999}
        pointerEvents="none"
      >
        <VStack spacing={2} align="stretch" maxW="400px">
          <AnimatePresence>
            {notifications.map((notification) => (
              <MotionBox
                key={notification.id}
                initial={{ opacity: 0, x: 300, scale: 0.3 }}
                animate={{ opacity: 1, x: 0, scale: 1 }}
                exit={{ opacity: 0, x: 300, scale: 0.5, transition: { duration: 0.2 } }}
                transition={{ type: "spring", stiffness: 300, damping: 30 }}
                pointerEvents="auto"
              >
                <Alert
                  status={notification.type}
                  borderRadius="md"
                  boxShadow="lg"
                  bg={containerBg}
                  border="1px solid"
                  borderColor={shadowColor}
                  position="relative"
                >
                  <AlertIcon />
                  <Box flex="1">
                    <AlertTitle fontSize="sm" fontWeight="600">
                      {getNotificationTitle(notification.type)}
                    </AlertTitle>
                    <AlertDescription fontSize="sm">
                      {notification.message}
                    </AlertDescription>
                  </Box>
                  <CloseButton
                    position="absolute"
                    right={2}
                    top={2}
                    size="sm"
                    onClick={() => removeNotification(notification.id)}
                  />
                </Alert>
              </MotionBox>
            ))}
          </AnimatePresence>
        </VStack>
      </Box>
    </>
  )
}

const getNotificationTitle = (type: 'success' | 'error' | 'info' | 'warning') => {
  switch (type) {
    case 'success':
      return 'Success'
    case 'error':
      return 'Error'
    case 'warning':
      return 'Warning'
    case 'info':
      return 'Info'
    default:
      return 'Notification'
  }
}

// Custom hook for showing notifications
export const useNotifications = () => {
  const { addNotification } = useUIStore()

  const showSuccess = (message: string, duration?: number) => {
    addNotification({ type: 'success', message, duration })
  }

  const showError = (message: string, duration?: number) => {
    addNotification({ type: 'error', message, duration })
  }

  const showWarning = (message: string, duration?: number) => {
    addNotification({ type: 'warning', message, duration })
  }

  const showInfo = (message: string, duration?: number) => {
    addNotification({ type: 'info', message, duration })
  }

  return {
    showSuccess,
    showError,
    showWarning,
    showInfo,
  }
}