# Hestia PMS — Vision produit NEOTRIX

## 1. Résumé exécutif

Hestia n’est pas un simple système de commande par QR Code. La vision long terme est de devenir le **système d’exploitation de référence pour les hôtels africains** : une plateforme unique qui centralise réservations, occupation, facturation, housekeeping, maintenance, restaurant et statistiques.

Le QR Code est le point d’entrée client. Tout le reste construit autour de cette donnée partagée : la chambre, le client, l’hôtel.

Le développement se fera en commençant par un périmètre restreint, puis en ajoutant les modules les plus demandés par les hôtels pilotes.

---

## 2. Contexte et problème

### Comment fonctionne un hôtel typique à Lomé

Un hôtel de 20 à 50 chambres gère quotidiennement :

- Réservations par téléphone, WhatsApp, e-mail
- Check-in et check-out manuels
- Occupation des chambres sur papier ou Excel
- Commandes restaurant via appels ou papier
- Demandes de nettoyage, serviettes, réparations par WhatsApp
- Paiements en espèces ou Mobile Money
- Facturation et rapports recalculés à la main

Conséquence : les informations sont éclatées, les erreurs fréquentes, le propriétaire n’a pas de vision en temps réel.

### Ce que l’hôtelier achète réellement

Il ne veut pas un QR Code. Il veut :

- Moins de chaos
- Moins d’oublis
- Plus de revenus
- Une vision claire de son hôtel

---

## 3. Vision produit

### Énoncé de vision

> "Hestia est le système d’exploitation cloud des hôtels africains. Elle connecte réception, personnel et clients autour d’une seule source de vérité."

### Objectif stratégique

1. Résoudre un problème simple d’abord : commande et service via QR Code.
2. Valider chaque nouvelle fonctionnalité avec 5 à 10 hôtels réels.
3. Développer progressivement les modules qui reviennent le plus souvent.
4. Devenir le PMS de référence pour l’hébergement en Afrique, avant d’étendre l’écosystème NEOTRIX vers l’immobilier locatif et la construction.

---

## 4. Positionnement et cible

### Cible principale

- Hôtels de 5 à 50 chambres
- Auberges, guesthouses, résidences hôtelières
- Boutique hôtels
- Afrique francophone et anglophone en priorité

### Proposition de valeur

- SaaS abordable, sans installation
- Fonctionne sur n’importe quel téléphone, tablette ou ordinateur
- Paiement Mobile Money intégré
- Interface simple pour un personnel peu technophile
- Support en français et en anglais

---

## 5. Personas

### Propriétaire / Directeur

- Veut des chiffres chaque matin
- Veut réduire les pertes et les erreurs
- Décide de l’achat

### Réceptionniste

- Gère les arrivées, départs, appels, paiements
- A besoin d’une vue rapide des chambres et des clients
- Utilise Hestia Web toute la journée

### Femme de chambre

- Travaille avec un téléphone basique ou une tablette
- Doit voir les chambres à nettoyer
- Marque une chambre comme prête en un clic

### Technicien

- Reçoit les pannes signalées
- Met à jour l’état des réparations
- Ajoute des commentaires

### Serveur / Cuisinier

- Gère les commandes restaurant
- Change le statut de préparation
- Voit les commandes par table ou par chambre

### Client

- Ne veut rien installer
- Scanne un QR Code depuis sa chambre
- Commande, demande un service, signale un problème

---

## 6. Architecture cible

```
                        HESTIA CLOUD
              ┌─────────────────────────┐
              │    API Node.js / Express │
              │    MongoDB / Socket.io   │
              └─────────────────────────┘
                         │
      ┌──────────────────┼──────────────────┐
      │                  │                  │
  Réception           Personnel            Client
   Web                 Mobile             QR Code
```

### Choix d’interfaces

- **Web pour la réception** : un navigateur suffit, pas d’installation, pas de mise à jour manuelle.
- **PWA mobile pour le personnel** : notifications push, mode hors-ligne partiel, fonctionne sur Android et iOS.
- **PWA QR pour le client** : aucune installation, juste un scan.

---

## 7. Modules détaillés

### 7.1 Module Chambres et Occupation

Le cœur du PMS.

Fonctions :

- Vue grille des chambres : libre, occupée, sale, en maintenance
- Création et modification des chambres
- Types de chambre (simple, double, suite, etc.)
- Capacité et équipements
- Historique d’occupation

### 7.2 Module Réservations

- Réservations en ligne et manuelles
- Calendrier des disponibilités
- Tarifs par nuit et par saison
- Lien entre réservation, client et chambre
- Statuts : en attente, confirmée, enregistrée, annulée

### 7.3 Check-in / Check-out

- Check-in : attribution de chambre, signature digitale, génération du QR client
- Check-out : calcul automatique de la facture, libération de la chambre
- Séjour en cours : détails, options, consommations

### 7.4 Module Facturation

- Facturation par chambre et par client
- Ligne de consommations (restaurant, blanchisserie, extras)
- Paiements partiels et soldes
- Génération de facture PDF
- Historique des paiements

### 7.5 Module Housekeeping

- Liste des chambres à nettoyer
- Assignation aux femmes de chambre
- Statuts : à nettoyer, en cours, terminé, contrôlé
- Notifications vers réception quand une chambre est prête
- Rapport de tâches

### 7.6 Module Maintenance

- Signalement par client, réception ou personnel
- Tickets avec priorité et pièce concernée
- Assignation aux techniciens
- Suivi des réparations
- Historique des pannes par chambre

### 7.7 Module Restaurant

- Menu et catégories
- Commandes en salle ou depuis une chambre
- Statuts : reçue, en préparation, prête, livrée
- Lien automatique avec la facture du client
- Cuisine et service coordonnés

### 7.8 Interface Client QR

Point d’entrée actuel d’Hestia.

Fonctions :

- Consulter le menu restaurant
- Commander
- Demander un service (ménage, serviettes, navette, taxi)
- Signaler un problème
- Consulter les services de l’hôtel
- Payer certaines prestations

### 7.9 Paiements

- Mobile Money (Wave, MTN Money, Orange Money)
- Paiement en espèces (enregistrement manuel)
- Carte si intégration future
- Suivi des paiements par client et par chambre

### 7.10 Statistiques et Rapports

- Taux d’occupation
- Revenus par catégorie (chambres, restaurant, extras)
- Performance du personnel
- Ventes par période
- Export PDF et CSV
- Tableau de bord matinal par e-mail

---

## 8. Modèle de données proposé

Les entités principales :

### Hotel

- `name`
- `slug`
- `address`
- `currency`
- `settings`
- `createdAt`

### User

- `hotel`
- `email`
- `password`
- `role` : `superadmin`, `manager`, `reception`, `housekeeper`, `technician`, `waiter`
- `name`
- `phone`

### Room

- `hotel`
- `number`
- `type`
- `capacity`
- `status` : `available`, `occupied`, `cleaning`, `maintenance`
- `pricePerNight`
- `qrCode`

### Guest

- `hotel`
- `name`
- `phone`
- `email`
- `documentNumber`
- `history`

### Reservation

- `hotel`
- `guest`
- `room`
- `checkIn`
- `checkOut`
- `status`
- `totalAmount`
- `payments`

### Order

- `hotel`
- `room`
- `guest`
- `items`
- `status`
- `total`
- `paymentStatus`

### Task

- `hotel`
- `type` : `housekeeping`, `maintenance`
- `room`
- `assignedTo`
- `status` : `todo`, `in_progress`, `done`
- `priority`
- `description`

### Payment

- `hotel`
- `reservation` ou `order`
- `amount`
- `method`
- `status`
- `transactionRef`

---

## 9. Flux opérationnels clés

### Demande de serviette par un client

1. Client scanne le QR de la chambre 205.
2. Il choisit "Demander des serviettes".
3. Hestia crée une tâche Housekeeping liée à la chambre 205.
4. La femme de chambre reçoit une notification.
5. Elle apporte les serviettes et marque la tâche comme terminée.
6. La réception voit la chambre 205 comme OK.

### Enregistrement d’un client

1. La réception crée la réservation.
2. Elle attribue la chambre.
3. Le client reçoit le QR de sa chambre par SMS ou e-mail.
4. Le client scanne et accède aux services.

### Commande restaurant

1. Client commande un burger depuis son QR.
2. La commande arrive en cuisine.
3. Le cuisinier la marque "en préparation", puis "prête".
4. Le serveur la livre à la chambre.
5. La commande est ajoutée automatiquement à la facture du client.

### Départ client

1. Réception clique sur check-out.
2. Hestia calcule la facture totale.
3. Le client paie.
4. La chambre passe en "à nettoyer".
5. Après nettoyage, la chambre redevient disponible.

---

## 10. Feuille de route

### MVP — 0 à 3 mois

Objectif : valider le QR et la commande.

- QR Code par chambre
- Menu restaurant
- Commandes en temps réel
- Gestion des statuts de commande
- Tableau de bord basique pour le personnel
- Paiement Mobile Money optionnel

### V1 — 3 à 6 mois

Objectif : devenir un mini PMS.

- Gestion des chambres et de l’occupation
- Réservations manuelles
- Check-in / Check-out
- Facturation par chambre
- Lien commandes restaurant → facture
- Rapports simples

### V2 — 6 à 12 mois

Objectif : automatiser les opérations.

- Module Housekeeping mobile
- Module Maintenance
- Application PWA pour le personnel
- Paiements complètement intégrés
- Rapports avancés et alertes e-mail
- Gestion des utilisateurs et permissions

### V3 — 12 à 24 mois

Objectif : écosystème hôtelier.

- Multi-hôtels
- Moteur de réservation en ligne
- Intégrations OTA (Booking.com, Airbnb, Expedia)
- CRM et fidélisation
- Statistiques prédictives
- Tarification dynamique

---

## 11. Stratégie commerciale et monétisation

### Modèle économique

SaaS B2B avec abonnement mensuel par chambre.

Exemple de grille indicative :

- Hôtels de 5 à 20 chambres : 500 FCFA par chambre / mois
- Hôtels de 21 à 50 chambres : 400 FCFA par chambre / mois
- Hôtels de 51+ chambres : 300 FCFA par chambre / mois

### Lancement

1. Identifier 5 hôtels pilotes à Lomé.
2. Installer Hestia gratuitement pendant 1 mois.
3. Noter chaque demande, chaque friction.
4. Choisir le prochain module en fonction des retours récurrents.
5. Passer à la tarification après validation.

### Avantages concurrentiels

- Localisé pour l’Afrique
- Mobile Money natif
- Pas de matériel à acheter
- Onboarding rapide
- Support local

---

## 12. Indicateurs de succès

### North Star Metric

- Nombre de chambres actives sur Hestia.

### Indicateurs opérationnels

- Nombre d’hôtels actifs
- Taux d’occupation géré via Hestia
- Nombre de commandes par QR par mois
- Temps de nettoyage moyen
- Temps de résolution des pannes
- Revenu géré par Hestia

### Indicateurs commerciaux

- Churn mensuel
- NPS des hôteliers
- MRR (Monthly Recurring Revenue)
- Coût d’acquisition client
- Temps d’onboarding

---

## 13. Risques et atténuations

### Risque de dérive du scope

**Problème :** vouloir tout construire d’un coup.
**Atténuation :** strict respect de la roadmap, validation par les hôtels pilotes.

### Risque technique

**Problème :** intégrations Mobile Money, notifications, temps réel.
**Atténuation :** commencer par des solutions simples et documentées, isoler les modules.

### Risque commercial

**Problème :** les hôtels sont difficiles à convaincre et ont peu de budget.
**Atténuation :** offre d’essai, prix alignés sur le marché local, preuve de ROI rapide.

### Risque concurrence

**Problème :** des PMS internationaux existent.
**Atténuation :** se concentrer sur les spécificités locales : Mobile Money, support, prix, simplicité.

---

## 14. Recommandations immédiates

1. **Ne pas coder un PMS complet maintenant.** Finaliser le QR et les commandes.
2. **Ajouter un module Chambres minimal** dès qu’un hôtel pilote le demande.
3. **Rester sur Web pour la réception et PWA pour le personnel.** Pas d’appli native pour l’instant.
4. **Documenter chaque retour d’hôtel** dans un fichier partagé.
5. **Construire uniquement les modules demandés au moins 3 fois.**

---

## 15. Conclusion

Hestia a le potentiel de devenir bien plus qu’un outil de commande. En restant discipliné sur le périmètre et en construire à partir des besoins réels des hôtels, NEOTRIX peut créer le PMS de référence pour l’hébergement en Afrique.

Le QR Code reste le point de départ. Le PMS est la destination. Le marché africain est le terrain.
