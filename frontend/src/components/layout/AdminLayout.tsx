import React, { useState, useMemo } from 'react'
import {
  Box,
  Flex,
  VStack,
  HStack,
  Text,
  Icon,
  IconButton,
  Button,
  Avatar,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  MenuDivider,
  Drawer,
  DrawerBody,
  DrawerHeader,
  DrawerOverlay,
  DrawerContent,
  DrawerCloseButton,
  useDisclosure,
  useColorModeValue,
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  Badge,
  Tooltip,
  Divider,
} from '@chakra-ui/react'
import { 
  FiHome,
  FiUsers,
  FiServer,
  FiSettings,
  FiMail,
  FiBarChart,
  FiShield,
  FiMenu,
  FiChevronRight,
  FiLogOut,
  FiUser,
  FiHelpCircle,
  FiBell,
  FiGrid,
  FiTrendingUp,
  FiDatabase,
} from 'react-icons/fi'
import { FaBuilding } from 'react-icons/fa'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAuthStore } from '../../stores/authStore'
import { getRoleDisplayName, canAccess } from '../../utils/roleUtils'

// Navigation item interface
interface NavItem {
  id: string
  label: string
  icon: React.ElementType
  path?: string
  badge?: string | number
  children?: NavItem[]
  requiredRole?: number
  requiredPermissions?: string[]
}

// Admin layout props
interface AdminLayoutProps {
  children: React.ReactNode
  title?: string
  breadcrumbs?: Array<{ label: string; href?: string }>
}

// Office 365 style admin layout
export const AdminLayout: React.FC<AdminLayoutProps> = ({ 
  children, 
  title,
  breadcrumbs = []
}) => {
  const navigate = useNavigate()
  const location = useLocation()
  const { user, logout } = useAuthStore()
  const { isOpen, onOpen, onClose } = useDisclosure()
  const [collapsedGroups, setCollapsedGroups] = useState<Set<string>>(new Set())

  // Color mode values
  const sidebarBg = useColorModeValue('white', 'gray.800')
  const headerBg = useColorModeValue('white', 'gray.800')
  const borderColor = useColorModeValue('gray.200', 'gray.600')
  const activeItemBg = useColorModeValue('blue.50', 'blue.900')
  const hoverItemBg = useColorModeValue('gray.50', 'gray.700')
  const textColor = useColorModeValue('gray.700', 'gray.200')
  const mutedTextColor = useColorModeValue('gray.500', 'gray.400')

  // Navigation items based on user role
  const navigationItems: NavItem[] = useMemo(() => {
    const items: NavItem[] = []



    // Dashboard (all admin roles)
    items.push({
      id: 'dashboard',
      label: 'Dashboard',
      icon: FiHome,
      path: '/admin/dashboard',
    })

    // Organization Management (Admin only - visible at top level)
    if (user?.role?.level === 1) {
      items.push({
        id: 'organizations-main',
        label: 'Organizasyon Yönetimi',
        icon: FaBuilding,
        path: '/admin/organizations',
        badge: 'Yeni',
      })
    }

    // System Management (Admin only - Level 1)
    if (user?.role?.level === 1) {
      items.push({
        id: 'system',
        label: 'System Management',
        icon: FiGrid,
        children: [
          {
            id: 'all-organizations',
            label: 'All Organizations',
            icon: FaBuilding,
            path: '/admin/organizations',
            requiredRole: 1,
          },
          {
            id: 'system-stats',
            label: 'System Statistics',
            icon: FiBarChart,
            path: '/admin/system-stats',
            requiredRole: 1,
          },
          {
            id: 'system-settings',
            label: 'System Settings',
            icon: FiSettings,
            path: '/admin/system-settings',
            requiredRole: 1,
          },
        ],
      })
    }

    // Network Management (Distributor only - Level 2)
    if (user?.role?.level === 2) {
      items.push({
        id: 'network',
        label: 'Network Management',
        icon: FiTrendingUp,
        children: [
          {
            id: 'dealers',
            label: 'Manage Dealers',
            icon: FiUsers,
            path: '/admin/dealers',
            requiredRole: 2,
          },
          {
            id: 'clients',
            label: 'Manage Clients',
            icon: FiServer,
            path: '/admin/clients',
            requiredRole: 2,
          },
          {
            id: 'network-stats',
            label: 'Network Statistics',
            icon: FiBarChart,
            path: '/admin/network-stats',
            requiredRole: 2,
          },
        ],
      })
    }

    // Client Management (Dealer only - Level 3)
    if (user?.role?.level === 3) {
      items.push({
        id: 'client-management',
        label: 'Client Management',
        icon: FiServer,
        children: [
          {
            id: 'my-clients',
            label: 'My Clients',
            icon: FiServer,
            path: '/admin/my-clients',
            requiredRole: 3,
          },
          {
            id: 'client-users',
            label: 'Client Users',
            icon: FiUsers,
            path: '/admin/client-users',
            requiredRole: 3,
          },
          {
            id: 'client-stats',
            label: 'Client Statistics',
            icon: FiBarChart,
            path: '/admin/client-stats',
            requiredRole: 3,
          },
        ],
      })
    }

    // User Management (Client only - Level 4)
    if (user?.role?.level === 4) {
      items.push({
        id: 'user-management',
        label: 'User Management',
        icon: FiUsers,
        children: [
          {
            id: 'end-users',
            label: 'End Users',
            icon: FiUsers,
            path: '/admin/end-users',
            requiredRole: 4,
          },
          {
            id: 'user-permissions',
            label: 'User Permissions',
            icon: FiShield,
            path: '/admin/user-permissions',
            requiredRole: 4,
          },
          {
            id: 'usage-stats',
            label: 'Usage Statistics',
            icon: FiBarChart,
            path: '/admin/usage-stats',
            requiredRole: 4,
          },
        ],
      })
    }

    return items
  }, [user])

  // Handle navigation
  const handleNavigate = (path: string) => {
    navigate(path)
    onClose()
  }

  // Toggle group collapse
  const toggleGroup = (groupId: string) => {
    const newCollapsed = new Set(collapsedGroups)
    if (newCollapsed.has(groupId)) {
      newCollapsed.delete(groupId)
    } else {
      newCollapsed.add(groupId)
    }
    setCollapsedGroups(newCollapsed)
  }

  // Check if item is active
  const isActiveItem = (item: NavItem): boolean => {
    if (item.path) {
      return location.pathname === item.path
    }
    return item.children?.some(child => location.pathname === child.path) || false
  }

  // Render navigation item
  const renderNavItem = (item: NavItem, level = 0) => {
    const hasChildren = item.children && item.children.length > 0
    const isActive = isActiveItem(item)
    const isCollapsed = collapsedGroups.has(item.id)
    const canAccessItem = !item.requiredRole || canAccess(user, [], item.requiredRole)

    if (!canAccessItem) return null

    if (hasChildren) {
      return (
        <VStack key={item.id} align="stretch" spacing={0}>
          <Button
            variant="ghost"
            justifyContent="flex-start"
            pl={4 + level * 4}
            pr={2}
            py={3}
            h="auto"
            fontWeight="medium"
            fontSize="sm"
            color={isActive ? 'blue.600' : textColor}
            bg={isActive ? activeItemBg : 'transparent'}
            _hover={{ bg: hoverItemBg }}
            onClick={() => toggleGroup(item.id)}
            rightIcon={
              <Icon
                as={FiChevronRight}
                transform={isCollapsed ? 'rotate(0deg)' : 'rotate(90deg)'}
                transition="transform 0.1s"
              />
            }
          >
            <HStack spacing={3} flex={1}>
              <Icon as={item.icon} boxSize={4} />
              <Text>{item.label}</Text>
            </HStack>
          </Button>

          {!isCollapsed && (
            <VStack align="stretch" spacing={0} pl={4}>
              {item.children?.map(child => renderNavItem(child, level + 1))}
            </VStack>
          )}
        </VStack>
      )
    }

    return (
      <Button
        key={item.id}
        variant="ghost"
        justifyContent="flex-start"
        pl={4 + level * 4}
        py={3}
        h="auto"
        fontWeight="medium"
        fontSize="sm"
        color={isActive ? 'blue.600' : textColor}
        bg={isActive ? activeItemBg : 'transparent'}
        _hover={{ bg: hoverItemBg }}
        onClick={() => item.path && handleNavigate(item.path)}
      >
        <HStack spacing={3} flex={1}>
          <Icon as={item.icon} boxSize={4} />
          <Text>{item.label}</Text>
          {item.badge && (
            <Badge colorScheme="blue" size="sm" ml="auto">
              {item.badge}
            </Badge>
          )}
        </HStack>
      </Button>
    )
  }

  const sidebarContent = (
    <VStack spacing={0} align="stretch" h="full">
      {/* Logo/Brand */}
      <Box px={6} py={4} borderBottom="1px" borderColor={borderColor}>
        <HStack spacing={3}>
          <Box
            w={8}
            h={8}
            bg="blue.500"
            borderRadius="md"
            display="flex"
            alignItems="center"
            justifyContent="center"
          >
            <Icon as={FiDatabase} color="white" boxSize={4} />
          </Box>
          <VStack align="flex-start" spacing={0}>
            <Text fontWeight="bold" fontSize="md" color={textColor}>
              Email Backup
            </Text>
            <Text fontSize="xs" color={mutedTextColor}>
              Enterprise System
            </Text>
          </VStack>
        </HStack>
      </Box>

      {/* User info */}
      <Box px={6} py={4} borderBottom="1px" borderColor={borderColor}>
        <HStack spacing={3}>
          <Avatar size="sm" name={user?.email} />
          <VStack align="flex-start" spacing={0} flex={1}>
            <Text fontSize="sm" fontWeight="medium" color={textColor} isTruncated>
              {user?.email}
            </Text>
            <Badge size="sm" colorScheme="blue">
              {getRoleDisplayName(user?.role)}
            </Badge>
          </VStack>
        </HStack>
      </Box>

      {/* Navigation */}
      <VStack spacing={2} align="stretch" flex={1} p={4} overflowY="auto">
        {navigationItems.map(item => renderNavItem(item))}
      </VStack>

      {/* Footer actions */}
      <Box px={4} py={4} borderTop="1px" borderColor={borderColor}>
        <VStack spacing={2} align="stretch">
          <Button
            variant="ghost"
            justifyContent="flex-start"
            leftIcon={<FiHelpCircle />}
            size="sm"
            color={mutedTextColor}
          >
            Help & Support
          </Button>
          <Button
            variant="ghost"
            justifyContent="flex-start"
            leftIcon={<FiLogOut />}
            size="sm"
            color="red.500"
            onClick={logout}
          >
            Sign Out
          </Button>
        </VStack>
      </Box>
    </VStack>
  )

  return (
    <Flex h="100vh" bg="gray.50">
      {/* Desktop Sidebar */}
      <Box
        w="280px"
        bg={sidebarBg}
        borderRight="1px"
        borderColor={borderColor}
        display={{ base: 'none', lg: 'block' }}
        position="fixed"
        h="full"
        zIndex={10}
        boxShadow="sm"
      >
        {sidebarContent}
      </Box>

      {/* Mobile Drawer */}
      <Drawer isOpen={isOpen} placement="left" onClose={onClose} size="sm">
        <DrawerOverlay />
        <DrawerContent bg={sidebarBg}>
          <DrawerCloseButton />
          <DrawerHeader borderBottom="1px" borderColor={borderColor}>
            <Text fontSize="lg" fontWeight="bold">
              Email Backup System
            </Text>
          </DrawerHeader>
          <DrawerBody p={0}>
            {sidebarContent}
          </DrawerBody>
        </DrawerContent>
      </Drawer>

      {/* Main Content */}
      <Box flex={1} ml={{ base: 0, lg: '280px' }}>
        {/* Header */}
        <Box
          bg={headerBg}
          borderBottom="1px"
          borderColor={borderColor}
          px={6}
          py={4}
          position="sticky"
          top={0}
          zIndex={5}
          boxShadow="sm"
        >
          <Flex justify="space-between" align="center">
            <HStack spacing={4}>
              {/* Mobile menu button */}
              <IconButton
                aria-label="Open menu"
                icon={<FiMenu />}
                variant="ghost"
                size="sm"
                onClick={onOpen}
                display={{ base: 'flex', lg: 'none' }}
              />

              {/* Title and breadcrumbs */}
              <VStack align="flex-start" spacing={1}>
                {title && (
                  <Text fontSize="xl" fontWeight="bold" color={textColor}>
                    {title}
                  </Text>
                )}
                
                {breadcrumbs.length > 0 && (
                  <Breadcrumb
                    spacing={2}
                    separator={<FiChevronRight color={mutedTextColor} />}
                    fontSize="sm"
                  >
                    <BreadcrumbItem>
                      <BreadcrumbLink onClick={() => navigate('/admin/dashboard')}>
                        Dashboard
                      </BreadcrumbLink>
                    </BreadcrumbItem>
                    {breadcrumbs.map((crumb, index) => (
                      <BreadcrumbItem key={index} isCurrentPage={index === breadcrumbs.length - 1}>
                        <BreadcrumbLink
                          onClick={crumb.href ? () => navigate(crumb.href!) : undefined}
                        >
                          {crumb.label}
                        </BreadcrumbLink>
                      </BreadcrumbItem>
                    ))}
                  </Breadcrumb>
                )}
              </VStack>
            </HStack>

            {/* Header actions */}
            <HStack spacing={3}>
              <Tooltip label="Notifications">
                <IconButton
                  aria-label="Notifications"
                  icon={<FiBell />}
                  variant="ghost"
                  size="sm"
                />
              </Tooltip>

              <Menu>
                <MenuButton as={Button} variant="ghost" size="sm">
                  <HStack spacing={2}>
                    <Avatar size="sm" name={user?.email} />
                    <Text fontSize="sm" fontWeight="medium" display={{ base: 'none', md: 'block' }}>
                      {user?.email}
                    </Text>
                  </HStack>
                </MenuButton>
                <MenuList>
                  <MenuItem icon={<FiUser />} onClick={() => navigate('/profile')}>
                    Profile
                  </MenuItem>
                  <MenuItem icon={<FiSettings />} onClick={() => navigate('/settings')}>
                    Settings
                  </MenuItem>
                  <MenuDivider />
                  <MenuItem icon={<FiLogOut />} onClick={logout} color="red.500">
                    Sign Out
                  </MenuItem>
                </MenuList>
              </Menu>
            </HStack>
          </Flex>
        </Box>

        {/* Page Content */}
        <Box p={6} minH="calc(100vh - 73px)" overflowY="auto">
          {children}
        </Box>
      </Box>
    </Flex>
  )
}

export default AdminLayout