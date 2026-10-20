"use client";

import { useState } from "react";
import { CalendarIcon, ChevronLeftIcon, CommentIcon, PlusIcon, TrashIcon } from "@/components/icons";
import { Badge, Input } from "@/components/ui";
import { formatDate, isOverdue, priorityDot, priorityStyles } from "@/lib/format";
import type { BoardColumn, Project, Task } from "@/lib/types";

interface BoardProps {
  project: Project;
  onCreateColumn: (title: string) => Promise<void>;
  onRenameColumn: (columnId: string, title: string) => Promise<void>;
  onDeleteColumn: (columnId: string) => Promise<void>;
  onCreateTask: (input: { columnId: string; title: string }) => Promise<Task>;
  onMoveTask: (taskId: string, columnId: string, position: number) => Promise<void>;
  onOpenTask: (task: Task) => void;
}

interface DragState {
  taskId: string;
  columnId: string;
}

interface DropHint {
  columnId: string;
  index: number;
}

export default function Board({
  project,
  onCreateColumn,
  onRenameColumn,
  onDeleteColumn,
  onCreateTask,
  onMoveTask,
  onOpenTask,
}: BoardProps) {
  const [drag, setDrag] = useState<DragState | null>(null);
  const [hint, setHint] = useState<DropHint | null>(null);
  const [addingTo, setAddingTo] = useState<string | null>(null);
  const [draft, setDraft] = useState("");
  const [newColumnTitle, setNewColumnTitle] = useState("");
  const [showColumnForm, setShowColumnForm] = useState(false);
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameDraft, setRenameDraft] = useState("");
  const [confirmingId, setConfirmingId] = useState<string | null>(null);

  function handleDrop(columnId: string) {
    if (!drag) return;

    const source = project.columns.find((column) => column.id === drag.columnId);
    const target = project.columns.find((column) => column.id === columnId);
    if (!target || !source) return;

    const sourceIndex = source.tasks.findIndex((task) => task.id === drag.taskId);
    const fullLength = target.tasks.length;
    const hasSelf = target.id === source.id;
    const rawIndex = hint && hint.columnId === columnId ? hint.index : fullLength;

    const originalIndex = hasSelf ? sourceIndex : -1;
    const adjusted = rawIndex - (originalIndex >= 0 && originalIndex < rawIndex ? 1 : 0);
    const max = fullLength - (hasSelf ? 1 : 0);
    const position = Math.max(0, Math.min(adjusted, max));

    setDrag(null);
    setHint(null);
    void onMoveTask(drag.taskId, columnId, position);
  }

  function shiftTask(task: Task, direction: -1 | 1) {
    const index = project.columns.findIndex((column) => column.id === task.columnId);
    const target = project.columns[index + direction];
    if (!target) return;
    void onMoveTask(task.id, target.id, target.tasks.length);
  }

  async function submitTask(columnId: string) {
    const title = draft.trim();
    if (!title) return;
    setDraft("");
    try {
      await onCreateTask({ columnId, title });
    } catch {
      setDraft(title);
    }
  }

  async function submitNewColumn() {
    const title = newColumnTitle.trim();
    if (!title) return;
    setNewColumnTitle("");
    try {
      await onCreateColumn(title);
      setShowColumnForm(false);
    } catch {
      setNewColumnTitle(title);
    }
  }

  return (
    <div className="-mx-4 overflow-x-auto px-4 pb-4 sm:-mx-6 sm:px-6">
      <div className="flex min-w-max items-start gap-4 pb-2">
        {project.columns.map((column) => (
          <Column
            key={column.id}
            column={column}
            drag={drag}
            hint={hint}
            addingTo={addingTo}
            draft={draft}
            renamingId={renamingId}
            renameDraft={renameDraft}
            confirmingId={confirmingId}
            onAddStart={() => {
              setAddingTo(column.id);
              setDraft("");
            }}
            onAddCancel={() => setAddingTo(null)}
            onDraftChange={setDraft}
            onSubmitTask={() => submitTask(column.id)}
            onDragStart={(taskId) => setDrag({ taskId, columnId: column.id })}
            onDragOver={(index) => setHint({ columnId: column.id, index })}
            onDrop={() => handleDrop(column.id)}
            onDragEnd={() => {
              setDrag(null);
              setHint(null);
            }}
            onOpenTask={onOpenTask}
            onShiftTask={shiftTask}
            onRenameStart={() => {
              setRenamingId(column.id);
              setRenameDraft(column.title);
            }}
            onRenameCancel={() => setRenamingId(null)}
            onRenameDraftChange={setRenameDraft}
            onRenameSubmit={async () => {
              const title = renameDraft.trim();
              setRenamingId(null);
              if (!title || title === column.title) return;
              await onRenameColumn(column.id, title);
            }}
            onDeleteAsk={() => setConfirmingId(column.id)}
            onDeleteCancel={() => setConfirmingId(null)}
            onDeleteConfirm={async () => {
              setConfirmingId(null);
              await onDeleteColumn(column.id);
            }}
          />
        ))}

        <div className="w-64 shrink-0">
          {showColumnForm ? (
            <div className="rounded-xl bg-white p-3 shadow-sm ring-1 ring-zinc-200">
              <Input
                autoFocus
                placeholder="Column name"
                maxLength={100}
                value={newColumnTitle}
                onChange={(event) => setNewColumnTitle(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter") void submitNewColumn();
                  if (event.key === "Escape") setShowColumnForm(false);
                }}
              />
              <div className="mt-2 flex justify-end gap-2">
                <button
                  type="button"
                  className="rounded-lg px-2.5 py-1.5 text-xs font-medium text-zinc-500 hover:bg-zinc-100"
                  onClick={() => setShowColumnForm(false)}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="rounded-lg bg-zinc-900 px-2.5 py-1.5 text-xs font-medium text-white hover:bg-zinc-700"
                  onClick={() => void submitNewColumn()}
                >
                  Add column
                </button>
              </div>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setShowColumnForm(true)}
              className="flex w-full items-center gap-1.5 rounded-xl border border-dashed border-zinc-300 px-3 py-2.5 text-sm font-medium text-zinc-500 transition-colors hover:border-zinc-400 hover:bg-white hover:text-zinc-800"
            >
              <PlusIcon className="h-4 w-4" />
              Add column
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

interface ColumnProps {
  column: BoardColumn;
  drag: DragState | null;
  hint: DropHint | null;
  addingTo: string | null;
  draft: string;
  renamingId: string | null;
  renameDraft: string;
  confirmingId: string | null;
  onAddStart: () => void;
  onAddCancel: () => void;
  onDraftChange: (value: string) => void;
  onSubmitTask: () => void;
  onDragStart: (taskId: string) => void;
  onDragOver: (index: number) => void;
  onDrop: () => void;
  onDragEnd: () => void;
  onOpenTask: (task: Task) => void;
  onShiftTask: (task: Task, direction: -1 | 1) => void;
  onRenameStart: () => void;
  onRenameCancel: () => void;
  onRenameDraftChange: (value: string) => void;
  onRenameSubmit: () => void;
  onDeleteAsk: () => void;
  onDeleteCancel: () => void;
  onDeleteConfirm: () => void;
}

function Column({
  column,
  drag,
  hint,
  addingTo,
  draft,
  renamingId,
  renameDraft,
  confirmingId,
  onAddStart,
  onAddCancel,
  onDraftChange,
  onSubmitTask,
  onDragStart,
  onDragOver,
  onDrop,
  onDragEnd,
  onOpenTask,
  onShiftTask,
  onRenameStart,
  onRenameCancel,
  onRenameDraftChange,
  onRenameSubmit,
  onDeleteAsk,
  onDeleteCancel,
  onDeleteConfirm,
}: ColumnProps) {
  const isRenaming = renamingId === column.id;
  const isConfirming = confirmingId === column.id;
  const isAdding = addingTo === column.id;

  return (
    <section
      className="group flex w-64 shrink-0 flex-col rounded-xl bg-zinc-100/80 p-2.5 ring-1 ring-zinc-200/70"
      onDragOver={(event) => {
        event.preventDefault();
        if (drag) onDragOver(column.tasks.length);
      }}
      onDrop={(event) => {
        event.preventDefault();
        onDrop();
      }}
    >
      <header className="mb-2 flex items-center gap-2 px-1">
        {isRenaming ? (
          <Input
            autoFocus
            className="py-1 text-sm"
            value={renameDraft}
            maxLength={100}
            onChange={(event) => onRenameDraftChange(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") onRenameSubmit();
              if (event.key === "Escape") onRenameCancel();
            }}
            onBlur={onRenameSubmit}
          />
        ) : (
          <>
            <h3 className="flex-1 truncate text-sm font-semibold text-zinc-800">{column.title}</h3>
            <span className="rounded-md bg-white px-1.5 py-0.5 text-xs font-medium text-zinc-500 ring-1 ring-zinc-200">
              {column.tasks.length}
            </span>
            <div className="flex items-center opacity-0 transition-opacity group-hover:opacity-100 hover:opacity-100">
              <button
                type="button"
                aria-label="Rename column"
                onClick={onRenameStart}
                className="rounded-md p-1 text-zinc-400 hover:bg-white hover:text-zinc-700"
              >
                <EditGlyph />
              </button>
              <button
                type="button"
                aria-label="Delete column"
                onClick={onDeleteAsk}
                className="rounded-md p-1 text-zinc-400 hover:bg-white hover:text-rose-600"
              >
                <TrashIcon className="h-3.5 w-3.5" />
              </button>
            </div>
          </>
        )}
      </header>

      {isConfirming ? (
        <div className="mb-2 rounded-lg bg-rose-50 p-2.5 ring-1 ring-rose-200">
          <p className="text-xs text-rose-700">Delete &ldquo;{column.title}&rdquo; and all its tasks?</p>
          <div className="mt-2 flex justify-end gap-2">
            <button
              type="button"
              onClick={onDeleteCancel}
              className="rounded-md px-2 py-1 text-xs font-medium text-zinc-600 hover:bg-white"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={onDeleteConfirm}
              className="rounded-md bg-rose-600 px-2 py-1 text-xs font-medium text-white hover:bg-rose-500"
            >
              Delete
            </button>
          </div>
        </div>
      ) : null}

      <div className="flex min-h-24 flex-1 flex-col gap-2">
        {column.tasks.map((task, index) => (
          <div key={task.id}>
            {hint && hint.columnId === column.id && hint.index === index ? <DropLine /> : null}
            <TaskCard
              task={task}
              dimmed={drag?.taskId === task.id}
              onDragStart={() => onDragStart(task.id)}
              onDragOver={(event) => {
                event.preventDefault();
                event.stopPropagation();
                onDragOver(index);
              }}
              onDragEnd={onDragEnd}
              onOpen={() => onOpenTask(task)}
              onShift={(direction) => onShiftTask(task, direction)}
            />
          </div>
        ))}

        {hint && hint.columnId === column.id && hint.index === column.tasks.length ? (
          <DropLine />
        ) : null}
      </div>

      {isAdding ? (
        <div className="mt-2 rounded-lg bg-white p-2 shadow-sm ring-1 ring-zinc-200">
          <textarea
            autoFocus
            rows={2}
            placeholder="Task title"
            className="w-full resize-none border-0 bg-transparent text-sm text-zinc-900 placeholder:text-zinc-400 focus:outline-none"
            value={draft}
            onChange={(event) => onDraftChange(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter" && !event.shiftKey) {
                event.preventDefault();
                onSubmitTask();
              }
              if (event.key === "Escape") onAddCancel();
            }}
          />
          <div className="mt-1 flex justify-end gap-2">
            <button
              type="button"
              onClick={onAddCancel}
              className="rounded-md px-2 py-1 text-xs font-medium text-zinc-500 hover:bg-zinc-100"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={onSubmitTask}
              className="rounded-md bg-zinc-900 px-2 py-1 text-xs font-medium text-white hover:bg-zinc-700"
            >
              Add task
            </button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={onAddStart}
          className="mt-2 flex items-center gap-1.5 rounded-lg px-2 py-2 text-sm font-medium text-zinc-500 transition-colors hover:bg-white hover:text-zinc-900"
        >
          <PlusIcon className="h-4 w-4" />
          Add task
        </button>
      )}
    </section>
  );
}

function TaskCard({
  task,
  dimmed,
  onDragStart,
  onDragOver,
  onDragEnd,
  onOpen,
  onShift,
}: {
  task: Task;
  dimmed: boolean;
  onDragStart: () => void;
  onDragOver: (event: React.DragEvent) => void;
  onDragEnd: () => void;
  onOpen: () => void;
  onShift: (direction: -1 | 1) => void;
}) {
  const due = formatDate(task.dueDate);
  const comments = task._count?.comments ?? 0;

  return (
    <article
      draggable
      onDragStart={(event) => {
        event.dataTransfer.effectAllowed = "move";
        event.dataTransfer.setData("text/plain", task.id);
        onDragStart();
      }}
      onDragOver={onDragOver}
      onDragEnd={onDragEnd}
      className={`group cursor-grab rounded-lg bg-white p-3 shadow-sm ring-1 ring-zinc-900/5 transition-all hover:shadow-md active:cursor-grabbing ${
        dimmed ? "opacity-40" : ""
      }`}
    >
      <button type="button" onClick={onOpen} className="block w-full text-left">
        <div className="flex items-center gap-1.5">
          <span className={`h-2 w-2 rounded-full ${priorityDot[task.priority]}`} />
          <Badge className={priorityStyles[task.priority]}>{task.priority}</Badge>
        </div>
        <p className="mt-2 text-sm font-medium leading-snug text-zinc-800">{task.title}</p>
      </button>

      <div className="mt-2.5 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 text-xs text-zinc-400">
          {due ? (
            <span
              className={`inline-flex items-center gap-1 ${
                isOverdue(task.dueDate) ? "font-medium text-rose-600" : ""
              }`}
            >
              <CalendarIcon className="h-3.5 w-3.5" />
              {due}
            </span>
          ) : null}
          {comments > 0 ? (
            <span className="inline-flex items-center gap-1">
              <CommentIcon className="h-3.5 w-3.5" />
              {comments}
            </span>
          ) : null}
        </div>

        <div className="flex items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
          <button
            type="button"
            aria-label="Move task left"
            onClick={() => onShift(-1)}
            className="rounded-md p-0.5 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700"
          >
            <ChevronLeftIcon className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            aria-label="Move task right"
            onClick={() => onShift(1)}
            className="rounded-md p-0.5 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700"
          >
            <ChevronLeftIcon className="h-3.5 w-3.5 rotate-180" />
          </button>
        </div>
      </div>

      {task.assignees.length > 0 ? (
        <div className="mt-2.5 flex flex-wrap gap-1">
          {task.assignees.map((assignee) => (
            <span
              key={assignee.user.id}
              className="rounded-md bg-zinc-100 px-1.5 py-0.5 text-[11px] font-medium text-zinc-600"
              title={assignee.user.name}
            >
              {assignee.user.name.split(" ")[0]}
            </span>
          ))}
        </div>
      ) : null}
    </article>
  );
}

function DropLine() {
  return <div className="my-1 h-0.5 rounded-full bg-indigo-500" />;
}

function EditGlyph() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-3.5 w-3.5"
    >
      <path d="M12 20h9" />
      <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z" />
    </svg>
  );
}
