import { extendTheme } from '@chakra-ui/react'

// Linear/Notion style color palette - Ultra minimal and clean
const colors = {
  linear: {
    // Primary grayscale palette (main colors used)
    gray: {
      50: '#fafafa',   // Subtle background
      100: '#f4f4f5',  // Card backgrounds
      200: '#e4e4e7',  // Borders
      300: '#d4d4d8',  // Dividers
      400: '#a1a1aa',  // Icons
      500: '#71717a',  // Muted text
      600: '#52525b',  // Secondary text
      700: '#3f3f46',  // Borders (dark mode)
      800: '#27272a',  // Background (dark mode)
      900: '#18181b',  // Primary text
    },
  },
  // Override Chakra defaults with Linear/Notion minimal colors
  gray: {
    50: '#fafafa',   // Almost white background
    100: '#f4f4f5',  // Light gray background
    200: '#e4e4e7',  // Border color
    300: '#d4d4d8',  // Subtle dividers
    400: '#a1a1aa',  // Icon color
    500: '#71717a',  // Muted text
    600: '#52525b',  // Secondary text
    700: '#3f3f46',  // Dark borders
    800: '#27272a',  // Dark background
    900: '#18181b',  // Primary text/black
  },
  // Minimal accent colors (used sparingly)
  black: '#000000',    // Primary accent (active indicators)
  white: '#ffffff',    // Pure white
  // Status colors (minimal, only when needed)
  green: {
    50: '#f0fdf4',
    100: '#dcfce7', 
    500: '#22c55e',  // Success
    600: '#16a34a',
    700: '#15803d',
  },
  red: {
    50: '#fef2f2',
    100: '#fee2e2',
    500: '#ef4444',  // Error
    600: '#dc2626',
    700: '#b91c1c',
  },
  blue: {
    50: '#eff6ff',
    100: '#dbeafe',
    500: '#3b82f6',  // Info (minimal use)
    600: '#2563eb',
    700: '#1d4ed8',
  },
}

// Typography - Inter font family for Linear/Notion style
const fonts = {
  heading: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif, "Apple Color Emoji", "Segoe UI Emoji"',
  body: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif, "Apple Color Emoji", "Segoe UI Emoji"',
}

// Typography scale following Linear/Notion minimal design
const fontSizes = {
  xs: '11px',      // Captions, labels
  sm: '13px',      // Small text, meta info
  md: '14px',      // Body text, regular content
  lg: '16px',      // Headings, logo
  xl: '18px',      // Page titles
  '2xl': '20px',   // Large headings
  '3xl': '24px',   // Display text (rare)
}

// Font weights - minimal set
const fontWeights = {
  normal: 400,     // Regular text
  medium: 500,     // Emphasized text
  semibold: 600,   // Headings, active items
}

// Letter spacing for clean typography
const letterSpacings = {
  tight: '-0.02em',  // Headings
  normal: '0em',     // Regular text
  wide: '0.05em',    // Uppercase labels
}

// Line heights for readability
const lineHeights = {
  tight: 1.2,
  normal: 1.4,
  relaxed: 1.6,
}

// Spacing system (more generous, 4px base)
const space = {
  px: '1px',
  0.5: '2px',
  1: '4px',
  1.5: '6px', 
  2: '8px',
  2.5: '10px',
  3: '12px',
  3.5: '14px',
  4: '16px',
  5: '20px',
  6: '24px',
  7: '28px',
  8: '32px',
  9: '36px',
  10: '40px',
  12: '48px',
  14: '56px',
  16: '64px',
  20: '80px',
  24: '96px',
  28: '112px',
  32: '128px',
}

// Component styles following Linear/Notion minimal design
const components = {
  Button: {
    baseStyle: {
      fontWeight: 'normal',
      borderRadius: '6px',
      minHeight: '32px',
      fontSize: 'md',
      lineHeight: 'normal',
      border: 'none',
      cursor: 'pointer',
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      textAlign: 'center',
      verticalAlign: 'middle',
      userSelect: 'none',
      transition: 'all 0.15s ease',
      _focus: {
        outline: 'none',
        boxShadow: 'none',
      },
      _disabled: {
        opacity: 0.4,
        cursor: 'not-allowed',
      },
    },
    variants: {
      // Primary button - black background (Linear style)
      solid: {
        bg: 'black',
        color: 'white',
        _hover: {
          bg: 'gray.800',
          _disabled: {
            bg: 'black',
          },
        },
        _active: {
          bg: 'gray.700',
        },
      },
      // Ghost button - minimal hover (most common)
      ghost: {
        bg: 'transparent',
        color: 'gray.600',
        _hover: {
          bg: 'gray.50',
          color: 'gray.900',
        },
        _active: {
          bg: 'gray.100',
        },
      },
      // Outline button - subtle border
      outline: {
        bg: 'transparent',
        color: 'gray.600',
        border: '1px solid',
        borderColor: 'gray.200',
        _hover: {
          bg: 'gray.50',
          borderColor: 'gray.300',
          color: 'gray.900',
        },
        _active: {
          bg: 'gray.100',
        },
      },
    },
    sizes: {
      sm: {
        minHeight: '28px',
        px: 3,
        fontSize: 'sm',
      },
      md: {
        minHeight: '32px',
        px: 4,
        fontSize: 'md',
      },
      lg: {
        minHeight: '36px',
        px: 5,
        fontSize: 'md',
      },
    },
  },
  Card: {
    baseStyle: {
      container: {
        borderRadius: '8px',
        bg: 'white',
        border: '1px solid',
        borderColor: 'gray.200',
        boxShadow: 'none',
        transition: 'all 0.15s ease',
      },
    },
    variants: {
      subtle: {
        container: {
          bg: 'gray.50',
          border: 'none',
        },
      },
      outline: {
        container: {
          border: '1px solid',
          borderColor: 'gray.200',
          boxShadow: 'none',
        },
      },
    },
  },
  Input: {
    baseStyle: {
      field: {
        fontSize: 'md',
        borderRadius: '6px',
      },
    },
    variants: {
      outline: {
        field: {
          bg: 'gray.50',
          borderColor: 'gray.200',
          _hover: {
            borderColor: 'gray.300',
          },
          _focus: {
            borderColor: 'gray.400',
            boxShadow: 'none',
            bg: 'white',
          },
        },
      },
    },
    sizes: {
      sm: {
        field: {
          fontSize: 'sm',
          h: '32px',
        },
      },
      md: {
        field: {
          fontSize: 'md',
          h: '36px',
        },
      },
    },
  },
  Textarea: {
    baseStyle: {
      fontSize: 'md',
      borderRadius: '6px',
    },
    variants: {
      outline: {
        bg: 'gray.50',
        borderColor: 'gray.200',
        _hover: {
          borderColor: 'gray.300',
        },
        _focus: {
          borderColor: 'gray.400',
          boxShadow: 'none',
          bg: 'white',
        },
      },
    },
  },
  Table: {
    baseStyle: {
      table: {
        fontSize: 'sm',
      },
      th: {
        fontSize: 'xs',
        fontWeight: 'semibold',
        letterSpacing: 'wide',
        textTransform: 'uppercase',
        color: 'gray.500',
        borderColor: 'gray.200',
        py: 3,
      },
      td: {
        borderColor: 'gray.200',
        py: 3,
      },
    },
    variants: {
      simple: {
        thead: {
          tr: {
            bg: 'transparent',
          },
        },
        tbody: {
          tr: {
            _hover: {
              bg: 'gray.50',
            },
            _odd: {
              bg: 'white',
            },
            _even: {
              bg: 'gray.50',
            },
          },
        },
      },
    },
  },
  Badge: {
    baseStyle: {
      fontSize: 'xs',
      fontWeight: 'medium',
      borderRadius: '12px',
      px: 2,
      py: 0.5,
    },
    variants: {
      solid: {
        bg: 'gray.100',
        color: 'gray.600',
      },
      subtle: {
        bg: 'gray.100',
        color: 'gray.600',
      },
    },
  },
}

// Global styles for Linear/Notion aesthetic
const styles = {
  global: {
    // Import Inter font
    '@import': `url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&display=swap')`,
    body: {
      bg: 'white',
      color: 'gray.900',
      fontFeatureSettings: '"kern"',
      lineHeight: 'normal',
    },
    '*::placeholder': {
      color: 'gray.500',
    },
    '*, *::before, &::after': {
      borderColor: 'gray.200',
    },
    // Ensure consistent icon sizing
    '.chakra-icon': {
      width: '16px',
      height: '16px',
    },
  },
}

// Semantic tokens for clean light/dark mode support
const semanticTokens = {
  colors: {
    'chakra-body-text': {
      _light: 'gray.900',
      _dark: 'white',
    },
    'chakra-body-bg': {
      _light: 'white',
      _dark: 'gray.900',
    },
    'chakra-border-color': {
      _light: 'gray.200',
      _dark: 'gray.700',
    },
    'chakra-placeholder-color': {
      _light: 'gray.500',
      _dark: 'gray.400',
    },
    'chakra-subtle-bg': {
      _light: 'gray.50',
      _dark: 'gray.800',
    },
    'chakra-subtle-text': {
      _light: 'gray.600',
      _dark: 'gray.400',
    },
  },
}

// Minimal shadow system - very subtle
const shadows = {
  xs: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
  sm: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
  md: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
  lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
  xl: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
  '2xl': '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
  none: 'none',
}

export const theme = extendTheme({
  colors,
  fonts,
  fontSizes,
  fontWeights,
  letterSpacings,
  lineHeights,
  space,
  components,
  styles,
  semanticTokens,
  shadows,
  config: {
    initialColorMode: 'light',
    useSystemColorMode: true,
  },
})

export default theme