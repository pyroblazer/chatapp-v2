# --- Development stage ---
FROM node:18.20-alpine AS development
WORKDIR /app
COPY package.json yarn.lock* ./
RUN if [ -f yarn.lock ]; then yarn install --frozen-lockfile; else yarn install; fi
COPY . .
EXPOSE 3000
CMD ["yarn", "start:dev"]

# --- Build stage ---
FROM node:18.20-alpine AS build
WORKDIR /app
COPY package.json yarn.lock* ./
RUN if [ -f yarn.lock ]; then yarn install --frozen-lockfile; else yarn install; fi
COPY . .
RUN yarn build

# --- Production stage (serve static files with nginx) ---
FROM nginx:1.27-alpine AS production
COPY --from=build /app/dist /usr/share/nginx/html
# SPA fallback config — the main nginx reverse proxy handles /api and /socket.io routing
RUN printf 'server {\n\
    listen 80;\n\
    server_name _;\n\
    root /usr/share/nginx/html;\n\
    index index.html;\n\
\n\
    location / {\n\
        try_files $uri $uri/ /index.html;\n\
    }\n\
\n\
    location /assets/ {\n\
        expires 1y;\n\
        add_header Cache-Control "public, immutable";\n\
    }\n\
}\n' > /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
