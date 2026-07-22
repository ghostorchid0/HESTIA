import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import api from '../api'

export default function AnalyticsPanel() {
  const { t } = useTranslation()
  const [data, setData] = useState(null)

  useEffect(() => {
    api.get('/admin/analytics').then(res => setData(res.data))
  }, [])

  if (!data) return <div className="flex h-64 items-center justify-center"><div className="h-10 w-10 animate-spin rounded-full border-2 border-hestia-linen border-t-hestia-gold" /></div>

  return (
    <div>
      <h1 className="mb-8 text-3xl font-light text-hestia-navy">{t('analyticsPanel.title')}</h1>
      <div className="mb-8 grid gap-6 sm:grid-cols-3">
        <div className="card-luxe p-6 text-center transition hover:shadow-luxe">
          <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">{t('analyticsPanel.totalOrders')}</p>
          <p className="mt-2 font-serif text-4xl text-hestia-navy">{data.totalOrders}</p>
        </div>
        <div className="card-luxe p-6 text-center transition hover:shadow-luxe">
          <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">{t('analyticsPanel.delivered')}</p>
          <p className="mt-2 font-serif text-4xl text-green-700">{data.deliveredOrders}</p>
        </div>
        <div className="card-luxe p-6 text-center transition hover:shadow-luxe">
          <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">{t('analyticsPanel.revenue')}</p>
          <p className="mt-2 font-serif text-4xl text-hestia-gold">${data.revenue.toFixed(2)}</p>
        </div>
      </div>

      <h2 className="mb-4 text-xl font-light text-hestia-navy">{t('analyticsPanel.recentOrders')}</h2>
      <div className="space-y-3">
        {data.recentOrders.map(order => (
          <div key={order._id} className="card-luxe flex items-center justify-between p-4 text-sm transition hover:shadow-luxe">
            <span className="font-serif text-lg text-hestia-navy">{t('room')} {order.roomNumber}</span>
            <span className="rounded-full bg-hestia-cream px-3 py-1 text-xs font-medium text-hestia-navy">{t(`status.${order.status}`)}</span>
            <span className="font-serif text-hestia-gold">${order.total.toFixed(2)}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
