import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'

import { createInitialState } from '../lib/mockData'
import type {
  AuthUser,
  BindingDraft,
  ButtonBinding,
  CallEvent,
  EmployeeDraft,
  ErrorLog,
  Notification,
  NotificationTone,
  ServiceDraft,
  SimulateSignalInput,
  TableAssignment,
  TableDraft,
} from '../types'

const storageKey = 'qwik-admin-mvp-store'
const initialState = createInitialState()

const createId = (prefix: string) =>
  `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`

const normalizeRadioButtonId = (value: string) => value.trim().toUpperCase()

const inferServiceRole = (serviceId: string, serviceName?: string) => {
  if (serviceId === 'svc-hookah' || serviceName?.toLowerCase().includes('кальян')) {
    return 'hookah'
  }

  return 'waiter'
}

const getAssignmentScope = (
  serviceId: string | null,
  services: Array<{ id: string; name: string; assigned_role?: 'waiter' | 'hookah' }>,
) => {
  if (!serviceId) {
    return 'waiter'
  }

  const service = services.find((item) => item.id === serviceId)
  return service?.assigned_role ?? inferServiceRole(serviceId, service?.name)
}

interface AppState extends ReturnType<typeof createInitialState> {
  authUser: AuthUser | null
  notifications: Notification[]
  login: (username: string, password: string) => boolean
  logout: () => void
  dismissNotification: (id: string) => void
  setSelectedChatEmployeeId: (employeeId: string) => void
  switchMode: (mode: AppState['systemMode']) => void
  saveEmployee: (draft: EmployeeDraft) => boolean
  saveService: (draft: ServiceDraft) => boolean
  saveTable: (draft: TableDraft) => boolean
  saveBinding: (draft: BindingDraft) => boolean
  setBindingActive: (radioButtonId: string, isActive: boolean) => boolean
  createBindingFromNewButton: (radioButtonId: string, tableId: string, serviceId: string) => boolean
  manualResetAssignment: (assignmentId: string) => void
  simulateCheckClose: (tableId: string) => void
  simulateSignal: (payload: SimulateSignalInput) => void
  respondToChatMessage: (messageId: string, employeeId: string) => void
  saveIikoToken: (token: string) => boolean
  saveTimezone: (timezone: string) => boolean
}

type PersistedState = Pick<
  AppState,
  | 'authUser'
  | 'systemMode'
  | 'services'
  | 'tables'
  | 'employees'
  | 'bindings'
  | 'callEvents'
  | 'assignments'
  | 'chatMessages'
  | 'newButtons'
  | 'techLogs'
  | 'errorLogs'
  | 'iiko'
  | 'settings'
  | 'selectedChatEmployeeId'
>

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null

const mergePersistedState = (persistedState: unknown, currentState: AppState): AppState => {
  const persisted = isRecord(persistedState) ? (persistedState as Partial<PersistedState>) : {}
  const persistedSettings = isRecord(persisted.settings)
    ? (persisted.settings as Partial<AppState['settings']>)
    : undefined
  const persistedIiko = isRecord(persisted.iiko)
    ? (persisted.iiko as Partial<AppState['iiko']>)
    : undefined

  const persistedServices = Array.isArray(persisted.services)
    ? persisted.services.map((service) => ({
        ...service,
        assigned_role:
          service && typeof service === 'object' && 'assigned_role' in service
            ? (service.assigned_role as 'waiter' | 'hookah')
            : inferServiceRole(String((service as { id?: string }).id ?? ''), String((service as { name?: string }).name ?? '')),
      }))
    : currentState.services

  return {
    ...currentState,
    authUser: isRecord(persisted.authUser) ? (persisted.authUser as AppState['authUser']) : currentState.authUser,
    systemMode: 'work',
    services: persistedServices,
    tables: Array.isArray(persisted.tables) ? persisted.tables : currentState.tables,
    employees: Array.isArray(persisted.employees) ? persisted.employees : currentState.employees,
    bindings: Array.isArray(persisted.bindings) ? persisted.bindings : currentState.bindings,
    callEvents: Array.isArray(persisted.callEvents) ? persisted.callEvents : currentState.callEvents,
    assignments: Array.isArray(persisted.assignments) ? persisted.assignments : currentState.assignments,
    chatMessages: Array.isArray(persisted.chatMessages) ? persisted.chatMessages : currentState.chatMessages,
    newButtons: Array.isArray(persisted.newButtons) ? persisted.newButtons : currentState.newButtons,
    techLogs: Array.isArray(persisted.techLogs) ? persisted.techLogs : currentState.techLogs,
    errorLogs: Array.isArray(persisted.errorLogs) ? persisted.errorLogs : currentState.errorLogs,
    iiko: {
      ...currentState.iiko,
      ...(persistedIiko ?? {}),
      token: typeof persistedIiko?.token === 'string' ? persistedIiko.token : currentState.iiko.token,
      event_logs: Array.isArray(persistedIiko?.event_logs)
        ? persistedIiko.event_logs
        : currentState.iiko.event_logs,
    },
    settings: {
      ...currentState.settings,
      ...(persistedSettings ?? {}),
    },
    selectedChatEmployeeId:
      typeof persisted.selectedChatEmployeeId === 'string'
        ? persisted.selectedChatEmployeeId
        : currentState.selectedChatEmployeeId,
  }
}

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => {
      const pushNotification = (
        tone: NotificationTone,
        message: string,
        description?: string,
      ) => {
        const id = createId('toast')

        set((state) => ({
          notifications: [{ id, tone, message, description }, ...state.notifications].slice(0, 5),
        }))

        window.setTimeout(() => {
          get().dismissNotification(id)
        }, 4500)
      }

      const appendTechLog = (
        scope: AppState['techLogs'][number]['scope'],
        level: AppState['techLogs'][number]['level'],
        message: string,
      ) => ({
        id: createId('tech'),
        scope,
        level,
        message,
        created_at: new Date().toISOString(),
      })

      const appendErrorLog = (
        component: ErrorLog['component'],
        level: ErrorLog['level'],
        message: string,
        relatedEventId?: string,
      ): ErrorLog => ({
        id: createId('err'),
        component,
        level,
        message,
        created_at: new Date().toISOString(),
        related_event_id: relatedEventId,
      })

      const createEvent = (
        overrides: Partial<CallEvent> & Pick<CallEvent, 'radio_button_id' | 'client_device_id' | 'raw_signal' | 'status'>,
      ): CallEvent => {
        const timestamp = new Date().toISOString()

        return {
          event_id: createId('call'),
          table_id: null,
          service_id: null,
          received_at: timestamp,
          routed_at: null,
          notified_at: null,
          confirmed_at: null,
          responded_by_employee_id: null,
          ...overrides,
        }
      }

      return {
        ...initialState,
        authUser: null,
        notifications: [],
        login: (username, password) => {
          const isValid = username === 'admin' && password === 'admin'

          if (!isValid) {
            pushNotification('error', 'Неверный логин или пароль', 'Используй admin / admin')
            return false
          }

          set({
            authUser: { username: 'admin', display_name: 'Администратор QWIK' },
          })
          pushNotification('success', 'Вход выполнен', 'Добро пожаловать в QWIK Admin')
          return true
        },
        logout: () => {
          set({ authUser: null })
          pushNotification('info', 'Сессия завершена')
        },
        dismissNotification: (id) =>
          set((state) => ({
            notifications: state.notifications.filter((notification) => notification.id !== id),
          })),
        setSelectedChatEmployeeId: (employeeId) => set({ selectedChatEmployeeId: employeeId }),
        switchMode: () => {
          set((state) => ({
            systemMode: 'work',
            techLogs: [
              appendTechLog('system', 'info', 'Система работает в едином рабочем режиме'),
              ...state.techLogs,
            ],
          }))
          pushNotification('success', 'Режим обновлен', 'Активен единый рабочий режим')
        },
        saveEmployee: (draft) => {
          const fullName = draft.full_name.trim()
          const maxUserId = draft.max_user_id.trim()

          if (!fullName) {
            pushNotification('error', 'Укажи имя сотрудника')
            return false
          }

          if (draft.role !== 'admin' && draft.is_active && !maxUserId) {
            pushNotification('warning', 'MAX user id обязателен', 'Активный сотрудник должен быть доступен для MAX-вызовов')
            return false
          }

          if (
            draft.id &&
            !draft.is_active &&
            get().assignments.some(
              (assignment) => assignment.assigned_employee_id === draft.id && assignment.status === 'active',
            )
          ) {
            pushNotification('warning', 'Нельзя деактивировать сотрудника', 'Сначала сними активные закрепления по столам')
            return false
          }

          set((state) => {
            const employeeId = draft.id ?? createId('emp')
            const employee = {
              id: employeeId,
              full_name: fullName,
              role: draft.role,
              max_user_id: maxUserId,
              is_active: draft.is_active,
            }

            const employees = draft.id
              ? state.employees.map((item) => (item.id === draft.id ? employee : item))
              : [employee, ...state.employees]

            return {
              employees,
              techLogs: [
                appendTechLog('system', 'success', `${draft.id ? 'Обновлен' : 'Создан'} сотрудник ${employee.full_name}`),
                ...state.techLogs,
              ],
            }
          })
          pushNotification('success', 'Сотрудник сохранен')
          return true
        },
        saveService: (draft) => {
          const name = draft.name.trim()

          if (!name) {
            pushNotification('error', 'Укажи название услуги')
            return false
          }

          if (draft.id && !draft.is_active) {
            const state = get()
            const serviceScope = draft.assigned_role
            const hasActiveBinding = state.bindings.some(
              (binding) => binding.service_id === draft.id && binding.is_active,
            )
            const hasOpenCall = state.callEvents.some(
              (event) =>
                event.service_id === draft.id &&
                (event.status === 'received' || event.status === 'routed' || event.status === 'notified'),
            )
            const hasActiveAssignment = state.assignments.some(
              (assignment) =>
                assignment.assignment_scope === serviceScope && assignment.status === 'active',
            )

            if (hasActiveBinding || hasOpenCall || hasActiveAssignment) {
              pushNotification(
                'warning',
                'Нельзя деактивировать услугу',
                'Услуга используется в активных привязках или текущих вызовах',
              )
              return false
            }
          }

          set((state) => {
            const serviceId = draft.id ?? createId('svc')
            const service = {
              id: serviceId,
              name,
              assigned_role: draft.assigned_role,
              is_active: draft.is_active,
            }

            const services = draft.id
              ? state.services.map((item) => (item.id === draft.id ? service : item))
              : [service, ...state.services]

            return {
              services,
              techLogs: [
                appendTechLog('system', 'success', `${draft.id ? 'Обновлена' : 'Создана'} услуга ${service.name}`),
                ...state.techLogs,
              ],
            }
          })
          pushNotification('success', 'Услуга сохранена')
          return true
        },
        saveTable: (draft) => {
          const name = draft.name.trim()

          if (!name) {
            pushNotification('error', 'Укажи название стола')
            return false
          }

          if (draft.id && !draft.is_active) {
            const state = get()
            const hasActiveBinding = state.bindings.some(
              (binding) => binding.table_id === draft.id && binding.is_active,
            )
            const hasOpenCall = state.callEvents.some(
              (event) =>
                event.table_id === draft.id &&
                (event.status === 'received' || event.status === 'routed' || event.status === 'notified'),
            )
            const hasActiveAssignment = state.assignments.some(
              (assignment) => assignment.table_id === draft.id && assignment.status === 'active',
            )

            if (hasActiveBinding || hasOpenCall || hasActiveAssignment) {
              pushNotification(
                'warning',
                'Нельзя деактивировать стол',
                'Стол участвует в активных привязках или текущем обслуживании',
              )
              return false
            }
          }

          set((state) => {
            const tableId = draft.id ?? createId('table')
            const table = {
              id: tableId,
              name,
              zone: draft.zone,
              is_active: draft.is_active,
            }

            const tables = draft.id
              ? state.tables.map((item) => (item.id === draft.id ? table : item))
              : [table, ...state.tables]

            return {
              tables,
              techLogs: [
                appendTechLog('system', 'success', `${draft.id ? 'Обновлен' : 'Создан'} ${table.name}`),
                ...state.techLogs,
              ],
            }
          })
          pushNotification('success', 'Стол сохранен')
          return true
        },
        saveBinding: (draft) => {
          const radioId = normalizeRadioButtonId(draft.radio_button_id ?? '')
          if (!radioId) {
            pushNotification('error', 'Укажи radio_button_id')
            return false
          }

          if (!draft.table_id || !draft.service_id) {
            pushNotification('error', 'Выбери стол и услугу')
            return false
          }

          const currentState = get()
          const table = currentState.tables.find((item) => item.id === draft.table_id)
          const service = currentState.services.find((item) => item.id === draft.service_id)

          if (!table || !service) {
            pushNotification('error', 'Не удалось найти стол или услугу')
            return false
          }

          if (draft.is_active && !table.is_active) {
            pushNotification('warning', 'Стол неактивен', 'Активную привязку можно создавать только для активного стола')
            return false
          }

          if (draft.is_active && !service.is_active) {
            pushNotification('warning', 'Услуга неактивна', 'Активную привязку можно создавать только для активной услуги')
            return false
          }

          let isSaved = true
          set((state) => {
            const currentId = draft.original_radio_button_id ?? radioId
            const exists = state.bindings.some(
              (binding) => binding.radio_button_id === radioId && binding.radio_button_id !== currentId,
            )

            if (exists) {
              pushNotification('warning', 'Такой radio_button_id уже существует')
              isSaved = false
              return state
            }

            const binding: ButtonBinding = {
              radio_button_id: radioId,
              table_id: draft.table_id,
              service_id: draft.service_id,
              is_active: draft.is_active,
              created_at:
                state.bindings.find((item) => item.radio_button_id === currentId)?.created_at ??
                new Date().toISOString(),
            }

            const hasCurrent = state.bindings.some((item) => item.radio_button_id === currentId)
            const bindings = hasCurrent
              ? state.bindings.map((item) => (item.radio_button_id === currentId ? binding : item))
              : [binding, ...state.bindings]

            return {
              bindings,
              techLogs: [
                appendTechLog('system', 'success', `${hasCurrent ? 'Обновлена' : 'Создана'} привязка ${radioId}`),
                ...state.techLogs,
              ],
            }
          })

          if (!isSaved) {
            return false
          }

          pushNotification('success', 'Привязка сохранена')
          return true
        },
        setBindingActive: (radioButtonId, isActive) => {
          const binding = get().bindings.find((item) => item.radio_button_id === radioButtonId)

          if (!binding) {
            return false
          }

          if (isActive) {
            const state = get()
            const table = state.tables.find((item) => item.id === binding.table_id)
            const service = state.services.find((item) => item.id === binding.service_id)

            if (!table?.is_active) {
              pushNotification('warning', 'Нельзя активировать привязку', 'Привязанный стол неактивен')
              return false
            }

            if (!service?.is_active) {
              pushNotification('warning', 'Нельзя активировать привязку', 'Привязанная услуга неактивна')
              return false
            }
          }

          set((state) => ({
            bindings: state.bindings.map((binding) =>
              binding.radio_button_id === radioButtonId ? { ...binding, is_active: isActive } : binding,
            ),
            techLogs: [
              appendTechLog(
                'system',
                isActive ? 'success' : 'warning',
                `Привязка ${radioButtonId} ${isActive ? 'активирована' : 'деактивирована'}`,
              ),
              ...state.techLogs,
            ],
          }))
          pushNotification(isActive ? 'success' : 'warning', isActive ? 'Привязка активна' : 'Привязка выключена')
          return true
        },
        createBindingFromNewButton: (radioButtonId, tableId, serviceId) => {
          const state = get()
          const table = state.tables.find((item) => item.id === tableId)
          const service = state.services.find((item) => item.id === serviceId)

          if (!table || !service) {
            pushNotification('error', 'Не удалось найти стол или услугу')
            return false
          }

          if (!table.is_active || !service.is_active) {
            pushNotification('warning', 'Нельзя создать привязку', 'Выбери активные стол и услугу')
            return false
          }

          if (state.bindings.some((binding) => binding.radio_button_id === radioButtonId)) {
            pushNotification('warning', 'Такая привязка уже существует')
            return false
          }

          set((state) => ({
            bindings: [
              {
                radio_button_id: radioButtonId,
                table_id: tableId,
                service_id: serviceId,
                is_active: true,
                created_at: new Date().toISOString(),
              },
              ...state.bindings,
            ],
            newButtons: state.newButtons.filter((button) => button.radio_button_id !== radioButtonId),
            techLogs: [
              appendTechLog('system', 'success', `Для ${radioButtonId} создана новая привязка`),
              ...state.techLogs,
            ],
          }))
          pushNotification('success', 'Новая привязка создана')
          return true
        },
        manualResetAssignment: (assignmentId) => {
          const assignment = get().assignments.find((item) => item.id === assignmentId)
          if (!assignment) {
            return
          }

          set((state) => ({
            assignments: state.assignments.map((item) =>
              item.id === assignmentId
                ? {
                    ...item,
                    status: 'released',
                    released_at: new Date().toISOString(),
                    release_reason: 'manual_reset',
                  }
                : item,
            ),
            techLogs: [
              appendTechLog('system', 'warning', `Закрепление ${assignmentId} снято вручную`),
              ...state.techLogs,
            ],
          }))
          pushNotification('warning', 'Закрепление снято вручную')
        },
        simulateCheckClose: (tableId) => {
          const state = get()
          const assignment = state.assignments.find(
            (item) => item.table_id === tableId && item.assignment_scope === 'waiter' && item.status === 'active',
          )

          if (!assignment) {
            set((current) => ({
              iiko: {
                ...current.iiko,
                last_sync_at: new Date().toISOString(),
                event_logs: [
                  {
                    id: createId('iiko'),
                    type: 'warning',
                    message: `check_closed проигнорирован: по ${tableId} нет активного waiter-закрепления`,
                    created_at: new Date().toISOString(),
                    table_id: tableId,
                  },
                  ...current.iiko.event_logs,
                ],
              },
            }))
            pushNotification('warning', 'Для выбранного стола нет активного чека')
            return
          }

          set((current) => ({
            assignments: current.assignments.map((item) =>
              item.id === assignment.id
                ? {
                    ...item,
                    status: 'released',
                    released_at: new Date().toISOString(),
                    release_reason: 'check_closed',
                  }
                : item,
            ),
            iiko: {
              ...current.iiko,
              last_sync_at: new Date().toISOString(),
              event_logs: [
                {
                  id: createId('iiko'),
                  type: 'check_closed',
                  message: `IIKO закрыл чек ${assignment.iiko_check_id ?? 'без id'}, waiter-закрепление снято`,
                  created_at: new Date().toISOString(),
                  table_id: tableId,
                  assignment_id: assignment.id,
                },
                ...current.iiko.event_logs,
              ],
            },
            techLogs: [
              appendTechLog('iiko', 'success', `Симуляция check_closed выполнена для ${tableId}`),
              ...current.techLogs,
            ],
          }))
          pushNotification('success', 'Закрепление официанта снято по IIKO')
        },
        simulateSignal: (payload) => {
          const radioButtonId = normalizeRadioButtonId(payload.radio_button_id)
          const now = new Date().toISOString()
          const state = get()

          if (!radioButtonId || !/^[A-Z0-9-]{4,}$/.test(radioButtonId)) {
            const invalidEvent = createEvent({
              radio_button_id: radioButtonId,
              client_device_id: payload.client_device_id,
              raw_signal: JSON.stringify(payload),
              status: 'invalid_signal',
              note: 'Radio id не прошел базовую валидацию',
            })

            set((current) => ({
              callEvents: [invalidEvent, ...current.callEvents],
              errorLogs: [
                appendErrorLog('bot', 'warning', 'Симулятор получил invalid_signal', invalidEvent.event_id),
                ...current.errorLogs,
              ],
              techLogs: [
                appendTechLog('simulator', 'warning', `invalid_signal: ${payload.client_device_id}`),
                ...current.techLogs,
              ],
            }))
            pushNotification('error', 'Невалидный сигнал', 'Проверь radio_button_id')
            return
          }

          const lastEvent = [...state.callEvents]
            .sort((left, right) => new Date(right.received_at).getTime() - new Date(left.received_at).getTime())
            .find((event) => event.radio_button_id === radioButtonId)

          if (lastEvent && new Date(now).getTime() - new Date(lastEvent.received_at).getTime() < 2_000) {
            set((current) => ({
              techLogs: [
                appendTechLog('bot', 'warning', `suppressed duplicate: ${radioButtonId}`),
                ...current.techLogs,
              ],
            }))
            pushNotification('warning', 'Дубликат подавлен', 'Повтор пришел быстрее, чем за 2 секунды')
            return
          }

          const binding = state.bindings.find((item) => item.radio_button_id === radioButtonId && item.is_active)

          if (!binding) {
            const unknownEvent = createEvent({
              radio_button_id: radioButtonId,
              client_device_id: payload.client_device_id,
              raw_signal: JSON.stringify(payload),
              status: 'unknown_button',
              note: 'Кнопка не входит в whitelist',
            })

            set((current) => ({
              callEvents: [unknownEvent, ...current.callEvents],
              errorLogs: [
                appendErrorLog('bot', 'warning', `Unknown button ${radioButtonId} в рабочем режиме`, unknownEvent.event_id),
                ...current.errorLogs,
              ],
              techLogs: [
                appendTechLog('bot', 'warning', `unknown_button: ${radioButtonId}`),
                ...current.techLogs,
              ],
            }))
            pushNotification('warning', 'Неизвестная кнопка отправлена в журнал')
            return
          }

          const event = createEvent({
            radio_button_id: radioButtonId,
            client_device_id: payload.client_device_id,
            raw_signal: JSON.stringify(payload),
            status: 'notified',
            table_id: binding.table_id,
            service_id: binding.service_id,
            routed_at: now,
            notified_at: now,
            note: payload.selected_table_id || payload.selected_service_id ? 'Сигнал создан через симулятор' : undefined,
          })

          const table = state.tables.find((item) => item.id === binding.table_id)
          const service = state.services.find((item) => item.id === binding.service_id)
          const messageText = `${table?.name ?? 'Стол'} вызывает ${service?.name.toLowerCase() ?? 'сервис'}`

          set((current) => ({
            callEvents: [event, ...current.callEvents],
            chatMessages: [
              {
                id: createId('msg'),
                event_id: event.event_id,
                table_id: binding.table_id,
                service_id: binding.service_id,
                state: 'open',
                created_at: now,
                text: messageText,
              },
              ...current.chatMessages,
            ],
            techLogs: [
              appendTechLog('bot', 'success', `Вызов ${event.event_id} отправлен в MAX-чат`),
              ...current.techLogs,
            ],
          }))
          pushNotification('success', 'Вызов создан', messageText)
        },
        respondToChatMessage: (messageId, employeeId) => {
          const state = get()
          const message = state.chatMessages.find((item) => item.id === messageId)
          const employee = state.employees.find((item) => item.id === employeeId)

          if (!message || !employee) {
            return
          }

          const event = state.callEvents.find((item) => item.event_id === message.event_id)
          if (!event) {
            return
          }

          const scope = getAssignmentScope(message.service_id, state.services)
          const activeAssignment = state.assignments.find(
            (item) =>
              item.table_id === message.table_id &&
              item.assignment_scope === scope &&
              item.status === 'active',
          )
          const assignedEmployee = state.employees.find((item) => item.id === activeAssignment?.assigned_employee_id)

          if (message.state !== 'open') {
            pushNotification(
              'warning',
              assignedEmployee ? `Стол уже закреплен за ${assignedEmployee.full_name}` : 'Вызов уже обработан',
            )
            return
          }

          if (!employee.is_active) {
            pushNotification('warning', 'Сотрудник неактивен')
            return
          }

          if (!employee.max_user_id.trim()) {
            pushNotification('warning', 'Не заполнен MAX user id', 'Сотрудник не может подтверждать вызовы без идентификатора в MAX')
            return
          }

          if (scope === 'hookah' && employee.role !== 'hookah') {
            pushNotification('warning', 'Вызов доступен только кальянщику')
            return
          }

          if (scope === 'waiter' && employee.role !== 'waiter') {
            pushNotification('warning', 'Данный столик обслуживается другим официантом')
            return
          }

          if (activeAssignment && activeAssignment.assigned_employee_id !== employeeId) {
            pushNotification(
              'warning',
              scope === 'waiter'
                ? 'Данный столик обслуживается другим официантом'
                : `Стол уже закреплен за ${assignedEmployee?.full_name ?? 'другим сотрудником'}`,
            )
            return
          }

          const now = new Date().toISOString()
          const needsAssignment = !activeAssignment
          const assignmentId = activeAssignment?.id ?? createId('assign')

          set((current) => ({
            callEvents: current.callEvents.map((item) =>
              item.event_id === event.event_id
                ? {
                    ...item,
                    status: 'confirmed',
                    confirmed_at: now,
                    responded_by_employee_id: employeeId,
                  }
                : item,
            ),
            chatMessages: current.chatMessages.map((item) =>
              item.id === messageId
                ? {
                    ...item,
                    state: 'closed',
                    responded_by_employee_id: employeeId,
                  }
                : item,
            ),
            assignments: needsAssignment
              ? [
                  {
                    id: assignmentId,
                    table_id: message.table_id,
                    assigned_employee_id: employeeId,
                    assignment_scope: scope,
                    status: 'active',
                    assigned_at: now,
                    iiko_check_id: scope === 'waiter' ? `CHK-${Math.floor(Math.random() * 9000 + 1000)}` : null,
                  } satisfies TableAssignment,
                  ...current.assignments,
                ]
              : current.assignments,
            techLogs: [
              appendTechLog('bot', 'success', `${employee.full_name} обработал вызов ${event.event_id}`),
              ...current.techLogs,
            ],
          }))

          pushNotification(
            'success',
            needsAssignment ? `Стол закреплен за ${employee.full_name}` : `${employee.full_name} подтвердил вызов`,
          )
        },
        saveIikoToken: (token) => {
          const normalizedToken = token.trim()

          if (!normalizedToken) {
            pushNotification('warning', 'Укажи token IIKO')
            return false
          }

          set((state) => ({
            iiko: {
              ...state.iiko,
              token: normalizedToken,
            },
            techLogs: [
              appendTechLog('iiko', 'success', 'IIKO token обновлен в админке'),
              ...state.techLogs,
            ],
          }))
          pushNotification('success', 'Token IIKO сохранен')
          return true
        },
        saveTimezone: (timezone) => {
          const normalizedTimezone = timezone.trim()

          if (!normalizedTimezone) {
            pushNotification('warning', 'Укажи часовой пояс')
            return false
          }

          set((state) => ({
            settings: {
              ...state.settings,
              timezone: normalizedTimezone,
            },
            techLogs: [
              appendTechLog('system', 'success', `Часовой пояс обновлен: ${normalizedTimezone}`),
              ...state.techLogs,
            ],
          }))
          pushNotification('success', 'Часовой пояс сохранен')
          return true
        },
      }
    },
    {
      name: storageKey,
      version: 3,
      storage: createJSONStorage(() => localStorage),
      merge: mergePersistedState,
      partialize: (state): PersistedState => ({
        authUser: state.authUser,
        systemMode: state.systemMode,
        services: state.services,
        tables: state.tables,
        employees: state.employees,
        bindings: state.bindings,
        callEvents: state.callEvents,
        assignments: state.assignments,
        chatMessages: state.chatMessages,
        newButtons: state.newButtons,
        techLogs: state.techLogs,
        errorLogs: state.errorLogs,
        iiko: state.iiko,
        settings: state.settings,
        selectedChatEmployeeId: state.selectedChatEmployeeId,
      }),
    },
  ),
)
