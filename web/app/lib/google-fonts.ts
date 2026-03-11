/**
 * Load a Google Font by injecting a stylesheet link into the document head.
 * Caches loaded fonts to avoid duplicate requests.
 */

const loadedFonts = new Set<string>();
const pendingLoads = new Map<string, Promise<boolean>>();

export async function loadGoogleFont(fontName: string): Promise<boolean> {
  if (!fontName || typeof document === "undefined") return false;
  if (loadedFonts.has(fontName)) return true;

  const pending = pendingLoads.get(fontName);
  if (pending) return pending;

  const promise = doLoad(fontName);
  pendingLoads.set(fontName, promise);
  const result = await promise;
  pendingLoads.delete(fontName);
  return result;
}

async function doLoad(fontName: string): Promise<boolean> {
  const linkId = `gfont-${fontName.replace(/\W/g, "-")}`;
  const existing = document.getElementById(linkId);

  if (!existing) {
    const link = document.createElement("link");
    link.id = linkId;
    link.href = `https://fonts.googleapis.com/css2?family=${fontName.replace(/ /g, "+")}&display=swap`;
    link.rel = "stylesheet";

    const loaded = await new Promise<boolean>((resolve) => {
      link.onload = () => resolve(true);
      link.onerror = () => resolve(false);
      document.head.appendChild(link);
    });

    if (!loaded) return false;
  }

  try {
    const fonts = await document.fonts.load(`1em "${fontName}"`);
    if (fonts.length > 0) {
      loadedFonts.add(fontName);
      return true;
    }
    return false;
  } catch {
    return false;
  }
}
