import { extendTheme } from '@chakra-ui/react'

// Microsoft Office 365 / Fluent Design color palette
const colors = {
  // Microsoft brand colors
  microsoft: {
    // Primary Microsoft Blue
    blue: {
      50: '#f3f8ff',
      100: '#dfeaff', 
      200: '#c2d9ff',
      300: '#9cc3ff',
      400: '#70a4ff',
      500: '#0078d4',  // Primary Microsoft Blue
      600: '#106ebe',
      700: '#005a9e',
      800: '#004d8b',
      900: '#003d70',
    },
    // Secondary colors from Microsoft palette
    teal: {
      50: '#f0fcf9',
      100: '#d3f7ec',
      200: '#a7eed9',
      300: '#74e1c7',
      400: '#20c997',  // Microsoft Teal
      500: '#198754',
      600: '#0d7746',
      700: '#0a6338',
      800: '#084c2e',
      900: '#063925',
    },
    purple: {
      50: '#f6f3ff',
      100: '#ede6ff',
      200: '#d9ccff',
      300: '#c2a8ff',
      400: '#a47eff',
      500: '#8a63d2',  // Microsoft Purple
      600: '#7c56c4',
      700: '#6b47b8',
      800: '#5a38a3',
      900: '#4a2c89',
    },
    orange: {
      50: '#fff8f1',
      100: '#feecdc',
      200: '#fdd5b4',
      300: '#fcb583',
      400: '#fa8b47',
      500: '#ff8c00',  // Microsoft Orange
      600: '#e67700',
      700: '#cc6600',
      800: '#b35500',
      900: '#994400',
    },
  },
  // Updated grays to match Office 365
  gray: {
    50: '#faf9f8',    // Office light background
    100: '#f3f2f1',   // Card background
    200: '#edebe9',   // Border
    300: '#e1dfdd',   // Dividers
    400: '#d2d0ce',   // Icons
    500: '#8a8886',   // Muted text
    600: '#605e5c',   // Secondary text
    700: '#484644',   // Dark text
    800: '#323130',   // Dark background
    900: '#201f1e',   // Primary text
  },
  // Office 365 semantic colors
  blue: {
    50: '#f3f8ff',
    100: '#dfeaff',
    200: '#c2d9ff',
    300: '#9cc3ff',
    400: '#70a4ff',
    500: '#0078d4',   // Microsoft Blue
    600: '#106ebe',
    700: '#005a9e',
    800: '#004d8b',
    900: '#003d70',
  },
  green: {
    50: '#f1f8e9',
    100: '#c5e3a5',
    200: '#8bb174',
    300: '#52875a',
    400: '#107c10',   // Microsoft Green
    500: '#0e6b0e',
    600: '#0b5a0b',
    700: '#094a09',
    800: '#073b07',
    900: '#042904',
  },
  red: {
    50: '#fdf2f2',
    100: '#fce4e4',
    200: '#f5b7b7',
    300: '#ed9b9b',
    400: '#e86470',
    500: '#d83b01',   // Microsoft Red
    600: '#c93400',
    700: '#b22d00',
    800: '#9b2600',
    900: '#7d1f00',
  },
  yellow: {
    50: '#fffef7',
    100: '#fffceb',
    200: '#fef7c7',
    300: '#fef0a3',
    400: '#fde047',
    500: '#ffb900',   // Microsoft Yellow
    600: '#e6a500',
    700: '#cc9200',
    800: '#b37e00',
    900: '#996b00',
  },
}

// Typography - Segoe UI font family for Office 365 style
const fonts = {
  heading: '"Segoe UI", "Helvetica Neue", Helvetica, Arial, sans-serif',
  body: '"Segoe UI", "Helvetica Neue", Helvetica, Arial, sans-serif',
}

// Typography scale following Office 365 design system
const fontSizes = {
  xs: '10px',      // Small captions
  sm: '12px',      // Captions, labels
  md: '14px',      // Body text, regular content  
  lg: '16px',      // Subheadings
  xl: '20px',      // Page titles
  '2xl': '28px',   // Large headings
  '3xl': '32px',   // Hero text
  '4xl': '40px',   // Display text
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

// Component styles following Office 365 Fluent Design
const components = {
  Button: {
    baseStyle: {
      fontWeight: 'semibold',
      borderRadius: '4px',
      minHeight: '32px',
      fontSize: 'md',
      lineHeight: 'normal',
      cursor: 'pointer',
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      textAlign: 'center',
      verticalAlign: 'middle',
      userSelect: 'none',
      transition: 'all 0.1s ease-in-out',
      _focus: {
        outline: '2px solid',
        outlineColor: 'blue.500',
        outlineOffset: '1px',
      },
      _disabled: {
        opacity: 0.4,
        cursor: 'not-allowed',
      },
    },
    variants: {
      // Primary button - Microsoft Blue (Office 365 style)
      solid: {
        bg: 'blue.500',
        color: 'white',
        border: '1px solid transparent',
        _hover: {
          bg: 'blue.600',
          transform: 'translateY(-1px)',
          _disabled: {
            bg: 'blue.500',
            transform: 'none',
          },
        },
        _active: {
          bg: 'blue.700',
          transform: 'translateY(0)',
        },
      },
      // Ghost button - Office style hover
      ghost: {
        bg: 'transparent',
        color: 'blue.500',
        _hover: {
          bg: 'blue.50',
          color: 'blue.600',
        },
        _active: {
          bg: 'blue.100',
        },
      },
      // Outline button - Office 365 style border
      outline: {
        bg: 'white',
        color: 'blue.500',
        border: '1px solid',
        borderColor: 'blue.500',
        _hover: {
          bg: 'blue.50',
          borderColor: 'blue.600',
          color: 'blue.600',
          transform: 'translateY(-1px)',
        },
        _active: {
          bg: 'blue.100',
          transform: 'translateY(0)',
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
        minHeight: '40px',
        px: 6,
        fontSize: 'lg',
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
        boxShadow: '0 1.6px 3.6px 0 rgba(0,0,0,.132), 0 0.3px 0.9px 0 rgba(0,0,0,.108)',
        transition: 'all 0.1s ease-in-out',
        _hover: {
          boxShadow: '0 6.4px 14.4px 0 rgba(0,0,0,.132), 0 1.2px 3.6px 0 rgba(0,0,0,.108)',
          transform: 'translateY(-2px)',
        },
      },
    },
    variants: {
      subtle: {
        container: {
          bg: 'gray.100',
          border: 'none',
          boxShadow: 'none',
          _hover: {
            bg: 'gray.50',
            boxShadow: '0 1.6px 3.6px 0 rgba(0,0,0,.132)',
          },
        },
      },
      outline: {
        container: {
          border: '1px solid',
          borderColor: 'gray.300',
          boxShadow: 'none',
          _hover: {
            borderColor: 'blue.500',
            boxShadow: '0 1.6px 3.6px 0 rgba(0,0,0,.132)',
          },
        },
      },
      filled: {
        container: {
          bg: 'blue.50',
          border: 'none',
          boxShadow: 'none',
          _hover: {
            bg: 'blue.100',
            boxShadow: '0 1.6px 3.6px 0 rgba(0,0,0,.132)',
          },
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

// Global styles for Office 365 aesthetic
const styles = {
  global: {
    body: {
      bg: 'gray.50',
      color: 'gray.900',
      fontFeatureSettings: '"kern"',
      lineHeight: 'normal',
      fontSize: 'md',
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
    // Office 365 scrollbar styling
    '::-webkit-scrollbar': {
      width: '8px',
    },
    '::-webkit-scrollbar-track': {
      bg: 'gray.100',
    },
    '::-webkit-scrollbar-thumb': {
      bg: 'gray.300',
      borderRadius: '4px',
      _hover: {
        bg: 'gray.400',
      },
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

// Office 365 Fluent Design shadow system
const shadows = {
  // Fluent Design depth shadows
  xs: '0 0.6px 1.8px rgba(0,0,0,.108), 0 0.3px 0.9px rgba(0,0,0,.132)',
  sm: '0 1.6px 3.6px 0 rgba(0,0,0,.132), 0 0.3px 0.9px 0 rgba(0,0,0,.108)',
  md: '0 6.4px 14.4px 0 rgba(0,0,0,.132), 0 1.2px 3.6px 0 rgba(0,0,0,.108)',
  lg: '0 12.8px 28.8px 0 rgba(0,0,0,.132), 0 2.4px 7.2px 0 rgba(0,0,0,.108)',
  xl: '0 25.6px 57.6px 0 rgba(0,0,0,.132), 0 4.8px 14.4px 0 rgba(0,0,0,.108)',
  '2xl': '0 51.2px 115.2px 0 rgba(0,0,0,.132), 0 9.6px 28.8px 0 rgba(0,0,0,.108)',
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