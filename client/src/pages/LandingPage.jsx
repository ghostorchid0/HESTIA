import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import useSettings from '../hooks/useSettings'

export default function LandingPage() {
  const { t } = useTranslation()
  const { settings } = useSettings()

  return (
    <div className="min-h-screen bg-hestia-cream">
      <header className="border-b border-hestia-linen bg-white/80 px-6 py-4 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center justify-between">
          <span className="font-serif text-2xl text-hestia-navy">{settings?.hotelName || t('appName')}</span>
          <div className="flex items-center gap-3">
            <Link to="/admin/login" className="text-sm font-medium text-hestia-navy hover:text-hestia-gold">{t('landing.staffLogin')}</Link>
          </div>
        </div>
      </header>

      <section className="relative overflow-hidden px-6 py-24 text-center">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_var(--tw-gradient-stops))] from-hestia-linen/60 via-transparent to-transparent" />
        <div className="relative z-10 mx-auto max-w-3xl">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-hestia-gold">{t('tagline')}</p>
          <h1 className="mt-6 text-5xl font-light leading-tight text-hestia-navy md:text-6xl">{t('landing.headline')}</h1>
          <p className="mx-auto mt-6 max-w-xl text-lg text-gray-600">{t('landing.subheadline')}</p>
          <div className="mt-10 flex flex-col justify-center gap-4 sm:flex-row">
            <Link to="/demo" className="btn-primary">{t('landing.demo')}</Link>
            <Link to="/admin/login" className="btn-outline">{t('landing.admin')}</Link>
          </div>
        </div>
      </section>

      <section className="bg-white px-6 py-20">
        <div className="mx-auto max-w-6xl">
          <h2 className="text-center text-3xl font-light text-hestia-navy">{t('landing.featuresTitle')}</h2>
          <div className="mt-12 grid gap-8 md:grid-cols-3">
            {['qrOrdering', 'staffDashboard', 'payment'].map((key) => (
              <div key={key} className="card-luxe p-8 text-center">
                <h3 className="font-serif text-xl text-hestia-navy">{t(`landing.feature.${key}.title`)}</h3>
                <p className="mt-3 text-sm leading-relaxed text-gray-600">{t(`landing.feature.${key}.desc`)}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="px-6 py-20 text-center">
        <div className="mx-auto max-w-3xl">
          <h2 className="text-3xl font-light text-hestia-navy">{t('landing.pricingTitle')}</h2>
          <p className="mt-4 text-gray-600">{t('landing.pricingDesc')}</p>
          <div className="mt-10 inline-block rounded-3xl border border-hestia-gold bg-white p-10 shadow-soft">
            <p className="text-sm font-semibold uppercase tracking-wider text-gray-400">{t('landing.plan')}</p>
            <p className="mt-4 text-5xl font-light text-hestia-navy">{t('landing.price')}</p>
            <p className="mt-2 text-sm text-gray-500">{t('landing.perMonth')}</p>
            <ul className="mt-6 space-y-2 text-left text-sm text-gray-600">
              {['rooms', 'orders', 'support'].map((key) => (
                <li key={key} className="flex items-center gap-2">✓ {t(`landing.includes.${key}`)}</li>
              ))}
            </ul>
            <Link to="/admin/login" className="btn-primary mt-8 block">{t('landing.start')}</Link>
          </div>
        </div>
      </section>

      <footer className="border-t border-hestia-linen bg-hestia-navy px-6 py-10 text-center text-sm text-white/60">
        <p>{t('landing.footer')}</p>
      </footer>
    </div>
  )
}
