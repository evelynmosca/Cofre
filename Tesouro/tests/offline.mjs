import assert from 'node:assert/strict'
import { spawn } from 'node:child_process'
import fs from 'node:fs/promises'
import { existsSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { chromium } from '@playwright/test'

// Run after `npm run build`. This test owns a preview server on port 4173,
// unless OFFLINE_BASE_URL points to an already running production server.
const project = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const baseURL = process.env.OFFLINE_BASE_URL || 'http://127.0.0.1:4173'
const origin = new URL(baseURL).origin
const windowsChrome = 'C:/Program Files/Google/Chrome/Application/chrome.exe'
const executablePath =
  process.env.CHROME_PATH || (existsSync(windowsChrome) ? windowsChrome : undefined)
const output = path.join(project, 'artifacts', 'offline')
const fontStylesheet = await fs.readFile(path.join(project, 'dist', 'fonts', 'fonts.css'), 'utf8')
const fontPaths = [
  ...new Set(
    [...fontStylesheet.matchAll(/url\(\s*["']?([^"')\s]+)["']?\s*\)/g)].map(
      (match) => new URL(match[1], baseURL).pathname,
    ),
  ),
]
let server
let browser
let serverOutput = ''
let diagnosticPage
const diagnostics = { console: [], requests: [], failures: [] }

async function visible(locator) {
  await locator.waitFor({ state: 'visible', timeout: 20_000 })
}

try {
  if (!process.env.OFFLINE_BASE_URL) {
    await fs.access(path.join(project, 'dist', 'index.html'))
    server = spawn(
      process.execPath,
      [
        path.join(project, 'node_modules', 'vite', 'bin', 'vite.js'),
        'preview',
        '--host',
        '127.0.0.1',
        '--port',
        '4173',
        '--strictPort',
      ],
      { cwd: project, windowsHide: true, stdio: ['ignore', 'pipe', 'pipe'] },
    )
    server.stdout.on('data', (data) => {
      serverOutput += data
    })
    server.stderr.on('data', (data) => {
      serverOutput += data
    })
    let ready = false
    for (let i = 0; i < 100; i += 1) {
      if (server.exitCode !== null) throw new Error(`Preview failed: ${serverOutput}`)
      try {
        ready = (await fetch(baseURL)).ok
      } catch {
        /* Wait for preview. */
      }
      if (ready) break
      await new Promise((resolve) => setTimeout(resolve, 100))
    }
    assert.equal(ready, true, `Production preview did not start: ${serverOutput}`)
  }
  await fs.mkdir(output, { recursive: true })
  // A temporary regular profile also lets Chrome audit installability; an
  // incognito newContext() always reports "in-incognito" regardless of the app.
  browser = await chromium.launchPersistentContext('', {
    executablePath,
    headless: true,
    viewport: { width: 1440, height: 1000 },
    locale: 'pt-BR',
    reducedMotion: 'reduce',
    serviceWorkers: 'allow',
  })
  const context = browser
  const external = []
  const pageErrors = []
  context.on('request', (request) => {
    if (/^https?:/.test(request.url()) && new URL(request.url()).origin !== origin)
      external.push(request.url())
  })
  // Keep the test self-contained and detect accidental remote font/media dependencies.
  await context.route('**/*', (route) =>
    new URL(route.request().url()).origin === origin
      ? route.continue()
      : route.abort('blockedbyclient'),
  )
  const page = await context.newPage()
  diagnosticPage = page
  page.on('console', (message) => {
    if (message.type() === 'error') diagnostics.console.push(message.text())
  })
  page.on('requestfailed', (request) =>
    diagnostics.failures.push({ url: request.url(), reason: request.failure()?.errorText }),
  )
  page.on('response', (response) =>
    diagnostics.requests.push({
      url: response.url(),
      status: response.status(),
      worker: response.fromServiceWorker(),
    }),
  )
  page.on('pageerror', (error) => pageErrors.push(error.message))
  const cdp = await context.newCDPSession(page)
  await cdp.send('Network.enable')
  await cdp.send('Network.setCacheDisabled', { cacheDisabled: true })
  await page.goto(baseURL, { waitUntil: 'networkidle' })
  await visible(page.getByRole('button', { name: 'Iniciar minha jornada', exact: true }))
  await page.waitForFunction(
    async () => {
      const registration = await navigator.serviceWorker.getRegistration()
      return registration?.active?.state === 'activated' && !!navigator.serviceWorker.controller
    },
    { timeout: 30_000 },
  )
  const installability = await cdp.send('Page.getInstallabilityErrors')
  assert.deepEqual(
    installability.installabilityErrors,
    [],
    'Chrome should accept the manifest and PNG icons for installation.',
  )

  const cached = await page.evaluate(async () => {
    const keys = (await caches.keys()).filter((key) => key.startsWith('cofre-'))
    const urls = (
      await Promise.all(
        keys.map(async (key) =>
          (await (await caches.open(key)).keys()).map((request) => request.url),
        ),
      )
    ).flat()
    return { keys, paths: urls.map((url) => new URL(url).pathname) }
  })
  assert.equal(cached.keys.length, 1, 'Old project caches should be removed on activation.')
  assert.ok(fontPaths.length >= 6, 'The local font stylesheet must declare the complete font set.')
  for (const fontPath of fontPaths)
    assert.ok(
      cached.paths.includes(fontPath),
      `${fontPath} must be precached even if unused on the home screen.`,
    )
  for (const filename of [
    'fonts/fonts.css',
    'manifest.webmanifest',
    'icon.svg',
    'icon-192.png',
    'icon-512.png',
  ]) {
    assert.ok(cached.paths.includes(`/${filename}`), `${filename} must be precached.`)
  }
  assert.equal(
    cached.paths.filter((url) => /\/assets\/bayou.+\.png$/.test(url)).length,
    2,
    'Both React-imported landscape images must be precached.',
  )

  // Discard the browser HTTP cache so the reload must use Cache Storage via SW.
  await cdp.send('Network.clearBrowserCache')
  await context.setOffline(true)
  // Recent Chrome separates network emulation from navigator.onLine state.
  await cdp.send('Network.overrideNetworkState', {
    offline: true,
    latency: 0,
    downloadThroughput: 0,
    uploadThroughput: 0,
  })
  const offlineResponses = []
  page.on('response', (response) =>
    offlineResponses.push({
      url: response.url(),
      fromWorker: response.fromServiceWorker(),
      status: response.status(),
    }),
  )
  await page.reload({ waitUntil: 'networkidle' })
  await visible(page.getByRole('button', { name: 'Iniciar minha jornada', exact: true }))
  const fontStatus = await page.evaluate(async (paths) => {
    const declarations = [
      ...[400, 500, 600].map((weight) => `italic ${weight} 24px "Cormorant Garamond"`),
      ...[400, 500, 600, 700].map((weight) => `${weight} 24px "Cormorant Garamond"`),
      ...[400, 500, 600, 700, 800].map((weight) => `${weight} 24px "Manrope"`),
    ]
    const loaded = await Promise.all(
      declarations.map((value) => document.fonts.load(value, 'Árvore das Sombras ĄĆŁŃŚŽ')),
    )
    await document.fonts.ready
    const fetches = await Promise.all(
      paths.map(async (fontPath) => {
        const response = await fetch(fontPath, { cache: 'reload' })
        return response.ok && (await response.arrayBuffer()).byteLength > 10_000
      }),
    )
    return {
      faces: [...document.fonts].map((font) => ({ family: font.family, status: font.status })),
      allLoaded: loaded.every(
        (faces) => faces.length > 0 && faces.every((font) => font.status === 'loaded'),
      ),
      allFetched: fetches.every(Boolean),
    }
  }, fontPaths)
  assert.equal(fontStatus.allLoaded, true, 'Every font face must load offline.')
  assert.equal(
    fontStatus.allFetched,
    true,
    'Every font must remain available without the browser HTTP cache.',
  )
  assert.equal(fontStatus.faces.length, fontPaths.length)
  await page.screenshot({
    path: path.join(output, 'home.png'),
    fullPage: true,
    animations: 'disabled',
  })

  const manifest = await page.evaluate(async () => {
    const data = await (await fetch('/manifest.webmanifest')).json()
    const dimensions = []
    for (const icon of data.icons.filter((value) => value.type === 'image/png')) {
      const image = new Image()
      image.src = new URL(icon.src, location.href).href
      await image.decode()
      dimensions.push(`${image.naturalWidth}x${image.naturalHeight}`)
    }
    return { dimensions, display: data.display }
  })
  assert.deepEqual(manifest.dimensions, ['192x192', '512x512'])
  assert.equal(manifest.display, 'standalone')
  await page.getByRole('button', { name: 'Iniciar minha jornada', exact: true }).click()
  await page.getByRole('button', { name: 'Ir direto ao mapa', exact: true }).click()
  await visible(page.getByRole('region', { name: /Paisagem interativa/ }))
  const landscape = page.locator('.wm-painting')
  assert.equal(
    await landscape.evaluate((image) => image.complete && image.naturalWidth > 1000),
    true,
  )
  await page.getByRole('button', { name: 'Aproximar mapa', exact: true }).click()
  assert.equal(await page.getByRole('region', { name: /Ampliação 130%/ }).count(), 1)
  await page.getByRole('button', { name: 'Restaurar visão completa do mapa', exact: true }).click()
  await page.screenshot({
    path: path.join(output, 'map.png'),
    fullPage: true,
    animations: 'disabled',
  })
  await page.getByRole('button', { name: /^1\. Portal das Sombras/ }).click()
  await page.getByRole('button', { name: 'Explorar região', exact: true }).click()
  await visible(page.getByRole('heading', { name: 'Portal das Sombras', exact: true }))
  await page.getByRole('button', { name: /O anúncio dourado/ }).click()
  await visible(page.getByText(/Toda promessa tem um preço/))
  await page.getByRole('button', { name: 'Voltar ao mapa', exact: true }).click()
  assert.equal(await page.getByRole('button', { name: 'Explorar região', exact: true }).count(), 1)
  assert.equal(await page.getByRole('status').filter({ hasText: 'Você está offline' }).count(), 1)

  // A missing script must fail as a resource, never receive the cached HTML page.
  const missing = await page.evaluate(async () => {
    try {
      const response = await fetch('/assets/does-not-exist.js')
      return {
        rejected: false,
        html: (response.headers.get('content-type') || '').includes('text/html'),
      }
    } catch {
      return { rejected: true, html: false }
    }
  })
  assert.equal(missing.html, false)
  assert.equal(missing.rejected, true)
  assert.deepEqual(external, [], 'The experience should not request external services or fonts.')
  assert.deepEqual(pageErrors, [], 'The production experience should not throw browser errors.')
  assert.ok(
    offlineResponses.some(
      (response) => /\/assets\/.+\.js$/.test(response.url) && response.fromWorker,
    ),
  )
  assert.equal(
    new Set(
      offlineResponses
        .filter(
          (response) =>
            /\/fonts\/.+\.(?:ttf|woff2?)$/.test(response.url) &&
            response.fromWorker &&
            response.status === 200,
        )
        .map((response) => response.url),
    ).size,
    fontPaths.length,
  )
  const summary = {
    result: 'passed',
    cachedResources: cached.paths.length,
    fonts: fontPaths.length,
    pngIcons: manifest.dimensions,
    navigation: 'home → intro → map → chapter → map, offline',
    installabilityErrors: installability.installabilityErrors.length,
    externalRequests: external.length,
    pageErrors: pageErrors.length,
  }
  await fs.writeFile(path.join(output, 'report.json'), JSON.stringify(summary, null, 2))
  console.log(JSON.stringify(summary, null, 2))
} catch (error) {
  if (diagnosticPage) {
    await diagnosticPage
      .screenshot({ path: path.join(output, 'failure.png'), fullPage: true })
      .catch(() => {})
    diagnostics.body = await diagnosticPage
      .locator('body')
      .innerText()
      .catch(() => 'Unavailable')
    await fs.writeFile(path.join(output, 'failure.json'), JSON.stringify(diagnostics, null, 2))
  }
  throw error
} finally {
  await browser?.close()
  server?.kill()
}
