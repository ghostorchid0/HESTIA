import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import useSubscription from '../hooks/useSubscription'

const plans = ['STARTER', 'PRO', 'ENTERPRISE']

const featuresByPlan = {
  STARTER: [
    'Zero-login QR ordering',
    'Up to 12 rooms',
    'Basic staff dashboard',
    'Real-time order alerts',
  ],
  PRO: [
    'Everything in Starter',
    'Up to 35 rooms',
    'Amenities & special requests',
    'White-label branding',
    'Revenue dashboard & CSV export',
  ],
  ENTERPRISE: [
    'Everything in Pro',
    'Unlimited rooms',
    'Multi-property support',
    'Webhooks & SMS guest notifications',
    'Custom domain',
  ],
}

export default function PlanOverview() {
  const { t } = useTranslation()
  const { plan, status, trialDaysLeft, rooms, upgrade } = useSubscription()
  const [selected, setSelected] = useState(plan)
  const [busy, setBusy] = useState(false)

  const doUpgrade = async () => {
    setBusy(true)
    try {
      await upgrade(selected)
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="card-luxe p-6 sm:p-8">
      <h2 className="text-2xl font-light text-hestia-navy">{t('planOverview.title')}</h2>
      <p className="mt-2 text-sm text-gray-500">
        {t('planOverview.currentPlan')}: <span className="font-semibold uppercase text-hestia-navy">{plan}</span>
        {status === 'TRIAL' && ` — ${trialDaysLeft} ${t('planOverview.trialDays')}`}
      </p>
      <p className="text-sm text-gray-500">
        {t('planOverview.rooms')}: {rooms.used} / {rooms.max}
      </p>

      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        {plans.map((p) => (
          <div
            key={p}
            onClick={() => setSelected(p)}
            className={`cursor-pointer rounded-2xl border p-5 transition hover:shadow-luxe ${selected === p ? 'border-hestia-gold bg-hestia-gold/5' : 'border-hestia-linen bg-white'}`}
          >
            <div className="flex items-center justify-between">
              <h3 className="font-serif text-xl text-hestia-navy">{p}</h3>
              {p === plan && <span className="rounded-full bg-hestia-navy px-2 py-0.5 text-xs text-white">{t('planOverview.current')}</span>}
            </div>
            <ul className="mt-4 space-y-2 text-sm text-gray-600">
              {featuresByPlan[p].map((f) => (
                <li key={f} className="flex items-start gap-2"><span className="text-hestia-gold">✓</span>{f}</li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <button
        onClick={doUpgrade}
        disabled={busy || selected === plan}
        className="btn-primary mt-6 w-full sm:w-auto disabled:opacity-50"
      >
        {busy ? t('planOverview.upgrading') : selected === plan ? t('planOverview.alreadyOnPlan') : t('planOverview.upgradeTo', { plan: selected })}
      </button>
    </div>
  )
}
