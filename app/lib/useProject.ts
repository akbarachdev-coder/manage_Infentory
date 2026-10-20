"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { api } from "@/lib/api";
import type { BoardColumn, Priority, Project, ProjectMember, Task } from "@/lib/types";

interface CreateTaskInput {
  columnId: string;
  title: string;
  description?: string | null;
  priority?: Priority;
  dueDate?: string | null;
}

function swapTask(columns: BoardColumn[], task: Task): BoardColumn[] {
  return columns.map((column) =>
    column.id === task.columnId
      ? { ...column, tasks: column.tasks.map((entry) => (entry.id === task.id ? task : entry)) }
      : column,
  );
}

function stripTask(columns: BoardColumn[], taskId: string): BoardColumn[] {
  return columns.map((column) => ({
    ...column,
    tasks: column.tasks.filter((task) => task.id !== taskId),
  }));
}

export function useProject(projectId: string) {
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const projectRef = useRef<Project | null>(null);

  useEffect(() => {
    projectRef.current = project;
  }, [project]);

  const fetchProject = useCallback(
    () => api<Project>(`/projects/${projectId}`),
    [projectId],
  );

  const refresh = useCallback(async () => {
    try {
      const data = await fetchProject();
      setProject(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load project");
    } finally {
      setLoading(false);
    }
  }, [fetchProject]);

  useEffect(() => {
    let active = true;

    async function load() {
      try {
        const data = await fetchProject();
        if (active) {
          setProject(data);
          setError(null);
        }
      } catch (err) {
        if (active) setError(err instanceof Error ? err.message : "Failed to load project");
      } finally {
        if (active) setLoading(false);
      }
    }

    void load();
    return () => {
      active = false;
    };
  }, [fetchProject]);

  const createColumn = useCallback(
    async (title: string) => {
      const column = await api<BoardColumn>(`/projects/${projectId}/columns`, {
        method: "POST",
        body: { title },
      });
      setProject((current) =>
        current ? { ...current, columns: [...current.columns, column] } : current,
      );
    },
    [projectId],
  );

  const renameColumn = useCallback(
    async (columnId: string, title: string) => {
      setProject((current) =>
        current
          ? {
              ...current,
              columns: current.columns.map((column) =>
                column.id === columnId ? { ...column, title } : column,
              ),
            }
          : current,
      );
      try {
        await api(`/projects/${projectId}/columns/${columnId}`, {
          method: "PATCH",
          body: { title },
        });
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to rename column");
        await refresh();
      }
    },
    [projectId, refresh],
  );

  const removeColumn = useCallback(
    async (columnId: string) => {
      setProject((current) =>
        current
          ? { ...current, columns: current.columns.filter((column) => column.id !== columnId) }
          : current,
      );
      try {
        await api(`/projects/${projectId}/columns/${columnId}`, { method: "DELETE" });
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to delete column");
        await refresh();
      }
    },
    [projectId, refresh],
  );

  const createTask = useCallback(
    async (input: CreateTaskInput) => {
      const task = await api<Task>(`/projects/${projectId}/tasks`, {
        method: "POST",
        body: {
          columnId: input.columnId,
          title: input.title,
          description: input.description ?? null,
          priority: input.priority ?? "MEDIUM",
          dueDate: input.dueDate ?? null,
        },
      });
      setProject((current) =>
        current
          ? {
              ...current,
              columns: current.columns.map((column) =>
                column.id === task.columnId
                  ? { ...column, tasks: [...column.tasks, task] }
                  : column,
              ),
            }
          : current,
      );
      return task;
    },
    [projectId],
  );

  const updateTask = useCallback(
    async (taskId: string, body: Record<string, unknown>) => {
      const task = await api<Task>(`/projects/${projectId}/tasks/${taskId}`, {
        method: "PATCH",
        body,
      });
      setProject((current) =>
        current ? { ...current, columns: swapTask(current.columns, task) } : current,
      );
      return task;
    },
    [projectId],
  );

  const removeTask = useCallback(
    async (taskId: string) => {
      setProject((current) =>
        current ? { ...current, columns: stripTask(current.columns, taskId) } : current,
      );
      try {
        await api(`/projects/${projectId}/tasks/${taskId}`, { method: "DELETE" });
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to delete task");
        await refresh();
      }
    },
    [projectId, refresh],
  );

  const moveTask = useCallback(
    async (taskId: string, columnId: string, position: number) => {
      const snapshot = projectRef.current;
      if (!snapshot) return;

      const source = snapshot.columns.find((column) =>
        column.tasks.some((task) => task.id === taskId),
      );
      const task = source?.tasks.find((entry) => entry.id === taskId);
      if (!task || !source) return;

      const columns = stripTask(snapshot.columns, taskId).map((column) => {
        if (column.id !== columnId) return column;
        const tasks = [...column.tasks];
        tasks.splice(Math.max(0, Math.min(position, tasks.length)), 0, { ...task, columnId });
        return { ...column, tasks: tasks.map((entry, index) => ({ ...entry, position: index })) };
      });

      setProject({ ...snapshot, columns });

      try {
        await api(`/projects/${projectId}/tasks/${taskId}/move`, {
          method: "PATCH",
          body: { columnId, position },
        });
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to move task");
        setProject(snapshot);
        await refresh();
      }
    },
    [projectId, refresh],
  );

  const updateMembers = useCallback((members: ProjectMember[]) => {
    setProject((current) => (current ? { ...current, members } : current));
  }, []);

  return {
    project,
    loading,
    error,
    refresh,
    createColumn,
    renameColumn,
    removeColumn,
    createTask,
    updateTask,
    removeTask,
    moveTask,
    updateMembers,
  };
}
