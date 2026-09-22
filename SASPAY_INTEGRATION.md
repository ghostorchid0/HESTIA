# Intégration SasPay - Hestia

## Configuration

### 1. Obtenir votre clé API SasPay

1. Créez un compte sur [SasPay](https://app.saspay.me/dashboard)
2. Complétez le processus KYC (Know Your Customer)
3. Générez votre clé API depuis la section "Développeur" du tableau de bord
4. Copiez votre clé API secrète (format: `sk_live_...` ou `sk_test_...`)

### 2. Configuration des variables d'environnement

Ajoutez cette variable dans votre fichier `server/.env` :

```env
# SasPay payment gateway (Afrique de l'Ouest et du Centre)
SASAPAY_API_KEY=sk_live_votre_clé_api_ici
```

**⚠️ IMPORTANT : Ne partagez jamais vos clés API en clair !**

Pour les tests, utilisez une clé `sk_test_...` (environnement sandbox). Pour la production, utilisez une clé `sk_live_...`.

### 3. Utilisation

#### Backend (Node.js)

Les endpoints sont disponibles :

- `GET /api/payments/countries` - Liste des pays et réseaux mobile money supportés
- `POST /api/payments/initiate` - Initier un paiement d'abonnement
- `GET /api/payments/verify/:paymentId` - Vérifier le statut d'un paiement
- `POST /api/payments/retry/:paymentId` - Réessayer un paiement échoué
- `GET /api/payments/subscriptions` - Historique des paiements

#### Frontend (React)

Un nouveau panneau "Paiement" est disponible dans le tableau de bord admin :

1. Connectez-vous en tant qu'admin
2. Naviguez vers "Paiement" dans le menu
3. Sélectionnez votre pays et réseau mobile money
4. Entrez votre numéro de téléphone
5. Sélectionnez le montant de l'abonnement
6. Cliquez sur "Initier le paiement"
7. Complétez le paiement sur votre téléphone via mobile money

## Fonctionnalités

- ✅ Paiement d'abonnement via SasPay (mobile money et carte)
- ✅ Support multi-pays (Afrique de l'Ouest et du Centre)
- ✅ Softpay (push direct) et checkout hébergé
- ✅ Vérification de statut de paiement
- ✅ Réessai automatique des paiements échoués
- ✅ Historique des paiements
- ✅ Activation automatique de l'abonnement après paiement réussi
- ✅ Calcul automatique de la date d'expiration (30 jours)
- ✅ Idempotence pour éviter les doublons de paiement

## Sécurité

- Les clés API sont stockées dans les variables d'environnement
- Authentification Bearer token avec SasPay
- Idempotency-Key pour éviter les paiements en double
- Seuls les admins et superadmins peuvent initier des paiements

## Pays et réseaux supportés

SasPay supporte les mobile money et cartes dans plusieurs pays d'Afrique de l'Ouest et du Centre :

- Bénin : MTN, Moov, Wave
- Côte d'Ivoire : Orange Money, MTN, Wave, Djamo
- Sénégal : Orange Money, Wave, Free Money
- Togo : Moov, Togocel
- Burkina Faso : Orange Money, Moov
- Et plus...

La liste complète est disponible via l'endpoint `/api/payments/countries`.

## Testing

Pour tester en environnement sandbox :

1. Utilisez une clé API `sk_test_...`
2. Les paiements sont simulés
3. Aucun argent réel n'est débité

Pour passer en production :

1. Utilisez une clé API `sk_live_...`
2. Les paiements seront réels
3. Assurez-vous d'avoir complété le KYC

## Support

Pour toute question sur l'intégration SasPay :
- Documentation SasPay : https://docs.saspay.me/api-reference/introduction
- Tableau de bord : https://app.saspay.me/dashboard
- Support : Ouvrez un ticket depuis votre tableau de bord