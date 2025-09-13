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
  FiUsers,
  FiGrid,
  FiPlus,
  FiUserPlus,
} from 'react-icons/fi'
import { 
  MdDashboard, 
  MdBusiness, 
  MdStorefront, 
  MdGroup, 
  MdPersonAdd, 
  MdPeople, 
  MdAccountTree,
  MdAdd,
  MdEmail,
  MdInbox
} from 'react-icons/md'
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
    
    // Dashboard routes
    if (path === '/dashboard' || path === '/admin/dashboard' || path === '/distributor/dashboard' || path === '/dealer/dashboard' || path === '/client/dashboard') {
      setActiveItem('dashboard')
    }
    // Admin routes
    else if (path.includes('/admin/organizations')) setActiveItem('organizations')
    else if (path.includes('/admin/create-organization')) setActiveItem('create-organization')
    // Distributor routes
    else if (path.includes('/distributor/network')) setActiveItem('network')
    else if (path.includes('/distributor/add-dealer')) setActiveItem('add-dealer')
    else if (path.includes('/distributor/add-client')) setActiveItem('add-client')
    else if (path.includes('/distributor/statistics')) setActiveItem('network-statistics')
    // Dealer routes
    else if (path.includes('/dealer/clients')) setActiveItem('clients')
    else if (path.includes('/dealer/add-client')) setActiveItem('add-client')
    // Client routes
    else if (path.includes('/client/users')) setActiveItem('users')
    else if (path.includes('/client/add-user')) setActiveItem('add-user')
    // Common routes
    else if (path.includes('/accounts')) setActiveItem('accounts')
    else if (path.includes('/emails')) {
      const urlParams = new URLSearchParams(location.search)
      const folder = urlParams.get('folder')
      if (folder === 'INBOX') setActiveItem('inbox')
      else if (folder === 'Sent Items') setActiveItem('sent')
      else if (folder === 'Archive') setActiveItem('archive')
      else if (folder === 'Deleted Items') setActiveItem('trash')
      else setActiveItem('emails')
    }
    else if (path.includes('/settings')) setActiveItem('settings')
    else if (path.includes('/email-showcase')) setActiveItem('showcase')
  }, [location.pathname, location.search])

  // Get user role from auth store - STRICT role checking
  const userRole = user?.role?.name || 'end_user'
  const isAdmin = userRole === 'admin'
  const isDistributor = userRole === 'distributor'
  const isDealer = userRole === 'dealer'
  const isClient = userRole === 'client'
  const isEndUser = userRole === 'end_user'

  // Role-based menu items - CRITICAL: Only end users should have email access
  const getAllMenuItems = () => {
    // ADMIN: System management ONLY - NO email functionality
    if (userRole === 'admin') {  // Direct role check
      return [
        { id: 'admin-dashboard', label: 'Dashboard', icon: MdDashboard, path: '/admin/dashboard' },
        { type: 'separator' },
        { type: 'group', label: 'SYSTEM ADMINISTRATION' },
        { id: 'organizations', label: 'Organizations', icon: MdBusiness, path: '/admin/organizations' },
        { id: 'create-organization', label: 'Create Organization', icon: MdAdd, path: '/admin/create-organization' },
        { type: 'separator' },
        { type: 'group', label: 'SETTINGS' },
        { id: 'settings', label: 'System Settings', icon: FiSettings, path: '/settings' },
      ]
    }

    // DISTRIBUTOR: Network management ONLY - NO email functionality
    if (userRole === 'distributor') {  // Direct role check
      return [
        { id: 'dashboard', label: 'Dashboard', icon: MdDashboard, path: '/distributor/dashboard' },
        { type: 'separator' },
        { type: 'group', label: 'NETWORK MANAGEMENT' },
        { id: 'network', label: 'My Network', icon: MdAccountTree, path: '/distributor/network' },
        { id: 'add-dealer', label: 'Add Dealer', icon: MdStorefront, path: '/distributor/add-dealer' },
        { id: 'add-client', label: 'Add Client', icon: MdBusiness, path: '/distributor/add-client' },
        { id: 'network-statistics', label: 'Network Statistics', icon: FiGrid, path: '/distributor/statistics' },
        { type: 'separator' },
        { type: 'group', label: 'REPORTS' },
        { id: 'reports', label: 'Network Reports', icon: FiActivity, path: '/distributor/reports' },
        { type: 'separator' },
        { type: 'group', label: 'SETTINGS' },
        { id: 'settings', label: 'Settings', icon: FiSettings, path: '/settings' },
      ]
    }

    // DEALER: Client management ONLY - NO email functionality  
    if (userRole === 'dealer') {  // Direct role check
      return [
        { id: 'dashboard', label: 'Dashboard', icon: MdDashboard, path: '/dealer/dashboard' },
        { type: 'separator' },
        { type: 'group', label: 'CLIENT MANAGEMENT' },
        { id: 'clients', label: 'My Clients', icon: MdGroup, path: '/dealer/clients' },
        { id: 'add-client', label: 'Add Client', icon: MdPersonAdd, path: '/dealer/add-client' },
        { type: 'separator' },
        { type: 'group', label: 'REPORTS' },
        { id: 'reports', label: 'Client Reports', icon: FiActivity, path: '/dealer/reports' },
        { type: 'separator' },
        { type: 'group', label: 'SETTINGS' },
        { id: 'settings', label: 'Settings', icon: FiSettings, path: '/settings' },
      ]
    }

    // CLIENT: User management ONLY - NO email functionality
    if (userRole === 'client') {  // Direct role check
      return [
        { id: 'dashboard', label: 'Dashboard', icon: MdDashboard, path: '/client/dashboard' },
        { type: 'separator' },
        { type: 'group', label: 'USER MANAGEMENT' },
        { id: 'users', label: 'User Management', icon: MdPeople, path: '/client/users' },
        { id: 'add-user', label: 'Add User', icon: MdPersonAdd, path: '/client/add-user' },
        { type: 'separator' },
        { type: 'group', label: 'REPORTS' },
        { id: 'reports', label: 'User Reports', icon: FiActivity, path: '/client/reports' },
        { type: 'separator' },
        { type: 'group', label: 'SETTINGS' },
        { id: 'settings', label: 'Settings', icon: FiSettings, path: '/settings' },
      ]
    }

    // END USER: ONLY role with email functionality
    // This is the DEFAULT - only end_user role gets email access
    if (userRole === 'end_user') {
      return [
      { id: 'dashboard', label: 'Dashboard', icon: MdDashboard, path: '/dashboard' },
      { type: 'separator' },
      { type: 'group', label: 'EMAIL MANAGEMENT' },
      { id: 'emails', label: 'Emails', icon: MdEmail, path: '/emails' },
      { id: 'accounts', label: 'Email Accounts', icon: FiUser, path: '/accounts' },
      { type: 'separator' },
      { type: 'group', label: 'FOLDERS' },
      { id: 'inbox', label: 'Inbox', icon: MdInbox, path: '/emails?folder=INBOX' },
      { id: 'sent', label: 'Sent Items', icon: FiSend, path: '/emails?folder=Sent Items' },
      { id: 'archive', label: 'Archive', icon: FiArchive, path: '/emails?folder=Archive' },
      { id: 'trash', label: 'Deleted Items', icon: FiTrash, path: '/emails?folder=Deleted Items' },
      { type: 'separator' },
      { type: 'group', label: 'SETTINGS' },
      { id: 'settings', label: 'Settings', icon: FiSettings, path: '/settings' },
      { id: 'showcase', label: 'Email Showcase', icon: FiMail, path: '/email-showcase' }
    ]
    }

    // Fallback - no menu items for unknown roles
    console.warn('Unknown user role:', userRole)
    return []
  }

  const menuItems = getAllMenuItems()

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