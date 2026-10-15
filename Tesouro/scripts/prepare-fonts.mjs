import { createHash } from 'node:crypto'
import { mkdir, readFile, readdir, realpath, stat, unlink, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

// Refresh the locally served, variable WOFF2 fonts and their redistribution licenses.
// Run from any directory: node scripts/prepare-fonts.mjs
const projectRoot = fileURLToPath(new URL('../', import.meta.url))
const fontsDirectory = path.join(projectRoot, 'public', 'fonts')
const stylesheetUrl =
  'https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400..700;1,400..700&family=Manrope:wght@400..800&display=swap'
const userAgent =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36'
const licenses = [
  {
    family: 'Cormorant Garamond',
    file: 'OFL-Cormorant-Garamond.txt',
    source: 'https://raw.githubusercontent.com/google/fonts/main/ofl/cormorantgaramond/OFL.txt',
  },
  {
    family: 'Manrope',
    file: 'OFL-Manrope.txt',
    source: 'https://raw.githubusercontent.com/google/fonts/main/ofl/manrope/OFL.txt',
  },
]

async function request(url) {
  const response = await fetch(url, {
    headers: { 'User-Agent': userAgent },
    signal: AbortSignal.timeout(30000),
  })
  if (!response.ok) throw new Error(`Download failed (${response.status}): ${url}`)
  return response
}

await mkdir(fontsDirectory, { recursive: true })
const verifiedDirectory = await realpath(fontsDirectory)
if (
  path.relative(await realpath(projectRoot), verifiedDirectory) !== path.join('public', 'fonts')
) {
  throw new Error('Font directory must resolve to public/fonts inside this project.')
}

const sourceCss = await (await request(stylesheetUrl)).text()
const faces = [
  ...sourceCss.matchAll(/\/\*\s*(latin(?:-ext)?)\s*\*\/\s*(@font-face\s*\{[^}]+\})/g),
].map(([, subset, rule]) => {
  const family = rule.match(/font-family:\s*'([^']+)'/)?.[1]
  const style = rule.match(/font-style:\s*(\w+)/)?.[1]
  const weight = rule.match(/font-weight:\s*([^;]+)/)?.[1].trim()
  const source = rule.match(/src:\s*url\((https:\/\/fonts\.gstatic\.com\/[^)]+\.woff2)\)/)?.[1]
  if (!family || !style || !weight || !source) throw new Error('Unexpected Google Fonts response.')
  if (family !== 'Cormorant Garamond' && family !== 'Manrope')
    throw new Error(`Unexpected font: ${family}`)
  const file = `${family.toLowerCase().replaceAll(' ', '-')}-${style}-${subset}.woff2`
  return {
    family,
    style,
    weight,
    subset,
    source,
    file,
    rule: rule.replace(source, `/fonts/${file}`),
  }
})

if (faces.length !== 6 || new Set(faces.map((face) => face.file)).size !== 6)
  throw new Error(
    'Expected six WOFF2 faces: latin and latin-ext for three family/style combinations.',
  )
for (const face of faces) {
  if (face.weight !== (face.family === 'Manrope' ? '400 800' : '400 700'))
    throw new Error(`Unexpected variable weight range for ${face.family}.`)
}

// Complete and validate every request before replacing the existing stylesheet.
const downloadsByUrl = new Map()
for (const face of faces) {
  if (!downloadsByUrl.has(face.source))
    downloadsByUrl.set(
      face.source,
      (async () => {
        const bytes = Buffer.from(await (await request(face.source)).arrayBuffer())
        if (bytes.subarray(0, 4).toString('ascii') !== 'wOF2' || bytes.length < 1000)
          throw new Error(`Invalid WOFF2: ${face.source}`)
        return bytes
      })(),
    )
}
const [fontBuffers, licenseTexts] = await Promise.all([
  Promise.all(faces.map((face) => downloadsByUrl.get(face.source))),
  Promise.all(
    licenses.map(async (license) => {
      const text = await (await request(license.source)).text()
      if (!text.includes('SIL OPEN FONT LICENSE Version 1.1') || !text.includes('Copyright'))
        throw new Error(`Invalid license: ${license.source}`)
      return text
    }),
  ),
])

let previousBytes = 0
const oldFiles = (await readdir(verifiedDirectory)).filter(
  (name) => /^type-(?:[0-9]|1[01])\.ttf$/.test(name) || name === 'source.css',
)
for (const name of oldFiles) previousBytes += (await stat(path.join(verifiedDirectory, name))).size
await Promise.all(
  faces.map((face, index) =>
    writeFile(path.join(verifiedDirectory, face.file), fontBuffers[index]),
  ),
)
await Promise.all(
  licenses.map((license, index) =>
    writeFile(path.join(verifiedDirectory, license.file), licenseTexts[index]),
  ),
)

const header =
  '/* Local variable WOFF2 fonts. Source and SIL OFL 1.1 licenses: ./provenance.json. */\n'
await writeFile(
  path.join(verifiedDirectory, 'fonts.css'),
  header +
    faces
      .map((face) => `\n/* ${face.family} ${face.style}: ${face.subset} */\n${face.rule}\n`)
      .join(''),
)
const provenance = {
  preparedAt: new Date().toISOString(),
  generator: 'scripts/prepare-fonts.mjs',
  stylesheetSource: stylesheetUrl,
  userAgent,
  license: 'SIL Open Font License 1.1',
  fonts: faces.map((face, index) => ({
    family: face.family,
    style: face.style,
    weights: face.weight,
    subset: face.subset,
    file: face.file,
    source: face.source,
    bytes: fontBuffers[index].length,
    sha256: createHash('sha256').update(fontBuffers[index]).digest('hex'),
  })),
  licenses: licenses.map((license, index) => ({
    ...license,
    sha256: createHash('sha256').update(licenseTexts[index]).digest('hex'),
  })),
}
await writeFile(
  path.join(verifiedDirectory, 'provenance.json'),
  JSON.stringify(provenance, null, 2) + '\n',
)

// Delete only the explicitly superseded TTF files and the obsolete source.css.
for (const name of oldFiles) await unlink(path.join(verifiedDirectory, name))
const downloadedBytes = fontBuffers.reduce((sum, buffer) => sum + buffer.length, 0)
const localCss = await readFile(path.join(verifiedDirectory, 'fonts.css'), 'utf8')
if (/url\(https?:/.test(localCss)) throw new Error('Generated CSS must reference local fonts only.')
console.log(
  JSON.stringify(
    {
      fonts: faces.length,
      bytes: downloadedBytes,
      previousBytes,
      reduction: previousBytes
        ? `${((1 - downloadedBytes / previousBytes) * 100).toFixed(1)}%`
        : null,
      licenses: licenses.length,
    },
    null,
    2,
  ),
)
