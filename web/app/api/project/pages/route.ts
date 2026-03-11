import { NextRequest, NextResponse } from "next/server";
import { getPageImagePath, getSpecialPageImagePath, discoverPages, readBookYaml } from "@/app/lib/project";
import sharp from "sharp";
import fs from "fs";

/** GET /api/project/pages?slug=xyz&page=1 -- serve page image (thumbnail or full)
 *  GET /api/project/pages?slug=xyz -- list all pages */
export async function GET(request: NextRequest) {
  const slug = request.nextUrl.searchParams.get("slug");
  const pageParam = request.nextUrl.searchParams.get("page");
  const thumb = request.nextUrl.searchParams.get("thumb") !== "false";

  if (!slug) {
    return NextResponse.json({ error: "Missing slug" }, { status: 400 });
  }

  // Handle special pages (title, about-author)
  const specialParam = request.nextUrl.searchParams.get("special");
  if (specialParam) {
    const specialPath = getSpecialPageImagePath(slug, specialParam);
    if (!specialPath || !fs.existsSync(specialPath)) {
      return NextResponse.json({ error: "Special page not found" }, { status: 404 });
    }
    try {
      const imageBuffer = thumb
        ? await sharp(specialPath).resize(600, 600, { fit: "inside", withoutEnlargement: true }).png({ quality: 80 }).toBuffer()
        : await sharp(specialPath).resize(1200, 1200, { fit: "inside", withoutEnlargement: true }).png({ quality: 90 }).toBuffer();
      return new NextResponse(new Uint8Array(imageBuffer), {
        headers: { "Content-Type": "image/png", "Cache-Control": "public, max-age=300" },
      });
    } catch (err) {
      console.error("Error processing special page image:", err);
      return NextResponse.json({ error: "Failed to process image" }, { status: 500 });
    }
  }

  // If no page param, return page list with project data
  if (!pageParam) {
    try {
      const pages = discoverPages(slug);
      const book = readBookYaml(slug);
      return NextResponse.json({ pages, book });
    } catch (err) {
      console.error("Error listing pages:", err);
      return NextResponse.json({ error: "Failed to list pages" }, { status: 500 });
    }
  }

  // Serve a specific page image
  const pageNumber = parseInt(pageParam, 10);
  const imagePath = getPageImagePath(slug, pageNumber);

  if (!imagePath || !fs.existsSync(imagePath)) {
    // Return a placeholder SVG
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="400" height="400" viewBox="0 0 400 400">
      <rect width="400" height="400" fill="#f3f4f6"/>
      <text x="200" y="200" text-anchor="middle" fill="#9ca3af" font-size="16" font-family="sans-serif">Page ${pageNumber}</text>
      <text x="200" y="224" text-anchor="middle" fill="#d1d5db" font-size="12" font-family="sans-serif">No image</text>
    </svg>`;
    return new NextResponse(svg, {
      headers: {
        "Content-Type": "image/svg+xml",
        "Cache-Control": "public, max-age=60",
      },
    });
  }

  try {
    let imageBuffer: Buffer;

    if (thumb) {
      // Generate thumbnail (600px wide, preserving aspect ratio)
      imageBuffer = await sharp(imagePath)
        .resize(600, 600, { fit: "inside", withoutEnlargement: true })
        .png({ quality: 80 })
        .toBuffer();
    } else {
      imageBuffer = await sharp(imagePath)
        .resize(1200, 1200, { fit: "inside", withoutEnlargement: true })
        .png({ quality: 90 })
        .toBuffer();
    }

    return new NextResponse(new Uint8Array(imageBuffer), {
      headers: {
        "Content-Type": "image/png",
        "Cache-Control": "public, max-age=300",
      },
    });
  } catch (err) {
    console.error("Error processing image:", err);
    return NextResponse.json({ error: "Failed to process image" }, { status: 500 });
  }
}
