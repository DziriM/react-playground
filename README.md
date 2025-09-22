# React Playground

Prototype fullstack : **BFF .NET 8** + **Frontend React 18 (TypeScript)** avec **SignalR** (streaming temps-réel).  
Intègre des APIs publiques (EUR→USD, CoinGecko, RestCountries) et expose des endpoints proxy côté BFF pour éviter les problèmes CORS.

> Short: démonstration BFF → Front (REST + realtime), patterns BFF, React Query, SignalR, CI.

---

## Tech & versions

- .NET SDK : **8.x** (net8.0)
- Node.js : **18.x** recommandé
- npm : fournie avec Node 18+
- Frontend : React 18, Vite, TypeScript, React Query, @microsoft/signalr
- Tests : Vitest (frontend), xUnit (backend si ajouté)
- CI : GitHub Actions (workflow sous `.github/workflows/ci.yml`)

---

## Structure du repo

- `/backend` → ASP.NET Core minimal API + SignalR hub + endpoints proxy
- `/frontend` → Vite React 18 + TypeScript, composants : `SignalStream`, `StatsPanel`, `FrancePanel`
- `.github/...` → workflows CI

---

## Quickstart (local — pas de déploiement nécessaire)

### Prérequis

- .NET 8 SDK installé (`dotnet --list-sdks` doit mentionner `8.x`)
- Node 18+ (`node -v`)
- npm (`npm -v`)

### 1. Cloner & installer

```bash
git clone https://github.com/<TON-PSEUDO>/react-playground.git
cd react-playground
```

### 2. Lancer le backend (.NET)

```bash
cd backend
dotnet restore
dotnet run --urls http://localhost:5000
```

Le backend expose :

- GET http://localhost:5000/api/stats
- proxy : GET http://localhost:5000/api/proxy/btc et GET http://localhost:5000/api/proxy/france
- SignalR hub : http://localhost:5000/hub/stream

### 3. Lancer le frontend (Vite)

```bash
cd frontend
npm install
npm run dev
```

Ouvre ensuite : http://localhost:5173

Remarque : le frontend utilise une configuration de proxy Vite pour rediriger /api et /hub vers http://localhost:5000 (websocket ws activé).

### Commandes utiles

- Frontend

```bash
cd frontend
npm install
npm run dev        # dev server
npm run build      # build production
npm test           # lance Vitest (tests unitaires)
```

- Backend

```bash
cd backend
dotnet restore
dotnet build
dotnet run         # lance l'API
dotnet test        # si des tests xUnit sont présents
```

- Git / CI

```bash
git add .
git commit -m "..."
git push origin main
# après un push, GitHub Actions (/.github/workflows/ci.yml) s'exécutera si présent
```
