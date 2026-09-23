import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import api from '../api'

export default function PaymentPanel() {
  const { t } = useTranslation()
  const [formData, setFormData] = useState({
    hotelId: '',
    amount: 30000,
    phone: '',
    email: '',
    firstName: '',
    lastName: '',
    country: 'BJ',
    network: 'mtn_bj',
    description: ''
  })
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState(null)
  const [payments, setPayments] = useState([])
  const [countries, setCountries] = useState([])
  const [selectedCountry, setSelectedCountry] = useState(null)

  useEffect(() => {
    fetchCountries()
    fetchPayments()
  }, [])

  const fetchCountries = async () => {
    try {
      const response = await api.get('/payments/countries')
      const countriesData = Array.isArray(response.data) ? response.data : []
      setCountries(countriesData)
      // Set default country to first available
      if (countriesData.length > 0) {
        const firstCountry = countriesData[0]
        setSelectedCountry(firstCountry)
        setFormData(prev => ({
          ...prev,
          country: firstCountry.code,
          network: firstCountry.networks?.[0]?.code || ''
        }))
      }
    } catch (error) {
      console.error('Failed to fetch countries:', error)
      setCountries([])
    }
  }

  const fetchPayments = async () => {
    try {
      const response = await api.get('/payments/subscriptions')
      const paymentsData = Array.isArray(response.data) ? response.data : []
      setPayments(paymentsData)
    } catch (error) {
      console.error('Failed to fetch payments:', error)
      setPayments([])
    }
  }

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

      // If checkout URL is provided, redirect to it
      if (response.data.checkoutUrl) {
        window.location.href = response.data.checkoutUrl
      }

      // Refresh payments
      fetchPayments()

      // Reset form
      setFormData({
        ...formData,
        phone: '',
        email: '',
        firstName: '',
        lastName: ''
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

  const handleCountryChange = (countryCode) => {
    const country = countries.find(c => c.code === countryCode)
    setSelectedCountry(country)
    setFormData(prev => ({
      ...prev,
      country: countryCode,
      network: country?.networks?.[0]?.code || ''
    }))
  }

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'XOF'
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
              Pays
            </label>
            <select
              value={formData.country}
              onChange={(e) => handleCountryChange(e.target.value)}
              className="input-luxe w-full"
              required
            >
              {countries.map(country => (
                <option key={country.code} value={country.code}>
                  {country.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-hestia-dark mb-2">
              Réseau mobile money
            </label>
            <select
              value={formData.network}
              onChange={(e) => setFormData({ ...formData, network: e.target.value })}
              className="input-luxe w-full"
              required
            >
              {selectedCountry?.networks?.map(network => (
                <option key={network.code} value={network.code}>
                  {network.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-hestia-dark mb-2">
              Numéro de téléphone
            </label>
            <input
              type="tel"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              placeholder="+22997505050"
              className="input-luxe w-full"
              required
            />
            <p className="text-xs text-gray-500 mt-1">
              Format: +[code pays][numéro] (ex: +22997505050)
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-hestia-dark mb-2">
              Email (optionnel)
            </label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              placeholder="hotel@example.com"
              className="input-luxe w-full"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-hestia-dark mb-2">
                Prénom (optionnel)
              </label>
              <input
                type="text"
                value={formData.firstName}
                onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                placeholder="Jean"
                className="input-luxe w-full"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-hestia-dark mb-2">
                Nom (optionnel)
              </label>
              <input
                type="text"
                value={formData.lastName}
                onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                placeholder="Dupont"
                className="input-luxe w-full"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-hestia-dark mb-2">
              Montant (XOF)
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
            onClick={fetchPayments}
            className="text-sm text-hestia-gold hover:underline"
          >
            Actualiser
          </button>
        </div>

        {payments.length === 0 ? (
          <p className="text-gray-500 text-center py-8">Aucun paiement trouvé</p>
        ) : (
          <div className="space-y-4">
            {payments.map((payment) => (
              <div key={payment._id} className="border border-gray-200 rounded-lg p-4">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <p className="font-semibold text-hestia-dark">
                      {formatCurrency(payment.amount)}
                    </p>
                    <p className="text-sm text-gray-500">
                      Réf: {payment.transref}
                    </p>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                    payment.status === 'success' ? 'bg-green-100 text-green-800' :
                    payment.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-red-100 text-red-800'
                  }`}>
                    {payment.status}
                  </span>
                </div>
                <div className="text-sm text-gray-500 space-y-1">
                  <p>Créé le: {formatDate(payment.createdAt)}</p>
                  {payment.paidAt && <p>Payé le: {formatDate(payment.paidAt)}</p>}
                  <p>Provider: {payment.provider}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}