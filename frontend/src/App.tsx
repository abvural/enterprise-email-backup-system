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
import AdminDashboard from './pages/admin/AdminDashboard'
import OrganizationManagement from './pages/admin/OrganizationManagement'
import DistributorDashboard from './pages/admin/DistributorDashboard'
import DealerDashboard from './pages/admin/DealerDashboard'
import ClientDashboard from './pages/admin/ClientDashboard'

// Components
import { ProtectedRoute } from './components/auth/ProtectedRoute'
import { RoleProtectedRoute } from './components/auth/RoleProtectedRoute'
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
                
                {/* Root redirect - role-based routing handled in Dashboard */}
                <Route path="/" element={
                  <ProtectedRoute>
                    <Navigate to="/dashboard" replace />
                  </ProtectedRoute>
                } />
                
                {/* Main Dashboard Route - handles role-based redirects internally */}
                <Route path="/dashboard" element={
                  <ProtectedRoute>
                    <Dashboard />
                  </ProtectedRoute>
                } />
                
                {/* Email Management Routes - ONLY for end_user role */}
                <Route path="/accounts" element={
                  <ProtectedRoute>
                    <RoleProtectedRoute allowedRoles={['end_user']}>
                      <EmailAccounts />
                    </RoleProtectedRoute>
                  </ProtectedRoute>
                } />
                
                <Route path="/emails" element={
                  <ProtectedRoute>
                    <RoleProtectedRoute allowedRoles={['end_user']}>
                      <Emails />
                    </RoleProtectedRoute>
                  </ProtectedRoute>
                } />
                
                <Route path="/email-showcase" element={
                  <ProtectedRoute>
                    <RoleProtectedRoute allowedRoles={['end_user']}>
                      <EmailShowcase />
                    </RoleProtectedRoute>
                  </ProtectedRoute>
                } />
                
                {/* Settings - Available to all roles */}
                <Route path="/settings" element={
                  <ProtectedRoute>
                    <Settings />
                  </ProtectedRoute>
                } />
                
                {/* Admin Routes */}
                <Route path="/admin/dashboard" element={
                  <ProtectedRoute>
                    <RoleProtectedRoute allowedRoles={['admin']}>
                      <AdminDashboard />
                    </RoleProtectedRoute>
                  </ProtectedRoute>
                } />
                
                <Route path="/admin/organizations" element={
                  <ProtectedRoute>
                    <RoleProtectedRoute allowedRoles={['admin']}>
                      <OrganizationManagement />
                    </RoleProtectedRoute>
                  </ProtectedRoute>
                } />
                
                {/* Distributor Routes */}
                <Route path="/distributor/dashboard" element={
                  <ProtectedRoute>
                    <RoleProtectedRoute allowedRoles={['distributor']}>
                      <DistributorDashboard />
                    </RoleProtectedRoute>
                  </ProtectedRoute>
                } />
                
                {/* Dealer Routes */}
                <Route path="/dealer/dashboard" element={
                  <ProtectedRoute>
                    <RoleProtectedRoute allowedRoles={['dealer']}>
                      <DealerDashboard />
                    </RoleProtectedRoute>
                  </ProtectedRoute>
                } />
                
                {/* Client Routes */}
                <Route path="/client/dashboard" element={
                  <ProtectedRoute>
                    <RoleProtectedRoute allowedRoles={['client']}>
                      <ClientDashboard />
                    </RoleProtectedRoute>
                  </ProtectedRoute>
                } />
                
                {/* Catch all route - redirect to dashboard */}
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
