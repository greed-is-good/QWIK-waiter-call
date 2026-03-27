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
import {
  cn,
  formatDate,
  formatDayCount,
  getTrialDaysElapsed,
  getTrialDaysRemaining,
  getTrialEndDate,
  getTrialProgressPercent,
  getTrialStatus,
  getTrialStatusLabel,
  getTrialStatusTone,
} from '../lib/format'
import type { TrialStatus } from '../types'
import { useAppStore } from '../store/useAppStore'

const getTrialDescription = (status: TrialStatus, remainingDays: number) => {
  switch (status) {
    case 'ending_soon':
      return `Пробный период подходит к завершению. До окончания доступа осталось ${formatDayCount(remainingDays)}.`
    case 'expired':
      return 'Пробный период завершен. Для продолжения работы требуется активация постоянного доступа.'
    default:
      return `Пробный период активен. В интерфейсе доступны ключевые сценарии QWIK Admin, осталось ${formatDayCount(remainingDays)}.`
  }
}

const trialFeatures = [
  'Реестр вызовов и история обработки',
  'Привязки кнопок, сотрудники и услуги',
  'Интеграция IIKO и токен подключения',
  'Встроенная аналитика DataLens',
]

export const SystemModePage = () => {
  const trial = useAppStore((state) => state.trial)

  const trialStatus = getTrialStatus(trial)
  const trialDaysRemaining = getTrialDaysRemaining(trial)
  const trialDaysElapsed = getTrialDaysElapsed(trial)
  const trialProgressPercent = getTrialProgressPercent(trial)
  const trialEndDate = getTrialEndDate(trial)

  return (
    <div className="space-y-6">
      <PageHeader
        title="Режим системы"
        description="Система запущена в формате пробного периода на 14 дней."
      />

      <Card className="overflow-hidden">
        <div className="flex flex-col gap-6 p-6 lg:flex-row lg:items-start lg:justify-between">
          <div className="space-y-4">
            <div className="flex flex-wrap items-center gap-3">
              <h3 className="text-2xl font-semibold text-slate-950">Пробный режим</h3>
              <Badge tone={getTrialStatusTone(trialStatus)}>{getTrialStatusLabel(trialStatus)}</Badge>
            </div>
            <p className="max-w-2xl text-sm leading-6 text-slate-500">
              {getTrialDescription(trialStatus, trialDaysRemaining)}
            </p>
          </div>

          <div className="rounded-3xl bg-emerald-50 px-6 py-5 text-left lg:min-w-[220px] lg:text-right">
            <div className="text-sm font-medium text-emerald-800">Осталось времени</div>
            <div className="mt-2 text-4xl font-semibold text-emerald-950">{trialDaysRemaining}</div>
            <div className="mt-1 text-sm text-emerald-800">{formatDayCount(trialDaysRemaining)}</div>
          </div>
        </div>

        <div className="border-t border-slate-100 px-6 py-5">
          <div className="flex flex-col gap-2 text-xs uppercase tracking-[0.08em] text-slate-400 md:flex-row md:items-center md:justify-between">
            <span>Использовано {trialDaysElapsed} из {trial.duration_days} дней</span>
            <span>Доступ до {formatDate(trialEndDate)}</span>
          </div>
          <div className="mt-3 h-3 rounded-full bg-slate-100">
            <div
              className={cn(
                'h-full rounded-full transition-all',
                trialStatus === 'expired' && 'bg-rose-500',
                trialStatus === 'ending_soon' && 'bg-amber-500',
                trialStatus === 'active' && 'bg-emerald-600',
              )}
              style={{ width: `${trialProgressPercent}%` }}
            />
          </div>
        </div>
      </Card>

      <div className="grid gap-6 xl:grid-cols-3">
        <Card className="p-5">
          <div className="text-xs uppercase tracking-[0.08em] text-slate-400">Дата активации</div>
          <div className="mt-3 text-lg font-semibold text-slate-950">{formatDate(trial.activated_at)}</div>
          <p className="mt-2 text-sm text-slate-500">От этой даты рассчитывается срок пробного доступа.</p>
        </Card>

        <Card className="p-5">
          <div className="text-xs uppercase tracking-[0.08em] text-slate-400">Действует до</div>
          <div className="mt-3 text-lg font-semibold text-slate-950">{formatDate(trialEndDate)}</div>
          <p className="mt-2 text-sm text-slate-500">После окончания периода потребуется перевод на постоянный доступ.</p>
        </Card>

        <Card className="p-5">
          <div className="text-xs uppercase tracking-[0.08em] text-slate-400">Формат доступа</div>
          <div className="mt-3 text-lg font-semibold text-slate-950">14-дневный пробный период</div>
          <p className="mt-2 text-sm text-slate-500">Подходит для первичного запуска, демонстрации и согласования рабочих сценариев.</p>
        </Card>
      </div>

      <Card className="p-6">
        <h3 className="text-lg font-semibold text-slate-950">Что входит в пробный период</h3>
        <div className="mt-5 grid gap-3 md:grid-cols-2">
          {trialFeatures.map((feature) => (
            <div
              key={feature}
              className="rounded-2xl border border-slate-100 bg-slate-50 px-4 py-4 text-sm font-medium text-slate-700"
            >
              {feature}
            </div>
          ))}
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
        description="Управление token подключения к IIKO."
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
        <div className="font-semibold">Панель DataLens</div>
        <div className="mt-2 text-emerald-700">Здесь отображается встроенный график DataLens.</div>
      </div>
    </div>
  </Card>
)

export const AnalyticsPage = () => (
  <div className="space-y-6">
    <PageHeader
      title="Аналитика DataLens"
      description="Графики DataLens, встроенные в интерфейс."
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
        description="Системная информация и базовые параметры."
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
            <Field label="Часовой пояс">
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
