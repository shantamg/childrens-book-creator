# Print Specifications

Default specs for Ingram Spark / KDP hardcover square format.

## Page Dimensions

- **Trim size**: 8.5" x 8.5" (square)
- **Bleed**: 0.125" on all sides
- **Document size (with bleed)**: 8.75" x 8.75"
- **Print resolution**: 300 DPI
- **Pixel dimensions**: 2625 x 2625 px (at 300 DPI with bleed)

## Safety Margins

- **Top/Bottom**: 0.44" from document edge
- **Outside edge**: 0.44" from document edge
- **Gutter (binding side)**: 1.0" from document edge
- Odd pages (recto): gutter is on the LEFT
- Even pages (verso): gutter is on the RIGHT

## Color

- **Color mode**: CMYK
- **ICC profile**: GRACoL 2006 Coated (GRACoL2006_Coated1v2.icc)
- **Output intent**: PDF/X-1a
- **Conversion**: RGB to CMYK via Ghostscript

## Cover (OnPress Square Hard Cover)

- **Canvas**: 19.026" x 10.0" (5708 x 3000 px at 300 DPI)
- **Spine width**: 0.276" (varies with page count and paper)
- **Bleed inset**: 0.625" from canvas edge to trim
- **Safety inset**: 0.188" inside trim line
- **Layout**: Back cover | Spine | Front cover

## Paper

- **Type**: White 50lb
- **Thickness factor**: 0.0025" per page (for spine calculation)

## Page Assembly

- Page 1: Blank (title page)
- Pages 2-N: Story pages in order
- Spreads: Split into left/right halves (each 2625x2625)
- Final page count must be a multiple of 4 (pad with blanks)

## PDF/X-1a Requirements

- All fonts embedded or converted to outlines
- No transparency (flattened)
- CMYK + spot colors only (no RGB)
- Output intent declaration present
- Bleed box defined
