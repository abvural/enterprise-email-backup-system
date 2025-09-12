import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { ChakraProvider, ColorModeScript } from '@chakra-ui/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useEffect } from 'react'

// Theme
import theme from './theme'

// Pages
import { Login } from './pages/Login'
import { Dashboard } from './pages/Dashboard'
import { EmailAccounts } from './pages/EmailAccounts'
import { Emails } from './pages/Emails'
import { Settings } from './pages/Settings'
import EmailShowcase from './pages/EmailShowcase'

// Components
import { ProtectedRoute } from './components/auth/ProtectedRoute'
import { ErrorBoundary } from './components/common/ErrorBoundary'
import { NotificationProvider } from './components/common/NotificationProvider'

// Stores
import { useAuthStore } from './stores/authStore'

// Create a client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
})

function App() {
  const { initializeAuth } = useAuthStore()

  useEffect(() => {
    initializeAuth()
  }, [initializeAuth])

  return (
    <ChakraProvider theme={theme}>
      <ColorModeScript initialColorMode={theme.config.initialColorMode} />
      <QueryClientProvider client={queryClient}>
        <ErrorBoundary>
          <NotificationProvider>
            <Router>
              <Routes>
                {/* Public Routes */}
                <Route path="/login" element={<Login />} />
                
                {/* Protected Routes */}
                <Route path="/" element={
                  <ProtectedRoute>
                    <Navigate to="/dashboard" replace />
                  </ProtectedRoute>
                } />
                
                <Route path="/dashboard" element={
                  <ProtectedRoute>
                    <Dashboard />
                  </ProtectedRoute>
                } />
                
                <Route path="/accounts" element={
                  <ProtectedRoute>
                    <EmailAccounts />
                  </ProtectedRoute>
                } />
                
                <Route path="/emails" element={
                  <ProtectedRoute>
                    <Emails />
                  </ProtectedRoute>
                } />
                
                <Route path="/settings" element={
                  <ProtectedRoute>
                    <Settings />
                  </ProtectedRoute>
                } />
                
                <Route path="/email-showcase" element={
                  <ProtectedRoute>
                    <EmailShowcase />
                  </ProtectedRoute>
                } />
                
                {/* Catch all route */}
                <Route path="*" element={
                  <ProtectedRoute>
                    <Navigate to="/dashboard" replace />
                  </ProtectedRoute>
                } />
              </Routes>
            </Router>
          </NotificationProvider>
        </ErrorBoundary>
      </QueryClientProvider>
    </ChakraProvider>
  )
}

export default App
