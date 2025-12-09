'use client'

import { useState, useCallback, useEffect, ReactNode } from 'react'
import { GripVertical, RotateCcw, Maximize2, Minimize2 } from 'lucide-react'

export interface Widget {
  id: string
  title: string
  component: ReactNode
  minWidth?: 1 | 2 | 3 | 4
  defaultWidth?: 1 | 2 | 3 | 4
  defaultHeight?: 'auto' | 'small' | 'medium' | 'large'
}

interface WidgetLayout {
  id: string
  order: number
  width: 1 | 2 | 3 | 4
  collapsed: boolean
}

interface WidgetGridProps {
  widgets: Widget[]
  storageKey?: string
  onLayoutChange?: (layout: WidgetLayout[]) => void
}

const STORAGE_PREFIX = 'widget-layout-'

export default function WidgetGrid({ widgets, storageKey = 'default', onLayoutChange }: WidgetGridProps) {
  const [layout, setLayout] = useState<WidgetLayout[]>([])
  const [draggedId, setDraggedId] = useState<string | null>(null)
  const [dragOverId, setDragOverId] = useState<string | null>(null)
  const [isEditing, setIsEditing] = useState(false)

  // Initialize layout from storage or defaults
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_PREFIX + storageKey)
    if (stored) {
      try {
        const parsed = JSON.parse(stored)
        // Merge with widgets to handle new widgets
        const merged = widgets.map((w, idx) => {
          const existing = parsed.find((l: WidgetLayout) => l.id === w.id)
          return existing || {
            id: w.id,
            order: idx,
            width: w.defaultWidth || 2,
            collapsed: false,
          }
        })
        setLayout(merged.sort((a: WidgetLayout, b: WidgetLayout) => a.order - b.order))
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
      width: w.defaultWidth || 2 as 1 | 2 | 3 | 4,
      collapsed: false,
    }))
    setLayout(defaultLayout)
  }, [widgets])

  // Save layout to storage
  useEffect(() => {
    if (layout.length > 0) {
      localStorage.setItem(STORAGE_PREFIX + storageKey, JSON.stringify(layout))
      onLayoutChange?.(layout)
    }
  }, [layout, storageKey, onLayoutChange])

  const handleDragStart = useCallback((e: React.DragEvent, id: string) => {
    setDraggedId(id)
    e.dataTransfer.effectAllowed = 'move'
    e.dataTransfer.setData('text/plain', id)
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

      // Swap positions
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

  const resetLayout = useCallback(() => {
    localStorage.removeItem(STORAGE_PREFIX + storageKey)
    initDefaultLayout()
    setIsEditing(false)
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

  return (
    <div className="space-y-4">
      {/* Edit Controls */}
      <div className="flex items-center justify-end gap-2">
        <button
          onClick={() => setIsEditing(!isEditing)}
          className={`px-3 py-1.5 text-xs rounded-lg transition-colors flex items-center gap-1 ${
            isEditing 
              ? 'bg-primary-500 text-white' 
              : 'bg-surface hover:bg-surface-light text-gray-400'
          }`}
        >
          <GripVertical size={14} />
          {isEditing ? 'Done' : 'Edit Layout'}
        </button>
        {isEditing && (
          <button
            onClick={resetLayout}
            className="px-3 py-1.5 text-xs rounded-lg bg-surface hover:bg-surface-light text-gray-400 transition-colors flex items-center gap-1"
          >
            <RotateCcw size={14} />
            Reset
          </button>
        )}
      </div>

      {/* Widget Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {layout.map((item) => {
          const widget = widgets.find(w => w.id === item.id)
          if (!widget) return null

          const isDragging = draggedId === item.id
          const isDragOver = dragOverId === item.id

          return (
            <div
              key={item.id}
              className={`${getWidthClass(item.width)} transition-all duration-200 ${
                isDragging ? 'opacity-50 scale-95' : ''
              } ${isDragOver ? 'ring-2 ring-primary-500 ring-offset-2 ring-offset-background' : ''}`}
              draggable={isEditing}
              onDragStart={(e) => handleDragStart(e, item.id)}
              onDragOver={(e) => handleDragOver(e, item.id)}
              onDragLeave={handleDragLeave}
              onDrop={(e) => handleDrop(e, item.id)}
              onDragEnd={handleDragEnd}
            >
              <div className={`bg-surface-dark rounded-lg border border-gray-800 overflow-hidden h-full ${
                isEditing ? 'cursor-move' : ''
              }`}>
                {/* Widget Header */}
                <div className={`flex items-center justify-between px-4 py-2 border-b border-gray-800 ${
                  isEditing ? 'bg-surface-light' : ''
                }`}>
                  <div className="flex items-center gap-2">
                    {isEditing && (
                      <GripVertical size={16} className="text-gray-500 cursor-grab" />
                    )}
                    <h3 className="font-semibold text-sm">{widget.title}</h3>
                  </div>
                  <div className="flex items-center gap-1">
                    {isEditing && (
                      <>
                        <button
                          onClick={() => changeWidth(item.id, -1)}
                          disabled={item.width <= (widget.minWidth || 1)}
                          className="p-1 hover:bg-surface rounded disabled:opacity-30 disabled:cursor-not-allowed"
                          title="Decrease width"
                        >
                          <Minimize2 size={14} className="text-gray-400" />
                        </button>
                        <span className="text-xs text-gray-500 px-1">{item.width}/4</span>
                        <button
                          onClick={() => changeWidth(item.id, 1)}
                          disabled={item.width >= 4}
                          className="p-1 hover:bg-surface rounded disabled:opacity-30 disabled:cursor-not-allowed"
                          title="Increase width"
                        >
                          <Maximize2 size={14} className="text-gray-400" />
                        </button>
                      </>
                    )}
                    <button
                      onClick={() => toggleCollapse(item.id)}
                      className="p-1 hover:bg-surface rounded"
                      title={item.collapsed ? 'Expand' : 'Collapse'}
                    >
                      <span className={`text-gray-400 transition-transform inline-block ${
                        item.collapsed ? 'rotate-180' : ''
                      }`}>
                        ▼
                      </span>
                    </button>
                  </div>
                </div>

                {/* Widget Content */}
                <div className={`transition-all duration-300 overflow-hidden ${
                  item.collapsed ? 'max-h-0' : 'max-h-[800px]'
                }`}>
                  <div className="p-4">
                    {widget.component}
                  </div>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

export { WidgetGrid }
