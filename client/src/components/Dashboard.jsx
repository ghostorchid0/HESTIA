import { useEffect, useState, useCallback } from 'react'
import api from '../api'
import { useToast } from '../contexts/ToastContext'
import { formatCurrency } from '../utils/format'

export default function Dashboard() {
  const toast = useToast()
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)

  const fetchStats = useCallback(async () => {
    try {
      const res = await api.get('/admin/dashboard-stats')
      setStats(res.data)
    } catch (error) {
      toast.error('Erreur lors du chargement des statistiques')
      console.error('Failed to fetch dashboard stats:', error)
    } finally {
      setLoading(false)
    }
  }, [toast])

  useEffect(() => {
    fetchStats()
  }, [fetchStats])

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="text-lg text-gray-500">Chargement...</div>
      </div>
    )
  }

  if (!stats) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="text-lg text-gray-500">Impossible de charger les statistiques</div>
      </div>
    )
  }

  const today = new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })
  const todayCapitalized = today.charAt(0).toUpperCase() + today.slice(1)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-serif text-hestia-navy">Tableau de bord</h1>
        <p className="text-sm text-gray-500 mt-1">{todayCapitalized}</p>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
        {/* Today's Orders */}
        <div className="card-luxe p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Commandes du jour</p>
              <p className="text-3xl font-bold text-hestia-navy mt-2">{stats.today.orderCount}</p>
            </div>
            <div className="rounded-full bg-hestia-gold/20 p-3">
              <span className="text-2xl">📦</span>
            </div>
          </div>
          <p className="text-sm text-gray-500 mt-3">
            {formatCurrency(stats.today.revenue)}
          </p>
        </div>

        {/* Active Rooms */}
        <div className="card-luxe p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Chambres actives</p>
              <p className="text-3xl font-bold text-hestia-navy mt-2">{stats.rooms.active}</p>
            </div>
            <div className="rounded-full bg-green-100 p-3">
              <span className="text-2xl">🏨</span>
            </div>
          </div>
          <p className="text-sm text-gray-500 mt-3">
            {stats.rooms.total} chambres au total
          </p>
        </div>

        {/* Subscription Status */}
        <div className="card-luxe p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Abonnement</p>
              <p className={`text-lg font-bold mt-2 ${stats.subscription.status === 'active' ? 'text-green-600' : 'text-red-600'}`}>
                {stats.subscription.status === 'active' ? 'Actif' : 'Inactif'}
              </p>
            </div>
            <div className={`rounded-full p-3 ${stats.subscription.status === 'active' ? 'bg-green-100' : 'bg-red-100'}`}>
              <span className="text-2xl">{stats.subscription.status === 'active' ? '✓' : '✕'}</span>
            </div>
          </div>
          <p className="text-sm text-gray-500 mt-3">
            {stats.subscription.daysRemaining > 0
              ? `${stats.subscription.daysRemaining} jours restants`
              : 'Expiré'}
          </p>
        </div>

        {/* Total Revenue */}
        <div className="card-luxe p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Chiffre d&apos;affaires (7j)</p>
              <p className="text-3xl font-bold text-hestia-navy mt-2">
                {formatCurrency(stats.last7Days.reduce((sum, day) => sum + (day.count * 5000), 0))}
              </p>
            </div>
            <div className="rounded-full bg-blue-100 p-3">
              <span className="text-2xl">💰</span>
            </div>
          </div>
          <p className="text-sm text-gray-500 mt-3">
            {stats.last7Days.reduce((sum, day) => sum + day.count, 0)} commandes
          </p>
        </div>
      </div>

      {/* Orders Chart */}
      <div className="card-luxe p-6">
        <h2 className="text-xl font-serif text-hestia-navy mb-4">Commandes des 7 derniers jours</h2>
        <div className="h-64 flex items-end justify-between gap-2">
          {stats.last7Days.map((day) => {
            const maxCount = Math.max(...stats.last7Days.map(d => d.count), 1)
            const heightPercent = (day.count / maxCount) * 100
            const date = new Date(day.date)
            const dayName = date.toLocaleDateString('fr-FR', { weekday: 'short' })

            return (
              <div key={day.date} className="flex-1 flex flex-col items-center">
                <div className="w-full bg-hestia-cream rounded-t-lg relative" style={{ height: `${Math.max(heightPercent, 5)}%` }}>
                  <div className="absolute -top-6 left-1/2 transform -translate-x-1/2 text-xs font-medium text-hestia-navy">
                    {day.count}
                  </div>
                </div>
                <p className="text-xs text-gray-500 mt-2 capitalize">{dayName}</p>
              </div>
            )
          })}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="card-luxe p-6">
        <h2 className="text-xl font-serif text-hestia-navy mb-4">Actions rapides</h2>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <button className="btn-primary text-center">
            Nouvelle commande
          </button>
          <button className="btn-outline text-center">
            Voir toutes les commandes
          </button>
          <button className="btn-outline text-center">
            Gérer les chambres
          </button>
        </div>
      </div>
    </div>
  )
}
