import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import api from '../api'

export default function AnalyticsPanel() {
  const { t } = useTranslation()
  const [data, setData] = useState(null)

  useEffect(() => {
    api.get('/admin/analytics').then(res => setData(res.data))
  }, [])

  if (!data) return <p className="text-gray-500">{t('loading')}</p>

  return (
    <div>
      <h1 className="mb-4 text-2xl font-bold">{t('analyticsPanel.title')}</h1>
      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        <div className="rounded-2xl bg-white p-5 shadow-sm">
          <p className="text-sm text-gray-500">{t('analyticsPanel.totalOrders')}</p>
          <p className="text-3xl font-bold text-amber-600">{data.totalOrders}</p>
        </div>
        <div className="rounded-2xl bg-white p-5 shadow-sm">
          <p className="text-sm text-gray-500">{t('analyticsPanel.delivered')}</p>
          <p className="text-3xl font-bold text-green-600">{data.deliveredOrders}</p>
        </div>
        <div className="rounded-2xl bg-white p-5 shadow-sm">
          <p className="text-sm text-gray-500">{t('analyticsPanel.revenue')}</p>
          <p className="text-3xl font-bold text-amber-600">${data.revenue.toFixed(2)}</p>
        </div>
      </div>
      <h2 className="mb-3 text-lg font-semibold">{t('analyticsPanel.recentOrders')}</h2>
      <div className="space-y-3">
        {data.recentOrders.map(order => (
          <div key={order._id} className="flex items-center justify-between rounded-xl bg-white p-4 shadow-sm text-sm">
            <span>{t('room')} {order.roomNumber}</span>
            <span className="rounded bg-gray-100 px-2 py-1">{t(`status.${order.status}`)}</span>
            <span className="font-medium">${order.total.toFixed(2)}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
