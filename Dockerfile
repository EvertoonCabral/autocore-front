# Dockerfile multi-stage para AutoCore Front
# Stage 1: build com Node 20 (LTS Iron, alinhado com .nvmrc)
# Stage 2: serve com nginx alpine

# ─── Stage 1: build ─────────────────────────────────────────────────────────
FROM node:20-alpine AS build
WORKDIR /app

# Aproveita cache de layer — instala deps antes de copiar o resto
COPY package.json package-lock.json ./
RUN npm ci --no-audit --no-fund

# Copia código e builda. VITE_API_BASE_URL é resolvida em build-time (Vite
# congela import.meta.env no bundle). Default VAZIO = topologia same-origin:
# o app chama /api/... relativo e o nginx faz proxy (ver nginx.conf.template).
# Para front e API em domínios distintos: VITE_API_BASE_URL=https://api.exemplo.com.
ARG VITE_API_BASE_URL=""
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL

COPY . .
RUN npm run build

# ─── Stage 2: runtime nginx ─────────────────────────────────────────────────
FROM nginx:alpine AS runtime

# O nginx:alpine processa /etc/nginx/templates/*.template via envsubst no boot,
# substituindo só as env vars definidas (API_UPSTREAM) — variáveis internas do
# nginx ($uri, $host, ...) ficam intactas. Gera /etc/nginx/conf.d/default.conf.
COPY nginx.conf.template /etc/nginx/templates/default.conf.template

# Destino do proxy /api. Sobrescreva no orquestrador (compose/ECS/k8s) com o
# endereço real da API (ex.: back:8080, api.internal:8080).
ENV API_UPSTREAM="back:8080"

# Bundle do Vite vai para /usr/share/nginx/html
COPY --from=build /app/dist /usr/share/nginx/html

# Healthcheck simples para orquestrador
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget --quiet --tries=1 --spider http://localhost/healthz || exit 1

EXPOSE 80

# nginx já é o ENTRYPOINT da imagem base — não sobrescrever
