import { useEffect, useState, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, PieChart, Pie, Cell, AreaChart, Area,
} from 'recharts'
import api from '../api'
import useSettings from '../hooks/useSettings'
import { formatCurrency } from '../utils/format'
import FeatureGate from './FeatureGate'

export default function AnalyticsPanel() {
  const { t } = useTranslation()
  const { settings } = useSettings()
  const [data, setData] = useState(null)

  const fetchData = useCallback(() => {
    api.get('/admin/analytics').then(res => setData(res.data))
  }, [])

  useEffect(() => {
    fetchData()
    const interval = setInterval(fetchData, 3000)
    return () => clearInterval(interval)
  }, [fetchData])

  if (!data) return <div className="flex h-64 items-center justify-center"><div className="h-10 w-10 animate-spin rounded-full border-2 border-hestia-linen border-t-hestia-gold" /></div>

  const tooltipStyle = {
    backgroundColor: '#0B1A2A',
    border: 'none',
    borderRadius: '0.75rem',
    color: '#F7F5F0',
    fontSize: '0.75rem',
  }
  const pieColors = ['#0B1A2A', '#C9A227', '#E3C65D', '#EAE6DD', '#2C2C2C', '#B45309']

  return (
    <FeatureGate feature="REVENUE_DASHBOARD" fallback={<div className="p-8 text-center text-gray-500">🔒 Analytics dashboard requires PRO or Enterprise.</div>}>
    <div>
      <h1 className="mb-8 text-3xl font-light text-hestia-navy">{t('analyticsPanel.title')}</h1>
      <div className="mb-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <div className="card-luxe p-6 text-center transition hover:shadow-luxe">
          <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">{t('analyticsPanel.totalOrders')}</p>
          <p className="mt-2 font-serif text-4xl text-hestia-navy">{data.totalOrders}</p>
        </div>
        <div className="card-luxe p-6 text-center transition hover:shadow-luxe">
          <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">{t('analyticsPanel.delivered')}</p>
          <p className="mt-2 font-serif text-4xl text-green-700">{data.deliveredOrders}</p>
        </div>
        <div className="card-luxe p-6 text-center transition hover:shadow-luxe">
          <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">{t('analyticsPanel.paidOrders')}</p>
          <p className="mt-2 font-serif text-4xl text-hestia-gold">{data.paidOrders}</p>
        </div>
        <div className="card-luxe p-6 text-center transition hover:shadow-luxe">
          <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">{t('analyticsPanel.revenue')}</p>
          <p className="mt-2 font-serif text-4xl text-hestia-gold">{formatCurrency(data.revenue, settings?.currency)}</p>
        </div>
      </div>

      <div className="mb-8 grid gap-6 lg:grid-cols-2">
        <div className="card-luxe p-6 transition hover:shadow-luxe">
          <h2 className="mb-4 text-xl font-light text-hestia-navy">{t('analyticsPanel.revenue7Days')}</h2>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data.revenueByDay} margin={{ top: 10, right: 20, left: -10, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#C9A227" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#C9A227" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#EAE6DD" />
                <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#666' }} />
                <YAxis tick={{ fontSize: 11, fill: '#666' }} tickFormatter={(v) => formatCurrency(v, settings?.currency)} width={80} />
                <Tooltip contentStyle={tooltipStyle} formatter={(v) => formatCurrency(v, settings?.currency)} />
                <Area type="monotone" dataKey="revenue" stroke="#C9A227" fill="url(#colorRevenue)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="card-luxe p-6 transition hover:shadow-luxe">
          <h2 className="mb-4 text-xl font-light text-hestia-navy">{t('analyticsPanel.topItems')}</h2>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.topItems} margin={{ top: 10, right: 20, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#EAE6DD" />
                <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#666' }} interval={0} angle={-15} textAnchor="end" height={60} />
                <YAxis tick={{ fontSize: 11, fill: '#666' }} tickFormatter={(v) => formatCurrency(v, settings?.currency)} width={80} />
                <Tooltip contentStyle={tooltipStyle} formatter={(v) => formatCurrency(v, settings?.currency)} />
                <Bar dataKey="revenue" fill="#C9A227" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="card-luxe p-6 transition hover:shadow-luxe">
          <h2 className="mb-4 text-xl font-light text-hestia-navy">{t('analyticsPanel.salesByDepartment')}</h2>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={data.categorySales} dataKey="revenue" nameKey="category" cx="50%" cy="50%" outerRadius={80} label={({ category }) => t(`staffPanel.${category}`)}>
                  {data.categorySales.map((_, idx) => (
                    <Cell key={idx} fill={pieColors[idx % pieColors.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={tooltipStyle} formatter={(v) => formatCurrency(v, settings?.currency)} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="card-luxe p-6 transition hover:shadow-luxe">
          <h2 className="mb-4 text-xl font-light text-hestia-navy">{t('analyticsPanel.recentOrders')}</h2>
          <div className="max-h-64 overflow-y-auto space-y-3">
            {data.recentOrders.map(order => (
              <div key={order._id} className="flex items-center justify-between border-b border-hestia-linen pb-3 text-sm last:border-0 last:pb-0">
                <span className="font-serif text-hestia-navy">{t('room')} {order.roomNumber}</span>
                <span className="rounded-full bg-hestia-cream px-3 py-1 text-xs font-medium text-hestia-navy">{t(`status.${order.status}`)}</span>
                <span className="font-serif text-hestia-gold">{formatCurrency(order.total, settings?.currency)}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
    </FeatureGate>
  )
}
