import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import api from '../api'
import Pagination from './Pagination'

export default function StaffPanel() {
  const { t } = useTranslation()
  const [users, setUsers] = useState([])
  const [form, setForm] = useState({ username: '', password: '', role: 'kitchen' })
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(25)
  const [totalPages, setTotalPages] = useState(1)
  const [selectedUsers, setSelectedUsers] = useState(new Set())

  const fetchUsers = async () => {
    try {
      const res = await api.get(`/admin/users?page=${currentPage}&limit=${itemsPerPage}`)
      const usersData = Array.isArray(res.data) ? res.data : []
      setUsers(usersData)
      const totalCount = res.headers?.get('x-total-count')
      if (totalCount) {
        setTotalPages(Math.ceil(totalCount / itemsPerPage))
      }
    } catch (err) {
      console.error('Failed to fetch users', err)
      setUsers([])
    }
  }

  useEffect(() => { fetchUsers() }, [currentPage, itemsPerPage])

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
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce compte ?')) return
    await api.delete(`/admin/users/${id}`)
    fetchUsers()
  }

  const toggleUserSelection = (userId) => {
    const newSelected = new Set(selectedUsers)
    if (newSelected.has(userId)) {
      newSelected.delete(userId)
    } else {
      newSelected.add(userId)
    }
    setSelectedUsers(newSelected)
  }

  const toggleSelectAll = () => {
    if (selectedUsers.size === users.length) {
      setSelectedUsers(new Set())
    } else {
      setSelectedUsers(new Set(users.map(u => u._id)))
    }
  }

  const deleteSelectedUsers = async () => {
    if (selectedUsers.size === 0) return
    if (!confirm(`Êtes-vous sûr de vouloir supprimer ${selectedUsers.size} compte(s) ?`)) return
    try {
      await api.delete('/admin/users', { data: { ids: Array.from(selectedUsers) } })
      setSelectedUsers(new Set())
      fetchUsers()
    } catch (err) {
      console.error('Failed to delete users', err)
    }
  }

  const handlePageChange = (page) => {
    setCurrentPage(page)
    setSelectedUsers(new Set())
  }

  const handleItemsPerPageChange = (newItemsPerPage) => {
    setItemsPerPage(newItemsPerPage)
    setCurrentPage(1)
    setSelectedUsers(new Set())
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
              <option value="reception">{t('staffPanel.reception')}</option>
              <option value="admin">{t('staffPanel.admin')}</option>
            </select>
          </div>
        </div>
        {message && <p className="mt-4 text-sm text-green-600">{message}</p>}
        {error && <p className="mt-4 text-sm text-red-600">{error}</p>}
        <button className="btn-primary mt-6">{t('staffPanel.create')}</button>
      </form>

      <div className="mb-4 flex items-center gap-2">
        <input
          type="checkbox"
          checked={selectedUsers.size === users.length && users.length > 0}
          onChange={toggleSelectAll}
          className="w-4 h-4"
        />
        <span className="text-sm text-gray-600">Tout sélectionner</span>
        {selectedUsers.size > 0 && (
          <button
            onClick={deleteSelectedUsers}
            className="rounded-lg bg-red-100 text-red-700 px-4 py-2 text-sm font-medium transition hover:bg-red-200"
          >
            Supprimer ({selectedUsers.size})
          </button>
        )}
      </div>

      <div className="card-luxe p-6">
        {users.length === 0 ? (
          <p className="text-center text-gray-500">{t('staffPanel.empty')}</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-hestia-linen text-left text-xs uppercase tracking-wider text-gray-400">
                <th className="pb-3 w-8"></th>
                <th className="pb-3">{t('staffPanel.username')}</th>
                <th className="pb-3">{t('staffPanel.role')}</th>
                <th className="pb-3">{t('staffPanel.created')}</th>
                <th className="pb-3"></th>
              </tr>
            </thead>
            <tbody>
              {users.map(u => (
                <tr key={u._id} className="border-b border-hestia-linen last:border-0">
                  <td className="py-3">
                    <input
                      type="checkbox"
                      checked={selectedUsers.has(u._id)}
                      onChange={() => toggleUserSelection(u._id)}
                      className="w-4 h-4"
                    />
                  </td>
                  <td className="py-3 font-medium text-hestia-navy">{u.username}</td>
                  <td className="py-3">
                    <span className={`rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wider ${
                      u.role === 'admin' ? 'bg-hestia-gold/10 text-hestia-gold' :
                      u.role === 'reception' ? 'bg-blue-100 text-blue-700' :
                      'bg-hestia-navy/10 text-hestia-navy'
                    }`}>
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
      
      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={handlePageChange}
        itemsPerPage={itemsPerPage}
        onItemsPerPageChange={handleItemsPerPageChange}
      />
    </div>
  )
}
