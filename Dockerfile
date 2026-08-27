# ── Build ─────────────────────────────────────────────────────────────────────
FROM node:22-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npx ng build --configuration production

# ── Serve ─────────────────────────────────────────────────────────────────────
FROM nginx:alpine
COPY docker/nginx/default.conf /etc/nginx/conf.d/default.conf
COPY --from=builder /app/dist/mitoera-ui/browser /usr/share/nginx/html
