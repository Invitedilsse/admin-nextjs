// Syntax-check a JSX file with the parser Next actually uses.
// node --check cannot parse JSX and exits 0 on it, which is worse than
// having no check at all: it reports success on a file it never read.
const parser = require('@babel/parser')
const fs = require('fs')

let bad = 0

for (const f of process.argv.slice(2)) {
  try {
    parser.parse(fs.readFileSync(f, 'utf8'), {
      sourceType: 'module',
      plugins: ['jsx', 'classProperties', 'objectRestSpread', 'optionalChaining', 'nullishCoalescingOperator']
    })
    console.log('ok   ' + f)
  } catch (e) {
    bad++
    console.log('FAIL ' + f + ': ' + e.message)
  }
}

process.exit(bad ? 1 : 0)
