import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import api from '../api'
import { socket } from '../socket'
import useSettings from '../hooks/useSettings'
import { formatCurrency } from '../utils/format'
import ImageWithFallback from '../components/ImageWithFallback'

export default function OrderStatusPage() {
  const { t } = useTranslation()
  const { settings } = useSettings()
  const { uuid, orderId } = useParams()
  const [order, setOrder] = useState(null)
  const [error, setError] = useState(false)
  const [pushEnabled, setPushEnabled] = useState(false)
  const [review, setReview] = useState({ rating: 5, comment: '' })
  const [reviewSent, setReviewSent] = useState(false)

  const statusSteps = ['Received', 'Preparing', 'On the way', 'Delivered']

  useEffect(() => {
    api.get(`/orders/${orderId}?roomUuid=${uuid}`)
      .then(res => setOrder(res.data))
      .catch(() => setError(true))

    socket.emit('join_room_channel', uuid)
    const handler = (updated) => {
      if (updated._id === orderId) setOrder(updated)
    }
    socket.on('order_status_updated', handler)
    return () => {
      socket.off('order_status_updated', handler)
      socket.emit('leave_room_channel', uuid)
    }
  }, [uuid, orderId])

  const submitReview = async (e) => {
    e.preventDefault()
    try {
      await api.post('/reviews', { orderId, roomUuid: uuid, rating: review.rating, comment: review.comment })
      setReviewSent(true)
    } catch (err) {
      console.error(err)
    }
  }

  const subscribePush = async () => {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
      alert('Push notifications are not supported on this device.')
      return
    }
    try {
      const permission = await Notification.requestPermission()
      if (permission !== 'granted') return

      const reg = await navigator.serviceWorker.ready
      const { data } = await api.get('/push/vapid-public-key')
      const subscription = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: data.publicKey,
      })
      await api.post('/push/subscribe', { roomUuid: uuid, subscription })
      setPushEnabled(true)
    } catch (err) {
      console.error('Push subscription failed:', err)
    }
  }

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-hestia-cream p-6">
        <div className="card-luxe w-full max-w-md p-10 text-center">
          <h1 className="text-3xl text-hestia-navy">{t('orderStatus.title')}</h1>
          <Link to={`/room/${uuid}/menu`} className="btn-outline mt-6 inline-block">{t('orderStatus.orderMore')}</Link>
        </div>
      </div>
    )
  }

  if (!order) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-hestia-cream">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-hestia-linen border-t-hestia-gold" />
      </div>
    )
  }

  if (order.status === 'Cancelled') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-hestia-cream p-6">
        <div className="card-luxe w-full max-w-md p-10 text-center">
          <h1 className="text-3xl text-red-800">{t('orderStatus.cancelledTitle')}</h1>
          <p className="mt-3 text-gray-600">{t('orderStatus.cancelledDesc')}</p>
          <Link to={`/room/${uuid}/menu`} className="btn-primary mt-8 inline-block">{t('orderStatus.orderAgain')}</Link>
        </div>
      </div>
    )
  }

  const currentStep = statusSteps.indexOf(order.status)

  return (
    <div className="min-h-screen bg-hestia-cream p-4 pt-10 sm:p-6 sm:pt-12">
      <div className="mx-auto max-w-xl">
        <div className="text-center">
          {settings?.logoUrl && (
            <ImageWithFallback src={settings.logoUrl} alt={settings.hotelName} className="mx-auto mb-2 h-16 w-16 rounded-2xl bg-hestia-cream object-contain p-2" />
          )}
          <p className="text-xs font-semibold uppercase tracking-[0.3em]" style={{ color: settings?.accentColor || '#C9A227' }}>{settings?.hotelName || t('appName')}</p>
          <p className="mt-1 text-sm text-gray-500">{t('room')} {order.roomNumber}</p>
          <h1 className="mt-2 text-3xl font-light text-hestia-navy sm:text-4xl">{t('orderStatus.title')}</h1>
        </div>

        <div className="card-luxe mt-8 p-6 sm:mt-10 sm:p-8">
          <div className="relative mt-4">
            <div className="absolute left-5 top-3 bottom-3 w-px bg-hestia-linen sm:left-6 sm:top-4 sm:bottom-4" />
            {statusSteps.map((step, idx) => (
              <div key={step} className="relative mb-6 flex items-center sm:mb-8">
                <div
                  className={`z-10 flex h-10 w-10 items-center justify-center rounded-full border-2 text-xs font-serif font-medium transition sm:h-12 sm:w-12 sm:text-sm ${
                    idx <= currentStep
                      ? 'border-hestia-gold bg-hestia-gold text-white'
                      : 'border-hestia-linen bg-white text-gray-400'
                  }`}
                >
                  {idx + 1}
                </div>
                <div className="ml-4 sm:ml-5">
                  <p className={`font-serif text-base sm:text-lg ${idx <= currentStep ? 'text-hestia-navy' : 'text-gray-400'}`}>
                    {t(`status.${step}`)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="card-luxe mt-6 p-6 sm:p-8">
          <h2 className="text-lg font-light text-hestia-navy sm:text-xl">{t('orderStatus.items')}</h2>
          <ul className="mt-4 space-y-3">
            {order.items.map((item, idx) => (
              <li key={idx} className="flex justify-between border-b border-hestia-linen pb-2 text-sm">
                <span className="text-gray-700">{item.quantity}x {item.name}</span>
                <span className="font-serif text-hestia-navy">{formatCurrency(item.price * item.quantity, settings?.currency)}</span>
              </li>
            ))}
          </ul>
          <p className="mt-6 text-right font-serif text-xl text-hestia-navy sm:text-2xl">
            {t('total')} <span className="text-hestia-gold">{formatCurrency(order.total, settings?.currency)}</span>
          </p>
        </div>

        {!pushEnabled && (
          <button
            onClick={subscribePush}
            className="btn-outline mt-6 w-full"
          >
            {t('orderStatus.notifyMe')}
          </button>
        )}

        {order.status === 'Delivered' && !reviewSent && (
          <form onSubmit={submitReview} className="card-luxe mt-6 p-6 sm:p-8">
            <h2 className="text-lg font-light text-hestia-navy sm:text-xl">{t('orderStatus.rateOrder')}</h2>
            <div className="mt-4 flex justify-center gap-2">
              {[1, 2, 3, 4, 5].map(star => (
                <button key={star} type="button" onClick={() => setReview({ ...review, rating: star })} className={`text-2xl ${star <= review.rating ? 'text-hestia-gold' : 'text-gray-300'}`}>
                  ★
                </button>
              ))}
            </div>
            <textarea
              value={review.comment}
              onChange={e => setReview({ ...review, comment: e.target.value })}
              placeholder={t('orderStatus.reviewPlaceholder')}
              className="input-luxe mt-4 h-24 w-full resize-none"
            />
            <button className="btn-primary mt-4 w-full">{t('orderStatus.submitReview')}</button>
          </form>
        )}
        {reviewSent && <p className="mt-6 text-center text-green-600">{t('orderStatus.reviewThanks')}</p>}

        <Link to={`/room/${uuid}/menu`} className="btn-primary mt-4 block w-full text-center">
          {t('orderStatus.orderMore')}
        </Link>
      </div>
    </div>
  )
}
