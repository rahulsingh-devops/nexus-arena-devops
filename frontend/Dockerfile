# ---- Stage 1: Build ----
FROM node:20-alpine AS builder
WORKDIR /app

COPY package.json package-lock.json* ./
RUN npm ci --ignore-scripts

COPY . .
RUN npm run build

# ---- Stage 2: Serve ----
FROM nginx:1.29-alpine AS production

RUN apk upgrade --no-cache

# Copy custom nginx config
COPY --from=builder /app/dist /usr/share/nginx/html

# Custom NGINX config for SPA routing + proxy
RUN cat > /etc/nginx/conf.d/default.conf << 'EOF'
server {
    listen 5173;
    server_name _;
    root /usr/share/nginx/html;
    index index.html;

    # Gzip
    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml text/javascript image/svg+xml;
    gzip_min_length 1000;

    # Cache static assets
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
        try_files $uri =404;
    }

    # SPA fallback
    location / {
        try_files $uri $uri/ /index.html;
    }

    # Health check
    location /nginx-health {
        access_log off;
        return 200 "ok";
        add_header Content-Type text/plain;
    }
}
EOF

EXPOSE 5173

CMD ["nginx", "-g", "daemon off;"]
