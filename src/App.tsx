import { BrowserRouter, HashRouter, Navigate, Route, Routes } from 'react-router-dom'

import { AppErrorBoundary } from './components/AppErrorBoundary'
import { AppShell } from './components/AppShell'
import { BindingsPage } from './pages/BindingsPages'
import { CallsRegistryPage, TablesAssignmentsPage } from './pages/CallsPages'
import { ErrorJournalPage } from './pages/LogPages'
import { LoginPage } from './pages/LoginPage'
import {
  AboutSystemPage,
  AnalyticsPage,
  IntegrationsPage,
  SystemModePage,
} from './pages/OperationsPages'
import { EmployeesPage, ServicesPage, TablesPage } from './pages/ResourcePages'
import { useAppStore } from './store/useAppStore'

const ProtectedLayout = () => {
  const authUser = useAppStore((state) => state.authUser)

  if (!authUser) {
    return <Navigate to="/login" replace />
  }

  return <AppShell />
}

const LoginGuard = () => {
  const authUser = useAppStore((state) => state.authUser)

  if (authUser) {
    return <Navigate to="/calls" replace />
  }

  return <LoginPage />
}

export default function App() {
  const Router = import.meta.env.BASE_URL === '/' ? BrowserRouter : HashRouter

  return (
    <Router>
      <AppErrorBoundary>
        <Routes>
          <Route path="/login" element={<LoginGuard />} />
          <Route element={<ProtectedLayout />}>
            <Route index element={<Navigate to="/calls" replace />} />
            <Route path="/calls" element={<CallsRegistryPage />} />
            <Route path="/tables-assignments" element={<TablesAssignmentsPage />} />
            <Route path="/system-mode" element={<SystemModePage />} />
            <Route path="/bindings" element={<BindingsPage />} />
            <Route path="/employees" element={<EmployeesPage />} />
            <Route path="/services" element={<ServicesPage />} />
            <Route path="/tables" element={<TablesPage />} />
            <Route path="/new-buttons" element={<Navigate to="/bindings" replace />} />
            <Route path="/logs/unknown" element={<Navigate to="/logs/errors" replace />} />
            <Route path="/logs/invalid" element={<Navigate to="/logs/errors" replace />} />
            <Route path="/logs/errors" element={<ErrorJournalPage />} />
            <Route path="/integrations" element={<IntegrationsPage />} />
            <Route path="/analytics" element={<AnalyticsPage />} />
            <Route path="/settings" element={<AboutSystemPage />} />
            <Route path="/simulator" element={<Navigate to="/calls" replace />} />
          </Route>
        </Routes>
      </AppErrorBoundary>
    </Router>
  )
}
