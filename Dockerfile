# Dockerfile multi-stage para AutoCore Front
# Stage 1: build com Node 20 (LTS Iron, alinhado com .nvmrc)
# Stage 2: serve com nginx alpine

# ─── Stage 1: build ─────────────────────────────────────────────────────────
FROM node:20-alpine AS build
WORKDIR /app

# Aproveita cache de layer — instala deps antes de copiar o resto
COPY package.json package-lock.json ./
RUN npm ci --no-audit --no-fund

# Copia código e builda. VITE_API_BASE_URL precisa ser passada em build-time
# porque Vite resolve variáveis import.meta.env durante o build (não em
# runtime). Para produção: VITE_API_BASE_URL=https://api.suaempresa.com.br
ARG VITE_API_BASE_URL=http://localhost:5206
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL

COPY . .
RUN npm run build

# ─── Stage 2: runtime nginx ─────────────────────────────────────────────────
FROM nginx:alpine AS runtime

# Remove config default e copia a nossa (SPA fallback + headers de segurança)
RUN rm /etc/nginx/conf.d/default.conf
COPY nginx.conf /etc/nginx/conf.d/autocore.conf

# Bundle do Vite vai para /usr/share/nginx/html
COPY --from=build /app/dist /usr/share/nginx/html

# Healthcheck simples para orquestrador
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget --quiet --tries=1 --spider http://localhost/healthz || exit 1

EXPOSE 80

# nginx já é o ENTRYPOINT da imagem base — não sobrescrever
