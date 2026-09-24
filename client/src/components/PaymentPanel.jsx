import { useState, useEffect } from 'react'
import api from '../api'

export default function PaymentPanel() {
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState(null)
  const [customLink, setCustomLink] = useState('')
  const [subscriptionStatus, setSubscriptionStatus] = useState(null)
  const [isAdmin, setIsAdmin] = useState(false)
  const [hotels, setHotels] = useState([])
  const [selectedHotel, setSelectedHotel] = useState('')

  useEffect(() => {
    const role = localStorage.getItem('hestia_role')
    setIsAdmin(role === 'superadmin')
    
    if (role === 'superadmin') {
      api.get('/admin/hotels').then(res => setHotels(res.data)).catch(() => {})
    }
    
    checkSubscriptionStatus()
  }, [])

  const handlePayment = () => {
    const paymentLink = customLink || 'https://app.saspay.me/dashboard'
    
    if (customLink) {
      window.open(customLink, '_blank')
      setMessage({
        type: 'success',
        text: 'Redirection vers le lien de paiement SasPay. Une fois le paiement effectué, contactez-nous pour activer votre abonnement.'
      })
    } else {
      window.open('https://app.saspay.me/dashboard', '_blank')
      setMessage({
        type: 'info',
        text: 'Redirection vers SasPay pour créer un lien de paiement. Une fois le paiement effectué, contactez-nous pour activer votre abonnement.'
      })
    }
  }

  const handleActivateSubscription = async () => {
    if (!selectedHotel) {
      setMessage({
        type: 'error',
        text: 'Veuillez sélectionner un hôtel'
      })
      return
    }

    setLoading(true)
    setMessage(null)

    try {
      const response = await api.post('/payments/activate', {
        hotelId: selectedHotel,
        days: 30
      })

      setMessage({
        type: 'success',
        text: `Abonnement activé avec succès pour ${response.data.expiresAt ? new Date(response.data.expiresAt).toLocaleDateString('fr-FR') : '30 jours'}`
      })
      
      // Refresh subscription status
      checkSubscriptionStatus()
    } catch (error) {
      setMessage({
        type: 'error',
        text: error.response?.data?.message || 'Erreur lors de l\'activation'
      })
    } finally {
      setLoading(false)
    }
  }

  const checkSubscriptionStatus = async () => {
    try {
      const response = await api.get('/payments/subscription-status')
      setSubscriptionStatus(response.data)
    } catch (error) {
      console.error('Failed to check subscription status:', error)
    }
  }

  return (
    <div className="space-y-6">
      <div className="card-luxe p-6">
        <h2 className="text-2xl font-bold text-hestia-dark mb-2">Abonnement Hestia</h2>
        <p className="text-sm text-gray-600 mb-6">50.000 FCFA/mois - Tout inclus, sans engagement</p>

        {subscriptionStatus && (
          <div className={`p-4 rounded-lg mb-4 ${
            subscriptionStatus.active ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
          }`}>
            <p className="font-semibold">
              {subscriptionStatus.active ? '✓ Abonnement actif' : '⚠ Abonnement inactif'}
            </p>
            {subscriptionStatus.expiresAt && (
              <p className="text-sm mt-1">
                Expire le: {new Date(subscriptionStatus.expiresAt).toLocaleDateString('fr-FR')}
              </p>
            )}
          </div>
        )}

        {message && (
          <div className={`p-4 rounded-lg mb-4 ${
            message.type === 'success' ? 'bg-green-100 text-green-800' : 
            message.type === 'info' ? 'bg-blue-100 text-blue-800' :
            'bg-red-100 text-red-800'
          }`}>
            {message.text}
          </div>
        )}

        <div className="space-y-4">
          <div className="bg-hestia-cream p-4 rounded-lg">
            <h3 className="font-semibold text-hestia-dark mb-2">Lien de paiement SasPay</h3>
            <p className="text-sm text-gray-600 mb-3">
              Entrez votre lien de paiement SasPay pour accéder au paiement direct.
            </p>
            <input
              type="url"
              value={customLink}
              onChange={(e) => setCustomLink(e.target.value)}
              placeholder="https://link.saspay.me/..."
              className="input-luxe w-full"
            />
          </div>

          <button
            onClick={handlePayment}
            disabled={loading}
            className="btn-primary w-full"
          >
            {loading ? 'Chargement...' : 'Payer via le lien'}
          </button>

          {isAdmin && (
            <div className="border-t border-gray-200 pt-4">
              <h3 className="font-semibold text-hestia-dark mb-2">Activation Superadmin</h3>
              <p className="text-sm text-gray-600 mb-3">
                Sélectionnez un hôtel et activez son abonnement après vérification du paiement.
              </p>
              <div className="space-y-3">
                <select
                  value={selectedHotel}
                  onChange={(e) => setSelectedHotel(e.target.value)}
                  className="input-luxe w-full"
                >
                  <option value="">Sélectionner un hôtel</option>
                  {hotels.map(h => (
                    <option key={h._id} value={h._id}>{h.name}</option>
                  ))}
                </select>
                <button
                  onClick={handleActivateSubscription}
                  disabled={loading || !selectedHotel}
                  className="btn-luxe w-full"
                >
                  {loading ? 'Activation...' : 'Activer l\'abonnement (30 jours)'}
                </button>
              </div>
            </div>
          )}

          <div className="bg-blue-50 p-4 rounded-lg">
            <h3 className="font-semibold text-hestia-dark mb-2">Pour activer votre abonnement</h3>
            <ol className="list-decimal list-inside space-y-2 text-sm text-gray-700">
              <li>Payer via le lien SasPay (50.000 FCFA)</li>
              <li>Contactez-nous avec la preuve de paiement</li>
              <li>Nous activerons votre abonnement manuellement</li>
              <li>Votre abonnement sera actif pour 30 jours</li>
            </ol>
          </div>

          <div className="text-center text-xs text-gray-500 mt-4">
            <p>Powered by SasPay - Paiement mobile money sécurisé</p>
            <p className="mt-1">Supporte : Moov Money, MTN MoMo, Orange Money, Wave, et plus</p>
          </div>
        </div>
      </div>

      <div className="card-luxe p-6">
        <h3 className="text-lg font-semibold text-hestia-dark mb-4">Avantages de l'abonnement</h3>
        <ul className="space-y-2 text-sm text-gray-700">
          <li className="flex items-start">
            <span className="text-green-500 mr-2">✓</span>
            <span>QR codes illimités pour vos chambres</span>
          </li>
          <li className="flex items-start">
            <span className="text-green-500 mr-2">✓</span>
            <span>Menu digital avec photos</span>
          </li>
          <li className="flex items-start">
            <span className="text-green-500 mr-2">✓</span>
            <span>Notifications sonores en temps réel</span>
          </li>
          <li className="flex items-start">
            <span className="text-green-500 mr-2">✓</span>
            <span>Gestion des commandes et du staff</span>
          </li>
          <li className="flex items-start">
            <span className="text-green-500 mr-2">✓</span>
            <span>Support technique 7j/7</span>
          </li>
          <li className="flex items-start">
            <span className="text-green-500 mr-2">✓</span>
            <span>Sans engagement, résiliable à tout moment</span>
          </li>
        </ul>
      </div>
    </div>
  )
}