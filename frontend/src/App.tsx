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
import CreateOrganization from './pages/admin/CreateOrganization'
import DistributorDashboard from './pages/admin/DistributorDashboard'
import DealerDashboard from './pages/admin/DealerDashboard'
import ClientDashboard from './pages/admin/ClientDashboard'

// Organization Management Components
import QuickAddDealer from './components/organizations/QuickAddDealer'
import QuickAddClient from './components/organizations/QuickAddClient'
import DealerAddClient from './components/organizations/DealerAddClient'
import DistributorNetworkView from './components/organizations/DistributorNetworkView'
import DealerClientsView from './components/organizations/DealerClientsView'
import ClientUserManagement from './components/organizations/ClientUserManagement'
import AddEndUser from './components/organizations/AddEndUser'

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
                
                {/* Email Routes - ONLY for end_user role */}
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
                
                <Route path="/settings" element={
                  <ProtectedRoute>
                    <Settings />
                  </ProtectedRoute>
                } />
                
                <Route path="/email-showcase" element={
                  <ProtectedRoute>
                    <RoleProtectedRoute allowedRoles={['end_user']}>
                      <EmailShowcase />
                    </RoleProtectedRoute>
                  </ProtectedRoute>
                } />
                
                {/* Admin Routes - ONLY for admin role */}
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
                
                <Route path="/admin/create-organization" element={
                  <ProtectedRoute>
                    <RoleProtectedRoute allowedRoles={['admin']}>
                      <CreateOrganization />
                    </RoleProtectedRoute>
                  </ProtectedRoute>
                } />
                
                {/* Role-specific dashboard routes */}
                <Route path="/distributor/dashboard" element={
                  <ProtectedRoute>
                    <RoleProtectedRoute allowedRoles={['distributor']}>
                      <DistributorDashboard />
                    </RoleProtectedRoute>
                  </ProtectedRoute>
                } />
                
                <Route path="/dealer/dashboard" element={
                  <ProtectedRoute>
                    <RoleProtectedRoute allowedRoles={['dealer']}>
                      <DealerDashboard />
                    </RoleProtectedRoute>
                  </ProtectedRoute>
                } />
                
                <Route path="/client/dashboard" element={
                  <ProtectedRoute>
                    <RoleProtectedRoute allowedRoles={['client']}>
                      <ClientDashboard />
                    </RoleProtectedRoute>
                  </ProtectedRoute>
                } />

                {/* Distributor organization management routes */}
                <Route path="/distributor/network" element={
                  <ProtectedRoute>
                    <RoleProtectedRoute allowedRoles={['distributor']}>
                      <DistributorNetworkView />
                    </RoleProtectedRoute>
                  </ProtectedRoute>
                } />
                
                <Route path="/distributor/add-dealer" element={
                  <ProtectedRoute>
                    <RoleProtectedRoute allowedRoles={['distributor']}>
                      <QuickAddDealer />
                    </RoleProtectedRoute>
                  </ProtectedRoute>
                } />
                
                <Route path="/distributor/add-client" element={
                  <ProtectedRoute>
                    <RoleProtectedRoute allowedRoles={['distributor']}>
                      <QuickAddClient />
                    </RoleProtectedRoute>
                  </ProtectedRoute>
                } />

                {/* Dealer organization management routes */}
                <Route path="/dealer/clients" element={
                  <ProtectedRoute>
                    <RoleProtectedRoute allowedRoles={['dealer']}>
                      <DealerClientsView />
                    </RoleProtectedRoute>
                  </ProtectedRoute>
                } />
                
                <Route path="/dealer/add-client" element={
                  <ProtectedRoute>
                    <RoleProtectedRoute allowedRoles={['dealer']}>
                      <DealerAddClient />
                    </RoleProtectedRoute>
                  </ProtectedRoute>
                } />

                {/* Client user management routes */}
                <Route path="/client/users" element={
                  <ProtectedRoute>
                    <RoleProtectedRoute allowedRoles={['client']}>
                      <ClientUserManagement />
                    </RoleProtectedRoute>
                  </ProtectedRoute>
                } />
                
                <Route path="/client/add-user" element={
                  <ProtectedRoute>
                    <RoleProtectedRoute allowedRoles={['client']}>
                      <AddEndUser />
                    </RoleProtectedRoute>
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
