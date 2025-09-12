import React, { useState } from 'react';
import {
  Box,
  VStack,
  HStack,
  Text,
  Icon,
  Button,
  Flex,
  Avatar,
  Badge,
  Input,
  InputGroup,
  InputLeftElement,
  Divider,
  useColorModeValue,
  Container,
  Heading,
  Grid,
  GridItem,
  IconButton,
} from '@chakra-ui/react';
import {
  FiHome,
  FiUsers,
  FiSettings,
  FiHelpCircle,
  FiSearch,
  FiMonitor,
  FiShield,
  FiFileText,
  FiBell,
  FiGrid,
  FiDatabase,
  FiKey,
  FiActivity,
  FiChevronDown,
  FiChevronRight,
  FiLogOut,
  FiPlus,
  FiHash,
  FiMail,
  FiCalendar,
  FiCreditCard,
  FiLayers,
  FiPackage,
  FiTrendingUp,
} from 'react-icons/fi';

// Linear/Notion Style Sidebar
const LinearStyleSidebar = () => {
  const [activeItem, setActiveItem] = useState('dashboard');
  const bgColor = useColorModeValue('white', 'gray.900');
  const borderColor = useColorModeValue('gray.200', 'gray.700');
  const textColor = useColorModeValue('gray.600', 'gray.400');
  const activeTextColor = useColorModeValue('gray.900', 'white');
  const hoverBg = useColorModeValue('gray.50', 'gray.800');
  const groupTextColor = useColorModeValue('gray.500', 'gray.500');

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: FiHome },
    { id: 'agents', label: 'Agents', icon: FiMonitor, count: 24 },
    { id: 'inventory', label: 'Inventory', icon: FiPackage },
    { id: 'licenses', label: 'Licenses', icon: FiKey },
    { type: 'separator' },
    { type: 'group', label: 'MANAGEMENT' },
    { id: 'organizations', label: 'Organizations', icon: FiUsers },
    { id: 'users', label: 'Users', icon: FiUsers },
    { id: 'settings', label: 'Settings', icon: FiSettings },
    { type: 'separator' },
    { type: 'group', label: 'SUPPORT' },
    { id: 'tickets', label: 'Tickets', icon: FiFileText, count: 3 },
    { id: 'help', label: 'Help Center', icon: FiHelpCircle },
  ];

  return (
    <Box w="240px" h="100vh" bg={bgColor} borderRight="1px" borderColor={borderColor}>
      <VStack spacing={0} align="stretch" h="full">
        {/* Logo Area */}
        <Box px={4} py={4} borderBottom="1px" borderColor={borderColor}>
          <HStack spacing={2}>
            <Box w={2} h={2} bg="black" borderRadius="full" />
            <Text fontSize="16px" fontWeight="600" letterSpacing="-0.02em">
              Pixven
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
              fontSize="13px"
              bg={useColorModeValue('gray.50', 'gray.800')}
              border="1px"
              borderColor={borderColor}
              _hover={{ borderColor: 'gray.300' }}
              _focus={{ borderColor: 'gray.400', boxShadow: 'none' }}
            />
          </InputGroup>
        </Box>

        {/* Menu Items */}
        <VStack spacing={0} align="stretch" flex={1} overflowY="auto" px={2}>
          {menuItems.map((item, index) => {
            if (item.type === 'separator') {
              return <Box key={index} h="16px" />;
            }
            if (item.type === 'group') {
              return (
                <Text
                  key={index}
                  fontSize="11px"
                  fontWeight="600"
                  color={groupTextColor}
                  letterSpacing="0.05em"
                  px={3}
                  py={2}
                >
                  {item.label}
                </Text>
              );
            }
            return (
              <Button
                key={item.id}
                variant="ghost"
                justifyContent="space-between"
                size="sm"
                h="32px"
                px={3}
                fontSize="14px"
                fontWeight="400"
                color={activeItem === item.id ? activeTextColor : textColor}
                bg={activeItem === item.id ? hoverBg : 'transparent'}
                _hover={{ bg: hoverBg }}
                onClick={() => setActiveItem(item.id)}
                borderRadius="6px"
                position="relative"
              >
                <HStack spacing={3}>
                  {activeItem === item.id && (
                    <Box
                      position="absolute"
                      left="0"
                      w="2px"
                      h="16px"
                      bg="black"
                      borderRadius="full"
                    />
                  )}
                  <Icon as={item.icon} boxSize={4} />
                  <Text>{item.label}</Text>
                </HStack>
                {item.count && (
                  <Badge size="sm" colorScheme="gray" borderRadius="full" fontSize="11px">
                    {item.count}
                  </Badge>
                )}
              </Button>
            );
          })}
        </VStack>

        {/* User Section */}
        <Box px={3} py={3} borderTop="1px" borderColor={borderColor}>
          <HStack spacing={3} p={2} borderRadius="6px" cursor="pointer" _hover={{ bg: hoverBg }}>
            <Avatar size="xs" name="John Doe" />
            <VStack spacing={0} align="start" flex={1}>
              <Text fontSize="13px" fontWeight="500">John Doe</Text>
              <Text fontSize="11px" color={textColor}>john@company.com</Text>
            </VStack>
          </HStack>
        </Box>
      </VStack>
    </Box>
  );
};

// Slack/Discord Style Sidebar
const SlackStyleSidebar = () => {
  const [activeItem, setActiveItem] = useState('dashboard');
  const bgColor = useColorModeValue('gray.800', 'gray.900');
  const hoverBg = useColorModeValue('gray.700', 'gray.800');
  const activeBg = useColorModeValue('blue.600', 'blue.700');

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: FiGrid },
    { id: 'agents', label: 'Agents', icon: FiMonitor },
    { id: 'alerts', label: 'Alerts', icon: FiBell, badge: 5 },
    { id: 'security', label: 'Security', icon: FiShield },
    { type: 'divider' },
    { id: 'organizations', label: 'Organizations', icon: FiUsers },
    { id: 'licenses', label: 'Licenses', icon: FiKey },
    { id: 'tickets', label: 'Tickets', icon: FiFileText },
    { type: 'divider' },
    { id: 'settings', label: 'Settings', icon: FiSettings },
  ];

  return (
    <Box w="240px" h="100vh" bg={bgColor} color="white">
      <VStack spacing={0} align="stretch" h="full">
        {/* Workspace Header */}
        <Box px={4} py={4} borderBottom="1px" borderColor="gray.700">
          <HStack justify="space-between">
            <VStack align="start" spacing={0}>
              <Text fontSize="15px" fontWeight="600">Pixven Workspace</Text>
              <Text fontSize="12px" color="gray.400">Free Plan</Text>
            </VStack>
            <IconButton
              aria-label="New"
              icon={<FiPlus />}
              size="sm"
              variant="ghost"
              color="gray.400"
              _hover={{ color: 'white', bg: 'gray.700' }}
            />
          </HStack>
        </Box>

        {/* Menu Items */}
        <VStack spacing={1} align="stretch" flex={1} overflowY="auto" p={2}>
          {menuItems.map((item, index) => {
            if (item.type === 'divider') {
              return <Divider key={index} borderColor="gray.700" my={2} />;
            }
            return (
              <Button
                key={item.id}
                variant="ghost"
                justifyContent="flex-start"
                size="sm"
                h="32px"
                px={3}
                fontSize="14px"
                fontWeight="400"
                color={activeItem === item.id ? 'white' : 'gray.300'}
                bg={activeItem === item.id ? activeBg : 'transparent'}
                _hover={{ bg: activeItem === item.id ? activeBg : hoverBg }}
                onClick={() => setActiveItem(item.id)}
                borderRadius="6px"
                position="relative"
              >
                <HStack spacing={3}>
                  <Icon as={item.icon} boxSize={4} />
                  <Text>{item.label}</Text>
                </HStack>
                {item.badge && (
                  <Badge
                    ml="auto"
                    colorScheme="red"
                    borderRadius="full"
                    fontSize="10px"
                    minW="18px"
                    h="18px"
                    display="flex"
                    alignItems="center"
                    justifyContent="center"
                  >
                    {item.badge}
                  </Badge>
                )}
              </Button>
            );
          })}
        </VStack>

        {/* User Section */}
        <Box px={3} py={3} borderTop="1px" borderColor="gray.700">
          <HStack spacing={3} p={2} borderRadius="6px" cursor="pointer" _hover={{ bg: 'gray.700' }}>
            <Avatar size="sm" name="John Doe" />
            <VStack spacing={0} align="start" flex={1}>
              <Text fontSize="13px" fontWeight="500">John Doe</Text>
              <HStack spacing={1}>
                <Box w={2} h={2} bg="green.400" borderRadius="full" />
                <Text fontSize="11px" color="gray.400">Active</Text>
              </HStack>
            </VStack>
          </HStack>
        </Box>
      </VStack>
    </Box>
  );
};

// GitHub Style Sidebar
const GitHubStyleSidebar = () => {
  const [activeItem, setActiveItem] = useState('dashboard');
  const bgColor = useColorModeValue('white', 'gray.900');
  const borderColor = useColorModeValue('gray.200', 'gray.700');
  const hoverBg = useColorModeValue('gray.50', 'gray.800');
  const activeIndicatorColor = useColorModeValue('orange.500', 'orange.400');

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: FiHome },
    { id: 'agents', label: 'Agents', icon: FiMonitor },
    { id: 'security', label: 'Security', icon: FiShield },
    { id: 'activity', label: 'Activity', icon: FiActivity },
    { type: 'section', label: 'Management' },
    { id: 'organizations', label: 'Organizations', icon: FiUsers },
    { id: 'licenses', label: 'Licenses', icon: FiCreditCard },
    { id: 'inventory', label: 'Inventory', icon: FiDatabase },
    { type: 'section', label: 'Support' },
    { id: 'tickets', label: 'Issues', icon: FiFileText },
    { id: 'help', label: 'Documentation', icon: FiHelpCircle },
  ];

  return (
    <Box w="240px" h="100vh" bg={bgColor} borderRight="1px" borderColor={borderColor}>
      <VStack spacing={0} align="stretch" h="full">
        {/* Logo */}
        <Box px={4} py={4}>
          <HStack spacing={2}>
            <Icon as={FiLayers} boxSize={6} />
            <Text fontSize="16px" fontWeight="600">Pixven</Text>
          </HStack>
        </Box>

        {/* Menu Items */}
        <VStack spacing={0} align="stretch" flex={1} overflowY="auto">
          {menuItems.map((item, index) => {
            if (item.type === 'section') {
              return (
                <Box key={index} px={4} py={2}>
                  <Text fontSize="12px" fontWeight="600" color="gray.600">
                    {item.label}
                  </Text>
                </Box>
              );
            }
            return (
              <Button
                key={item.id}
                variant="ghost"
                justifyContent="flex-start"
                size="sm"
                h="36px"
                px={4}
                fontSize="14px"
                fontWeight={activeItem === item.id ? '500' : '400'}
                color={activeItem === item.id ? 'gray.900' : 'gray.700'}
                bg="transparent"
                _hover={{ bg: hoverBg }}
                onClick={() => setActiveItem(item.id)}
                borderRadius="0"
                position="relative"
                borderLeft="3px solid"
                borderLeftColor={activeItem === item.id ? activeIndicatorColor : 'transparent'}
              >
                <HStack spacing={2}>
                  <Icon as={item.icon} boxSize={4} />
                  <Text>{item.label}</Text>
                </HStack>
              </Button>
            );
          })}
        </VStack>

        {/* Footer */}
        <Box px={4} py={3} borderTop="1px" borderColor={borderColor}>
          <VStack spacing={2} align="stretch">
            <Button variant="ghost" size="sm" justifyContent="flex-start" fontSize="13px">
              <Icon as={FiSettings} mr={2} />
              Settings
            </Button>
            <Button variant="ghost" size="sm" justifyContent="flex-start" fontSize="13px">
              <Icon as={FiLogOut} mr={2} />
              Sign out
            </Button>
          </VStack>
        </Box>
      </VStack>
    </Box>
  );
};

// Stripe/Vercel Style Sidebar
const StripeStyleSidebar = () => {
  const [activeItem, setActiveItem] = useState('dashboard');
  const bgColor = useColorModeValue('white', 'black');
  const borderColor = useColorModeValue('gray.200', 'gray.800');
  const textColor = useColorModeValue('gray.600', 'gray.400');
  const activeTextColor = useColorModeValue('black', 'white');
  const hoverTextColor = useColorModeValue('gray.900', 'gray.100');

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard' },
    { id: 'agents', label: 'Agents' },
    { id: 'monitoring', label: 'Monitoring' },
    { id: 'analytics', label: 'Analytics' },
    { type: 'space' },
    { id: 'organizations', label: 'Organizations' },
    { id: 'users', label: 'Users' },
    { id: 'billing', label: 'Billing' },
    { type: 'space' },
    { id: 'docs', label: 'Documentation' },
    { id: 'support', label: 'Support' },
  ];

  return (
    <Box w="200px" h="100vh" bg={bgColor} borderRight="1px" borderColor={borderColor}>
      <VStack spacing={0} align="stretch" h="full">
        {/* Logo */}
        <Box px={6} py={6}>
          <Text fontSize="14px" fontWeight="600" letterSpacing="-0.02em">
            Pixven
          </Text>
        </Box>

        {/* Menu Items */}
        <VStack spacing={0} align="stretch" flex={1} overflowY="auto" px={3}>
          {menuItems.map((item, index) => {
            if (item.type === 'space') {
              return <Box key={index} h="24px" />;
            }
            return (
              <Box
                key={item.id}
                px={3}
                py="6px"
                cursor="pointer"
                onClick={() => setActiveItem(item.id)}
                position="relative"
              >
                <Text
                  fontSize="13px"
                  fontWeight={activeItem === item.id ? '500' : '400'}
                  color={activeItem === item.id ? activeTextColor : textColor}
                  _hover={{ color: hoverTextColor }}
                  transition="color 0.15s"
                >
                  {activeItem === item.id && (
                    <Box
                      as="span"
                      display="inline-block"
                      w="4px"
                      h="4px"
                      bg={activeTextColor}
                      borderRadius="full"
                      mr={2}
                      mb="2px"
                    />
                  )}
                  {item.label}
                </Text>
              </Box>
            );
          })}
        </VStack>

        {/* User Avatar */}
        <Box px={6} py={4} borderTop="1px" borderColor={borderColor}>
          <HStack spacing={3} cursor="pointer">
            <Avatar size="xs" name="John Doe" />
            <VStack spacing={0} align="start" flex={1}>
              <Text fontSize="12px" fontWeight="500">John Doe</Text>
              <Text fontSize="11px" color={textColor}>Personal</Text>
            </VStack>
          </HStack>
        </Box>
      </VStack>
    </Box>
  );
};

// Main Showcase Component
const SidebarShowcase = () => {
  const mainBg = useColorModeValue('gray.50', 'gray.900');

  return (
    <Box bg={mainBg} minH="100vh" py={8}>
      <Container maxW="container.2xl">
        <VStack spacing={8} align="stretch">
          <Box>
            <Heading size="lg" mb={2}>Sidebar Design Showcase</Heading>
            <Text color="gray.600">Popular sidebar designs from leading applications</Text>
          </Box>

          <Grid templateColumns="repeat(2, 1fr)" gap={8}>
            {/* Linear/Notion Style */}
            <GridItem>
              <VStack align="stretch" spacing={4}>
                <Box>
                  <Heading size="md" mb={2}>Linear / Notion Style</Heading>
                  <Text fontSize="sm" color="gray.600">
                    Minimal, clean, with subtle indicators and small typography
                  </Text>
                </Box>
                <Box borderRadius="lg" overflow="hidden" boxShadow="xl">
                  <LinearStyleSidebar />
                </Box>
              </VStack>
            </GridItem>

            {/* Slack/Discord Style */}
            <GridItem>
              <VStack align="stretch" spacing={4}>
                <Box>
                  <Heading size="md" mb={2}>Slack / Discord Style</Heading>
                  <Text fontSize="sm" color="gray.600">
                    Dark theme, rounded elements, workspace-focused
                  </Text>
                </Box>
                <Box borderRadius="lg" overflow="hidden" boxShadow="xl">
                  <SlackStyleSidebar />
                </Box>
              </VStack>
            </GridItem>

            {/* GitHub Style */}
            <GridItem>
              <VStack align="stretch" spacing={4}>
                <Box>
                  <Heading size="md" mb={2}>GitHub Style</Heading>
                  <Text fontSize="sm" color="gray.600">
                    Clean with orange accent, left border indicators
                  </Text>
                </Box>
                <Box borderRadius="lg" overflow="hidden" boxShadow="xl">
                  <GitHubStyleSidebar />
                </Box>
              </VStack>
            </GridItem>

            {/* Stripe/Vercel Style */}
            <GridItem>
              <VStack align="stretch" spacing={4}>
                <Box>
                  <Heading size="md" mb={2}>Stripe / Vercel Style</Heading>
                  <Text fontSize="sm" color="gray.600">
                    Ultra minimal, no icons, dot indicators
                  </Text>
                </Box>
                <Box borderRadius="lg" overflow="hidden" boxShadow="xl">
                  <StripeStyleSidebar />
                </Box>
              </VStack>
            </GridItem>
          </Grid>

          {/* Implementation Notes */}
          <Box bg="blue.50" p={6} borderRadius="lg" mt={8}>
            <Heading size="sm" mb={3}>Implementation Notes</Heading>
            <VStack align="stretch" spacing={2}>
              <Text fontSize="sm">
                • <strong>Linear/Notion:</strong> Best for productivity tools, minimal cognitive load
              </Text>
              <Text fontSize="sm">
                • <strong>Slack/Discord:</strong> Great for communication/collaboration platforms
              </Text>
              <Text fontSize="sm">
                • <strong>GitHub:</strong> Developer-friendly, clear visual hierarchy
              </Text>
              <Text fontSize="sm">
                • <strong>Stripe/Vercel:</strong> Ultra-modern, best for dashboards
              </Text>
            </VStack>
          </Box>
        </VStack>
      </Container>
    </Box>
  );
};

export default SidebarShowcase;