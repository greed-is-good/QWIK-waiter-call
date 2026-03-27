export type Role = 'waiter' | 'hookah' | 'admin'
export type ServiceRole = 'waiter' | 'hookah'
export type SystemMode = 'work'
export type TrialStatus = 'active' | 'ending_soon' | 'expired'
export type CallStatus =
  | 'received'
  | 'routed'
  | 'notified'
  | 'confirmed'
  | 'unknown_button'
  | 'invalid_signal'
  | 'error'
export type AssignmentScope = 'waiter' | 'hookah'
export type AssignmentStatus = 'active' | 'released'
export type ReleaseReason = 'check_closed' | 'manual_reset' | 'timeout' | 'iiko_error'
export type ErrorComponent = 'client' | 'backend' | 'bot' | 'iiko'
export type LogLevel = 'info' | 'success' | 'warning' | 'error'
export type NotificationTone = 'info' | 'success' | 'warning' | 'error'

export interface Service {
  id: string
  name: string
  assigned_role: ServiceRole
  is_active: boolean
}

export interface TableItem {
  id: string
  name: string
  zone: 'Зал' | 'Веранда' | 'VIP'
  is_active: boolean
}

export interface Employee {
  id: string
  full_name: string
  role: Role
  max_user_id: string
  is_active: boolean
}

export interface ButtonBinding {
  radio_button_id: string
  table_id: string
  service_id: string
  is_active: boolean
  created_at: string
}

export interface CallEvent {
  event_id: string
  client_device_id: string
  radio_button_id: string
  table_id: string | null
  service_id: string | null
  status: CallStatus
  received_at: string
  routed_at?: string | null
  notified_at?: string | null
  confirmed_at?: string | null
  responded_by_employee_id?: string | null
  raw_signal: string
  note?: string
}

export interface TableAssignment {
  id: string
  table_id: string
  assigned_employee_id: string
  assignment_scope: AssignmentScope
  status: AssignmentStatus
  assigned_at: string
  released_at?: string | null
  release_reason?: ReleaseReason | null
  iiko_check_id?: string | null
}

export interface ChatMessage {
  id: string
  event_id: string
  table_id: string
  service_id: string
  state: 'open' | 'closed'
  created_at: string
  responded_by_employee_id?: string | null
  text: string
}

export interface NewButtonSignal {
  radio_button_id: string
  first_seen_at: string
  last_seen_at: string
  samples_count: number
  last_client_device_id: string
  raw_signal: string
}

export interface TechLog {
  id: string
  scope: 'system' | 'bot' | 'simulator' | 'iiko'
  level: LogLevel
  message: string
  created_at: string
}

export interface ErrorLog {
  id: string
  component: ErrorComponent
  level: 'warning' | 'error'
  message: string
  created_at: string
  related_event_id?: string
}

export interface IikoEventLog {
  id: string
  type: 'sync' | 'check_closed' | 'warning' | 'error'
  message: string
  created_at: string
  table_id?: string
  assignment_id?: string
}

export interface IikoState {
  token: string
  status: 'connected' | 'degraded' | 'disconnected'
  last_sync_at: string
  event_logs: IikoEventLog[]
}

export interface TrialState {
  activated_at: string
  duration_days: number
}

export interface SettingsState {
  restaurant_name: string
  timezone: string
  support_phone: string
}

export interface AuthUser {
  username: string
  display_name: string
}

export interface Notification {
  id: string
  tone: NotificationTone
  message: string
  description?: string
}

export interface SimulateSignalInput {
  radio_button_id: string
  client_device_id: string
  selected_table_id?: string
  selected_service_id?: string
}

export interface BindingDraft {
  original_radio_button_id?: string
  radio_button_id?: string
  table_id: string
  service_id: string
  is_active: boolean
}

export interface EmployeeDraft {
  id?: string
  full_name: string
  role: Role
  max_user_id: string
  is_active: boolean
}

export interface ServiceDraft {
  id?: string
  name: string
  assigned_role: ServiceRole
  is_active: boolean
}

export interface TableDraft {
  id?: string
  name: string
  zone: TableItem['zone']
  is_active: boolean
}
