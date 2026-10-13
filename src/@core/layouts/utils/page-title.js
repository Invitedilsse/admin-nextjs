/**
 * What the header should call the page you are on.
 * -------------------------------------------------------------------------------------
 * Pulled out of AppBarContent on purpose. It is pure - a pathname and the nav list in,
 * a title out - so it can be tested without rendering React, which matters here: the
 * header imports the user menu, which imports the redux store, and requiring that
 * whole graph through Babel takes the better part of a minute on this machine.
 *
 * The rules, in order:
 *   1. An exact nav match wins.
 *   2. Otherwise the LONGEST nav path this route sits under, so /campaign/whatsapp-pdf
 *      resolves to "WhatsApp Invites" and not to "Campaign Management".
 *   3. Under a nav entry with a readable last segment, the segment is the title and
 *      the nav entry becomes the line above it: "User Management / Users history".
 *   4. A dynamic segment ([id]) is not a title, so step 3 falls back to the parent's
 *      own name rather than printing brackets at somebody.
 *   5. A route in no nav entry at all gets its last segment de-slugged, which is
 *      still better than an empty bar.
 */

// ** Nav items can nest, even though today's list is flat. Handle both.
// ** `item &&` is not decoration: a nav config written as
//    `cond ? { title: 'X', path: '/x' } : null` puts a null in this list, and
//    reading .children off it took the whole header down. titlecheck.js covers it.
export const flattenNav = items =>
  (items || []).reduce(
    (all, item) => all.concat(item && item.children ? [item, ...flattenNav(item.children)] : [item]),
    []
  )

// ** 'users-history' -> 'Users history'. Sentence case, not Title Case: a header is
//    a sentence, and Title Case On Every Word reads like a 2009 admin template.
export const fromSlug = segment =>
  String(segment || '')
    .replace(/\[|\]|\.\.\./g, '')
    .split('-')
    .filter(Boolean)
    .map((w, i) => (i === 0 ? w.charAt(0).toUpperCase() + w.slice(1) : w))
    .join(' ')

export const describePage = (pathname, navItems) => {
  const path = String(pathname || '/')
  const items = flattenNav(navItems).filter(i => i && i.path && i.title)

  const exact = items.find(i => i.path === path)
  if (exact) return { title: exact.title, parent: null }

  const under = items.filter(i => path.startsWith(i.path + '/')).sort((a, b) => b.path.length - a.path.length)[0]

  const tail = path.split('/').filter(Boolean).pop()
  const leaf = tail && !/^\[/.test(tail) ? fromSlug(tail) : null

  if (under) return { title: leaf || under.title, parent: leaf ? under.title : null }

  const segments = path.split('/').filter(Boolean)

  return { title: segments.length ? fromSlug(segments[segments.length - 1]) : 'Home', parent: null }
}

export default describePage
