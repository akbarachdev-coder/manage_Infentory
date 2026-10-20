"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useAuth } from "@/lib/auth";

export default function AuthShell({
  title,
  subtitle,
  children,
  footer,
}: {
  title: string;
  subtitle: string;
  children: React.ReactNode;
  footer: React.ReactNode;
}) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && user) router.replace("/");
  }, [loading, user, router]);

  return (
    <div className="relative flex min-h-screen flex-1 items-center justify-center overflow-hidden px-4 py-12">
      <div className="pointer-events-none absolute -top-32 left-1/2 h-96 w-[42rem] -translate-x-1/2 rounded-full bg-gradient-to-tr from-indigo-500/30 via-violet-500/20 to-fuchsia-500/30 blur-3xl" />
      <div className="relative w-full max-w-sm">
        <div className="mb-8 text-center">
          <Link
            href="/"
            className="inline-flex items-center gap-2 rounded-full bg-zinc-900 px-3 py-1 text-sm font-semibold tracking-tight text-white"
          >
            <span className="h-2 w-2 rounded-full bg-indigo-400" />
            TaskFlow
          </Link>
          <h1 className="mt-6 text-2xl font-semibold tracking-tight text-zinc-900">{title}</h1>
          <p className="mt-1.5 text-sm text-zinc-500">{subtitle}</p>
        </div>

        <div className="rounded-2xl bg-white p-6 shadow-xl shadow-zinc-900/5 ring-1 ring-zinc-900/5">
          <div className="space-y-4">{children}</div>
        </div>

        <p className="mt-6 text-center text-sm text-zinc-500">{footer}</p>
      </div>
    </div>
  );
}
