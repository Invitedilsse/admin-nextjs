/**
 * Renders the Guest Travel Plan tab of the HOST app against its real theme, and
 * holds its formatters to the two rules that matter.
 *
 * WHY THIS EXISTS
 *
 * `PORTAL_ROOT=…/IDS_NextJS node parsecheck.js` proves the file parses and every
 * JSX name is bound. Nothing in this repo ever renders it, so a component that
 * passes parsecheck can still throw on its first paint. This mounts it.
 *
 * WHAT IT CANNOT DO: react-dom/server runs no effects, so only the state the tab
 * opens in is rendered — no rows fetched. The loaded-rows path is covered on the
 * server instead, in gd-harness/test-travel.js and test-travel-export.js, which
 * assert every field this component reads.
 *
 * The axios hook, raw axios, the toast and react-redux are stubbed into
 * require.cache BEFORE the component is loaded: they talk to the network and to
 * a store, and nothing below asserts on their behaviour.
 *
 *   node hostcheck.js
 */
'use strict'

const fs = require('fs')
const path = require('path')
const Module = require('module')
const assert = require('assert')
const crypto = require('crypto')

const ROOT = process.env.HOST_ROOT || path.join(process.env.HOME, 'mnt', 'IDS_NextJS')
const SRC = path.join(ROOT, 'src')
const projectRequire = Module.createRequire(path.join(ROOT, 'package.json'))

// ------------------------------------------------------------------- the loader
// Same arrangement as rendercheck.js and pagecheck.js: the project's own Babel,
// a resolver that understands its absolute 'src/...' imports, and a transform
// cache on disk, because this tree sits on a mounted drive where a cold
// transform of one component's import graph costs 15-30 seconds.
const babel = projectRequire('next/dist/compiled/babel/core')
const commonjs = projectRequire('next/dist/compiled/babel/plugin-transform-modules-commonjs')
const presetReact = projectRequire('next/dist/compiled/babel/preset-react')

const realResolve = Module._resolveFilename
Module._resolveFilename = function (request, parent, isMain, options) {
  if (request.startsWith('src/')) {
    const base = path.join(ROOT, request)
    for (const c of [base, base + '.js', path.join(base, 'index.js')]) {
      if (fs.existsSync(c) && fs.statSync(c).isFile()) return c
    }
  }
  try {
    return realResolve.call(this, request, parent, isMain, options)
  } catch (err) {
    if (!request.startsWith('.') && !request.startsWith('/')) return projectRequire.resolve(request)
    throw err
  }
}

const CACHE = path.join(process.env.HOME, '.hostcheck-cache')
fs.mkdirSync(CACHE, { recursive: true })

const jsLoader = Module._extensions['.js']
Module._extensions['.js'] = function (mod, filename) {
  if (!filename.startsWith(SRC)) return jsLoader(mod, filename)

  const stat = fs.statSync(filename)
  const key = crypto.createHash('md5').update(`${filename}|${stat.mtimeMs}|${stat.size}|v1`).digest('hex')
  const cached = path.join(CACHE, key + '.js')

  let code
  if (fs.existsSync(cached)) {
    code = fs.readFileSync(cached, 'utf8')
  } else {
    code = babel.transformSync(fs.readFileSync(filename, 'utf8'), {
      filename,
      configFile: false,
      babelrc: false,
      sourceType: 'module',
      presets: [[presetReact, { runtime: 'automatic' }]],
      plugins: [commonjs]
    }).code
    fs.writeFileSync(cached, code)
  }

  return mod._compile(code, filename)
}

const React = projectRequire('react')
const { renderToStaticMarkup } = projectRequire('react-dom/server')

// ** The app's OWN provider. ThemeComponent calls themeOptions() inside a
//    component body, which is the only place it can legally run: override files
//    call React hooks while the theme is being built. Building the theme at
//    module scope throws "Invalid hook call".
const ThemeComponent = require(path.join(SRC, '@core/theme/ThemeComponent.js')).default
const themeConfig = require(path.join(SRC, 'configs/themeConfig.js')).default
const { SettingsContext } = require(path.join(SRC, '@core/context/settingsContext.js'))

const settings = {
  skin: themeConfig.skin,
  mode: 'light',
  direction: 'ltr',
  themeColor: 'primary',
  footer: themeConfig.footer,
  layout: themeConfig.layout,
  appBar: themeConfig.appBar,
  contentWidth: themeConfig.contentWidth,
  navCollapsed: themeConfig.navCollapsed,
  appBarBlur: themeConfig.appBarBlur
}

// ------------------------------------------------------------------- the stubs
const stub = (request, exports) => {
  const resolved = Module._resolveFilename(request, module, false)
  const m = new Module(resolved, module)
  m.filename = resolved
  m.loaded = true
  m.exports = exports
  Module._cache[resolved] = m
}

const calls = []

stub('src/hooks/axios', {
  apiGet: async url => {
    calls.push(['GET', url])

    return { data: { data: { rows: [], counts: null } } }
  },
  apiPost: async url => {
    calls.push(['POST', url])

    return { data: { data: { added: 0, updated: 0, skipped: [] } } }
  },
  getAccessToken: async () => 'test-token'
})

// Raw axios too: the binary downloads deliberately bypass apiGet.
const axiosStub = {
  get: async url => {
    calls.push(['AXIOS-GET', url])

    return { headers: {}, data: {} }
  }
}
stub('axios', Object.assign(axiosStub, { default: axiosStub, __esModule: true }))

const toast = Object.assign(() => {}, { success: () => {}, error: () => {} })
stub('react-hot-toast', Object.assign(toast, { default: toast, __esModule: true }))

// The store. The component reads `functionId` off state.adminMod, exactly as
// every sibling tab does, so the selector is given that shape and nothing else.
let storeState = { adminMod: { functionId: null } }
stub('react-redux', {
  __esModule: true,
  useSelector: selector => selector(storeState),
  useDispatch: () => () => {}
})

// ------------------------------------------------------------------- the tab
const tab = require(path.join(SRC, 'pages/function/components/GuestTravelPlan/index.js'))
const GuestTravelPlan = tab.default

const e = React.createElement
const wrap = node =>
  e(
    SettingsContext.Provider,
    { value: { settings, saveSettings: () => {} } },
    e(ThemeComponent, { settings }, node)
  )

let pass = 0
const fails = []
const t = (name, fn) => {
  try {
    fn()
    pass++
    console.log('  ok   ' + name)
  } catch (err) {
    fails.push(name)
    console.log('  FAIL ' + name + '\n       ' + String(err && err.message).split('\n')[0])
  }
}

console.log('\nA. The tab renders')

let html = ''

t('it mounts against the real theme without throwing', () => {
  html = renderToStaticMarkup(wrap(e(GuestTravelPlan)))
  assert.ok(html.length > 500, 'the tab rendered almost nothing: ' + html.length + ' chars')
})

t('it says what it is for, in the host’s words', () => {
  assert.ok(/Guest Travel Plan/.test(html), 'the heading is missing')
  assert.ok(/Upload guest list/.test(html), 'the upload button is missing')
  assert.ok(/Download sample/.test(html), 'the sample button is missing')
})

t('with no function open it says so rather than showing an empty table', () => {
  // AdditionalInfo is rendered with no props, so a tab that cannot find its
  // function id must say what to do rather than sit on a skeleton — which is
  // exactly what went wrong on the Guest Documents tab.
  assert.ok(/Open a function to use this tab/.test(html), 'the no-function state is missing')
})

t('nothing is requested without a function id', () => {
  assert.deepStrictEqual(calls, [], 'the tab called the API with no function: ' + JSON.stringify(calls))
})

t('the status chips are not drawn before the counts arrive', () => {
  // A chip row of four zeroes while the request is still in flight is a lie
  // the host would act on.
  assert.ok(!/Part collected/.test(html), 'the chips are showing before the counts loaded')
})

t('the loaded state renders too, with a function open', () => {
  storeState = { adminMod: { functionId: 'fa000000-0000-0000-0000-0000000000f1' } }
  const withFunction = renderToStaticMarkup(wrap(e(GuestTravelPlan)))
  assert.ok(/Guest Travel Plan/.test(withFunction))
  // Effects do not run server-side, so no fetch is expected here either; what
  // this proves is that the enabled controls render without throwing.
  assert.ok(!/Open a function to use this tab/.test(withFunction), 'it still thinks no function is open')
  storeState = { adminMod: { functionId: null } }
})

console.log('\nB. A date survives the trip')

t('an arrival of 2026-11-03 reads as 3 Nov 2026, not 2 Nov', () => {
  // THE BUG THIS GUARDS. arrival_date is a DATE column; the server sends it as
  // a plain string precisely so nothing builds a Date at UTC midnight from it.
  // `new Date('2026-11-03').toLocaleDateString()` in IST is 2 November, and the
  // one place that hurts most is a driver reading an arrival off a printout.
  assert.strictEqual(tab.showDate('2026-11-03'), '3 Nov 2026')
  assert.strictEqual(tab.showDate('2026-01-01'), '1 Jan 2026')
  assert.strictEqual(tab.showDate('2026-12-31'), '31 Dec 2026')
})

t('times read as a human wrote them', () => {
  assert.strictEqual(tab.showTime('18:30:00'), '6:30 pm')
  assert.strictEqual(tab.showTime('09:00:00'), '9:00 am')
})

t('midnight and noon are not both 12 am', () => {
  assert.strictEqual(tab.showTime('00:15:00'), '12:15 am')
  assert.strictEqual(tab.showTime('12:05:00'), '12:05 pm')
  assert.strictEqual(tab.showTime('23:45:00'), '11:45 pm')
})

t('a missing date or time is blank, never Invalid Date', () => {
  for (const empty of [null, undefined, '']) {
    assert.strictEqual(tab.showDate(empty), '')
    assert.strictEqual(tab.showTime(empty), '')
  }
})

t('a leg with only half its answers still reads', () => {
  // A guest who said "3 Nov by flight" and not where is a real row.
  assert.strictEqual(tab.formatLeg('2026-11-03', null, 'flight', null), '3 Nov 2026 — flight')
  assert.strictEqual(tab.formatLeg(null, null, null, null), '')
  assert.strictEqual(
    tab.formatLeg('2026-11-03', '18:30:00', 'flight', 'Chennai airport'),
    '3 Nov 2026, 6:30 pm — flight · Chennai airport'
  )
})

console.log('\nC. Blank and zero are different answers')

t('an unanswered count is blank', () => {
  assert.strictEqual(tab.showCount(null), '')
  assert.strictEqual(tab.showCount(undefined), '')
})

t('a collected zero is zero', () => {
  // `value || ''` would blank this, and a party that said "no children" would
  // read the same as a guest nobody has rung.
  assert.strictEqual(tab.showCount(0), '0')
})

t('members read as a sentence, and a zero child count survives', () => {
  assert.strictEqual(tab.formatMembers({ members_adults: 2, members_below_12: 1 }), '2 adults, 1 below 12')
  assert.strictEqual(tab.formatMembers({ members_adults: 1, members_below_12: null }), '1 adult')
  assert.strictEqual(tab.formatMembers({ members_adults: 1, members_below_12: 0 }), '1 adult, 0 below 12')
})

t('a guest nobody has reached has no members line at all', () => {
  assert.strictEqual(tab.formatMembers({ members_adults: null, members_below_12: null }), '')
  assert.strictEqual(tab.formatLuggage({ luggage_big: null, luggage_small: null }), '')
})

t('luggage keeps a zero too', () => {
  assert.strictEqual(tab.formatLuggage({ luggage_big: 2, luggage_small: 1 }), '2 big, 1 small')
  assert.strictEqual(tab.formatLuggage({ luggage_big: 0, luggage_small: 3 }), '0 big, 3 small')
})

console.log('\n' + pass + ' passed, ' + fails.length + ' failed')
console.log('HOSTCHECK-COMPLETED')
process.exit(fails.length ? 1 : 0)
