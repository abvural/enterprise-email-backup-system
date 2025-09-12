// API Configuration
export const API_CONFIG = {
  BASE_URL: 'http://localhost:8080',
  TIMEOUT: 30000,
  RETRY_ATTEMPTS: 3,
} as const

// Local Storage Keys
export const STORAGE_KEYS = {
  AUTH_TOKEN: 'auth_token',
  USER_PREFERENCES: 'user_preferences',
  THEME_MODE: 'chakra-ui-color-mode',
} as const

// Application Routes
export const ROUTES = {
  LOGIN: '/login',
  DASHBOARD: '/dashboard',
  ACCOUNTS: '/accounts',
  EMAILS: '/emails',
  SETTINGS: '/settings',
  PROFILE: '/profile',
} as const

// Email Providers
export const EMAIL_PROVIDERS = {
  GMAIL: 'gmail',
  EXCHANGE: 'exchange',
  OUTLOOK: 'outlook',
} as const

// Sync Status
export const SYNC_STATUS = {
  IDLE: 'idle',
  SYNCING: 'syncing',
  SUCCESS: 'success',
  ERROR: 'error',
} as const

// Notification Types
export const NOTIFICATION_TYPES = {
  SUCCESS: 'success',
  ERROR: 'error',
  WARNING: 'warning',
  INFO: 'info',
} as const

// Pagination Defaults
export const PAGINATION = {
  DEFAULT_PAGE: 1,
  DEFAULT_LIMIT: 20,
  MAX_LIMIT: 100,
} as const

// File Size Limits
export const FILE_LIMITS = {
  MAX_ATTACHMENT_SIZE: 25 * 1024 * 1024, // 25MB
  MAX_EMAIL_SIZE: 50 * 1024 * 1024, // 50MB
} as const

// Date Formats
export const DATE_FORMATS = {
  DISPLAY: 'MMM DD, YYYY',
  DISPLAY_WITH_TIME: 'MMM DD, YYYY HH:mm',
  ISO: 'YYYY-MM-DDTHH:mm:ss.SSSZ',
  TIME_ONLY: 'HH:mm',
} as const

// Microsoft Office 365 Colors
export const OFFICE_COLORS = {
  PRIMARY_BLUE: '#0078D4',
  SECONDARY_BLUE: '#106EBE',
  LIGHT_BLUE: '#E3F2FD',
  SUCCESS_GREEN: '#107C10',
  WARNING_ORANGE: '#FF8C00',
  ERROR_RED: '#D13438',
  NEUTRAL_GRAY: '#605E5C',
  BACKGROUND_GRAY: '#F3F2F1',
} as const

// Email Folders
export const EMAIL_FOLDERS = {
  INBOX: 'INBOX',
  SENT: 'Sent',
  DRAFTS: 'Drafts',
  TRASH: 'Trash',
  SPAM: 'Spam',
  ARCHIVE: 'Archive',
} as const

// Form Validation
export const VALIDATION = {
  EMAIL_REGEX: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  PASSWORD_MIN_LENGTH: 6,
  PASSWORD_MAX_LENGTH: 128,
  USERNAME_MIN_LENGTH: 3,
  USERNAME_MAX_LENGTH: 50,
} as const

// Feature Flags (for MVP)
export const FEATURES = {
  DARK_MODE: true,
  EMAIL_COMPOSE: false, // Not in MVP
  REAL_TIME_SYNC: false, // Not in MVP
  ADVANCED_SEARCH: false, // Not in MVP
  EMAIL_RULES: false, // Not in MVP
  EXPORT_EMAILS: false, // Not in MVP
} as const

// Error Messages
export const ERROR_MESSAGES = {
  NETWORK_ERROR: 'Network error. Please check your connection and try again.',
  UNAUTHORIZED: 'You are not authorized to perform this action.',
  FORBIDDEN: 'Access forbidden. Please check your permissions.',
  NOT_FOUND: 'The requested resource was not found.',
  SERVER_ERROR: 'Server error. Please try again later.',
  VALIDATION_ERROR: 'Please check your input and try again.',
  UNKNOWN_ERROR: 'An unexpected error occurred. Please try again.',
} as const

// Success Messages
export const SUCCESS_MESSAGES = {
  LOGIN: 'Successfully logged in!',
  LOGOUT: 'Successfully logged out!',
  REGISTER: 'Account created successfully!',
  ACCOUNT_ADDED: 'Email account added successfully!',
  SYNC_COMPLETE: 'Email synchronization completed!',
  SETTINGS_SAVED: 'Settings saved successfully!',
} as const

// Loading Messages
export const LOADING_MESSAGES = {
  AUTHENTICATING: 'Authenticating...',
  LOADING_ACCOUNTS: 'Loading email accounts...',
  LOADING_EMAILS: 'Loading emails...',
  SYNCING_EMAILS: 'Syncing emails...',
  SAVING_SETTINGS: 'Saving settings...',
  CONNECTING: 'Connecting to email server...',
} as const

// Breakpoints (Chakra UI compatible)
export const BREAKPOINTS = {
  SM: '30em', // 480px
  MD: '48em', // 768px
  LG: '62em', // 992px
  XL: '80em', // 1280px
  '2XL': '96em', // 1536px
} as const

// Animation Durations
export const ANIMATIONS = {
  FAST: 0.15,
  NORMAL: 0.2,
  SLOW: 0.3,
} as const