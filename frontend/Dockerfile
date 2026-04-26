# ============================================================
# Frontend — React + Vite
# Multi-stage: development | builder | production (Nginx)
# ============================================================

# ---------- Etapa: Desarrollo (docker-compose local) ----------
FROM node:20-alpine AS development

WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
EXPOSE 5173
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0"]


# ---------- Etapa: Build de producción ----------
FROM node:20-alpine AS builder

WORKDIR /app

# Recibimos VITE_API_URL como build arg para que se inyecte en el bundle
ARG VITE_API_URL
ENV VITE_API_URL=$VITE_API_URL

COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build


# ---------- Etapa: Producción con Nginx ----------
FROM nginx:stable-alpine AS production

COPY --from=builder /app/dist /usr/share/nginx/html

# Configuración de Nginx para SPA (React Router) + puerto dinámico de Railway
RUN echo 'server { \
    listen $PORT; \
    location / { \
        root /usr/share/nginx/html; \
        try_files $uri $uri/ /index.html; \
    } \
}' > /etc/nginx/templates/default.conf.template

# Railway asigna el puerto vía $PORT — Nginx debe escucharlo
ENV PORT=80
EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]