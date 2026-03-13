import type { CallEvent, Employee, TableItem } from '../types'

const hourLabel = (value: string) =>
  new Intl.DateTimeFormat('ru-RU', {
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value))

export const getReactionTimeMs = (event: CallEvent) => {
  if (!event.confirmed_at) {
    return null
  }

  return new Date(event.confirmed_at).getTime() - new Date(event.received_at).getTime()
}

export const buildHourlyCalls = (events: CallEvent[]) => {
  const buckets = new Map<string, number>()

  events
    .filter((event) => event.status !== 'invalid_signal' && event.status !== 'unknown_button')
    .forEach((event) => {
      const key = hourLabel(event.received_at)
      buckets.set(key, (buckets.get(key) ?? 0) + 1)
    })

  return Array.from(buckets.entries()).map(([hour, calls]) => ({ hour, calls }))
}

export const buildReactionTrend = (events: CallEvent[]) =>
  events
    .filter((event) => event.confirmed_at)
    .slice(0, 8)
    .reverse()
    .map((event) => ({
      label: hourLabel(event.received_at),
      seconds: Math.round((getReactionTimeMs(event) ?? 0) / 1000),
    }))

export const buildTopTables = (events: CallEvent[], tables: TableItem[]) => {
  const counters = new Map<string, number>()

  events
    .filter((event) => event.table_id)
    .forEach((event) => {
      counters.set(event.table_id as string, (counters.get(event.table_id as string) ?? 0) + 1)
    })

  return Array.from(counters.entries())
    .map(([tableId, calls]) => ({
      name: tables.find((table) => table.id === tableId)?.name ?? tableId,
      calls,
    }))
    .sort((left, right) => right.calls - left.calls)
    .slice(0, 5)
}

export const buildTopEmployees = (events: CallEvent[], employees: Employee[]) => {
  const counters = new Map<string, number>()

  events
    .filter((event) => event.responded_by_employee_id)
    .forEach((event) => {
      counters.set(event.responded_by_employee_id as string, (counters.get(event.responded_by_employee_id as string) ?? 0) + 1)
    })

  return Array.from(counters.entries())
    .map(([employeeId, confirmedCalls]) => ({
      name: employees.find((employee) => employee.id === employeeId)?.full_name ?? employeeId,
      confirmedCalls,
    }))
    .sort((left, right) => right.confirmedCalls - left.confirmedCalls)
    .slice(0, 5)
}
