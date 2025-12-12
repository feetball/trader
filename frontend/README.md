# Trader Dashboard (Next.js Frontend)

Modern React + Next.js dashboard for the Crypto Momentum Trading Bot, styled with Tailwind CSS.

## Tech Stack

- **Framework**: Next.js 14+ with App Router
- **UI Library**: React 18+
- **Styling**: Tailwind CSS 3+
- **Icons**: Lucide React
- **HTTP Client**: Axios
- **State Management**: React Context API
- **Real-time**: WebSocket

## Features

### Pages
- **Overview** (`/`): Portfolio stats, open positions, recent trades
- **Bot Status** (`/bot-status`): Control panel, bot state, recent logs
- **Performance** (`/performance`): Profit/loss analytics by coin
- **Trade History** (`/trades`): Complete trade history with filters
- **Activity** (`/activity`): Timeline of all trading events
- **Logs** (`/logs`): Full bot output with search and filtering
- **Settings** (`/settings`): Configuration, import/export, history
- **Help** (`/help`): Documentation and quick start guide

### UI Components
- **Card**: Container component with optional title
- **Chip**: Badge/tag component with colors
- **Button**: Primary/secondary buttons with loading states
- **Sidebar**: Responsive navigation with mobile menu
- **AppBar**: Header with bot status and controls

## Development

### Install Dependencies
```bash
cd frontend
npm install
```

### Run Development Server
```bash
npm run dev
```
Visit `http://localhost:3000`

### Build for Production
```bash
npm run build
npm start
```

## Environment

The frontend connects to the backend API:
- **Development**: `http://localhost:3001/api`
- **Production**: `/api` (relative)

WebSocket:
- **Development**: `ws://localhost:3001`
- **Production**: `wss://` (relative to current host)

## API Integration

The frontend uses a custom `useTrading()` hook that:
- Manages portfolio, positions, trades, and bot status
- Handles WebSocket connections for real-time updates
- Provides settings management with history tracking
- Controls bot start/stop and portfolio reset

## File Structure

```
frontend/
├── app/                          # Next.js app directory
│   ├── layout.tsx                # Root layout
│   ├── page.tsx                  # Overview page
│   ├── bot-status/page.tsx       # Bot status page
│   ├── performance/page.tsx      # Performance page
│   ├── trades/page.tsx           # Trade history page
│   ├── activity/page.tsx         # Activity page
│   ├── logs/page.tsx             # Logs page
│   ├── settings/page.tsx         # Settings page
│   └── help/page.tsx             # Help page
├── src/
│   ├── components/               # Reusable components
│   │   ├── AppBar.tsx
│   │   ├── Button.tsx
│   │   ├── Card.tsx
│   │   ├── Chip.tsx
│   │   ├── RootLayout.tsx
│   │   ├── Sidebar.tsx
│   │   └── UpdateDialog.tsx
│   ├── hooks/
│   │   └── useTrading.ts         # Main state management hook
│   ├── lib/
│   │   ├── api.ts                # Axios client setup
│   │   └── utils.ts              # Utility functions
│   └── styles/
│       └── globals.css           # Tailwind and global styles
├── tailwind.config.js            # Tailwind configuration
├── tsconfig.json                 # TypeScript configuration
├── next.config.js                # Next.js configuration
└── package.json                  # Dependencies
```

## Configuration

### Tailwind CSS
Dark theme with custom colors for:
- Primary (Blue)
- Success (Green)
- Error (Red)
- Warning (Orange)
- Info (Light Blue)
- Surface/Background colors

### TypeScript
Strict mode enabled with path aliases:
- `@/*` → `./src/*`

## Deployment

### Docker
The frontend is built and served as a static export via Docker:
```bash
docker-compose up frontend
```

### Vercel
To deploy on Vercel:
```bash
vercel
```

### Other Hosts
```bash
npm run build
npm start
```

## Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm start` - Start production server
- `npm run lint` - Run linting

## Troubleshooting

### WebSocket Connection Issues
- Ensure backend is running on `localhost:3001`
- Check browser console for connection errors
- Verify firewall allows WebSocket connections

### API Connection Issues
- Confirm backend API is accessible at `http://localhost:3001/api`
- Check network tab in browser dev tools
- Verify CORS is configured on backend

### Styling Issues
- Clear `.next` and `node_modules` and reinstall
- Ensure Tailwind config is properly set up
- Check for conflicting CSS or missing class names

## Notes

This dashboard is built with **Next.js + React + Tailwind CSS**.
