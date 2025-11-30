# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.3.0] - 2025-11-30

### Added
- **Help & Info page** - Dedicated help page with documentation, architecture, and usage guide
- **Help nav menu item** - Quick access to help from navigation drawer
- **Traditional log ordering** - Logs now display chronologically (oldest first, newest at bottom)
- **Startup banner** - Comprehensive console banner with app info, architecture, and settings
- **Auto-scroll logs** - Logs page auto-scrolls to latest entries

### Changed
- Updated README.md with current features and architecture
- Improved log display with "newest at bottom" indicator

## [1.2.0] - 2025-11-30

### Added
- **RSI Indicator** - Relative Strength Index filter to avoid overbought coins (>75)
- **Volume Surge Detection** - Confirms momentum with unusual volume spikes
- **Trade Grading System** - A-F quality scores for trade setups
- **Technical Indicators Module** (`indicators.js`) - RSI, VWAP, ATR calculations
- **Enhanced logging** - Trade grades and signal details in logs

### Changed
- Improved market scanner with RSI and volume checks
- Trading strategy now rejects Grade D/F trades
- Updated profit target to 2% and stop loss to -3%
- Momentum threshold lowered to 1.5% for more opportunities

## [1.1.0] - 2025-11-29

### Added
- **Multi-page dashboard** - Vue Router with 6 dedicated pages
- **Navigation drawer** - Collapsible sidebar with page links
- **Overview page** - Portfolio summary with recent activity
- **Bot Status page** - Control panel and live status
- **Performance page** - Profit/loss analytics by coin
- **Trade History page** - Complete trade log with filters
- **Activity page** - Timeline of trading events
- **Logs page** - Searchable bot logs with filters
- **Settings persistence** - Config saved via Docker volume mount
- **Local timezone** - Docker container uses host timezone

### Changed
- Refactored frontend to use Vue Router
- Created shared composables for state management
- Improved WebSocket real-time updates

## [1.0.0] - 2025-11-29

### Added
- Initial release
- Momentum-based trading strategy
- Paper trading with $10,000 virtual portfolio
- Real-time WebSocket price feeds from Coinbase
- Vue 3 + Vuetify 3 dashboard
- Docker containerization
- Position management with profit targets and stop losses
- Trailing profit feature
- Trade history and analytics
