import { useState } from 'react'

export default function PaymentPanel() {
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState(null)
  const [customLink, setCustomLink] = useState('')

  const handlePayment = () => {
    // Utiliser le lien personnalisé si fourni, sinon rediriger vers le dashboard
    const paymentLink = customLink || 'https://app.saspay.me/dashboard'
    
    if (customLink) {
      // Si l'utilisateur a fourni un lien direct, l'ouvrir
      window.open(customLink, '_blank')
      setMessage({
        type: 'success',
        text: 'Redirection vers le lien de paiement SasPay. Une fois le paiement effectué, votre abonnement sera activé.'
      })
    } else {
      // Sinon rediriger vers le dashboard pour créer un lien
      window.open('https://app.saspay.me/dashboard', '_blank')
      setMessage({
        type: 'info',
        text: 'Redirection vers SasPay pour créer un lien de paiement. Une fois le paiement effectué, votre abonnement sera activé.'
      })
    }
  }

  return (
    <div className="space-y-6">
      <div className="card-luxe p-6">
        <h2 className="text-2xl font-bold text-hestia-dark mb-2">Abonnement Hestia</h2>
        <p className="text-sm text-gray-600 mb-6">50.000 FCFA/mois - Tout inclus, sans engagement</p>

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
            <h3 className="font-semibold text-hestia-dark mb-2">Lien de paiement SasPay (optionnel)</h3>
            <p className="text-sm text-gray-600 mb-3">
              Si vous avez déjà un lien de paiement SasPay, entrez-le ci-dessous. Sinon, cliquez sur le bouton pour créer un nouveau lien.
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
            {loading ? 'Chargement...' : customLink ? 'Payer via le lien' : 'Créer un lien de paiement'}
          </button>

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