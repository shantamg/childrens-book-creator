import { NextRequest, NextResponse } from "next/server";
import { projectDir } from "@/app/lib/project";
import sharp from "sharp";
import fs from "fs";
import path from "path";

/**
 * GET /api/project/cover?slug=xyz
 * Serves the cover image. Looks for files in cover/ directory:
 *   cover/cover.png > cover/variations/*.png (latest by mtime)
 *
 * Optional query params:
 *   &version=cover-v2  — serve a specific file from cover/variations/
 *   &list=true         — return JSON list of all available cover images
 */
export async function GET(request: NextRequest) {
  const slug = request.nextUrl.searchParams.get("slug");
  const version = request.nextUrl.searchParams.get("version");
  const list = request.nextUrl.searchParams.get("list");

  if (!slug) {
    return NextResponse.json({ error: "Missing slug" }, { status: 400 });
  }

  const coverDir = path.join(projectDir(slug), "cover");
  const variationsDir = path.join(coverDir, "variations");

  // List mode: return all available cover images
  if (list === "true") {
    const images: { name: string; path: string; mtime: number }[] = [];

    // Check main cover
    const mainCover = path.join(coverDir, "cover.png");
    if (fs.existsSync(mainCover)) {
      const stat = fs.statSync(mainCover);
      images.push({ name: "cover", path: "cover.png", mtime: stat.mtimeMs });
    }

    // Check variations
    if (fs.existsSync(variationsDir)) {
      const files = fs.readdirSync(variationsDir)
        .filter((f) => f.endsWith(".png"))
        .sort();
      for (const file of files) {
        const stat = fs.statSync(path.join(variationsDir, file));
        const name = file.replace(/\.png$/, "");
        images.push({ name, path: `variations/${file}`, mtime: stat.mtimeMs });
      }
    }

    return NextResponse.json({ images });
  }

  // Find the image to serve
  let imagePath: string | null = null;

  if (version) {
    // Specific version requested
    const sanitized = version.replace(/[^a-zA-Z0-9_-]/g, "");
    const versionPath = path.join(variationsDir, `${sanitized}.png`);
    if (fs.existsSync(versionPath)) {
      imagePath = versionPath;
    }
  }

  if (!imagePath) {
    // Default: cover.png, then latest variation
    const mainCover = path.join(coverDir, "cover.png");
    if (fs.existsSync(mainCover)) {
      imagePath = mainCover;
    } else if (fs.existsSync(variationsDir)) {
      const files = fs.readdirSync(variationsDir)
        .filter((f) => f.endsWith(".png"))
        .map((f) => ({
          name: f,
          mtime: fs.statSync(path.join(variationsDir, f)).mtimeMs,
        }))
        .sort((a, b) => b.mtime - a.mtime);
      if (files.length > 0) {
        imagePath = path.join(variationsDir, files[0].name);
      }
    }
  }

  if (!imagePath || !fs.existsSync(imagePath)) {
    return NextResponse.json({ error: "No cover image found" }, { status: 404 });
  }

  try {
    // Serve resized for web display (max 2400px wide to keep the wide aspect ratio detailed)
    const imageBuffer = await sharp(imagePath)
      .resize(2400, 1400, { fit: "inside", withoutEnlargement: true })
      .png({ quality: 90 })
      .toBuffer();

    return new NextResponse(new Uint8Array(imageBuffer), {
      headers: {
        "Content-Type": "image/png",
        "Cache-Control": "no-cache",
      },
    });
  } catch (err) {
    console.error("Error processing cover image:", err);
    return NextResponse.json({ error: "Failed to process image" }, { status: 500 });
  }
}
