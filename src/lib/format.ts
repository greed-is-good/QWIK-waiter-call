import clsx from 'clsx'

import type {
  AssignmentScope,
  CallEvent,
  CallStatus,
  Employee,
  ErrorLog,
  Service,
  TableAssignment,
  TableItem,
} from '../types'

export const cn = (...values: Array<string | boolean | null | undefined>) => clsx(values)

export const formatDateTime = (value?: string | null) => {
  if (!value) {
    return '—'
  }

  return new Intl.DateTimeFormat('ru-RU', {
    dateStyle: 'short',
    timeStyle: 'short',
  }).format(new Date(value))
}

export const formatTime = (value?: string | null) => {
  if (!value) {
    return '—'
  }

  return new Intl.DateTimeFormat('ru-RU', {
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value))
}

export const formatDuration = (from?: string | null, to?: string | null) => {
  if (!from || !to) {
    return '—'
  }

  const diff = Math.max(new Date(to).getTime() - new Date(from).getTime(), 0)
  const totalSeconds = Math.round(diff / 1000)
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60

  return minutes > 0 ? `${minutes}м ${seconds}с` : `${seconds}с`
}

export const getTableName = (tableId: string | null | undefined, tables: TableItem[]) =>
  tables.find((table) => table.id === tableId)?.name ?? 'Не определен'

export const getServiceName = (serviceId: string | null | undefined, services: Service[]) =>
  services.find((service) => service.id === serviceId)?.name ?? 'Не определена'

export const getEmployeeName = (employeeId: string | null | undefined, employees: Employee[]) =>
  employees.find((employee) => employee.id === employeeId)?.full_name ?? '—'

export const getStatusTone = (status: CallStatus | ErrorLog['level'] | 'info' | 'success') => {
  switch (status) {
    case 'confirmed':
    case 'success':
      return 'success'
    case 'notified':
    case 'received':
    case 'routed':
    case 'info':
      return 'info'
    case 'warning':
    case 'unknown_button':
    case 'invalid_signal':
      return 'warning'
    default:
      return 'error'
  }
}

export const getScopeLabel = (scope: AssignmentScope) => (scope === 'waiter' ? 'Официант' : 'Кальян')

export const getRoleLabel = (role: Employee['role']) => {
  switch (role) {
    case 'waiter':
      return 'Официант'
    case 'hookah':
      return 'Кальянщик'
    default:
      return 'Администратор'
  }
}

export const getAssignmentSummary = (
  assignment: TableAssignment | undefined,
  employees: Employee[],
) => {
  if (!assignment) {
    return 'Свободно'
  }

  return `${getEmployeeName(assignment.assigned_employee_id, employees)}`
}

export const buildTimeline = (event: CallEvent) => {
  const items = [
    { key: 'received', label: 'received', value: event.received_at },
    { key: 'routed', label: 'routed', value: event.routed_at ?? null },
    { key: 'notified', label: 'notified', value: event.notified_at ?? null },
    { key: 'confirmed', label: 'confirmed', value: event.confirmed_at ?? null },
  ]

  if (event.status === 'unknown_button' || event.status === 'invalid_signal' || event.status === 'error') {
    items.push({ key: event.status, label: event.status, value: event.received_at })
  }

  return items
}
