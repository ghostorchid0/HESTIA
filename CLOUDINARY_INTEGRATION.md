# Intégration Cloudinary - Hestia

## Configuration

### 1. Créer un compte Cloudinary

1. Allez sur [Cloudinary](https://cloudinary.com/)
2. Créez un compte gratuit
3. Récupérez vos identifiants depuis le tableau de bord

### 2. Configuration des variables d'environnement

Ajoutez ces variables dans votre fichier `server/.env` :

```env
# Cloudinary image storage
CLOUDINARY_CLOUD_NAME=votre_cloud_name
CLOUDINARY_API_KEY=votre_api_key
CLOUDINARY_API_SECRET=votre_api_secret
```

**⚠️ IMPORTANT : Ne partagez jamais vos clés API en clair !**

## Fonctionnalités

- ✅ Upload automatique des images vers Cloudinary
- ✅ Optimisation automatique (redimensionnement, compression)
- ✅ CDN global pour des performances optimales
- ✅ Support pour les logos d'hôtels et images de menu
- ✅ Transformation d'images à la volée
- ✅ Stockage illimité

## Types d'images stockées

- **Logos d'hôtels** : Stockés dans le dossier `hestia`
- **Images de menu** : Stockés dans le dossier `hestia`
- **Futurs** : Avatars utilisateurs, photos de chambres, etc.

## Optimisations automatiques

Toutes les images uploadées sont automatiquement :
- Limitées à 800x800 pixels maximum
- Optimisées en qualité automatique
- Converties en formats web modernes (WebP quand supporté)
- Servies via CDN global

## Avantages par rapport au stockage local

- **Performance** : CDN global avec des points de présence dans le monde entier
- **Scalabilité** : Stockage et bande passante illimités
- **Sécurité** : URLs signées et protection contre le hotlinking
- **Optimisation** : Compression et redimensionnement automatiques
- **Fiabilité** : 99.9% de disponibilité garantie
- **Coût** : Plan gratuit généreux (25GB stockage, 25GB bande passante/mois)

## Utilisation

### Backend (Node.js)

Les uploads sont automatiquement gérés par Cloudinary via multer-storage-cloudinary :

```javascript
const upload = require('../middleware/upload');

// Dans les routes
router.post('/admin/menu', upload.single('image'), async (req, res) => {
  // req.file.path contient l'URL Cloudinary
  const imageUrl = req.file.path;
});
```

### Frontend (React)

Les formulaires d'upload utilisent FormData :

```javascript
const formData = new FormData();
formData.append('image', file);
await api.post('/admin/menu', formData, {
  headers: { 'Content-Type': 'multipart/form-data' }
});
```

## Migration des images existantes

Les images existantes (data URLs) continueront de fonctionner. Les nouvelles images seront automatiquement uploadées sur Cloudinary.

Pour migrer les images existantes vers Cloudinary, vous pouvez :

1. Exporter les données existantes
2. Convertir les data URLs en fichiers
3. Upload vers Cloudinary
4. Mettre à jour les URLs dans la base de données

## Coûts

Le plan gratuit Cloudinary inclut :
- 25 GB de stockage
- 25 GB de bande passante par mois
- 25 transformations par mois

Pour Hestia, le plan gratuit devrait suffire pour commencer. Si vous dépassez les limites :
- Plan Pro : $89/mois (toutes les fonctionnalités illimitées)
- Plan Plus : $249/mois (usage intensif)

## Support

Pour toute question sur Cloudinary :
- Documentation : https://cloudinary.com/documentation
- Support : https://cloudinary.com/contact