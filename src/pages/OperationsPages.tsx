import { AlertTriangle, BarChart3, Bot, Cable, CheckCircle2, Play, ShieldAlert } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'

import {
  Badge,
  Button,
  Card,
  ConfirmDialog,
  Field,
  Input,
  PageHeader,
  Select,
  StatCard,
} from '../components/ui'
import {
  buildHourlyCalls,
  buildReactionTrend,
  buildTopEmployees,
  buildTopTables,
  getReactionTimeMs,
} from '../lib/analytics'
import {
  formatDateTime,
  getChatMessageStateLabel,
  getDeviceStatusLabel,
  getEmployeeName,
  getIikoEventTypeLabel,
  getIikoStatusLabel,
  getHealthStatusLabel,
  getRoleLabel,
  getServiceName,
  getStatusTone,
  getTableName,
  isRegistryCallStatus,
} from '../lib/format'
import { useAppStore } from '../store/useAppStore'

export const SystemModePage = () => {
  const systemMode = useAppStore((state) => state.systemMode)
  const switchMode = useAppStore((state) => state.switchMode)
  const [pendingMode, setPendingMode] = useState<'configuration' | 'work' | null>(null)

  return (
    <div className="space-y-6">
      <PageHeader
        title="Режимы системы"
        description="Конфигурация принимает новые radio_button_id, работа допускает только whitelist."
      />
      <div className="grid gap-6 lg:grid-cols-2">
        <Card className={`p-6 ${systemMode === 'configuration' ? 'ring-2 ring-amber-200' : ''}`}>
          <div className="flex items-center justify-between gap-4">
            <div>
              <h3 className="text-xl font-semibold text-slate-950">Конфигурация</h3>
              <p className="mt-2 text-sm text-slate-500">
                Неизвестные кнопки принимаются, попадают в раздел "Новые кнопки" и ждут привязки.
              </p>
            </div>
            <Badge tone="warning">{systemMode === 'configuration' ? 'Активен' : 'Доступен'}</Badge>
          </div>
          <ul className="mt-5 space-y-2 text-sm text-slate-600">
            <li>Пойманные unknown radio_button_id не теряются.</li>
            <li>Удобно для onboarding нового оборудования.</li>
            <li>Не подходит для боевой обработки зала.</li>
          </ul>
          <Button className="mt-6" variant={systemMode === 'configuration' ? 'ghost' : 'secondary'} onClick={() => setPendingMode('configuration')}>
            Переключить в конфигурацию
          </Button>
        </Card>
        <Card className={`p-6 ${systemMode === 'work' ? 'ring-2 ring-emerald-200' : ''}`}>
          <div className="flex items-center justify-between gap-4">
            <div>
              <h3 className="text-xl font-semibold text-slate-950">Работа</h3>
              <p className="mt-2 text-sm text-slate-500">
                Вызовы обслуживаются только по активным ButtonBinding. Остальное уходит в unknown_button.
              </p>
            </div>
            <Badge tone="success">{systemMode === 'work' ? 'Активен' : 'Доступен'}</Badge>
          </div>
          <ul className="mt-5 space-y-2 text-sm text-slate-600">
            <li>Whitelist защищает от случайных сигналов.</li>
            <li>Боевой режим для запуска и демонстрации сценариев MAX.</li>
            <li>Unknown события сохраняются в журнале для расследования.</li>
          </ul>
          <Button className="mt-6" onClick={() => setPendingMode('work')}>
            Переключить в работу
          </Button>
        </Card>
      </div>
      <ConfirmDialog
        open={Boolean(pendingMode)}
        title="Подтвердить переключение режима?"
        description={
          pendingMode === 'work'
            ? 'После переключения система начнет принимать только кнопки из whitelist.'
            : 'После переключения система будет принимать неизвестные кнопки и показывать их в разделе onboarding.'
        }
        confirmText="Переключить"
        tone={pendingMode === 'work' ? 'primary' : 'danger'}
        onClose={() => setPendingMode(null)}
        onConfirm={() => {
          if (pendingMode) {
            switchMode(pendingMode)
          }
          setPendingMode(null)
        }}
      />
    </div>
  )
}

export const IntegrationsPage = () => {
  const iiko = useAppStore((state) => state.iiko)
  const tables = useAppStore((state) => state.tables)
  const assignments = useAppStore((state) => state.assignments)
  const simulateCheckClose = useAppStore((state) => state.simulateCheckClose)
  const [tableId, setTableId] = useState('table-3')

  return (
    <div className="space-y-6">
      <PageHeader
        title="IIKO интеграция"
        description="Mock-слой статуса интеграции, лента событий и ручной триггер check_closed."
      />
      <div className="grid gap-4 md:grid-cols-3">
        <StatCard label="Статус IIKO" value={getIikoStatusLabel(iiko.status)} caption={`Последняя синхронизация: ${formatDateTime(iiko.last_sync_at)}`} />
        <StatCard label="Активных чеков" value={assignments.filter((item) => item.status === 'active' && item.assignment_scope === 'waiter').length} />
        <StatCard label="IIKO событий" value={iiko.event_logs.length} />
      </div>
      <div className="grid gap-6 xl:grid-cols-[1fr_1.1fr]">
        <Card className="p-6">
          <div className="flex items-center gap-3">
            <Cable className="h-5 w-5 text-emerald-900" />
            <h3 className="text-lg font-semibold text-slate-950">Симуляция check_closed</h3>
          </div>
          <p className="mt-2 text-sm text-slate-500">
            Закрытие чека снимает waiter-закрепление. Hookah-закрепление не затрагивается.
          </p>
          <div className="mt-5 grid gap-4">
            <Field label="Стол">
              <Select value={tableId} onChange={(event) => setTableId(event.target.value)}>
                {tables.map((table) => (
                  <option key={table.id} value={table.id}>
                    {table.name}
                  </option>
                ))}
              </Select>
            </Field>
            <Button onClick={() => simulateCheckClose(tableId)}>
              Симулировать закрытие чека
            </Button>
          </div>
          <div className="mt-6 rounded-2xl bg-slate-50 p-4 text-sm text-slate-600">
            Активное закрепление официанта: <span className="font-semibold text-slate-900">{assignments.find((item) => item.table_id === tableId && item.status === 'active' && item.assignment_scope === 'waiter')?.iiko_check_id ?? 'нет'}</span>
          </div>
        </Card>
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-slate-950">Лента IIKO событий</h3>
          <div className="mt-4 space-y-3">
            {iiko.event_logs.map((log) => (
              <div key={log.id} className="rounded-2xl bg-slate-50 px-4 py-3">
                <div className="flex items-center justify-between gap-3">
                  <Badge tone={log.type === 'check_closed' || log.type === 'sync' ? 'success' : log.type === 'warning' ? 'warning' : 'error'}>
                    {getIikoEventTypeLabel(log.type)}
                  </Badge>
                  <span className="text-sm text-slate-500">{formatDateTime(log.created_at)}</span>
                </div>
                <div className="mt-2 text-sm text-slate-700">{log.message}</div>
                {log.table_id ? <div className="mt-1 text-xs uppercase tracking-[0.08em] text-slate-400">{getTableName(log.table_id, tables)}</div> : null}
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  )
}

export const AnalyticsPage = () => {
  const callEvents = useAppStore((state) => state.callEvents)
  const tables = useAppStore((state) => state.tables)
  const employees = useAppStore((state) => state.employees)
  const assignments = useAppStore((state) => state.assignments)
  const businessEvents = useMemo(
    () => callEvents.filter((event) => isRegistryCallStatus(event.status)),
    [callEvents],
  )

  const kpis = {
    totalCalls: businessEvents.length,
    confirmedRate: businessEvents.length
      ? `${Math.round((businessEvents.filter((event) => event.status === 'confirmed').length / businessEvents.length) * 100)}%`
      : '0%',
    avgReaction: `${Math.round(
      businessEvents
        .map((event) => getReactionTimeMs(event) ?? 0)
        .filter(Boolean)
        .reduce((accumulator, value, _, array) => accumulator + value / array.length, 0) / 1000,
    ) || 0}с`,
    activeAssignments: assignments.filter((assignment) => assignment.status === 'active').length,
  }

  const hourlyData = buildHourlyCalls(businessEvents)
  const reactionData = buildReactionTrend(businessEvents)
  const topTables = buildTopTables(businessEvents, tables)
  const topEmployees = buildTopEmployees(businessEvents, employees)

  return (
    <div className="space-y-6">
      <PageHeader
        title="Аналитика DataLens"
        description="KPI-карточки, placeholder iframe и простые графики на моковых данных."
      />
      <div className="grid gap-4 md:grid-cols-4">
        <StatCard label="Всего вызовов" value={kpis.totalCalls} />
        <StatCard label="Доля подтвержденных" value={kpis.confirmedRate} />
        <StatCard label="Средняя реакция" value={kpis.avgReaction} />
        <StatCard label="Активные закрепления" value={kpis.activeAssignments} />
      </div>
      <div className="grid gap-6 xl:grid-cols-2">
        <Card className="p-6">
          <div className="flex items-center gap-3">
            <BarChart3 className="h-5 w-5 text-emerald-900" />
            <h3 className="text-lg font-semibold text-slate-950">Вызовы по времени</h3>
          </div>
          <div className="mt-4 h-72">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={hourlyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#dbe3dd" />
                <XAxis dataKey="hour" />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Line type="monotone" dataKey="calls" stroke="#14532d" strokeWidth={3} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Card>
        <Card className="p-6">
          <div className="flex items-center gap-3">
            <CheckCircle2 className="h-5 w-5 text-emerald-900" />
            <h3 className="text-lg font-semibold text-slate-950">Среднее время реакции</h3>
          </div>
          <div className="mt-4 h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={reactionData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#dbe3dd" />
                <XAxis dataKey="label" />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Bar dataKey="seconds" fill="#0f766e" radius={[10, 10, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>
      <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-slate-950">Заглушка iframe DataLens</h3>
          <div className="mt-4 flex h-72 items-center justify-center rounded-3xl border border-dashed border-emerald-200 bg-emerald-50 text-center text-sm text-emerald-900">
            <div>
              <div className="font-semibold">Демо-встраивание готово для замены на реальный DataLens iframe</div>
              <div className="mt-2 text-emerald-700">Здесь будет встраиваемая аналитическая панель ресторана.</div>
            </div>
          </div>
        </Card>
        <div className="space-y-6">
          <Card className="p-6">
            <h3 className="text-lg font-semibold text-slate-950">Топ столов</h3>
            <div className="mt-4 space-y-3">
              {topTables.map((table) => (
                <div key={table.name} className="flex items-center justify-between rounded-2xl bg-slate-50 px-4 py-3">
                  <span className="font-medium text-slate-900">{table.name}</span>
                  <Badge tone="info">{table.calls} вызовов</Badge>
                </div>
              ))}
            </div>
          </Card>
          <Card className="p-6">
            <h3 className="text-lg font-semibold text-slate-950">Топ сотрудников</h3>
            <div className="mt-4 space-y-3">
              {topEmployees.map((employee) => (
                <div key={employee.name} className="flex items-center justify-between rounded-2xl bg-slate-50 px-4 py-3">
                  <span className="font-medium text-slate-900">{employee.name}</span>
                  <Badge tone="success">{employee.confirmedCalls} подтверждений</Badge>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}

export const SettingsPage = () => {
  const settings = useAppStore((state) => state.settings)

  return (
    <div className="space-y-6">
      <PageHeader
        title="Настройки"
        description="Mock-настройки ресторана, список client devices и health checks."
      />
      <div className="grid gap-6 xl:grid-cols-[1fr_1fr]">
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-slate-950">Информация о ресторане</h3>
          <div className="mt-4 space-y-3 text-sm text-slate-600">
            <div className="rounded-2xl bg-slate-50 px-4 py-3">
              <div className="text-xs uppercase tracking-[0.08em] text-slate-400">Название</div>
              <div className="mt-1 font-semibold text-slate-900">{settings.restaurant_name}</div>
            </div>
            <div className="rounded-2xl bg-slate-50 px-4 py-3">
              <div className="text-xs uppercase tracking-[0.08em] text-slate-400">Timezone</div>
              <div className="mt-1 font-semibold text-slate-900">{settings.timezone}</div>
            </div>
            <div className="rounded-2xl bg-slate-50 px-4 py-3">
              <div className="text-xs uppercase tracking-[0.08em] text-slate-400">Поддержка</div>
              <div className="mt-1 font-semibold text-slate-900">{settings.support_phone}</div>
            </div>
          </div>
        </Card>
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-slate-950">Клиентские устройства</h3>
          <div className="mt-4 space-y-3">
            {settings.client_devices.map((device) => (
              <div key={device.id} className="flex items-center justify-between rounded-2xl bg-slate-50 px-4 py-3">
                <div>
                  <div className="font-medium text-slate-900">{device.name}</div>
                  <div className="text-sm text-slate-500">{device.location}</div>
                </div>
                <Badge tone={device.status === 'online' ? 'success' : device.status === 'warning' ? 'warning' : 'error'}>
                  {getDeviceStatusLabel(device.status)}
                </Badge>
              </div>
            ))}
          </div>
        </Card>
      </div>
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-slate-950">Проверки состояния</h3>
        <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {settings.health_checks.map((item) => (
            <div key={item.id} className="rounded-2xl bg-slate-50 p-4">
              <div className="flex items-center justify-between gap-3">
                <div className="font-medium text-slate-900">{item.name}</div>
                <Badge tone={item.status === 'healthy' ? 'success' : item.status === 'warning' ? 'warning' : 'error'}>
                  {getHealthStatusLabel(item.status)}
                </Badge>
              </div>
              <div className="mt-2 text-sm text-slate-500">{item.details}</div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  )
}

export const SimulatorPage = () => {
  const bindings = useAppStore((state) => state.bindings ?? [])
  const services = useAppStore((state) => state.services ?? [])
  const tables = useAppStore((state) => state.tables ?? [])
  const employees = useAppStore((state) =>
    (state.employees ?? []).filter((employee) => employee.role !== 'admin'),
  )
  const chatMessages = useAppStore((state) => state.chatMessages ?? [])
  const assignments = useAppStore((state) => state.assignments ?? [])
  const settings = useAppStore((state) => state.settings)
  const selectedChatEmployeeId = useAppStore((state) => state.selectedChatEmployeeId)
  const setSelectedChatEmployeeId = useAppStore((state) => state.setSelectedChatEmployeeId)
  const simulateSignal = useAppStore((state) => state.simulateSignal)
  const respondToChatMessage = useAppStore((state) => state.respondToChatMessage)
  const simulateCheckClose = useAppStore((state) => state.simulateCheckClose)
  const systemMode = useAppStore((state) => state.systemMode)
  const clientDevices = settings.client_devices ?? []

  const [radioMode, setRadioMode] = useState<'binding' | 'manual'>('binding')
  const [selectedBindingId, setSelectedBindingId] = useState(bindings[0]?.radio_button_id ?? '')
  const [manualRadioId, setManualRadioId] = useState('RB-W-1003')
  const [selectedTableId, setSelectedTableId] = useState(tables[0]?.id ?? '')
  const [selectedServiceId, setSelectedServiceId] = useState(services[0]?.id ?? '')
  const [clientDeviceId, setClientDeviceId] = useState(clientDevices[0]?.id ?? 'device-hall-1')
  const [checkCloseTableId, setCheckCloseTableId] = useState('table-3')

  useEffect(() => {
    if (!selectedBindingId && bindings[0]?.radio_button_id) {
      setSelectedBindingId(bindings[0].radio_button_id)
    }
  }, [bindings, selectedBindingId])

  useEffect(() => {
    if (!selectedTableId && tables[0]?.id) {
      setSelectedTableId(tables[0].id)
    }
  }, [selectedTableId, tables])

  useEffect(() => {
    if (!selectedServiceId && services[0]?.id) {
      setSelectedServiceId(services[0].id)
    }
  }, [selectedServiceId, services])

  useEffect(() => {
    if (!clientDeviceId && clientDevices[0]?.id) {
      setClientDeviceId(clientDevices[0].id)
    }
  }, [clientDeviceId, clientDevices])

  useEffect(() => {
    if (!selectedChatEmployeeId && employees[0]?.id) {
      setSelectedChatEmployeeId(employees[0].id)
    }
  }, [employees, selectedChatEmployeeId, setSelectedChatEmployeeId])

  const sortedMessages = useMemo(
    () =>
      [...chatMessages].sort((left, right) => new Date(right.created_at).getTime() - new Date(left.created_at).getTime()),
    [chatMessages],
  )

  const activeWaiterCheck = assignments.find(
    (assignment) => assignment.table_id === checkCloseTableId && assignment.assignment_scope === 'waiter' && assignment.status === 'active',
  )

  return (
    <div className="space-y-6">
      <PageHeader
        title="Симулятор событий"
        description={`Режим системы: ${systemMode === 'work' ? 'Работа' : 'Конфигурация'}. Здесь можно прогнать MAX и IIKO сценарии end-to-end.`}
      />
      <div className="grid gap-6 xl:grid-cols-3">
        <Card className="p-6">
          <div className="flex items-center gap-3">
            <Play className="h-5 w-5 text-emerald-900" />
            <h3 className="text-lg font-semibold text-slate-950">Сгенерировать нажатие кнопки</h3>
          </div>
          <div className="mt-5 space-y-4">
            <Field label="Источник radio_button_id">
              <Select value={radioMode} onChange={(event) => setRadioMode(event.target.value as 'binding' | 'manual')}>
                <option value="binding">Из привязок</option>
                <option value="manual">Вручную</option>
              </Select>
            </Field>
            {radioMode === 'binding' ? (
              <Field label="Привязка">
                <Select value={selectedBindingId} onChange={(event) => setSelectedBindingId(event.target.value)}>
                  {bindings.map((binding) => (
                    <option key={binding.radio_button_id} value={binding.radio_button_id}>
                      {binding.radio_button_id} · {getTableName(binding.table_id, tables)} · {getServiceName(binding.service_id, services)}
                    </option>
                  ))}
                </Select>
              </Field>
            ) : (
              <Field label="radio_button_id">
                <Input value={manualRadioId} onChange={(event) => setManualRadioId(event.target.value)} />
              </Field>
            )}
            <Field label="Стол">
              <Select value={selectedTableId} onChange={(event) => setSelectedTableId(event.target.value)}>
                {tables.map((table) => (
                  <option key={table.id} value={table.id}>
                    {table.name}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Услуга">
              <Select value={selectedServiceId} onChange={(event) => setSelectedServiceId(event.target.value)}>
                {services.map((service) => (
                  <option key={service.id} value={service.id}>
                    {service.name}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Client device">
              <Select value={clientDeviceId} onChange={(event) => setClientDeviceId(event.target.value)}>
                {clientDevices.map((device) => (
                  <option key={device.id} value={device.id}>
                    {device.name}
                  </option>
                ))}
              </Select>
            </Field>
            <Button
              onClick={() =>
                simulateSignal({
                  radio_button_id: radioMode === 'binding' ? selectedBindingId : manualRadioId,
                  client_device_id: clientDeviceId,
                  selected_table_id: selectedTableId,
                  selected_service_id: selectedServiceId,
                })
              }
            >
              Отправить сигнал
            </Button>
          </div>
        </Card>
        <Card className="p-6 xl:col-span-1">
          <div className="flex items-center gap-3">
            <Bot className="h-5 w-5 text-emerald-900" />
            <h3 className="text-lg font-semibold text-slate-950">Симулятор MAX-чата</h3>
          </div>
          <div className="mt-5 space-y-4">
            <Field label="Текущий пользователь">
              <Select value={selectedChatEmployeeId} onChange={(event) => setSelectedChatEmployeeId(event.target.value)}>
                {employees.map((employee) => (
                  <option key={employee.id} value={employee.id}>
                    {employee.full_name} · {getRoleLabel(employee.role)}
                  </option>
                ))}
              </Select>
            </Field>
            <div className="space-y-3">
              {sortedMessages.map((message) => (
                <div key={message.id} className="rounded-2xl bg-slate-50 px-4 py-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="font-semibold text-slate-900">{message.text}</div>
                      <div className="mt-1 text-sm text-slate-500">
                        {getTableName(message.table_id, tables)} · {getServiceName(message.service_id, services)}
                      </div>
                    </div>
                    <Badge tone={message.state === 'open' ? 'warning' : 'success'}>{getChatMessageStateLabel(message.state)}</Badge>
                  </div>
                  <div className="mt-3 text-xs uppercase tracking-[0.08em] text-slate-400">{formatDateTime(message.created_at)}</div>
                  {message.responded_by_employee_id ? (
                    <div className="mt-2 text-sm text-slate-500">
                      Ответил: {getEmployeeName(message.responded_by_employee_id, employees)}
                    </div>
                  ) : null}
                  <Button className="mt-4 w-full" variant={message.state === 'open' ? 'primary' : 'ghost'} disabled={message.state !== 'open'} onClick={() => respondToChatMessage(message.id, selectedChatEmployeeId)}>
                    Откликнуться
                  </Button>
                </div>
              ))}
            </div>
          </div>
        </Card>
        <Card className="p-6">
          <div className="flex items-center gap-3">
            <Cable className="h-5 w-5 text-emerald-900" />
            <h3 className="text-lg font-semibold text-slate-950">IIKO</h3>
          </div>
          <div className="mt-5 space-y-4">
            <Field label="Стол">
              <Select value={checkCloseTableId} onChange={(event) => setCheckCloseTableId(event.target.value)}>
                {tables.map((table) => (
                  <option key={table.id} value={table.id}>
                    {table.name}
                  </option>
                ))}
              </Select>
            </Field>
            <div className="rounded-2xl bg-slate-50 px-4 py-4">
              <div className="text-xs uppercase tracking-[0.08em] text-slate-400">Активный waiter check</div>
              <div className="mt-1 font-semibold text-slate-900">{activeWaiterCheck?.iiko_check_id ?? 'Нет активного check_id'}</div>
            </div>
            <Button onClick={() => simulateCheckClose(checkCloseTableId)}>Закрыть чек по столу</Button>
            <div className="rounded-2xl border border-dashed border-amber-200 bg-amber-50 px-4 py-4 text-sm text-amber-900">
              Сценарий для проверки:
              <div className="mt-2">1. Создай waiter-вызов.</div>
              <div>2. Откликнись официантом.</div>
              <div>3. Закрой чек здесь и проверь снятие закрепления.</div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  )
}
