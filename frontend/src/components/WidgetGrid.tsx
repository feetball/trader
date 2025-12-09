'use client'

import { useState, useCallback, useEffect, ReactNode } from 'react'
import { 
  GripVertical, RotateCcw, Maximize2, Minimize2, X, Plus, 
  Save, Check, Settings2, ChevronDown, ChevronUp, Eye, EyeOff,
  Layout, Columns, Grid3X3
} from 'lucide-react'

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
  'from-primary-500/20 via-transparent to-transparent',
  'from-info-500/20 via-transparent to-transparent',
  'from-success-500/20 via-transparent to-transparent',
  'from-warning-500/20 via-transparent to-transparent',
  'from-error-500/20 via-transparent to-transparent',
]

export default function WidgetGrid({ widgets, storageKey = 'default', onLayoutChange }: WidgetGridProps) {
  const [layout, setLayout] = useState<WidgetLayout[]>([])
  const [draggedId, setDraggedId] = useState<string | null>(null)
  const [dragOverId, setDragOverId] = useState<string | null>(null)
  const [isEditing, setIsEditing] = useState(false)
  const [showAddMenu, setShowAddMenu] = useState(false)
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)
  const [savedLayout, setSavedLayout] = useState<WidgetLayout[]>([])

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
    // Add a drag image
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

      // Move dragged item to target position
      const [dragged] = newLayout.splice(draggedIdx, 1)
      newLayout.splice(targetIdx, 0, dragged)
      
      // Update order numbers
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

  const changeWidth = useCallback((id: string, delta: number) => {
    setLayout(prev => prev.map(l => {
      if (l.id !== id) return l
      const widget = widgets.find(w => w.id === id)
      const minWidth = widget?.minWidth || 1
      const newWidth = Math.max(minWidth, Math.min(4, l.width + delta)) as 1 | 2 | 3 | 4
      return { ...l, width: newWidth }
    }))
  }, [widgets])

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
    setShowAddMenu(false)
  }, [])

  const resetLayout = useCallback(() => {
    localStorage.removeItem(STORAGE_PREFIX + storageKey)
    initDefaultLayout()
    setIsEditing(false)
    setHasUnsavedChanges(false)
  }, [storageKey, initDefaultLayout])

  const getWidthClass = (width: number) => {
    switch (width) {
      case 1: return 'col-span-1'
      case 2: return 'col-span-1 md:col-span-2'
      case 3: return 'col-span-1 md:col-span-2 lg:col-span-3'
      case 4: return 'col-span-1 md:col-span-2 lg:col-span-4'
      default: return 'col-span-1 md:col-span-2'
    }
  }

  const visibleWidgets = layout.filter(l => !l.hidden)
  const hiddenWidgets = layout.filter(l => l.hidden)

  return (
    <div className="space-y-4">
      {/* Edit Controls */}
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div className="flex items-center gap-2">
          {isEditing && (
            <>
              <span className="text-xs text-gray-500">
                {visibleWidgets.length} widgets visible
                {hiddenWidgets.length > 0 && ` • ${hiddenWidgets.length} hidden`}
              </span>
            </>
          )}
        </div>
        
        <div className="flex items-center gap-2">
          {/* Add Widget Button */}
          {isEditing && hiddenWidgets.length > 0 && (
            <div className="relative">
              <button
                onClick={() => setShowAddMenu(!showAddMenu)}
                className="px-4 py-2 text-xs font-medium rounded-xl glass hover:shadow-glow-sm text-gray-300 hover:text-white transition-all duration-300 flex items-center gap-2"
                title="Show hidden widgets that can be added back to the dashboard"
              >
                <Plus size={14} />
                Add Widget
                <ChevronDown size={12} className={`transition-transform ${showAddMenu ? 'rotate-180' : ''}`} />
              </button>
              
              {/* Add Widget Dropdown */}
              {showAddMenu && (
                <div className="absolute top-full right-0 mt-2 w-64 glass rounded-xl border border-white/10 shadow-xl z-50 overflow-hidden">
                  <div className="p-2 border-b border-white/10">
                    <p className="text-xs text-gray-400 px-2">Hidden Widgets</p>
                  </div>
                  <div className="max-h-64 overflow-y-auto custom-scrollbar">
                    {hiddenWidgets.map(item => {
                      const widget = widgets.find(w => w.id === item.id)
                      if (!widget) return null
                      return (
                        <button
                          key={item.id}
                          onClick={() => showWidget(item.id)}
                          className="w-full px-4 py-3 text-left hover:bg-white/10 transition-colors flex items-center gap-3"
                        >
                          <Eye size={14} className="text-gray-400" />
                          <span className="text-sm">{widget.title}</span>
                        </button>
                      )
                    })}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Save Button */}
          {isEditing && hasUnsavedChanges && (
            <button
              onClick={saveLayout}
              className="px-4 py-2 text-xs font-medium rounded-xl bg-gradient-to-r from-success-500 to-success-600 text-white shadow-glow-success hover:shadow-glow-md transition-all duration-300 flex items-center gap-2"
              title="Save current widget layout and sizing to browser storage"
            >
              <Save size={14} />
              Save
            </button>
          )}

          {/* Reset Button */}
          {isEditing && (
            <button
              onClick={resetLayout}
              className="px-4 py-2 text-xs font-medium rounded-xl glass hover:shadow-glow-sm text-gray-300 hover:text-white transition-all duration-300 flex items-center gap-2"
              title="Reset all widgets to their default positions, sizes, and visibility"
            >
              <RotateCcw size={14} />
              Reset
            </button>
          )}

          {/* Edit/Done Button */}
          <button
            onClick={() => {
              if (isEditing && hasUnsavedChanges) {
                saveLayout()
              }
              setIsEditing(!isEditing)
              setShowAddMenu(false)
            }}
            className={`group px-4 py-2 text-xs font-medium rounded-xl transition-all duration-300 flex items-center gap-2 ${
              isEditing 
                ? 'bg-gradient-to-r from-primary-500 to-info-500 text-white shadow-glow-sm' 
                : 'glass hover:shadow-glow-sm text-gray-300 hover:text-white'
            }`}
            title={isEditing ? 'Save changes and exit customization mode' : 'Enter customization mode to rearrange, resize, and hide widgets'}
          >
            {isEditing ? (
              <>
                <Check size={14} />
                Done
              </>
            ) : (
              <>
                <Settings2 size={14} className="group-hover:animate-spin" />
                Customize
              </>
            )}
          </button>
        </div>
      </div>

      {/* Widget Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {visibleWidgets.map((item, index) => {
          const widget = widgets.find(w => w.id === item.id)
          if (!widget) return null

          const isDragging = draggedId === item.id
          const isDragOver = dragOverId === item.id
          const gradientClass = widget.gradient || gradients[index % gradients.length]

          return (
            <div
              key={item.id}
              className={`${getWidthClass(item.width)} transition-all duration-300 ${
                isDragging ? 'opacity-50' : 'animate-fade-in'
              }`}
              style={{ animationDelay: `${index * 50}ms` }}
              draggable={isEditing}
              onDragStart={(e) => handleDragStart(e, item.id)}
              onDragOver={(e) => handleDragOver(e, item.id)}
              onDragLeave={handleDragLeave}
              onDrop={(e) => handleDrop(e, item.id)}
              onDragEnd={handleDragEnd}
            >
              <div className={`
                relative overflow-hidden rounded-2xl h-full
                bg-gradient-to-br ${gradientClass}
                transition-all duration-500 ease-out
                ${isDragging ? 'scale-95 rotate-1' : ''}
                ${isDragOver ? 'ring-2 ring-primary-400 ring-offset-2 ring-offset-background scale-[1.02]' : ''}
                ${isEditing ? 'cursor-move hover:shadow-glow-sm' : 'hover:shadow-lg hover:shadow-primary-500/10'}
              `}>
                {/* Glassmorphism card */}
                <div className="glass rounded-2xl h-full">
                  {/* Animated border gradient */}
                  <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-primary-500/20 via-info-500/20 to-success-500/20 opacity-0 hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
                  
                  {/* Widget Header */}
                  <div className={`
                    relative flex items-center justify-between px-4 py-3 
                    border-b border-white/5
                    ${isEditing ? 'bg-white/5' : ''}
                  `}>
                    <div className="flex items-center gap-3">
                      {isEditing && (
                        <span title="Drag to reorder this widget">
                          <GripVertical size={16} className="text-gray-400 cursor-grab active:cursor-grabbing" />
                        </span>
                      )}
                      <h3 className="font-semibold text-sm bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
                        {widget.title}
                      </h3>
                    </div>
                    <div className="flex items-center gap-1">
                      {isEditing ? (
                        <>
                          {/* Width Controls */}
                          <div className="flex items-center gap-0.5 mr-2 bg-white/5 rounded-lg p-0.5">
                            {[1, 2, 3, 4].map((w) => (
                              <button
                                key={w}
                                onClick={() => setWidgetWidth(item.id, w as 1 | 2 | 3 | 4)}
                                disabled={w < (widget.minWidth || 1)}
                                className={`w-6 h-6 text-xs rounded-md transition-all ${
                                  item.width === w
                                    ? 'bg-primary-500 text-white'
                                    : 'hover:bg-white/10 text-gray-400 disabled:opacity-30 disabled:cursor-not-allowed'
                                }`}
                                title={`Width: ${w}/4`}
                              >
                                {w}
                              </button>
                            ))}
                          </div>

                          {/* Hide Button */}
                          <button
                            onClick={() => hideWidget(item.id)}
                            className="p-1.5 hover:bg-error-500/20 rounded-lg transition-all group"
                            title="Hide this widget from the dashboard"
                          >
                            <EyeOff size={14} className="text-gray-400 group-hover:text-error-400" />
                          </button>
                        </>
                      ) : (
                        <button
                          onClick={() => toggleCollapse(item.id)}
                          className="p-1.5 hover:bg-white/10 rounded-lg transition-all"
                          title={item.collapsed ? 'Expand widget to show content' : 'Collapse widget to save space'}
                        >
                          {item.collapsed ? (
                            <ChevronDown size={14} className="text-gray-400" />
                          ) : (
                            <ChevronUp size={14} className="text-gray-400" />
                          )}
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Widget Content */}
                  <div className={`
                    transition-all duration-500 ease-out overflow-hidden
                    ${item.collapsed ? 'max-h-0 opacity-0' : 'max-h-[800px] opacity-100'}
                  `}>
                    <div className="p-4">
                      {widget.component}
                    </div>
                  </div>
                </div>

                {/* Drag overlay indicator */}
                {isDragOver && (
                  <div className="absolute inset-0 bg-primary-500/10 rounded-2xl border-2 border-dashed border-primary-400 flex items-center justify-center pointer-events-none">
                    <span className="text-primary-400 font-medium text-sm">Drop here</span>
                  </div>
                )}
              </div>
            </div>
          )
        })}

        {/* Empty State */}
        {visibleWidgets.length === 0 && (
          <div className="col-span-full py-12 text-center">
            <Grid3X3 size={48} className="mx-auto text-gray-600 mb-4" />
            <p className="text-gray-500 text-lg mb-2">No widgets visible</p>
            <p className="text-gray-600 text-sm mb-4">Add widgets to customize your dashboard</p>
            {hiddenWidgets.length > 0 && (
              <button
                onClick={() => setShowAddMenu(true)}
                className="px-4 py-2 text-sm font-medium rounded-xl bg-gradient-to-r from-primary-500 to-info-500 text-white shadow-glow-sm hover:shadow-glow-md transition-all duration-300 inline-flex items-center gap-2"
              >
                <Plus size={16} />
                Add Widget
              </button>
            )}
          </div>
        )}
      </div>

      {/* Click outside to close menu */}
      {showAddMenu && (
        <div 
          className="fixed inset-0 z-40" 
          onClick={() => setShowAddMenu(false)}
        />
      )}
    </div>
  )
}

export { WidgetGrid }
