'use client';

import { Task, TaskStatus } from '@/lib/types';
import { DndContext, closestCenter, PointerSensor, TouchSensor, useSensor, useSensors, DragEndEvent } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy, useSortable, arrayMove } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

const CATEGORY_OPTIONS = [
  { value: 'morning', label: '☀ MORNING' },
  { value: 'work', label: '💻 WORK' },
  { value: 'evening', label: '🏋 EVENING' },
  { value: 'night', label: '🌙 NIGHT' },
];

function getStatus(task: Task): TaskStatus {
  if (task.status) return task.status;
  return task.completed ? 'done' : 'pending';
}

function SortableTaskItem({ task, type, isEditing, editText, setEditText, editCategory, setEditCategory, submitEdit, cancelEdit, startEdit, onDelete, onSetStatus, styles: s }: {
  task: Task; type: 'today' | 'daily';
  isEditing: boolean; editText: string; setEditText: (v: string) => void;
  editCategory: string; setEditCategory: (v: any) => void;
  submitEdit: () => void; cancelEdit: () => void;
  startEdit: () => void; onDelete: () => void; onSetStatus: (status: TaskStatus) => void;
  styles: any;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: `${type}_${task.id}` });
  const status = getStatus(task);

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  if (isEditing) {
    return (
      <div ref={setNodeRef} style={style} className={s.taskEditRow}>
        <input type="text" value={editText} onChange={(e) => setEditText(e.target.value)}
          onKeyDown={(e) => { e.stopPropagation(); if (e.key === 'Enter' && !e.nativeEvent.isComposing) { e.preventDefault(); submitEdit(); } if (e.key === 'Escape') cancelEdit(); }}
          className={s.taskEditInput} autoFocus />
        <select value={editCategory} onChange={(e) => setEditCategory(e.target.value)} className={s.addCategorySelect}>
          {CATEGORY_OPTIONS.map(opt => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
        <button onClick={submitEdit} className={s.taskEditSave}>OK</button>
        <button onClick={cancelEdit} className={s.taskEditCancel}>&#10005;</button>
      </div>
    );
  }

  const statusClass = status === 'done' ? s.taskDone : status === 'failed' ? s.taskFailed : '';

  return (
    <div ref={setNodeRef} style={style} className={`${s.taskItem} ${statusClass} ${type === 'daily' ? s.taskItemDaily : ''}`}>
      <div className={s.taskDragHandle} {...attributes} {...listeners}>
        <span>&#8942;&#8942;</span>
      </div>
      <div className={s.taskLabel}>
        <div className={s.taskStatusBtns}>
          <button
            onClick={() => onSetStatus(status === 'done' ? 'pending' : 'done')}
            className={`${s.taskStatusBtn} ${s.taskStatusDone} ${status === 'done' ? s.taskStatusActive : ''}`}
            title="完了"
          >&#10003;</button>
          <button
            onClick={() => onSetStatus(status === 'failed' ? 'pending' : 'failed')}
            className={`${s.taskStatusBtn} ${s.taskStatusFail} ${status === 'failed' ? s.taskStatusActive : ''}`}
            title="未達"
          >&#10005;</button>
        </div>
        <span className={s.taskText} onClick={startEdit}>{task.text}</span>
      </div>
      <div className={s.taskActions}>
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
  editCategory: string;
  setEditCategory: (v: any) => void;
  submitEdit: () => void;
  cancelEdit: () => void;
  startEdit: (date: string, id: number, type: 'today' | 'daily', text: string, category?: string) => void;
  deleteTask: (date: string, id: number, type: 'today' | 'daily') => void;
  setTaskStatus: (date: string, id: number, type: 'today' | 'daily', status: TaskStatus) => void;
  onReorder: (date: string, type: 'today' | 'daily', reordered: Task[]) => void;
  styles: any;
}

export default function SortableTaskList({ tasks, date, type, editingTask, editText, setEditText, editCategory, setEditCategory, submitEdit, cancelEdit, startEdit, deleteTask, setTaskStatus, onReorder, styles: s }: SortableTaskListProps) {
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

  // カテゴリ順にグループ化（ドラッグはカテゴリ内で動作）
  const categoryOrder = ['morning', 'work', 'evening', 'night'];
  const grouped: { cat: string; tasks: Task[] }[] = [];
  const seen = new Set<string>();

  // まずカテゴリ順にグループを作成
  for (const cat of categoryOrder) {
    const catTasks = tasks.filter(t => (t.category || 'morning') === cat);
    if (catTasks.length > 0) {
      grouped.push({ cat, tasks: catTasks });
      seen.add(cat);
    }
  }
  // 未知のカテゴリがあれば末尾に
  const remaining = tasks.filter(t => !seen.has(t.category || 'morning'));
  if (remaining.length > 0) {
    grouped.push({ cat: 'other', tasks: remaining });
  }

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      <SortableContext items={tasks.map(t => `${type}_${t.id}`)} strategy={verticalListSortingStrategy}>
        <div className={s.tasksList}>
          {grouped.map(group => {
            const catInfo = CATEGORY_OPTIONS.find(c => c.value === group.cat);
            return (
              <div key={group.cat}>
                <div className={s.taskGroupHeader}>
                  <span className={s.taskGroupIcon}>{catInfo?.label.split(' ')[0] || ''}</span>
                  <span className={s.taskGroupLabel}>{catInfo?.label.split(' ')[1] || group.cat.toUpperCase()}</span>
                </div>
                {group.tasks.map(task => {
                  const isEditing = editingTask?.date === date && editingTask?.id === task.id && editingTask?.type === type;
                  return (
                    <SortableTaskItem
                      key={`${type}_${task.id}`}
                      task={task} type={type}
                      isEditing={isEditing}
                      editText={editText} setEditText={setEditText}
                      editCategory={editCategory} setEditCategory={setEditCategory}
                      submitEdit={submitEdit} cancelEdit={cancelEdit}
                      startEdit={() => startEdit(date, task.id, type, task.text, task.category)}
                      onDelete={() => deleteTask(date, task.id, type)}
                      onSetStatus={(status) => setTaskStatus(date, task.id, type, status)}
                      styles={s}
                    />
                  );
                })}
              </div>
            );
          })}
        </div>
      </SortableContext>
    </DndContext>
  );
}
