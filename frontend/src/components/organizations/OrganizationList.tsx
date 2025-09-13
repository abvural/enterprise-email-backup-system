import React, { useState, useEffect } from 'react'
import {
  Box,
  VStack,
  HStack,
  Text,
  IconButton,
  Badge,
  Collapse,
  useDisclosure,
  Spinner,
  Alert,
  AlertIcon,
  Tooltip,
  useColorModeValue,
} from '@chakra-ui/react'
import { ChevronRightIcon, ChevronDownIcon, AddIcon } from '@chakra-ui/icons'
import { type Organization, organizationsAPI } from '../../services/api'

interface OrganizationListProps {
  onSelectOrganization?: (organization: Organization) => void
  onCreateOrganization?: (parentOrg?: Organization) => void
  selectedOrgId?: string
}

interface OrganizationTreeNodeProps {
  organization: Organization
  level: number
  onSelect?: (organization: Organization) => void
  onCreateChild?: (parentOrg: Organization) => void
  selectedOrgId?: string
  children?: Organization[]
}

const OrganizationTreeNode: React.FC<OrganizationTreeNodeProps> = ({
  organization,
  level,
  onSelect,
  onCreateChild,
  selectedOrgId,
  children = [],
}) => {
  const { isOpen, onToggle } = useDisclosure({ defaultIsOpen: level === 0 })
  const hasChildren = children.length > 0
  
  const bgColor = useColorModeValue('gray.50', 'gray.800')
  const selectedBgColor = useColorModeValue('blue.50', 'blue.900')
  const hoverBgColor = useColorModeValue('gray.100', 'gray.700')
  
  const isSelected = selectedOrgId === organization.id
  
  const getOrgTypeColor = (type: string) => {
    switch (type) {
      case 'system': return 'purple'
      case 'distributor': return 'green'
      case 'dealer': return 'blue'
      case 'client': return 'orange'
      default: return 'gray'
    }
  }
  
  const getOrgTypeLabel = (type: string) => {
    switch (type) {
      case 'system': return 'System'
      case 'distributor': return 'Distributor'
      case 'dealer': return 'Dealer'
      case 'client': return 'Client'
      default: return type
    }
  }

  return (
    <Box>
      <HStack
        spacing={2}
        p={2}
        pl={level * 4 + 2}
        bg={isSelected ? selectedBgColor : 'transparent'}
        _hover={{ bg: isSelected ? selectedBgColor : hoverBgColor }}
        borderRadius="md"
        cursor="pointer"
        onClick={() => onSelect?.(organization)}
      >
        <Box w={4}>
          {hasChildren ? (
            <IconButton
              aria-label={isOpen ? 'Collapse' : 'Expand'}
              icon={isOpen ? <ChevronDownIcon /> : <ChevronRightIcon />}
              size="xs"
              variant="ghost"
              onClick={(e) => {
                e.stopPropagation()
                onToggle()
              }}
            />
          ) : (
            <Box w="24px" />
          )}
        </Box>
        
        <VStack flex={1} align="start" spacing={1}>
          <HStack spacing={2} flex={1}>
            <Text fontWeight={isSelected ? 'bold' : 'medium'} fontSize="sm">
              {organization.name}
            </Text>
            <Badge colorScheme={getOrgTypeColor(organization.type)} size="sm">
              {getOrgTypeLabel(organization.type)}
            </Badge>
            {!organization.is_active && (
              <Badge colorScheme="red" size="sm">
                Inactive
              </Badge>
            )}
          </HStack>
          
          <HStack spacing={4} fontSize="xs" color="gray.500">
            {organization.max_users && (
              <Text>Max Users: {organization.max_users}</Text>
            )}
            {organization.max_storage_gb && (
              <Text>Max Storage: {organization.max_storage_gb}GB</Text>
            )}
            {organization.max_email_accounts && (
              <Text>Max Accounts: {organization.max_email_accounts}</Text>
            )}
          </HStack>
        </VStack>
        
        {onCreateChild && organization.type !== 'client' && (
          <Tooltip label="Add Child Organization">
            <IconButton
              aria-label="Add child organization"
              icon={<AddIcon />}
              size="xs"
              variant="ghost"
              onClick={(e) => {
                e.stopPropagation()
                onCreateChild(organization)
              }}
            />
          </Tooltip>
        )}
      </HStack>
      
      {hasChildren && (
        <Collapse in={isOpen}>
          <Box>
            {children.map((child) => (
              <OrganizationTreeNode
                key={child.id}
                organization={child}
                level={level + 1}
                onSelect={onSelect}
                onCreateChild={onCreateChild}
                selectedOrgId={selectedOrgId}
                children={child.child_orgs}
              />
            ))}
          </Box>
        </Collapse>
      )}
    </Box>
  )
}

export const OrganizationList: React.FC<OrganizationListProps> = ({
  onSelectOrganization,
  onCreateOrganization,
  selectedOrgId,
}) => {
  const [organizations, setOrganizations] = useState<Organization[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadOrganizations()
  }, [])

  const loadOrganizations = async () => {
    try {
      setLoading(true)
      setError(null)
      const response = await organizationsAPI.getOrganizations()
      setOrganizations(response.data)
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to load organizations')
    } finally {
      setLoading(false)
    }
  }

  // Build hierarchy from flat list
  const buildHierarchy = (orgs: Organization[]): Organization[] => {
    const orgMap = new Map<string, Organization>()
    const roots: Organization[] = []

    // First pass: create map and initialize child_orgs
    orgs.forEach(org => {
      orgMap.set(org.id, { ...org, child_orgs: [] })
    })

    // Second pass: build hierarchy
    orgs.forEach(org => {
      const orgWithChildren = orgMap.get(org.id)!
      if (org.parent_org_id) {
        const parent = orgMap.get(org.parent_org_id)
        if (parent) {
          parent.child_orgs = parent.child_orgs || []
          parent.child_orgs.push(orgWithChildren)
        }
      } else {
        roots.push(orgWithChildren)
      }
    })

    return roots
  }

  const hierarchicalOrgs = buildHierarchy(organizations)

  if (loading) {
    return (
      <Box p={4} textAlign="center">
        <Spinner />
        <Text mt={2}>Loading organizations...</Text>
      </Box>
    )
  }

  if (error) {
    return (
      <Alert status="error">
        <AlertIcon />
        {error}
      </Alert>
    )
  }

  if (organizations.length === 0) {
    return (
      <Box p={4} textAlign="center">
        <Text>No organizations found</Text>
      </Box>
    )
  }

  return (
    <Box>
      <VStack align="stretch" spacing={1}>
        {hierarchicalOrgs.map((org) => (
          <OrganizationTreeNode
            key={org.id}
            organization={org}
            level={0}
            onSelect={onSelectOrganization}
            onCreateChild={onCreateOrganization}
            selectedOrgId={selectedOrgId}
            children={org.child_orgs}
          />
        ))}
      </VStack>
    </Box>
  )
}

export default OrganizationList