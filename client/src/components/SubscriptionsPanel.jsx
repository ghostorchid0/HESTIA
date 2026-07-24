import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import api from '../api'

function daysLeft(date) {
  if (!date) return 0
  const diff = new Date(date) - new Date()
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)))
}

export default function SubscriptionsPanel() {
  const { t } = useTranslation()
  const [hotels, setHotels] = useState([])
  const [filter, setFilter] = useState('all')
  const [message, setMessage] = useState('')

  const fetchHotels = async () => {
    const res = await api.get('/billing/admin/hotels')
    setHotels(res.data)
  }

  useEffect(() => { fetchHotels() }, [])

  const action = async (url, body = {}) => {
    setMessage('')
    try {
      await api.post(url, body)
      setMessage(t('subscriptions.success'))
      fetchHotels()
    } catch (err) {
      setMessage(err.response?.data?.message || t('subscriptions.error'))
    }
  }

  const filtered = filter === 'all' ? hotels : hotels.filter(h => h.subscriptionStatus === filter)

  const statusColor = {
    trial: 'bg-blue-100 text-blue-700',
    active: 'bg-green-100 text-green-700',
    past_due: 'bg-yellow-100 text-yellow-700',
    cancelled: 'bg-red-100 text-red-700',
  }

  return (
    <div>
      <h1 className="mb-8 text-3xl font-light text-hestia-navy">{t('subscriptions.title')}</h1>

      <div className="mb-6 flex flex-wrap gap-2">
        {['all', 'trial', 'active', 'past_due', 'cancelled'].map(f => (
          <button key={f} onClick={() => setFilter(f)} className={`rounded-lg px-4 py-2 text-sm ${filter === f ? 'bg-hestia-navy text-white' : 'bg-hestia-linen text-hestia-navy'}`}>
            {t(`subscriptions.${f}`)}
          </button>
        ))}
      </div>

      {message && <p className="mb-6 text-sm text-green-600">{message}</p>}

      <div className="space-y-4">
        {filtered.map(h => (
          <div key={h._id} className="card-luxe p-6">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div>
                <h3 className="text-lg font-semibold text-hestia-navy">{h.name}</h3>
                <p className="text-xs text-gray-400">{h.slug}</p>
                <span className={`mt-2 inline-block rounded-full px-3 py-1 text-xs font-semibold ${statusColor[h.subscriptionStatus] || 'bg-gray-100'}`}>
                  {t(`billing.${h.subscriptionStatus}`)}
                </span>
                <p className="mt-2 text-sm text-gray-500">
                  {h.subscriptionStatus === 'trial'
                    ? `${t('subscriptions.trialEnds')}: ${daysLeft(h.trialEndsAt)} ${t('billing.days')}`
                    : `${t('subscriptions.expires')}: ${daysLeft(h.subscriptionExpiresAt)} ${t('billing.days')}`}
                </p>
                {h.billingPhone && <p className="text-sm text-gray-500">{h.billingPhone} • {h.billingOperator || '-'}</p>}
              </div>

              <div className="flex flex-wrap gap-2">
                <button onClick={() => action(`/billing/admin/${h._id}/activate`, { days: 30 })} className="rounded-lg bg-green-50 px-3 py-2 text-sm text-green-700 hover:bg-green-100">
                  {t('subscriptions.activate')}
                </button>
                <button onClick={() => {
                  const days = prompt(t('subscriptions.extendPrompt'), '7')
                  if (days) action(`/billing/admin/${h._id}/extend-trial`, { days: parseInt(days, 10) })
                }} className="rounded-lg bg-blue-50 px-3 py-2 text-sm text-blue-700 hover:bg-blue-100">
                  {t('subscriptions.extendTrial')}
                </button>
                <button onClick={() => action(`/billing/admin/${h._id}/cancel`)} className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700 hover:bg-red-100">
                  {t('subscriptions.cancel')}
                </button>
                <button onClick={async () => {
                  const res = await api.get(`/billing/admin/payments/${h._id}`)
                  alert(res.data.map(p => `${p.status} - ${p.amount} ${p.currency} - ${new Date(p.createdAt).toLocaleDateString()}`).join('\n') || t('subscriptions.noPayments'))
                }} className="rounded-lg bg-hestia-linen px-3 py-2 text-sm text-hestia-navy hover:bg-hestia-gold/20">
                  {t('subscriptions.payments')}
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
