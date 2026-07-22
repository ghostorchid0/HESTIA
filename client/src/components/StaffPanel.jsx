import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import api from '../api'

export default function StaffPanel() {
  const { t } = useTranslation()
  const [users, setUsers] = useState([])
  const [form, setForm] = useState({ username: '', password: '', role: 'kitchen' })
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  const fetchUsers = async () => {
    const res = await api.get('/admin/users')
    setUsers(res.data)
  }

  useEffect(() => { fetchUsers() }, [])

  const create = async (e) => {
    e.preventDefault()
    setMessage('')
    setError('')
    try {
      await api.post('/admin/users', form)
      setMessage(t('staffPanel.success'))
      setForm({ username: '', password: '', role: 'kitchen' })
      fetchUsers()
    } catch (err) {
      setError(err.response?.data?.message || t('staffPanel.error'))
    }
  }

  const remove = async (id) => {
    if (!confirm('Delete this account?')) return
    await api.delete(`/admin/users/${id}`)
    fetchUsers()
  }

  return (
    <div>
      <h1 className="mb-8 text-3xl font-light text-hestia-navy">{t('staffPanel.title')}</h1>

      <form onSubmit={create} className="card-luxe mb-8 p-6">
        <div className="grid gap-5 md:grid-cols-3">
          <div>
            <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-gray-500">{t('staffPanel.username')}</label>
            <input value={form.username} onChange={e => setForm({ ...form, username: e.target.value })} className="input-luxe w-full" required minLength={3} />
          </div>
          <div>
            <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-gray-500">{t('staffPanel.password')}</label>
            <input type="password" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} className="input-luxe w-full" required minLength={6} />
          </div>
          <div>
            <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-gray-500">{t('staffPanel.role')}</label>
            <select value={form.role} onChange={e => setForm({ ...form, role: e.target.value })} className="input-luxe w-full">
              <option value="kitchen">{t('staffPanel.kitchen')}</option>
              <option value="admin">{t('staffPanel.admin')}</option>
            </select>
          </div>
        </div>
        {message && <p className="mt-4 text-sm text-green-600">{message}</p>}
        {error && <p className="mt-4 text-sm text-red-600">{error}</p>}
        <button className="btn-primary mt-6">{t('staffPanel.create')}</button>
      </form>

      <div className="card-luxe p-6">
        {users.length === 0 ? (
          <p className="text-center text-gray-500">{t('staffPanel.empty')}</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-hestia-linen text-left text-xs uppercase tracking-wider text-gray-400">
                <th className="pb-3">{t('staffPanel.username')}</th>
                <th className="pb-3">{t('staffPanel.role')}</th>
                <th className="pb-3">{t('staffPanel.created')}</th>
                <th className="pb-3"></th>
              </tr>
            </thead>
            <tbody>
              {users.map(u => (
                <tr key={u._id} className="border-b border-hestia-linen last:border-0">
                  <td className="py-3 font-medium text-hestia-navy">{u.username}</td>
                  <td className="py-3">
                    <span className={`rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wider ${u.role === 'admin' ? 'bg-hestia-gold/10 text-hestia-gold' : 'bg-hestia-navy/10 text-hestia-navy'}`}>
                      {t(`staffPanel.${u.role}`)}
                    </span>
                  </td>
                  <td className="py-3 text-gray-500">{new Date(u.createdAt).toLocaleString()}</td>
                  <td className="py-3 text-right">
                    <button onClick={() => remove(u._id)} className="rounded-lg bg-red-50 px-3 py-1.5 text-xs text-red-600 transition hover:bg-red-100">
                      {t('staffPanel.delete')}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
