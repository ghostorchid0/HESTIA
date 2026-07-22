import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import api from '../api'

export default function AdminLoginPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [form, setForm] = useState({ username: '', password: '' })
  const [error, setError] = useState('')

  const login = async (e) => {
    e.preventDefault()
    try {
      const res = await api.post('/auth/login', form)
      localStorage.setItem('hestia_token', res.data.token)
      localStorage.setItem('hestia_role', res.data.role)
      navigate('/admin/dashboard')
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed')
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-hestia-cream p-6">
      <form onSubmit={login} className="card-luxe w-full max-w-md p-10">
        <div className="text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-hestia-gold">Hestia Staff</p>
          <h1 className="mt-2 text-3xl font-light text-hestia-navy">{t('adminLogin.title')}</h1>
        </div>
        {error && <p className="mt-5 rounded bg-red-50 p-3 text-center text-sm text-red-700">{error}</p>}
        <div className="mt-8 space-y-4">
          <div>
            <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-gray-500">{t('adminLogin.username')}</label>
            <input
              value={form.username}
              onChange={(e) => setForm({ ...form, username: e.target.value })}
              className="input-luxe w-full"
              required
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-gray-500">{t('adminLogin.password')}</label>
            <input
              type="password"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              className="input-luxe w-full"
              required
            />
          </div>
        </div>
        <button className="btn-primary mt-8 w-full">{t('adminLogin.login')}</button>
      </form>
    </div>
  )
}
