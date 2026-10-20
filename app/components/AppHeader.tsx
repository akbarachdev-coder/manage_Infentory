"use client";

import Link from "next/link";
import { useState } from "react";
import { LayersIcon, LogoutIcon } from "@/components/icons";
import NotificationsBell from "@/components/NotificationsBell";
import { Avatar, Spinner } from "@/components/ui";
import { useAuth } from "@/lib/auth";

export default function AppHeader() {
  const { user, loading, logout } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-30 border-b border-zinc-200/70 bg-white/80 backdrop-blur-md">
      <div className="mx-auto flex h-14 w-full max-w-7xl items-center justify-between gap-4 px-4 sm:px-6">
        <Link href="/" className="group flex items-center gap-2">
          <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-zinc-900 text-indigo-400 transition-transform group-hover:scale-105">
            <LayersIcon className="h-4 w-4" />
          </span>
          <span className="text-[15px] font-semibold tracking-tight text-zinc-900">TaskFlow</span>
        </Link>

        <div className="flex items-center gap-2">
          {loading ? <Spinner className="h-4 w-4" /> : null}
          {user && !loading ? (
            <>
              <NotificationsBell />
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setMenuOpen((value) => !value)}
                  className="flex items-center gap-2 rounded-full py-1 pl-1 pr-2 ring-1 ring-transparent transition-all hover:bg-white hover:ring-zinc-200"
                >
                  <Avatar name={user.name} src={user.avatarUrl} size="sm" />
                  <span className="hidden text-sm font-medium text-zinc-700 sm:block">
                    {user.name}
                  </span>
                </button>

                {menuOpen ? (
                  <>
                    <div
                      className="fixed inset-0 z-30"
                      onClick={() => setMenuOpen(false)}
                      aria-hidden
                    />
                    <div className="absolute right-0 z-40 mt-2 w-56 overflow-hidden rounded-xl bg-white p-1.5 shadow-xl ring-1 ring-zinc-900/10">
                      <div className="px-3 py-2">
                        <p className="truncate text-sm font-semibold text-zinc-900">{user.name}</p>
                        <p className="truncate text-xs text-zinc-500">{user.email}</p>
                      </div>
                      <div className="my-1 h-px bg-zinc-100" />
                      <button
                        type="button"
                        onClick={logout}
                        className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-100"
                      >
                        <LogoutIcon className="h-4 w-4" />
                        Sign out
                      </button>
                    </div>
                  </>
                ) : null}
              </div>
            </>
          ) : null}
        </div>
      </div>
    </header>
  );
}
