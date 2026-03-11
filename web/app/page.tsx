"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { LayoutApp } from "./components/LayoutApp";

interface ProjectSummary {
  slug: string;
  title: string;
  author: string;
  trim: string;
  pageCount: number;
  style?: string;
}

function ProjectPicker() {
  const router = useRouter();
  const [projects, setProjects] = useState<ProjectSummary[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/projects")
      .then((r) => r.json())
      .then((data) => {
        setProjects(Array.isArray(data) ? data : []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50">
      <div className="w-full max-w-2xl px-6">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-semibold text-gray-900">
            Children&apos;s Book Creator
          </h1>
          <p className="text-gray-500 mt-1">Select a project</p>
        </div>

        {projects.length === 0 ? (
          <div className="text-center text-gray-400 py-12">
            <p>No projects yet.</p>
            <p className="text-sm mt-2">
              Say &quot;I want to start a new book&quot; in Claude Code to get started.
            </p>
          </div>
        ) : (
          <>
            <div className="space-y-3">
              {projects.map((project) => (
                <button
                  key={project.slug}
                  onClick={() => router.push(`/?project=${project.slug}`)}
                  className="w-full text-left bg-white rounded-lg border border-gray-200 p-5 hover:border-blue-300 hover:shadow-md transition-all group"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <h2 className="text-lg font-medium text-gray-900 group-hover:text-blue-600">
                        {project.title}
                      </h2>
                      <p className="text-sm text-gray-500 mt-0.5">
                        {project.author} &middot; {project.trim} &middot;{" "}
                        {project.pageCount}{" "}
                        {project.pageCount === 1 ? "page" : "pages"}
                      </p>
                      {project.style && (
                        <p className="text-xs text-gray-400 mt-1">
                          {project.style}
                        </p>
                      )}
                    </div>
                    <span className="text-gray-300 group-hover:text-blue-400 text-xl">
                      &rarr;
                    </span>
                  </div>
                </button>
              ))}
            </div>

            <p className="text-center text-xs text-gray-400 mt-8">
              To start a new book, say &quot;I want to start a new book&quot; in Claude Code.
            </p>
          </>
        )}
      </div>
    </div>
  );
}

function LayoutToolInner() {
  const searchParams = useSearchParams();
  const project = searchParams.get("project");

  if (!project) {
    return <ProjectPicker />;
  }

  return <LayoutApp slug={project} />;
}

export default function Home() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
        </div>
      }
    >
      <LayoutToolInner />
    </Suspense>
  );
}
