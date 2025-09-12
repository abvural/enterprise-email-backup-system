// Date formatting utilities
export const formatDate = (dateString: string | Date): string => {
  const date = new Date(dateString)
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

export const formatDateTime = (dateString: string | Date): string => {
  const date = new Date(dateString)
  return date.toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export const formatTime = (dateString: string | Date): string => {
  const date = new Date(dateString)
  return date.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
  })
}

export const formatRelativeTime = (dateString: string | Date): string => {
  const date = new Date(dateString)
  const now = new Date()
  const diff = now.getTime() - date.getTime()
  
  const seconds = Math.floor(diff / 1000)
  const minutes = Math.floor(seconds / 60)
  const hours = Math.floor(minutes / 60)
  const days = Math.floor(hours / 24)
  const weeks = Math.floor(days / 7)
  const months = Math.floor(days / 30)
  const years = Math.floor(days / 365)

  if (seconds < 60) {
    return 'Just now'
  } else if (minutes < 60) {
    return `${minutes} minute${minutes !== 1 ? 's' : ''} ago`
  } else if (hours < 24) {
    return `${hours} hour${hours !== 1 ? 's' : ''} ago`
  } else if (days < 7) {
    return `${days} day${days !== 1 ? 's' : ''} ago`
  } else if (weeks < 4) {
    return `${weeks} week${weeks !== 1 ? 's' : ''} ago`
  } else if (months < 12) {
    return `${months} month${months !== 1 ? 's' : ''} ago`
  } else {
    return `${years} year${years !== 1 ? 's' : ''} ago`
  }
}

// Smart date formatter - shows time if today, date if this week, full date otherwise
export const formatSmartDate = (dateString: string | Date): string => {
  const date = new Date(dateString)
  const now = new Date()
  const diffInDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24))

  if (diffInDays === 0) {
    // Today - show time
    return formatTime(date)
  } else if (diffInDays < 7) {
    // This week - show day name
    return date.toLocaleDateString('en-US', { weekday: 'short' })
  } else if (diffInDays < 365) {
    // This year - show month and day
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  } else {
    // Older - show full date
    return formatDate(date)
  }
}

// File size formatting
export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 B'
  
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`
}

// Email address formatting
export const formatEmailAddress = (email: string, name?: string): string => {
  if (name && name.trim() !== '') {
    return `${name} <${email}>`
  }
  return email
}

export const getEmailInitials = (email: string, name?: string): string => {
  if (name && name.trim() !== '') {
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }
  
  const username = email.split('@')[0]
  return username.slice(0, 2).toUpperCase()
}

// Text utilities
export const truncateText = (text: string, maxLength: number): string => {
  if (text.length <= maxLength) return text
  return `${text.substring(0, maxLength)}...`
}

export const capitalizeFirst = (text: string): string => {
  return text.charAt(0).toUpperCase() + text.slice(1).toLowerCase()
}

// Number formatting
export const formatNumber = (num: number): string => {
  return new Intl.NumberFormat('en-US').format(num)
}

export const formatPercent = (num: number): string => {
  return `${Math.round(num * 100)}%`
}

// Provider utilities
export const getProviderDisplayName = (provider: string): string => {
  switch (provider.toLowerCase()) {
    case 'gmail':
      return 'Gmail'
    case 'exchange':
      return 'Exchange'
    case 'outlook':
      return 'Outlook'
    default:
      return capitalizeFirst(provider)
  }
}

export const getProviderColor = (provider: string): string => {
  switch (provider.toLowerCase()) {
    case 'gmail':
      return '#EA4335'
    case 'exchange':
    case 'outlook':
      return '#0078D4'
    default:
      return '#718096'
  }
}

// Validation utilities
export const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

export const isValidUrl = (url: string): boolean => {
  try {
    new URL(url)
    return true
  } catch {
    return false
  }
}