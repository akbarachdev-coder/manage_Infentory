"use client";

import { useEffect, useState } from "react";
import { Avatar, Badge, Button, ErrorText, Field, Input, Modal, Select, Spinner, Textarea } from "@/components/ui";
import { CloseIcon, TrashIcon } from "@/components/icons";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { formatDate, priorityStyles } from "@/lib/format";
import type { Comment, Priority, ProjectMember, Task } from "@/lib/types";

interface TaskModalProps {
  projectId: string;
  task: Task;
  members: ProjectMember[];
  onClose: () => void;
  onUpdate: (taskId: string, body: Record<string, unknown>) => Promise<Task>;
  onDelete: (taskId: string) => Promise<void>;
}

export default function TaskModal({
  projectId,
  task,
  members,
  onClose,
  onUpdate,
  onDelete,
}: TaskModalProps) {
  const { user } = useAuth();
  const [detail, setDetail] = useState<Task | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [title, setTitle] = useState(task.title);
  const [description, setDescription] = useState(task.description ?? "");
  const [priority, setPriority] = useState<Priority>(task.priority);
  const [dueDate, setDueDate] = useState(task.dueDate ? task.dueDate.slice(0, 10) : "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dirty, setDirty] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const [comment, setComment] = useState("");
  const [commentBusy, setCommentBusy] = useState(false);
  const [assigneeToAdd, setAssigneeToAdd] = useState("");

  useEffect(() => {
    let active = true;
    async function load() {
      try {
        const full = await api<Task>(`/projects/${projectId}/tasks/${task.id}`);
        if (!active) return;
        setDetail(full);
        setTitle(full.title);
        setDescription(full.description ?? "");
        setPriority(full.priority);
        setDueDate(full.dueDate ? full.dueDate.slice(0, 10) : "");
      } catch (err) {
        if (active) setLoadError(err instanceof Error ? err.message : "Failed to load task");
      } finally {
        if (active) setLoading(false);
      }
    }
    void load();
    return () => {
      active = false;
    };
  }, [projectId, task.id]);

  const comments: Comment[] = detail?.comments ?? [];
  const assignees = detail?.assignees ?? task.assignees;
  const availableMembers = members.filter(
    (member) => !assignees.some((assignee) => assignee.user.id === member.userId),
  );

  async function save() {
    const trimmed = title.trim();
    if (!trimmed) {
      setError("Title cannot be empty");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const updated = await onUpdate(task.id, {
        title: trimmed,
        description: description.trim() || null,
        priority,
        dueDate: dueDate ? new Date(`${dueDate}T00:00:00.000Z`).toISOString() : null,
      });
      setDetail((current) => (current ? { ...current, ...updated, comments } : updated));
      setDirty(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save task");
    } finally {
      setSaving(false);
    }
  }

  async function removeTask() {
    setSaving(true);
    try {
      await onDelete(task.id);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete task");
      setSaving(false);
      setConfirmDelete(false);
    }
  }

  async function addComment() {
    const content = comment.trim();
    if (!content) return;
    setCommentBusy(true);
    setError(null);
    try {
      const created = await api<Comment>(`/tasks/${task.id}/comments`, {
        method: "POST",
        body: { content },
      });
      setDetail((current) =>
        current ? { ...current, comments: [...comments, created] } : current,
      );
      setComment("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to post comment");
    } finally {
      setCommentBusy(false);
    }
  }

  async function removeComment(commentId: string) {
    setDetail((current) =>
      current
        ? { ...current, comments: comments.filter((entry) => entry.id !== commentId) }
        : current,
    );
    try {
      await api(`/tasks/${task.id}/comments/${commentId}`, { method: "DELETE" });
    } catch {
      setDetail((current) => (current ? { ...current, comments } : current));
    }
  }

  async function addAssignee(userId: string) {
    if (!userId) return;
    setAssigneeToAdd("");
    const member = members.find((entry) => entry.userId === userId);
    if (!member) return;
    setDetail((current) =>
      current
        ? { ...current, assignees: [...assignees, { user: member.user }] }
        : current,
    );
    try {
      await api(`/projects/${projectId}/tasks/${task.id}/assignees`, {
        method: "POST",
        body: { userId },
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to assign member");
      setDetail((current) =>
        current ? { ...current, assignees: assignees } : current,
      );
    }
  }

  async function removeAssignee(userId: string) {
    setDetail((current) =>
      current
        ? { ...current, assignees: assignees.filter((entry) => entry.user.id !== userId) }
        : current,
    );
    try {
      await api(`/projects/${projectId}/tasks/${task.id}/assignees/${userId}`, {
        method: "DELETE",
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to remove assignee");
      setDetail((current) => (current ? { ...current, assignees } : current));
    }
  }

  return (
    <Modal open onClose={onClose} title="Task details" maxWidth="max-w-2xl">
      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Spinner className="h-6 w-6" />
        </div>
      ) : (
        <div className="space-y-5">
          {loadError ? <ErrorText>{loadError}</ErrorText> : null}

          <div className="space-y-4">
            <Field label="Title">
              <Input
                value={title}
                maxLength={200}
                onChange={(event) => {
                  setTitle(event.target.value);
                  setDirty(true);
                }}
              />
            </Field>

            <Field label="Description">
              <Textarea
                value={description}
                placeholder="Add more detail about this task…"
                onChange={(event) => {
                  setDescription(event.target.value);
                  setDirty(true);
                }}
              />
            </Field>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field label="Priority">
                <Select
                  value={priority}
                  onChange={(event) => {
                    setPriority(event.target.value as Priority);
                    setDirty(true);
                  }}
                >
                  <option value="LOW">Low</option>
                  <option value="MEDIUM">Medium</option>
                  <option value="HIGH">High</option>
                  <option value="URGENT">Urgent</option>
                </Select>
              </Field>
              <Field label="Due date">
                <Input
                  type="date"
                  value={dueDate}
                  onChange={(event) => {
                    setDueDate(event.target.value);
                    setDirty(true);
                  }}
                />
              </Field>
            </div>
          </div>

          <div className="rounded-xl bg-zinc-50 p-4 ring-1 ring-zinc-100">
            <div className="flex items-center justify-between gap-3">
              <span className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
                Assignees
              </span>
              <Badge className={priorityStyles[priority]}>{priority}</Badge>
            </div>

            <div className="mt-3 flex flex-wrap items-center gap-2">
              {assignees.map((assignee) => (
                <span
                  key={assignee.user.id}
                  className="inline-flex items-center gap-1.5 rounded-full bg-white py-1 pl-1 pr-2 text-xs font-medium text-zinc-700 ring-1 ring-zinc-200"
                >
                  <Avatar name={assignee.user.name} src={assignee.user.avatarUrl} size="sm" />
                  {assignee.user.name}
                  <button
                    type="button"
                    aria-label={`Remove ${assignee.user.name}`}
                    onClick={() => void removeAssignee(assignee.user.id)}
                    className="text-zinc-400 hover:text-rose-600"
                  >
                    <CloseIcon className="h-3.5 w-3.5" />
                  </button>
                </span>
              ))}
              {assignees.length === 0 ? (
                <span className="text-xs text-zinc-400">No one assigned yet.</span>
              ) : null}
            </div>

            {availableMembers.length > 0 ? (
              <div className="mt-3">
                <Select
                  value={assigneeToAdd}
                  onChange={(event) => void addAssignee(event.target.value)}
                >
                  <option value="">Assign a member…</option>
                  {availableMembers.map((member) => (
                    <option key={member.userId} value={member.userId}>
                      {member.user.name} ({member.user.email})
                    </option>
                  ))}
                </Select>
              </div>
            ) : null}
          </div>

          <div>
            <span className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
              Comments
            </span>

            <ul className="mt-3 space-y-3">
              {comments.length === 0 ? (
                <li className="text-sm text-zinc-400">No comments yet.</li>
              ) : (
                comments.map((entry) => (
                  <li key={entry.id} className="flex gap-2.5">
                    <Avatar name={entry.user.name} src={entry.user.avatarUrl} size="sm" />
                    <div className="min-w-0 flex-1 rounded-xl rounded-tl-sm bg-zinc-50 px-3 py-2 ring-1 ring-zinc-100">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-xs font-semibold text-zinc-800">
                          {entry.user.name}
                        </span>
                        <span className="text-[11px] text-zinc-400">
                          {formatDate(entry.createdAt)}
                        </span>
                      </div>
                      <p className="mt-0.5 whitespace-pre-wrap break-words text-sm text-zinc-600">
                        {entry.content}
                      </p>
                      {user && entry.userId === user.id ? (
                        <button
                          type="button"
                          onClick={() => void removeComment(entry.id)}
                          className="mt-1 text-[11px] font-medium text-zinc-400 hover:text-rose-600"
                        >
                          Delete
                        </button>
                      ) : null}
                    </div>
                  </li>
                ))
              )}
            </ul>

            <div className="mt-3 flex gap-2">
              <Textarea
                rows={2}
                placeholder="Write a comment…"
                className="flex-1"
                value={comment}
                onChange={(event) => setComment(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter" && (event.metaKey || event.ctrlKey)) {
                    event.preventDefault();
                    void addComment();
                  }
                }}
              />
              <Button
                variant="secondary"
                disabled={commentBusy || !comment.trim()}
                onClick={() => void addComment()}
                className="self-end"
              >
                {commentBusy ? "Posting…" : "Post"}
              </Button>
            </div>
            <p className="mt-1 text-[11px] text-zinc-400">Tip: Ctrl/Cmd + Enter to post.</p>
          </div>

          <ErrorText>{error}</ErrorText>

          <div className="flex items-center justify-between gap-3 border-t border-zinc-100 pt-4">
            {confirmDelete ? (
              <div className="flex items-center gap-2">
                <span className="text-xs text-zinc-500">Delete this task permanently?</span>
                <Button variant="danger" onClick={() => void removeTask()} disabled={saving}>
                  <TrashIcon className="h-4 w-4" />
                  Confirm
                </Button>
                <Button variant="ghost" onClick={() => setConfirmDelete(false)}>
                  Cancel
                </Button>
              </div>
            ) : (
              <Button
                variant="ghost"
                className="text-rose-600 hover:bg-rose-50 hover:text-rose-700"
                onClick={() => setConfirmDelete(true)}
              >
                <TrashIcon className="h-4 w-4" />
                Delete task
              </Button>
            )}

            <div className="flex items-center gap-2">
              <Button variant="secondary" onClick={onClose}>
                Close
              </Button>
              <Button onClick={() => void save()} disabled={saving || !dirty}>
                {saving ? "Saving…" : "Save changes"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </Modal>
  );
}
