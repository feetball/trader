# Contributing to Crypto Momentum Trader

Thank you for your interest in contributing! This document provides guidelines for contributing to this project.

## Code of Conduct

Be respectful and constructive. We're all here to learn and build something useful.

## How to Contribute

### Reporting Bugs

1. Check if the bug has already been reported in Issues
2. If not, create a new issue with:
   - Clear, descriptive title
   - Steps to reproduce
   - Expected vs actual behavior
   - Screenshots if applicable
   - Your environment (OS, Node version, Docker version)

### Suggesting Features

1. Check existing issues for similar suggestions
2. Create a new issue with:
   - Clear description of the feature
   - Use case / why it would be helpful
   - Possible implementation approach

### Pull Requests

1. **Fork the repository**

2. **Create a feature branch**
   ```bash
   git checkout -b feature/your-feature-name
   ```

3. **Make your changes**
   - Follow existing code style
   - Add comments for complex logic
   - Update documentation if needed

4. **Test your changes**
   ```bash
   # Build and run with Docker
   ./deploy.sh update
   
   # Check logs for errors
   ./deploy.sh logs
   ```

5. **Commit with clear messages**
   ```bash
   git commit -m "feat: add new indicator XYZ"
   ```
   
   Use conventional commit prefixes:
   - `feat:` - New feature
   - `fix:` - Bug fix
   - `docs:` - Documentation
   - `style:` - Formatting, no code change
   - `refactor:` - Code restructuring
   - `test:` - Adding tests
   - `chore:` - Maintenance

6. **Push and create PR**
   ```bash
   git push origin feature/your-feature-name
   ```

## Development Setup

### Prerequisites
- Node.js 20+
- Docker & Docker Compose
- Git

### Local Development
```bash
# Clone your fork
git clone https://github.com/YOUR-USERNAME/trader.git
cd trader

# Install dependencies
npm install
cd frontend && npm install && cd ..

# Start development servers
npm run server      # Terminal 1: API server
npm run dashboard   # Terminal 2: Frontend dev server
```

### Docker Development
```bash
# Build and start
./deploy.sh update

# View logs
./deploy.sh logs -f

# Shell into container
./deploy.sh shell
```

## Project Structure

```
trader/
├── server.js           # Express API + WebSocket
├── bot-daemon.js       # Background trading bot
├── market-scanner.js   # Market analysis
├── trading-strategy.js # Buy/sell logic
├── indicators.js       # Technical indicators
├── config.js           # Configuration
├── frontend/
│   └── src/
│       ├── views/      # Page components
│       ├── composables/ # Shared state
│       └── router/     # Vue Router
└── docker-compose.yml
```

## Coding Guidelines

### JavaScript
- Use ES modules (`import/export`)
- Use `const` by default, `let` when needed
- Async/await over raw promises
- Meaningful variable names

### Vue Components
- Use Composition API with `<script setup>`
- Props and emits should be typed
- Keep components focused and small

### CSS
- Use Vuetify classes when possible
- Scoped styles for component-specific CSS

## Questions?

Feel free to open an issue for any questions about contributing.
