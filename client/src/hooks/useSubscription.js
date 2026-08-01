import { useEffect, useState, useCallback } from 'react'
import api from '../api'

const defaultFeatures = {}

export default function useSubscription() {
  const [subscription, setSubscription] = useState(null)
  const [rooms, setRooms] = useState({ used: 0, max: 12 })
  const [features, setFeatures] = useState(defaultFeatures)
  const [loading, setLoading] = useState(true)

  const fetch = useCallback(async () => {
    try {
      const res = await api.get('/admin/subscription')
      setSubscription(res.data.subscription)
      setRooms(res.data.rooms)
      setFeatures(res.data.features)
    } catch (err) {
      console.error('subscription fetch error', err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetch() }, [fetch])

  const canAccessFeature = useCallback(
    (feature) => !!features[feature],
    [features]
  )

  const isRoomLimitReached = rooms.used >= rooms.max

  const upgrade = async (plan) => {
    const res = await api.patch('/admin/subscription/upgrade', { plan })
    setSubscription(res.data.subscription)
    setFeatures(res.data.features)
    return res.data
  }

  const plan = subscription?.plan || 'STARTER'
  const status = subscription?.status || 'TRIAL'
  const trialDaysLeft = subscription?.trialEndsAt
    ? Math.max(0, Math.ceil((new Date(subscription.trialEndsAt) - new Date()) / (1000 * 60 * 60 * 24)))
    : 0

  return {
    plan,
    status,
    trialDaysLeft,
    rooms,
    features,
    loading,
    isRoomLimitReached,
    canAccessFeature,
    upgrade,
    refresh: fetch,
  }
}
