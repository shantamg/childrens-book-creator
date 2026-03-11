"use client";

import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { ProofView } from "../components/ProofView";

function ProofViewInner() {
  const searchParams = useSearchParams();
  const project = searchParams.get("project");

  if (!project) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-800">
        <p className="text-gray-400">No project specified. Use ?project=slug</p>
      </div>
    );
  }

  return <ProofView slug={project} />;
}

export default function ProofPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-screen bg-gray-800">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white" />
        </div>
      }
    >
      <ProofViewInner />
    </Suspense>
  );
}
