# Shambua Santé — Frontend (React + Vite)

Interface web multi-tenant pour **Shambua Santé / Hospicloud**.

## Prérequis

- Node.js 20+ (recommandé 22)
- Backend Hospicloud sur le port **8082** (dev) ou conteneur Docker

## Développement

```bash
cp .env.example .env
npm install
npm run dev
```

- PC : http://localhost:5173  
- Mobile (HTTPS caméra) : `npm run dev:mobile` → port 5174  

Le proxy Vite envoie `/api` et `/ws` vers `http://127.0.0.1:8082`.

## Build production (statique)

```bash
cp .env.production.example .env.production
npm run build
npm run preview
```

Artefacts dans `dist/`. Les variables `VITE_*` sont figées **au build**.

## Docker (nginx + reverse-proxy)

```bash
docker compose up -d --build
```

UI : http://localhost:8080  

Par défaut, nginx proxyfie `/api` et `/ws` vers `host.docker.internal:8082` (backend sur l’hôte).  
Pour un service Docker nommé `backend` :

```bash
BACKEND_UPSTREAM=backend:8082 docker compose up -d --build
```

Détails : [README.Docker.md](./README.Docker.md)

## Variables d’environnement

| Variable | Rôle | Défaut |
|---|---|---|
| `VITE_API_BASE_URL` | Préfixe HTTP API | `/api` |
| `VITE_WS_URL` | Base WebSocket (vide = relatif `/ws`) | vide |
| `VITE_USE_LIVE_API` | API réelle vs mocks | `true` |

## Repo backend

API : https://github.com/josehemedi/shambuasante02
