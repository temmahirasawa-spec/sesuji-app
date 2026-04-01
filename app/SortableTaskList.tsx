'use client';

import { useState } from 'react';
import { Task, TaskStatus } from '@/lib/types';
import { DndContext, closestCenter, PointerSensor, TouchSensor, useSensor, useSensors, DragEndEvent, DragOverEvent } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy, useSortable, arrayMove } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

const CATEGORY_OPTIONS = [
  { value: 'morning', label: '☀️ MORNING' },
  { value: 'work', label: '💻 WORK' },
  { value: 'evening', label: '🏋 EVENING' },
  { value: 'night', label: '🌙 NIGHT' },
];

const CATEGORY_ORDER = ['morning', 'work', 'evening', 'night'];

function CategoryDropZone({ cat, catInfo, count, styles: s }: { cat: string; catInfo: { label: string } | undefined; count: number; styles: any }) {
  const { setNodeRef, isOver } = useSortable({ id: `cat_${cat}` });
  return (
    <div ref={setNodeRef} className={`${s.taskGroupHeader} ${isOver ? s.taskGroupHeaderOver : ''}`}>
      <span className={s.taskGroupIcon}>{catInfo?.label.split(' ')[0] || ''}</span>
      <span className={s.taskGroupLabel}>{catInfo?.label.split(' ')[1] || cat.toUpperCase()}</span>
      <span className={s.taskGroupCount}>{count}</span>
    </div>
  );
}

function getStatus(task: Task): TaskStatus {
  if (task.status) return task.status;
  return task.completed ? 'done' : 'pending';
}

function SortableTaskItem({ task, type, isEditing, editText, setEditText, editCategory, setEditCategory, editMemo, setEditMemo, submitEdit, cancelEdit, startEdit, onDelete, onSetStatus, onMemoChange, styles: s }: {
  task: Task; type: 'today' | 'daily';
  isEditing: boolean; editText: string; setEditText: (v: string) => void;
  editCategory: string; setEditCategory: (v: any) => void;
  editMemo: string; setEditMemo: (v: string) => void;
  submitEdit: () => void; cancelEdit: () => void;
  startEdit: () => void; onDelete: () => void; onSetStatus: (status: TaskStatus) => void;
  onMemoChange: (memo: string) => void;
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
        <div className={s.taskEditFields}>
          <input type="text" value={editText} onChange={(e) => setEditText(e.target.value)}
            onKeyDown={(e) => { e.stopPropagation(); if (e.key === 'Enter' && !e.nativeEvent.isComposing) { e.preventDefault(); submitEdit(); } if (e.key === 'Escape') cancelEdit(); }}
            className={s.taskEditInput} placeholder="タスク名" autoFocus />
          <textarea
            value={editMemo}
            onChange={(e) => setEditMemo(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter' && (e.metaKey || e.ctrlKey) && !e.nativeEvent.isComposing) { e.preventDefault(); submitEdit(); } if (e.key === 'Escape') cancelEdit(); }}
            className={s.taskEditMemo}
            placeholder="メモ（任意）- Cmd+Enter で確定"
            rows={2}
          />
          <select value={editCategory} onChange={(e) => setEditCategory(e.target.value)} className={s.addCategorySelect}>
            {CATEGORY_OPTIONS.map(opt => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </div>
        <div className={s.taskEditBtns}>
          <button onClick={submitEdit} className={s.taskEditSave}>OK</button>
          <button onClick={cancelEdit} className={s.taskEditCancel}>&#10005;</button>
        </div>
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
        <div className={s.taskTextWrap} onClick={startEdit}>
          <span className={s.taskText}>{task.text}</span>
          {task.memo && <span className={s.taskMemoPreview}>{task.memo}</span>}
        </div>
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
  editMemo: string;
  setEditMemo: (v: string) => void;
  submitEdit: () => void;
  cancelEdit: () => void;
  startEdit: (date: string, id: number, type: 'today' | 'daily', text: string, category?: string, memo?: string) => void;
  deleteTask: (date: string, id: number, type: 'today' | 'daily') => void;
  setTaskStatus: (date: string, id: number, type: 'today' | 'daily', status: TaskStatus) => void;
  onMemoChange: (date: string, id: number, type: 'today' | 'daily', memo: string) => void;
  onReorder: (date: string, type: 'today' | 'daily', reordered: Task[]) => void;
  styles: any;
}

export default function SortableTaskList({ tasks, date, type, editingTask, editText, setEditText, editCategory, setEditCategory, editMemo, setEditMemo, submitEdit, cancelEdit, startEdit, deleteTask, setTaskStatus, onMemoChange, onReorder, styles: s }: SortableTaskListProps) {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 5 } }),
  );

  // カテゴリごとにタスクをグループ化
  const grouped: Record<string, Task[]> = {};
  for (const cat of CATEGORY_ORDER) grouped[cat] = [];
  for (const task of tasks) {
    const cat = task.category || 'morning';
    if (grouped[cat]) grouped[cat].push(task);
    else grouped['morning'].push(task);
  }

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const activeId = active.id as string;
    const overId = over.id as string;

    // ドロップ先がカテゴリヘッダーの場合
    if (overId.startsWith('cat_')) {
      const targetCat = overId.replace('cat_', '');
      const taskIdx = tasks.findIndex(t => `${type}_${t.id}` === activeId);
      if (taskIdx === -1) return;

      const updated = tasks.map((t, i) => i === taskIdx ? { ...t, category: targetCat as any } : t);
      onReorder(date, type, updated);
      return;
    }

    // タスク間のドラッグ
    const oldIndex = tasks.findIndex(t => `${type}_${t.id}` === activeId);
    const newIndex = tasks.findIndex(t => `${type}_${t.id}` === overId);
    if (oldIndex === -1 || newIndex === -1) return;

    // 移動先タスクのカテゴリを取得して、ドラッグしたタスクのカテゴリを更新
    const targetCat = tasks[newIndex].category || 'morning';
    const reordered = arrayMove(tasks, oldIndex, newIndex);
    reordered[newIndex] = { ...reordered[newIndex], category: targetCat };

    onReorder(date, type, reordered);
  };

  // 全ソート可能アイテムID（カテゴリヘッダー + タスク）
  const allIds = CATEGORY_ORDER.flatMap(cat => [
    `cat_${cat}`,
    ...grouped[cat].map(t => `${type}_${t.id}`),
  ]);

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      <SortableContext items={allIds} strategy={verticalListSortingStrategy}>
        <div className={s.tasksList}>
          {CATEGORY_ORDER.map(cat => {
            const catInfo = CATEGORY_OPTIONS.find(c => c.value === cat);
            const catTasks = grouped[cat];
            return (
              <div key={cat}>
                <CategoryDropZone cat={cat} catInfo={catInfo} count={catTasks.length} styles={s} />
                {catTasks.map(task => {
                  const isEditing = editingTask?.date === date && editingTask?.id === task.id && editingTask?.type === type;
                  return (
                    <SortableTaskItem
                      key={`${type}_${task.id}`}
                      task={task} type={type}
                      isEditing={isEditing}
                      editText={editText} setEditText={setEditText}
                      editCategory={editCategory} setEditCategory={setEditCategory}
                      editMemo={editMemo} setEditMemo={setEditMemo}
                      submitEdit={submitEdit} cancelEdit={cancelEdit}
                      startEdit={() => startEdit(date, task.id, type, task.text, task.category, task.memo)}
                      onDelete={() => deleteTask(date, task.id, type)}
                      onSetStatus={(status) => setTaskStatus(date, task.id, type, status)}
                      onMemoChange={(memo) => onMemoChange(date, task.id, type, memo)}
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
