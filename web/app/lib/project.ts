/**
 * Server-side project resolution.
 * Reads project directory, discovers pages, loads YAML files.
 */

import fs from "fs";
import path from "path";
import yaml from "js-yaml";
import type { BookYaml, LayoutYaml, PageInfo } from "./types";

const PROJECTS_DIR = process.env.PROJECTS_DIR || path.join(process.env.HOME || "/tmp", "Books/projects");

/** Resolve the absolute path of a project by slug */
export function projectDir(slug: string): string {
  // Prevent path traversal
  const sanitized = slug.replace(/[^a-zA-Z0-9_-]/g, "");
  return path.join(PROJECTS_DIR, sanitized);
}

/** Read and parse book.yaml */
export function readBookYaml(slug: string): BookYaml {
  const filePath = path.join(projectDir(slug), "book.yaml");
  const raw = fs.readFileSync(filePath, "utf-8");
  return yaml.load(raw) as BookYaml;
}

/** Read and parse layout.yaml (creates empty structure if missing) */
export function readLayoutYaml(slug: string): LayoutYaml {
  const filePath = path.join(projectDir(slug), "layout.yaml");
  if (!fs.existsSync(filePath)) {
    return { pages: {} };
  }
  const raw = fs.readFileSync(filePath, "utf-8");
  const data = yaml.load(raw) as LayoutYaml | null;
  if (!data || !data.pages) return { pages: {} };

  // Normalize: each page value should be an array of overlays
  const pages: LayoutYaml["pages"] = {};
  for (const [key, val] of Object.entries(data.pages)) {
    const pageNum = Number(key);
    if (Array.isArray(val)) {
      pages[pageNum] = val;
    } else if (val && typeof val === "object") {
      pages[pageNum] = [val as unknown as import("./types").TextOverlay];
    }
  }

  return { pages };
}

/** Write layout.yaml */
export function writeLayoutYaml(slug: string, layout: LayoutYaml): void {
  const filePath = path.join(projectDir(slug), "layout.yaml");
  const yamlStr = yaml.dump(layout, {
    lineWidth: -1,
    noRefs: true,
    quotingType: "'",
    forceQuotes: false,
  });
  fs.writeFileSync(filePath, yamlStr, "utf-8");
}

/** Discover all pages in the project directory */
export function discoverPages(slug: string): PageInfo[] {
  const pDir = projectDir(slug);
  const pagesDir = path.join(pDir, "pages");
  const storyDir = path.join(pDir, "story");

  if (!fs.existsSync(pagesDir)) return [];

  // Read story markdown files to get page metadata
  const storyMeta: Record<number, { type: string; folder: string }> = {};
  if (fs.existsSync(storyDir)) {
    const storyFiles = fs.readdirSync(storyDir).filter((f) => f.endsWith(".md"));
    for (const file of storyFiles) {
      const content = fs.readFileSync(path.join(storyDir, file), "utf-8");
      const frontmatter = extractFrontmatter(content);
      if (frontmatter.page) {
        storyMeta[frontmatter.page as number] = {
          type: (frontmatter.type as string) || "story",
          folder: (frontmatter.folder as string) || "",
        };
      }
    }
  }

  // Scan page directories
  const folders = fs.readdirSync(pagesDir).filter((f) => {
    return fs.statSync(path.join(pagesDir, f)).isDirectory();
  });

  const pages: PageInfo[] = [];

  for (const folder of folders) {
    const pageNumbers = extractPageNumbers(folder);
    if (pageNumbers.length === 0) continue;

    // Find the best image file
    const imageFile = findPageImage(path.join(pagesDir, folder));

    for (const pageNum of pageNumbers) {
      const meta = storyMeta[pageNum];
      // Infer spread type from position in folder: first page = spread-start, rest = spread-companion
      const inferredType = folder.includes("spread")
        ? (pageNum === pageNumbers[0] ? "spread-start" : "spread-companion")
        : "story";
      pages.push({
        pageNumber: pageNum,
        folder,
        type: meta?.type || inferredType,
        imageFile: imageFile ? path.join("pages", folder, imageFile) : null,
        thumbnailUrl: `/api/project/pages?slug=${slug}&page=${pageNum}`,
      });
    }
  }

  // Sort by page number
  pages.sort((a, b) => a.pageNumber - b.pageNumber);

  // If book.yaml has pageOrder, use it to filter/reorder
  try {
    const book = readBookYaml(slug);
    if (book.pageOrder && book.pageOrder.length > 0) {
      const ordered: PageInfo[] = [];
      for (const pn of book.pageOrder) {
        const found = pages.find((p) => p.pageNumber === pn);
        if (found) ordered.push(found);
      }
      return ordered;
    }
  } catch {
    // Fall through to default ordering
  }

  return pages;
}

/** Extract page numbers from a folder name like "001-page1" or "017-018-spread" */
function extractPageNumbers(folder: string): number[] {
  // Match patterns like "001-page1", "017-018-spread"
  const match = folder.match(/^(\d+)(?:-(\d+))?-/);
  if (!match) return [];

  const first = parseInt(match[1], 10);
  const second = match[2] ? parseInt(match[2], 10) : null;

  if (second !== null) {
    // Range like 017-018: return both
    const nums: number[] = [];
    for (let i = first; i <= second; i++) nums.push(i);
    return nums;
  }

  return [first];
}

/** Find the best image file in a page directory */
function findPageImage(pageDir: string): string | null {
  // Priority: print-ready/page.png > approved.png > approved_4k.png
  const candidates = [
    "print-ready/page.png",
    "approved.png",
    "approved_4k.png",
  ];

  for (const candidate of candidates) {
    if (fs.existsSync(path.join(pageDir, candidate))) {
      return candidate;
    }
  }

  // Fall back to any PNG in the directory
  try {
    const files = fs.readdirSync(pageDir);
    const png = files.find((f) => f.endsWith(".png") && !f.startsWith("."));
    return png || null;
  } catch {
    return null;
  }
}

/** Extract YAML frontmatter from a markdown file */
function extractFrontmatter(content: string): Record<string, unknown> {
  const match = content.match(/^---\n([\s\S]*?)\n---/);
  if (!match) return {};
  try {
    return (yaml.load(match[1]) as Record<string, unknown>) || {};
  } catch {
    return {};
  }
}

/** Get the absolute path for a page image */
export function getPageImagePath(slug: string, pageNumber: number): string | null {
  const pages = discoverPages(slug);
  const page = pages.find((p) => p.pageNumber === pageNumber);
  if (!page || !page.imageFile) return null;
  return path.join(projectDir(slug), page.imageFile);
}

/** Resolve the image path for a special page (title or about-author) */
export function getSpecialPageImagePath(slug: string, specialType: string): string | null {
  try {
    const book = readBookYaml(slug);
    const pDir = projectDir(slug);
    const pagesDir = path.join(pDir, "pages");

    if (specialType === "title" && book.specialPages?.titlePage) {
      const imgPath = path.join(pagesDir, book.specialPages.titlePage.image);
      return fs.existsSync(imgPath) ? imgPath : null;
    }
    if (specialType === "about-author" && book.specialPages?.aboutAuthor) {
      const imgPath = path.join(pagesDir, book.specialPages.aboutAuthor.image);
      return fs.existsSync(imgPath) ? imgPath : null;
    }
  } catch {
    // fall through
  }
  return null;
}

/** Extract story text from a page markdown file.
 *  Returns an array of text blocks (split by blank lines in the story text).
 *  Only returns the narrative text — strips scene direction, notes, and frontmatter. */
export function readStoryText(slug: string, pageNumber: number): string[] {
  const storyDir = path.join(projectDir(slug), "story");
  if (!fs.existsSync(storyDir)) return [];

  // Find the matching page file (page-01.md, page-02.md, etc.)
  const files = fs.readdirSync(storyDir).filter((f) => f.endsWith(".md"));
  let targetFile: string | null = null;

  for (const file of files) {
    const content = fs.readFileSync(path.join(storyDir, file), "utf-8");
    const fm = extractFrontmatter(content);
    if (fm.page === pageNumber) {
      targetFile = file;
      break;
    }
  }

  if (!targetFile) return [];

  const raw = fs.readFileSync(path.join(storyDir, targetFile), "utf-8");

  // Strip frontmatter
  const withoutFrontmatter = raw.replace(/^---\n[\s\S]*?\n---\n*/, "");

  // Take only content before the first ## heading (Scene Direction, Notes, etc.)
  const beforeHeading = withoutFrontmatter.split(/(?:^|\n)##\s/)[0].trim();

  if (!beforeHeading) return [];

  // Split into text blocks by blank lines
  const blocks = beforeHeading
    .split(/\n\s*\n/)
    .map((b) => b.trim())
    .filter((b) => b.length > 0);

  return blocks;
}

/** Read all story texts for all pages in a project.
 *  Returns a map of page number -> text blocks. */
export function readAllStoryTexts(slug: string): Record<number, string[]> {
  const storyDir = path.join(projectDir(slug), "story");
  if (!fs.existsSync(storyDir)) return {};

  const result: Record<number, string[]> = {};
  const files = fs.readdirSync(storyDir).filter((f) => f.endsWith(".md"));

  for (const file of files) {
    const content = fs.readFileSync(path.join(storyDir, file), "utf-8");
    const fm = extractFrontmatter(content);
    if (fm.page && typeof fm.page === "number") {
      const texts = readStoryText(slug, fm.page);
      if (texts.length > 0) {
        result[fm.page] = texts;
      }
    }
  }

  return result;
}

/** Seed layout.yaml with story text for pages that don't have layout entries yet.
 *  Returns the merged layout (existing entries preserved, new ones added). */
export function seedLayoutFromStory(slug: string): LayoutYaml {
  const layout = readLayoutYaml(slug);
  const storyTexts = readAllStoryTexts(slug);
  const book = readBookYaml(slug);

  const defaultFont = book.typography?.font || "Overlock";
  const defaultSize = book.typography?.defaultSize || 42;

  let changed = false;

  for (const [pageNum, texts] of Object.entries(storyTexts)) {
    const pn = Number(pageNum);
    // Only seed if this page has no layout entries yet
    if (!layout.pages[pn] || layout.pages[pn].length === 0) {
      const overlays: import("./types").TextOverlay[] = texts.map((text, i) => ({
        content: text,
        font: defaultFont,
        fontSize: defaultSize,
        lineHeight: 1.2,
        letterSpacing: 0,
        color: "#000000",
        align: "left" as const,
        leftPercent: 10,
        topPercent: 10 + i * 30,
        widthPercent: 80,
        heightPercent: 25,
      }));
      layout.pages[pn] = overlays;
      changed = true;
    }
  }

  if (changed) {
    writeLayoutYaml(slug, layout);
  }

  return layout;
}
