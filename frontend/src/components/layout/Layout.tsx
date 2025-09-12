import {
  Box,
  Flex,
  VStack,
  HStack,
  Text,
  Icon,
  Avatar,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  MenuDivider,
  useColorModeValue,
  Button,
  Badge,
  Input,
  InputGroup,
  InputLeftElement,
} from '@chakra-ui/react'
import React, { type ReactNode, useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import {
  FiHome,
  FiMail,
  FiSettings,
  FiLogOut,
  FiUser,
  FiSearch,
  FiInbox,
  FiSend,
  FiArchive,
  FiTrash,
} from 'react-icons/fi'
import { useAuthStore } from '../../stores/authStore'

interface LayoutProps {
  children: ReactNode
}

// Linear/Notion Sidebar Component
const LinearSidebar = () => {
  const [activeItem, setActiveItem] = useState('dashboard')
  const navigate = useNavigate()
  const location = useLocation()
  const { user, logout } = useAuthStore()

  // Use consistent color theme
  const bgColor = useColorModeValue('white', 'gray.900')
  const borderColor = useColorModeValue('gray.200', 'gray.700')
  const textColor = useColorModeValue('gray.600', 'gray.400')
  const activeTextColor = useColorModeValue('gray.900', 'white')
  const hoverBg = useColorModeValue('gray.50', 'gray.800')
  const groupTextColor = useColorModeValue('gray.500', 'gray.500')

  // Update active item based on current location
  React.useEffect(() => {
    const path = location.pathname
    if (path === '/dashboard') setActiveItem('dashboard')
    else if (path.includes('/accounts')) setActiveItem('accounts')
    else if (path.includes('/emails')) setActiveItem('emails')
    else if (path.includes('/settings')) setActiveItem('settings')
  }, [location.pathname])

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: FiHome, path: '/dashboard' },
    { id: 'emails', label: 'Emails', icon: FiMail, path: '/emails' },
    { id: 'accounts', label: 'Email Accounts', icon: FiUser, path: '/accounts' },
    { type: 'separator' },
    { type: 'group', label: 'FOLDERS' },
    { id: 'inbox', label: 'Inbox', icon: FiInbox, path: '/emails?folder=INBOX' },
    { id: 'sent', label: 'Sent Items', icon: FiSend, path: '/emails?folder=Sent Items' },
    { id: 'archive', label: 'Archive', icon: FiArchive, path: '/emails?folder=Archive' },
    { id: 'trash', label: 'Deleted Items', icon: FiTrash, path: '/emails?folder=Deleted Items' },
    { type: 'separator' },
    { type: 'group', label: 'MANAGEMENT' },
    { id: 'settings', label: 'Settings', icon: FiSettings, path: '/settings' },
    { id: 'showcase', label: 'Email Showcase', icon: FiMail, path: '/email-showcase' },
  ]

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <Box w="240px" h="100vh" bg={bgColor} borderRight="1px" borderColor={borderColor}>
      <VStack spacing={0} align="stretch" h="full">
        {/* Logo Area */}
        <Box px={4} py={4} borderBottom="1px" borderColor={borderColor}>
          <HStack spacing={2}>
            <Box w={2} h={2} bg="black" borderRadius="full" />
            <Text fontSize="md" fontWeight="semibold" letterSpacing="tight" color={activeTextColor}>
              Email Backup
            </Text>
          </HStack>
        </Box>

        {/* Search */}
        <Box px={3} py={3}>
          <InputGroup size="sm">
            <InputLeftElement pointerEvents="none">
              <Icon as={FiSearch} color="gray.400" boxSize={3} />
            </InputLeftElement>
            <Input
              placeholder="Search..."
              fontSize="sm"
              bg={useColorModeValue('gray.50', 'gray.800')}
              border="1px"
              borderColor={borderColor}
              borderRadius="6px"
              _hover={{ borderColor: 'gray.300' }}
              _focus={{ borderColor: 'gray.400', boxShadow: 'none', bg: 'white' }}
              transition="all 0.15s ease"
            />
          </InputGroup>
        </Box>

        {/* Menu Items */}
        <VStack spacing={0} align="stretch" flex={1} overflowY="auto" px={2}>
          {menuItems.map((item, index) => {
            if (item.type === 'separator') {
              return <Box key={index} h="16px" />
            }
            if (item.type === 'group') {
              return (
                <Text
                  key={index}
                  fontSize="xs"
                  fontWeight="semibold"
                  color={groupTextColor}
                  letterSpacing="wide"
                  px={3}
                  py={2}
                >
                  {item.label}
                </Text>
              )
            }
            const isActive = location.pathname === item.path || activeItem === item.id
            return (
              <Button
                key={item.id}
                variant="ghost"
                justifyContent="flex-start"
                size="sm"
                h="28px"
                px={3}
                fontSize="sm"
                fontWeight="normal"
                color={isActive ? activeTextColor : textColor}
                bg={isActive ? hoverBg : 'transparent'}
                _hover={{ bg: hoverBg }}
                onClick={() => {
                  setActiveItem(item.id)
                  navigate(item.path)
                }}
                borderRadius="6px"
                position="relative"
                w="full"
                transition="all 0.15s ease"
              >
                {isActive && (
                  <Box
                    position="absolute"
                    left="0"
                    w="2px"
                    h="16px"
                    bg="black"
                    borderRadius="full"
                  />
                )}
                <HStack spacing={3}>
                  <Icon as={item.icon} boxSize={4} />
                  <Text>{item.label}</Text>
                </HStack>
              </Button>
            )
          })}
        </VStack>

        {/* User Section */}
        <Box px={3} py={3} borderTop="1px" borderColor={borderColor}>
          <Menu>
            <MenuButton as={Box}>
              <HStack 
                spacing={3} 
                p={2} 
                borderRadius="6px" 
                cursor="pointer" 
                _hover={{ bg: hoverBg }}
                transition="all 0.15s ease"
              >
                <Avatar size="xs" name={user?.email} bg="gray.200" color="gray.600" />
                <VStack spacing={0} align="start" flex={1}>
                  <Text fontSize="sm" fontWeight="medium" color={activeTextColor}>
                    {user?.email?.split('@')[0] || 'User'}
                  </Text>
                  <Text fontSize="xs" color={textColor}>
                    {user?.email}
                  </Text>
                </VStack>
              </HStack>
            </MenuButton>
            <MenuList 
              border="1px" 
              borderColor={borderColor} 
              shadow="lg"
              borderRadius="8px"
              p={2}
            >
              <MenuItem 
                icon={<FiUser size={16} />} 
                onClick={() => navigate('/profile')}
                borderRadius="6px"
                fontSize="sm"
                _hover={{ bg: hoverBg }}
              >
                Profile
              </MenuItem>
              <MenuItem 
                icon={<FiSettings size={16} />} 
                onClick={() => navigate('/settings')}
                borderRadius="6px"
                fontSize="sm"
                _hover={{ bg: hoverBg }}
              >
                Settings
              </MenuItem>
              <MenuDivider borderColor={borderColor} />
              <MenuItem 
                icon={<FiLogOut size={16} />} 
                onClick={handleLogout}
                borderRadius="6px"
                fontSize="sm"
                color="red.600"
                _hover={{ bg: 'red.50' }}
              >
                Sign out
              </MenuItem>
            </MenuList>
          </Menu>
        </Box>
      </VStack>
    </Box>
  )
}

export const Layout = ({ children }: LayoutProps) => {
  return (
    <Flex height="100vh" overflow="hidden" bg={useColorModeValue('white', 'gray.900')}>
      {/* Linear/Notion Style Sidebar */}
      <LinearSidebar />

      {/* Main Content Area - Minimal design */}
      <Flex direction="column" flex="1" overflow="hidden">
        {/* Minimal Content Container */}
        <Box flex="1" overflow="auto" bg={useColorModeValue('white', 'gray.900')}>
          {children}
        </Box>
      </Flex>
    </Flex>
  )
}