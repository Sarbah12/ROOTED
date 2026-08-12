# Build for the Rooted backend.
#
# Only backend/ is copied in. Without this, the platform's auto-detection reads
# the Expo app at the repository root, decides this is a static web build, and
# then fails looking for a dist/ directory that a server never produces.

FROM node:22-slim

ENV NODE_ENV=production
WORKDIR /app

# Manifests first, so the dependency layer is reused when only server code
# changes.
COPY backend/package.json backend/package-lock.json ./
RUN npm ci --omit=dev

COPY backend/ ./

# The host assigns PORT at runtime; this is documentation, not a binding.
EXPOSE 3333

CMD ["node", "server.mjs"]
