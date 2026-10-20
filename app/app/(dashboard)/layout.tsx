"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import AppHeader from "@/components/AppHeader";
import { Spinner } from "@/components/ui";
import { useAuth } from "@/lib/auth";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) router.replace("/login");
  }, [loading, user, router]);

  return (
    <div className="flex min-h-screen flex-1 flex-col">
      <AppHeader />
      <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-8 sm:px-6">{children}</main>

      {loading ? (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-zinc-50/80 backdrop-blur-sm">
          <Spinner className="h-8 w-8" />
        </div>
      ) : null}
    </div>
  );
}
