/* Registered only in production. Never cache Vite's development runtime. */
const CACHE = 'cofre-sombras-v3.2'
const ROOT = new URL('./', self.location.href).href
const successful = (response) => response && response.ok && response.type !== 'opaque'

function localURL(path, base) {
  try {
    const url = new URL(path, base)
    if (url.origin !== self.location.origin || !/^https?:$/.test(url.protocol)) return null
    url.hash = ''
    return url.href
  } catch {
    return null
  }
}

async function remember(request, response) {
  if (!successful(response)) return
  try {
    const cache = await caches.open(CACHE)
    await cache.put(request, response.clone())
  } catch {
    /* A full cache must not prevent the online game from loading. */
  }
}

async function prepareOffline() {
  const cache = await caches.open(CACHE)
  const visited = new Set()

  // Follow the entire dependency graph before activating: entry HTML -> JS/CSS,
  // CSS imports -> font stylesheet -> every font face, manifest -> every icon.
  async function prime(path, base = ROOT) {
    const url = localURL(path, base)
    if (!url || visited.has(url)) return
    visited.add(url)
    const response = await fetch(url, { cache: 'reload' })
    if (!successful(response)) throw new Error(`Offline resource unavailable: ${url}`)
    const pathname = new URL(url).pathname
    const isPage = url === ROOT
    const contentType = response.headers.get('Content-Type') || ''
    if (!isPage && contentType.includes('text/html'))
      throw new Error(`Unexpected HTML resource: ${url}`)
    await cache.put(url, response.clone())

    const dependencies = []
    if (isPage) {
      const html = await response.text()
      for (const match of html.matchAll(/(?:src|href)=["']([^"']+)["']/g)) {
        if (/\.(?:css|js|svg|png|webmanifest)(?:\?|$)/.test(match[1])) dependencies.push(match[1])
      }
      dependencies.push(
        'manifest.webmanifest',
        'icon.svg',
        'icon-192.png',
        'icon-512.png',
        'fonts/fonts.css',
      )
    } else if (pathname.endsWith('.css')) {
      const css = await response.text()
      for (const match of css.matchAll(/url\(\s*["']?([^"')\s]+)["']?\s*\)/g))
        dependencies.push(match[1])
      for (const match of css.matchAll(/@import\s+["']([^"']+)["']/g)) dependencies.push(match[1])
    } else if (pathname.endsWith('.js')) {
      const script = await response.text()
      // Vite replaces imported media with quoted, hashed /assets/ URLs.
      for (const match of script.matchAll(
        /["'\x60]([^"'\x60]*(?:assets|fonts)\/[^"'\x60\s]+\.(?:js|css|png|jpe?g|webp|avif|svg|woff2?|ttf|otf|mp3|ogg|wav))["'\x60]/g,
      ))
        dependencies.push(match[1])
      for (const match of script.matchAll(
        /(?:from\s*|import\s*\(\s*)["'\x60]([^"'\x60]+\.(?:js|css))["'\x60]/g,
      ))
        dependencies.push(match[1])
    } else if (pathname.endsWith('.webmanifest')) {
      const manifest = await response.json()
      for (const icon of manifest.icons || [])
        if (typeof icon.src === 'string') dependencies.push(icon.src)
    }
    await Promise.all(dependencies.map((dependency) => prime(dependency, url)))
  }

  await prime(ROOT)
}

self.addEventListener('install', (event) => {
  event.waitUntil(prepareOffline().then(() => self.skipWaiting()))
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys()
      await Promise.all(
        keys.filter((key) => key !== CACHE && /^cofre-/.test(key)).map((key) => caches.delete(key)),
      )
      await self.clients.claim()
    })(),
  )
})

self.addEventListener('fetch', (event) => {
  const request = event.request
  const url = new URL(request.url)
  if (request.method !== 'GET' || url.origin !== self.location.origin) return
  if (
    url.pathname.includes('/@') ||
    url.pathname.includes('/src/') ||
    url.pathname.includes('/node_modules/') ||
    url.searchParams.has('t')
  )
    return

  if (request.mode === 'navigate') {
    event.respondWith(
      (async () => {
        try {
          const response = await fetch(request)
          if (
            successful(response) &&
            (response.headers.get('Content-Type') || '').includes('text/html')
          )
            await remember(ROOT, response)
          return response
        } catch {
          return (
            (await caches.match(ROOT)) ||
            new Response('Abra o jogo uma vez com conexão para preparar o modo offline.', {
              status: 503,
              headers: { 'Content-Type': 'text/plain; charset=utf-8' },
            })
          )
        }
      })(),
    )
    return
  }

  // Never answer a missing script, image, or font with the HTML app shell.
  if (
    !url.pathname.includes('/assets/') &&
    !url.pathname.includes('/fonts/') &&
    !/(?:manifest\.webmanifest|icon(?:-192|-512)?\.(?:svg|png))$/.test(url.pathname)
  )
    return
  event.respondWith(
    (async () => {
      const cache = await caches.open(CACHE)
      // Vite preview adds Vary: Origin. Same-origin static assets are identical for
      // module crossorigin requests and the worker's own precache fetches.
      const stored = await cache.match(request, { ignoreVary: true })
      if (stored) return stored
      const response = await fetch(request)
      if (!(response.headers.get('Content-Type') || '').includes('text/html'))
        await remember(request, response)
      return response
    })(),
  )
})
