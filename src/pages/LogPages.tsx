import { Search } from 'lucide-react'
import { useMemo, useState } from 'react'

import {
  Badge,
  Card,
  DataTable,
  EmptyState,
  Input,
  PageHeader,
  Select,
} from '../components/ui'
import {
  formatDateTime,
  getCallStatusLabel,
  getErrorComponentLabel,
  getIikoEventTypeLabel,
  getStatusTone,
  getTableName,
} from '../lib/format'
import { useAppStore } from '../store/useAppStore'

type JournalEntry = {
  id: string
  source: 'signal' | 'client' | 'backend' | 'bot' | 'iiko'
  type: 'unknown_button' | 'invalid_signal' | 'warning' | 'error' | 'iiko_event'
  level: 'info' | 'warning' | 'error'
  message: string
  created_at: string
  reference: string
  raw_value?: string
}

const getJournalTypeLabel = (type: JournalEntry['type']) => {
  switch (type) {
    case 'unknown_button':
      return 'Неизвестная кнопка'
    case 'invalid_signal':
      return 'Невалидный сигнал'
    case 'warning':
      return 'Предупреждение'
    case 'error':
      return 'Ошибка'
    case 'iiko_event':
      return 'Событие IIKO'
  }
}

const getJournalSourceLabel = (source: JournalEntry['source']) => {
  switch (source) {
    case 'signal':
      return 'Сигнал'
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

export const ErrorJournalPage = () => {
  const callEvents = useAppStore((state) => state.callEvents)
  const errorLogs = useAppStore((state) => state.errorLogs)
  const iiko = useAppStore((state) => state.iiko)
  const tables = useAppStore((state) => state.tables)

  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState('all')
  const [sourceFilter, setSourceFilter] = useState('all')

  const entries = useMemo<JournalEntry[]>(() => {
    const signalEntries = callEvents
      .filter((event) => event.status === 'unknown_button' || event.status === 'invalid_signal')
      .map((event) => ({
        id: event.event_id,
        source: 'signal' as const,
        type: event.status as 'unknown_button' | 'invalid_signal',
        level: 'warning' as const,
        message: event.note ?? getCallStatusLabel(event.status),
        created_at: event.received_at,
        reference: event.event_id,
        raw_value: event.raw_signal,
      }))

    const systemErrorEntries = errorLogs.map((error) => ({
      id: error.id,
      source: error.component,
      type: error.level,
      level: error.level,
      message: error.message,
      created_at: error.created_at,
      reference: error.related_event_id ?? '—',
    }))

    const iikoEntries = iiko.event_logs.map((event) => ({
      id: event.id,
      source: 'iiko' as const,
      type: 'iiko_event' as const,
      level: event.type === 'error' ? 'error' as const : event.type === 'warning' ? 'warning' as const : 'info' as const,
      message: event.message,
      created_at: event.created_at,
      reference: event.table_id ? getTableName(event.table_id, tables) : event.assignment_id ?? '—',
      raw_value: getIikoEventTypeLabel(event.type),
    }))

    return [...signalEntries, ...systemErrorEntries, ...iikoEntries].sort(
      (left, right) => new Date(right.created_at).getTime() - new Date(left.created_at).getTime(),
    )
  }, [callEvents, errorLogs, iiko.event_logs, tables])

  const filteredEntries = useMemo(
    () =>
      entries.filter((entry) => {
        const typeMatches = typeFilter === 'all' || entry.type === typeFilter
        const sourceMatches = sourceFilter === 'all' || entry.source === sourceFilter
        const searchMatches = [entry.message, entry.reference, entry.raw_value]
          .filter(Boolean)
          .join(' ')
          .toLowerCase()
          .includes(search.toLowerCase())

        return typeMatches && sourceMatches && searchMatches
      }),
    [entries, search, sourceFilter, typeFilter],
  )

  return (
    <div className="space-y-6">
      <PageHeader
        title="Журнал ошибок"
        description="Единый журнал технических записей, ошибок и событий IIKO с фильтрами по типу и источнику."
      />
      <Card className="grid gap-4 p-4 lg:grid-cols-[minmax(0,1fr)_220px_220px]">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-3.5 h-4 w-4 text-slate-400" />
          <Input
            className="pl-9"
            placeholder="Поиск по сообщению, событию или детали"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
        </div>
        <Select value={typeFilter} onChange={(event) => setTypeFilter(event.target.value)}>
          <option value="all">Все типы</option>
          <option value="unknown_button">Неизвестная кнопка</option>
          <option value="invalid_signal">Невалидный сигнал</option>
          <option value="warning">Предупреждение</option>
          <option value="error">Ошибка</option>
          <option value="iiko_event">Событие IIKO</option>
        </Select>
        <Select value={sourceFilter} onChange={(event) => setSourceFilter(event.target.value)}>
          <option value="all">Все источники</option>
          <option value="signal">Сигнал</option>
          <option value="client">Клиент</option>
          <option value="backend">Бэкенд</option>
          <option value="bot">Бот</option>
          <option value="iiko">IIKO</option>
        </Select>
      </Card>
      {filteredEntries.length === 0 ? (
        <EmptyState title="Записей не найдено" description="Сними фильтры или дождись новых событий системы." />
      ) : (
        <DataTable headers={['Источник', 'Тип', 'Сообщение', 'Связка', 'Деталь', 'Время']}>
          {filteredEntries.map((entry) => (
            <tr key={entry.id}>
              <td className="px-4 py-3 text-slate-600">
                {entry.source === 'client' || entry.source === 'backend' || entry.source === 'bot' || entry.source === 'iiko'
                  ? getErrorComponentLabel(entry.source)
                  : getJournalSourceLabel(entry.source)}
              </td>
              <td className="px-4 py-3">
                <Badge tone={getStatusTone(entry.level)}>{getJournalTypeLabel(entry.type)}</Badge>
              </td>
              <td className="px-4 py-3 text-slate-700">{entry.message}</td>
              <td className="px-4 py-3 text-slate-600">{entry.reference}</td>
              <td className="px-4 py-3 text-slate-500">{entry.raw_value ?? '—'}</td>
              <td className="px-4 py-3 text-slate-600">{formatDateTime(entry.created_at)}</td>
            </tr>
          ))}
        </DataTable>
      )}
    </div>
  )
}
