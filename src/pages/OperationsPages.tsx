import { BarChart3, Cable, Settings2 } from 'lucide-react'
import { useEffect, useState } from 'react'

import {
  Badge,
  Button,
  Card,
  Field,
  Input,
  PageHeader,
} from '../components/ui'
import { useAppStore } from '../store/useAppStore'

export const SystemModePage = () => {
  const systemMode = useAppStore((state) => state.systemMode)

  return (
    <div className="space-y-6">
      <PageHeader
        title="Режим системы"
        description="Для демо и рабочего сценария используется один фиксированный режим обработки."
      />
      <Card className="p-6">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h3 className="text-xl font-semibold text-slate-950">Работа</h3>
            <p className="mt-2 max-w-2xl text-sm text-slate-500">
              Система обрабатывает только активные привязки кнопок. Неизвестные и невалидные сигналы уходят в единый журнал ошибок.
            </p>
          </div>
          <Badge tone="success">{systemMode === 'work' ? 'Активен' : 'Недоступен'}</Badge>
        </div>
      </Card>
    </div>
  )
}

export const IntegrationsPage = () => {
  const iiko = useAppStore((state) => state.iiko)
  const saveIikoToken = useAppStore((state) => state.saveIikoToken)
  const [token, setToken] = useState(iiko.token)

  useEffect(() => {
    setToken(iiko.token)
  }, [iiko.token])

  return (
    <div className="space-y-6">
      <PageHeader
        title="IIKO интеграция"
        description="Для демо достаточно хранить и редактировать token подключения к IIKO."
      />
      <Card className="max-w-3xl p-6">
        <div className="flex items-center gap-3">
          <Cable className="h-5 w-5 text-emerald-900" />
          <h3 className="text-lg font-semibold text-slate-950">Token IIKO</h3>
        </div>
        <div className="mt-5 space-y-4">
          <Field label="IIKO token">
            <Input value={token} onChange={(event) => setToken(event.target.value)} />
          </Field>
          <div className="rounded-2xl bg-slate-50 px-4 py-3 text-sm text-slate-600">
            В этой версии демо остальные технические детали интеграции скрыты и не выводятся в интерфейс.
          </div>
          <div className="flex justify-end">
            <Button onClick={() => saveIikoToken(token)}>Сохранить token</Button>
          </div>
        </div>
      </Card>
    </div>
  )
}

const DataLensPlaceholder = ({
  title,
  description,
}: {
  title: string
  description: string
}) => (
  <Card className="p-6">
    <div className="flex items-center gap-3">
      <BarChart3 className="h-5 w-5 text-emerald-900" />
      <h3 className="text-lg font-semibold text-slate-950">{title}</h3>
    </div>
    <p className="mt-2 text-sm text-slate-500">{description}</p>
    <div className="mt-5 flex h-80 items-center justify-center rounded-3xl border border-dashed border-emerald-200 bg-emerald-50 text-center text-sm text-emerald-900">
      <div>
        <div className="font-semibold">Заглушка iframe DataLens</div>
        <div className="mt-2 text-emerald-700">Здесь будет встроен график из DataLens.</div>
      </div>
    </div>
  </Card>
)

export const AnalyticsPage = () => (
  <div className="space-y-6">
    <PageHeader
      title="Аналитика DataLens"
      description="В интерфейсе оставлены только согласованные блоки под встраивание iframe из DataLens."
    />
    <div className="grid gap-6 xl:grid-cols-2">
      <DataLensPlaceholder
        title="Количество вызовов"
        description="Блок для графика количества вызовов по времени."
      />
      <DataLensPlaceholder
        title="Среднее время реакции"
        description="Блок для графика средней реакции от получения до подтверждения."
      />
    </div>
  </div>
)

export const AboutSystemPage = () => {
  const settings = useAppStore((state) => state.settings)
  const saveTimezone = useAppStore((state) => state.saveTimezone)
  const [timezone, setTimezone] = useState(settings.timezone)

  useEffect(() => {
    setTimezone(settings.timezone)
  }, [settings.timezone])

  return (
    <div className="space-y-6">
      <PageHeader
        title="О системе"
        description="Краткая системная информация и базовые параметры демо."
      />
      <div className="grid gap-6 xl:grid-cols-[1fr_1fr]">
        <Card className="p-6">
          <div className="flex items-center gap-3">
            <Settings2 className="h-5 w-5 text-emerald-900" />
            <h3 className="text-lg font-semibold text-slate-950">Системная информация</h3>
          </div>
          <div className="mt-5 space-y-3 text-sm text-slate-600">
            <div className="rounded-2xl bg-slate-50 px-4 py-3">
              <div className="text-xs uppercase tracking-[0.08em] text-slate-400">Ресторан</div>
              <div className="mt-1 font-semibold text-slate-900">{settings.restaurant_name}</div>
            </div>
            <div className="rounded-2xl bg-slate-50 px-4 py-3">
              <div className="text-xs uppercase tracking-[0.08em] text-slate-400">Поддержка</div>
              <div className="mt-1 font-semibold text-slate-900">{settings.support_phone}</div>
            </div>
          </div>
        </Card>
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-slate-950">Часовой пояс</h3>
          <div className="mt-5 space-y-4">
            <Field label="Timezone">
              <Input value={timezone} onChange={(event) => setTimezone(event.target.value)} />
            </Field>
            <div className="rounded-2xl bg-slate-50 px-4 py-3 text-sm text-slate-600">
              Используется для отображения времени вызовов и событий в интерфейсе.
            </div>
            <div className="flex justify-end">
              <Button onClick={() => saveTimezone(timezone)}>Сохранить часовой пояс</Button>
            </div>
          </div>
        </Card>
      </div>
    </div>
  )
}
