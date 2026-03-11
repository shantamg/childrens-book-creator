import { NextRequest, NextResponse } from "next/server";
import { readLayoutYaml, writeLayoutYaml, seedLayoutFromStory } from "@/app/lib/project";
import type { LayoutYaml } from "@/app/lib/types";

/** GET /api/project/layout?slug=xyz -- read layout.yaml
 *  Automatically seeds text from story markdown for pages without layout entries. */
export async function GET(request: NextRequest) {
  const slug = request.nextUrl.searchParams.get("slug");
  if (!slug) {
    return NextResponse.json({ error: "Missing slug" }, { status: 400 });
  }

  try {
    // Auto-seed from story text for any pages missing layout entries
    const layout = seedLayoutFromStory(slug);
    return NextResponse.json(layout);
  } catch (err) {
    console.error("Error reading layout:", err);
    return NextResponse.json({ error: "Failed to read layout.yaml" }, { status: 500 });
  }
}

/** PUT /api/project/layout?slug=xyz -- write layout.yaml */
export async function PUT(request: NextRequest) {
  const slug = request.nextUrl.searchParams.get("slug");
  if (!slug) {
    return NextResponse.json({ error: "Missing slug" }, { status: 400 });
  }

  try {
    const body = (await request.json()) as LayoutYaml;
    writeLayoutYaml(slug, body);
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Error writing layout:", err);
    return NextResponse.json({ error: "Failed to write layout.yaml" }, { status: 500 });
  }
}
