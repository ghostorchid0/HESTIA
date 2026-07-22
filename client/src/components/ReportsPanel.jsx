import { useEffect, useState, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, LineChart, Line, AreaChart, Area,
} from 'recharts'
import api from '../api'

export default function ReportsPanel() {
  const { t } = useTranslation()
  const [data, setData] = useState(null)

  useEffect(() => {
    api.get('/admin/analytics/rush').then(res => setData(res.data))
  }, [])

  const days = t('days', { returnObjects: true })

  const hourly = useMemo(() => data?.hourly || [], [data])
  const daily = useMemo(() => (data?.daily || []).map(d => ({ ...d, label: days[d.day] || d.label })), [data, days])
  const monthly = useMemo(() => data?.monthly || [], [data])
  const yearly = useMemo(() => data?.yearly || [], [data])

  if (!data) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-hestia-linen border-t-hestia-gold" />
      </div>
    )
  }

  const ChartCard = ({ title, children }) => (
    <div className="card-luxe p-6 transition hover:shadow-luxe">
      <h2 className="mb-4 text-xl font-light text-hestia-navy">{title}</h2>
      <div className="h-64 w-full">
        {children}
      </div>
    </div>
  )

  const tooltipStyle = {
    backgroundColor: '#0B1A2A',
    border: 'none',
    borderRadius: '0.75rem',
    color: '#F7F5F0',
    fontSize: '0.75rem',
  }

  return (
    <div>
      <h1 className="mb-8 text-3xl font-light text-hestia-navy">{t('reportsPanel.title')}</h1>
      <div className="grid gap-6 lg:grid-cols-2">
        <ChartCard title={t('reportsPanel.hourly')}>
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={hourly} margin={{ top: 10, right: 20, left: -10, bottom: 0 }}>
              <defs>
                <linearGradient id="colorHour" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#C9A227" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#C9A227" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#EAE6DD" />
              <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#666' }} interval={2} />
              <YAxis tick={{ fontSize: 11, fill: '#666' }} />
              <Tooltip contentStyle={tooltipStyle} />
              <Area type="monotone" dataKey="count" stroke="#C9A227" fillOpacity={1} fill="url(#colorHour)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title={t('reportsPanel.daily')}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={daily} margin={{ top: 10, right: 20, left: -10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#EAE6DD" />
              <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#666' }} />
              <YAxis tick={{ fontSize: 11, fill: '#666' }} />
              <Tooltip contentStyle={tooltipStyle} />
              <Bar dataKey="count" fill="#0B1A2A" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title={t('reportsPanel.monthly')}>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={monthly} margin={{ top: 10, right: 20, left: -10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#EAE6DD" />
              <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#666' }} angle={-30} textAnchor="end" height={50} />
              <YAxis tick={{ fontSize: 11, fill: '#666' }} />
              <Tooltip contentStyle={tooltipStyle} />
              <Line type="monotone" dataKey="count" stroke="#C9A227" strokeWidth={2} dot={{ r: 3, fill: '#0B1A2A' }} />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title={t('reportsPanel.yearly')}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={yearly} margin={{ top: 10, right: 20, left: -10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#EAE6DD" />
              <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#666' }} />
              <YAxis tick={{ fontSize: 11, fill: '#666' }} />
              <Tooltip contentStyle={tooltipStyle} />
              <Bar dataKey="count" fill="#C9A227" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>
    </div>
  )
}
