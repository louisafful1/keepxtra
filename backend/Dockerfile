# syntax=docker/dockerfile:1

# ---------- deps: install full dependency tree (needed to compile TS) ----------
FROM node:20-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

# ---------- build: compile TypeScript -> dist/ ----------
FROM node:20-alpine AS build
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

# ---------- prod-deps: install production-only dependencies ----------
FROM node:20-alpine AS prod-deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --omit=dev

# ---------- runtime: minimal final image ----------
FROM node:20-alpine AS runtime
ENV NODE_ENV=production
WORKDIR /app

# The official node:alpine image already ships a non-root `node` user (uid 1000).
COPY --from=prod-deps --chown=node:node /app/node_modules ./node_modules
COPY --from=build --chown=node:node /app/dist ./dist
COPY --chown=node:node package.json ./

USER node
EXPOSE 4000

# Uses Node itself rather than curl/wget so nothing extra needs installing in
# the minimal alpine image.
HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
  CMD node -e "require('http').get({host:'127.0.0.1',port:process.env.PORT||4000,path:'/health',timeout:4000},res=>process.exit(res.statusCode===200?0:1)).on('error',()=>process.exit(1))"

CMD ["node", "dist/server.js"]
