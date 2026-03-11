/** Text overlay stored in layout.yaml */
export interface TextOverlay {
  content: string;
  font: string;
  fontSize: number;
  lineHeight: number;
  letterSpacing: number;
  color: string;
  align: "left" | "center" | "right";
  leftPercent: number;
  topPercent: number;
  widthPercent: number;
  heightPercent: number;
}

/** layout.yaml shape: pages keyed by page number, each is an array of overlays */
export interface LayoutYaml {
  pages: Record<number, TextOverlay[]>;
}

/** book.yaml metadata (subset we care about) */
export interface BookYaml {
  title: string;
  author: string;
  specs: {
    trim: { width: number; height: number; unit: string };
    bleed: number;
    safeZone: number;
    resolution: number;
  };
  typography?: {
    font?: string;
    defaultSize?: number;
  };
  pageOrder?: number[];
  specialPages?: {
    titlePage?: { image: string };
    aboutAuthor?: { image: string };
  };
}

/** Page info resolved from filesystem.
 *  Valid type values: "story" | "spread-start" | "spread-companion" | "blank" | "title" | "cover" */
export interface PageInfo {
  pageNumber: number;
  folder: string;
  type: string;
  imageFile: string | null; // relative path from project root
  thumbnailUrl: string;     // API URL for serving the image
}

/** Full project data sent to the client */
export interface ProjectData {
  slug: string;
  book: BookYaml;
  layout: LayoutYaml;
  pages: PageInfo[];
}
