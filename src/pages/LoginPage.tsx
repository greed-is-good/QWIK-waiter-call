import { ShieldCheck } from 'lucide-react'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

import { Button, Card, Field, Input } from '../components/ui'
import { useAppStore } from '../store/useAppStore'

export const LoginPage = () => {
  const navigate = useNavigate()
  const login = useAppStore((state) => state.login)
  const [username, setUsername] = useState('admin')
  const [password, setPassword] = useState('admin')

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const success = login(username, password)
    if (success) {
      navigate('/calls')
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-12">
      <Card className="w-full max-w-md overflow-hidden">
        <div className="bg-emerald-950 px-8 py-8 text-white">
          <div className="inline-flex rounded-2xl bg-white/10 p-3">
            <ShieldCheck className="h-7 w-7" />
          </div>
          <h1 className="mt-5 text-3xl font-semibold">QWIK Admin</h1>
          <p className="mt-2 text-sm text-emerald-100">
            Референс MVP для админки вызова официантов, интеграций и симуляторов событий.
          </p>
        </div>
        <form className="space-y-5 px-8 py-8" onSubmit={handleSubmit}>
          <Field label="Логин">
            <Input value={username} onChange={(event) => setUsername(event.target.value)} />
          </Field>
          <Field label="Пароль">
            <Input type="password" value={password} onChange={(event) => setPassword(event.target.value)} />
          </Field>
          <Button className="w-full" type="submit">
            Войти
          </Button>
          <div className="rounded-2xl bg-slate-50 px-4 py-3 text-sm text-slate-500">
            Тестовый доступ: <span className="font-semibold text-slate-900">admin / admin</span>
          </div>
        </form>
      </Card>
    </div>
  )
}
