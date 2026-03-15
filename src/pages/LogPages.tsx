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
import { formatDateTime, getErrorComponentLabel, getLogLevelLabel, getStatusTone } from '../lib/format'
import { useAppStore } from '../store/useAppStore'

const LogLayout = ({
  title,
  description,
  filters,
  hasData,
  headers,
  children,
  emptyTitle,
  emptyDescription,
}: {
  title: string
  description: string
  filters?: React.ReactNode
  hasData: boolean
  headers: string[]
  children: React.ReactNode
  emptyTitle: string
  emptyDescription: string
}) => (
  <div className="space-y-6">
    <PageHeader title={title} description={description} />
    {filters}
    {hasData ? <DataTable headers={headers}>{children}</DataTable> : <EmptyState title={emptyTitle} description={emptyDescription} />}
  </div>
)

export const UnknownLogPage = () => {
  const callEvents = useAppStore((state) => state.callEvents)
  const [search, setSearch] = useState('')

  const filtered = useMemo(
    () =>
      callEvents.filter(
        (event) =>
          event.status === 'unknown_button' &&
          [event.radio_button_id, event.client_device_id, event.raw_signal]
            .join(' ')
            .toLowerCase()
            .includes(search.toLowerCase()),
      ),
    [callEvents, search],
  )

  return (
    <LogLayout
      title="Журнал неизвестных кнопок"
      description="События типа unknown_button попадают сюда в рабочем режиме."
      hasData={filtered.length > 0}
      headers={['Событие', 'radio_button_id', 'Устройство', 'Режим', 'Время', 'raw_signal']}
      emptyTitle="Записей нет"
      emptyDescription="В рабочем режиме журнал пока пуст."
      filters={
        <Card className="p-4">
          <div className="relative max-w-md">
            <Search className="pointer-events-none absolute left-3 top-3.5 h-4 w-4 text-slate-400" />
            <Input className="pl-9" placeholder="Поиск по неизвестным кнопкам" value={search} onChange={(event) => setSearch(event.target.value)} />
          </div>
        </Card>
      }
    >
      {filtered.map((event) => (
        <tr key={event.event_id}>
          <td className="px-4 py-3 font-semibold text-slate-900">{event.event_id}</td>
          <td className="px-4 py-3 text-slate-600">{event.radio_button_id || '—'}</td>
          <td className="px-4 py-3 text-slate-600">{event.client_device_id}</td>
          <td className="px-4 py-3 text-slate-600">Работа</td>
          <td className="px-4 py-3 text-slate-600">{formatDateTime(event.received_at)}</td>
          <td className="px-4 py-3 font-mono text-xs text-slate-500">{event.raw_signal}</td>
        </tr>
      ))}
    </LogLayout>
  )
}

export const InvalidSignalsPage = () => {
  const callEvents = useAppStore((state) => state.callEvents)
  const [search, setSearch] = useState('')

  const filtered = useMemo(
    () =>
      callEvents.filter(
        (event) =>
          event.status === 'invalid_signal' &&
          [event.event_id, event.raw_signal, event.client_device_id]
            .join(' ')
            .toLowerCase()
            .includes(search.toLowerCase()),
      ),
    [callEvents, search],
  )

  return (
    <LogLayout
      title="Журнал невалидных сигналов"
      description="События типа invalid_signal фиксируются отдельно."
      hasData={filtered.length > 0}
      headers={['Событие', 'Устройство', 'Время', 'raw_signal']}
      emptyTitle="Невалидных сигналов нет"
      emptyDescription="Сейчас невалидные сигналы не зафиксированы."
      filters={
        <Card className="p-4">
          <div className="relative max-w-md">
            <Search className="pointer-events-none absolute left-3 top-3.5 h-4 w-4 text-slate-400" />
            <Input className="pl-9" placeholder="Поиск по невалидным сигналам" value={search} onChange={(event) => setSearch(event.target.value)} />
          </div>
        </Card>
      }
    >
      {filtered.map((event) => (
        <tr key={event.event_id}>
          <td className="px-4 py-3 font-semibold text-slate-900">{event.event_id}</td>
          <td className="px-4 py-3 text-slate-600">{event.client_device_id}</td>
          <td className="px-4 py-3 text-slate-600">{formatDateTime(event.received_at)}</td>
          <td className="px-4 py-3 font-mono text-xs text-slate-500">{event.raw_signal}</td>
        </tr>
      ))}
    </LogLayout>
  )
}

export const ErrorsLogPage = () => {
  const errorLogs = useAppStore((state) => state.errorLogs)
  const callEvents = useAppStore((state) => state.callEvents)
  const [componentFilter, setComponentFilter] = useState('all')
  const [levelFilter, setLevelFilter] = useState('all')

  const filtered = useMemo(
    () =>
      errorLogs.filter((error) => {
        const componentMatches = componentFilter === 'all' || error.component === componentFilter
        const levelMatches = levelFilter === 'all' || error.level === levelFilter
        return componentMatches && levelMatches
      }),
    [componentFilter, errorLogs, levelFilter],
  )

  return (
    <LogLayout
      title="Журнал ошибок"
      description="Ошибки и предупреждения client/backend/bot/iiko."
      hasData={filtered.length > 0}
      headers={['Компонент', 'Уровень', 'Сообщение', 'Связанный event', 'Время']}
      emptyTitle="Ошибок не найдено"
      emptyDescription="По выбранным фильтрам нет ошибок."
      filters={
        <Card className="grid gap-4 p-4 md:grid-cols-2">
          <Select value={componentFilter} onChange={(event) => setComponentFilter(event.target.value)}>
            <option value="all">Все компоненты</option>
            <option value="client">client</option>
            <option value="backend">backend</option>
            <option value="bot">bot</option>
            <option value="iiko">iiko</option>
          </Select>
          <Select value={levelFilter} onChange={(event) => setLevelFilter(event.target.value)}>
            <option value="all">Любой уровень</option>
            <option value="warning">Предупреждение</option>
            <option value="error">Ошибка</option>
          </Select>
        </Card>
      }
    >
      {filtered.map((error) => (
        <tr key={error.id}>
          <td className="px-4 py-3 text-slate-600">{getErrorComponentLabel(error.component)}</td>
          <td className="px-4 py-3">
            <Badge tone={getStatusTone(error.level)}>{getLogLevelLabel(error.level)}</Badge>
          </td>
          <td className="px-4 py-3 text-slate-600">{error.message}</td>
          <td className="px-4 py-3 text-slate-600">
            {error.related_event_id
              ? callEvents.find((event) => event.event_id === error.related_event_id)?.event_id ?? error.related_event_id
              : '—'}
          </td>
          <td className="px-4 py-3 text-slate-600">{formatDateTime(error.created_at)}</td>
        </tr>
      ))}
    </LogLayout>
  )
}
