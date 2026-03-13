import { Eye, RefreshCcw, Search } from 'lucide-react'
import { useMemo, useState } from 'react'

import {
  Badge,
  Button,
  Card,
  ConfirmDialog,
  DataTable,
  Drawer,
  EmptyState,
  KeyValue,
  PageHeader,
  Select,
  StatCard,
  Input,
} from '../components/ui'
import {
  buildTimeline,
  formatDateTime,
  formatDuration,
  getAssignmentSummary,
  getEmployeeName,
  getScopeLabel,
  getServiceName,
  getStatusTone,
  getTableName,
} from '../lib/format'
import { useAppStore } from '../store/useAppStore'

export const CallsRegistryPage = () => {
  const callEvents = useAppStore((state) => state.callEvents)
  const services = useAppStore((state) => state.services)
  const tables = useAppStore((state) => state.tables)
  const employees = useAppStore((state) => state.employees)

  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [serviceFilter, setServiceFilter] = useState('all')
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null)

  const filtered = useMemo(
    () =>
      [...callEvents]
        .sort((left, right) => new Date(right.received_at).getTime() - new Date(left.received_at).getTime())
        .filter((event) => {
          const statusMatches = statusFilter === 'all' || event.status === statusFilter
          const serviceMatches = serviceFilter === 'all' || event.service_id === serviceFilter
          const textMatches = [
            event.event_id,
            event.radio_button_id,
            event.client_device_id,
            getTableName(event.table_id, tables),
            getServiceName(event.service_id, services),
          ]
            .join(' ')
            .toLowerCase()
            .includes(search.toLowerCase())

          return statusMatches && serviceMatches && textMatches
        }),
    [callEvents, search, serviceFilter, services, statusFilter, tables],
  )

  const selectedEvent = callEvents.find((event) => event.event_id === selectedEventId) ?? null
  const activeCalls = callEvents.filter((event) => event.status === 'notified').length
  const confirmedCalls = callEvents.filter((event) => event.status === 'confirmed').length
  const avgReactionSeconds = Math.round(
    callEvents
      .filter((event) => event.confirmed_at)
      .reduce((accumulator, event, _, array) => {
        const seconds =
          (new Date(event.confirmed_at ?? '').getTime() - new Date(event.received_at).getTime()) / 1000
        return accumulator + seconds / array.length
      }, 0),
  )

  return (
    <div className="space-y-6">
      <PageHeader
        title="Реестр вызовов"
        description="Все вызовы, включая рабочие и технические статусы, с деталями и таймлайном."
      />
      <div className="grid gap-4 md:grid-cols-3">
        <StatCard label="Активные вызовы" value={activeCalls} caption="Статус notified" />
        <StatCard label="Подтвержденные" value={confirmedCalls} caption="Статус confirmed" />
        <StatCard label="Среднее время реакции" value={`${avgReactionSeconds || 0}с`} caption="По подтвержденным вызовам" />
      </div>
      <Card className="grid gap-4 p-4 md:grid-cols-3">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-3.5 h-4 w-4 text-slate-400" />
          <Input className="pl-9" placeholder="Поиск по event, столу, устройству" value={search} onChange={(event) => setSearch(event.target.value)} />
        </div>
        <Select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
          <option value="all">Все статусы</option>
          <option value="notified">notified</option>
          <option value="confirmed">confirmed</option>
          <option value="unknown_button">unknown_button</option>
          <option value="invalid_signal">invalid_signal</option>
          <option value="error">error</option>
        </Select>
        <Select value={serviceFilter} onChange={(event) => setServiceFilter(event.target.value)}>
          <option value="all">Все услуги</option>
          {services.map((service) => (
            <option key={service.id} value={service.id}>
              {service.name}
            </option>
          ))}
        </Select>
      </Card>
      {filtered.length === 0 ? (
        <EmptyState title="Вызовы не найдены" description="Попробуй изменить фильтры или создай новые события через симулятор." />
      ) : (
        <DataTable headers={['Event', 'Стол', 'Услуга', 'Статус', 'Устройство', 'Время', 'Отклик', 'Действия']}>
          {filtered.map((event) => (
            <tr key={event.event_id}>
              <td className="px-4 py-3 font-semibold text-slate-900">{event.event_id}</td>
              <td className="px-4 py-3 text-slate-600">{getTableName(event.table_id, tables)}</td>
              <td className="px-4 py-3 text-slate-600">{getServiceName(event.service_id, services)}</td>
              <td className="px-4 py-3">
                <Badge tone={getStatusTone(event.status)}>{event.status}</Badge>
              </td>
              <td className="px-4 py-3 text-slate-600">{event.client_device_id}</td>
              <td className="px-4 py-3 text-slate-600">{formatDateTime(event.received_at)}</td>
              <td className="px-4 py-3 text-slate-600">
                {event.confirmed_at ? formatDuration(event.received_at, event.confirmed_at) : '—'}
              </td>
              <td className="px-4 py-3">
                <Button variant="ghost" onClick={() => setSelectedEventId(event.event_id)}>
                  <Eye className="mr-2 h-4 w-4" />
                  Детали
                </Button>
              </td>
            </tr>
          ))}
        </DataTable>
      )}
      <Drawer open={Boolean(selectedEvent)} title={selectedEvent?.event_id ?? 'Детали вызова'} onClose={() => setSelectedEventId(null)}>
        {selectedEvent ? (
          <div className="space-y-6">
            <Card className="p-5">
              <div className="flex items-center justify-between gap-3">
                <h3 className="text-lg font-semibold text-slate-950">Основные данные</h3>
                <Badge tone={getStatusTone(selectedEvent.status)}>{selectedEvent.status}</Badge>
              </div>
              <div className="mt-4">
                <KeyValue label="Стол" value={getTableName(selectedEvent.table_id, tables)} />
                <KeyValue label="Услуга" value={getServiceName(selectedEvent.service_id, services)} />
                <KeyValue label="radio_button_id" value={selectedEvent.radio_button_id || '—'} />
                <KeyValue label="Устройство" value={selectedEvent.client_device_id} />
                <KeyValue label="Откликнулся" value={getEmployeeName(selectedEvent.responded_by_employee_id, employees)} />
                <KeyValue label="Raw signal" value={<span className="font-mono text-xs">{selectedEvent.raw_signal}</span>} />
                {selectedEvent.note ? <KeyValue label="Заметка" value={selectedEvent.note} /> : null}
              </div>
            </Card>
            <Card className="p-5">
              <h3 className="text-lg font-semibold text-slate-950">Таймлайн статусов</h3>
              <div className="mt-4 space-y-3">
                {buildTimeline(selectedEvent).map((item) => (
                  <div key={item.key} className="flex items-center justify-between rounded-2xl bg-slate-50 px-4 py-3">
                    <div className="font-medium text-slate-900">{item.label}</div>
                    <div className="text-sm text-slate-500">{formatDateTime(item.value)}</div>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        ) : null}
      </Drawer>
    </div>
  )
}

export const TablesAssignmentsPage = () => {
  const tables = useAppStore((state) => state.tables)
  const services = useAppStore((state) => state.services)
  const employees = useAppStore((state) => state.employees)
  const assignments = useAppStore((state) => state.assignments)
  const callEvents = useAppStore((state) => state.callEvents)
  const manualResetAssignment = useAppStore((state) => state.manualResetAssignment)

  const [search, setSearch] = useState('')
  const [zoneFilter, setZoneFilter] = useState('all')
  const [selectedTableId, setSelectedTableId] = useState<string>(tables[0]?.id ?? '')
  const [resetAssignmentId, setResetAssignmentId] = useState<string | null>(null)

  const filteredTables = useMemo(
    () =>
      tables.filter((table) => {
        const zoneMatches = zoneFilter === 'all' || table.zone === zoneFilter
        const searchMatches = table.name.toLowerCase().includes(search.toLowerCase())
        return zoneMatches && searchMatches
      }),
    [search, tables, zoneFilter],
  )

  const selectedTableHistory = assignments
    .filter((assignment) => assignment.table_id === selectedTableId)
    .sort((left, right) => new Date(right.assigned_at).getTime() - new Date(left.assigned_at).getTime())

  const selectedTableCalls = callEvents
    .filter((event) => event.table_id === selectedTableId)
    .sort((left, right) => new Date(right.received_at).getTime() - new Date(left.received_at).getTime())

  const activeWaiter = assignments.filter((assignment) => assignment.status === 'active' && assignment.assignment_scope === 'waiter').length
  const activeHookah = assignments.filter((assignment) => assignment.status === 'active' && assignment.assignment_scope === 'hookah').length

  return (
    <div className="space-y-6">
      <PageHeader
        title="Столы и закрепления"
        description="Контроль waiter/hookah закреплений по столам, история и ручной сброс."
      />
      <div className="grid gap-4 md:grid-cols-3">
        <StatCard label="Waiter-закрепления" value={activeWaiter} caption="Активные" />
        <StatCard label="Hookah-закрепления" value={activeHookah} caption="Активные" />
        <StatCard label="Свободные столы" value={tables.length - activeWaiter} caption="Без waiter assignment" />
      </div>
      <Card className="grid gap-4 p-4 md:grid-cols-2">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-3.5 h-4 w-4 text-slate-400" />
          <Input className="pl-9" placeholder="Поиск столов" value={search} onChange={(event) => setSearch(event.target.value)} />
        </div>
        <Select value={zoneFilter} onChange={(event) => setZoneFilter(event.target.value)}>
          <option value="all">Все зоны</option>
          <option value="Зал">Зал</option>
          <option value="Веранда">Веранда</option>
          <option value="VIP">VIP</option>
        </Select>
      </Card>
      <div className="grid gap-6 xl:grid-cols-[1.4fr_0.9fr]">
        <div className="grid gap-4 md:grid-cols-2">
          {filteredTables.map((table) => {
            const waiterAssignment = assignments.find(
              (assignment) =>
                assignment.table_id === table.id &&
                assignment.assignment_scope === 'waiter' &&
                assignment.status === 'active',
            )
            const hookahAssignment = assignments.find(
              (assignment) =>
                assignment.table_id === table.id &&
                assignment.assignment_scope === 'hookah' &&
                assignment.status === 'active',
            )
            const openCalls = callEvents.filter((event) => event.table_id === table.id && event.status === 'notified').length

            return (
              <Card
                key={table.id}
                className={`cursor-pointer p-5 transition hover:-translate-y-0.5 ${selectedTableId === table.id ? 'ring-2 ring-emerald-200' : ''}`}
                onClick={() => setSelectedTableId(table.id)}
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="text-lg font-semibold text-slate-950">{table.name}</h3>
                    <p className="text-sm text-slate-500">{table.zone}</p>
                  </div>
                  <Badge tone={openCalls > 0 ? 'warning' : 'neutral'}>
                    {openCalls > 0 ? `${openCalls} активн.` : 'Тихо'}
                  </Badge>
                </div>
                <div className="mt-5 space-y-3">
                  <div className="rounded-2xl bg-slate-50 px-4 py-3">
                    <div className="text-xs uppercase tracking-[0.08em] text-slate-400">Официант</div>
                    <div className="mt-1 font-medium text-slate-900">{getAssignmentSummary(waiterAssignment, employees)}</div>
                    {waiterAssignment ? (
                      <Button className="mt-3" variant="ghost" onClick={(event) => {
                        event.stopPropagation()
                        setResetAssignmentId(waiterAssignment.id)
                      }}>
                        <RefreshCcw className="mr-2 h-4 w-4" />
                        Сбросить waiter
                      </Button>
                    ) : null}
                  </div>
                  <div className="rounded-2xl bg-slate-50 px-4 py-3">
                    <div className="text-xs uppercase tracking-[0.08em] text-slate-400">Кальян</div>
                    <div className="mt-1 font-medium text-slate-900">{getAssignmentSummary(hookahAssignment, employees)}</div>
                    {hookahAssignment ? (
                      <Button className="mt-3" variant="ghost" onClick={(event) => {
                        event.stopPropagation()
                        setResetAssignmentId(hookahAssignment.id)
                      }}>
                        <RefreshCcw className="mr-2 h-4 w-4" />
                        Сбросить hookah
                      </Button>
                    ) : null}
                  </div>
                </div>
              </Card>
            )
          })}
        </div>
        <div className="space-y-4">
          <Card className="p-5">
            <h3 className="text-lg font-semibold text-slate-950">История по столу</h3>
            <p className="mt-1 text-sm text-slate-500">{getTableName(selectedTableId, tables)}</p>
            <div className="mt-4 space-y-3">
              {selectedTableHistory.length === 0 ? (
                <p className="text-sm text-slate-500">Закреплений еще не было.</p>
              ) : (
                selectedTableHistory.map((assignment) => (
                  <div key={assignment.id} className="rounded-2xl bg-slate-50 px-4 py-3">
                    <div className="flex items-center justify-between gap-3">
                      <div className="font-medium text-slate-900">
                        {getScopeLabel(assignment.assignment_scope)} · {getEmployeeName(assignment.assigned_employee_id, employees)}
                      </div>
                      <Badge tone={assignment.status === 'active' ? 'success' : 'neutral'}>
                        {assignment.status}
                      </Badge>
                    </div>
                    <div className="mt-2 text-sm text-slate-500">
                      Назначен: {formatDateTime(assignment.assigned_at)}
                      {assignment.released_at ? ` · Снят: ${formatDateTime(assignment.released_at)}` : ''}
                    </div>
                    {assignment.release_reason ? (
                      <div className="mt-1 text-xs uppercase tracking-[0.08em] text-slate-400">
                        reason: {assignment.release_reason}
                      </div>
                    ) : null}
                  </div>
                ))
              )}
            </div>
          </Card>
          <Card className="p-5">
            <h3 className="text-lg font-semibold text-slate-950">Последние вызовы по столу</h3>
            <div className="mt-4 space-y-3">
              {selectedTableCalls.length === 0 ? (
                <p className="text-sm text-slate-500">По столу пока нет вызовов.</p>
              ) : (
                selectedTableCalls.slice(0, 5).map((event) => (
                  <div key={event.event_id} className="rounded-2xl bg-slate-50 px-4 py-3">
                    <div className="flex items-center justify-between gap-3">
                      <div className="font-medium text-slate-900">{getServiceName(event.service_id, services)}</div>
                      <Badge tone={getStatusTone(event.status)}>{event.status}</Badge>
                    </div>
                    <div className="mt-2 text-sm text-slate-500">
                      {formatDateTime(event.received_at)} · {event.event_id}
                    </div>
                  </div>
                ))
              )}
            </div>
          </Card>
        </div>
      </div>
      <ConfirmDialog
        open={Boolean(resetAssignmentId)}
        title="Снять закрепление?"
        description="Используй ручной сброс только если IIKO не прислал check_closed."
        confirmText="Сбросить"
        onClose={() => setResetAssignmentId(null)}
        onConfirm={() => {
          if (resetAssignmentId) {
            manualResetAssignment(resetAssignmentId)
          }
          setResetAssignmentId(null)
        }}
      />
    </div>
  )
}
