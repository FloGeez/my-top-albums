# Refactorisation de l'application Top 50 Albums

## Vue d'ensemble

Cette refactorisation a permis de séparer les composants du fichier principal `app/page.tsx` en modules plus petits et réutilisables.

## Nouvelle structure des composants

### 📁 `components/album-card.tsx`

Composants liés à l'affichage des albums :

- `AlbumCard` : Carte d'album pour la recherche
- `CompactRankedAlbumCard` : Version compacte pour le Top 50
- `AlbumSkeleton` : Skeleton pour le chargement des albums

### 📁 `components/action-buttons.tsx`

Boutons d'action réutilisables :

- `ViderButton` : Bouton pour vider le Top 50
- `TriButton` : Bouton de tri par date
- `TriManuelButton` : Bouton pour activer le tri manuel
- `PleinEcranButton` : Bouton pour le mode plein écran

### 📁 `components/search-content.tsx`

Composant pour le contenu de recherche :

- `MemoizedSearchContent` : Interface de recherche avec résultats

### 📁 `components/top50-content.tsx`

Composant pour le contenu du Top 50 :

- `MemoizedTop50Content` : Affichage et gestion du Top 50

### 📁 `components/skeletons.tsx`

Composants de chargement :

- `TabsSkeleton` : Skeleton pour les onglets
- `Top50ContentSkeleton` : Skeleton pour le contenu Top 50
- `SearchContentSkeleton` : Skeleton pour la recherche

### 📁 `components/fullscreen-view.tsx`

Vue plein écran :

- `FullscreenView` : Affichage plein écran du Top 50 (utilisée par MainView)

### 📁 `components/app-header.tsx`

Header de l'application :

- `AppHeader` : Header avec titre, notifications et actions

### 📁 `components/floating-dock.tsx`

Dock flottant :

- `FloatingDock` : Dock flottant en bas avec les actions principales (inclut ShareDialog et LoadSpotifyDialog)

### 📁 `components/load-spotify-dialog.tsx`

Modale de chargement :

- `LoadSpotifyDialog` : Modale pour charger depuis Spotify (utilisée par FloatingDock)

### 📁 `components/main-view.tsx`

Vue principale :

- `MainView` : Interface principale gérant mobile et desktop (inclut FullscreenView, gestion locale des onglets et de la recherche)

### 📁 `components/top50-panel-header.tsx`

Header du panneau Top 50 :

- `Top50PanelHeader` : Header avec contrôles pour le panneau Top 50

### 📁 `components/index.ts`

Fichier d'index pour exporter tous les composants

## Avantages de cette refactorisation

1. **Séparation des responsabilités** : Chaque fichier a une responsabilité claire
2. **Réutilisabilité** : Les composants peuvent être réutilisés ailleurs
3. **Maintenabilité** : Plus facile de modifier un composant spécifique
4. **Lisibilité** : Le fichier principal est plus court et plus lisible
5. **Testabilité** : Chaque composant peut être testé indépendamment
6. **Encapsulation** : Les modales sont dans leurs composants respectifs
7. **DRY** : Pas de duplication de code entre mobile et desktop
8. **Composants autonomes** : Chaque composant gère ses propres modales et états
9. **Encapsulation des états** : Les états locaux restent dans leurs composants respectifs
10. **Hooks personnalisés** : Logique métier extraite dans des hooks réutilisables
11. **Encapsulation complète** : La logique de tri et drag & drop est maintenant dans les composants qui les utilisent

## Utilisation

Tous les composants sont maintenant exportés depuis `@/components` :

```typescript
import {
  AlbumCard,
  CompactRankedAlbumCard,
  MemoizedSearchContent,
  MemoizedTop50Content,
  ViderButton,
  TriButton,
  // ... etc
} from "@/components";
```

## Fichier principal simplifié

Le fichier `app/page.tsx` est maintenant beaucoup plus court et se concentre uniquement sur :

- La logique métier (state, effets, handlers)
- L'orchestration des composants
- La gestion des événements globaux
- **Plus de logique de tri ou drag & drop** : Ces responsabilités sont maintenant dans les composants appropriés

### Réduction de la taille

- **Avant** : ~1053 lignes
- **Après** : ~400 lignes (réduction de ~62%)
- **Composants extraits** : 9 nouveaux composants modulaires
- **Hooks créés** : 2 hooks personnalisés

## Hooks personnalisés créés

### 📁 `hooks/use-sort.tsx`

Hook pour gérer la logique de tri :

- `useSort()` : Gestion des modes de tri (date/manuel) et directions
- `getSortIcon()` : Retourne l'icône appropriée selon le mode
- `getSortTooltipText()` : Retourne le texte du tooltip

### 📁 `hooks/use-drag-drop.ts`

Hook pour gérer le drag & drop :

- `useDragDrop()` : Gestion du drag & drop des albums
- `draggedItem` : État de l'élément en cours de drag
- `handleDragStart`, `handleDragOver`, `handleDrop`, `handleDragEnd` : Gestionnaires d'événements

## Architecture finale optimisée

### 🎯 Principe d'encapsulation respecté

- **`Top50PanelHeader`** : Gère sa propre logique de tri avec `useSort()`
- **`Top50Content`** : Gère sa propre logique de drag & drop avec `useDragDrop()`
- **`page.tsx`** : Plus de logique de tri ou drag & drop, seulement l'orchestration

### 📊 Résultats finaux

- **Réduction de 62%** de la taille du fichier principal
- **Logique encapsulée** dans les composants appropriés
- **Hooks réutilisables** pour la logique métier
- **Architecture modulaire** et maintenable

## Prochaines étapes possibles

1. **Context API** : Utiliser un contexte pour partager l'état
2. **Types partagés** : Créer un fichier de types communs
3. **Tests unitaires** : Ajouter des tests pour chaque composant
4. **Hooks supplémentaires** : Extraire d'autres logiques métier
