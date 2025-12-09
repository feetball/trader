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
COPY config.default.js ./

# Copy full frontend (source + built dist) for in-app updates
COPY frontend/ ./frontend/
COPY --from=frontend-build /app/frontend/dist ./frontend/public
COPY --from=frontend-build /app/frontend/node_modules ./frontend/node_modules

# Create default paper-trading-data.json (will be overwritten by volume if mounted)
RUN echo '{"cash":10000,"positions":[],"closedTrades":[]}' > /app/paper-trading-data.json

# Create config.js from default template at build time (for safety)
# This ensures config.js exists as a file, never as a directory
RUN cp /app/config.default.js /app/config.js

# Initialize git repo for in-app updates (clone fresh if .git not available)
RUN git init && \
    git remote add origin https://github.com/feetball/trader.git && \
    git fetch origin master --depth=1 && \
    git reset --soft origin/master

# Expose port
EXPOSE 3001

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3001/api/bot/status || exit 1

# Start the server
CMD ["node", "server.js"]
