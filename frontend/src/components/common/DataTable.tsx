import React, { useState, useMemo } from 'react'
import {
  Box,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  TableContainer,
  Card,
  CardBody,
  CardHeader,
  Flex,
  HStack,
  VStack,
  Text,
  IconButton,
  Button,
  Input,
  InputGroup,
  InputLeftElement,
  Select,
  Badge,
  Checkbox,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  Spinner,
  Alert,
  AlertIcon,
  useColorModeValue,
  Tooltip,
} from '@chakra-ui/react'
import {
  FiChevronUp,
  FiChevronDown,
  FiSearch,
  FiMoreVertical,
  FiFilter,
  FiDownload,
  FiRefreshCw,
  FiChevronLeft,
  FiChevronRight,
} from 'react-icons/fi'

// Column definition interface
export interface TableColumn<T = any> {
  key: string
  title: string
  sortable?: boolean
  filterable?: boolean
  width?: string | number
  render?: (value: any, row: T, index: number) => React.ReactNode
  align?: 'left' | 'center' | 'right'
}

// Table action interface
export interface TableAction<T = any> {
  key: string
  label: string
  icon?: React.ElementType
  color?: string
  onClick: (row: T) => void
  disabled?: (row: T) => boolean
  hidden?: (row: T) => boolean
}

// Data table props
export interface DataTableProps<T = any> {
  data: T[]
  columns: TableColumn<T>[]
  loading?: boolean
  error?: string
  title?: string
  subtitle?: string
  searchable?: boolean
  sortable?: boolean
  filterable?: boolean
  selectable?: boolean
  pagination?: boolean
  pageSize?: number
  actions?: TableAction<T>[]
  bulkActions?: TableAction<T[]>[]
  onRefresh?: () => void
  onExport?: () => void
  emptyMessage?: string
  height?: string
  variant?: 'simple' | 'striped' | 'outline'
}

// Office 365 style data table component
export function DataTable<T = any>({
  data,
  columns,
  loading = false,
  error,
  title,
  subtitle,
  searchable = true,
  sortable = true,
  filterable = false,
  selectable = false,
  pagination = true,
  pageSize = 10,
  actions = [],
  bulkActions = [],
  onRefresh,
  onExport,
  emptyMessage = 'No data available',
  height,
  variant = 'simple',
}: DataTableProps<T>) {
  const [searchTerm, setSearchTerm] = useState('')
  const [sortConfig, setSortConfig] = useState<{
    key: string
    direction: 'asc' | 'desc'
  } | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [selectedRows, setSelectedRows] = useState<Set<number>>(new Set())
  const [filterValues, setFilterValues] = useState<Record<string, string>>({})

  // Color mode values
  const cardBg = useColorModeValue('white', 'gray.800')
  const borderColor = useColorModeValue('gray.200', 'gray.600')
  const hoverBg = useColorModeValue('blue.50', 'blue.900')
  const selectedBg = useColorModeValue('blue.100', 'blue.800')

  // Filter and search data
  const filteredData = useMemo(() => {
    let filtered = [...data]

    // Apply search
    if (searchTerm) {
      filtered = filtered.filter(row =>
        columns.some(col => {
          const value = (row as any)[col.key]
          return String(value || '').toLowerCase().includes(searchTerm.toLowerCase())
        })
      )
    }

    // Apply column filters
    Object.entries(filterValues).forEach(([key, value]) => {
      if (value) {
        filtered = filtered.filter(row => {
          const rowValue = String((row as any)[key] || '').toLowerCase()
          return rowValue.includes(value.toLowerCase())
        })
      }
    })

    return filtered
  }, [data, searchTerm, filterValues, columns])

  // Sort data
  const sortedData = useMemo(() => {
    if (!sortConfig) return filteredData

    return [...filteredData].sort((a, b) => {
      const aValue = (a as any)[sortConfig.key]
      const bValue = (b as any)[sortConfig.key]

      if (aValue < bValue) {
        return sortConfig.direction === 'asc' ? -1 : 1
      }
      if (aValue > bValue) {
        return sortConfig.direction === 'asc' ? 1 : -1
      }
      return 0
    })
  }, [filteredData, sortConfig])

  // Paginate data
  const paginatedData = useMemo(() => {
    if (!pagination) return sortedData

    const startIndex = (currentPage - 1) * pageSize
    const endIndex = startIndex + pageSize
    return sortedData.slice(startIndex, endIndex)
  }, [sortedData, currentPage, pageSize, pagination])

  const totalPages = Math.ceil(sortedData.length / pageSize)

  // Handle sorting
  const handleSort = (key: string) => {
    if (!sortable) return

    const column = columns.find(col => col.key === key)
    if (!column?.sortable) return

    setSortConfig(current => {
      if (current?.key === key) {
        if (current.direction === 'asc') {
          return { key, direction: 'desc' }
        }
        return null
      }
      return { key, direction: 'asc' }
    })
  }

  // Handle row selection
  const handleRowSelect = (index: number) => {
    const newSelected = new Set(selectedRows)
    if (newSelected.has(index)) {
      newSelected.delete(index)
    } else {
      newSelected.add(index)
    }
    setSelectedRows(newSelected)
  }

  const handleSelectAll = () => {
    if (selectedRows.size === paginatedData.length) {
      setSelectedRows(new Set())
    } else {
      setSelectedRows(new Set(paginatedData.map((_, index) => index)))
    }
  }

  // Render cell content
  const renderCell = (column: TableColumn<T>, row: T, rowIndex: number) => {
    const value = (row as any)[column.key]
    
    if (column.render) {
      return column.render(value, row, rowIndex)
    }

    // Default rendering based on value type
    if (typeof value === 'boolean') {
      return (
        <Badge colorScheme={value ? 'green' : 'red'} size="sm">
          {value ? 'Active' : 'Inactive'}
        </Badge>
      )
    }

    if (value instanceof Date) {
      return value.toLocaleDateString()
    }

    return String(value || '')
  }

  return (
    <Card bg={cardBg} borderColor={borderColor}>
      {/* Header */}
      {(title || subtitle || searchable || onRefresh || onExport) && (
        <CardHeader pb={4}>
          <Flex justify="space-between" align="flex-start" mb={4}>
            <VStack align="flex-start" spacing={1}>
              {title && (
                <Text fontSize="lg" fontWeight="bold" color="gray.700">
                  {title}
                </Text>
              )}
              {subtitle && (
                <Text fontSize="sm" color="gray.500">
                  {subtitle}
                </Text>
              )}
            </VStack>

            <HStack spacing={2}>
              {onRefresh && (
                <Tooltip label="Refresh data">
                  <IconButton
                    aria-label="Refresh"
                    icon={<FiRefreshCw />}
                    size="sm"
                    variant="ghost"
                    onClick={onRefresh}
                    isLoading={loading}
                  />
                </Tooltip>
              )}
              
              {onExport && (
                <Tooltip label="Export data">
                  <IconButton
                    aria-label="Export"
                    icon={<FiDownload />}
                    size="sm"
                    variant="ghost"
                    onClick={onExport}
                  />
                </Tooltip>
              )}

              {filterable && (
                <Tooltip label="Filter data">
                  <IconButton
                    aria-label="Filter"
                    icon={<FiFilter />}
                    size="sm"
                    variant="ghost"
                  />
                </Tooltip>
              )}
            </HStack>
          </Flex>

          {/* Search and bulk actions */}
          <Flex gap={4} align="center" wrap="wrap">
            {searchable && (
              <InputGroup maxW="300px">
                <InputLeftElement>
                  <FiSearch color="gray" />
                </InputLeftElement>
                <Input
                  placeholder="Search..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  size="sm"
                />
              </InputGroup>
            )}

            {selectedRows.size > 0 && bulkActions.length > 0 && (
              <HStack spacing={2}>
                <Text fontSize="sm" color="gray.600">
                  {selectedRows.size} selected
                </Text>
                {bulkActions.map(action => (
                  <Button
                    key={action.key}
                    size="sm"
                    variant="outline"
                    leftIcon={action.icon ? <action.icon /> : undefined}
                    onClick={() => {
                      const selectedData = Array.from(selectedRows).map(i => paginatedData[i])
                      action.onClick(selectedData)
                    }}
                  >
                    {action.label}
                  </Button>
                ))}
              </HStack>
            )}
          </Flex>
        </CardHeader>
      )}

      <CardBody pt={0}>
        {/* Error state */}
        {error && (
          <Alert status="error" mb={4} borderRadius="md">
            <AlertIcon />
            {error}
          </Alert>
        )}

        {/* Table */}
        <TableContainer height={height} overflowY="auto">
          <Table variant={variant} size="sm">
            <Thead position="sticky" top={0} bg={cardBg} zIndex={1}>
              <Tr>
                {selectable && (
                  <Th width="40px" border="none">
                    <Checkbox
                      isChecked={selectedRows.size === paginatedData.length && paginatedData.length > 0}
                      isIndeterminate={selectedRows.size > 0 && selectedRows.size < paginatedData.length}
                      onChange={handleSelectAll}
                    />
                  </Th>
                )}

                {columns.map(column => (
                  <Th
                    key={column.key}
                    width={column.width}
                    textAlign={column.align}
                    cursor={sortable && column.sortable ? 'pointer' : 'default'}
                    onClick={() => handleSort(column.key)}
                    _hover={sortable && column.sortable ? { bg: hoverBg } : {}}
                    border="none"
                    color="gray.600"
                    fontSize="xs"
                    fontWeight="bold"
                    textTransform="uppercase"
                    letterSpacing="wider"
                  >
                    <HStack spacing={2} justify={column.align === 'right' ? 'flex-end' : column.align === 'center' ? 'center' : 'flex-start'}>
                      <Text>{column.title}</Text>
                      {sortable && column.sortable && sortConfig?.key === column.key && (
                        <Box>
                          {sortConfig.direction === 'asc' ? <FiChevronUp /> : <FiChevronDown />}
                        </Box>
                      )}
                    </HStack>
                  </Th>
                ))}

                {actions.length > 0 && (
                  <Th width="60px" border="none" />
                )}
              </Tr>
            </Thead>

            <Tbody>
              {loading ? (
                <Tr>
                  <Td colSpan={columns.length + (selectable ? 1 : 0) + (actions.length > 0 ? 1 : 0)} textAlign="center" py={8}>
                    <VStack spacing={3}>
                      <Spinner size="lg" color="blue.500" />
                      <Text color="gray.500">Loading...</Text>
                    </VStack>
                  </Td>
                </Tr>
              ) : paginatedData.length === 0 ? (
                <Tr>
                  <Td colSpan={columns.length + (selectable ? 1 : 0) + (actions.length > 0 ? 1 : 0)} textAlign="center" py={8}>
                    <Text color="gray.500">{emptyMessage}</Text>
                  </Td>
                </Tr>
              ) : (
                paginatedData.map((row, index) => (
                  <Tr
                    key={index}
                    _hover={{ bg: hoverBg }}
                    bg={selectedRows.has(index) ? selectedBg : undefined}
                    transition="background 0.1s"
                  >
                    {selectable && (
                      <Td>
                        <Checkbox
                          isChecked={selectedRows.has(index)}
                          onChange={() => handleRowSelect(index)}
                        />
                      </Td>
                    )}

                    {columns.map(column => (
                      <Td key={column.key} textAlign={column.align}>
                        {renderCell(column, row, index)}
                      </Td>
                    ))}

                    {actions.length > 0 && (
                      <Td>
                        <Menu>
                          <MenuButton
                            as={IconButton}
                            icon={<FiMoreVertical />}
                            variant="ghost"
                            size="sm"
                            aria-label="Actions"
                          />
                          <MenuList>
                            {actions.map(action => {
                              const isDisabled = action.disabled?.(row)
                              const isHidden = action.hidden?.(row)
                              
                              if (isHidden) return null

                              return (
                                <MenuItem
                                  key={action.key}
                                  icon={action.icon ? <action.icon /> : undefined}
                                  onClick={() => action.onClick(row)}
                                  isDisabled={isDisabled}
                                  color={action.color}
                                >
                                  {action.label}
                                </MenuItem>
                              )
                            })}
                          </MenuList>
                        </Menu>
                      </Td>
                    )}
                  </Tr>
                ))
              )}
            </Tbody>
          </Table>
        </TableContainer>

        {/* Pagination */}
        {pagination && totalPages > 1 && (
          <Flex justify="space-between" align="center" mt={4} pt={4} borderTop="1px" borderColor={borderColor}>
            <Text fontSize="sm" color="gray.600">
              Showing {((currentPage - 1) * pageSize) + 1} to {Math.min(currentPage * pageSize, sortedData.length)} of {sortedData.length} entries
            </Text>

            <HStack spacing={2}>
              <IconButton
                aria-label="Previous page"
                icon={<FiChevronLeft />}
                size="sm"
                variant="outline"
                onClick={() => setCurrentPage(current => Math.max(1, current - 1))}
                isDisabled={currentPage === 1}
              />
              
              <Text fontSize="sm" color="gray.600">
                {currentPage} of {totalPages}
              </Text>

              <IconButton
                aria-label="Next page"
                icon={<FiChevronRight />}
                size="sm"
                variant="outline"
                onClick={() => setCurrentPage(current => Math.min(totalPages, current + 1))}
                isDisabled={currentPage === totalPages}
              />
            </HStack>
          </Flex>
        )}
      </CardBody>
    </Card>
  )
}

export default DataTable