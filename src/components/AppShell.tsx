import {
  BellRing,
  BookUser,
  Cable,
  ChartNoAxesCombined,
  Cog,
  LayoutList,
  Radio,
  Settings2,
  TableProperties,
  Users,
  Wrench,
} from 'lucide-react'
import { NavLink, Outlet } from 'react-router-dom'

import { Badge, Button } from './ui'
import { cn } from '../lib/format'
import { useAppStore } from '../store/useAppStore'

const navItems = [
  { to: '/calls', label: 'Реестр вызовов', icon: LayoutList },
  { to: '/tables-assignments', label: 'Столы и закрепления', icon: TableProperties },
  { to: '/bindings', label: 'Привязки', icon: Radio },
  { to: '/employees', label: 'Сотрудники', icon: Users },
  { to: '/services', label: 'Услуги', icon: BellRing },
  { to: '/tables', label: 'Столы', icon: BookUser },
  { to: '/logs/errors', label: 'Журнал ошибок', icon: Wrench },
  { to: '/integrations', label: 'Интеграции IIKO', icon: Cable },
  { to: '/analytics', label: 'Аналитика', icon: ChartNoAxesCombined },
  { to: '/system-mode', label: 'Режим системы', icon: Settings2 },
  { to: '/settings', label: 'О системе', icon: Cog },
]

export const AppShell = () => {
  const authUser = useAppStore((state) => state.authUser)
  const notifications = useAppStore((state) => state.notifications)
  const dismissNotification = useAppStore((state) => state.dismissNotification)
  const logout = useAppStore((state) => state.logout)

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-30 border-b border-emerald-950/15 bg-emerald-950 text-white shadow-lg shadow-emerald-950/10">
        <div className="mx-auto flex max-w-[1600px] items-center justify-between gap-4 px-4 py-4 lg:px-6">
          <div className="flex items-center gap-4">
            <div className="rounded-2xl bg-white/10 px-3 py-2">
              <div className="text-xs uppercase tracking-[0.24em] text-emerald-100">QWIK.PRO</div>
              <div className="text-lg font-semibold">QWIK Admin</div>
            </div>
            <Badge tone="success">Режим: Работа</Badge>
          </div>
          <div className="flex items-center gap-3 text-sm">
            <div className="hidden text-right md:block">
              <div className="font-semibold text-white">{authUser?.display_name}</div>
              <div className="text-emerald-100">admin / admin</div>
            </div>
            <Button variant="secondary" onClick={logout}>
              Выйти
            </Button>
          </div>
        </div>
      </header>

      <div className="mx-auto grid max-w-[1600px] gap-6 px-4 py-6 lg:grid-cols-[280px_minmax(0,1fr)] lg:px-6">
        <aside className="lg:sticky lg:top-24 lg:h-[calc(100vh-120px)] lg:overflow-hidden">
          <div className="overflow-x-auto lg:h-full lg:overflow-y-auto">
            <div className="flex gap-3 lg:grid lg:gap-2">
              {navItems.map(({ to, label, icon: Icon }) => (
                <NavLink
                  key={to}
                  to={to}
                  className={({ isActive }) =>
                    cn(
                      'group flex min-w-max items-center gap-3 rounded-2xl border px-4 py-3 text-sm font-medium transition',
                      isActive
                        ? 'border-emerald-900 bg-emerald-950 text-white shadow-lg shadow-emerald-950/15'
                        : 'border-transparent bg-white/80 text-slate-600 shadow-[0_10px_20px_rgba(15,23,42,0.04)] hover:border-emerald-200 hover:text-emerald-950',
                    )
                  }
                >
                  <Icon className="h-4 w-4" />
                  <span>{label}</span>
                </NavLink>
              ))}
            </div>
          </div>
        </aside>

        <main className="space-y-6">
          <Outlet />
        </main>
      </div>

      <div className="fixed right-4 top-20 z-50 flex w-full max-w-sm flex-col gap-3">
        {notifications.map((notification) => (
          <div
            key={notification.id}
            className={cn(
              'fade-up rounded-2xl border px-4 py-3 shadow-xl backdrop-blur',
              notification.tone === 'success' && 'border-emerald-200 bg-emerald-50/95',
              notification.tone === 'warning' && 'border-amber-200 bg-amber-50/95',
              notification.tone === 'error' && 'border-rose-200 bg-rose-50/95',
              notification.tone === 'info' && 'border-sky-200 bg-sky-50/95',
            )}
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="font-semibold text-slate-900">{notification.message}</div>
                {notification.description ? <div className="mt-1 text-sm text-slate-600">{notification.description}</div> : null}
              </div>
              <button className="text-slate-400 hover:text-slate-700" onClick={() => dismissNotification(notification.id)}>
                ×
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
