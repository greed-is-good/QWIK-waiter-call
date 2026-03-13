import { X } from 'lucide-react'
import type { HTMLAttributes, PropsWithChildren, ReactNode } from 'react'

import { cn } from '../lib/format'

export const Card = ({
  className,
  children,
  ...props
}: PropsWithChildren<HTMLAttributes<HTMLDivElement>>) => (
  <div
    className={cn(
      'rounded-2xl border border-slate-200/70 bg-white shadow-[0_10px_30px_rgba(15,23,42,0.06)]',
      className,
    )}
    {...props}
  >
    {children}
  </div>
)

export const Button = ({
  className,
  children,
  variant = 'primary',
  type = 'button',
  ...props
}: PropsWithChildren<
  React.ButtonHTMLAttributes<HTMLButtonElement> & {
    variant?: 'primary' | 'secondary' | 'ghost' | 'danger'
  }
>) => (
  <button
    type={type}
    className={cn(
      'inline-flex items-center justify-center rounded-xl px-4 py-2 text-sm font-semibold transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-60',
      variant === 'primary' && 'bg-emerald-900 text-white shadow-lg shadow-emerald-950/15 hover:bg-emerald-800',
      variant === 'secondary' && 'bg-emerald-50 text-emerald-900 hover:bg-emerald-100',
      variant === 'ghost' && 'border border-slate-200 bg-white text-slate-700 hover:bg-slate-50',
      variant === 'danger' && 'bg-rose-600 text-white hover:bg-rose-500',
      className,
    )}
    {...props}
  >
    {children}
  </button>
)

export const Input = ({
  className,
  ...props
}: React.InputHTMLAttributes<HTMLInputElement>) => (
  <input
    className={cn(
      'h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-900 outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100',
      className,
    )}
    {...props}
  />
)

export const Select = ({
  className,
  children,
  ...props
}: PropsWithChildren<React.SelectHTMLAttributes<HTMLSelectElement>>) => (
  <select
    className={cn(
      'h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-900 outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100',
      className,
    )}
    {...props}
  >
    {children}
  </select>
)

export const TextArea = ({
  className,
  ...props
}: React.TextareaHTMLAttributes<HTMLTextAreaElement>) => (
  <textarea
    className={cn(
      'min-h-28 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100',
      className,
    )}
    {...props}
  />
)

export const Badge = ({
  children,
  tone = 'info',
}: PropsWithChildren<{ tone?: 'info' | 'success' | 'warning' | 'error' | 'neutral' }>) => (
  <span
    className={cn(
      'inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold',
      tone === 'info' && 'bg-sky-100 text-sky-700',
      tone === 'success' && 'bg-emerald-100 text-emerald-700',
      tone === 'warning' && 'bg-amber-100 text-amber-700',
      tone === 'error' && 'bg-rose-100 text-rose-700',
      tone === 'neutral' && 'bg-slate-100 text-slate-700',
    )}
  >
    {children}
  </span>
)

export const Field = ({
  label,
  children,
  hint,
}: PropsWithChildren<{ label: string; hint?: string }>) => (
  <label className="space-y-2">
    <div className="flex items-center justify-between gap-3">
      <span className="text-sm font-medium text-slate-700">{label}</span>
      {hint ? <span className="text-xs text-slate-400">{hint}</span> : null}
    </div>
    {children}
  </label>
)

export const PageHeader = ({
  title,
  description,
  actions,
}: {
  title: string
  description?: string
  actions?: ReactNode
}) => (
  <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
    <div className="space-y-1">
      <h1 className="text-2xl font-semibold text-slate-950">{title}</h1>
      {description ? <p className="max-w-3xl text-sm text-slate-500">{description}</p> : null}
    </div>
    {actions ? <div className="flex flex-wrap gap-3">{actions}</div> : null}
  </div>
)

export const EmptyState = ({
  title,
  description,
}: {
  title: string
  description: string
}) => (
  <Card className="p-8 text-center">
    <h3 className="text-lg font-semibold text-slate-900">{title}</h3>
    <p className="mt-2 text-sm text-slate-500">{description}</p>
  </Card>
)

export const StatCard = ({
  label,
  value,
  caption,
}: {
  label: string
  value: string | number
  caption?: string
}) => (
  <Card className="p-5">
    <p className="text-sm text-slate-500">{label}</p>
    <div className="mt-2 text-3xl font-semibold text-slate-950">{value}</div>
    {caption ? <p className="mt-1 text-xs text-slate-400">{caption}</p> : null}
  </Card>
)

export const Modal = ({
  open,
  title,
  description,
  children,
  onClose,
  footer,
}: PropsWithChildren<{
  open: boolean
  title: string
  description?: string
  onClose: () => void
  footer?: ReactNode
}>) => {
  if (!open) {
    return null
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-4 backdrop-blur-sm">
      <Card className="w-full max-w-2xl overflow-hidden">
        <div className="flex items-start justify-between border-b border-slate-100 px-6 py-5">
          <div>
            <h3 className="text-lg font-semibold text-slate-950">{title}</h3>
            {description ? <p className="mt-1 text-sm text-slate-500">{description}</p> : null}
          </div>
          <button className="rounded-full p-2 text-slate-400 hover:bg-slate-100" onClick={onClose}>
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="max-h-[70vh] overflow-y-auto px-6 py-5">{children}</div>
        {footer ? <div className="border-t border-slate-100 px-6 py-4">{footer}</div> : null}
      </Card>
    </div>
  )
}

export const Drawer = ({
  open,
  title,
  onClose,
  children,
}: PropsWithChildren<{
  open: boolean
  title: string
  onClose: () => void
}>) => {
  if (!open) {
    return null
  }

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/30 backdrop-blur-sm">
      <div className="absolute inset-y-0 right-0 w-full max-w-xl overflow-y-auto bg-[#f7f8f4] shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-5">
          <h3 className="text-lg font-semibold text-slate-950">{title}</h3>
          <button className="rounded-full p-2 text-slate-400 hover:bg-white" onClick={onClose}>
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="p-6">{children}</div>
      </div>
    </div>
  )
}

export const ConfirmDialog = ({
  open,
  title,
  description,
  confirmText = 'Подтвердить',
  tone = 'danger',
  onClose,
  onConfirm,
}: {
  open: boolean
  title: string
  description: string
  confirmText?: string
  tone?: 'danger' | 'primary'
  onClose: () => void
  onConfirm: () => void
}) => (
  <Modal
    open={open}
    title={title}
    description={description}
    onClose={onClose}
    footer={
      <div className="flex justify-end gap-3">
        <Button variant="ghost" onClick={onClose}>
          Отмена
        </Button>
        <Button variant={tone === 'danger' ? 'danger' : 'primary'} onClick={onConfirm}>
          {confirmText}
        </Button>
      </div>
    }
  />
)

export const DataTable = ({
  headers,
  children,
}: PropsWithChildren<{ headers: string[] }>) => (
  <Card className="overflow-hidden">
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-slate-200 text-sm">
        <thead className="bg-slate-50/80">
          <tr>
            {headers.map((header) => (
              <th
                key={header}
                className="px-4 py-3 text-left font-medium uppercase tracking-[0.08em] text-slate-500"
              >
                {header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 bg-white">{children}</tbody>
      </table>
    </div>
  </Card>
)

export const KeyValue = ({ label, value }: { label: string; value: ReactNode }) => (
  <div className="grid grid-cols-[140px_1fr] gap-4 py-2 text-sm">
    <span className="text-slate-400">{label}</span>
    <div className="font-medium text-slate-800">{value}</div>
  </div>
)
