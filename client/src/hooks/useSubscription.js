import { useEffect, useState, useCallback } from 'react'
import api from '../api'

const defaultFeatures = {}

export default function useSubscription() {
  const [subscription, setSubscription] = useState(null)
  const [rooms, setRooms] = useState({ used: 0, max: 9999 })
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
    (feature) => true, // All features available with single subscription
    []
  )

  const isRoomLimitReached = false // No room limit

  const plan = 'UNLIMITED' // Single plan
  const status = subscription?.status || 'active'
  const trialDaysLeft = 0 // No trial

  return {
    plan,
    status,
    trialDaysLeft,
    rooms,
    features,
    loading,
    isRoomLimitReached,
    canAccessFeature,
    refresh: fetch,
  }
}
