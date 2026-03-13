import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'

import { AppShell } from './components/AppShell'
import { BindingsPage, NewButtonsPage } from './pages/BindingsPages'
import { CallsRegistryPage, TablesAssignmentsPage } from './pages/CallsPages'
import { ErrorsLogPage, InvalidSignalsPage, UnknownLogPage } from './pages/LogPages'
import { LoginPage } from './pages/LoginPage'
import {
  AnalyticsPage,
  IntegrationsPage,
  SettingsPage,
  SimulatorPage,
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
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginGuard />} />
        <Route element={<ProtectedLayout />}>
          <Route index element={<Navigate to="/calls" replace />} />
          <Route path="/calls" element={<CallsRegistryPage />} />
          <Route path="/tables-assignments" element={<TablesAssignmentsPage />} />
          <Route path="/system-mode" element={<SystemModePage />} />
          <Route path="/new-buttons" element={<NewButtonsPage />} />
          <Route path="/bindings" element={<BindingsPage />} />
          <Route path="/employees" element={<EmployeesPage />} />
          <Route path="/services" element={<ServicesPage />} />
          <Route path="/tables" element={<TablesPage />} />
          <Route path="/logs/unknown" element={<UnknownLogPage />} />
          <Route path="/logs/invalid" element={<InvalidSignalsPage />} />
          <Route path="/logs/errors" element={<ErrorsLogPage />} />
          <Route path="/integrations" element={<IntegrationsPage />} />
          <Route path="/analytics" element={<AnalyticsPage />} />
          <Route path="/settings" element={<SettingsPage />} />
          <Route path="/simulator" element={<SimulatorPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}
