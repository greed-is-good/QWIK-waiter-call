import { Plus, Search } from 'lucide-react'
import { useMemo, useState } from 'react'

import {
  Badge,
  Button,
  Card,
  DataTable,
  EmptyState,
  Field,
  Input,
  Modal,
  PageHeader,
  Select,
} from '../components/ui'
import { getRoleLabel, getServiceRoleLabel } from '../lib/format'
import { useAppStore } from '../store/useAppStore'
import type { EmployeeDraft, ServiceDraft } from '../types'

const defaultEmployeeDraft: EmployeeDraft = {
  full_name: '',
  role: 'waiter',
  max_user_id: '',
  is_active: true,
}

const defaultServiceDraft: ServiceDraft = {
  name: '',
  assigned_role: 'waiter',
  is_active: true,
}

export const EmployeesPage = () => {
  const employees = useAppStore((state) => state.employees)
  const saveEmployee = useAppStore((state) => state.saveEmployee)

  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')
  const [draft, setDraft] = useState<EmployeeDraft>(defaultEmployeeDraft)
  const [isModalOpen, setIsModalOpen] = useState(false)

  const filtered = useMemo(
    () =>
      employees.filter((employee) => {
        const roleMatches = roleFilter === 'all' || employee.role === roleFilter
        const statusMatches = statusFilter === 'all' || String(employee.is_active) === statusFilter
        const searchMatches = [employee.full_name, employee.max_user_id]
          .join(' ')
          .toLowerCase()
          .includes(search.toLowerCase())

        return roleMatches && statusMatches && searchMatches
      }),
    [employees, roleFilter, search, statusFilter],
  )

  return (
    <div className="space-y-6">
      <PageHeader
        title="Сотрудники"
        description="Справочник сотрудников для MAX-идентификации и обработки вызовов."
        actions={
          <Button
            onClick={() => {
              setDraft(defaultEmployeeDraft)
              setIsModalOpen(true)
            }}
          >
            <Plus className="mr-2 h-4 w-4" />
            Добавить сотрудника
          </Button>
        }
      />
      <Card className="grid gap-4 p-4 md:grid-cols-3">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-3.5 h-4 w-4 text-slate-400" />
          <Input
            className="pl-9"
            placeholder="Поиск по имени или MAX user id"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
        </div>
        <Select value={roleFilter} onChange={(event) => setRoleFilter(event.target.value)}>
          <option value="all">Все роли</option>
          <option value="waiter">Официанты</option>
          <option value="hookah">Кальянщики</option>
          <option value="admin">Администраторы</option>
        </Select>
        <Select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
          <option value="all">Любой статус</option>
          <option value="true">Активные</option>
          <option value="false">Неактивные</option>
        </Select>
      </Card>
      {filtered.length === 0 ? (
        <EmptyState title="Сотрудники не найдены" description="Сними фильтры или добавь нового сотрудника." />
      ) : (
        <DataTable headers={['Сотрудник', 'Роль', 'MAX user id', 'Статус', 'Действия']}>
          {filtered.map((employee) => (
            <tr key={employee.id}>
              <td className="px-4 py-3 font-semibold text-slate-900">{employee.full_name}</td>
              <td className="px-4 py-3 text-slate-600">{getRoleLabel(employee.role)}</td>
              <td className="px-4 py-3 font-mono text-xs text-slate-500">{employee.max_user_id || '—'}</td>
              <td className="px-4 py-3">
                <Badge tone={employee.is_active ? 'success' : 'neutral'}>
                  {employee.is_active ? 'Активен' : 'Неактивен'}
                </Badge>
              </td>
              <td className="px-4 py-3">
                <Button
                  variant="ghost"
                  onClick={() => {
                    setDraft(employee)
                    setIsModalOpen(true)
                  }}
                >
                  Редактировать
                </Button>
              </td>
            </tr>
          ))}
        </DataTable>
      )}
      <Modal
        open={isModalOpen}
        title={draft.id ? 'Редактировать сотрудника' : 'Новый сотрудник'}
        onClose={() => setIsModalOpen(false)}
        footer={
          <div className="flex justify-end gap-3">
            <Button variant="ghost" onClick={() => setIsModalOpen(false)}>
              Отмена
            </Button>
            <Button
              onClick={() => {
                if (saveEmployee(draft)) {
                  setIsModalOpen(false)
                }
              }}
            >
              Сохранить
            </Button>
          </div>
        }
      >
        <div className="space-y-4">
          <div className="rounded-2xl bg-slate-50 px-4 py-3 text-sm text-slate-600">
            Для активного официанта или кальянщика обязателен MAX user id. Сотрудника с активным закреплением деактивировать нельзя.
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <Field label="ФИО">
              <Input
                value={draft.full_name}
                onChange={(event) => setDraft((current) => ({ ...current, full_name: event.target.value }))}
              />
            </Field>
            <Field label="Роль">
              <Select
                value={draft.role}
                onChange={(event) =>
                  setDraft((current) => ({
                    ...current,
                    role: event.target.value as EmployeeDraft['role'],
                  }))
                }
              >
                <option value="waiter">Официант</option>
                <option value="hookah">Кальянщик</option>
                <option value="admin">Администратор</option>
              </Select>
            </Field>
            <Field label="MAX user id" hint="обязательно для активного сотрудника">
              <Input
                value={draft.max_user_id}
                onChange={(event) => setDraft((current) => ({ ...current, max_user_id: event.target.value }))}
              />
            </Field>
            <Field label="Статус">
              <Select
                value={String(draft.is_active)}
                onChange={(event) =>
                  setDraft((current) => ({ ...current, is_active: event.target.value === 'true' }))
                }
              >
                <option value="true">Активен</option>
                <option value="false">Неактивен</option>
              </Select>
            </Field>
          </div>
        </div>
      </Modal>
    </div>
  )
}

export const ServicesPage = () => {
  const services = useAppStore((state) => state.services)
  const saveService = useAppStore((state) => state.saveService)

  const [search, setSearch] = useState('')
  const [draft, setDraft] = useState<ServiceDraft>(defaultServiceDraft)
  const [isModalOpen, setIsModalOpen] = useState(false)

  const filtered = useMemo(
    () =>
      services.filter((service) =>
        [service.name, getServiceRoleLabel(service.assigned_role)]
          .join(' ')
          .toLowerCase()
          .includes(search.toLowerCase()),
      ),
    [search, services],
  )

  return (
    <div className="space-y-6">
      <PageHeader
        title="Услуги"
        description="Услуги с привязкой к роли исполнителя внутри системы."
        actions={
          <Button
            onClick={() => {
              setDraft(defaultServiceDraft)
              setIsModalOpen(true)
            }}
          >
            <Plus className="mr-2 h-4 w-4" />
            Добавить услугу
          </Button>
        }
      />
      <Card className="p-4">
        <div className="relative max-w-md">
          <Search className="pointer-events-none absolute left-3 top-3.5 h-4 w-4 text-slate-400" />
          <Input
            className="pl-9"
            placeholder="Поиск по услуге или роли"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
        </div>
      </Card>
      {filtered.length === 0 ? (
        <EmptyState title="Услуги не найдены" description="Сними фильтр или добавь услугу." />
      ) : (
        <DataTable headers={['Услуга', 'Роль', 'Статус', 'Действия']}>
          {filtered.map((service) => (
            <tr key={service.id}>
              <td className="px-4 py-3 font-semibold text-slate-900">{service.name}</td>
              <td className="px-4 py-3 text-slate-600">{getServiceRoleLabel(service.assigned_role)}</td>
              <td className="px-4 py-3">
                <Badge tone={service.is_active ? 'success' : 'neutral'}>
                  {service.is_active ? 'Активна' : 'Неактивна'}
                </Badge>
              </td>
              <td className="px-4 py-3">
                <Button
                  variant="ghost"
                  onClick={() => {
                    setDraft(service)
                    setIsModalOpen(true)
                  }}
                >
                  Редактировать
                </Button>
              </td>
            </tr>
          ))}
        </DataTable>
      )}
      <Modal
        open={isModalOpen}
        title={draft.id ? 'Редактировать услугу' : 'Новая услуга'}
        onClose={() => setIsModalOpen(false)}
        footer={
          <div className="flex justify-end gap-3">
            <Button variant="ghost" onClick={() => setIsModalOpen(false)}>
              Отмена
            </Button>
            <Button
              onClick={() => {
                if (saveService(draft)) {
                  setIsModalOpen(false)
                }
              }}
            >
              Сохранить
            </Button>
          </div>
        }
      >
        <div className="space-y-4">
          <div className="rounded-2xl bg-slate-50 px-4 py-3 text-sm text-slate-600">
            Для каждой услуги задается роль исполнителя. Деактивация блокируется, если услуга уже участвует в активных привязках или текущих вызовах.
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <Field label="Название">
              <Input
                value={draft.name}
                onChange={(event) => setDraft((current) => ({ ...current, name: event.target.value }))}
              />
            </Field>
            <Field label="Роль исполнителя">
              <Select
                value={draft.assigned_role}
                onChange={(event) =>
                  setDraft((current) => ({
                    ...current,
                    assigned_role: event.target.value as ServiceDraft['assigned_role'],
                  }))
                }
              >
                <option value="waiter">Официант</option>
                <option value="hookah">Кальянщик</option>
              </Select>
            </Field>
            <Field label="Статус">
              <Select
                value={String(draft.is_active)}
                onChange={(event) =>
                  setDraft((current) => ({ ...current, is_active: event.target.value === 'true' }))
                }
              >
                <option value="true">Активна</option>
                <option value="false">Неактивна</option>
              </Select>
            </Field>
          </div>
        </div>
      </Modal>
    </div>
  )
}

export const TablesPage = () => {
  const tables = useAppStore((state) => state.tables)

  const [search, setSearch] = useState('')
  const [zoneFilter, setZoneFilter] = useState('all')

  const filtered = useMemo(
    () =>
      tables.filter((table) => {
        const zoneMatches = zoneFilter === 'all' || table.zone === zoneFilter
        const searchMatches = table.name.toLowerCase().includes(search.toLowerCase())
        return zoneMatches && searchMatches
      }),
    [search, tables, zoneFilter],
  )

  return (
    <div className="space-y-6">
      <PageHeader
        title="Столы"
        description="Справочник столов подтягивается из IIKO и используется в привязках кнопок."
      />
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
      <Card className="p-4 text-sm text-slate-600">
        Добавление и редактирование столов в админке отключены. Список считается синхронизированным из IIKO.
      </Card>
      {filtered.length === 0 ? (
        <EmptyState title="Столы не найдены" description="Сними фильтр или дождись синхронизации из IIKO." />
      ) : (
        <DataTable headers={['Стол', 'Зона', 'Статус']}>
          {filtered.map((table) => (
            <tr key={table.id}>
              <td className="px-4 py-3 font-semibold text-slate-900">{table.name}</td>
              <td className="px-4 py-3 text-slate-600">{table.zone}</td>
              <td className="px-4 py-3">
                <Badge tone={table.is_active ? 'success' : 'neutral'}>
                  {table.is_active ? 'Активен' : 'Неактивен'}
                </Badge>
              </td>
            </tr>
          ))}
        </DataTable>
      )}
    </div>
  )
}
