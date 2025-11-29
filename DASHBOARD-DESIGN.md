# 📊 Dashboard UI Specification

## Layout Overview

```
┌─────────────────────────────────────────────────────────────────┐
│  🤖 Crypto Trading Bot Dashboard        [Paper Trading] [🔄]   │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌───────────┐  ┌───────────┐  ┌───────────┐  ┌───────────┐  │
│  │ Total     │  │ Available │  │   Total   │  │  Win      │  │
│  │ Value     │  │   Cash    │  │  Profit   │  │  Rate     │  │
│  │ $10,521   │  │  $8,234   │  │  +$521    │  │   68.5%   │  │
│  │ ↗ +5.21%  │  │ Pos: $2287│  │ 47 trades │  │  32W/15L  │  │
│  └───────────┘  └───────────┘  └───────────┘  └───────────┘  │
│                                                                 │
│  ┌──────────────────────────────┐  ┌─────────────────────────┐ │
│  │ 📈 Open Positions (3)        │  │ 🏆 Performance by Coin  │ │
│  ├──────────────────────────────┤  ├─────────────────────────┤ │
│  │ Symbol│Entry  │Target│Invest│  │ SPELL  $125.50  15 ·82%│ │
│  │ SPELL │$0.0003│$0.00…│ $100 │  │ AXL    $89.20   8 · 75%│ │
│  │ AXL   │$0.1270│$0.13…│ $100 │  │ ONDO   $56.80   6 · 67%│ │
│  │ ONDO  │$0.5109│$0.53…│ $100 │  │ GFI    $32.40   4 · 75%│ │
│  │       │       │      │      │  │ USELESS-$12.30  3 · 33%│ │
│  └──────────────────────────────┘  └─────────────────────────┘ │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────────┐
│  │ 📜 Trade History                                           │ │
│  ├─────────────────────────────────────────────────────────────┤
│  │Symbol│Entry   │Exit    │Profit │Return │Time│Reason       ││
│  │SPELL │$0.00030│$0.00032│+$5.12 │[+5.1%]│45m │Target       ││
│  │AXL   │$0.12700│$0.13335│+$4.88 │[+5.0%]│38m │Target       ││
│  │ONDO  │$0.51090│$0.52140│+$2.06 │[+2.1%]│4.2h│Time exit    ││
│  │GFI   │$0.26940│$0.25080│-$6.90 │[-6.9%]│28m │Stop loss    ││
│  │SPELL │$0.00031│$0.00033│+$6.45 │[+6.5%]│52m │Target       ││
│  └─────────────────────────────────────────────────────────────┘
│                                                                 │
│  ┌─────────────────────────────────────────────────────────────┐
│  │ 🔔 Recent Activity                                         │ │
│  ├─────────────────────────────────────────────────────────────┤
│  │ 10:45 AM  ● SELL SPELL [+5.1%]                            ││
│  │            Target reached · $5.12 profit                   ││
│  │                                                             ││
│  │ 10:32 AM  ● SELL AXL [+5.0%]                              ││
│  │            Target reached · $4.88 profit                   ││
│  │                                                             ││
│  │ 10:18 AM  ● SELL ONDO [+2.1%]                             ││
│  │            Time-based exit · $2.06 profit                  ││
│  └─────────────────────────────────────────────────────────────┘
│                                                                 │
├─────────────────────────────────────────────────────────────────┤
│  Last updated: 10:45:23 AM · Auto-refresh every 5s             │
└─────────────────────────────────────────────────────────────────┘
```

## Color Scheme (Dark Mode)

### Primary Colors
- **Background**: Dark grey (#121212)
- **Cards**: Slightly lighter grey (#1E1E1E)
- **Primary Blue**: #1976D2
- **Success Green**: #4CAF50
- **Error Red**: #FF5252
- **Warning Yellow**: #FFC107

### Text Colors
- **Primary Text**: White (#FFFFFF)
- **Secondary Text**: Light grey (#AAAAAA)
- **Disabled Text**: Medium grey (#757575)

### Component Colors
- **Profit**: Green (#4CAF50)
- **Loss**: Red (#FF5252)
- **Neutral**: Grey (#9E9E9E)
- **Accent**: Light blue (#82B1FF)

## Component Breakdown

### 1. App Bar (Top)
```
┌──────────────────────────────────────────────────┐
│ 🤖 Crypto Trading Bot Dashboard   [Paper] [🔄] │
└──────────────────────────────────────────────────┘
```
- Gradient blue background
- Bot icon on left
- Title centered
- Paper Trading chip (green)
- Refresh button (right)

### 2. Stats Cards (Row 1)
Four cards showing key metrics:

**Card 1: Total Value**
- Large $ amount
- ROI percentage with trend icon
- Green if positive, red if negative

**Card 2: Available Cash**
- Cash available
- Positions value (small text)

**Card 3: Total Profit**
- Cumulative P&L
- Total trades count

**Card 4: Win Rate**
- Percentage
- Win/Loss breakdown

### 3. Open Positions Table
- Material Design data table
- Colored chips for symbols
- Sortable columns
- Pagination (5 per page)
- Empty state message when no positions

Columns:
- Symbol (chip)
- Entry Price ($)
- Target Price ($)
- Invested ($)
- Hold Time (formatted)

### 4. Performance by Coin Panel
- Compact list layout
- Coin symbols as chips
- Profit in green/red
- Win rate and trade count
- Sorted by profitability

### 5. Trade History Table
- Full-width table
- Complete trade details
- Color-coded profit chips
- Sortable all columns
- Pagination (10 per page)

Columns:
- Symbol (chip)
- Entry price
- Exit price
- Profit ($, colored)
- Return (%, chip with color)
- Hold time (formatted)
- Timestamp
- Reason for exit

### 6. Activity Timeline
- Vertical timeline component
- Dots colored by result
- Timestamps on left
- Trade details with profit chips
- Exit reasons
- Most recent at top

### 7. Footer
- Grey background
- Last update timestamp
- Auto-refresh notice

## Responsive Breakpoints

### Desktop (> 1264px)
- 4 stat cards in one row
- 7/5 split for positions/performance
- Full tables visible

### Tablet (960px - 1264px)
- 4 stat cards in one row
- Tables with horizontal scroll
- Slightly condensed spacing

### Mobile (< 960px)
- Stat cards stack (1 per row)
- Tables with horizontal scroll
- Compact density
- Larger touch targets

## Interactive Elements

### Refresh Button
- Icon button in app bar
- Shows loading spinner during refresh
- Manual refresh trigger
- Tooltip: "Refresh data"

### Sortable Tables
- Click column headers to sort
- Arrows indicate sort direction
- Default: Most recent first

### Auto-Refresh
- Automatic every 5 seconds
- Updates all data silently
- Shows timestamp of last update
- No page flicker/jump

## Empty States

### No Positions
```
     ℹ️
  No open positions
```

### No Trades
```
     ℹ️
  No trades executed yet.
  Start the bot to begin trading!
```

### No Activity
```
  No recent activity
```

## Data Formatting

### Currency
- Always 2 decimals: `$10.00`
- Very small amounts 4 decimals: `$0.0003`

### Percentages
- Always 1-2 decimals: `5.1%` or `68.5%`
- Prefix + for positive: `+5.1%`

### Time
- Minutes: `45m`
- Hours + minutes: `4h 23m`
- Timestamps: `10:45:23 AM`

### Large Numbers
- Thousands: `$1.2k`
- Formatted with commas: `$10,521.00`

## Icons Used

- 🤖 `mdi-robot` - Bot/app icon
- 🔄 `mdi-refresh` - Refresh button
- ⭕ `mdi-circle` - Status indicator
- 📈 `mdi-chart-line` - Positions
- 🏆 `mdi-trophy` - Performance
- 📜 `mdi-history` - History
- 🔔 `mdi-bell` - Activity
- ℹ️ `mdi-information` - Empty states
- ↗️ `mdi-trending-up` - Positive trend
- ↘️ `mdi-trending-down` - Negative trend

## Loading States

- Refresh button shows spinner
- Data doesn't jump during reload
- Smooth transitions
- No skeleton loaders (data loads fast)

## Performance

- Auto-refresh every 5 seconds
- Minimal API calls (5 endpoints)
- All data loads in parallel
- Fast Vue 3 reactivity
- Optimized table rendering

---

This dashboard provides a professional, real-time view of your trading bot's performance! 📊✨
