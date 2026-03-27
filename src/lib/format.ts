import clsx from 'clsx'

import type {
  AssignmentScope,
  AssignmentStatus,
  CallEvent,
  CallStatus,
  Employee,
  ErrorLog,
  IikoEventLog,
  IikoState,
  ReleaseReason,
  Service,
  TableAssignment,
  TableItem,
  TrialState,
  TrialStatus,
} from '../types'

const dayInMs = 24 * 60 * 60 * 1000

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

export const formatDate = (value?: string | null) => {
  if (!value) {
    return '—'
  }

  return new Intl.DateTimeFormat('ru-RU', {
    dateStyle: 'medium',
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

export const formatDayCount = (count: number) => {
  const mod10 = count % 10
  const mod100 = count % 100

  if (mod10 === 1 && mod100 !== 11) {
    return `${count} день`
  }

  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) {
    return `${count} дня`
  }

  return `${count} дней`
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

export const getCallStatusLabel = (status: CallStatus) => {
  switch (status) {
    case 'received':
      return 'Получен'
    case 'routed':
      return 'Маршрутизирован'
    case 'notified':
      return 'Отправлен в чат'
    case 'confirmed':
      return 'Подтвержден'
    case 'unknown_button':
      return 'Неизвестная кнопка'
    case 'invalid_signal':
      return 'Невалидный сигнал'
    case 'error':
      return 'Ошибка'
  }
}

export const isTechnicalCallStatus = (status: CallStatus) =>
  status === 'unknown_button' || status === 'invalid_signal'

export const isPendingWorkingCallStatus = (status: CallStatus) =>
  status === 'received' || status === 'routed' || status === 'notified'

export const isRegistryCallStatus = (status: CallStatus) => !isTechnicalCallStatus(status)

export type DerivedTableStatus = 'free' | 'waiting' | 'confirmed'

export const getDerivedTableStatus = (
  tableId: string,
  callEvents: CallEvent[],
): DerivedTableStatus => {
  const tableEvents = callEvents
    .filter((event) => event.table_id === tableId && isRegistryCallStatus(event.status))
    .sort((left, right) => new Date(right.received_at).getTime() - new Date(left.received_at).getTime())

  if (tableEvents.some((event) => isPendingWorkingCallStatus(event.status))) {
    return 'waiting'
  }

  if (tableEvents[0]?.status === 'confirmed') {
    return 'confirmed'
  }

  return 'free'
}

export const getDerivedTableStatusLabel = (status: DerivedTableStatus) => {
  switch (status) {
    case 'waiting':
      return 'В ожидании'
    case 'confirmed':
      return 'Подтверждено'
    default:
      return 'Свободен'
  }
}

export const getDerivedTableStatusTone = (status: DerivedTableStatus) => {
  switch (status) {
    case 'waiting':
      return 'warning'
    case 'confirmed':
      return 'success'
    default:
      return 'neutral'
  }
}

export const getAssignmentStatusLabel = (status: AssignmentStatus) =>
  status === 'active' ? 'Активно' : 'Снято'

export const getReleaseReasonLabel = (reason: ReleaseReason) => {
  switch (reason) {
    case 'check_closed':
      return 'Чек закрыт'
    case 'manual_reset':
      return 'Ручной сброс'
    case 'timeout':
      return 'Таймаут'
    case 'iiko_error':
      return 'Ошибка IIKO'
  }
}

export const getLogLevelLabel = (level: ErrorLog['level'] | 'info' | 'success') => {
  switch (level) {
    case 'info':
      return 'Инфо'
    case 'success':
      return 'Успех'
    case 'warning':
      return 'Предупреждение'
    case 'error':
      return 'Ошибка'
  }
}

export const getErrorComponentLabel = (component: ErrorLog['component']) => {
  switch (component) {
    case 'client':
      return 'Клиент'
    case 'backend':
      return 'Бэкенд'
    case 'bot':
      return 'Бот'
    case 'iiko':
      return 'IIKO'
  }
}

export const getIikoStatusLabel = (status: IikoState['status']) => {
  switch (status) {
    case 'connected':
      return 'Подключено'
    case 'degraded':
      return 'Нестабильно'
    case 'disconnected':
      return 'Отключено'
  }
}

export const getIikoEventTypeLabel = (type: IikoEventLog['type']) => {
  switch (type) {
    case 'sync':
      return 'Синхронизация'
    case 'check_closed':
      return 'Чек закрыт'
    case 'warning':
      return 'Предупреждение'
    case 'error':
      return 'Ошибка'
  }
}

export const getChatMessageStateLabel = (state: 'open' | 'closed') =>
  state === 'open' ? 'Ожидает отклика' : 'Закрыто'

export const getScopeLabel = (scope: AssignmentScope) =>
  scope === 'waiter' ? 'Официант' : 'Кальян'

export const getServiceRoleLabel = (role: Service['assigned_role']) =>
  role === 'waiter' ? 'Официант' : 'Кальянщик'

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

export const getTrialEndDate = (trial: TrialState) =>
  new Date(new Date(trial.activated_at).getTime() + trial.duration_days * dayInMs).toISOString()

export const getTrialDaysRemaining = (trial: TrialState) => {
  const diff = new Date(getTrialEndDate(trial)).getTime() - Date.now()

  if (diff <= 0) {
    return 0
  }

  return Math.ceil(diff / dayInMs)
}

export const getTrialDaysElapsed = (trial: TrialState) =>
  Math.min(trial.duration_days, Math.max(trial.duration_days - getTrialDaysRemaining(trial), 0))

export const getTrialProgressPercent = (trial: TrialState) =>
  Math.min(100, Math.max((getTrialDaysElapsed(trial) / trial.duration_days) * 100, 0))

export const getTrialStatus = (trial: TrialState): TrialStatus => {
  const remainingDays = getTrialDaysRemaining(trial)

  if (remainingDays === 0) {
    return 'expired'
  }

  if (remainingDays <= 3) {
    return 'ending_soon'
  }

  return 'active'
}

export const getTrialStatusLabel = (status: TrialStatus) => {
  switch (status) {
    case 'active':
      return 'Активен'
    case 'ending_soon':
      return 'Скоро завершится'
    case 'expired':
      return 'Истек'
  }
}

export const getTrialStatusTone = (status: TrialStatus) => {
  switch (status) {
    case 'active':
      return 'success'
    case 'ending_soon':
      return 'warning'
    case 'expired':
      return 'error'
  }
}

export const buildTimeline = (event: CallEvent) => {
  const items = [
    { key: 'received', label: getCallStatusLabel('received'), value: event.received_at },
    { key: 'routed', label: getCallStatusLabel('routed'), value: event.routed_at ?? null },
    { key: 'notified', label: getCallStatusLabel('notified'), value: event.notified_at ?? null },
    { key: 'confirmed', label: getCallStatusLabel('confirmed'), value: event.confirmed_at ?? null },
  ]

  if (event.status === 'unknown_button' || event.status === 'invalid_signal' || event.status === 'error') {
    items.push({ key: event.status, label: getCallStatusLabel(event.status), value: event.received_at })
  }

  return items
}
