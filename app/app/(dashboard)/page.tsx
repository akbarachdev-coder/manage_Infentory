"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { PlusIcon } from "@/components/icons";
import {
  AvatarStack,
  Button,
  EmptyState,
  ErrorText,
  Field,
  Input,
  Modal,
  Spinner,
  Textarea,
} from "@/components/ui";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import type { Project } from "@/lib/types";

export default function DashboardPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    async function load() {
      try {
        const data = await api<Project[]>("/projects");
        if (active) {
          setProjects(data);
          setError(null);
        }
      } catch (err) {
        if (active) setError(err instanceof Error ? err.message : "Failed to load projects");
      } finally {
        if (active) setLoading(false);
      }
    }
    void load();
    return () => {
      active = false;
    };
  }, []);

  async function createProject(event: React.FormEvent) {
    event.preventDefault();
    setSaveError(null);
    setSaving(true);
    try {
      const project = await api<Project>("/projects", {
        method: "POST",
        body: { title: title.trim(), description: description.trim() || null },
      });
      setProjects((current) => [project, ...current]);
      setModalOpen(false);
      setTitle("");
      setDescription("");
      router.push(`/projects/${project.id}`);
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : "Failed to create project");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-zinc-900">
            {user ? `Hello, ${user.name.split(" ")[0]}` : "Projects"}
          </h1>
          <p className="mt-1 text-sm text-zinc-500">
            Pick a board to continue, or start something new.
          </p>
        </div>
        <Button onClick={() => setModalOpen(true)}>
          <PlusIcon className="h-4 w-4" />
          New project
        </Button>
      </div>

      {error ? <ErrorText>{error}</ErrorText> : null}

      {loading ? (
        <div className="flex items-center justify-center py-24">
          <Spinner className="h-8 w-8" />
        </div>
      ) : projects.length === 0 ? (
        <EmptyState
          title="No projects yet"
          description="Create your first project and TaskFlow will set up To Do, In Progress, and Done columns for you."
          action={
            <Button onClick={() => setModalOpen(true)}>
              <PlusIcon className="h-4 w-4" />
              Create project
            </Button>
          }
        />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {projects.map((project) => {
            const tasks = project.columns.reduce((total, column) => total + column.tasks.length, 0);
            const members = project.members.map((member) => member.user);
            const accent = ["from-indigo-500", "from-violet-500", "from-rose-500", "from-emerald-500"][
              project.title.length % 4
            ];

            return (
              <Link
                key={project.id}
                href={`/projects/${project.id}`}
                className="group relative overflow-hidden rounded-2xl bg-white p-5 shadow-sm ring-1 ring-zinc-900/5 transition-all hover:-translate-y-0.5 hover:shadow-lg hover:shadow-zinc-900/10"
              >
                <span
                  className={`absolute inset-x-0 top-0 h-1 bg-gradient-to-r ${accent} to-transparent opacity-70`}
                />
                <h2 className="text-base font-semibold text-zinc-900 group-hover:text-indigo-600">
                  {project.title}
                </h2>
                <p className="mt-1 line-clamp-2 min-h-10 text-sm text-zinc-500">
                  {project.description || "No description"}
                </p>

                <div className="mt-5 flex items-center justify-between">
                  <AvatarStack users={members} />
                  <span className="text-xs font-medium text-zinc-400">
                    {project.columns.length} cols · {tasks} tasks
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
      )}

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="New project">
        <form onSubmit={createProject} className="space-y-4">
          <Field label="Project name">
            <Input
              required
              maxLength={200}
              placeholder="Website Redesign"
              value={title}
              onChange={(event) => setTitle(event.target.value)}
            />
          </Field>
          <Field label="Description" hint="Optional">
            <Textarea
              maxLength={2000}
              placeholder="What is this project about?"
              value={description}
              onChange={(event) => setDescription(event.target.value)}
            />
          </Field>
          <ErrorText>{saveError}</ErrorText>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="secondary" onClick={() => setModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? "Creating…" : "Create project"}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
