import { Suspense } from "react";
import { Spinner } from "@/components/ui";
import ProjectBoard from "./project-board";

export default function ProjectPage({ params }: { params: Promise<{ id: string }> }) {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center py-32">
          <Spinner className="h-8 w-8" />
        </div>
      }
    >
      <ProjectDetails params={params} />
    </Suspense>
  );
}

async function ProjectDetails({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <ProjectBoard projectId={id} />;
}
