# Email Backup MVP - Frontend Application

A professional React + TypeScript frontend application with Office 365 design system for the Email Backup MVP project.

## 🏗️ Architecture & Technologies

### Core Stack
- **React 19** + **TypeScript** - Modern React with full type safety
- **Vite** - Fast build tool and development server
- **Chakra UI** - Component library with Microsoft Office 365 theme
- **React Router** - Client-side routing with protected routes
- **Zustand** - Lightweight state management
- **React Query** - Server state management
- **React Hook Form + Zod** - Form handling with validation
- **Framer Motion** - Smooth animations
- **Axios** - API client with interceptors

### Design System
- **Microsoft Office 365** inspired design
- **Segoe UI** typography
- **Microsoft color palette** (Primary Blue: #0078D4)
- **Fluent Design** shadows and spacing
- **Dark/Light mode** support
- **Responsive design** for all screen sizes

## 📱 Pages & Features

### 🔐 Authentication
- **Login/Register** page with Office 365 design
- **JWT token management** with auto-refresh
- **Protected routes** with authentication guards
- **Persistent sessions** across browser refreshes

### 📊 Dashboard
- **Statistics cards** showing account metrics
- **Quick actions** for common tasks
- **Account overview** with sync status
- **System status** indicators
- **Professional cards** and layouts

### 📧 Email Accounts Management
- **Add Gmail accounts** (IMAP with app passwords)
- **Add Exchange accounts** (EWS configuration)
- **Account cards** with provider icons and status
- **Real-time sync** with progress indicators
- **Account settings** and management options

### 📬 Email List (Outlook Web Style)
- **Outlook-inspired** email list interface
- **Advanced filtering** by account, folder, search
- **Pagination** with smooth navigation
- **Email preview** with sender avatars
- **Smart date formatting** (Today, Yesterday, etc.)
- **Email detail drawer** with full metadata

### ⚙️ Settings
- **Account information** display
- **Appearance settings** (dark/light mode)
- **Notification preferences**
- **Sync configuration**
- **Security information**
- **System status** overview

## 🎨 UI Components

### Layout Components
- **Professional sidebar** navigation (collapsible)
- **Command bar** with user menu
- **Breadcrumb navigation**
- **Responsive grid** layouts

### Common Components
- **Error boundaries** with recovery options
- **Loading spinners** with different sizes
- **Notification system** with toast messages
- **Modal dialogs** for forms and confirmations
- **Data tables** with sorting and filtering
- **Statistics cards** with trend indicators

### Form Components
- **Validated forms** with error handling
- **Multi-step wizards** for account setup
- **Real-time validation** feedback
- **Accessible form controls**

## 🔧 State Management

### Authentication Store (Zustand)
- User session management
- JWT token handling
- Login/logout actions
- Auto-authentication on refresh

### Email Store (Zustand)
- Email accounts management
- Email data with pagination
- Sync status tracking
- Email selection state

### UI Store (Zustand)
- Sidebar collapse state
- Theme preferences
- Notification queue
- Loading states

## 🌐 API Integration

### API Client Features
- **Axios interceptors** for authentication
- **Auto token refresh** on 401 responses
- **Request/response logging** in development
- **Error handling** with user-friendly messages
- **Loading states** integration

### Backend API Endpoints
- `POST /auth/register` - User registration
- `POST /auth/login` - User authentication  
- `GET /api/me` - Current user info
- `GET /api/accounts` - Email accounts list
- `POST /api/accounts/gmail` - Add Gmail account
- `POST /api/accounts/exchange` - Add Exchange account
- `POST /api/accounts/:id/sync` - Sync account emails
- `GET /api/accounts/:id/emails` - Get account emails
- `GET /api/emails/:id` - Get email details

## 🎯 Professional Features

### Microsoft Office 365 Design
- **Authentic Microsoft colors** and typography
- **Fluent Design shadows** and animations
- **Professional spacing** and layouts
- **Enterprise-grade** user experience

### Performance Optimizations
- **Code splitting** with React.lazy
- **Memoized components** to prevent re-renders
- **Efficient state updates** with Zustand
- **Optimized bundle** with Vite

### Accessibility
- **ARIA labels** and roles
- **Keyboard navigation** support
- **Screen reader** compatibility
- **Focus management** with proper indicators
- **Color contrast** compliance

### Error Handling
- **Global error boundary** with recovery
- **Network error** handling
- **Form validation** with user feedback
- **Toast notifications** for actions
- **Graceful degradation**

## 🚀 Development

### Running the Application
```bash
cd frontend
npm install
npm run dev
```

### Building for Production
```bash
npm run build
npm run preview
```

### Project Structure
```
frontend/src/
├── components/          # Reusable components
│   ├── auth/           # Authentication components
│   ├── common/         # Common UI components
│   └── layout/         # Layout components
├── pages/              # Page components
├── stores/             # Zustand stores
├── services/           # API services
├── theme/              # Chakra UI theme
├── utils/              # Utility functions
└── App.tsx            # Main application
```

## 🔗 Backend Integration

This frontend is designed to work seamlessly with the Go + Gin backend:
- **PostgreSQL** database for user data
- **MinIO** object storage for email content
- **JWT authentication** with secure tokens
- **Gmail IMAP** and **Exchange EWS** support

## 📋 MVP Feature Checklist

- ✅ User authentication (register/login)
- ✅ Dashboard with statistics
- ✅ Email account management (Gmail + Exchange)
- ✅ Email synchronization with progress
- ✅ Email list with search and filtering
- ✅ Email detail view
- ✅ Settings and preferences
- ✅ Responsive design
- ✅ Error handling and loading states
- ✅ Professional Office 365 styling

---

**Built with ❤️ for Email Backup MVP**  
*Professional, enterprise-grade frontend application*