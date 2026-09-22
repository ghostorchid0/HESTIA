# Intégration SasaPay - Hestia

## Configuration

### 1. Obtenir les clés API SasaPay

1. Créez un compte sur [SasaPay Developer Portal](https://developer.sasapay.app/#/)
2. Créez une application sandbox (C2B / B2C / B2B scope)
3. Récupérez vos clés :
   - `CLIENT ID`
   - `CLIENT SECRET`
   - `MERCHANT CODE`

### 2. Configuration des variables d'environnement

Ajoutez ces variables dans votre fichier `server/.env` :

```env
# SasaPay payment gateway
SASAPAY_CLIENT_ID=votre_client_id
SASAPAY_CLIENT_SECRET=votre_client_secret
SASAPAY_MERCHANT_CODE=votre_merchant_code
SASAPAY_ENVIRONMENT=sandbox  # ou 'production' pour le live
```

**⚠️ IMPORTANT : Ne partagez jamais vos clés API en clair !**

### 3. Utilisation

#### Backend (Node.js)

Les endpoints sont disponibles :

- `POST /api/payments/initiate` - Initier un paiement d'abonnement
- `POST /api/payments/webhook` - Recevoir les notifications SasaPay
- `GET /api/payments/status/:transactionRef` - Vérifier le statut d'un paiement
- `GET /api/payments/subscriptions` - Historique des paiements

#### Frontend (React)

Un nouveau panneau "Paiement" est disponible dans le tableau de bord admin :

1. Connectez-vous en tant qu'admin
2. Naviguez vers "Paiement" dans le menu
3. Entrez votre numéro de téléphone SasaPay
4. Sélectionnez le montant de l'abonnement
5. Cliquez sur "Initier le paiement"
6. Complétez le paiement sur votre téléphone via SasaPay

## Fonctionnalités

- ✅ Paiement d'abonnement via SasaPay (C2B)
- ✅ Webhook pour notifications de paiement
- ✅ Historique des paiements
- ✅ Activation automatique de l'abonnement après paiement réussi
- ✅ Calcul automatique de la date d'expiration (30 jours)

## Sécurité

- Les clés API sont stockées dans les variables d'environnement
- Authentification OAuth2 avec SasaPay
- Webhook signature verification (à implémenter)
- Seuls les admins et superadmins peuvent initier des paiements

## Testing

Pour tester en environnement sandbox :

1. Utilisez les credentials sandbox de SasaPay
2. Les paiements sont simulés
3. Aucun argent réel n'est débité

Pour passer en production :

1. Changez `SASAPAY_ENVIRONMENT=sandbox` en `SASAPAY_ENVIRONMENT=production`
2. Utilisez les credentials live de SasaPay
3. Les paiements seront réels

## Support

Pour toute question sur l'intégration SasaPay :
- Documentation SasaPay : https://docs.sasapay.app/docs/products/introduction
- Support SasaPay : info@sasapay.co.ke