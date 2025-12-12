# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.8.0] - 2025-12-08

### Changed - MAJOR FRONTEND MIGRATION
- **Frontend rewrite** - Next.js + React + Tailwind CSS dashboard
- **Component library** - Custom Tailwind CSS components
- **State management** - React Context API with hooks
- **Routing** - Next.js file-based App Router
- **Build system** - Next.js static export
- **Styling** - Tailwind CSS utility classes
- **Icon library** - Replaced MDI icons with Lucide React icons

### Added
- Next.js 14+ with App Router and TypeScript support
- React 18 with modern hooks and context API
- Tailwind CSS 3 with custom dark theme configuration
- Comprehensive frontend documentation in frontend/README.md
- Updated dashboard documentation
- Index files for cleaner imports from components, hooks, and lib

### Removed
- Legacy frontend dependencies and build tooling

### Maintained
- All trading logic and API integration
- WebSocket real-time updates (unchanged)
- Settings management with history tracking
- Import/export functionality
- Paper trading mode
- All 8 dashboard pages with same functionality

### Fixed
- Improved state management with React hooks
- Better TypeScript type safety throughout
- Mobile responsive design with Tailwind CSS
- Cleaner component architecture

## [0.7.9] - 2025-12-08

### Added
- **JSON Import/Export for Settings** - Added "Import Settings" and "Export Settings" buttons to the Settings page
- Users can now backup and restore complete bot configurations via JSON files
- Exported files include timestamp in filename for easy organization
- Import feature includes validation and security filtering to prevent malicious input
- Success/error notifications with specific feedback messages

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
- **Multi-page dashboard** - 6 dedicated pages
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
- Refactored dashboard routing and state management
- Improved WebSocket real-time updates

## [1.0.0] - 2025-11-29

### Added
- Initial release
- Momentum-based trading strategy
- Paper trading with $10,000 virtual portfolio
- Real-time WebSocket price feeds from Coinbase
- Web dashboard
- Docker containerization
- Position management with profit targets and stop losses
- Trailing profit feature
- Trade history and analytics
