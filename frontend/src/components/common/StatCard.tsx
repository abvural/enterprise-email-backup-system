import React from 'react'
import {
  Box,
  Card,
  CardBody,
  Flex,
  VStack,
  HStack,
  Text,
  Icon,
  Progress,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  StatArrow,
  useColorModeValue,
} from '@chakra-ui/react'
import { type IconType } from 'react-icons'
import { FiUsers, FiMail, FiHardDrive, FiActivity, FiTrendingUp } from 'react-icons/fi'

// Office 365 style statistic card props
export interface StatCardProps {
  title: string
  value: string | number
  icon: IconType
  color?: string
  helpText?: string
  change?: number
  changeLabel?: string
  trend?: 'up' | 'down' | 'neutral'
  loading?: boolean
  onClick?: () => void
  size?: 'sm' | 'md' | 'lg'
  variant?: 'default' | 'highlight' | 'minimal'
}

// Office 365 style statistic card component
export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  icon,
  color = 'blue.500',
  helpText,
  change,
  changeLabel,
  trend = 'neutral',
  loading = false,
  onClick,
  size = 'md',
  variant = 'default',
}) => {
  const cardBg = useColorModeValue('white', 'gray.800')
  const textColor = useColorModeValue('gray.700', 'gray.200')
  const mutedColor = useColorModeValue('gray.500', 'gray.400')
  const iconBg = useColorModeValue(`${color.split('.')[0]}.50`, `${color.split('.')[0]}.900`)

  // Size configurations
  const sizeConfig = {
    sm: {
      cardPadding: 4,
      iconSize: 4,
      titleSize: 'xs',
      valueSize: 'lg',
      helpSize: 'xs',
    },
    md: {
      cardPadding: 6,
      iconSize: 5,
      titleSize: 'sm',
      valueSize: 'xl',
      helpSize: 'xs',
    },
    lg: {
      cardPadding: 8,
      iconSize: 6,
      titleSize: 'md',
      valueSize: '2xl',
      helpSize: 'sm',
    },
  }

  const config = sizeConfig[size]

  // Variant configurations
  const getVariantProps = () => {
    switch (variant) {
      case 'highlight':
        return {
          bg: iconBg,
          borderColor: color,
          borderWidth: '2px',
        }
      case 'minimal':
        return {
          bg: cardBg,
          border: 'none',
          boxShadow: 'none',
        }
      default:
        return {
          bg: cardBg,
        }
    }
  }

  const formatValue = (val: string | number): string => {
    if (typeof val === 'number') {
      if (val >= 1000000) {
        return `${(val / 1000000).toFixed(1)}M`
      }
      if (val >= 1000) {
        return `${(val / 1000).toFixed(1)}K`
      }
      return val.toLocaleString()
    }
    return val
  }

  const getTrendColor = () => {
    switch (trend) {
      case 'up':
        return 'green.500'
      case 'down':
        return 'red.500'
      default:
        return mutedColor
    }
  }

  return (
    <Card
      {...getVariantProps()}
      cursor={onClick ? 'pointer' : 'default'}
      onClick={onClick}
      transition="all 0.1s ease-in-out"
      _hover={onClick ? {
        transform: 'translateY(-2px)',
        boxShadow: 'md',
      } : {}}
    >
      <CardBody p={config.cardPadding}>
        <Flex justify="space-between" align="flex-start" h="full">
          <VStack align="flex-start" spacing={2} flex={1}>
            {/* Title */}
            <Text
              fontSize={config.titleSize}
              color={mutedColor}
              fontWeight="semibold"
              textTransform="uppercase"
              letterSpacing="wide"
              lineHeight="1.2"
            >
              {title}
            </Text>

            {/* Value */}
            <Stat>
              <StatNumber
                fontSize={config.valueSize}
                fontWeight="bold"
                color={textColor}
                lineHeight="1.1"
              >
                {loading ? (
                  <Box>
                    <Progress size="sm" colorScheme="blue" isIndeterminate borderRadius="md" />
                  </Box>
                ) : (
                  formatValue(value)
                )}
              </StatNumber>

              {/* Help text */}
              {helpText && (
                <StatHelpText
                  fontSize={config.helpSize}
                  color={mutedColor}
                  mt={1}
                  mb={0}
                >
                  {helpText}
                </StatHelpText>
              )}

              {/* Change indicator */}
              {change !== undefined && !loading && (
                <StatHelpText
                  fontSize={config.helpSize}
                  color={getTrendColor()}
                  mt={1}
                  mb={0}
                >
                  <HStack spacing={1} align="center">
                    <StatArrow 
                      type={trend === 'up' ? 'increase' : trend === 'down' ? 'decrease' : undefined} 
                    />
                    <Text as="span" fontWeight="medium">
                      {Math.abs(change)}%
                    </Text>
                    {changeLabel && (
                      <Text as="span" color={mutedColor}>
                        {changeLabel}
                      </Text>
                    )}
                  </HStack>
                </StatHelpText>
              )}
            </Stat>
          </VStack>

          {/* Icon */}
          <Box
            p={3}
            borderRadius="lg"
            bg={iconBg}
            flexShrink={0}
            ml={4}
          >
            <Icon
              as={icon}
              boxSize={config.iconSize}
              color={color}
            />
          </Box>
        </Flex>
      </CardBody>
    </Card>
  )
}

// Pre-configured stat cards for common metrics
export const UserStatCard: React.FC<Omit<StatCardProps, 'icon' | 'color'>> = (props) => (
  <StatCard {...props} icon={FiUsers} color="blue.500" />
)

export const EmailStatCard: React.FC<Omit<StatCardProps, 'icon' | 'color'>> = (props) => (
  <StatCard {...props} icon={FiMail} color="purple.500" />
)

export const StorageStatCard: React.FC<Omit<StatCardProps, 'icon' | 'color'>> = (props) => (
  <StatCard {...props} icon={FiHardDrive} color="orange.500" />
)

export const ActivityStatCard: React.FC<Omit<StatCardProps, 'icon' | 'color'>> = (props) => (
  <StatCard {...props} icon={FiActivity} color="green.500" />
)

export const TrendStatCard: React.FC<Omit<StatCardProps, 'icon' | 'color'>> = (props) => (
  <StatCard {...props} icon={FiTrendingUp} color="teal.500" />
)

export default StatCard