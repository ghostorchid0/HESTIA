import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import api from '../api'

export default function ReviewsPanel() {
  const { t } = useTranslation()
  const [reviews, setReviews] = useState([])

  useEffect(() => {
    api.get('/reviews/admin/reviews').then(res => setReviews(res.data)).catch(() => {})
  }, [])

  const avg = reviews.length ? (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(1) : 0

  return (
    <div>
      <h1 className="mb-2 text-3xl font-light text-hestia-navy">{t('reviewsPanel.title')}</h1>
      <p className="mb-8 text-sm text-gray-500">{t('reviewsPanel.average')}: <span className="font-serif text-2xl text-hestia-gold">{avg}</span> / 5</p>
      <div className="space-y-4">
        {reviews.map(r => (
          <div key={r._id} className="card-luxe p-6">
            <div className="flex items-center justify-between">
              <p className="font-semibold text-hestia-navy">{t('room')} {r.roomNumber}</p>
              <div className="flex gap-1">{Array.from({ length: 5 }).map((_, i) => (
                <span key={i} className={`text-sm ${i < r.rating ? 'text-hestia-gold' : 'text-gray-300'}`}>★</span>
              ))}</div>
            </div>
            <p className="mt-2 text-sm text-gray-600">{r.comment || t('reviewsPanel.noComment')}</p>
            <p className="mt-2 text-xs text-gray-400">{new Date(r.createdAt).toLocaleString()}</p>
          </div>
        ))}
        {reviews.length === 0 && <p className="text-gray-400">{t('reviewsPanel.empty')}</p>}
      </div>
    </div>
  )
}
