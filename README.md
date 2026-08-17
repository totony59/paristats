# PariStats

Application personnelle de suivi et d'**analyse de l'historique** des paris sportifs football, dont le frontend principal est une **app Android** (Expo/React Native). Import de capture d'écran ou photo d'un ticket Betclic, analyse Claude Vision, suivi de bankroll et statistiques.

PariStats n'est pas un outil de pronostics : l'IA n'analyse que les données historiques de l'utilisateur, elle ne recommande jamais de pari à venir.

## Installation

```bash
npm install
```

Installe les dépendances des quatre workspaces (`frontend`, `backend`, `shared/types`, `mobile`) d'un coup.

## Configuration

```bash
cp backend/.env.example backend/.env
```

Variables d'environnement (`backend/.env`) :

| Variable | Description |
|---|---|
| `DATABASE_URL` | Emplacement de la base SQLite, ex. `file:./dev.db` |
| `PORT` | Port du serveur backend (défaut `3001`) |
| `ANTHROPIC_API_KEY` | Clé API Anthropic, backend uniquement, jamais exposée au frontend. **Laisser vide pour rester en mode mock** (voir ci-dessous). |
| `ANTHROPIC_MODEL` | Modèle Claude utilisé pour l'analyse vision (défaut `claude-sonnet-5`) |
| `MAX_UPLOAD_MB` | Taille max d'une capture importée, en Mo (défaut `8`) |

## Base de données

```bash
npm run db:migrate    # applique le schema Prisma sur SQLite + seed automatique
npm run db:seed       # rejoue uniquement le seed de démo
npm run db:studio     # ouvre Prisma Studio pour inspecter les données
```

Le seed crée 15 paris de démonstration (gagnés, perdus, en attente, annulé, simples et combinés, plusieurs compétitions) et 3 transactions de bankroll, pour avoir un dashboard réaliste dès le départ.

## Lancement

```bash
npm run dev
```

Démarre en parallèle :
- le backend Express sur `http://localhost:3001`
- le frontend Vite sur `http://localhost:5173` (proxy `/api` vers le backend)

## Application Android (mobile/)

Frontend principal de PariStats. Version actuelle : écrans **Accueil**, **Scanner**, **Vérification** uniquement (Mes paris, Bankroll, Statistiques, Claude Vision réel viendront ensuite). Analyse en **mode mock uniquement** pour l'instant.

**Prérequis** : app **Expo Go** installée sur le téléphone Android (Play Store), téléphone et PC sur le **même réseau Wi-Fi**.

1. `cp mobile/.env.example mobile/.env` puis remplacer l'IP par l'IP locale du PC (`ipconfig` → carte Wi-Fi, ex. `192.168.1.186`). Modifiable aussi depuis l'app (écran Accueil → bouton "Enregistrer" après avoir édité l'adresse) sans reconstruire.
2. Démarrer le backend (`npm run dev` à la racine, ou juste `npm run dev -w backend`).
3. `npm run mobile` (à la racine) ou `cd mobile && npx expo start` — un QR code s'affiche dans le terminal.
4. Scanner le QR code avec l'app **Expo Go** sur le téléphone.
5. Dans l'app, sur l'écran Accueil : vérifier l'adresse du backend, appuyer sur **"Tester la connexion"** — doit afficher "✅ Connexion réussie."
6. Appuyer sur **"Scanner un pari"**, prendre une photo ou choisir une image, **"Analyser le pari"** (mode mock — aucune vraie lecture, données simulées), vérifier/corriger sur l'écran de vérification, **"Enregistrer le pari"**.
7. Vérifier l'enregistrement avec `npm run db:studio` (Prisma Studio) sur le PC.

Si le téléphone et le PC ne sont pas sur le même réseau (ou Wi-Fi qui bloque la découverte), utiliser `npx expo start --tunnel` depuis `mobile/` (plus lent, mais fonctionne à travers les réseaux séparés).

## Structure du projet

```
PariStats/
  mobile/          Expo + React Native + TypeScript — frontend principal (Android uniquement)
    src/screens/    Accueil, Scanner, Vérification (autres écrans à venir)
    src/navigation/ React Navigation (stack)
    src/api/        client HTTP vers le backend
    src/config/     résolution de l'URL du backend (env + override AsyncStorage)
  frontend/        React + TypeScript + Vite + Tailwind (thème sombre) — conservé pour dev/debug backend
  backend/         Node + Express + TypeScript, API REST
    prisma/        schema, migrations, seed
    src/routes/     endpoints Express
    src/services/   logique métier (agrégations, calculs, analyse IA)
    src/middleware/ upload d'images, gestion d'erreurs
    src/config/     stockage local des captures
    src/db/         client Prisma
    uploads/bets/   captures enregistrées (ignoré par git)
  shared/types/     types TypeScript partagés entre mobile/frontend/backend (@paristats/shared)
```

## Modèle de données

Trois modèles Prisma séparés : `Bet`, `BetSelection`, `BankrollTransaction`.

Règles de calcul d'un pari réglé :
- **Gagné** : `totalReturn = mise × cote totale`, `actualProfit = totalReturn - stake`
- **Perdu** : `actualProfit = -stake`
- **Annulé** : `actualProfit = 0` (mise remboursée)
- **En attente** : tous les champs de résultat restent `null`

La **bankroll** = dépôts − retraits + bénéfice net des paris **réglés** (le retour total n'est pas utilisé directement, seul le profit/perte compte). Le **ROI** est calculé sur les mises des paris réglés uniquement (pas les mises encore en jeu sur des paris en attente).

## Fonctionnement de l'analyse IA

Workflow : import de capture → `POST /api/ai/analyze` → service isolé `backend/src/services/aiAnalysis.ts` → Claude Vision (SDK officiel Anthropic, appel via un *tool use* forcé pour garantir un JSON structuré) → validation stricte avec Zod (`backend/src/services/aiSchema.ts`) → écran de vérification côté frontend → `POST /api/bets` uniquement après validation/correction humaine. **Aucun pari n'est jamais enregistré automatiquement.**

Chaque champ extrait a une valeur (`value`, `null` si non lisible) et un score de confiance (`confidence`, 0 à 1) affiché dans l'interface (🟢 ≥ 0.90, 🟠 0.70-0.89, 🔴 < 0.70 ou valeur manquante). Claude ne doit jamais inventer une donnée ni recommander un pari (voir le prompt système dans `backend/src/services/aiPrompt.ts`).

**Mode mock** : tant que `ANTHROPIC_API_KEY` est vide dans `backend/.env`, l'analyse utilise un générateur simulé (`backend/src/services/aiMock.ts`) — aucun appel réseau, aucune clé requise. Utile pour développer/tester l'interface sans capture réelle. La réponse de `/api/ai/analyze` inclut `mode: "mock" | "claude"`, affiché en bandeau dans l'écran de vérification. Pour forcer un scénario précis en mode mock (tests) : `POST /api/ai/analyze?scenario=<nom>` avec `simple_won`, `simple_lost`, `combine_won`, `combine_pending`, `void`, `partial` (données partiellement illisibles), `invalid_response` (teste le rejet Zod) ou `ai_error` (teste la gestion d'erreur fournisseur). Dès qu'une vraie clé est renseignée, l'analyse bascule automatiquement sur Claude Vision, sans changement de code.

Les captures validées sont stockées localement dans `backend/uploads/bets/<id-du-pari>.<ext>` (jamais en base) et servies via `GET /uploads/bets/<fichier>`.

## Gestion de la base de données

SQLite pour cette première version (fichier `backend/prisma/dev.db`, ignoré par git). Le schema est conçu pour pouvoir migrer vers PostgreSQL plus tard en changeant uniquement le `provider` et la `DATABASE_URL` dans `schema.prisma`.
