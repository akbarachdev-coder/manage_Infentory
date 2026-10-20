"use client";

import { useEffect, useState } from "react";
import { UsersIcon } from "@/components/icons";
import { Avatar, Badge, Button, ErrorText, Field, Input, Modal, Spinner } from "@/components/ui";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { roleStyles } from "@/lib/format";
import type { ProjectMember, User } from "@/lib/types";

interface MembersModalProps {
  projectId: string;
  ownerId: string;
  members: ProjectMember[];
  onMembersChanged: (members: ProjectMember[]) => void;
  onClose: () => void;
}

export default function MembersModal({
  projectId,
  ownerId,
  members,
  onMembersChanged,
  onClose,
}: MembersModalProps) {
  const { user } = useAuth();
  const [search, setSearch] = useState("");
  const [results, setResults] = useState<User[]>([]);
  const [searching, setSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const canManage = Boolean(user && (user.id === ownerId || members.some(
    (member) => member.userId === user.id && (member.role === "OWNER" || member.role === "ADMIN"),
  )));

  useEffect(() => {
    const query = search.trim();
    if (query.length < 1) return;

    const existingIds = new Set(members.map((member) => member.userId));
    let active = true;
    const timer = setTimeout(async () => {
      setSearching(true);
      try {
        const users = await api<User[]>(`/users?search=${encodeURIComponent(query)}`);
        if (active) setResults(users.filter((entry) => !existingIds.has(entry.id)));
      } catch {
        if (active) setResults([]);
      } finally {
        if (active) setSearching(false);
      }
    }, 300);

    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [search, members]);

  async function addMember(userId: string) {
    setBusy(true);
    setError(null);
    try {
      const member = await api<ProjectMember>(`/projects/${projectId}/members`, {
        method: "POST",
        body: { userId, role: "MEMBER" },
      });
      onMembersChanged([...members, member]);
      setSearch("");
      setResults([]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to add member");
    } finally {
      setBusy(false);
    }
  }

  async function removeMember(member: ProjectMember) {
    setError(null);
    onMembersChanged(members.filter((entry) => entry.id !== member.id));
    try {
      await api(`/projects/${projectId}/members/${member.userId}`, { method: "DELETE" });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to remove member");
      onMembersChanged(members);
    }
  }

  return (
    <Modal open onClose={onClose} title="Project members">
      <div className="space-y-5">
        <div>
          <span className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
            {members.length} member{members.length === 1 ? "" : "s"}
          </span>
          <ul className="mt-3 space-y-2">
            {members.map((member) => (
              <li
                key={member.id}
                className="flex items-center gap-3 rounded-xl bg-zinc-50 px-3 py-2.5 ring-1 ring-zinc-100"
              >
                <Avatar name={member.user.name} src={member.user.avatarUrl} />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-zinc-900">
                    {member.user.name}
                    {member.userId === ownerId ? (
                      <span className="ml-1.5 text-[11px] font-normal text-zinc-400">(owner)</span>
                    ) : null}
                  </p>
                  <p className="truncate text-xs text-zinc-500">{member.user.email}</p>
                </div>
                <Badge className={roleStyles[member.role] ?? roleStyles.MEMBER}>{member.role}</Badge>
                {canManage && member.userId !== ownerId ? (
                  <button
                    type="button"
                    onClick={() => void removeMember(member)}
                    disabled={busy}
                    className="text-xs font-medium text-zinc-400 transition-colors hover:text-rose-600 disabled:opacity-50"
                  >
                    Remove
                  </button>
                ) : null}
              </li>
            ))}
          </ul>
        </div>

        {canManage ? (
          <div className="rounded-xl bg-white p-4 ring-1 ring-zinc-200">
            <Field label="Add by name or email">
              <div className="relative">
                <Input
                  value={search}
                  placeholder="Search people…"
                  onChange={(event) => {
                    const value = event.target.value;
                    setSearch(value);
                    if (!value.trim()) setResults([]);
                  }}
                />
                {searching ? (
                  <span className="absolute right-3 top-1/2 -translate-y-1/2">
                    <Spinner className="h-4 w-4" />
                  </span>
                ) : null}
              </div>
            </Field>

            {results.length > 0 ? (
              <ul className="mt-3 space-y-1.5">
                {results.slice(0, 6).map((entry) => (
                  <li
                    key={entry.id}
                    className="flex items-center gap-3 rounded-lg px-2 py-1.5 hover:bg-zinc-50"
                  >
                    <Avatar name={entry.name} src={entry.avatarUrl} size="sm" />
                    <span className="min-w-0 flex-1 truncate text-sm text-zinc-700">
                      {entry.name}
                      <span className="ml-1.5 text-xs text-zinc-400">{entry.email}</span>
                    </span>
                    <Button
                      variant="secondary"
                      className="px-2.5 py-1 text-xs"
                      disabled={busy}
                      onClick={() => void addMember(entry.id)}
                    >
                      Add
                    </Button>
                  </li>
                ))}
              </ul>
            ) : search.trim() ? (
              <p className="mt-3 flex items-center gap-1.5 text-xs text-zinc-400">
                <UsersIcon className="h-3.5 w-3.5" />
                {searching ? "Searching…" : "No matching people found."}
              </p>
            ) : null}
          </div>
        ) : null}

        <ErrorText>{error}</ErrorText>

        <div className="flex justify-end border-t border-zinc-100 pt-4">
          <Button variant="secondary" onClick={onClose}>
            Done
          </Button>
        </div>
      </div>
    </Modal>
  );
}
