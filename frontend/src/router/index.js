import { createRouter, createWebHistory } from 'vue-router'
import Overview from '../views/Overview.vue'
import Performance from '../views/Performance.vue'
import TradeHistory from '../views/TradeHistory.vue'
import Activity from '../views/Activity.vue'
import Logs from '../views/Logs.vue'
import BotStatus from '../views/BotStatus.vue'

const routes = [
  {
    path: '/',
    name: 'Overview',
    component: Overview,
    meta: { icon: 'mdi-view-dashboard', title: 'Overview' }
  },
  {
    path: '/bot-status',
    name: 'BotStatus',
    component: BotStatus,
    meta: { icon: 'mdi-robot', title: 'Bot Status' }
  },
  {
    path: '/performance',
    name: 'Performance',
    component: Performance,
    meta: { icon: 'mdi-trophy', title: 'Performance by Coin' }
  },
  {
    path: '/trades',
    name: 'TradeHistory',
    component: TradeHistory,
    meta: { icon: 'mdi-history', title: 'Trade History' }
  },
  {
    path: '/activity',
    name: 'Activity',
    component: Activity,
    meta: { icon: 'mdi-bell', title: 'Recent Activity' }
  },
  {
    path: '/logs',
    name: 'Logs',
    component: Logs,
    meta: { icon: 'mdi-console', title: 'Bot Logs' }
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

export default router
