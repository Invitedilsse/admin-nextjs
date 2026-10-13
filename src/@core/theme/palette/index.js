/**
 * The portal's colour tokens.
 * -------------------------------------------------------------------------------------
 * Every value below comes from a published ramp rather than being eyeballed, so a
 * future change has something to reason against:
 *
 *   brand   - Material Design 2 "Blue". Blue 700 is #1976D2, which is exactly the
 *             primary colour the Invite Dilsse mobile app uses
 *             (lib/core/theme/themes/classic_theme.dart). The portal and the app
 *             now share one blue instead of two.
 *   gold    - the app's own accent (#F7E270 / #F9D58F / #FCF6C6, same file). Used
 *             as an accent only: it is far too light to carry white text.
 *   neutral - Tailwind CSS "slate". A cool grey, so it sits under the blue without
 *             the warm/purple cast the old template palette had.
 *   status  - Tailwind emerald / red / amber / sky, at the steps that clear 4.5:1
 *             against white where white text sits on them.
 *
 * ! customColors.mainRgb is a BARE "r, g, b" triplet, not a colour, and the key is
 *   NOT called `main`. Both halves of that matter:
 *
 *   - 94 places in this codebase write `rgba(${...customColors.mainRgb}, 0.2)`, so
 *     the value has to be a bare triplet. The template shipped 'rgba(47, 43, 61)',
 *     which expanded to `rgba(rgba(47, 43, 61), 0.2)` - invalid CSS, silently
 *     dropped by the browser, so all 94 of those borders and tints fell back to the
 *     MUI default.
 *   - MUI v6's createSimplePaletteValueFilter treats ANY palette key with a string
 *     `main` as a palette colour, and 24 components (Button, Chip, Alert, Badge,
 *     Switch, Slider, ...) then call alpha() on it. A bare triplet throws
 *     "MUI: Unsupported `30, 41, 59` color." and takes the page down.
 *
 *   So: never add a `main` back to customColors. themecheck.js asserts this.
 */

// ** Brand - Material Design Blue, anchored on the mobile app's #1976D2 (Blue 700).
const blue = {
  50: '#E3F2FD',
  100: '#BBDEFB',
  200: '#90CAF9',
  300: '#64B5F6',
  400: '#42A5F5',
  500: '#2196F3',
  600: '#1E88E5',
  700: '#1976D2',
  800: '#1565C0',
  900: '#0D47A1'
}

// ** Accent - the app's wedding gold. Pairs with slate.900 text, never white.
const gold = {
  100: '#FCF6C6',
  200: '#F9EBA6',
  300: '#F9D58F',
  400: '#F7E270',
  500: '#E9C84A',
  600: '#C9A52E'
}

// ** Neutral - Tailwind slate.
const slate = {
  25: '#FCFDFE',
  50: '#F8FAFC',
  100: '#F1F5F9',
  200: '#E2E8F0',
  300: '#CBD5E1',
  400: '#94A3B8',
  500: '#64748B',
  600: '#475569',
  700: '#334155',
  800: '#1E293B',
  900: '#0F172A'
}

const DefaultPalette = (mode, skin) => {
  // ** Vars
  const whiteColor = '#FFF'
  const darkPaperBgColor = '#1A2234'

  // ** The triplet every `rgba(${customColors.mainRgb}, x)` in the app interpolates.
  const lightTriplet = '30, 41, 59' //  slate.800
  const darkTriplet = '226, 232, 240' //  slate.200
  const mainColor = mode === 'light' ? lightTriplet : darkTriplet

  const defaultBgColor = () => {
    if (skin === 'bordered' && mode === 'light') {
      return whiteColor
    } else if (skin === 'bordered' && mode === 'dark') {
      return darkPaperBgColor
    } else if (mode === 'light') {
      return slate[50]
    } else return '#121A2B'
  }

  const isLight = mode === 'light'

  return {
    customColors: {
      // ** Bare triplet for the 94 existing call sites, and deliberately NOT named
      //    `main` - see the note at the top of this file.
      mainRgb: mainColor,
      dark: isLight ? slate[900] : slate[200],
      light: isLight ? slate[800] : slate[100],
      lightPaperBg: whiteColor,
      darkPaperBg: darkPaperBgColor,
      bodyBg: isLight ? slate[50] : '#121A2B',
      trackBg: isLight ? slate[100] : '#243049',
      avatarBg: isLight ? slate[200] : '#2C3A55',
      tableHeaderBg: isLight ? slate[50] : '#243049',

      // ** New tokens. Prefer these over hardcoding a hex in a page.
      brand: blue,
      gold: gold,
      neutral: slate,
      surface: isLight ? whiteColor : darkPaperBgColor,
      surfaceSunken: isLight ? slate[50] : '#121A2B',
      surfaceRaised: isLight ? slate[25] : '#202A41',
      border: isLight ? slate[200] : '#2C3A55',
      borderStrong: isLight ? slate[300] : '#3A4A6B',
      // ** The focus ring. One value, so every control focuses the same way.
      focusRing: isLight ? 'rgba(25, 118, 210, 0.16)' : 'rgba(100, 181, 246, 0.24)'
    },
    mode: mode,
    common: {
      black: '#000',
      white: whiteColor
    },
    primary: {
      light: blue[400],
      main: isLight ? blue[700] : blue[300],
      dark: blue[800],
      contrastText: whiteColor
    },
    secondary: {
      light: slate[400],
      main: slate[500],
      dark: slate[600],
      contrastText: whiteColor
    },
    error: {
      light: '#EF4444',
      main: '#DC2626',
      dark: '#B91C1C',
      contrastText: whiteColor
    },
    // ** Amber 700, not the 500 everyone reaches for. White on amber 500 measures
    //    2.3:1 and on 600 it is 3.19:1; both fail AA for normal text, which is how
    //    unreadable orange "warning" buttons get shipped. 700 measures 5.02:1.
    warning: {
      light: '#D97706',
      main: '#B45309',
      dark: '#92400E',
      contrastText: whiteColor
    },
    // ** Sky 700 for the same reason: white on sky 600 is 4.1:1, just under AA.
    info: {
      light: '#0284C7',
      main: '#0369A1',
      dark: '#075985',
      contrastText: whiteColor
    },
    success: {
      light: '#10B981',
      main: '#047857',
      dark: '#065F46',
      contrastText: whiteColor
    },
    grey: {
      50: slate[50],
      100: slate[100],
      200: slate[200],
      300: slate[300],
      400: slate[400],
      500: slate[500],
      600: slate[600],
      700: slate[700],
      800: slate[800],
      900: slate[900],
      A100: slate[100],
      A200: slate[200],
      A400: slate[400],
      A700: slate[700]
    },
    text: {
      // ** Solid colours, not alpha. Alpha text over a tinted row or a coloured
      // chip picks up the backing colour and goes muddy.
      primary: isLight ? slate[800] : slate[100],
      secondary: isLight ? slate[600] : slate[400],
      disabled: isLight ? slate[400] : slate[500]
    },
    divider: isLight ? slate[200] : '#2C3A55',
    background: {
      paper: isLight ? whiteColor : darkPaperBgColor,
      default: defaultBgColor()
    },
    action: {
      active: isLight ? slate[500] : slate[400],
      hover: isLight ? 'rgba(30, 41, 59, 0.04)' : 'rgba(226, 232, 240, 0.06)',
      selected: isLight ? 'rgba(30, 41, 59, 0.06)' : 'rgba(226, 232, 240, 0.09)',
      selectedOpacity: 0.06,
      disabled: isLight ? slate[400] : slate[500],
      disabledBackground: isLight ? slate[100] : '#243049',
      focus: isLight ? 'rgba(30, 41, 59, 0.10)' : 'rgba(226, 232, 240, 0.14)'
    }
  }
}

export default DefaultPalette
