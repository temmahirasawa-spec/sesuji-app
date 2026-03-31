'use client';

import { Task } from '@/lib/types';
import { DndContext, closestCenter, PointerSensor, TouchSensor, useSensor, useSensors, DragEndEvent } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy, useSortable, arrayMove } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

function SortableTaskItem({ task, type, isEditing, editText, setEditText, submitEdit, cancelEdit, startEdit, onDelete, onToggle, styles: s }: {
  task: Task; type: 'today' | 'daily';
  isEditing: boolean; editText: string; setEditText: (v: string) => void;
  submitEdit: () => void; cancelEdit: () => void;
  startEdit: () => void; onDelete: () => void; onToggle: (e: any) => void;
  styles: any;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: `${type}_${task.id}` });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  if (isEditing) {
    return (
      <div ref={setNodeRef} style={style} className={s.taskEditRow}>
        <input type="text" value={editText} onChange={(e) => setEditText(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') submitEdit(); if (e.key === 'Escape') cancelEdit(); }}
          className={s.taskEditInput} autoFocus />
        <button onClick={submitEdit} className={s.taskEditSave}>OK</button>
        <button onClick={cancelEdit} className={s.taskEditCancel}>&#10005;</button>
      </div>
    );
  }

  return (
    <div ref={setNodeRef} style={style} className={`${s.taskItem} ${task.completed ? s.taskCompleted : ''} ${type === 'daily' ? s.taskItemDaily : ''}`}>
      <div className={s.taskDragHandle} {...attributes} {...listeners}>
        <span>&#8942;&#8942;</span>
      </div>
      <label className={s.taskLabel}>
        <input type="checkbox" checked={task.completed} onChange={onToggle} className={s.taskCheckbox} />
        <span className={s.taskText}>{task.text}</span>
        {task.completed && <span className={s.taskCheck}>&#10003;</span>}
      </label>
      <div className={s.taskActions}>
        <button onClick={startEdit} className={s.taskActionBtn} title="編集">&#9998;</button>
        <button onClick={onDelete} className={`${s.taskActionBtn} ${s.taskActionDelete}`} title="削除">&#10005;</button>
      </div>
    </div>
  );
}

interface SortableTaskListProps {
  tasks: Task[];
  date: string;
  type: 'today' | 'daily';
  editingTask: { date: string; id: number; type: 'today' | 'daily' } | null;
  editText: string;
  setEditText: (v: string) => void;
  submitEdit: () => void;
  cancelEdit: () => void;
  startEdit: (date: string, id: number, type: 'today' | 'daily', text: string) => void;
  deleteTask: (date: string, id: number, type: 'today' | 'daily') => void;
  toggleTask: (date: string, id: number, type: 'today' | 'daily', e?: any) => void;
  onReorder: (date: string, type: 'today' | 'daily', reordered: Task[]) => void;
  styles: any;
}

export default function SortableTaskList({ tasks, date, type, editingTask, editText, setEditText, submitEdit, cancelEdit, startEdit, deleteTask, toggleTask, onReorder, styles: s }: SortableTaskListProps) {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 5 } }),
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = tasks.findIndex(t => `${type}_${t.id}` === active.id);
    const newIndex = tasks.findIndex(t => `${type}_${t.id}` === over.id);
    if (oldIndex === -1 || newIndex === -1) return;
    const reordered = arrayMove(tasks, oldIndex, newIndex);
    onReorder(date, type, reordered);
  };

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      <SortableContext items={tasks.map(t => `${type}_${t.id}`)} strategy={verticalListSortingStrategy}>
        <div className={s.tasksList}>
          {tasks.map(task => {
            const isEditing = editingTask?.date === date && editingTask?.id === task.id && editingTask?.type === type;
            return (
              <SortableTaskItem
                key={`${type}_${task.id}`}
                task={task} type={type}
                isEditing={isEditing}
                editText={editText} setEditText={setEditText}
                submitEdit={submitEdit} cancelEdit={cancelEdit}
                startEdit={() => startEdit(date, task.id, type, task.text)}
                onDelete={() => deleteTask(date, task.id, type)}
                onToggle={(e) => toggleTask(date, task.id, type, e)}
                styles={s}
              />
            );
          })}
        </div>
      </SortableContext>
    </DndContext>
  );
}
