// Verifies that every static t('…') key used in web/src exists in en.json and de.json,
// and that both files have the same keys.
import { readFileSync, readdirSync, statSync } from 'node:fs'
import { join } from 'node:path'

const root = new URL('../web/src/', import.meta.url).pathname
const load = (l) => JSON.parse(readFileSync(join(root, 'i18n', `${l}.json`), 'utf8'))
const flat = (o, p = '') =>
  Object.entries(o).flatMap(([k, v]) =>
    v && typeof v === 'object' ? flat(v, `${p}${k}.`) : [`${p}${k}`],
  )
const en = new Set(flat(load('en')))
const de = new Set(flat(load('de')))

const files = []
const walk = (d) =>
  readdirSync(d).forEach((f) =>
    statSync(join(d, f)).isDirectory()
      ? walk(join(d, f))
      : /\.tsx?$/.test(f) && files.push(join(d, f)),
  )
walk(root)

const used = new Set()
for (const f of files) {
  const src = readFileSync(f, 'utf8')
  for (const m of src.matchAll(/\b(?:t|i18nKey=)\(?\s*['"]([a-zA-Z][\w.]+)['"]/g)) used.add(m[1])
  for (const m of src.matchAll(/['"]((?:admin|errors|forms)\.[\w.]+)['"]/g)) used.add(m[1])
}
// zod error messages are keys too
for (const m of readFileSync(new URL('../shared/src/schemas.ts', import.meta.url), 'utf8').matchAll(
  /'(errors\.\w+)'/g,
))
  used.add(m[1])

const problems = []
for (const k of used) {
  if (!en.has(k) && ![...en].some((e) => e.startsWith(`${k}.`)))
    problems.push(`missing in en: ${k}`)
  if (!de.has(k) && ![...de].some((e) => e.startsWith(`${k}.`)))
    problems.push(`missing in de: ${k}`)
}
for (const k of en) if (!de.has(k)) problems.push(`only in en: ${k}`)
for (const k of de) if (!en.has(k)) problems.push(`only in de: ${k}`)
if (problems.length) {
  console.error(problems.join('\n'))
  process.exit(1)
}
console.log(`i18n ok: ${used.size} keys used, ${en.size} defined.`)
