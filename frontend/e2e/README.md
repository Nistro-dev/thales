# Tests E2E - Frontend

Tests end-to-end avec Playwright pour valider la **Phase 1 : Setup + Auth + Layouts**.

## 📋 Suites de tests

### 1. **auth.spec.ts** - Tests d'authentification
- ✅ Affichage de la page de login
- ✅ Login avec identifiants admin
- ✅ Login avec identifiants utilisateur standard
- ✅ Erreur pour identifiants invalides
- ✅ Déconnexion
- ✅ Persistance de session après reload
- ✅ Redirection si déjà connecté
- ✅ État de chargement pendant l'authentification

### 2. **permissions.spec.ts** - Tests de contrôle d'accès
- ✅ Menu admin visible pour admin
- ✅ Menu admin caché pour utilisateur standard
- ✅ Admin peut accéder aux routes admin
- ✅ Utilisateur standard bloqué sur routes admin
- ✅ Admin a toutes les permissions Super Admin
- ✅ Affichage correct des infos utilisateur (nom, crédits)
- ✅ Permissions combinées des rôles multiples

### 3. **navigation.spec.ts** - Tests de navigation et route guards
- ✅ Redirection vers login pour utilisateurs non authentifiés
- ✅ Accès aux routes publiques sans authentification
- ✅ Navigation entre sections principales
- ✅ Navigation vers section admin
- ✅ Highlight du menu actif dans sidebar
- ✅ Navigation navigateur (back/forward)
- ✅ Préservation de la route après reload
- ✅ Redirection de la racine vers dashboard
- ✅ Gestion des routes inexistantes (404)

### 4. **ui.spec.ts** - Tests d'interface utilisateur
- ✅ Affichage de la sidebar avec navigation
- ✅ Affichage des infos utilisateur dans sidebar
- ✅ Toggle du thème (light/dark)
- ✅ Persistance du thème après reload
- ✅ Bouton de déconnexion visible
- ✅ Affichage des toasts de notification
- ✅ Responsive sur mobile
- ✅ Gestion gracieuse des erreurs (ErrorBoundary)
- ✅ États de chargement
- ✅ Rendu correct des sections principales

## 🚀 Commandes

### Lancer tous les tests
```bash
npm run test:e2e
```

### Interface UI interactive
```bash
npm run test:e2e:ui
```

### Mode headed (avec navigateur visible)
```bash
npm run test:e2e:headed
```

### Mode debug (pas à pas)
```bash
npm run test:e2e:debug
```

### Voir le rapport HTML
```bash
npm run test:e2e:report
```

### Lancer un test spécifique
```bash
npx playwright test auth.spec.ts
```

### Lancer une suite spécifique
```bash
npx playwright test --grep "Authentication Flow"
```

## 🔧 Configuration

La configuration se trouve dans `playwright.config.ts` :
- **Port frontend** : `http://localhost:5173`
- **Navigateur** : Chromium (Chrome)
- **Screenshots** : Seulement en cas d'échec
- **Traces** : Lors du premier retry
- **Serveur dev** : Démarre automatiquement avant les tests

## 📝 Prérequis

1. **Backend lancé** sur le port 3000 avec les données de seed :
   ```bash
   cd backend
   npm run dev
   ```

2. **Base de données** avec les utilisateurs de test :
   - `admin@thales.local` / `Admin123!` (Super Admin)
   - `user@thales.local` / `User123!` (User basique)

## 🎯 Comptes de test

Les identifiants sont définis dans `e2e/helpers/auth.ts` :

```typescript
TEST_USERS = {
  admin: {
    email: 'admin@thales.local',
    password: 'Admin123!',
  },
  user: {
    email: 'user@thales.local',
    password: 'User123!',
  },
}
```

## 📊 Résultats attendus

Tous les tests doivent passer ✅ pour valider que Phase 1 est complète :

- **Total** : ~40+ tests
- **auth.spec.ts** : ~8 tests
- **permissions.spec.ts** : ~7 tests
- **navigation.spec.ts** : ~9 tests
- **ui.spec.ts** : ~11 tests

## 🐛 Debugging

### Test qui échoue ?

1. **Lancer en mode debug** :
   ```bash
   npm run test:e2e:debug
   ```

2. **Voir les screenshots** dans `test-results/`

3. **Voir les traces** dans le rapport HTML :
   ```bash
   npm run test:e2e:report
   ```

### Timeout ?

- Vérifier que le backend est bien lancé
- Vérifier que le frontend se lance bien sur le port 5173
- Augmenter le timeout dans `playwright.config.ts`

### Éléments non trouvés ?

- Vérifier les sélecteurs dans les tests
- Lancer en mode headed pour voir le navigateur :
  ```bash
  npm run test:e2e:headed
  ```

## 📚 Documentation

- [Playwright Docs](https://playwright.dev)
- [Best Practices](https://playwright.dev/docs/best-practices)
- [Selectors](https://playwright.dev/docs/selectors)
