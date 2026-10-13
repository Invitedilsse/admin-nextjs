/**
 * The portal's type scale.
 * -------------------------------------------------------------------------------------
 * Inter, loaded in src/pages/_document.js. Three things here are doing most of the
 * work in making the portal read as a considered product rather than a template:
 *
 *   1. Negative tracking on the big sizes. Inter is drawn for UI and is set a little
 *      loose by default at display sizes; -0.02em on h1-h3 is what stops a large
 *      number looking like a web page from 2014.
 *   2. Tabular figures on every variant a number lands in (h1-h4, subtitle2, body2,
 *      caption). Without this, a column of counts jitters as the digits change width,
 *      which is the single most obvious tell of an un-designed admin screen.
 *   3. 600 rather than 700 for headings and buttons. 700 Inter is heavy enough to
 *      shout on a dense screen.
 *
 * ! Sizes are rem against a 16px root, so 0.875rem = 14px. The comment after each
 *   one is the pixel value, kept so nobody has to do the arithmetic again.
 */

// ** Figures that do not change width as the digits change.
const tabular = { fontVariantNumeric: 'tabular-nums' }

const typography = {
  fontFamily: [
    'Inter',
    '-apple-system',
    'BlinkMacSystemFont',
    '"Segoe UI"',
    'Roboto',
    '"Helvetica Neue"',
    'Arial',
    'sans-serif',
    '"Apple Color Emoji"',
    '"Segoe UI Emoji"',
    '"Segoe UI Symbol"'
  ].join(','),
  fontSize: 14,
  fontWeightLight: 400,
  fontWeightRegular: 400,
  fontWeightMedium: 500,
  fontWeightBold: 600,
  h1: {
    fontWeight: 600,
    fontSize: '2.25rem', // 36px
    lineHeight: 1.22,
    letterSpacing: '-0.02em',
    ...tabular
  },
  h2: {
    fontWeight: 600,
    fontSize: '1.875rem', // 30px
    lineHeight: 1.27,
    letterSpacing: '-0.02em',
    ...tabular
  },
  h3: {
    fontWeight: 600,
    fontSize: '1.5rem', // 24px
    lineHeight: 1.33,
    letterSpacing: '-0.019em',
    ...tabular
  },
  h4: {
    fontWeight: 600,
    fontSize: '1.25rem', // 20px
    lineHeight: 1.4,
    letterSpacing: '-0.015em',
    ...tabular
  },
  h5: {
    fontWeight: 600,
    fontSize: '1.0625rem', // 17px
    lineHeight: 1.41,
    letterSpacing: '-0.011em'
  },
  h6: {
    fontWeight: 600,
    fontSize: '0.9375rem', // 15px
    lineHeight: 1.47,
    letterSpacing: '-0.006em'
  },
  subtitle1: {
    fontWeight: 500,
    fontSize: '0.9375rem', // 15px
    lineHeight: 1.47,
    letterSpacing: 0
  },
  subtitle2: {
    fontWeight: 500,
    fontSize: '0.8125rem', // 13px
    lineHeight: 1.54,
    letterSpacing: 0,
    ...tabular
  },
  body1: {
    fontWeight: 400,
    fontSize: '0.875rem', // 14px
    lineHeight: 1.57,
    letterSpacing: 0
  },
  body2: {
    fontWeight: 400,
    fontSize: '0.8125rem', // 13px
    lineHeight: 1.54,
    letterSpacing: 0,
    ...tabular
  },
  button: {
    fontWeight: 600,
    fontSize: '0.875rem', // 14px
    lineHeight: 1.43,
    // ** The template had 0.43px here, which spaced out every button label.
    letterSpacing: 0,
    textTransform: 'none'
  },
  caption: {
    fontWeight: 400,
    fontSize: '0.75rem', // 12px
    lineHeight: 1.34,
    letterSpacing: 0,
    ...tabular
  },
  overline: {
    // ** Column headers, section labels. Small, heavy and widely tracked.
    fontWeight: 600,
    fontSize: '0.6875rem', // 11px
    lineHeight: 1.46,
    letterSpacing: '0.05em',
    textTransform: 'uppercase'
  }
}

export default typography
