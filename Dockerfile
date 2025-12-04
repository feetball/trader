# Build stage for frontend
FROM node:20-alpine AS frontend-build
WORKDIR /app/frontend
COPY frontend/package*.json ./
RUN npm ci
COPY frontend/ ./
RUN npm run build

# Production stage
FROM node:20-alpine
WORKDIR /app

# Install git for in-app updates
RUN apk add --no-cache git

# Copy backend files
COPY package*.json ./
RUN npm ci --only=production

COPY *.js ./
COPY config.js ./

# Copy full frontend (source + built dist) for in-app updates
COPY frontend/ ./frontend/
COPY --from=frontend-build /app/frontend/dist ./frontend/dist
COPY --from=frontend-build /app/frontend/node_modules ./frontend/node_modules

# Initialize git repo for updates (will be overwritten if volume mounted)
COPY .git/ ./.git/

# Expose port
EXPOSE 3001

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3001/api/bot/status || exit 1

# Start the server
CMD ["node", "server.js"]
