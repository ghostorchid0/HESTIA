import { useState, useEffect } from 'react'
import api from '../api'
import Icon from './Icon'

export default function PaymentPanel() {
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState(null)
  const [subscriptionStatus, setSubscriptionStatus] = useState(null)
  const [isAdmin, setIsAdmin] = useState(false)
  const [hotels, setHotels] = useState([])
  const [selectedHotel, setSelectedHotel] = useState('')
  const [paymentReference, setPaymentReference] = useState('')
  const [paymentHistory, setPaymentHistory] = useState([])
  const [showFAQ, setShowFAQ] = useState(null)

  useEffect(() => {
    const role = localStorage.getItem('hestia_role')
    setIsAdmin(role === 'superadmin')
    
    if (role === 'superadmin') {
      api.get('/admin/hotels').then(res => setHotels(res.data)).catch(() => {})
    }
    
    checkSubscriptionStatus()
    fetchPaymentHistory()
  }, [])

  const fetchPaymentHistory = async () => {
    try {
      const response = await api.get('/payments/subscriptions')
      setPaymentHistory(response.data || [])
    } catch (error) {
      console.error('Failed to fetch payment history:', error)
    }
  }

  const handlePayment = () => {
    const paymentLink = 'https://link.saspay.me/yqeedvzzbnk'
    
    window.open(paymentLink, '_blank')
    setMessage({
      type: 'info',
      text: 'Redirection vers le lien de paiement SasPay. Une fois le paiement effectué, entrez votre référence de paiement ci-dessous pour activer automatiquement votre abonnement.'
    })
  }

  const handleVerifyPayment = async (e) => {
    e.preventDefault()
    if (!paymentReference.trim()) {
      setMessage({
        type: 'error',
        text: 'Veuillez entrer votre référence de paiement'
      })
      return
    }

    setLoading(true)
    setMessage(null)

    try {
      const response = await api.post('/payments/verify-reference', {
        reference: paymentReference.trim(),
        hotelId: localStorage.getItem('hestia_hotel')
      })

      if (response.data.success) {
        setMessage({
          type: 'success',
          text: 'Paiement vérifié avec succès ! Votre abonnement est maintenant actif.'
        })
        setPaymentReference('')
        checkSubscriptionStatus()
        fetchPaymentHistory()
      } else {
        setMessage({
          type: 'error',
          text: response.data.message || 'La référence de paiement n\'a pas été trouvée ou n\'est pas encore payée.'
        })
      }
    } catch (error) {
      setMessage({
        type: 'error',
        text: error.response?.data?.message || 'Erreur lors de la vérification de la référence'
      })
    } finally {
      setLoading(false)
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
      
      checkSubscriptionStatus()
      fetchPaymentHistory()
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

  const daysRemaining = subscriptionStatus?.expiresAt 
    ? Math.ceil((new Date(subscriptionStatus.expiresAt) - new Date()) / (1000 * 60 * 60 * 24))
    : null

  const progressPercentage = subscriptionStatus?.expiresAt 
    ? Math.min(100, Math.max(0, (30 - daysRemaining) / 30 * 100))
    : 0

  const faqItems = [
    {
      question: 'Comment payer mon abonnement ?',
      answer: 'Cliquez sur "Payer via le lien" pour accéder au lien SasPay sécurisé. Choisissez votre opérateur mobile money (Moov, MTN, Orange, Wave) et effectuez le paiement de 50.000 FCFA.'
    },
    {
      question: 'Comment trouver ma référence de paiement ?',
      answer: 'Après le paiement, vous recevrez un SMS avec votre référence. Vous pouvez aussi la trouver dans votre historique de transactions SasPay.'
    },
    {
      question: 'Mon paiement n\'est pas encore actif, que faire ?',
      answer: 'Attendez quelques minutes puis entrez votre référence dans le champ "Vérifier votre paiement". Si le problème persiste, contactez notre support.'
    },
    {
      question: 'Puis-je payer par carte bancaire ?',
      answer: 'Actuellement, nous acceptons uniquement les paiements mobile money via SasPay. Le paiement par carte bancaire sera disponible prochainement.'
    },
    {
      question: 'Que se passe-t-il si je ne paie pas à temps ?',
      answer: 'Votre abonnement sera suspendu et vous ne pourrez plus accéder aux fonctionnalités premium. Vous pouvez renouveler à tout moment pour réactiver votre compte.'
    }
  ]

  return (
    <div className="space-y-6">
      {/* Subscription Status Card */}
      <div className="card-luxe p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className={`p-3 rounded-xl ${subscriptionStatus?.active ? 'bg-green-100' : 'bg-yellow-100'}`}>
              <Icon name={subscriptionStatus?.active ? 'check' : 'warning'} size={24} color={subscriptionStatus?.active ? '#16A34A' : '#D97706'} />
            </div>
            <div>
              <h2 className="text-xl font-bold text-hestia-dark">Abonnement Hestia</h2>
              <p className="text-sm text-gray-600">50.000 FCFA/mois - Tout inclus</p>
            </div>
          </div>
          {daysRemaining !== null && (
            <div className="text-right">
              <div className={`text-2xl font-bold ${daysRemaining > 7 ? 'text-green-600' : daysRemaining > 3 ? 'text-yellow-600' : 'text-red-600'}`}>
                {daysRemaining}j
              </div>
              <div className="text-xs text-gray-500">restants</div>
            </div>
          )}
        </div>

        {subscriptionStatus && (
          <div className="space-y-3">
            <div className={`p-4 rounded-xl ${
              subscriptionStatus.active ? 'bg-green-50 border border-green-200' : 'bg-yellow-50 border border-yellow-200'
            }`}>
              <div className="flex items-center justify-between">
                <div>
                  <p className={`font-semibold ${subscriptionStatus.active ? 'text-green-800' : 'text-yellow-800'}`}>
                    {subscriptionStatus.active ? 'Abonnement actif' : 'Abonnement inactif'}
                  </p>
                  {subscriptionStatus.expiresAt && (
                    <p className="text-sm mt-1 text-gray-600">
                      Expire le {new Date(subscriptionStatus.expiresAt).toLocaleDateString('fr-FR')}
                    </p>
                  )}
                </div>
                <Icon name={subscriptionStatus.active ? 'check' : 'warning'} size={24} color={subscriptionStatus.active ? '#16A34A' : '#D97706'} />
              </div>
            </div>

            {daysRemaining !== null && daysRemaining > 0 && (
              <div className="space-y-2">
                <div className="flex justify-between text-xs text-gray-600">
                  <span>Progression</span>
                  <span>{Math.round(progressPercentage)}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className={`h-2 rounded-full transition-all duration-500 ${
                      daysRemaining > 7 ? 'bg-green-500' : daysRemaining > 3 ? 'bg-yellow-500' : 'bg-red-500'
                    }`}
                    style={{ width: `${progressPercentage}%` }}
                  />
                </div>
              </div>
            )}
          </div>
        )}

        {message && (
          <div className={`mt-4 p-4 rounded-xl ${
            message.type === 'success' ? 'bg-green-100 text-green-800 border border-green-200' : 
            message.type === 'info' ? 'bg-blue-100 text-blue-800 border border-blue-200' :
            'bg-red-100 text-red-800 border border-red-200'
          }`}>
            <div className="flex items-start gap-2">
              <Icon name={message.type === 'success' ? 'check' : message.type === 'info' ? 'info' : 'warning'} size={20} />
              <p className="text-sm">{message.text}</p>
            </div>
          </div>
        )}
      </div>

      {/* Payment Methods */}
      <div className="card-luxe p-6">
        <h3 className="text-lg font-semibold text-hestia-dark mb-4 flex items-center gap-2">
          <Icon name="payment" size={20} />
          Méthodes de paiement acceptées
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { name: 'Moov Money', color: 'bg-blue-100 text-blue-800' },
            { name: 'MTN MoMo', color: 'bg-yellow-100 text-yellow-800' },
            { name: 'Orange Money', color: 'bg-orange-100 text-orange-800' },
            { name: 'Wave', color: 'bg-cyan-100 text-cyan-800' }
          ].map((method, index) => (
            <div key={index} className={`p-3 rounded-xl text-center text-sm font-medium ${method.color}`}>
              {method.name}
            </div>
          ))}
        </div>
        <p className="mt-3 text-xs text-gray-500 text-center">
          Paiement sécurisé via SasPay - Processing instantané
        </p>
      </div>

      {/* Payment Process */}
      <div className="card-luxe p-6">
        <h3 className="text-lg font-semibold text-hestia-dark mb-4 flex items-center gap-2">
          <Icon name="info" size={20} />
          Comment payer ?
        </h3>
        <div className="space-y-4">
          {[
            {
              step: 1,
              title: 'Cliquez sur le bouton de paiement',
              description: 'Accédez au lien de paiement sécurisé SasPay'
            },
            {
              step: 2,
              title: 'Choisissez votre opérateur',
              description: 'Sélectionnez Moov, MTN, Orange ou Wave'
            },
            {
              step: 3,
              title: 'Effectuez le paiement',
              description: 'Confirmez le paiement de 50.000 FCFA'
            },
            {
              step: 4,
              title: 'Entrez votre référence',
              description: 'Copiez la référence et activez votre abonnement'
            }
          ].map((item) => (
            <div key={item.step} className="flex items-start gap-4">
              <div className="flex-shrink-0 w-8 h-8 bg-hestia-navy text-white rounded-full flex items-center justify-center font-bold text-sm">
                {item.step}
              </div>
              <div>
                <h4 className="font-medium text-hestia-dark">{item.title}</h4>
                <p className="text-sm text-gray-600">{item.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Payment Link */}
      <div className="card-luxe p-6">
        <h3 className="text-lg font-semibold text-hestia-dark mb-4">Lien de paiement SasPay</h3>
        <div className="bg-hestia-cream p-4 rounded-xl mb-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-hestia-dark">Lien permanent</p>
              <p className="text-xs text-gray-500 break-all mt-1">https://link.saspay.me/yqeedvzzbnk</p>
            </div>
            <button
              onClick={() => navigator.clipboard.writeText('https://link.saspay.me/yqeedvzzbnk')}
              className="text-hestia-gold hover:text-hestia-gold-dark transition"
            >
              <Icon name="copy" size={20} />
            </button>
          </div>
        </div>
        
        <button
          onClick={handlePayment}
          disabled={loading}
          className="btn-primary w-full flex items-center justify-center gap-2"
        >
          <Icon name="payment" size={20} />
          {loading ? 'Chargement...' : 'Payer via le lien'}
        </button>
      </div>

      {/* Verify Payment */}
      <div className="card-luxe p-6">
        <h3 className="text-lg font-semibold text-hestia-dark mb-4 flex items-center gap-2">
          <Icon name="check" size={20} />
          Vérifier votre paiement
        </h3>
        <p className="text-sm text-gray-600 mb-4">
          Après avoir payé via le lien SasPay, entrez votre référence de paiement pour activer automatiquement votre abonnement.
        </p>
        <form onSubmit={handleVerifyPayment} className="space-y-3">
          <input
            type="text"
            value={paymentReference}
            onChange={(e) => setPaymentReference(e.target.value)}
            placeholder="Référence de paiement (ex: SAS-123456789)"
            className="input-luxe w-full"
            required
          />
          <button
            type="submit"
            disabled={loading}
            className="btn-luxe w-full flex items-center justify-center gap-2"
          >
            {loading ? 'Vérification...' : 'Vérifier et activer'}
          </button>
        </form>
      </div>

      {/* Superadmin Activation */}
      {isAdmin && (
        <div className="card-luxe p-6">
          <h3 className="text-lg font-semibold text-hestia-dark mb-4 flex items-center gap-2">
            <Icon name="settings" size={20} />
            Activation Superadmin
          </h3>
          <p className="text-sm text-gray-600 mb-4">
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
              className="btn-luxe w-full flex items-center justify-center gap-2"
            >
              {loading ? 'Activation...' : 'Activer l\'abonnement (30 jours)'}
            </button>
          </div>
        </div>
      )}

      {/* Payment History */}
      {paymentHistory.length > 0 && (
        <div className="card-luxe p-6">
          <h3 className="text-lg font-semibold text-hestia-dark mb-4 flex items-center gap-2">
            <Icon name="order" size={20} />
            Historique des paiements
          </h3>
          <div className="space-y-3">
            {paymentHistory.slice(0, 5).map((payment, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-hestia-cream rounded-xl">
                <div>
                  <p className="font-medium text-hestia-dark">{payment.amount?.toLocaleString()} FCFA</p>
                  <p className="text-xs text-gray-500">
                    {payment.date ? new Date(payment.date).toLocaleDateString('fr-FR') : 'N/A'}
                  </p>
                </div>
                <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                  payment.status === 'success' ? 'bg-green-100 text-green-800' :
                  payment.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                  'bg-red-100 text-red-800'
                }`}>
                  {payment.status === 'success' ? 'Payé' : payment.status === 'pending' ? 'En attente' : 'Échoué'}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* FAQ */}
      <div className="card-luxe p-6">
        <h3 className="text-lg font-semibold text-hestia-dark mb-4 flex items-center gap-2">
          <Icon name="info" size={20} />
          Questions fréquentes
        </h3>
        <div className="space-y-2">
          {faqItems.map((item, index) => (
            <div key={index} className="border border-hestia-linen rounded-xl overflow-hidden">
              <button
                onClick={() => setShowFAQ(showFAQ === index ? null : index)}
                className="w-full flex items-center justify-between p-4 text-left hover:bg-hestia-cream transition"
              >
                <span className="font-medium text-hestia-dark">{item.question}</span>
                <Icon name={showFAQ === index ? 'close' : 'add'} size={20} />
              </button>
              {showFAQ === index && (
                <div className="px-4 pb-4 text-sm text-gray-600">
                  {item.answer}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Benefits */}
      <div className="card-luxe p-6">
        <h3 className="text-lg font-semibold text-hestia-dark mb-4">Avantages de l&apos;abonnement</h3>
        <ul className="space-y-3">
          {[
            'QR codes illimités pour vos chambres',
            'Menu digital avec photos',
            'Notifications sonores en temps réel',
            'Gestion des commandes et du staff',
            'Support technique 7j/7',
            'Sans engagement, résiliable à tout moment'
          ].map((item, index) => (
            <li key={index} className="flex items-start gap-3">
              <div className="flex-shrink-0 w-5 h-5 bg-green-100 rounded-full flex items-center justify-center mt-0.5">
                <Icon name="check" size={14} color="#16A34A" />
              </div>
              <span className="text-sm text-gray-700">{item}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* Security & Trust */}
      <div className="card-luxe p-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
          <div className="flex flex-col items-center">
            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mb-2">
              <Icon name="check" size={24} color="#16A34A" />
            </div>
            <p className="text-sm font-medium text-hestia-dark">Paiement sécurisé</p>
            <p className="text-xs text-gray-500">SSL & SasPay</p>
          </div>
          <div className="flex flex-col items-center">
            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mb-2">
              <Icon name="info" size={24} color="#2563EB" />
            </div>
            <p className="text-sm font-medium text-hestia-dark">Support 7j/7</p>
            <p className="text-xs text-gray-500">WhatsApp & Email</p>
          </div>
          <div className="flex flex-col items-center">
            <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mb-2">
              <Icon name="check" size={24} color="#9333EA" />
            </div>
            <p className="text-sm font-medium text-hestia-dark">Sans engagement</p>
            <p className="text-xs text-gray-500">Résiliable à tout moment</p>
          </div>
        </div>
      </div>
    </div>
  )
}
