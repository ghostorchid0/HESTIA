import { useState, useEffect } from 'react'
import api from '../api'

export default function PaymentPanel() {
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState(null)
  const [customLink, setCustomLink] = useState('')
  const [subscriptionStatus, setSubscriptionStatus] = useState(null)

  const handlePayment = () => {
    const paymentLink = customLink || 'https://app.saspay.me/dashboard'
    
    if (customLink) {
      window.open(customLink, '_blank')
      setMessage({
        type: 'success',
        text: 'Redirection vers le lien de paiement SasPay. Une fois le paiement effectué, votre abonnement sera activé après vérification.'
      })
    } else {
      window.open('https://app.saspay.me/dashboard', '_blank')
      setMessage({
        type: 'info',
        text: 'Redirection vers SasPay pour créer une session de checkout. Une fois le paiement effectué, votre abonnement sera activé après vérification.'
      })
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

  useEffect(() => {
    checkSubscriptionStatus()
  }, [])

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
              Utilisez ce lien pour créer une session de paiement sur le dashboard SasPay.
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
            {loading ? 'Chargement...' : 'Ouvrir SasPay Dashboard'}
          </button>

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