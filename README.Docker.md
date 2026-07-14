# Frontend Docker — production

Image multi-stage : **Node 22** (build Vite) → **nginx 1.27** (fichiers statiques + reverse-proxy).

## Démarrage rapide

```bash
cd shambua-sante-frontend-ui
docker compose up -d --build
```

Ouvrir http://localhost:8080

## Variables Compose

| Variable | Défaut | Description |
|---|---|---|
| `FRONTEND_PORT` | `8080` | Port hôte |
| `BACKEND_UPSTREAM` | `host.docker.internal:8082` | Cible nginx pour `/api` et `/ws` |
| `VITE_API_BASE_URL` | `/api` | Bake-in build |
| `VITE_USE_LIVE_API` | `true` | Bake-in build |

Exemple avec backend Docker sur le même réseau :

```bash
BACKEND_UPSTREAM=backend:8082 FRONTEND_PORT=8080 docker compose up -d --build
```

## Build image seule

```bash
docker build -t shambua-sante-ui:latest \
  --build-arg VITE_API_BASE_URL=/api \
  --build-arg VITE_USE_LIVE_API=true \
  .
```

## Architecture nginx

- `/` → SPA (`try_files` → `index.html`)
- `/assets/` → cache immutable 1 an
- `/api/` → proxy vers `$BACKEND_UPSTREAM`
- `/ws` → WebSocket proxy

`BACKEND_UPSTREAM` est injecté via le template nginx officiel (`/etc/nginx/templates`).

## Santé

Healthcheck : `GET http://127.0.0.1/` dans le conteneur.
