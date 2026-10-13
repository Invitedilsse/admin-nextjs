/**
 * The portal's elevation scale.
 * -------------------------------------------------------------------------------------
 * The template shipped a single-layer ramp that reached rgba(47, 43, 61, 0.34) - a
 * 34% black smudge under every dialog. Cards sat on it at elevation 7 and read as
 * heavy, which is most of why the old portal looked dated: in 2026 depth is carried
 * by a hairline border plus a shadow you have to look for.
 *
 * So each step here is TWO layers:
 *   - a tight "contact" shadow that grounds the edge,
 *   - a wider ambient one that gives the thing a position in space.
 * Both are low-alpha and tinted with the neutral's own hue (slate 900) rather than
 * pure black, which is what keeps them from looking grey-on-grey.
 *
 * ! MUI requires exactly 25 entries, index 0 = 'none'. Do not change the length.
 * ! Index 7 is the Card default (see overrides/card.js). It is deliberately LIGHTER
 *   than index 6, because a card also carries a 1px border - the two together are
 *   already enough separation, and stacking a real shadow on top is what makes a
 *   dashboard look like a pile of receipts.
 */

// ** [ y, blur, spread, alpha ] for the contact layer, then the ambient layer.
const STEPS = [
  /*  1 */ [[0, 1, 0, 0.04], [0, 1, 0, 0.03]],
  /*  2 */ [[1, 2, 0, 0.05], [0, 1, 0, 0.04]],
  /*  3 */ [[1, 3, -1, 0.06], [0, 1, 0, 0.04]],
  /*  4 */ [[2, 4, -1, 0.07], [0, 1, 0, 0.04]],
  /*  5 */ [[2, 6, -1, 0.07], [1, 2, -1, 0.05]],
  /*  6 */ [[3, 8, -2, 0.08], [1, 2, -1, 0.05]],
  /*  7 */ [[1, 2, 0, 0.04], [2, 6, -2, 0.05]], //  <- Card
  /*  8 */ [[4, 10, -3, 0.09], [2, 4, -2, 0.05]],
  /*  9 */ [[4, 12, -3, 0.1], [2, 4, -2, 0.05]],
  /* 10 */ [[6, 14, -4, 0.1], [2, 6, -3, 0.06]],
  /* 11 */ [[6, 16, -4, 0.11], [2, 6, -3, 0.06]],
  /* 12 */ [[8, 18, -5, 0.11], [3, 8, -4, 0.06]],
  /* 13 */ [[8, 20, -5, 0.12], [3, 8, -4, 0.06]],
  /* 14 */ [[10, 22, -6, 0.12], [4, 10, -5, 0.07]],
  /* 15 */ [[10, 24, -6, 0.13], [4, 10, -5, 0.07]],
  /* 16 */ [[12, 26, -7, 0.14], [5, 12, -6, 0.07]],
  /* 17 */ [[12, 28, -7, 0.15], [5, 12, -6, 0.08]],
  /* 18 */ [[14, 32, -8, 0.16], [6, 14, -7, 0.08]],
  /* 19 */ [[16, 36, -9, 0.17], [6, 16, -8, 0.08]],
  /* 20 */ [[18, 40, -10, 0.18], [8, 18, -9, 0.09]],
  /* 21 */ [[20, 44, -11, 0.19], [8, 20, -10, 0.09]],
  /* 22 */ [[22, 48, -12, 0.2], [10, 22, -11, 0.1]],
  /* 23 */ [[26, 56, -14, 0.22], [10, 24, -12, 0.1]],
  /* 24 */ [[32, 64, -16, 0.24], [12, 28, -14, 0.11]]
]

const layer = (rgb, [y, blur, spread, alpha], boost) =>
  `0px ${y}px ${blur}px ${spread}px rgba(${rgb}, ${Math.round(alpha * boost * 1000) / 1000})`

const Shadows = mode => {
  // ** slate.900 in light; a near-black in dark, where a tinted shadow reads as haze.
  const rgb = mode === 'light' ? '15, 23, 42' : '3, 7, 18'

  // ** Dark surfaces swallow a 4% shadow, so the whole ramp is pushed harder there.
  const boost = mode === 'light' ? 1 : 2.2

  return ['none', ...STEPS.map(([contact, ambient] ) => `${layer(rgb, contact, boost)}, ${layer(rgb, ambient, boost)}`)]
}

export default Shadows
