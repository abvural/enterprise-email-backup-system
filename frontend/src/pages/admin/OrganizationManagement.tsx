import React, { useState } from 'react'
import {
  Box,
  Container,
  Heading,
  HStack,
  VStack,
  Button,
  Grid,
  GridItem,
  Card,
  CardBody,
  Text,
  Badge,
  Divider,
  useDisclosure,
  IconButton,
  Tooltip,
  Alert,
  AlertIcon,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  useToast,
} from '@chakra-ui/react'
import { AddIcon, EditIcon, DeleteIcon, ViewIcon } from '@chakra-ui/icons'
import { type Organization, organizationsAPI } from '../../services/api'
import OrganizationList from '../../components/organizations/OrganizationList'
import OrganizationForm from '../../components/organizations/OrganizationForm'

interface OrgStats {
  organization_id: string
  user_count: number
  email_account_count: number
  total_emails: number
  total_storage_bytes: number
  total_storage_mb: number
  limits: {
    max_users?: number
    max_storage_gb?: number
    max_email_accounts?: number
  }
}

export const OrganizationManagement: React.FC = () => {
  const toast = useToast()
  const [selectedOrganization, setSelectedOrganization] = useState<Organization | null>(null)
  const [organizationStats, setOrganizationStats] = useState<OrgStats | null>(null)
  const [statsLoading, setStatsLoading] = useState(false)
  const [refreshKey, setRefreshKey] = useState(0)
  
  // Form modals
  const {
    isOpen: isCreateOpen,
    onOpen: onCreateOpen,
    onClose: onCreateClose,
  } = useDisclosure()
  
  const {
    isOpen: isEditOpen,
    onOpen: onEditOpen,
    onClose: onEditClose,
  } = useDisclosure()

  const [formParentOrg, setFormParentOrg] = useState<Organization | null>(null)
  const [formEditOrg, setFormEditOrg] = useState<Organization | null>(null)

  const handleSelectOrganization = async (organization: Organization) => {
    setSelectedOrganization(organization)
    
    // Load statistics for the selected organization
    if (organization.id) {
      setStatsLoading(true)
      try {
        const response = await organizationsAPI.getOrganizationStats(organization.id)
        setOrganizationStats(response.data)
      } catch (error: any) {
        console.error('Failed to load organization stats:', error)
        // Don't show error toast for stats, just fail silently
      } finally {
        setStatsLoading(false)
      }
    }
  }

  const handleCreateOrganization = (parentOrg?: Organization) => {
    setFormParentOrg(parentOrg || null)
    setFormEditOrg(null)
    onCreateOpen()
  }

  const handleEditOrganization = () => {
    if (!selectedOrganization) return
    setFormEditOrg(selectedOrganization)
    setFormParentOrg(null)
    onEditOpen()
  }

  const handleDeleteOrganization = async () => {
    if (!selectedOrganization) return
    
    if (!window.confirm(`Are you sure you want to deactivate "${selectedOrganization.name}"?`)) {
      return
    }

    try {
      await organizationsAPI.deleteOrganization(selectedOrganization.id)
      toast({
        title: 'Organization Deactivated',
        description: `${selectedOrganization.name} has been deactivated.`,
        status: 'success',
        duration: 3000,
        isClosable: true,
      })
      setSelectedOrganization(null)
      setOrganizationStats(null)
      setRefreshKey(prev => prev + 1)
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.response?.data?.error || 'Failed to deactivate organization',
        status: 'error',
        duration: 5000,
        isClosable: true,
      })
    }
  }

  const handleFormSuccess = () => {
    setRefreshKey(prev => prev + 1)
    // If we have a selected organization, refresh its data
    if (selectedOrganization) {
      handleSelectOrganization(selectedOrganization)
    }
  }

  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0 B'
    const k = 1024
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`
  }

  const getUsageColor = (used: number, limit?: number): string => {
    if (!limit) return 'green'
    const percentage = (used / limit) * 100
    if (percentage >= 90) return 'red'
    if (percentage >= 75) return 'orange'
    return 'green'
  }

  return (
    <Container maxW="full" p={6}>
      <VStack align="stretch" spacing={6}>
        {/* Header */}
        <Box>
          <Heading size="lg" mb={2}>Organization Management</Heading>
          <Text color="gray.600">Manage your organization hierarchy and settings</Text>
        </Box>

        {/* Main Content */}
        <Grid templateColumns={{ base: '1fr', lg: '300px 1fr' }} gap={6} minH="600px">
          {/* Left Panel - Organization Tree */}
          <GridItem>
            <Card>
              <CardBody>
                <HStack justify="space-between" mb={4}>
                  <Heading size="md">Organizations</Heading>
                  <Tooltip label="Create Root Organization">
                    <IconButton
                      aria-label="Create organization"
                      icon={<AddIcon />}
                      size="sm"
                      onClick={() => handleCreateOrganization()}
                    />
                  </Tooltip>
                </HStack>
                <Divider mb={4} />
                <OrganizationList
                  key={refreshKey}
                  onSelectOrganization={handleSelectOrganization}
                  onCreateOrganization={handleCreateOrganization}
                  selectedOrgId={selectedOrganization?.id}
                />
              </CardBody>
            </Card>
          </GridItem>

          {/* Right Panel - Organization Details */}
          <GridItem>
            {selectedOrganization ? (
              <VStack align="stretch" spacing={4}>
                {/* Organization Header */}
                <Card>
                  <CardBody>
                    <HStack justify="space-between">
                      <VStack align="start" spacing={2}>
                        <HStack>
                          <Heading size="md">{selectedOrganization.name}</Heading>
                          <Badge
                            colorScheme={
                              selectedOrganization.type === 'system' ? 'purple' :
                              selectedOrganization.type === 'distributor' ? 'green' :
                              selectedOrganization.type === 'dealer' ? 'blue' : 'orange'
                            }
                          >
                            {selectedOrganization.type.charAt(0).toUpperCase() + selectedOrganization.type.slice(1)}
                          </Badge>
                          {!selectedOrganization.is_active && (
                            <Badge colorScheme="red">Inactive</Badge>
                          )}
                        </HStack>
                        <Text fontSize="sm" color="gray.600">
                          Created: {new Date(selectedOrganization.created_at).toLocaleDateString()}
                        </Text>
                      </VStack>
                      
                      <HStack>
                        <Tooltip label="View Details">
                          <IconButton
                            aria-label="View organization"
                            icon={<ViewIcon />}
                            size="sm"
                          />
                        </Tooltip>
                        {selectedOrganization.type !== 'system' && (
                          <>
                            <Tooltip label="Edit Organization">
                              <IconButton
                                aria-label="Edit organization"
                                icon={<EditIcon />}
                                size="sm"
                                onClick={handleEditOrganization}
                              />
                            </Tooltip>
                            <Tooltip label="Deactivate Organization">
                              <IconButton
                                aria-label="Delete organization"
                                icon={<DeleteIcon />}
                                size="sm"
                                colorScheme="red"
                                variant="ghost"
                                onClick={handleDeleteOrganization}
                              />
                            </Tooltip>
                          </>
                        )}
                      </HStack>
                    </HStack>
                  </CardBody>
                </Card>

                {/* Organization Statistics */}
                {organizationStats ? (
                  <Card>
                    <CardBody>
                      <Heading size="sm" mb={4}>Statistics</Heading>
                      <Grid templateColumns="repeat(auto-fit, minmax(200px, 1fr))" gap={4}>
                        <Stat>
                          <StatLabel>Users</StatLabel>
                          <StatNumber color={getUsageColor(organizationStats.user_count, organizationStats.limits.max_users)}>
                            {organizationStats.user_count}
                            {organizationStats.limits.max_users && ` / ${organizationStats.limits.max_users}`}
                          </StatNumber>
                          <StatHelpText>Active users</StatHelpText>
                        </Stat>

                        <Stat>
                          <StatLabel>Email Accounts</StatLabel>
                          <StatNumber color={getUsageColor(organizationStats.email_account_count, organizationStats.limits.max_email_accounts)}>
                            {organizationStats.email_account_count}
                            {organizationStats.limits.max_email_accounts && ` / ${organizationStats.limits.max_email_accounts}`}
                          </StatNumber>
                          <StatHelpText>Connected accounts</StatHelpText>
                        </Stat>

                        <Stat>
                          <StatLabel>Total Emails</StatLabel>
                          <StatNumber>{organizationStats.total_emails.toLocaleString()}</StatNumber>
                          <StatHelpText>Backed up emails</StatHelpText>
                        </Stat>

                        <Stat>
                          <StatLabel>Storage Used</StatLabel>
                          <StatNumber color={getUsageColor(organizationStats.total_storage_mb, organizationStats.limits.max_storage_gb ? organizationStats.limits.max_storage_gb * 1024 : undefined)}>
                            {formatBytes(organizationStats.total_storage_bytes)}
                            {organizationStats.limits.max_storage_gb && ` / ${organizationStats.limits.max_storage_gb}GB`}
                          </StatNumber>
                          <StatHelpText>Total storage</StatHelpText>
                        </Stat>
                      </Grid>
                    </CardBody>
                  </Card>
                ) : (
                  statsLoading && (
                    <Card>
                      <CardBody>
                        <Text>Loading statistics...</Text>
                      </CardBody>
                    </Card>
                  )
                )}

                {/* Organization Limits */}
                {(selectedOrganization.max_users || selectedOrganization.max_storage_gb || selectedOrganization.max_email_accounts) && (
                  <Card>
                    <CardBody>
                      <Heading size="sm" mb={4}>Limits</Heading>
                      <VStack align="start" spacing={2}>
                        {selectedOrganization.max_users && (
                          <Text>Maximum Users: {selectedOrganization.max_users}</Text>
                        )}
                        {selectedOrganization.max_storage_gb && (
                          <Text>Maximum Storage: {selectedOrganization.max_storage_gb} GB</Text>
                        )}
                        {selectedOrganization.max_email_accounts && (
                          <Text>Maximum Email Accounts: {selectedOrganization.max_email_accounts}</Text>
                        )}
                      </VStack>
                    </CardBody>
                  </Card>
                )}
              </VStack>
            ) : (
              <Card>
                <CardBody>
                  <Alert status="info">
                    <AlertIcon />
                    Select an organization from the tree to view its details and manage it.
                  </Alert>
                </CardBody>
              </Card>
            )}
          </GridItem>
        </Grid>
      </VStack>

      {/* Modals */}
      <OrganizationForm
        isOpen={isCreateOpen}
        onClose={onCreateClose}
        onSuccess={handleFormSuccess}
        parentOrganization={formParentOrg}
      />

      <OrganizationForm
        isOpen={isEditOpen}
        onClose={onEditClose}
        onSuccess={handleFormSuccess}
        editOrganization={formEditOrg}
      />
    </Container>
  )
}

export default OrganizationManagement