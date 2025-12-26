'use client'

import { useState, useCallback, useEffect, ReactNode } from 'react'
import { 
  GripVertical, RotateCcw, Maximize2, Minimize2, X, Plus, 
  Save, Check, Settings2, ChevronDown, ChevronUp, Eye, EyeOff,
  Layout, Columns, Grid3X3
} from 'lucide-react'
import { 
  Grid, Box, Typography, Button, IconButton, Tooltip, 
  Menu, MenuItem, Paper, Divider, useTheme, useMediaQuery,
  Fade, Grow, Zoom, Card, CardHeader, CardContent, Chip
} from '@mui/material'

export interface Widget {
  id: string
  title: string
  component: ReactNode
  minWidth?: 1 | 2 | 3 | 4
  defaultWidth?: 1 | 2 | 3 | 4
  defaultHeight?: 'auto' | 'small' | 'medium' | 'large'
  gradient?: string
  removable?: boolean
}

interface WidgetLayout {
  id: string
  order: number
  width: 1 | 2 | 3 | 4
  collapsed: boolean
  hidden: boolean
}

interface WidgetGridProps {
  widgets: Widget[]
  storageKey?: string
  onLayoutChange?: (layout: WidgetLayout[]) => void
}

const STORAGE_PREFIX = 'widget-layout-'

const gradients = [
  'linear-gradient(135deg, rgba(124, 77, 255, 0.1) 0%, rgba(0, 0, 0, 0) 100%)',
  'linear-gradient(135deg, rgba(3, 218, 198, 0.1) 0%, rgba(0, 0, 0, 0) 100%)',
  'linear-gradient(135deg, rgba(34, 197, 94, 0.1) 0%, rgba(0, 0, 0, 0) 100%)',
  'linear-gradient(135deg, rgba(245, 158, 11, 0.1) 0%, rgba(0, 0, 0, 0) 100%)',
  'linear-gradient(135deg, rgba(239, 68, 68, 0.1) 0%, rgba(0, 0, 0, 0) 100%)',
]

export default function WidgetGrid({ widgets, storageKey = 'default', onLayoutChange }: WidgetGridProps) {
  const [layout, setLayout] = useState<WidgetLayout[]>([])
  const [draggedId, setDraggedId] = useState<string | null>(null)
  const [dragOverId, setDragOverId] = useState<string | null>(null)
  const [isEditing, setIsEditing] = useState(false)
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null)
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)
  const [savedLayout, setSavedLayout] = useState<WidgetLayout[]>([])

  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'))

  // Initialize layout from storage or defaults
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_PREFIX + storageKey)
    if (stored) {
      try {
        const parsed = JSON.parse(stored)
        // Merge with widgets to handle new widgets
        const existingIds = parsed.map((l: WidgetLayout) => l.id)
        const merged = [
          ...parsed,
          ...widgets
            .filter(w => !existingIds.includes(w.id))
            .map((w, idx) => ({
              id: w.id,
              order: parsed.length + idx,
              width: w.defaultWidth || 2,
              collapsed: false,
              hidden: false,
            }))
        ]
        const sorted = merged.sort((a: WidgetLayout, b: WidgetLayout) => a.order - b.order)
        setLayout(sorted)
        setSavedLayout(sorted)
      } catch {
        initDefaultLayout()
      }
    } else {
      initDefaultLayout()
    }
  }, [widgets, storageKey])

  const initDefaultLayout = useCallback(() => {
    const defaultLayout = widgets.map((w, idx) => ({
      id: w.id,
      order: idx,
      width: (w.defaultWidth || 2) as 1 | 2 | 3 | 4,
      collapsed: false,
      hidden: false,
    }))
    setLayout(defaultLayout)
    setSavedLayout(defaultLayout)
  }, [widgets])

  // Track unsaved changes
  useEffect(() => {
    if (layout.length > 0 && savedLayout.length > 0) {
      const hasChanges = JSON.stringify(layout) !== JSON.stringify(savedLayout)
      setHasUnsavedChanges(hasChanges)
    }
  }, [layout, savedLayout])

  // Auto-save when not in editing mode
  useEffect(() => {
    if (!isEditing && layout.length > 0) {
      localStorage.setItem(STORAGE_PREFIX + storageKey, JSON.stringify(layout))
      onLayoutChange?.(layout)
    }
  }, [layout, storageKey, onLayoutChange, isEditing])

  const saveLayout = useCallback(() => {
    localStorage.setItem(STORAGE_PREFIX + storageKey, JSON.stringify(layout))
    setSavedLayout([...layout])
    setHasUnsavedChanges(false)
    onLayoutChange?.(layout)
  }, [layout, storageKey, onLayoutChange])

  const handleDragStart = useCallback((e: React.DragEvent, id: string) => {
    setDraggedId(id)
    e.dataTransfer.effectAllowed = 'move'
    e.dataTransfer.setData('text/plain', id)
    const elem = e.currentTarget as HTMLElement
    e.dataTransfer.setDragImage(elem, elem.offsetWidth / 2, 20)
  }, [])

  const handleDragOver = useCallback((e: React.DragEvent, id: string) => {
    e.preventDefault()
    if (draggedId && draggedId !== id) {
      setDragOverId(id)
    }
  }, [draggedId])

  const handleDragLeave = useCallback(() => {
    setDragOverId(null)
  }, [])

  const handleDrop = useCallback((e: React.DragEvent, targetId: string) => {
    e.preventDefault()
    if (!draggedId || draggedId === targetId) return

    setLayout(prev => {
      const newLayout = [...prev]
      const draggedIdx = newLayout.findIndex(l => l.id === draggedId)
      const targetIdx = newLayout.findIndex(l => l.id === targetId)
      
      if (draggedIdx === -1 || targetIdx === -1) return prev

      const [dragged] = newLayout.splice(draggedIdx, 1)
      newLayout.splice(targetIdx, 0, dragged)
      
      return newLayout.map((l, idx) => ({ ...l, order: idx }))
    })

    setDraggedId(null)
    setDragOverId(null)
  }, [draggedId])

  const handleDragEnd = useCallback(() => {
    setDraggedId(null)
    setDragOverId(null)
  }, [])

  const toggleCollapse = useCallback((id: string) => {
    setLayout(prev => prev.map(l => 
      l.id === id ? { ...l, collapsed: !l.collapsed } : l
    ))
  }, [])

  const setWidgetWidth = useCallback((id: string, width: 1 | 2 | 3 | 4) => {
    setLayout(prev => prev.map(l => 
      l.id === id ? { ...l, width } : l
    ))
  }, [])

  const hideWidget = useCallback((id: string) => {
    setLayout(prev => prev.map(l => 
      l.id === id ? { ...l, hidden: true } : l
    ))
  }, [])

  const showWidget = useCallback((id: string) => {
    setLayout(prev => prev.map(l => 
      l.id === id ? { ...l, hidden: false, collapsed: false } : l
    ))
    setAnchorEl(null)
  }, [])

  const resetLayout = useCallback(() => {
    localStorage.removeItem(STORAGE_PREFIX + storageKey)
    initDefaultLayout()
    setIsEditing(false)
    setHasUnsavedChanges(false)
  }, [storageKey, initDefaultLayout])

  const getGridProps = (width: number) => {
    switch (width) {
      case 1: return { xs: 12, md: 6, lg: 3 }
      case 2: return { xs: 12, md: 12, lg: 6 }
      case 3: return { xs: 12, md: 12, lg: 9 }
      case 4: return { xs: 12, md: 12, lg: 12 }
      default: return { xs: 12, md: 12, lg: 6 }
    }
  }

  const visibleWidgets = layout.filter(l => !l.hidden)
  const hiddenWidgets = layout.filter(l => l.hidden)

  return (
    <Box sx={{ width: '100%' }}>
      {/* Edit Controls */}
      <Box sx={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'space-between', 
        mb: 3,
        flexWrap: 'wrap',
        gap: 2
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          {isEditing && (
            <Typography variant="caption" color="text.secondary">
              {visibleWidgets.length} visible • {hiddenWidgets.length} hidden
            </Typography>
          )}
        </Box>
        
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          {isEditing && hiddenWidgets.length > 0 && (
            <>
              <Button
                variant="outlined"
                size="small"
                startIcon={<Plus size={16} />}
                endIcon={<ChevronDown size={14} />}
                onClick={(e) => setAnchorEl(e.currentTarget)}
                sx={{ borderRadius: 2, textTransform: 'none' }}
              >
                Add Widget
              </Button>
              <Menu
                anchorEl={anchorEl}
                open={Boolean(anchorEl)}
                onClose={() => setAnchorEl(null)}
                PaperProps={{
                  sx: { 
                    mt: 1, 
                    minWidth: 200,
                    bgcolor: 'background.paper',
                    backgroundImage: 'none',
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: 2
                  }
                }}
              >
                <Box sx={{ px: 2, py: 1 }}>
                  <Typography variant="caption" color="text.secondary" fontWeight={600}>
                    HIDDEN WIDGETS
                  </Typography>
                </Box>
                <Divider sx={{ opacity: 0.1 }} />
                {hiddenWidgets.map(item => {
                  const widget = widgets.find(w => w.id === item.id)
                  if (!widget) return null
                  return (
                    <MenuItem key={item.id} onClick={() => showWidget(item.id)} sx={{ py: 1.5 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <Eye size={16} className="text-gray-400" />
                        <Typography variant="body2">{widget.title}</Typography>
                      </Box>
                    </MenuItem>
                  )
                })}
              </Menu>
            </>
          )}

          {isEditing && hasUnsavedChanges && (
            <Button
              variant="contained"
              color="success"
              size="small"
              startIcon={<Save size={16} />}
              onClick={saveLayout}
              sx={{ borderRadius: 2, textTransform: 'none', boxShadow: '0 0 15px rgba(34, 197, 94, 0.3)' }}
            >
              Save
            </Button>
          )}

          {isEditing && (
            <Button
              variant="outlined"
              color="inherit"
              size="small"
              startIcon={<RotateCcw size={16} />}
              onClick={resetLayout}
              sx={{ borderRadius: 2, textTransform: 'none', borderColor: 'rgba(255,255,255,0.1)' }}
            >
              Reset
            </Button>
          )}

          <Button
            variant={isEditing ? "contained" : "outlined"}
            color={isEditing ? "primary" : "inherit"}
            size="small"
            startIcon={isEditing ? <Check size={16} /> : <Settings2 size={16} />}
            onClick={() => {
              if (isEditing && hasUnsavedChanges) {
                saveLayout()
              }
              setIsEditing(!isEditing)
              setAnchorEl(null)
            }}
            sx={{ 
              borderRadius: 2, 
              textTransform: 'none',
              borderColor: isEditing ? 'transparent' : 'rgba(255,255,255,0.1)',
              boxShadow: isEditing ? '0 0 15px rgba(124, 77, 255, 0.3)' : 'none'
            }}
          >
            {isEditing ? 'Done' : 'Customize'}
          </Button>
        </Box>
      </Box>

      {/* Widget Grid */}
      <Grid container spacing={3}>
        {visibleWidgets.map((item, index) => {
          const widget = widgets.find(w => w.id === item.id)
          if (!widget) return null

          const isDragging = draggedId === item.id
          const isDragOver = dragOverId === item.id
          const gradient = widget.gradient || gradients[index % gradients.length]

          return (
            <Grid 
              item 
              key={item.id} 
              {...getGridProps(item.width)}
              sx={{ 
                transition: 'all 0.3s ease',
                opacity: isDragging ? 0.5 : 1,
                transform: isDragging ? 'scale(0.98)' : 'none'
              }}
              draggable={isEditing}
              onDragStart={(e) => handleDragStart(e, item.id)}
              onDragOver={(e) => handleDragOver(e, item.id)}
              onDragLeave={handleDragLeave}
              onDrop={(e) => handleDrop(e, item.id)}
              onDragEnd={handleDragEnd}
            >
              <Card 
                sx={{ 
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  position: 'relative',
                  overflow: 'hidden',
                  bgcolor: 'background.paper',
                  backgroundImage: gradient,
                  border: '1px solid rgba(255,255,255,0.05)',
                  borderRadius: 3,
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    borderColor: isEditing ? 'primary.main' : 'rgba(255,255,255,0.1)',
                    boxShadow: isEditing ? '0 0 20px rgba(124, 77, 255, 0.15)' : '0 8px 32px rgba(0,0,0,0.4)'
                  },
                  ...(isDragOver && {
                    borderColor: 'primary.main',
                    borderStyle: 'dashed',
                    borderWidth: 2,
                    transform: 'scale(1.02)',
                    zIndex: 10
                  })
                }}
              >
                <CardHeader
                  title={
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                      {isEditing && <GripVertical size={16} className="text-gray-500 cursor-grab active:cursor-grabbing" />}
                      <Typography variant="subtitle2" fontWeight={700} sx={{ letterSpacing: '0.02em' }}>
                        {widget.title}
                      </Typography>
                    </Box>
                  }
                  action={
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                      {isEditing ? (
                        <>
                          <Box sx={{ display: 'flex', bgcolor: 'rgba(255,255,255,0.05)', borderRadius: 1.5, p: 0.5, mr: 1 }}>
                            {[1, 2, 3, 4].map((w) => (
                              <IconButton
                                key={w}
                                size="small"
                                onClick={() => setWidgetWidth(item.id, w as 1 | 2 | 3 | 4)}
                                disabled={w < (widget.minWidth || 1)}
                                sx={{ 
                                  width: 24, 
                                  height: 24, 
                                  fontSize: '0.65rem',
                                  borderRadius: 1,
                                  bgcolor: item.width === w ? 'primary.main' : 'transparent',
                                  color: item.width === w ? 'white' : 'text.secondary',
                                  '&:hover': { bgcolor: item.width === w ? 'primary.dark' : 'rgba(255,255,255,0.1)' }
                                }}
                              >
                                {w}
                              </IconButton>
                            ))}
                          </Box>
                          <Tooltip title="Hide widget">
                            <IconButton size="small" onClick={() => hideWidget(item.id)} sx={{ color: 'text.secondary', '&:hover': { color: 'error.main' } }}>
                              <EyeOff size={14} />
                            </IconButton>
                          </Tooltip>
                        </>
                      ) : (
                        <IconButton size="small" onClick={() => toggleCollapse(item.id)} sx={{ color: 'text.secondary' }}>
                          {item.collapsed ? <ChevronDown size={16} /> : <ChevronUp size={16} />}
                        </IconButton>
                      )}
                    </Box>
                  }
                  sx={{ 
                    px: 2.5, 
                    py: 1.5, 
                    borderBottom: '1px solid rgba(255,255,255,0.05)',
                    bgcolor: isEditing ? 'rgba(255,255,255,0.02)' : 'transparent'
                  }}
                />
                
                <Fade in={!item.collapsed}>
                  <CardContent sx={{ 
                    p: 2.5, 
                    flexGrow: 1,
                    display: item.collapsed ? 'none' : 'block'
                  }}>
                    {widget.component}
                  </CardContent>
                </Fade>

                {isDragOver && (
                  <Box sx={{ 
                    position: 'absolute', 
                    inset: 0, 
                    bgcolor: 'rgba(124, 77, 255, 0.05)', 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center',
                    pointerEvents: 'none'
                  }}>
                    <Typography variant="button" color="primary.main" fontWeight={700}>
                      Drop Here
                    </Typography>
                  </Box>
                )}
              </Card>
            </Grid>
          )
        })}

        {/* Empty State */}
        {visibleWidgets.length === 0 && (
          <Grid item xs={12}>
            <Paper sx={{ 
              py: 8, 
              textAlign: 'center', 
              bgcolor: 'transparent', 
              border: '2px dashed rgba(255,255,255,0.1)',
              borderRadius: 4
            }}>
              <Grid3X3 size={48} className="text-gray-600" style={{ marginBottom: 16 }} />
              <Typography variant="h6" color="text.secondary" gutterBottom>
                No widgets visible
              </Typography>
              <Typography variant="body2" color="text.disabled" sx={{ mb: 3 }}>
                Add widgets to customize your dashboard
              </Typography>
              {hiddenWidgets.length > 0 && (
                <Button
                  variant="contained"
                  startIcon={<Plus size={18} />}
                  onClick={(e) => setAnchorEl(e.currentTarget)}
                  sx={{ borderRadius: 2, textTransform: 'none' }}
                >
                  Add Widget
                </Button>
              )}
            </Paper>
          </Grid>
        )}
      </Grid>
    </Box>
  )
}

export { WidgetGrid }
