# Multi-stage build for the Tidal Wordle Socket.IO server.
# Build context is `tidal-wordle/` so the compiler can see both server/ and
# the sibling shared/ folder.

FROM node:20-alpine AS build
WORKDIR /app
COPY server/package*.json ./server/
RUN cd server && npm ci
COPY server/ ./server/
COPY shared/ ./shared/
RUN cd server && npm run build

FROM node:20-alpine AS runtime
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=8080
COPY server/package*.json ./server/
RUN cd server && npm ci --omit=dev
COPY --from=build /app/server/dist ./server/dist
WORKDIR /app/server
EXPOSE 8080
CMD ["node", "dist/server/src/index.js"]
