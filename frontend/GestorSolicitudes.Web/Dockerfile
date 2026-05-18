# ── Stage 1: Build Angular ────────────────────────────────────────────────────
FROM node:22-alpine AS build

WORKDIR /app

# Instala pnpm
RUN npm install -g pnpm

# Copia manifiestos e instala dependencias
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --ignore-scripts && \
    pnpm rebuild esbuild @parcel/watcher

# Copia el resto del proyecto y compila en modo producción
COPY . .
RUN ./node_modules/.bin/ng build

# ── Stage 2: Serve con Nginx ──────────────────────────────────────────────────
FROM nginx:alpine

# Copia los archivos estáticos generados por Angular
COPY --from=build /app/dist/GestorSolicitudes.Web/browser /usr/share/nginx/html

# Copia la configuración de Nginx
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
