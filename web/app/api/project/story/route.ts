import { NextRequest, NextResponse } from "next/server";
import { readStoryText, readAllStoryTexts } from "@/app/lib/project";

/** GET /api/project/story?slug=xyz -- all story texts
 *  GET /api/project/story?slug=xyz&page=2 -- story text for one page */
export async function GET(request: NextRequest) {
  const slug = request.nextUrl.searchParams.get("slug");
  if (!slug) {
    return NextResponse.json({ error: "Missing slug" }, { status: 400 });
  }

  const pageParam = request.nextUrl.searchParams.get("page");

  try {
    if (pageParam) {
      const pageNumber = parseInt(pageParam, 10);
      const texts = readStoryText(slug, pageNumber);
      return NextResponse.json({ page: pageNumber, texts });
    }

    const allTexts = readAllStoryTexts(slug);
    return NextResponse.json(allTexts);
  } catch (err) {
    console.error("Error reading story text:", err);
    return NextResponse.json({ error: "Failed to read story text" }, { status: 500 });
  }
}
