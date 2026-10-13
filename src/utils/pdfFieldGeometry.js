/**
 * Moving a box on screen, and what that means in the PDF.
 * =======================================================
 *
 * The editor shows a page at whatever width fits the browser. The server draws
 * at the page's real size in points. This file is the conversion between them,
 * and it is kept pure — no React, no DOM, no imports — because it is the piece
 * that decides whether a guest's name lands where the operator put it, and it
 * is therefore the piece worth testing.
 *
 * BOTH sides measure from the TOP-LEFT. The flip to PDF's bottom-left origin
 * happens once, on the server, in src/pdf-campaign/layout.js. Doing it in two
 * places is how a feature like this ends up with invitations printed upside
 * down on one page size and not another.
 *
 * Units: `pt` is a PDF point (1/72 inch). `px` is a CSS pixel in the preview.
 */

/** Smallest box worth having, in points: below this it cannot be grabbed. */
export const MIN_SIZE_PT = 8;

/** How many CSS pixels one PDF point is, at the width the page is drawn. */
export const scaleFor = (renderedWidthPx, pageWidthPt) => {
  if (!renderedWidthPx || !pageWidthPt) return 1;
  return renderedWidthPx / pageWidthPt;
};

/** A stored field, as the absolutely-positioned box the editor draws. */
export const toScreen = (field, scale) => ({
  left: (field.x || 0) * scale,
  top: (field.y || 0) * scale,
  width: (field.w || 0) * scale,
  height: (field.h || 0) * scale,
});

/** The box the operator dragged, back in points. */
export const toPdf = (rect, scale) => ({
  x: rect.left / scale,
  y: rect.top / scale,
  w: rect.width / scale,
  h: rect.height / scale,
});

/**
 * A tenth of a point is enough precision and keeps the saved payload readable.
 *
 * Size rounds DOWN and position rounds to nearest, then gets clamped AGAIN.
 * That asymmetry is deliberate and was a bug before it was deliberate: a box
 * dragged flush to the right edge clamped to exactly 595.28pt, then rounded to
 * 595.3 — two hundredths of a point OFF the page it had just been fitted to.
 * Rounding after clamping can undo the clamp, so nothing here rounds upward
 * into space the page does not have.
 */
const floor1 = (n) => Math.floor(n * 10) / 10;
const round1 = (n) => Math.round(n * 10) / 10;

/**
 * Keep a box on its page.
 *
 * Size is corrected before position, because a box wider than the page can
 * never be placed inside it and silently leaving it oversized would fail the
 * server's bounds check with a message about the wrong thing.
 */
export const clampToPage = (box, page) => {
  const w = floor1(Math.min(Math.max(box.w, MIN_SIZE_PT), page.width));
  const h = floor1(Math.min(Math.max(box.h, MIN_SIZE_PT), page.height));

  const maxX = floor1(page.width - w);
  const maxY = floor1(page.height - h);

  return {
    x: Math.min(round1(Math.min(Math.max(box.x, 0), maxX)), maxX),
    y: Math.min(round1(Math.min(Math.max(box.y, 0), maxY)), maxY),
    w,
    h,
  };
};

/**
 * Drag: the box keeps its size and slides, stopping at the page edge.
 *
 * Deltas arrive in screen pixels because that is what a mouse gives.
 */
export const applyDrag = (field, { dxPx, dyPx }, scale, page) =>
  clampToPage(
    { x: (field.x || 0) + dxPx / scale, y: (field.y || 0) + dyPx / scale, w: field.w, h: field.h },
    page
  );

/**
 * Resize from one of eight handles.
 *
 * `handle` names the corner or edge being pulled: n, s, e, w, ne, nw, se, sw.
 *
 * Pulling a north or west handle moves the box's origin as well as its size —
 * that is the whole difference between the two directions, and getting it wrong
 * makes a box appear to run away from the cursor.
 *
 * A handle dragged past its opposite edge stops at the minimum size rather than
 * inverting the box, because an inverted box has a negative width and every
 * later calculation on it is nonsense.
 */
export const applyResize = (field, handle, { dxPx, dyPx }, scale, page) => {
  const dx = dxPx / scale;
  const dy = dyPx / scale;

  let { x, y, w, h } = { x: field.x || 0, y: field.y || 0, w: field.w || 0, h: field.h || 0 };

  if (handle.includes("w")) {
    const right = x + w;
    x = Math.min(x + dx, right - MIN_SIZE_PT);
    w = right - x;
  }
  if (handle.includes("e")) {
    w = Math.max(w + dx, MIN_SIZE_PT);
  }
  if (handle.includes("n")) {
    const bottom = y + h;
    y = Math.min(y + dy, bottom - MIN_SIZE_PT);
    h = bottom - y;
  }
  if (handle.includes("s")) {
    h = Math.max(h + dy, MIN_SIZE_PT);
  }

  return clampToPage({ x, y, w, h }, page);
};

/** Nudge with the arrow keys: 1pt normally, 10 with shift. */
export const applyNudge = (field, key, shift, page) => {
  const step = shift ? 10 : 1;
  const move = {
    ArrowLeft: { dx: -step, dy: 0 },
    ArrowRight: { dx: step, dy: 0 },
    ArrowUp: { dx: 0, dy: -step },
    ArrowDown: { dx: 0, dy: step },
  }[key];

  if (!move) return null;

  return clampToPage({ x: (field.x || 0) + move.dx, y: (field.y || 0) + move.dy, w: field.w, h: field.h }, page);
};

/** A sensible first box for a newly added field: centred, a tenth of the page. */
export const defaultBoxFor = (page, index = 0) => {
  const w = Math.min(page.width * 0.6, page.width - 40);
  const h = Math.max(page.height * 0.04, 24);

  return clampToPage(
    { x: (page.width - w) / 2, y: page.height * 0.2 + index * (h + 10), w, h },
    page
  );
};

/**
 * A key the server will accept: letters, numbers and underscores.
 *
 * Derived from the sheet's column heading so the operator does not have to
 * invent one, and made unique against the keys already in use.
 */
export const keyFromLabel = (label, taken = []) => {
  const base = String(label || "")
    .trim()
    .replace(/[^a-zA-Z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .toLowerCase() || "field";

  if (!taken.includes(base)) return base;

  let n = 2;
  while (taken.includes(`${base}_${n}`)) n++;

  return `${base}_${n}`;
};
