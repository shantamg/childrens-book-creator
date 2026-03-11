import { NextRequest, NextResponse } from "next/server";
import { discoverPages, projectDir } from "@/app/lib/project";
import sharp from "sharp";
import fs from "fs";
import path from "path";

/** POST /api/project/spreads?slug=xyz&page=17
 *  Split a panoramic spread image into page-left.png and page-right.png
 *  in the print-ready directory. */
export async function POST(request: NextRequest) {
  const slug = request.nextUrl.searchParams.get("slug");
  const pageParam = request.nextUrl.searchParams.get("page");

  if (!slug || !pageParam) {
    return NextResponse.json(
      { error: "Missing slug or page parameter" },
      { status: 400 }
    );
  }

  const pageNumber = parseInt(pageParam, 10);
  const pages = discoverPages(slug);
  const page = pages.find(
    (p) => p.pageNumber === pageNumber && p.type === "spread-start"
  );

  if (!page) {
    return NextResponse.json(
      { error: `Page ${pageNumber} is not a spread-start page` },
      { status: 404 }
    );
  }

  const pDir = projectDir(slug);
  const pageDir = path.join(pDir, "pages", page.folder);

  // Find the source image (approved_4k or approved, or print-ready/page.png)
  const candidates = [
    path.join(pageDir, "approved_4k.png"),
    path.join(pageDir, "approved.png"),
  ];
  if (page.imageFile) {
    candidates.push(path.join(pDir, page.imageFile));
  }

  let sourcePath: string | null = null;
  for (const c of candidates) {
    if (fs.existsSync(c)) {
      sourcePath = c;
      break;
    }
  }

  if (!sourcePath) {
    return NextResponse.json(
      { error: "No source image found for spread" },
      { status: 404 }
    );
  }

  try {
    const metadata = await sharp(sourcePath).metadata();
    const width = metadata.width || 0;
    const height = metadata.height || 0;
    const halfWidth = Math.floor(width / 2);

    const printReadyDir = path.join(pageDir, "print-ready");
    fs.mkdirSync(printReadyDir, { recursive: true });

    // Extract left half
    await sharp(sourcePath)
      .extract({ left: 0, top: 0, width: halfWidth, height })
      .toFile(path.join(printReadyDir, "page-left.png"));

    // Extract right half
    await sharp(sourcePath)
      .extract({ left: halfWidth, top: 0, width: width - halfWidth, height })
      .toFile(path.join(printReadyDir, "page-right.png"));

    return NextResponse.json({
      ok: true,
      source: path.basename(sourcePath),
      dimensions: { width, height },
      left: "print-ready/page-left.png",
      right: "print-ready/page-right.png",
    });
  } catch (err) {
    console.error("Error splitting spread:", err);
    return NextResponse.json(
      { error: "Failed to split spread image" },
      { status: 500 }
    );
  }
}
