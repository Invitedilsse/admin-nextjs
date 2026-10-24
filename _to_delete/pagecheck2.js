/**
 * Renders the Travel Plan page itself against the real theme, and holds its
 * cell formatters to the blank-versus-zero rule.
 *
 * WHY THIS EXISTS BESIDE rendercheck.js AND parsecheck.js
 *
 * parsecheck.js proves the file parses and every JSX name is bound. rendercheck.js
 * proves the theme survives MUI's own colour maths. Neither one ever renders a
 * PAGE, so a page that passes both can still throw on its first paint — a bad
 * `slotProps` shape, a prop MUI rejects, a component imported from the wrong
 * module. This mounts the page.
 *
 * WHAT IT CANNOT DO: react-dom/server does not run effects, so only the state the
 * page opens in is rendered — no function chosen, no rows fetched. That is the
 * state an operator actually sees first, and it is the one most likely to be
 * skipped by hand-testing, so it is worth having. The fetched-data path is covered
 * on the server side instead, in wt-harness/test-web-travel.mjs, which asserts
 * every field of the row the page receives.
 *
 * The axios hook, the toast and the download helper are stubbed into require.cache
 * BEFORE the page is loaded. They are stubbed because they talk to the network and
 * the DOM, and nothing below asserts on their behaviour.
 *
 *   node pagecheck.js
 */
'use strict'

const fs = require('fs')
const path = require('path')
const Module = require('module')
const assert = require('assert')
const crypto = require('crypto')

const ROOT = process.env.PORTAL_ROOT || path.join(process.env.HOME, 'mnt', 'admin-nextjs')
const SRC = path.join(ROOT, 'src')
const projectRequire = Module.createRequire(path.join(ROOT, 'package.json'))

// ------------------------------------------------------------------- the loader
// Same arrangement as rendercheck.js: the project's own Babel, a resolver that
// understands its absolute 'src/...' imports, and a transform cache on disk
// because this tree sits on a mounted drive where a cold transform of one
// component's import graph costs 15-30 seconds.
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

const CACHE = path.join(process.env.HOME, '.rendercheck-cache')
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
const { ThemeProvider, createTheme } = projectRequire('@mui/material/styles')

const themeOptions = require(path.join(SRC, '@core/theme/ThemeOptions.js')).default
const themeConfig = require(path.join(SRC, 'configs/themeConfig.js')).default
const { SettingsContext } = require(path.join(SRC, '@core/context/settingsContext.js'))

const settings = { skin: themeConfig.skin, mode: 'light', direction: 'ltr', themeColor: 'primary' }
const theme = createTheme(themeOptions(settings, 'light'))

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

    return { data: { data: [], totalCount: 0 } }
  },
  apiPost: async url => {
    calls.push(['POST', url])

    return { data: { data: { added: 0, updated: 0, skipped: [] } } }
  }
})

stub('src/utils/blobconverter', { convertBase64Blob: async () => {}, convertBlob: async () => {} })

const toast = Object.assign(() => {}, { success: () => {}, error: () => {} })
stub('react-hot-toast', Object.assign(toast, { default: toast, __esModule: true }))

// ------------------------------------------------------------------- the page
const page = require(path.join(SRC, 'pages/travel-plan/index.js'))
const TravelPlan = page.default

const e = React.createElement
const wrap = node =>
  e(SettingsContext.Provider, { value: { settings, saveSettings: () => {} } }, e(ThemeProvider, { theme }, node))

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

console.log('\nA. The page renders')

let html = ''

t('it mounts against the real theme without throwing', () => {
  html = renderToStaticMarkup(wrap(e(TravelPlan)))
  assert.ok(html.length > 500, 'the page rendered almost nothing: ' + html.length + ' chars')
})

t('the first thing an operator sees is what to do next', () => {
  // The page opens with no function chosen, which is a legitimate state and not
  // an error. An empty table with headers and no explanation is the most common
  // unfinished-looking screen in an admin portal.
  assert.ok(/Choose a function/.test(html), 'the empty state is missing')
  assert.ok(/Guest Travel Plan/.test(html), 'the page title is missing')
})

t('the toolbar offers the upload, the sample and the export', () => {
  assert.ok(/Upload sheet/.test(html))
  assert.ok(/Sample sheet/.test(html))
  assert.ok(/Export/.test(html))
})

t('nothing is requested before a function is chosen', () => {
  // Effects do not run under renderToStaticMarkup, but a fetch fired from the
  // component body would still show up here — and would mean the page hits the
  // API on every mount with no function_id.
  assert.deepStrictEqual(calls, [], 'the page fetched during render: ' + JSON.stringify(calls))
})

t('the count chip is withheld until there is a number to show', () => {
  // PageToolbar renders the chip only for a finite count. A '0' that really
  // means "nothing loaded yet" is worse than no number.
  assert.ok(!/>0</.test(html), 'a zero count is being shown before anything has loaded')
})

t('it declares its own ACL subject', () => {
  assert.deepStrictEqual(TravelPlan.acl, { action: 'read', subject: 'travelplan' })
})

console.log('\nB. Blank and zero are different answers')

t('an uncollected count is a dash', () => {
  assert.strictEqual(page.dash(''), '-')
  assert.strictEqual(page.dash(null), '-')
  assert.strictEqual(page.dash(undefined), '-')
})

t('a collected zero is zero', () => {
  // THE BUG THIS GUARDS. `value || '-'` would print a dash here, and a column of
  // dashes over a party that really did say "no children" is a column the
  // operator would ring four hundred people to re-check.
  assert.strictEqual(page.dash(0), 0)
})

t('members read as a sentence, and a zero child count survives', () => {
  assert.strictEqual(page.formatMembers({ adults: 2, below12: 1 }), '2 adults, 1 below 12')
  assert.strictEqual(page.formatMembers({ adults: 1, below12: '' }), '1 adult')
  assert.strictEqual(page.formatMembers({ adults: 1, below12: 0 }), '1 adult, 0 below 12')
  assert.strictEqual(page.formatMembers({ adults: 0, below12: 0 }), '0 adults, 0 below 12')
})

t('a guest nobody has reached reads as one dash, not "- adults, - below 12"', () => {
  assert.strictEqual(page.formatMembers({ adults: '', below12: '' }), '-')
  assert.strictEqual(page.formatLuggage({ luggageBig: '', luggageSmall: '' }), '-')
})

t('luggage keeps a zero too', () => {
  assert.strictEqual(page.formatLuggage({ luggageBig: 2, luggageSmall: 1 }), '2 big, 1 small')
  assert.strictEqual(page.formatLuggage({ luggageBig: 0, luggageSmall: 3 }), '0 big, 3 small')
  assert.strictEqual(page.formatLuggage({ luggageBig: 2, luggageSmall: '' }), '2 big, - small')
})

t('one adult is an adult, two are adults', () => {
  assert.ok(page.formatMembers({ adults: 1, below12: '' }).endsWith('adult'))
  assert.ok(page.formatMembers({ adults: 2, below12: '' }).endsWith('adults'))
})

console.log('\n' + pass + ' passed, ' + fails.length + ' failed')
console.log('PAGECHECK-COMPLETED')
process.exit(fails.length ? 1 : 0)
