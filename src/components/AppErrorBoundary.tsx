import { AlertTriangle } from 'lucide-react'
import { Component, type ErrorInfo, type ReactNode } from 'react'
import { Link } from 'react-router-dom'

import { Button, Card } from './ui'

interface AppErrorBoundaryProps {
  children: ReactNode
}

interface AppErrorBoundaryState {
  hasError: boolean
}

export class AppErrorBoundary extends Component<AppErrorBoundaryProps, AppErrorBoundaryState> {
  public state: AppErrorBoundaryState = {
    hasError: false,
  }

  public static getDerivedStateFromError(): AppErrorBoundaryState {
    return { hasError: true }
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('AppErrorBoundary caught error', error, errorInfo)
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="flex min-h-screen items-center justify-center px-4 py-12">
          <Card className="w-full max-w-xl p-8 text-center">
            <div className="mx-auto inline-flex rounded-2xl bg-amber-100 p-4 text-amber-700">
              <AlertTriangle className="h-7 w-7" />
            </div>
            <h1 className="mt-5 text-2xl font-semibold text-slate-950">Экран временно недоступен</h1>
            <p className="mt-3 text-sm text-slate-500">
              Мы перехватили ошибку интерфейса, чтобы приложение не уходило в белый экран.
            </p>
            <div className="mt-6 flex justify-center gap-3">
              <Button onClick={() => window.location.reload()}>Перезагрузить</Button>
              <Link to="/calls">
                <Button variant="ghost">Перейти к вызовам</Button>
              </Link>
            </div>
          </Card>
        </div>
      )
    }

    return this.props.children
  }
}
