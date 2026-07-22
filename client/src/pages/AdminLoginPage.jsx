import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../api'

export default function AdminLoginPage() {
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
    <div className="flex min-h-screen items-center justify-center p-4">
      <form onSubmit={login} className="w-full max-w-md rounded-2xl bg-white p-8 shadow-lg">
        <h1 className="mb-6 text-2xl font-bold text-amber-600">Staff Login</h1>
        {error && <p className="mb-4 rounded bg-red-50 p-2 text-sm text-red-600">{error}</p>}
        <label className="mb-2 block text-sm font-medium">Username</label>
        <input
          value={form.username}
          onChange={(e) => setForm({ ...form, username: e.target.value })}
          className="mb-4 w-full rounded-lg border border-gray-300 p-3"
          required
        />
        <label className="mb-2 block text-sm font-medium">Password</label>
        <input
          type="password"
          value={form.password}
          onChange={(e) => setForm({ ...form, password: e.target.value })}
          className="mb-6 w-full rounded-lg border border-gray-300 p-3"
          required
        />
        <button className="w-full rounded-xl bg-amber-600 py-3 font-semibold text-white hover:bg-amber-700">Login</button>
      </form>
    </div>
  )
}
