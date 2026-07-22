import { useEffect, useState, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, PieChart, Pie, Cell } from 'recharts'
import api from '../api'

const PERIODS = ['day', 'week', 'month', 'year']
const PIE_COLORS = ['#0B1A2A', '#C9A227', '#E3C65D', '#EAE6DD', '#2C2C2C', '#B45309', '#166534']

function today() {
  return new Date().toISOString().split('T')[0]
}

function formatCurrency(value) {
  return `$${Number(value).toFixed(2)}`
}

export default function SalesReportPanel() {
  const { t } = useTranslation()
  const [date, setDate] = useState(today())
  const [period, setPeriod] = useState('day')
  const [report, setReport] = useState(null)

  useEffect(() => {
    api.get(`/admin/analytics/sales?date=${date}&period=${period}`).then(res => setReport(res.data))
  }, [date, period])

  const periodLabel = useMemo(() => {
    if (!report) return ''
    const start = new Date(report.start).toLocaleDateString()
    const end = new Date(report.end).toLocaleDateString()
    return start === end ? start : `${start} → ${end}`
  }, [report])

  const downloadReport = () => {
    if (!report) return
    const lines = [
      t('salesReportPanel.title') + ' — ' + periodLabel,
      '================================================',
      '',
      `${t('salesReportPanel.totalOrders')}: ${report.totalOrders}`,
      `${t('salesReportPanel.totalRevenue')}: ${formatCurrency(report.totalRevenue)}`,
      `${t('salesReportPanel.averageOrder')}: ${formatCurrency(report.averageOrderValue)}`,
      '',
      t('salesReportPanel.topItems'),
      report.topItems.map((it, i) => `${i + 1}. ${it.name} (${it.category || '-'}) — ${it.quantity}x — ${formatCurrency(it.revenue)}`).join('\n'),
      '',
      t('salesReportPanel.salesByCategory'),
      report.categorySales.map(c => `${c.category}: ${c.quantity}x — ${formatCurrency(c.revenue)}`).join('\n'),
      '',
      t('salesReportPanel.recentOrders'),
      report.orders.map(o => `${o.roomNumber} — ${formatCurrency(o.total)} — ${new Date(o.createdAt).toLocaleString()}`).join('\n'),
    ]
    const blob = new Blob([lines.join('\n')], { type: 'text/plain' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `hestia-sales-report-${date}-${period}.txt`
    a.click()
    window.URL.revokeObjectURL(url)
  }

  if (!report) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-hestia-linen border-t-hestia-gold" />
      </div>
    )
  }

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
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-light text-hestia-navy">{t('salesReportPanel.title')}</h1>
          <p className="mt-1 text-sm text-gray-500">{periodLabel}</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="input-luxe"
          />
          <div className="flex rounded-xl border border-hestia-linen bg-white p-1">
            {PERIODS.map((p) => (
              <button
                key={p}
                onClick={() => setPeriod(p)}
                className={`rounded-lg px-4 py-2 text-sm font-medium transition ${
                  period === p ? 'bg-hestia-navy text-white' : 'text-hestia-navy hover:bg-hestia-cream'
                }`}
              >
                {t(`salesReportPanel.${p}`)}
              </button>
            ))}
          </div>
          <button onClick={downloadReport} className="btn-outline">
            {t('salesReportPanel.download')}
          </button>
        </div>
      </div>

      {report.totalOrders === 0 ? (
        <div className="card-luxe p-10 text-center">
          <p className="text-gray-500">{t('salesReportPanel.noData')}</p>
        </div>
      ) : (
        <>
          <div className="mb-8 grid gap-5 sm:grid-cols-3">
            <Stat label={t('salesReportPanel.totalOrders')} value={report.totalOrders} />
            <Stat label={t('salesReportPanel.totalRevenue')} value={formatCurrency(report.totalRevenue)} />
            <Stat label={t('salesReportPanel.averageOrder')} value={formatCurrency(report.averageOrderValue)} />
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <div className="card-luxe p-6 transition hover:shadow-luxe">
              <h2 className="mb-4 text-xl font-light text-hestia-navy">{t('salesReportPanel.topItems')}</h2>
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={report.topItems.slice(0, 8)} margin={{ top: 10, right: 20, left: -10, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#EAE6DD" />
                    <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#666' }} interval={0} angle={-15} textAnchor="end" height={60} />
                    <YAxis tick={{ fontSize: 11, fill: '#666' }} />
                    <Tooltip contentStyle={tooltipStyle} formatter={(v) => formatCurrency(v)} />
                    <Bar dataKey="revenue" fill="#C9A227" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <table className="mt-4 w-full text-sm">
                <thead>
                  <tr className="border-b border-hestia-linen text-left text-xs uppercase tracking-wider text-gray-400">
                    <th className="pb-2">{t('salesReportPanel.item')}</th>
                    <th className="pb-2">{t('salesReportPanel.category')}</th>
                    <th className="pb-2 text-right">{t('salesReportPanel.quantity')}</th>
                    <th className="pb-2 text-right">{t('salesReportPanel.revenue')}</th>
                  </tr>
                </thead>
                <tbody>
                  {report.topItems.map((it) => (
                    <tr key={it._id} className="border-b border-hestia-linen last:border-0">
                      <td className="py-2 font-medium text-hestia-navy">{it.name}</td>
                      <td className="py-2 text-gray-500">{it.category || '-'}</td>
                      <td className="py-2 text-right">{it.quantity}</td>
                      <td className="py-2 text-right font-serif text-hestia-gold">{formatCurrency(it.revenue)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="card-luxe p-6 transition hover:shadow-luxe">
              <h2 className="mb-4 text-xl font-light text-hestia-navy">{t('salesReportPanel.salesByCategory')}</h2>
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={report.categorySales}
                      dataKey="revenue"
                      nameKey="category"
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      label={({ category }) => category}
                    >
                      {report.categorySales.map((_, idx) => (
                        <Cell key={idx} fill={PIE_COLORS[idx % PIE_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={tooltipStyle} formatter={(v) => formatCurrency(v)} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <table className="mt-4 w-full text-sm">
                <thead>
                  <tr className="border-b border-hestia-linen text-left text-xs uppercase tracking-wider text-gray-400">
                    <th className="pb-2">{t('salesReportPanel.category')}</th>
                    <th className="pb-2 text-right">{t('salesReportPanel.quantity')}</th>
                    <th className="pb-2 text-right">{t('salesReportPanel.revenue')}</th>
                  </tr>
                </thead>
                <tbody>
                  {report.categorySales.map((c) => (
                    <tr key={c.category} className="border-b border-hestia-linen last:border-0">
                      <td className="py-2 font-medium text-hestia-navy">{c.category}</td>
                      <td className="py-2 text-right">{c.quantity}</td>
                      <td className="py-2 text-right font-serif text-hestia-gold">{formatCurrency(c.revenue)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="card-luxe mt-6 p-6 transition hover:shadow-luxe">
            <h2 className="mb-4 text-xl font-light text-hestia-navy">{t('salesReportPanel.recentOrders')}</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-hestia-linen text-left text-xs uppercase tracking-wider text-gray-400">
                    <th className="pb-2">{t('room')}</th>
                    <th className="pb-2">{t('salesReportPanel.item')}</th>
                    <th className="pb-2 text-right">{t('total')}</th>
                    <th className="pb-2 text-right">{t('status.Received')}</th>
                  </tr>
                </thead>
                <tbody>
                  {report.orders.slice(0, 20).map((o) => (
                    <tr key={o._id} className="border-b border-hestia-linen last:border-0">
                      <td className="py-2 font-medium text-hestia-navy">{o.roomNumber}</td>
                      <td className="py-2 text-gray-600">{o.items.map(i => `${i.quantity}x ${i.name}`).join(', ')}</td>
                      <td className="py-2 text-right font-serif text-hestia-gold">{formatCurrency(o.total)}</td>
                      <td className="py-2 text-right text-gray-500">{new Date(o.createdAt).toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
