import {
  Box,
  Container,
  Heading,
  Text,
  VStack,
  HStack,
  Card,
  CardBody,
  CardHeader,
  Switch,
  Select,
  Input,
  Button,
  FormControl,
  FormLabel,
  FormHelperText,
  Divider,
  useColorModeValue,
  useColorMode,
  Alert,
  AlertIcon,
  Badge,
  Icon,
  SimpleGrid,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
} from '@chakra-ui/react'
import { useState } from 'react'
import {
  FiUser,
  FiMoon,
  FiSun,
  FiDatabase,
  FiCloud,
  FiShield,
  FiInfo,
} from 'react-icons/fi'
import { MdSecurity, MdNotifications } from 'react-icons/md'
import { useAuthStore } from '../stores/authStore'
import { useUIStore } from '../stores/emailStore'
import { Layout } from '../components/layout/Layout'

interface SettingsSectionProps {
  title: string
  description?: string
  children: React.ReactNode
}

const SettingsSection = ({ title, description, children }: SettingsSectionProps) => {
  const cardBg = useColorModeValue('white', 'gray.800')
  const textColor = useColorModeValue('gray.900', 'white')
  const subtleTextColor = useColorModeValue('gray.600', 'gray.400')

  return (
    <Box>
      <Box mb={4}>
        <Text fontSize="xs" fontWeight="semibold" color="gray.500" letterSpacing="wide" textTransform="uppercase" mb={1}>
          {title}
        </Text>
        {description && (
          <Text fontSize="sm" color={subtleTextColor}>
            {description}
          </Text>
        )}
      </Box>
      <Card bg={cardBg} border="1px" borderColor="gray.200" shadow="none" borderRadius="8px">
        <CardBody p={6}>
          {children}
        </CardBody>
      </Card>
    </Box>
  )
}

export const Settings = () => {
  const { user } = useAuthStore()
  const { currentTheme, toggleTheme } = useUIStore()
  const { colorMode, toggleColorMode } = useColorMode()
  
  const [emailNotifications, setEmailNotifications] = useState(true)
  const [autoSync, setAutoSync] = useState(false)
  const [syncFrequency, setSyncFrequency] = useState('hourly')
  const [retentionPeriod, setRetentionPeriod] = useState('1year')

  const headingColor = useColorModeValue('gray.900', 'white')
  const textColor = useColorModeValue('gray.600', 'gray.400')
  const subtleTextColor = useColorModeValue('gray.500', 'gray.400')

  return (
    <Layout title="Settings">
      <Box bg="white" minH="100vh">
        <Container maxW="4xl" py={0} px={0}>
          <VStack align="stretch" spacing={0}>
            {/* Minimal Header */}
            <Box px={6} py={6} borderBottom="1px" borderColor="gray.200">
              <Text fontSize="lg" fontWeight="semibold" color={headingColor} mb={1}>
                Settings
              </Text>
              <Text color={subtleTextColor} fontSize="sm">
                Manage your account preferences and application settings.
              </Text>
            </Box>

            {/* Settings Content */}
            <Box px={6} py={6}>
              <VStack align="stretch" spacing={8}>

                {/* Account Information */}
                <SettingsSection
                  title="Account"
                  description="View and manage your account details"
                >
                  <VStack align="stretch" spacing={5}>
                    <FormControl>
                      <FormLabel fontSize="sm" fontWeight="medium" color="gray.700">Email Address</FormLabel>
                      <Input value={user?.email || ''} isReadOnly bg="gray.50" border="1px" borderColor="gray.200" />
                      <FormHelperText fontSize="xs" color="gray.500">
                        Your email address cannot be changed after registration.
                      </FormHelperText>
                    </FormControl>

                    <FormControl>
                      <FormLabel fontSize="sm" fontWeight="medium" color="gray.700">Account ID</FormLabel>
                      <Input value={user?.id || ''} isReadOnly bg="gray.50" border="1px" borderColor="gray.200" fontFamily="monospace" fontSize="sm" />
                      <FormHelperText fontSize="xs" color="gray.500">
                        Unique identifier for your account.
                      </FormHelperText>
                    </FormControl>

                    <FormControl>
                      <FormLabel fontSize="sm" fontWeight="medium" color="gray.700">Member Since</FormLabel>
                      <Input
                        value={user?.created_at ? new Date(user.created_at).toLocaleDateString() : 'N/A'}
                        isReadOnly
                        bg="gray.50"
                        border="1px"
                        borderColor="gray.200"
                      />
                    </FormControl>
                  </VStack>
                </SettingsSection>

                {/* Appearance Settings */}
                <SettingsSection title="Appearance">
                  <VStack align="stretch" spacing={5}>
                    <FormControl>
                      <HStack justify="space-between">
                        <VStack align="start" spacing={1}>
                          <FormLabel fontSize="sm" fontWeight="medium" color="gray.700" mb={0}>
                            Dark Mode
                          </FormLabel>
                          <Text fontSize="xs" color="gray.500">
                            Toggle between light and dark themes
                          </Text>
                        </VStack>
                        <Switch
                          isChecked={colorMode === 'dark'}
                          onChange={toggleColorMode}
                          size="sm"
                        />
                      </HStack>
                    </FormControl>

                    <Divider borderColor="gray.200" />

                    <FormControl>
                      <FormLabel fontSize="sm" fontWeight="medium" color="gray.700">Language</FormLabel>
                      <Select defaultValue="en" bg="gray.50" border="1px" borderColor="gray.200" size="sm">
                        <option value="en">English (US)</option>
                        <option value="tr">Türkçe</option>
                      </Select>
                      <FormHelperText fontSize="xs" color="gray.500">
                        Select your preferred language.
                      </FormHelperText>
                    </FormControl>
                  </VStack>
                </SettingsSection>

                {/* Notification Settings */}
                <SettingsSection title="Notifications">
                  <VStack align="stretch" spacing={5}>
                    <FormControl>
                      <HStack justify="space-between">
                        <VStack align="start" spacing={1}>
                          <FormLabel fontSize="sm" fontWeight="medium" color="gray.700" mb={0}>
                            Email Notifications
                          </FormLabel>
                          <Text fontSize="xs" color="gray.500">
                            Receive email updates about sync status
                          </Text>
                        </VStack>
                        <Switch
                          isChecked={emailNotifications}
                          onChange={(e) => setEmailNotifications(e.target.checked)}
                          size="sm"
                        />
                      </HStack>
                    </FormControl>

                    <FormControl>
                      <HStack justify="space-between">
                        <VStack align="start" spacing={1}>
                          <FormLabel fontSize="sm" fontWeight="medium" color="gray.700" mb={0}>
                            Browser Notifications
                          </FormLabel>
                          <Text fontSize="xs" color="gray.500">
                            Show desktop notifications
                          </Text>
                        </VStack>
                        <Switch size="sm" />
                      </HStack>
                    </FormControl>
                  </VStack>
                </SettingsSection>

                {/* Sync Settings */}
                <SettingsSection title="Synchronization">
                  <VStack align="stretch" spacing={5}>
                    <FormControl>
                      <HStack justify="space-between">
                        <VStack align="start" spacing={1}>
                          <FormLabel fontSize="sm" fontWeight="medium" color="gray.700" mb={0}>
                            Auto Sync
                          </FormLabel>
                          <Text fontSize="xs" color="gray.500">
                            Automatically sync emails at regular intervals
                          </Text>
                        </VStack>
                        <Switch
                          isChecked={autoSync}
                          onChange={(e) => setAutoSync(e.target.checked)}
                          size="sm"
                        />
                      </HStack>
                    </FormControl>

                    <SimpleGrid columns={{ base: 1, md: 2 }} spacing={5}>
                      <FormControl>
                        <FormLabel fontSize="sm" fontWeight="medium" color="gray.700">Sync Frequency</FormLabel>
                        <Select
                          value={syncFrequency}
                          onChange={(e) => setSyncFrequency(e.target.value)}
                          isDisabled={!autoSync}
                          bg="gray.50"
                          border="1px"
                          borderColor="gray.200"
                          size="sm"
                        >
                          <option value="15min">Every 15 minutes</option>
                          <option value="hourly">Every hour</option>
                          <option value="daily">Daily</option>
                          <option value="weekly">Weekly</option>
                        </Select>
                        <FormHelperText fontSize="xs" color="gray.500">
                          How often to automatically sync your emails
                        </FormHelperText>
                      </FormControl>

                      <FormControl>
                        <FormLabel fontSize="sm" fontWeight="medium" color="gray.700">Data Retention</FormLabel>
                        <Select
                          value={retentionPeriod}
                          onChange={(e) => setRetentionPeriod(e.target.value)}
                          bg="gray.50"
                          border="1px"
                          borderColor="gray.200"
                          size="sm"
                        >
                          <option value="1month">1 Month</option>
                          <option value="3months">3 Months</option>
                          <option value="6months">6 Months</option>
                          <option value="1year">1 Year</option>
                          <option value="unlimited">Unlimited</option>
                        </Select>
                        <FormHelperText fontSize="xs" color="gray.500">
                          How long to keep synchronized emails
                        </FormHelperText>
                      </FormControl>
                    </SimpleGrid>

                    <Alert status="info" variant="subtle" bg="blue.50" border="1px" borderColor="blue.200" borderRadius="6px">
                      <AlertIcon color="blue.500" />
                      <Text fontSize="xs" color="blue.700">
                        Changes to sync settings will apply to future synchronizations.
                      </Text>
                    </Alert>
                  </VStack>
                </SettingsSection>

                {/* Security Settings */}
                <SettingsSection title="Security">
                  <VStack align="stretch" spacing={5}>
                    <Alert status="warning" variant="subtle" bg="yellow.50" border="1px" borderColor="yellow.200" borderRadius="6px">
                      <AlertIcon color="yellow.600" />
                      <VStack align="start" spacing={1}>
                        <Text fontSize="sm" fontWeight="medium" color="yellow.800">
                          Password Security
                        </Text>
                        <Text fontSize="xs" color="yellow.700">
                          Email account passwords are stored securely but not encrypted in this MVP version. 
                          In production, all credentials would be fully encrypted.
                        </Text>
                      </VStack>
                    </Alert>

                    <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
                      <Card variant="outline" border="1px" borderColor="gray.200" bg="white">
                        <CardBody p={4}>
                          <VStack spacing={3}>
                            <Icon as={FiShield} boxSize={6} color="green.500" />
                            <VStack spacing={1}>
                              <Text fontSize="sm" fontWeight="medium">JWT Authentication</Text>
                              <Badge bg="green.100" color="green.700" fontSize="xs" borderRadius="12px" px={2}>Active</Badge>
                            </VStack>
                            <Text fontSize="xs" color="gray.500" textAlign="center">
                              Your session is secured with JWT tokens
                            </Text>
                          </VStack>
                        </CardBody>
                      </Card>

                      <Card variant="outline" border="1px" borderColor="gray.200" bg="white">
                        <CardBody p={4}>
                          <VStack spacing={3}>
                            <Icon as={FiCloud} boxSize={6} color="blue.500" />
                            <VStack spacing={1}>
                              <Text fontSize="sm" fontWeight="medium">Secure Storage</Text>
                              <Badge bg="blue.100" color="blue.700" fontSize="xs" borderRadius="12px" px={2}>MinIO</Badge>
                            </VStack>
                            <Text fontSize="xs" color="gray.500" textAlign="center">
                              Email data stored in encrypted object storage
                            </Text>
                          </VStack>
                        </CardBody>
                      </Card>
                    </SimpleGrid>

                    <Button variant="outline" size="sm" alignSelf="start" color="red.600" borderColor="red.200" _hover={{ bg: "red.50" }}>
                      Change Password
                    </Button>
                  </VStack>
                </SettingsSection>

                {/* System Information */}
                <SettingsSection title="System Information">
                  <SimpleGrid columns={{ base: 2, md: 4 }} spacing={6}>
                    <Stat>
                      <StatLabel fontSize="xs" color="gray.500" fontWeight="medium">Application Version</StatLabel>
                      <StatNumber fontSize="md" color="gray.900">MVP v1.0</StatNumber>
                      <StatHelpText fontSize="xs" color="gray.500">Email Backup</StatHelpText>
                    </Stat>

                    <Stat>
                      <StatLabel fontSize="xs" color="gray.500" fontWeight="medium">Database</StatLabel>
                      <StatNumber fontSize="md" color="gray.900">PostgreSQL</StatNumber>
                      <StatHelpText fontSize="xs">
                        <Badge bg="green.100" color="green.700" fontSize="xs" borderRadius="12px" px={2}>Connected</Badge>
                      </StatHelpText>
                    </Stat>

                    <Stat>
                      <StatLabel fontSize="xs" color="gray.500" fontWeight="medium">Storage</StatLabel>
                      <StatNumber fontSize="md" color="gray.900">MinIO</StatNumber>
                      <StatHelpText fontSize="xs">
                        <Badge bg="green.100" color="green.700" fontSize="xs" borderRadius="12px" px={2}>Available</Badge>
                      </StatHelpText>
                    </Stat>

                    <Stat>
                      <StatLabel fontSize="xs" color="gray.500" fontWeight="medium">API Status</StatLabel>
                      <StatNumber fontSize="md" color="gray.900">Healthy</StatNumber>
                      <StatHelpText fontSize="xs">
                        <Badge bg="green.100" color="green.700" fontSize="xs" borderRadius="12px" px={2}>Online</Badge>
                      </StatHelpText>
                    </Stat>
                  </SimpleGrid>
                </SettingsSection>

                {/* Save Button */}
                <Box pt={4} borderTop="1px" borderColor="gray.200">
                  <HStack justify="end" spacing={3}>
                    <Button variant="ghost" size="sm" color="gray.600">
                      Reset to Defaults
                    </Button>
                    <Button bg="black" color="white" size="sm" _hover={{ bg: "gray.800" }}>
                      Save Settings
                    </Button>
                  </HStack>
                </Box>
              </VStack>
            </Box>
          </VStack>
        </Container>
      </Box>
    </Layout>
  )
}