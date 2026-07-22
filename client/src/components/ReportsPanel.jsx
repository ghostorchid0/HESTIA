import { useEffect, useState, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, LineChart, Line, AreaChart, Area,
} from 'recharts'
import api from '../api'

function maxEntry(arr) {
  if (!arr.length) return null
  return arr.reduce((max, item) => (item.count > max.count ? item : max), arr[0])
}

function average(arr, divisor) {
  const total = arr.reduce((sum, item) => sum + item.count, 0)
  return divisor ? total / divisor : 0
}

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

  const totalOrders = useMemo(() => hourly.reduce((sum, h) => sum + h.count, 0), [hourly])
  const peakHour = useMemo(() => maxEntry(hourly), [hourly])
  const busiestDay = useMemo(() => maxEntry(daily), [daily])
  const busiestMonth = useMemo(() => maxEntry(monthly), [monthly])
  const bestYear = useMemo(() => maxEntry(yearly), [yearly])

  const downloadReport = () => {
    const lines = [
      t('reportsPanel.title'),
      '==================',
      '',
      `${t('reportsPanel.totalOrders')}: ${totalOrders}`,
      `${t('reportsPanel.peakHour')}: ${peakHour ? peakHour.label + ' (' + peakHour.count + ' ' + t('reportsPanel.orders') + ')' : '-'}`,
      `${t('reportsPanel.busiestDay')}: ${busiestDay ? busiestDay.label + ' (' + busiestDay.count + ' ' + t('reportsPanel.orders') + ')' : '-'}`,
      `${t('reportsPanel.busiestMonth')}: ${busiestMonth ? busiestMonth.label + ' (' + busiestMonth.count + ' ' + t('reportsPanel.orders') + ')' : '-'}`,
      `${t('reportsPanel.bestYear')}: ${bestYear ? bestYear.label + ' (' + bestYear.count + ' ' + t('reportsPanel.orders') + ')' : '-'}`,
      `${t('reportsPanel.averagePerHour')}: ${average(hourly, 24).toFixed(1)}`,
      `${t('reportsPanel.averagePerDay')}: ${average(daily, 7).toFixed(1)}`,
      '',
      t('reportsPanel.hourly'),
      hourly.map(h => `${h.label}: ${h.count}`).join('\n'),
      '',
      t('reportsPanel.daily'),
      daily.map(d => `${d.label}: ${d.count}`).join('\n'),
      '',
      t('reportsPanel.monthly'),
      monthly.map(m => `${m.label}: ${m.count}`).join('\n'),
      '',
      t('reportsPanel.yearly'),
      yearly.map(y => `${y.label}: ${y.count}`).join('\n'),
    ]
    const blob = new Blob([lines.join('\n')], { type: 'text/plain' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'hestia-rush-report.txt'
    a.click()
    window.URL.revokeObjectURL(url)
  }

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

  const Stat = ({ label, value, sub }) => (
    <div className="card-luxe p-5 text-center transition hover:shadow-luxe">
      <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">{label}</p>
      <p className="mt-2 font-serif text-3xl text-hestia-navy">{value}</p>
      {sub && <p className="mt-1 text-sm text-hestia-gold">{sub}</p>}
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
      <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-3xl font-light text-hestia-navy">{t('reportsPanel.title')}</h1>
        <button onClick={downloadReport} className="btn-outline">{t('reportsPanel.writtenReport')} .txt</button>
      </div>

      <h2 className="mb-4 text-xl font-light text-hestia-navy">{t('reportsPanel.writtenReport')}</h2>
      <div className="mb-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <Stat label={t('reportsPanel.totalOrders')} value={totalOrders} />
        <Stat label={t('reportsPanel.peakHour')} value={peakHour ? peakHour.label : '-'} sub={peakHour ? `${peakHour.count} ${t('reportsPanel.orders')}` : ''} />
        <Stat label={t('reportsPanel.busiestDay')} value={busiestDay ? busiestDay.label : '-'} sub={busiestDay ? `${busiestDay.count} ${t('reportsPanel.orders')}` : ''} />
        <Stat label={t('reportsPanel.busiestMonth')} value={busiestMonth ? busiestMonth.label : '-'} sub={busiestMonth ? `${busiestMonth.count} ${t('reportsPanel.orders')}` : ''} />
        <Stat label={t('reportsPanel.bestYear')} value={bestYear ? bestYear.label : '-'} sub={bestYear ? `${bestYear.count} ${t('reportsPanel.orders')}` : ''} />
        <Stat label={t('reportsPanel.averagePerHour')} value={average(hourly, 24).toFixed(1)} />
        <Stat label={t('reportsPanel.averagePerDay')} value={average(daily, 7).toFixed(1)} />
      </div>

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
