import { useState } from 'react'

export default function PaymentPanel() {
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState(null)

  const handlePayment = () => {
    // Rediriger vers le dashboard SasPay pour créer un lien de paiement
    // L'utilisateur peut créer un lien de paiement manuellement pour la demo
    window.open('https://app.saspay.me/dashboard', '_blank')
    setMessage({
      type: 'info',
      text: 'Redirection vers SasPay pour créer un lien de paiement. Une fois le paiement effectué, votre abonnement sera activé automatiquement.'
    })
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
            <h3 className="font-semibold text-hestia-dark mb-2">Pour activer votre abonnement :</h3>
            <ol className="list-decimal list-inside space-y-2 text-sm text-gray-700">
              <li>Cliquez sur le bouton "Payer via SasPay"</li>
              <li>Connectez-vous à votre compte SasPay</li>
              <li>Créez un lien de paiement de 50.000 FCFA</li>
              <li>Partagez le lien avec votre client ou payez directement</li>
              <li>Une fois le paiement validé, contactez-nous pour activer votre compte</li>
            </ol>
          </div>

          <button
            onClick={handlePayment}
            disabled={loading}
            className="btn-primary w-full"
          >
            {loading ? 'Chargement...' : 'Payer via SasPay'}
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