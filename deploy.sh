#!/bin/bash

# Crypto Trader Deployment Script
# Usage: ./deploy.sh [command]
# Commands: start, stop, restart, logs, status, build, update

set -e

APP_NAME="crypto-trader"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

log_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if Docker is installed
check_docker() {
    if ! command -v docker &> /dev/null; then
        log_error "Docker is not installed. Please install Docker first."
        exit 1
    fi
    if ! command -v docker-compose &> /dev/null && ! docker compose version &> /dev/null; then
        log_error "Docker Compose is not installed. Please install Docker Compose first."
        exit 1
    fi
}

# Use docker compose v2 if available, otherwise docker-compose
docker_compose() {
    if docker compose version &> /dev/null; then
        docker compose "$@"
    else
        docker-compose "$@"
    fi
}

# Build the Docker image
build() {
    log_info "Building Docker image..."
    docker_compose build --no-cache
    log_info "Build complete!"
}

# Start the application
start() {
    log_info "Starting $APP_NAME..."
    
    # Create data directory if it doesn't exist
    mkdir -p "$SCRIPT_DIR/data"
    
    # Create paper trading data file if it doesn't exist
    if [ ! -f "$SCRIPT_DIR/paper-trading-data.json" ]; then
        echo '{"cash":10000,"positions":[],"closedTrades":[]}' > "$SCRIPT_DIR/paper-trading-data.json"
    fi
    
    # Ensure config.js exists as a file (not directory)
    if [ -d "$SCRIPT_DIR/config.js" ]; then
        log_warn "Found config.js directory instead of file - removing..."
        rm -rf "$SCRIPT_DIR/config.js"
    fi
    if [ ! -f "$SCRIPT_DIR/config.js" ]; then
        log_info "Creating config.js from default template..."
        cp "$SCRIPT_DIR/config.default.js" "$SCRIPT_DIR/config.js"
    fi
    
    docker_compose up -d
    
    log_info "$APP_NAME started!"
    log_info "Dashboard available at: http://localhost:3001"
    log_info "Use './deploy.sh logs' to view logs"
}

# Stop the application
stop() {
    log_info "Stopping $APP_NAME..."
    docker_compose down
    log_info "$APP_NAME stopped!"
}

# Restart the application
restart() {
    log_info "Restarting $APP_NAME..."
    stop
    start
}

# View logs
logs() {
    docker_compose logs -f
}

# Check status
status() {
    log_info "Checking $APP_NAME status..."
    docker_compose ps
    
    # Check if container is running
    if docker ps --filter "name=$APP_NAME" --format "{{.Names}}" | grep -q "$APP_NAME"; then
        log_info "Container is running"
        
        # Check health
        HEALTH=$(docker inspect --format='{{.State.Health.Status}}' $APP_NAME 2>/dev/null || echo "unknown")
        log_info "Health status: $HEALTH"
        
        # Try to get bot status
        if command -v curl &> /dev/null; then
            BOT_STATUS=$(curl -s http://localhost:3001/api/bot/status 2>/dev/null || echo '{"running":false}')
            if echo "$BOT_STATUS" | grep -q '"running":true'; then
                log_info "Trading bot: RUNNING"
            else
                log_info "Trading bot: STOPPED"
            fi
        fi
    else
        log_warn "Container is not running"
    fi
}

# Update and restart
update() {
    log_info "Updating $APP_NAME..."
    
    # Pull latest code (if using git)
    if [ -d ".git" ]; then
        log_info "Pulling latest code..."
        git pull
    fi
    
    # Rebuild and restart
    build
    restart
    
    log_info "Update complete!"
}

# Show help
show_help() {
    echo "Crypto Trader Deployment Script"
    echo ""
    echo "Usage: ./deploy.sh [command]"
    echo ""
    echo "Commands:"
    echo "  start     Start the trading bot and dashboard"
    echo "  stop      Stop all services"
    echo "  restart   Restart all services"
    echo "  logs      View live logs"
    echo "  status    Check service status"
    echo "  build     Build Docker image (no cache)"
    echo "  update    Pull latest code, rebuild, and restart"
    echo ""
    echo "Examples:"
    echo "  ./deploy.sh start    # Start the bot"
    echo "  ./deploy.sh logs     # Watch live logs"
    echo "  ./deploy.sh stop     # Stop everything"
}

# Main
cd "$SCRIPT_DIR"
check_docker

case "${1:-help}" in
    start)
        start
        ;;
    stop)
        stop
        ;;
    restart)
        restart
        ;;
    logs)
        logs
        ;;
    status)
        status
        ;;
    build)
        build
        ;;
    update)
        update
        ;;
    help|--help|-h)
        show_help
        ;;
    *)
        log_error "Unknown command: $1"
        show_help
        exit 1
        ;;
esac
