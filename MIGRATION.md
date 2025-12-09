# Vue to Next.js Migration Guide

This document details the migration of the Crypto Momentum Trader dashboard from Vue 3 + Vuetify to Next.js + React + Tailwind CSS.

## Overview

**From**: Vue 3.4 + Vuetify 3.5 + Vue Router 4 + Vite  
**To**: Next.js 14 + React 18 + Tailwind CSS 3 + Lucide Icons

## Key Changes

### Framework Architecture

#### Vue 3 (Old)
- **SPA Router**: Vue Router with hash/history modes
- **State Management**: Vue composables with `ref()` and `computed()`
- **Styling**: Vuetify Material Design components
- **Build Tool**: Vite

#### Next.js (New)
- **File-based Routing**: App Router with file structure
- **State Management**: React Context API with hooks
- **Styling**: Tailwind CSS utility classes
- **Build Tool**: Next.js built-in (Webpack)

### Component Structure

#### Before (Vue)
```vue
<template>
  <v-container>
    <v-card>
      <v-card-title>Bot Status</v-card-title>
      <v-card-text>
        <v-button @click="startBot">Start</v-button>
      </v-card-text>
    </v-card>
  </v-container>
</template>

<script setup>
import { useTrading } from '@/composables/useTrading'
const { startBot, botStatus } = useTrading()
</script>
```

#### After (React)
```tsx
'use client'
import { useTrading } from '@/hooks/useTrading'
import { Card, CardTitle, CardContent } from '@/components/Card'
import Button from '@/components/Button'

export default function BotStatusPage() {
  const { startBot, botStatus } = useTrading()
  
  return (
    <Card>
      <CardTitle>Bot Status</CardTitle>
      <CardContent>
        <Button onClick={startBot}>Start</Button>
      </CardContent>
    </Card>
  )
}
```

### State Management Migration

#### Vue Composable (Old)
```javascript
import { ref, computed } from 'vue'

export function useTrading() {
  const loading = ref(false)
  const portfolio = ref({})
  
  const totalProfit = computed(() => {
    return portfolio.value.totalProfit || 0
  })
  
  return {
    loading,
    portfolio,
    totalProfit,
  }
}
```

#### React Hook + Context (New)
```typescript
'use client'
import { createContext, useContext, useState } from 'react'

const TradingContext = createContext<TradingContextType | undefined>(undefined)

export function TradingProvider({ children }) {
  const [loading, setLoading] = useState(false)
  const [portfolio, setPortfolio] = useState({})
  
  const totalProfit = portfolio.totalProfit || 0
  
  return (
    <TradingContext.Provider value={{ loading, portfolio, totalProfit }}>
      {children}
    </TradingContext.Provider>
  )
}

export function useTrading() {
  const context = useContext(TradingContext)
  if (!context) throw new Error('useTrading must be used within TradingProvider')
  return context
}
```

### Routing Changes

#### Vue Router (Old)
```javascript
// src/router/index.js
const routes = [
  { path: '/', component: Overview },
  { path: '/bot-status', component: BotStatus },
  { path: '/settings', component: Settings },
]

// Access routes
import { useRouter } from 'vue-router'
const router = useRouter()
```

#### Next.js App Router (New)
```
app/
├── page.tsx                    // / (Overview)
├── bot-status/page.tsx         // /bot-status
└── settings/page.tsx           // /settings
```

Access routes with Next.js Link:
```tsx
import Link from 'next/link'
<Link href="/settings">Settings</Link>
```

### Component Library Migration

#### Vuetify → Tailwind CSS + Lucide Icons

| Vuetify | Tailwind | Notes |
|---------|----------|-------|
| `v-card` | `Card` component | Custom wrapper |
| `v-btn` | `Button` component | Custom with variants |
| `v-chip` | `Chip` component | Custom badge component |
| `v-icon` | `lucide-react` | Lucide React icons |
| `v-data-table` | HTML `<table>` | Simple HTML with Tailwind |
| `v-dialog` | Div overlay | Custom modal with Tailwind |
| `v-switch` | HTML checkbox | Simple input |
| `v-text-field` | HTML input | Simple input |
| `v-list` | `<div>` | Tailwind flex layout |

### Styling Approach

#### Vuetify (Old)
```vue
<v-card color="success" variant="tonal">
  <v-card-text class="text-h5">
    Total Profit
  </v-card-text>
</v-card>

<style scoped>
.card-item {
  display: flex;
  gap: 1rem;
}
</style>
```

#### Tailwind CSS (New)
```tsx
<Card variant="tonal" color="success">
  <CardContent>
    <h5 className="text-lg font-bold">Total Profit</h5>
  </CardContent>
</Card>

// Or inline:
<div className="flex gap-4">
  ...
</div>
```

### WebSocket Integration

**No changes required** - WebSocket logic is identical:
- Connection setup
- Message parsing
- Reconnection logic
- Event handling

Both versions maintain the same WebSocket patterns in the state management layer.

### API Client

#### Axios (Unchanged)
```typescript
// Old (Vue)
import axios from 'axios'
const res = await axios.get('/api/portfolio')

// New (React)
import apiClient from '@/lib/api'
const res = await apiClient.get('/portfolio')
```

The API layer is identical; only the import path changes.

## File Structure Mapping

### Old Vue Structure
```
frontend/
├── src/
│   ├── App.vue
│   ├── main.js
│   ├── composables/
│   │   └── useTrading.js
│   ├── components/     (empty - using Vuetify)
│   ├── plugins/
│   │   └── vuetify.js
│   ├── router/
│   │   └── index.js
│   └── views/
│       ├── Overview.vue
│       ├── BotStatus.vue
│       ├── Settings.vue
│       └── ...
├── vite.config.js
├── index.html
└── package.json
```

### New Next.js Structure
```
frontend/
├── app/
│   ├── layout.tsx
│   ├── page.tsx          (Overview)
│   ├── bot-status/page.tsx
│   ├── settings/page.tsx
│   └── ...
├── src/
│   ├── components/
│   │   ├── Card.tsx
│   │   ├── Button.tsx
│   │   ├── Sidebar.tsx
│   │   └── ...
│   ├── hooks/
│   │   └── useTrading.ts
│   ├── lib/
│   │   ├── api.ts
│   │   └── utils.ts
│   └── styles/
│       └── globals.css
├── next.config.js
├── tailwind.config.js
├── tsconfig.json
└── package.json
```

## Dependencies Changes

### Removed
```json
{
  "vue": "^3.4.0",
  "vuetify": "^3.5.0",
  "vue-router": "^4.2.0",
  "vite": "^7.2.6",
  "@vitejs/plugin-vue": "^6.0.2",
  "@mdi/font": "^7.4.0"
}
```

### Added
```json
{
  "next": "^14.2.0",
  "react": "^18.3.0",
  "react-dom": "^18.3.0",
  "tailwindcss": "^3.4.1",
  "lucide-react": "^0.446.0",
  "postcss": "^8.4.35",
  "autoprefixer": "^10.4.17"
}
```

### Kept
```json
{
  "axios": "^1.6.7"
}
```

## Development Workflow

### Before
```bash
cd frontend
npm run dev          # Vite dev server on :5173
npm run build        # Build to dist/
npm run preview      # Preview build
```

### After
```bash
cd frontend
npm run dev          # Next.js dev server on :3000
npm run build        # Build to .next/
npm start            # Start production server
```

## Browser Support

Both versions support modern browsers. No functional differences.

## Performance Considerations

### Next.js Advantages
- Built-in code splitting by page
- Image optimization (though not used here)
- Static generation where possible
- Smaller bundle size (no Vue runtime)

### Similar Areas
- Both use similar API calls
- Same WebSocket overhead
- Same asset loading patterns

## Testing

Update import paths and component names:

```javascript
// Old
import { mount } from '@vue/test-utils'
import BotStatus from '@/views/BotStatus.vue'

// New
import { render } from '@testing-library/react'
import BotStatusPage from '@/app/bot-status/page'
```

## Known Differences

1. **No CSS Scoping**: React doesn't scope styles like Vue. Use Tailwind classes or CSS modules.
2. **No 2-way Binding**: Use `useState` and `onChange` handlers instead of `v-model`.
3. **Hook Dependencies**: React hooks require dependency arrays; Vue doesn't.
4. **No Template Directives**: Use JavaScript/JSX instead of `v-if`, `v-for`, etc.

## Rollback

To revert to Vue:
```bash
git checkout main -- frontend/package.json frontend/src frontend/vite.config.js frontend/index.html
npm install
npm run dev
```

## Future Improvements

- [ ] Add component tests with Vitest/Jest
- [ ] Implement dark mode toggle
- [ ] Add keyboard shortcuts
- [ ] Optimize images with Next.js Image
- [ ] Implement error boundaries
- [ ] Add loading skeletons
- [ ] Consider Zustand for complex state
- [ ] Add E2E tests with Playwright

## Support

For issues during migration:
1. Check that all imports use correct paths (@/...)
2. Verify hooks are used only in client components ('use client')
3. Ensure Context is wrapped at root level
4. Check console for TypeScript errors
5. Verify API endpoint configuration
