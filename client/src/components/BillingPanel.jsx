import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import api from '../api'

const togocelPrefixes = ['70', '71', '72', '73', '90', '91', '92', '93']
const moovPrefixes = ['78', '79', '96', '97', '98', '99']

function normalizeMsisdn(phone) {
  if (!phone) return ''
  let msisdn = phone.replace(/\D/g, '')
  if (msisdn.startsWith('00')) msisdn = msisdn.slice(2)
  if (msisdn.startsWith('0')) msisdn = '228' + msisdn.slice(1)
  if (!msisdn.startsWith('228')) msisdn = '228' + msisdn
  return msisdn
}

function detectOperator(phone) {
  const msisdn = normalizeMsisdn(phone)
  if (msisdn.length < 5) return ''
  const prefix = msisdn.slice(3, 5)
  if (togocelPrefixes.includes(prefix)) return 'togocel'
  if (moovPrefixes.includes(prefix)) return 'moov'
  return ''
}

function daysLeft(date) {
  if (!date) return 0
  const diff = new Date(date) - new Date()
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)))
}

export default function BillingPanel() {
  const { t } = useTranslation()
  const [state, setState] = useState(null)
  const [payments, setPayments] = useState([])
  const [phone, setPhone] = useState('')
  const [operator, setOperator] = useState('')
  const [detected, setDetected] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [pendingRef, setPendingRef] = useState(null)

  const fetchState = async () => {
    const res = await api.get('/billing/state')
    setState(res.data)
    setPhone(res.data.billingPhone || '')
    setOperator(res.data.billingOperator || '')
  }

  const fetchPayments = async () => {
    const res = await api.get('/billing/payments')
    setPayments(res.data)
  }

  useEffect(() => {
    fetchState()
    fetchPayments()
  }, [])

  useEffect(() => {
    setDetected(detectOperator(phone))
  }, [phone])

  useEffect(() => {
    if (!pendingRef) return
    const interval = setInterval(() => {
      api.post('/billing/refresh', { transref: pendingRef }).then(res => {
        if (res.data.status === 'success') {
          setMessage(t('billing.paymentSuccess'))
          setPendingRef(null)
          fetchState()
          fetchPayments()
        } else if (res.data.status === 'failed') {
          setError(t('billing.paymentFailed'))
          setPendingRef(null)
        }
      }).catch(() => {})
    }, 10000)
    return () => clearInterval(interval)
  }, [pendingRef, t])

  const saveBillingInfo = async (e) => {
    e.preventDefault()
    setMessage('')
    setError('')
    try {
      await api.put('/billing/info', { billingPhone: phone, billingOperator: operator || detected })
      setMessage(t('billing.infoSaved'))
    } catch (err) {
      setError(err.response?.data?.message || t('billing.error'))
    }
  }

  const initiate = async () => {
    setLoading(true)
    setMessage('')
    setError('')
    try {
      const res = await api.post('/billing/initiate', { phone, operator: operator || detected, type: state.status === 'trial' ? 'trial_to_active' : 'renewal' })
      setPendingRef(res.data.transref)
      setMessage(t('billing.paymentInitiated'))
    } catch (err) {
      setError(err.response?.data?.message || t('billing.error'))
    } finally {
      setLoading(false)
    }
  }

  const statusColor = {
    trial: 'bg-blue-100 text-blue-700',
    active: 'bg-green-100 text-green-700',
    past_due: 'bg-yellow-100 text-yellow-700',
    cancelled: 'bg-red-100 text-red-700',
  }

  if (!state) return <div className="flex h-64 items-center justify-center"><div className="h-10 w-10 animate-spin rounded-full border-2 border-hestia-linen border-t-hestia-gold" /></div>

  const left = state.status === 'trial' ? daysLeft(state.trialEndsAt) : daysLeft(state.subscriptionExpiresAt)

  return (
    <div>
      <h1 className="mb-8 text-3xl font-light text-hestia-navy">{t('billing.title')}</h1>

      <div className="card-luxe mb-8 p-8">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm uppercase tracking-wider text-gray-500">{t('billing.status')}</p>
            <span className={`mt-2 inline-block rounded-full px-4 py-1 text-sm font-semibold ${statusColor[state.status] || 'bg-gray-100'}`}>
              {t(`billing.${state.status}`)}
            </span>
          </div>
          <div className="text-right">
            <p className="text-sm uppercase tracking-wider text-gray-500">{state.status === 'trial' ? t('billing.trialEndsIn') : t('billing.expiresIn')}</p>
            <p className="text-2xl font-light text-hestia-navy">{left} {t('billing.days')}</p>
          </div>
        </div>

        <div className="mt-8 border-t border-hestia-linen pt-8">
          <p className="text-sm uppercase tracking-wider text-gray-500">{t('billing.price')}</p>
          <p className="text-3xl font-serif text-hestia-gold">{state.price.toLocaleString()} <span className="text-base text-gray-500">{state.currency} / {t('billing.month')}</span></p>
        </div>
      </div>

      <form onSubmit={saveBillingInfo} className="card-luxe mb-8 p-8">
        <h2 className="mb-6 text-xl text-hestia-navy">{t('billing.paymentInfo')}</h2>
        <div className="grid gap-5 md:grid-cols-2">
          <div>
            <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-gray-500">{t('billing.phone')}</label>
            <input value={phone} onChange={e => setPhone(e.target.value)} className="input-luxe w-full" placeholder="22890XXXXXX" />
            {detected && <p className="mt-1 text-xs text-hestia-gold">{t(`billing.${detected}`)}</p>}
          </div>
          <div>
            <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-gray-500">{t('billing.operator')}</label>
            <select value={operator || detected} onChange={e => setOperator(e.target.value)} className="input-luxe w-full">
              <option value="">{t('billing.selectOperator')}</option>
              <option value="togocel">{t('billing.togocel')}</option>
              <option value="moov">{t('billing.moov')}</option>
            </select>
          </div>
        </div>
        {message && <p className="mt-4 text-sm text-green-600">{message}</p>}
        {error && <p className="mt-4 text-sm text-red-600">{error}</p>}
        <div className="mt-6 flex gap-4">
          <button type="submit" className="btn-primary">{t('billing.saveInfo')}</button>
          <button type="button" onClick={initiate} disabled={loading || (!operator && !detected)} className="btn-primary bg-hestia-gold disabled:opacity-50">
            {loading ? t('billing.processing') : t('billing.payNow')}
          </button>
        </div>
      </form>

      <div className="card-luxe p-8">
        <h2 className="mb-6 text-xl text-hestia-navy">{t('billing.history')}</h2>
        {payments.length === 0 ? (
          <p className="text-center text-gray-500">{t('billing.noPayments')}</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-hestia-linen text-left text-xs uppercase tracking-wider text-gray-400">
                <th className="pb-3">{t('billing.date')}</th>
                <th className="pb-3">{t('billing.amount')}</th>
                <th className="pb-3">{t('billing.operator')}</th>
                <th className="pb-3">{t('billing.status')}</th>
              </tr>
            </thead>
            <tbody>
              {payments.map(p => (
                <tr key={p._id} className="border-b border-hestia-linen last:border-0">
                  <td className="py-3">{new Date(p.createdAt).toLocaleString()}</td>
                  <td className="py-3">{p.amount.toLocaleString()} {p.currency}</td>
                  <td className="py-3 uppercase">{p.operator}</td>
                  <td className="py-3">
                    <span className={`rounded-full px-2 py-1 text-xs font-semibold ${p.status === 'success' ? 'bg-green-100 text-green-700' : p.status === 'failed' ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'}`}>
                      {t(`billing.${p.status}`)}
                    </span>
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
