# --- build the static React app ---
FROM node:22-alpine AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
# Baked into the build, not read at container start — see
# ARCHITECTURE_DECISIONS.md "Kiosk identity is a build-time value" for why.
# Defaults to kiosk1, matching lib/kiosk.ts's own fallback; override with
# --build-arg VITE_KIOSK_ID=kiosk2 to build a second terminal's image.
ARG VITE_KIOSK_ID=kiosk1
ENV VITE_KIOSK_ID=$VITE_KIOSK_ID
RUN npm run build

# --- serve it behind NGINX, which also reverse-proxies /api/* ---
FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
