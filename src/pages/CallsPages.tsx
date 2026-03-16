import { Eye, Search } from 'lucide-react'
import { useMemo, useState } from 'react'

import {
  Badge,
  Button,
  Card,
  DataTable,
  Drawer,
  EmptyState,
  Input,
  KeyValue,
  Modal,
  PageHeader,
  Select,
  StatCard,
} from '../components/ui'
import {
  buildTimeline,
  formatDateTime,
  formatDuration,
  getAssignmentSummary,
  getAssignmentStatusLabel,
  getCallStatusLabel,
  getDerivedTableStatus,
  getDerivedTableStatusLabel,
  getDerivedTableStatusTone,
  getEmployeeName,
  getReleaseReasonLabel,
  getScopeLabel,
  getServiceName,
  getStatusTone,
  getTableName,
  isPendingWorkingCallStatus,
  isRegistryCallStatus,
} from '../lib/format'
import { useAppStore } from '../store/useAppStore'

const isSameCalendarDay = (value: string, now: Date) => {
  const date = new Date(value)

  return (
    date.getFullYear() === now.getFullYear() &&
    date.getMonth() === now.getMonth() &&
    date.getDate() === now.getDate()
  )
}

export const CallsRegistryPage = () => {
  const callEvents = useAppStore((state) => state.callEvents)
  const services = useAppStore((state) => state.services)
  const tables = useAppStore((state) => state.tables)
  const employees = useAppStore((state) => state.employees)

  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [serviceFilter, setServiceFilter] = useState('all')
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null)

  const registryEvents = useMemo(
    () => callEvents.filter((event) => isRegistryCallStatus(event.status)),
    [callEvents],
  )

  const filtered = useMemo(
    () =>
      [...registryEvents]
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
            getEmployeeName(event.responded_by_employee_id, employees),
          ]
            .join(' ')
            .toLowerCase()
            .includes(search.toLowerCase())

          return statusMatches && serviceMatches && textMatches
        }),
    [employees, registryEvents, search, serviceFilter, services, statusFilter, tables],
  )

  const selectedEvent = registryEvents.find((event) => event.event_id === selectedEventId) ?? null
  const now = new Date()
  const todayEvents = registryEvents.filter((event) => isSameCalendarDay(event.received_at, now))
  const activeCalls = todayEvents.filter((event) => isPendingWorkingCallStatus(event.status)).length
  const confirmedCalls = todayEvents.filter((event) => event.status === 'confirmed').length
  const avgReactionSeconds = Math.round(
    todayEvents
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
        description="Рабочие вызовы по столам с подтверждением, временем реакции и деталями обработки."
      />
      <div className="grid gap-4 md:grid-cols-3">
        <StatCard label="Активные вызовы" value={activeCalls} caption="За сегодня" />
        <StatCard label="Подтвержденные" value={confirmedCalls} caption="За сегодня" />
        <StatCard label="Среднее время реакции" value={`${avgReactionSeconds || 0}с`} caption="За сегодня" />
      </div>
      <Card className="grid gap-4 p-4 md:grid-cols-3">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-3.5 h-4 w-4 text-slate-400" />
          <Input
            className="pl-9"
            placeholder="Поиск по вызову, столу, сотруднику"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
        </div>
        <Select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
          <option value="all">Все статусы</option>
          <option value="received">Получен</option>
          <option value="routed">Маршрутизирован</option>
          <option value="notified">Отправлен в чат</option>
          <option value="confirmed">Подтвержден</option>
          <option value="error">Ошибка</option>
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
        <EmptyState title="Вызовы не найдены" description="Попробуй изменить фильтры или дождись новых рабочих вызовов." />
      ) : (
        <DataTable headers={['Вызов', 'Стол', 'Услуга', 'Сотрудник', 'Статус', 'Получен', 'Подтвержден', 'Реакция', 'Действия']}>
          {filtered.map((event) => (
            <tr key={event.event_id}>
              <td className="px-4 py-3 font-semibold text-slate-900">{event.event_id}</td>
              <td className="px-4 py-3 text-slate-600">{getTableName(event.table_id, tables)}</td>
              <td className="px-4 py-3 text-slate-600">{getServiceName(event.service_id, services)}</td>
              <td className="px-4 py-3 text-slate-600">{getEmployeeName(event.responded_by_employee_id, employees)}</td>
              <td className="px-4 py-3">
                <Badge tone={getStatusTone(event.status)}>{getCallStatusLabel(event.status)}</Badge>
              </td>
              <td className="px-4 py-3 text-slate-600">{formatDateTime(event.received_at)}</td>
              <td className="px-4 py-3 text-slate-600">{formatDateTime(event.confirmed_at)}</td>
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
      <Drawer
        open={Boolean(selectedEvent)}
        title={selectedEvent?.event_id ?? 'Детали вызова'}
        onClose={() => setSelectedEventId(null)}
      >
        {selectedEvent ? (
          <div className="space-y-6">
            <Card className="p-5">
              <div className="flex items-center justify-between gap-3">
                <h3 className="text-lg font-semibold text-slate-950">Основные данные</h3>
                <Badge tone={getStatusTone(selectedEvent.status)}>{getCallStatusLabel(selectedEvent.status)}</Badge>
              </div>
              <div className="mt-4">
                <KeyValue label="Стол" value={getTableName(selectedEvent.table_id, tables)} />
                <KeyValue label="Услуга" value={getServiceName(selectedEvent.service_id, services)} />
                <KeyValue label="radio_button_id" value={selectedEvent.radio_button_id || '—'} />
                <KeyValue label="Устройство" value={selectedEvent.client_device_id} />
                <KeyValue label="Подтвердил" value={getEmployeeName(selectedEvent.responded_by_employee_id, employees)} />
                <KeyValue label="Подтвержден" value={formatDateTime(selectedEvent.confirmed_at)} />
                <KeyValue
                  label="Сырой сигнал"
                  value={<span className="font-mono text-xs">{selectedEvent.raw_signal}</span>}
                />
                {selectedEvent.note ? <KeyValue label="Заметка" value={selectedEvent.note} /> : null}
              </div>
            </Card>
            <Card className="p-5">
              <h3 className="text-lg font-semibold text-slate-950">Таймлайн статусов</h3>
              <div className="mt-4 space-y-3">
                {buildTimeline(selectedEvent).map((item) => (
                  <div
                    key={item.key}
                    className="flex items-center justify-between rounded-2xl bg-slate-50 px-4 py-3"
                  >
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

  const [search, setSearch] = useState('')
  const [zoneFilter, setZoneFilter] = useState('all')
  const [selectedTableId, setSelectedTableId] = useState<string | null>(null)

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
    .filter((event) => event.table_id === selectedTableId && isRegistryCallStatus(event.status))
    .sort((left, right) => new Date(right.received_at).getTime() - new Date(left.received_at).getTime())

  const derivedStatuses = useMemo(
    () =>
      tables.map((table) => ({
        tableId: table.id,
        status: getDerivedTableStatus(table.id, callEvents),
      })),
    [callEvents, tables],
  )

  const freeTables = derivedStatuses.filter((item) => item.status === 'free').length
  const waitingTables = derivedStatuses.filter((item) => item.status === 'waiting').length
  const confirmedTables = derivedStatuses.filter((item) => item.status === 'confirmed').length
  const activeAssignments = assignments.filter((assignment) => assignment.status === 'active').length

  return (
    <div className="space-y-6">
      <PageHeader
        title="Столы и закрепления"
        description="Статус столов и актуальные waiter/hookah закрепления. История открывается по клику на карточку стола."
      />
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Свободные столы" value={freeTables} />
        <StatCard label="Столы в ожидании" value={waitingTables} />
        <StatCard label="Подтвержденные столы" value={confirmedTables} />
        <StatCard label="Активные закрепления" value={activeAssignments} caption="Официант и кальян" />
      </div>
      <Card className="grid gap-4 p-4 md:grid-cols-2">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-3.5 h-4 w-4 text-slate-400" />
          <Input
            className="pl-9"
            placeholder="Поиск столов"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
        </div>
        <Select value={zoneFilter} onChange={(event) => setZoneFilter(event.target.value)}>
          <option value="all">Все зоны</option>
          <option value="Зал">Зал</option>
          <option value="Веранда">Веранда</option>
          <option value="VIP">VIP</option>
        </Select>
      </Card>
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
          const tableStatus = getDerivedTableStatus(table.id, callEvents)
          const openCalls = callEvents.filter(
            (event) => event.table_id === table.id && isPendingWorkingCallStatus(event.status),
          ).length

          return (
            <Card
              key={table.id}
              className="cursor-pointer p-5 transition hover:-translate-y-0.5 hover:shadow-[0_12px_30px_rgba(15,23,42,0.08)]"
              onClick={() => setSelectedTableId(table.id)}
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 className="text-lg font-semibold text-slate-950">{table.name}</h3>
                  <p className="text-sm text-slate-500">{table.zone}</p>
                </div>
                <Badge tone={getDerivedTableStatusTone(tableStatus)}>
                  {getDerivedTableStatusLabel(tableStatus)}
                </Badge>
              </div>
              <div className="mt-4 text-sm text-slate-500">
                {openCalls > 0
                  ? `Неподтвержденных вызовов: ${openCalls}`
                  : tableStatus === 'confirmed'
                    ? 'Последний вызов подтвержден'
                    : 'Активных вызовов нет'}
              </div>
              <div className="mt-5 space-y-3">
                <div className="rounded-2xl bg-slate-50 px-4 py-3">
                  <div className="text-xs uppercase tracking-[0.08em] text-slate-400">Официант</div>
                  <div className="mt-1 font-medium text-slate-900">
                    {getAssignmentSummary(waiterAssignment, employees)}
                  </div>
                </div>
                <div className="rounded-2xl bg-slate-50 px-4 py-3">
                  <div className="text-xs uppercase tracking-[0.08em] text-slate-400">Кальян</div>
                  <div className="mt-1 font-medium text-slate-900">
                    {getAssignmentSummary(hookahAssignment, employees)}
                  </div>
                </div>
              </div>
            </Card>
          )
        })}
      </div>
      <Modal
        open={Boolean(selectedTableId)}
        title={selectedTableId ? `История по столу: ${getTableName(selectedTableId, tables)}` : 'История по столу'}
        onClose={() => setSelectedTableId(null)}
        footer={
          <div className="flex justify-end">
            <Button variant="ghost" onClick={() => setSelectedTableId(null)}>
              Закрыть
            </Button>
          </div>
        }
      >
        <div className="grid gap-6 xl:grid-cols-2">
          <Card className="p-5">
            <h3 className="text-lg font-semibold text-slate-950">История закреплений</h3>
            <div className="mt-4 space-y-3">
              {selectedTableHistory.length === 0 ? (
                <p className="text-sm text-slate-500">По столу еще не было закреплений.</p>
              ) : (
                selectedTableHistory.map((assignment) => (
                  <div key={assignment.id} className="rounded-2xl bg-slate-50 px-4 py-3">
                    <div className="flex items-center justify-between gap-3">
                      <div className="font-medium text-slate-900">
                        {getScopeLabel(assignment.assignment_scope)} ·{' '}
                        {getEmployeeName(assignment.assigned_employee_id, employees)}
                      </div>
                      <Badge tone={assignment.status === 'active' ? 'success' : 'neutral'}>
                        {getAssignmentStatusLabel(assignment.status)}
                      </Badge>
                    </div>
                    <div className="mt-2 text-sm text-slate-500">
                      Назначен: {formatDateTime(assignment.assigned_at)}
                      {assignment.released_at ? ` · Снят: ${formatDateTime(assignment.released_at)}` : ''}
                    </div>
                    {assignment.release_reason ? (
                      <div className="mt-1 text-xs uppercase tracking-[0.08em] text-slate-400">
                        Причина: {getReleaseReasonLabel(assignment.release_reason)}
                      </div>
                    ) : null}
                  </div>
                ))
              )}
            </div>
          </Card>
          <Card className="p-5">
            <h3 className="text-lg font-semibold text-slate-950">Последние вызовы</h3>
            <div className="mt-4 space-y-3">
              {selectedTableCalls.length === 0 ? (
                <p className="text-sm text-slate-500">По столу пока нет рабочих вызовов.</p>
              ) : (
                selectedTableCalls.slice(0, 6).map((event) => (
                  <div key={event.event_id} className="rounded-2xl bg-slate-50 px-4 py-3">
                    <div className="flex items-center justify-between gap-3">
                      <div className="font-medium text-slate-900">{getServiceName(event.service_id, services)}</div>
                      <Badge tone={getStatusTone(event.status)}>{getCallStatusLabel(event.status)}</Badge>
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
      </Modal>
    </div>
  )
}
