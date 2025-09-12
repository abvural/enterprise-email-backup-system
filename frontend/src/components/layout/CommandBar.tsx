import {
  HStack,
  IconButton,
  Input,
  InputGroup,
  InputLeftElement,
  Tooltip,
  ButtonGroup,
  useColorModeValue,
  Box,
} from '@chakra-ui/react'
import { 
  FiSearch,
  FiRefreshCw,
  FiPlus,
  FiTrash2,
  FiFilter,
} from 'react-icons/fi'

interface CommandBarProps {
  onNew?: () => void
  onRefresh?: () => void
  onDelete?: () => void
  onFilter?: () => void
  searchValue?: string
  onSearchChange?: (value: string) => void
  searchPlaceholder?: string
  showSearch?: boolean
  compact?: boolean
}

export const CommandBar = ({ 
  onNew,
  onRefresh,
  onDelete,
  onFilter,
  searchValue = '',
  onSearchChange,
  searchPlaceholder = 'Search',
  showSearch = true,
  compact = false,
}: CommandBarProps) => {
  const bgColor = useColorModeValue('white', 'gray.800')
  const borderColor = useColorModeValue('gray.200', 'gray.700')

  return (
    <Box
      px={compact ? 4 : 6}
      py={compact ? 2 : 3}
      bg={bgColor}
      borderBottom="1px"
      borderColor={borderColor}
    >
      <HStack spacing={3} justify="space-between">
        {/* Search */}
        {showSearch && (
          <InputGroup maxW={compact ? "250px" : "350px"} size={compact ? "sm" : "md"}>
            <InputLeftElement pointerEvents="none">
              <FiSearch size={14} color="gray" />
            </InputLeftElement>
            <Input
              placeholder={searchPlaceholder}
              value={searchValue}
              onChange={(e) => onSearchChange?.(e.target.value)}
              bg="gray.50"
              border="1px"
              borderColor="gray.200"
              borderRadius="6px"
              fontSize="sm"
              _focus={{
                borderColor: 'gray.400',
                boxShadow: 'none',
                bg: 'white',
              }}
              _placeholder={{
                color: 'gray.500',
              }}
            />
          </InputGroup>
        )}

        {/* Actions */}
        <HStack spacing={1}>
          <ButtonGroup size={compact ? "sm" : "md"} variant="ghost" spacing={0}>
            {onNew && (
              <Tooltip label="New" placement="bottom">
                <IconButton
                  aria-label="New"
                  icon={<FiPlus size={16} />}
                  onClick={onNew}
                  color="gray.600"
                  _hover={{
                    bg: 'gray.50',
                    color: 'gray.900',
                  }}
                  transition="all 0.15s ease"
                />
              </Tooltip>
            )}
            
            {onRefresh && (
              <Tooltip label="Refresh" placement="bottom">
                <IconButton
                  aria-label="Refresh"
                  icon={<FiRefreshCw size={16} />}
                  onClick={onRefresh}
                  color="gray.600"
                  _hover={{
                    bg: 'gray.50',
                    color: 'gray.900',
                  }}
                  transition="all 0.15s ease"
                />
              </Tooltip>
            )}
            
            {onDelete && (
              <Tooltip label="Delete" placement="bottom">
                <IconButton
                  aria-label="Delete"
                  icon={<FiTrash2 size={16} />}
                  onClick={onDelete}
                  color="gray.600"
                  _hover={{
                    bg: 'red.50',
                    color: 'red.600',
                  }}
                  transition="all 0.15s ease"
                />
              </Tooltip>
            )}
            
            {onFilter && (
              <Tooltip label="Filter" placement="bottom">
                <IconButton
                  aria-label="Filter"
                  icon={<FiFilter size={16} />}
                  onClick={onFilter}
                  color="gray.600"
                  _hover={{
                    bg: 'gray.50',
                    color: 'gray.900',
                  }}
                  transition="all 0.15s ease"
                />
              </Tooltip>
            )}
          </ButtonGroup>
        </HStack>
      </HStack>
    </Box>
  )
}