# syntax=docker/dockerfile:1.7

############################################################
# Stage 1 — build Vite
############################################################
FROM node:22-alpine AS build
WORKDIR /app

COPY package.json package-lock.json* pnpm-lock.yaml* ./
RUN if [ -f package-lock.json ]; then npm ci; \
    elif [ -f pnpm-lock.yaml ]; then npm install -g pnpm && pnpm install --frozen-lockfile; \
    else npm install; fi

COPY index.html vite.config.js ./
COPY public ./public
COPY src ./src

# Variables bake-in au build (chemins relatifs recommandés derrière nginx)
ARG VITE_API_BASE_URL=/api
ARG VITE_WS_URL=
ARG VITE_USE_LIVE_API=true
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL \
    VITE_WS_URL=$VITE_WS_URL \
    VITE_USE_LIVE_API=$VITE_USE_LIVE_API

RUN npm run build

############################################################
# Stage 2 — nginx (SPA + reverse-proxy API/WS)
############################################################
FROM nginx:1.27-alpine AS runtime

LABEL org.opencontainers.image.title="Shambua Santé UI" \
      org.opencontainers.image.description="Frontend React / Vite — production nginx" \
      org.opencontainers.image.vendor="Shambua Santé"

# Backend joignable depuis le conteneur (service Docker ou host)
ENV BACKEND_UPSTREAM=host.docker.internal:8082

COPY docker/nginx.conf /etc/nginx/conf.d/default.conf
COPY docker/nginx-upstream.conf.template /etc/nginx/templates/00-upstream.conf.template
COPY --from=build /app/dist /usr/share/nginx/html

# Entrypoint officiel nginx génère /etc/nginx/conf.d depuis templates (envsubst)
EXPOSE 80

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget -qO- http://127.0.0.1/ || exit 1
