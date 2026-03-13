import { Plus, Search } from 'lucide-react'
import { useMemo, useState } from 'react'

import {
  Badge,
  Button,
  Card,
  ConfirmDialog,
  DataTable,
  EmptyState,
  Field,
  Input,
  Modal,
  PageHeader,
  Select,
} from '../components/ui'
import { formatDateTime, getServiceName, getTableName } from '../lib/format'
import { useAppStore } from '../store/useAppStore'
import type { BindingDraft } from '../types'

const defaultBindingDraft: BindingDraft = {
  radio_button_id: '',
  table_id: '',
  service_id: '',
  is_active: true,
}

export const NewButtonsPage = () => {
  const newButtons = useAppStore((state) => state.newButtons)
  const tables = useAppStore((state) => state.tables)
  const services = useAppStore((state) => state.services)
  const createBindingFromNewButton = useAppStore((state) => state.createBindingFromNewButton)

  const [search, setSearch] = useState('')
  const [selectedRadioId, setSelectedRadioId] = useState<string | null>(null)
  const [tableId, setTableId] = useState(tables[0]?.id ?? '')
  const [serviceId, setServiceId] = useState(services[0]?.id ?? '')

  const filtered = useMemo(
    () =>
      newButtons.filter((button) =>
        [button.radio_button_id, button.last_client_device_id].join(' ').toLowerCase().includes(search.toLowerCase()),
      ),
    [newButtons, search],
  )

  const handleCreate = () => {
    if (!selectedRadioId) {
      return
    }

    createBindingFromNewButton(selectedRadioId, tableId, serviceId)
    setSelectedRadioId(null)
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Новые кнопки"
        description="В режиме конфигурации сюда попадают radio_button_id, которых еще нет в whitelist."
      />
      <Card className="p-4">
        <div className="relative max-w-md">
          <Search className="pointer-events-none absolute left-3 top-3.5 h-4 w-4 text-slate-400" />
          <Input className="pl-9" placeholder="Поиск по radio_button_id или устройству" value={search} onChange={(event) => setSearch(event.target.value)} />
        </div>
      </Card>
      {filtered.length === 0 ? (
        <EmptyState title="Новые кнопки не найдены" description="Поймай неизвестный сигнал в режиме конфигурации или сними фильтр." />
      ) : (
        <DataTable headers={['radio_button_id', 'Устройство', 'Сэмплы', 'Последний сигнал', 'Последнее появление', 'Действие']}>
          {filtered.map((button) => (
            <tr key={button.radio_button_id}>
              <td className="px-4 py-3 font-semibold text-slate-900">{button.radio_button_id}</td>
              <td className="px-4 py-3 text-slate-600">{button.last_client_device_id}</td>
              <td className="px-4 py-3 text-slate-600">{button.samples_count}</td>
              <td className="px-4 py-3 font-mono text-xs text-slate-500">{button.raw_signal}</td>
              <td className="px-4 py-3 text-slate-600">{formatDateTime(button.last_seen_at)}</td>
              <td className="px-4 py-3">
                <Button variant="secondary" onClick={() => setSelectedRadioId(button.radio_button_id)}>
                  Создать привязку
                </Button>
              </td>
            </tr>
          ))}
        </DataTable>
      )}
      <Modal
        open={Boolean(selectedRadioId)}
        title="Создать привязку"
        description={`Новая привязка для ${selectedRadioId ?? ''}`}
        onClose={() => setSelectedRadioId(null)}
        footer={
          <div className="flex justify-end gap-3">
            <Button variant="ghost" onClick={() => setSelectedRadioId(null)}>
              Отмена
            </Button>
            <Button onClick={handleCreate}>Создать</Button>
          </div>
        }
      >
        <div className="grid gap-4 md:grid-cols-2">
          <Field label="Стол">
            <Select value={tableId} onChange={(event) => setTableId(event.target.value)}>
              {tables.map((table) => (
                <option key={table.id} value={table.id}>
                  {table.name}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Услуга">
            <Select value={serviceId} onChange={(event) => setServiceId(event.target.value)}>
              {services.map((service) => (
                <option key={service.id} value={service.id}>
                  {service.name}
                </option>
              ))}
            </Select>
          </Field>
        </div>
      </Modal>
    </div>
  )
}

export const BindingsPage = () => {
  const bindings = useAppStore((state) => state.bindings)
  const tables = useAppStore((state) => state.tables)
  const services = useAppStore((state) => state.services)
  const saveBinding = useAppStore((state) => state.saveBinding)
  const setBindingActive = useAppStore((state) => state.setBindingActive)

  const [search, setSearch] = useState('')
  const [serviceFilter, setServiceFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')
  const [draft, setDraft] = useState<BindingDraft>(defaultBindingDraft)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [confirmId, setConfirmId] = useState<string | null>(null)

  const filtered = useMemo(
    () =>
      bindings.filter((binding) => {
        const serviceMatches = serviceFilter === 'all' || binding.service_id === serviceFilter
        const statusMatches =
          statusFilter === 'all' || String(binding.is_active) === statusFilter
        const textMatches = [
          binding.radio_button_id,
          getTableName(binding.table_id, tables),
          getServiceName(binding.service_id, services),
        ]
          .join(' ')
          .toLowerCase()
          .includes(search.toLowerCase())

        return serviceMatches && statusMatches && textMatches
      }),
    [bindings, search, serviceFilter, statusFilter, services, tables],
  )

  const openCreate = () => {
    setDraft({
      ...defaultBindingDraft,
      table_id: tables[0]?.id ?? '',
      service_id: services[0]?.id ?? '',
    })
    setIsModalOpen(true)
  }

  const openEdit = (radioButtonId: string) => {
    const binding = bindings.find((item) => item.radio_button_id === radioButtonId)
    if (!binding) {
      return
    }

    setDraft({
      original_radio_button_id: binding.radio_button_id,
      radio_button_id: binding.radio_button_id,
      table_id: binding.table_id,
      service_id: binding.service_id,
      is_active: binding.is_active,
    })
    setIsModalOpen(true)
  }

  const handleSave = () => {
    saveBinding(draft)
    setIsModalOpen(false)
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Привязки кнопок"
        description="Whitelist-таблица соответствий radio_button_id -> стол -> услуга."
        actions={
          <Button onClick={openCreate}>
            <Plus className="mr-2 h-4 w-4" />
            Новая привязка
          </Button>
        }
      />
      <Card className="grid gap-4 p-4 md:grid-cols-3">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-3.5 h-4 w-4 text-slate-400" />
          <Input className="pl-9" placeholder="Поиск по столу или radio id" value={search} onChange={(event) => setSearch(event.target.value)} />
        </div>
        <Select value={serviceFilter} onChange={(event) => setServiceFilter(event.target.value)}>
          <option value="all">Все услуги</option>
          {services.map((service) => (
            <option key={service.id} value={service.id}>
              {service.name}
            </option>
          ))}
        </Select>
        <Select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
          <option value="all">Любой статус</option>
          <option value="true">Активные</option>
          <option value="false">Неактивные</option>
        </Select>
      </Card>
      {filtered.length === 0 ? (
        <EmptyState title="Привязки не найдены" description="Сними фильтры или создай новую привязку." />
      ) : (
        <DataTable headers={['radio_button_id', 'Стол', 'Услуга', 'Статус', 'Создана', 'Действия']}>
          {filtered.map((binding) => (
            <tr key={binding.radio_button_id}>
              <td className="px-4 py-3 font-semibold text-slate-900">{binding.radio_button_id}</td>
              <td className="px-4 py-3 text-slate-600">{getTableName(binding.table_id, tables)}</td>
              <td className="px-4 py-3 text-slate-600">{getServiceName(binding.service_id, services)}</td>
              <td className="px-4 py-3">
                <Badge tone={binding.is_active ? 'success' : 'neutral'}>
                  {binding.is_active ? 'Активна' : 'Отключена'}
                </Badge>
              </td>
              <td className="px-4 py-3 text-slate-600">{formatDateTime(binding.created_at)}</td>
              <td className="px-4 py-3">
                <div className="flex flex-wrap gap-2">
                  <Button variant="ghost" onClick={() => openEdit(binding.radio_button_id)}>
                    Редактировать
                  </Button>
                  {binding.is_active ? (
                    <Button variant="danger" onClick={() => setConfirmId(binding.radio_button_id)}>
                      Деактивировать
                    </Button>
                  ) : (
                    <Button variant="secondary" onClick={() => setBindingActive(binding.radio_button_id, true)}>
                      Активировать
                    </Button>
                  )}
                </div>
              </td>
            </tr>
          ))}
        </DataTable>
      )}
      <Modal
        open={isModalOpen}
        title={draft.radio_button_id ? 'Редактировать привязку' : 'Новая привязка'}
        onClose={() => setIsModalOpen(false)}
        footer={
          <div className="flex justify-end gap-3">
            <Button variant="ghost" onClick={() => setIsModalOpen(false)}>
              Отмена
            </Button>
            <Button onClick={handleSave}>Сохранить</Button>
          </div>
        }
      >
        <div className="grid gap-4 md:grid-cols-2">
          <Field label="radio_button_id">
            <Input
              value={draft.radio_button_id}
              disabled={Boolean(draft.radio_button_id)}
              onChange={(event) => setDraft((current) => ({ ...current, radio_button_id: event.target.value }))}
            />
          </Field>
          <Field label="Статус">
            <Select value={String(draft.is_active)} onChange={(event) => setDraft((current) => ({ ...current, is_active: event.target.value === 'true' }))}>
              <option value="true">Активна</option>
              <option value="false">Отключена</option>
            </Select>
          </Field>
          <Field label="Стол">
            <Select value={draft.table_id} onChange={(event) => setDraft((current) => ({ ...current, table_id: event.target.value }))}>
              {tables.map((table) => (
                <option key={table.id} value={table.id}>
                  {table.name}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Услуга">
            <Select value={draft.service_id} onChange={(event) => setDraft((current) => ({ ...current, service_id: event.target.value }))}>
              {services.map((service) => (
                <option key={service.id} value={service.id}>
                  {service.name}
                </option>
              ))}
            </Select>
          </Field>
        </div>
      </Modal>
      <ConfirmDialog
        open={Boolean(confirmId)}
        title="Деактивировать привязку?"
        description="После деактивации в режиме работы сигнал с этой кнопки попадет в unknown_button."
        confirmText="Деактивировать"
        onClose={() => setConfirmId(null)}
        onConfirm={() => {
          if (confirmId) {
            setBindingActive(confirmId, false)
          }
          setConfirmId(null)
        }}
      />
    </div>
  )
}
