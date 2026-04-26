# ============================================================
# Frontend — React + Vite — Railway (Plan B simple)
# ============================================================

# ---------- Etapa: Build ----------
FROM node:20-alpine AS builder

WORKDIR /app

ARG VITE_API_URL
ENV VITE_API_URL=$VITE_API_URL

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build


# ---------- Etapa: Servir con Nginx ----------
FROM nginx:stable-alpine AS production

# Copiar el build estático
COPY --from=builder /app/dist /usr/share/nginx/html

# Config de nginx con un placeholder __PORT__ que sustituimos en runtime.
RUN rm /etc/nginx/conf.d/default.conf

RUN cat > /etc/nginx/conf.d/default.conf.tpl << 'EOF'
server {
    listen __PORT__;
    server_name _;

    root /usr/share/nginx/html;
    index index.html;

    location /assets/ {
        expires 1y;
        add_header Cache-Control "public, immutable";
        try_files $uri =404;
    }

    location / {
        try_files $uri $uri/ /index.html;
    }

    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript;
}
EOF

ENV PORT=80
EXPOSE 80

# Al iniciar: sustituir __PORT__ por el valor real de $PORT y arrancar nginx.
CMD sh -c "sed \"s/__PORT__/$PORT/g\" /etc/nginx/conf.d/default.conf.tpl > /etc/nginx/conf.d/default.conf && nginx -g 'daemon off;'"