# syntax=docker/dockerfile:1.6

# ---- Build stage -----------------------------------------------------------
FROM node:20-alpine AS build
WORKDIR /workspace

ARG VITE_API_BASE_URL=http://localhost:8080/api
ARG VITE_CONTRACT_ADDRESS=
ARG VITE_CHAIN_ID=31337
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL \
    VITE_CONTRACT_ADDRESS=$VITE_CONTRACT_ADDRESS \
    VITE_CHAIN_ID=$VITE_CHAIN_ID

COPY package.json package-lock.json* ./
RUN npm ci --no-audit --no-fund

COPY . .
RUN npm run build

# ---- Runtime stage ---------------------------------------------------------
FROM nginx:1.27-alpine

# Drop the default config and replace with our SPA-aware one.
RUN rm /etc/nginx/conf.d/default.conf
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /workspace/dist /usr/share/nginx/html

# nginx:alpine already includes a `nginx` user — we just make sure it can
# read the assets it serves and switch off the privileged master process.
RUN chown -R nginx:nginx /usr/share/nginx/html \
 && touch /var/run/nginx.pid \
 && chown -R nginx:nginx /var/run/nginx.pid /var/cache/nginx

USER nginx
EXPOSE 80

HEALTHCHECK --interval=15s --timeout=3s --start-period=10s --retries=3 \
  CMD wget -qO- http://localhost/healthz || exit 1
