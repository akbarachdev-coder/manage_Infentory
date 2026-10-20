"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import Board from "@/components/Board";
import MembersModal from "@/components/MembersModal";
import TaskModal from "@/components/TaskModal";
import { ArrowLeftIcon, UsersIcon } from "@/components/icons";
import { AvatarStack, Button, ErrorText, Spinner } from "@/components/ui";
import { useProject } from "@/lib/useProject";

export default function ProjectBoard({ projectId }: { projectId: string }) {
  const {
    project,
    loading,
    error,
    createColumn,
    renameColumn,
    removeColumn,
    createTask,
    updateTask,
    removeTask,
    moveTask,
    updateMembers,
  } = useProject(projectId);

  const [openTaskId, setOpenTaskId] = useState<string | null>(null);
  const [membersOpen, setMembersOpen] = useState(false);

  const activeMembers = project?.members ?? [];

  const openTask = useMemo(() => {
    if (!openTaskId || !project) return null;
    return project.columns
      .flatMap((column) => column.tasks)
      .find((task) => task.id === openTaskId) ?? null;
  }, [openTaskId, project]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-32">
        <Spinner className="h-8 w-8" />
      </div>
    );
  }

  if (error || !project) {
    return (
      <div className="mx-auto max-w-md py-24 text-center">
        <ErrorText>{error ?? "Project not found"}</ErrorText>
        <Link
          href="/"
          className="mt-4 inline-block text-sm font-medium text-zinc-600 underline underline-offset-4"
        >
          Back to dashboard
        </Link>
      </div>
    );
  }

  const taskCount = project.columns.reduce((total, column) => total + column.tasks.length, 0);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-sm font-medium text-zinc-500 transition-colors hover:text-zinc-900"
          >
            <ArrowLeftIcon className="h-4 w-4" />
            All projects
          </Link>
          <h1 className="mt-2 truncate text-2xl font-semibold tracking-tight text-zinc-900">
            {project.title}
          </h1>
          <p className="mt-1 max-w-2xl text-sm text-zinc-500">
            {project.description || "No description provided."}
          </p>
          <p className="mt-2 text-xs font-medium text-zinc-400">
            {project.columns.length} columns · {taskCount} tasks
          </p>
        </div>

        <Button variant="secondary" onClick={() => setMembersOpen(true)}>
          <AvatarStack users={activeMembers.map((member) => member.user)} max={4} />
          <span className="ml-1">Members</span>
          <UsersIcon className="h-4 w-4 text-zinc-400" />
        </Button>
      </div>

      {error ? <ErrorText>{error}</ErrorText> : null}

      <Board
        project={project}
        onCreateColumn={createColumn}
        onRenameColumn={renameColumn}
        onDeleteColumn={removeColumn}
        onCreateTask={createTask}
        onMoveTask={moveTask}
        onOpenTask={(task) => setOpenTaskId(task.id)}
      />

      {openTask ? (
        <TaskModal
          key={openTask.id}
          projectId={projectId}
          task={openTask}
          members={activeMembers}
          onClose={() => setOpenTaskId(null)}
          onUpdate={updateTask}
          onDelete={async (taskId) => {
            await removeTask(taskId);
            setOpenTaskId(null);
          }}
        />
      ) : null}

      {membersOpen ? (
        <MembersModal
          projectId={projectId}
          ownerId={project.ownerId}
          members={activeMembers}
          onMembersChanged={updateMembers}
          onClose={() => setMembersOpen(false)}
        />
      ) : null}
    </div>
  );
}
