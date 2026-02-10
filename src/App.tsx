import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { MainLayout, ProtectedRoute } from './components/Layout';
import { LoginPage, RegisterPage } from './pages/Auth';
import { DashboardPage } from './pages/Dashboard';
import { PropertiesPage, PropertyFormPage } from './pages/Properties';
import { ReservationsPage, ReservationFormPage } from './pages/Reservations';
import { FinancesPage, TransactionFormPage } from './pages/Finances';
import { ReportsPage } from './pages/Reports';
import { UsersPage } from './pages/Users';
import { AccessCodesPage } from './pages/AccessCodes';

function App() {
  return (
    <AuthProvider>
      <Router basename='propertyhub'>
        <Routes>
          {/* Public routes */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />

          {/* Protected routes */}
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <MainLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<DashboardPage />} />
            
            {/* Properties */}
            <Route path="properties" element={<PropertiesPage />} />
            <Route path="properties/new" element={<PropertyFormPage />} />
            <Route path="properties/:id/edit" element={<PropertyFormPage />} />

            {/* Reservations */}
            <Route path="reservations" element={<ReservationsPage />} />
            <Route path="reservations/new" element={<ReservationFormPage />} />
            <Route path="reservations/:id/edit" element={<ReservationFormPage />} />

            {/* Finances */}
            <Route path="finances" element={<FinancesPage />} />
            <Route path="finances/new" element={<TransactionFormPage />} />

            {/* Access Codes */}
            <Route path="access-codes" element={<AccessCodesPage />} />

            {/* Reports */}
            <Route path="reports" element={<ReportsPage />} />

            {/* Users (Admin only) */}
            <Route
              path="users"
              element={
                <ProtectedRoute requiredRole="admin">
                  <UsersPage />
                </ProtectedRoute>
              }
            />
          </Route>

          {/* Catch all */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
