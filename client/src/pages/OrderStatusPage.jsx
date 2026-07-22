import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import api from '../api'
import { socket } from '../socket'
import useSettings from '../hooks/useSettings'

export default function OrderStatusPage() {
  const { t } = useTranslation()
  const { settings } = useSettings()
  const { uuid, orderId } = useParams()
  const [order, setOrder] = useState(null)
  const [error, setError] = useState(false)
  const [pushEnabled, setPushEnabled] = useState(false)

  const statusSteps = ['Received', 'Preparing', 'On the way', 'Delivered']

  useEffect(() => {
    api.get(`/orders/${orderId}?roomUuid=${uuid}`)
      .then(res => setOrder(res.data))
      .catch(() => setError(true))

    socket.emit('join_room_channel', uuid)
    socket.on('order_status_updated', (updated) => {
      if (updated._id === orderId) setOrder(updated)
    })
    return () => socket.off('order_status_updated')
  }, [uuid, orderId])

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
    <div className="min-h-screen bg-hestia-cream p-6 pt-12">
      <div className="mx-auto max-w-xl">
        <div className="text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-hestia-gold">{settings?.hotelName || t('appName')}</p>
          <p className="mt-1 text-sm text-gray-500">{t('room')} {order.roomNumber}</p>
          <h1 className="mt-2 text-4xl font-light text-hestia-navy">{t('orderStatus.title')}</h1>
        </div>

        <div className="card-luxe mt-10 p-8">
          <div className="relative mt-4">
            <div className="absolute left-6 top-4 bottom-4 w-px bg-hestia-linen" />
            {statusSteps.map((step, idx) => (
              <div key={step} className="relative mb-8 flex items-center">
                <div
                  className={`z-10 flex h-12 w-12 items-center justify-center rounded-full border-2 text-sm font-serif font-medium transition ${
                    idx <= currentStep
                      ? 'border-hestia-gold bg-hestia-gold text-white'
                      : 'border-hestia-linen bg-white text-gray-400'
                  }`}
                >
                  {idx + 1}
                </div>
                <div className="ml-5">
                  <p className={`font-serif text-lg ${idx <= currentStep ? 'text-hestia-navy' : 'text-gray-400'}`}>
                    {t(`status.${step}`)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="card-luxe mt-6 p-8">
          <h2 className="text-xl font-light text-hestia-navy">{t('orderStatus.items')}</h2>
          <ul className="mt-4 space-y-3">
            {order.items.map((item, idx) => (
              <li key={idx} className="flex justify-between border-b border-hestia-linen pb-2 text-sm">
                <span className="text-gray-700">{item.quantity}x {item.name}</span>
                <span className="font-serif text-hestia-navy">${(item.price * item.quantity).toFixed(2)}</span>
              </li>
            ))}
          </ul>
          <p className="mt-6 text-right font-serif text-2xl text-hestia-navy">
            {t('total')} <span className="text-hestia-gold">${order.total.toFixed(2)}</span>
          </p>
        </div>

        {!pushEnabled && (
          <button
            onClick={subscribePush}
            className="btn-outline mt-6 w-full"
          >
            Notify me of updates
          </button>
        )}

        <Link to={`/room/${uuid}/menu`} className="btn-primary mt-4 block w-full text-center">
          {t('orderStatus.orderMore')}
        </Link>
      </div>
    </div>
  )
}
