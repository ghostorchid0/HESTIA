import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import api from '../api'
import { useToast } from '../contexts/ToastContext'

export default function LandingPage() {
  const { t } = useTranslation()
  const toast = useToast()
  const [contactForm, setContactForm] = useState({ name: '', email: '', phone: '', message: '' })
  const [sending, setSending] = useState(false)

  const handleContactSubmit = async (e) => {
    e.preventDefault()
    if (!contactForm.name || !contactForm.email || !contactForm.message) {
      toast.error('Veuillez remplir tous les champs obligatoires')
      return
    }

    setSending(true)
    try {
      await api.post('/contact', contactForm)
      toast.success('Message envoyé avec succès ! Nous vous répondrons rapidement.')
      setContactForm({ name: '', email: '', phone: '', message: '' })
    } catch (error) {
      toast.error('Erreur lors de l\'envoi du message. Veuillez réessayer.')
      console.error('Contact form error:', error)
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="min-h-screen bg-hestia-cream">
      <header className="border-b border-hestia-linen bg-white/80 px-4 py-3 backdrop-blur-md sm:px-6 sm:py-4">
        <div className="mx-auto flex max-w-6xl items-center justify-between">
          <span className="font-serif text-xl text-hestia-navy sm:text-2xl">{t('appName')}</span>
          <div className="flex items-center gap-3">
            <Link to="/admin/login" className="text-sm font-medium text-hestia-navy hover:text-hestia-gold">{t('landing.staffLogin')}</Link>
          </div>
        </div>
      </header>

      <section className="relative overflow-hidden px-4 py-16 text-center sm:px-6 sm:py-24">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_var(--tw-gradient-stops))] from-hestia-linen/60 via-transparent to-transparent" />
        <div className="relative z-10 mx-auto max-w-3xl">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-hestia-gold">{t('tagline')}</p>
          <h1 className="mt-6 text-4xl font-light leading-tight text-hestia-navy sm:text-5xl md:text-6xl">{t('landing.headline')}</h1>
          <p className="mx-auto mt-6 max-w-xl text-base text-gray-600 sm:text-lg">{t('landing.subheadline')}</p>
          <div className="mt-10 flex flex-col justify-center gap-4 sm:flex-row">
            <Link to="/admin/login" className="btn-primary">{t('landing.staffLogin')}</Link>
          </div>
        </div>
      </section>

      <section className="bg-white px-4 py-16 sm:px-6 sm:py-20">
        <div className="mx-auto max-w-6xl">
          <h2 className="text-center text-2xl font-light text-hestia-navy sm:text-3xl">{t('landing.featuresTitle')}</h2>
          <div className="mt-10 grid gap-6 sm:mt-12 sm:gap-8 md:grid-cols-3">
            {['qrOrdering', 'staffDashboard', 'payment'].map((key) => (
              <div key={key} className="card-luxe p-6 text-center sm:p-8">
                <h3 className="font-serif text-lg text-hestia-navy sm:text-xl">{t(`landing.feature.${key}.title`)}</h3>
                <p className="mt-3 text-sm leading-relaxed text-gray-600">{t(`landing.feature.${key}.desc`)}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="px-4 py-16 text-center sm:px-6 sm:py-20">
        <div className="mx-auto max-w-3xl">
          <h2 className="text-2xl font-light text-hestia-navy sm:text-3xl">{t('landing.pricingTitle')}</h2>
          <p className="mt-4 text-sm text-gray-600 sm:text-base">{t('landing.pricingDesc')}</p>
          <div className="mt-10 inline-block rounded-3xl border border-hestia-gold bg-white p-6 shadow-soft sm:p-10">
            <p className="text-sm font-semibold uppercase tracking-wider text-gray-400">{t('landing.plan')}</p>
            <p className="mt-4 text-4xl font-light text-hestia-navy sm:text-5xl">{t('landing.price')}</p>
            <p className="mt-2 text-sm text-gray-500">{t('landing.perMonth')}</p>
            <ul className="mt-6 space-y-2 text-left text-sm text-gray-600">
              {['rooms', 'orders', 'support'].map((key) => (
                <li key={key} className="flex items-center gap-2">
                  <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  {t(`landing.includes.${key}`)}
                </li>
              ))}
            </ul>
            <Link to="/admin/login" className="btn-primary mt-8 block">{t('landing.start')}</Link>
          </div>
        </div>
      </section>

      <section className="px-4 py-16 bg-white sm:px-6 sm:py-20">
        <div className="mx-auto max-w-4xl">
          <div className="text-center mb-12">
            <h2 className="text-2xl font-light text-hestia-navy sm:text-3xl">Contactez-nous</h2>
            <p className="mt-4 text-sm text-gray-600 sm:text-base">Une question ? Une demande de démonstration ? Nous sommes là pour vous aider.</p>
          </div>
          
          <div className="card-luxe p-8">
            <form onSubmit={handleContactSubmit} className="space-y-6">
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                <div>
                  <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-gray-500">Nom *</label>
                  <input
                    type="text"
                    value={contactForm.name}
                    onChange={(e) => setContactForm({ ...contactForm, name: e.target.value })}
                    placeholder="Votre nom"
                    className="input-luxe w-full"
                    required
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-gray-500">Email *</label>
                  <input
                    type="email"
                    value={contactForm.email}
                    onChange={(e) => setContactForm({ ...contactForm, email: e.target.value })}
                    placeholder="votre@email.com"
                    className="input-luxe w-full"
                    required
                  />
                </div>
              </div>
              
              <div>
                <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-gray-500">Téléphone (optionnel)</label>
                <input
                  type="tel"
                  value={contactForm.phone}
                  onChange={(e) => setContactForm({ ...contactForm, phone: e.target.value })}
                  placeholder="+XXX XXX XXX XXX"
                  className="input-luxe w-full"
                />
              </div>
              
              <div>
                <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-gray-500">Message *</label>
                <textarea
                  value={contactForm.message}
                  onChange={(e) => setContactForm({ ...contactForm, message: e.target.value })}
                  placeholder="Votre message..."
                  rows="5"
                  className="input-luxe w-full resize-none"
                  required
                />
              </div>
              
              <button
                type="submit"
                disabled={sending}
                className="btn-primary w-full md:w-auto"
              >
                {sending ? 'Envoi...' : 'Envoyer le message'}
              </button>
            </form>
          </div>
        </div>
      </section>

      <footer className="border-t border-hestia-linen bg-hestia-navy px-6 py-10 text-center text-sm text-white/60">
        <p>{t('landing.footer')}</p>
        <p className="mt-2 text-xs text-white/40">
          Animated icons by <a href="https://lordicon.com/" target="_blank" rel="noopener noreferrer" className="underline hover:text-white/60">Lordicon.com</a>
        </p>
      </footer>
    </div>
  )
}
