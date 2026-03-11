import { NextResponse } from "next/server";

// Cache the font list in memory -- only fetch once per server restart
let cachedFonts: string[] | null = null;

export async function GET() {
  if (cachedFonts) {
    return NextResponse.json(cachedFonts);
  }

  try {
    const res = await fetch("https://fonts.google.com/metadata/fonts");
    if (!res.ok) {
      return NextResponse.json([], { status: 502 });
    }
    const data = await res.json();
    cachedFonts = data.familyMetadataList.map(
      (f: { family: string }) => f.family
    );
    return NextResponse.json(cachedFonts);
  } catch {
    return NextResponse.json([], { status: 502 });
  }
}
