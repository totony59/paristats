# PariStats

Application personnelle de suivi et d'**analyse de l'historique** des paris sportifs football. Frontend principal : une **app Android** (Expo/React Native). Import de capture d'écran ou photo d'un ticket Betclic, analyse Claude Vision, suivi de bankroll et statistiques. Backend hébergé en permanence (indépendant du PC de l'utilisateur).

PariStats n'est pas un outil de pronostics : l'IA n'analyse que les données historiques de l'utilisateur, elle ne recommande jamais de pari à venir.

## Architecture hébergée

- **Backend** : [Render](https://render.com) (palier gratuit) — `https://paristats-backend.onrender.com`. Se met en veille après 15 min d'inactivité, ~1 min pour se réveiller au premier appel suivant (normal, pas un bug).
- **Base de données** : [Supabase](https://supabase.com) Postgres (palier gratuit). Le projet se met en pause après 7 jours d'inactivité — réveil manuel en un clic depuis le dashboard Supabase si besoin (aucune perte de données).
- **Code** : [github.com/totony59/paristats](https://github.com/totony59/paristats), déploiement automatique sur push vers `master`.
- **Captures d'écran** : jamais conservées. Elles ne servent qu'à l'analyse Claude Vision, ni stockées sur disque ni renvoyées au serveur à l'enregistrement.

## Installation (développement local)

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
| `DATABASE_URL` | Connexion Postgres (pooler transaction, ex. Supabase port 6543) |
| `DIRECT_URL` | Connexion Postgres directe, utilisée uniquement pour les migrations (ex. Supabase port 5432) |
| `PORT` | Port du serveur backend en local (défaut `3001`) |
| `ANTHROPIC_API_KEY` | Clé API Anthropic, backend uniquement, jamais exposée au frontend/mobile. **Laisser vide pour rester en mode mock** (voir plus bas). |
| `ANTHROPIC_MODEL` | Modèle Claude utilisé pour l'analyse vision (défaut `claude-sonnet-5`) |
| `AI_PROVIDER` | Optionnel : force `mock` ou `claude` sans toucher à la clé (repli rapide en cas de souci avec l'IA réelle) |
| `MAX_UPLOAD_MB` | Taille max d'une capture importée, en Mo (défaut `8`) |

Le développement local se connecte à la **même base Supabase** que la production (pas de base locale séparée) — les mêmes valeurs `DATABASE_URL`/`DIRECT_URL` sont utilisées en local et sur Render.

## Base de données

```bash
npm run db:migrate    # applique le schema Prisma (crée une nouvelle migration si le schema a changé)
npm run db:studio     # ouvre Prisma Studio pour inspecter les données
```

## Lancement (développement local)

```bash
npm run dev
```

Démarre en parallèle :
- le backend Express sur `http://localhost:3001`
- le frontend Vite sur `http://localhost:5173` (proxy `/api` vers le backend) — outil de dev/debug, pas le frontend principal

## Application Android (mobile/)

Frontend principal de PariStats. Écrans : **Accueil** (bankroll/bénéfice/ROI en un coup d'œil), **Scanner**, **Vérification**, **Mes paris**, **Détail d'un pari**, **Bankroll** (dépôts/retraits + graphique d'évolution), **Statistiques** (par type de pari et par compétition).

### Utilisation quotidienne (APK installé)

L'app pointe par défaut vers le backend hébergé (`https://paristats-backend.onrender.com`) — aucun PC requis. L'adresse est modifiable à tout moment depuis l'écran Accueil (champ + bouton "Enregistrer"), avec un bouton "Tester la connexion" pour vérifier.

### Développement (Expo Go)

1. Démarrer le backend en local (`npm run dev` à la racine) **ou** laisser `mobile/.env` pointer vers le backend hébergé.
2. `npm run mobile` (à la racine) ou `cd mobile && npx expo start` — un QR code s'affiche dans le terminal.
3. Scanner le QR code avec l'app **Expo Go** (Play Store) sur le téléphone.

Pour du dev 100% local (backend sur le PC), mettre dans `mobile/.env` l'IP locale du PC (`ipconfig` → carte Wi-Fi) au lieu de l'URL Render, téléphone et PC sur le même Wi-Fi.

### Build APK (EAS)

```bash
cd mobile
eas build --platform android --profile preview
```

Génère un APK à distribution interne (lien de téléchargement direct, pas de Play Store). Compte EAS : `anthonydbk`.

## Structure du projet

```
PariStats/
  mobile/          Expo + React Native + TypeScript — frontend principal (Android uniquement)
    src/screens/    Accueil, Scanner, Vérification, MesParis, BetDetail, Bankroll, Statistiques
    src/navigation/ React Navigation (tabs + stack)
    src/api/        client HTTP vers le backend
    src/config/     résolution de l'URL du backend (env + override AsyncStorage)
  frontend/        React + TypeScript + Vite + Tailwind (thème sombre) — outil de dev/debug backend
  backend/         Node + Express + TypeScript, API REST, hébergé sur Render
    prisma/        schema (Postgres), migrations
    src/routes/     endpoints Express (bets, bankroll, stats, ai, dashboard)
    src/services/   logique métier (agrégations, calculs, analyse IA)
    src/middleware/ upload d'images (en mémoire, jamais écrit sur disque), gestion d'erreurs
    src/db/         client Prisma
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

Workflow : import de capture → `POST /api/ai/analyze` → service isolé `backend/src/services/aiAnalysis.ts` → Claude Vision (SDK officiel Anthropic, appel via un *tool use* forcé pour garantir un JSON structuré) → validation stricte avec Zod (`backend/src/services/aiSchema.ts`) → écran de vérification côté mobile → `POST /api/bets` uniquement après validation/correction humaine. **Aucun pari n'est jamais enregistré automatiquement.**

Chaque champ extrait a une valeur (`value`, `null` si non lisible) et un score de confiance (`confidence`, 0 à 1) affiché dans l'interface (🟢 ≥ 0.90, 🟠 0.70-0.89, 🔴 < 0.70 ou valeur manquante). Claude ne doit jamais inventer une donnée ni recommander un pari (voir le prompt système dans `backend/src/services/aiPrompt.ts`).

**Mode mock** : tant que `ANTHROPIC_API_KEY` est vide (ou `AI_PROVIDER=mock`), l'analyse utilise un générateur simulé (`backend/src/services/aiMock.ts`) — aucun appel réseau, aucune clé requise. La réponse de `/api/ai/analyze` inclut `mode: "mock" | "claude"`, affiché en bandeau dans l'écran de vérification. Pour forcer un scénario précis en mode mock (tests) : `POST /api/ai/analyze?scenario=<nom>` avec `simple_won`, `simple_lost`, `combine_won`, `combine_pending`, `void`, `partial`, `invalid_response` ou `ai_error`.

**La capture n'est jamais conservée** : elle sert uniquement à l'analyse (lue en mémoire, jamais écrite sur disque), et n'est pas renvoyée au serveur à l'étape d'enregistrement.

## Gestion de la base de données

Postgres (Supabase). Le schema est provider-agnostic côté code — changer d'hébergeur Postgres ne demande qu'un changement de `DATABASE_URL`/`DIRECT_URL`.
