import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import yaml from "js-yaml";

const PROJECTS_DIR =
  process.env.PROJECTS_DIR ||
  path.join(process.env.HOME || "/tmp", "Books/projects");

interface ProjectSummary {
  slug: string;
  title: string;
  author: string;
  trim: string;
  pageCount: number;
  style?: string;
}

/** GET /api/projects -- list all projects with basic metadata */
export async function GET() {
  try {
    if (!fs.existsSync(PROJECTS_DIR)) {
      return NextResponse.json([]);
    }

    const dirs = fs.readdirSync(PROJECTS_DIR).filter((d) => {
      const full = path.join(PROJECTS_DIR, d);
      return (
        fs.statSync(full).isDirectory() &&
        fs.existsSync(path.join(full, "book.yaml"))
      );
    });

    const projects: ProjectSummary[] = dirs.map((slug) => {
      const bookPath = path.join(PROJECTS_DIR, slug, "book.yaml");
      const raw = fs.readFileSync(bookPath, "utf-8");
      const book = yaml.load(raw) as Record<string, unknown>;

      const specs = book.specs as Record<string, unknown> | undefined;
      const trim = specs?.trim as Record<string, unknown> | undefined;
      const style = book.style as Record<string, unknown> | undefined;

      // Count page folders
      const pagesDir = path.join(PROJECTS_DIR, slug, "pages");
      let pageCount = 0;
      if (fs.existsSync(pagesDir)) {
        pageCount = fs.readdirSync(pagesDir).filter((f) => {
          return fs.statSync(path.join(pagesDir, f)).isDirectory();
        }).length;
      }

      return {
        slug,
        title: (book.title as string) || slug,
        author: (book.author as string) || "Unknown",
        trim: trim
          ? `${trim.width}×${trim.height}${trim.unit ? '"' : ""}`
          : "—",
        pageCount,
        style: (style?.artStyle as string) || undefined,
      };
    });

    return NextResponse.json(projects);
  } catch (err) {
    console.error("Error listing projects:", err);
    return NextResponse.json(
      { error: "Failed to list projects" },
      { status: 500 }
    );
  }
}

