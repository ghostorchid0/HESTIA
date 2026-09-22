import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import api from '../api'

export default function PaymentPanel() {
  const { t } = useTranslation()
  const [formData, setFormData] = useState({
    hotelId: '',
    amount: 30000,
    customerMobile: '',
    description: ''
  })
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState(null)
  const [subscriptions, setSubscriptions] = useState([])

  const handleInitiatePayment = async (e) => {
    e.preventDefault()
    setLoading(true)
    setMessage(null)

    try {
      const response = await api.post('/payments/initiate', {
        ...formData,
        hotelId: formData.hotelId || localStorage.getItem('hestia_hotel')
      })

      setMessage({
        type: 'success',
        text: response.data.message || 'Payment initiated successfully'
      })

      // Refresh subscriptions
      fetchSubscriptions()

      // Reset form
      setFormData({
        ...formData,
        customerMobile: ''
      })
    } catch (error) {
      setMessage({
        type: 'error',
        text: error.response?.data?.message || 'Failed to initiate payment'
      })
    } finally {
      setLoading(false)
    }
  }

  const fetchSubscriptions = async () => {
    try {
      const response = await api.get('/payments/subscriptions')
      setSubscriptions(response.data)
    } catch (error) {
      console.error('Failed to fetch subscriptions:', error)
    }
  }

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'KES'
    }).format(amount)
  }

  const formatDate = (dateString) => {
    if (!dateString) return '-'
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  return (
    <div className="space-y-6">
      <div className="card-luxe p-6">
        <h2 className="text-2xl font-bold text-hestia-dark mb-6">Payer l'abonnement</h2>

        {message && (
          <div className={`p-4 rounded-lg mb-4 ${
            message.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
          }`}>
            {message.text}
          </div>
        )}

        <form onSubmit={handleInitiatePayment} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-hestia-dark mb-2">
              Numéro de téléphone (SasaPay)
            </label>
            <input
              type="tel"
              value={formData.customerMobile}
              onChange={(e) => setFormData({ ...formData, customerMobile: e.target.value })}
              placeholder="2547XXXXXXXX"
              className="input-luxe w-full"
              required
            />
            <p className="text-xs text-gray-500 mt-1">
              Format: 2547XXXXXXXX (Kenyen)
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-hestia-dark mb-2">
              Montant (KES)
            </label>
            <input
              type="number"
              value={formData.amount}
              onChange={(e) => setFormData({ ...formData, amount: parseInt(e.target.value) })}
              className="input-luxe w-full"
              min="100"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-hestia-dark mb-2">
              Description (optionnel)
            </label>
            <input
              type="text"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Abonnement mensuel Hestia"
              className="input-luxe w-full"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="btn-luxe w-full"
          >
            {loading ? 'Traitement en cours...' : 'Initier le paiement'}
          </button>
        </form>
      </div>

      <div className="card-luxe p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-hestia-dark">Historique des paiements</h2>
          <button
            onClick={fetchSubscriptions}
            className="text-sm text-hestia-gold hover:underline"
          >
            Actualiser
          </button>
        </div>

        {subscriptions.length === 0 ? (
          <p className="text-gray-500 text-center py-8">Aucun paiement trouvé</p>
        ) : (
          <div className="space-y-4">
            {subscriptions.map((sub) => (
              <div key={sub._id} className="border border-gray-200 rounded-lg p-4">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <p className="font-semibold text-hestia-dark">
                      {formatCurrency(sub.amount)}
                    </p>
                    <p className="text-sm text-gray-500">
                      Réf: {sub.transactionRef}
                    </p>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                    sub.status === 'active' ? 'bg-green-100 text-green-800' :
                    sub.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-red-100 text-red-800'
                  }`}>
                    {sub.status}
                  </span>
                </div>
                <div className="text-sm text-gray-500 space-y-1">
                  <p>Créé le: {formatDate(sub.createdAt)}</p>
                  {sub.paidAt && <p>Payé le: {formatDate(sub.paidAt)}</p>}
                  {sub.expiresAt && <p>Expire le: {formatDate(sub.expiresAt)}</p>}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}