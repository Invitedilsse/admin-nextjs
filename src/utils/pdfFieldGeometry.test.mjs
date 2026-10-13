/**
 * Run with:  node src/utils/pdfFieldGeometry.test.mjs
 *
 * No React, no browser, no dependencies. This is the file that proves a box
 * dragged on screen lands at the same point in the PDF.
 */
/**
 * The editor's coordinate maths, against the shipped module.
 *
 * A4 portrait is 595.28 x 841.89 points. The preview is drawn at 800px wide,
 * so one point is 800/595.28 = 1.3439... pixels — every expectation below is
 * derived from that rather than from what the code happens to return.
 */
import * as G from "./pdfFieldGeometry.js";

let pass = 0; const fails = [];
const ck = (l, c, x) => c ? (pass++, console.log("  ok   " + l))
                          : (fails.push(l), console.log("  FAIL " + l + (x !== undefined ? " — " + x : "")));
const near = (l, a, b, tol = 0.15) => ck(l, Math.abs(a - b) <= tol, `got ${a}, expected ${b}`);
const eq = (l, a, b) => ck(l, JSON.stringify(a) === JSON.stringify(b),
                           `got ${JSON.stringify(a)}, expected ${JSON.stringify(b)}`);

const PAGE = { width: 595.28, height: 841.89 };
const scale = G.scaleFor(800, PAGE.width);

console.log("\n1. scale");
near("800px across an A4 width", scale, 800 / 595.28);
eq("a missing width does not divide by zero", G.scaleFor(0, 595.28), 1);
eq("a missing page size does not either", G.scaleFor(800, 0), 1);

console.log("\n2. there and back");
const field = { x: 100, y: 200, w: 300, h: 40 };
const screen = G.toScreen(field, scale);
near("left in pixels", screen.left, 100 * scale);
near("top in pixels", screen.top, 200 * scale);
const back = G.toPdf({ left: screen.left, top: screen.top, width: screen.width, height: screen.height }, scale);
near("x survives the round trip", back.x, 100, 1e-9);
near("y survives the round trip", back.y, 200, 1e-9);
near("w survives the round trip", back.w, 300, 1e-9);

// A preview at a different width must produce the same stored box.
const s2 = G.scaleFor(420, PAGE.width);
const onPhone = G.toPdf(G.toScreen(field, s2), s2);
near("a box placed on a narrow preview stores identically", onPhone.x, 100, 1e-9);
near("...and the same width", onPhone.w, 300, 1e-9);

console.log("\n3. dragging");
const moved = G.applyDrag(field, { dxPx: 50 * scale, dyPx: -30 * scale }, scale, PAGE);
near("moves by the dragged distance in points", moved.x, 150);
near("...on both axes", moved.y, 170);
eq("size is untouched", [moved.w, moved.h], [300, 40]);

const offLeft = G.applyDrag(field, { dxPx: -9999, dyPx: -9999 }, scale, PAGE);
eq("dragged off the top left, it stops at the corner", [offLeft.x, offLeft.y], [0, 0]);
eq("...still its own size", [offLeft.w, offLeft.h], [300, 40]);

const offRight = G.applyDrag(field, { dxPx: 9999, dyPx: 9999 }, scale, PAGE);
near("dragged off the bottom right, its right edge stops at the page edge", offRight.x + offRight.w, PAGE.width, 0.11);
near("...and its bottom edge too", offRight.y + offRight.h, PAGE.height, 0.11);

console.log("\n4. resizing");
const east = G.applyResize(field, "e", { dxPx: 100 * scale, dyPx: 0 }, scale, PAGE);
eq("an east handle widens without moving the box", [east.x, east.w], [100, 400]);

const west = G.applyResize(field, "w", { dxPx: -50 * scale, dyPx: 0 }, scale, PAGE);
eq("a west handle moves the origin AND widens", [west.x, west.w], [50, 350]);

const north = G.applyResize(field, "n", { dxPx: 0, dyPx: -10 * scale }, scale, PAGE);
eq("a north handle moves the top up and grows downward-measured height", [north.y, north.h], [190, 50]);

const south = G.applyResize(field, "s", { dxPx: 0, dyPx: 25 * scale }, scale, PAGE);
eq("a south handle grows the height only", [south.y, south.h], [200, 65]);

const corner = G.applyResize(field, "se", { dxPx: 20 * scale, dyPx: 20 * scale }, scale, PAGE);
eq("a corner does both", [corner.w, corner.h], [320, 60]);

const nw = G.applyResize(field, "nw", { dxPx: 20 * scale, dyPx: 20 * scale }, scale, PAGE);
eq("the opposite corner moves the origin on both axes", [nw.x, nw.y], [120, 220]);
eq("...and shrinks accordingly", [nw.w, nw.h], [280, 20]);

// Pulling a handle straight past the far edge must not invert the box.
const crushed = G.applyResize(field, "e", { dxPx: -9999, dyPx: 0 }, scale, PAGE);
ck("a box cannot be resized to nothing", crushed.w >= G.MIN_SIZE_PT, crushed.w);
const crushedW = G.applyResize(field, "w", { dxPx: 9999, dyPx: 0 }, scale, PAGE);
ck("...from the other side either", crushedW.w >= G.MIN_SIZE_PT, crushedW.w);
ck("...and never inverts, so width stays positive", crushedW.w > 0 && crushed.w > 0);
near("a west handle pushed too far stops against its own right edge",
     crushedW.x + crushedW.w, 400, 0.11);

const huge = G.applyResize({ x: 0, y: 0, w: 100, h: 100 }, "se", { dxPx: 99999, dyPx: 99999 }, scale, PAGE);
ck("a box can never grow past the page",
   huge.x + huge.w <= PAGE.width && huge.y + huge.h <= PAGE.height,
   `${huge.x}+${huge.w} x ${huge.y}+${huge.h}`);

// The case that was actually broken: flush against the right edge.
const flush = G.applyDrag({ x: 0, y: 0, w: 300, h: 40 }, { dxPx: 99999, dyPx: 0 }, scale, PAGE);
ck("a box dragged hard against the right edge stays on the page",
   flush.x + flush.w <= PAGE.width, `${flush.x} + ${flush.w} = ${flush.x + flush.w} vs ${PAGE.width}`);
const flushDown = G.applyDrag({ x: 0, y: 0, w: 300, h: 40 }, { dxPx: 0, dyPx: 99999 }, scale, PAGE);
ck("...and against the bottom edge", flushDown.y + flushDown.h <= PAGE.height,
   `${flushDown.y + flushDown.h} vs ${PAGE.height}`);

console.log("\n5. nudging");
eq("right arrow moves one point", G.applyNudge(field, "ArrowRight", false, PAGE).x, 101);
eq("with shift, ten", G.applyNudge(field, "ArrowRight", true, PAGE).x, 110);
eq("up arrow decreases y, because y grows downward", G.applyNudge(field, "ArrowUp", false, PAGE).y, 199);
eq("a key that is not an arrow is ignored", G.applyNudge(field, "Enter", false, PAGE), null);
eq("nudging at the edge stays at the edge",
   G.applyNudge({ x: 0, y: 0, w: 50, h: 20 }, "ArrowLeft", true, PAGE).x, 0);

console.log("\n6. clamping on its own");
const over = G.clampToPage({ x: -50, y: -50, w: 9999, h: 9999 }, PAGE);
// Containment is the requirement, not an exact equality: sizes round DOWN so
// that rounding can never put an edge back over the boundary.
ck("an impossible box is brought fully onto the page",
   over.x >= 0 && over.y >= 0 &&
   over.x + over.w <= PAGE.width && over.y + over.h <= PAGE.height,
   JSON.stringify(over));
ck("...and still fills essentially the whole page",
   over.w > PAGE.width - 0.2 && over.h > PAGE.height - 0.2, JSON.stringify(over));
ck("values are rounded to a tenth of a point",
   String(G.clampToPage({ x: 10.123456, y: 0, w: 50, h: 20 }, PAGE).x) === "10.1");

console.log("\n7. a new field's first box");
const box = G.defaultBoxFor(PAGE, 0);
ck("lands on the page", box.x >= 0 && box.y >= 0 &&
   box.x + box.w <= PAGE.width + 0.01 && box.y + box.h <= PAGE.height + 0.01,
   JSON.stringify(box));
const second = G.defaultBoxFor(PAGE, 1);
ck("a second field does not land exactly on the first", second.y !== box.y);

console.log("\n8. field keys from column headings");
eq("a heading becomes a usable key", G.keyFromLabel("Guest Name"), "guest_name");
eq("punctuation is stripped", G.keyFromLabel("Gift Code #"), "gift_code");
eq("a clash is numbered", G.keyFromLabel("Guest Name", ["guest_name"]), "guest_name_2");
eq("...and keeps counting", G.keyFromLabel("Guest Name", ["guest_name", "guest_name_2"]), "guest_name_3");
eq("an empty heading still yields something", G.keyFromLabel(""), "field");
ck("the result always matches what the server accepts",
   [G.keyFromLabel("Guest Name"), G.keyFromLabel("Gift Code #"), G.keyFromLabel("தமிழ்")]
     .every((k) => /^[a-zA-Z0-9_]+$/.test(k)),
   G.keyFromLabel("தமிழ்"));

console.log(`\n${pass} checks passed, ${fails.length} failed`);
fails.forEach((f) => console.log("  - " + f));
process.exit(fails.length ? 1 : 0);
