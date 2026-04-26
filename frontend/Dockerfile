# ============================================================
# Frontend — React + Vite — Railway-ready
# ============================================================

# ---------- Etapa: Build ----------
FROM node:20-alpine AS builder

WORKDIR /app

# Build arg que se inyecta al bundle de Vite
ARG VITE_API_URL
ENV VITE_API_URL=$VITE_API_URL

# Instalar dependencias (cache eficiente)
COPY package*.json ./
RUN npm ci

# Copiar código y construir
COPY . .
RUN npm run build


# ---------- Etapa: Servir con Nginx ----------
FROM nginx:stable-alpine AS production

# Copiar el build estático
COPY --from=builder /app/dist /usr/share/nginx/html

# Plantilla de configuración de Nginx con SPA fallback.
# Usamos $PORT (Railway lo inyecta en runtime) — envsubst lo expande al iniciar.
RUN rm /etc/nginx/conf.d/default.conf
COPY <<'EOF' /etc/nginx/templates/default.conf.template
server {
    listen ${PORT};
    server_name _;

    root /usr/share/nginx/html;
    index index.html;

    # Cache largo para assets con hash
    location /assets/ {
        expires 1y;
        add_header Cache-Control "public, immutable";
        try_files $uri =404;
    }

    # SPA fallback: todo lo que no sea archivo va a index.html
    location / {
        try_files $uri $uri/ /index.html;
    }

    # Compresión
    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript;
}
EOF

# Railway define $PORT — fallback a 80 si corre fuera de Railway
ENV PORT=80
EXPOSE 80

# La imagen oficial de nginx ya hace `envsubst` sobre /etc/nginx/templates/*.template
# y mete los resultados en /etc/nginx/conf.d/ al iniciar. Solo hay que pasarle qué vars expandir.
ENV NGINX_ENVSUBST_TEMPLATE_DIR=/etc/nginx/templates
ENV NGINX_ENVSUBST_OUTPUT_DIR=/etc/nginx/conf.d
ENV NGINX_ENVSUBST_FILTER='\$\{PORT\}'

CMD ["nginx", "-g", "daemon off;"]