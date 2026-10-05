import type { ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  TouchSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core'
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { GripVertical } from 'lucide-react'

function Row({ id, children }: { id: string; children: ReactNode }) {
  const { t } = useTranslation()
  const {
    attributes,
    listeners,
    setNodeRef,
    setActivatorNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id })
  return (
    <li
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={`flex items-center gap-2 rounded-[18px] border border-hairline bg-surface p-2 ${isDragging ? 'relative z-10 scale-[1.02] shadow-soft' : ''}`}
    >
      <button
        type="button"
        ref={setActivatorNodeRef}
        {...attributes}
        {...listeners}
        className="grid size-11 shrink-0 cursor-grab touch-none place-items-center rounded-full text-white/50 hover:text-white active:cursor-grabbing"
        aria-label={t('admin.common.dragToSort')}
      >
        <GripVertical className="size-5" aria-hidden="true" />
      </button>
      <div className="min-w-0 flex-1">{children}</div>
    </li>
  )
}

/** Drag & drop list with a handle per row (touch, mouse and keyboard: space + arrows). */
export function SortableList<T extends { id: string }>({
  items,
  onReorder,
  render,
}: {
  items: T[]
  onReorder: (items: T[]) => void
  render: (item: T) => ReactNode
}) {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 120, tolerance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  )
  const onDragEnd = ({ active, over }: DragEndEvent) => {
    if (!over || active.id === over.id) return
    const from = items.findIndex((i) => i.id === active.id)
    const to = items.findIndex((i) => i.id === over.id)
    onReorder(arrayMove(items, from, to))
  }
  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
      <SortableContext items={items.map((i) => i.id)} strategy={verticalListSortingStrategy}>
        <ul className="space-y-2">
          {items.map((item) => (
            <Row key={item.id} id={item.id}>
              {render(item)}
            </Row>
          ))}
        </ul>
      </SortableContext>
    </DndContext>
  )
}
