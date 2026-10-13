import { execFileSync } from 'node:child_process'
import { readFile, writeFile, rm } from 'node:fs/promises'
import { resolve } from 'node:path'
import { pathToFileURL } from 'node:url'

const root = resolve(import.meta.dirname, '..')
const vite = resolve(root, 'node_modules/vite/bin/vite.js')
const serverOutput = resolve(root, '.seo-ssr')
const dist = resolve(root, 'dist')

function siteUrl() {
  const configured = process.env.SITE_URL
  const vercelDomain = process.env.VERCEL_PROJECT_PRODUCTION_URL
  const raw = configured || (vercelDomain ? `https://${vercelDomain}` : '')
  if (!raw) return null
  const parsed = new URL(raw)
  if (!['https:', 'http:'].includes(parsed.protocol) || parsed.username || parsed.password) {
    throw new Error('SITE_URL deve ser uma URL HTTP(S) pública.')
  }
  return `${parsed.origin}/`
}

function runVite(args) {
  execFileSync(process.execPath, [vite, ...args], { cwd: root, stdio: 'inherit' })
}

const canonical = siteUrl()

try {
  runVite(['build'])
  runVite(['build', '--ssr', 'src/entry-server.js', '--outDir', '.seo-ssr'])

  const { render } = await import(pathToFileURL(resolve(serverOutput, 'entry-server.js')).href)
  const appHtml = await render()
  const indexPath = resolve(dist, 'index.html')
  let html = await readFile(indexPath, 'utf8')
  if (!html.includes('<div id="app"></div>')) throw new Error('O contêiner #app não foi encontrado no HTML gerado.')
  html = html.replace('<div id="app"></div>', `<div id="app">${appHtml}</div>`)

  const schema = {
    '@context': 'https://schema.org',
    '@type': 'WebApplication',
    name: 'StarCalc',
    description: 'Calculadora gratuita para estimar o valor proporcional ao reativar uma assinatura Starlink e a franquia até a próxima fatura.',
    inLanguage: 'pt-BR',
    applicationCategory: 'UtilitiesApplication',
    operatingSystem: 'Web',
    isAccessibleForFree: true,
    offers: { '@type': 'Offer', price: '0', priceCurrency: 'BRL' },
    creator: { '@type': 'Person', name: 'Wender Galan', url: 'https://github.com/WenderGalan' },
    ...(canonical ? { url: canonical } : {}),
  }
  const structuredData = JSON.stringify(schema).replaceAll('<', '\\u003c')
  let seoTags = `<script type="application/ld+json">${structuredData}</script>`

  if (canonical) {
    seoTags += `<link rel="canonical" href="${canonical}" />`
    seoTags += `<meta property="og:url" content="${canonical}" />`
    seoTags += `<meta property="og:image" content="${canonical}og-image.png" />`
    seoTags += `<meta property="og:image:width" content="1200" />`
    seoTags += `<meta property="og:image:height" content="630" />`
    seoTags += `<meta property="og:image:alt" content="StarCalc, calculadora para retomar sua Starlink" />`
    seoTags += `<meta name="twitter:image" content="${canonical}og-image.png" />`
    await writeFile(resolve(dist, 'sitemap.xml'), `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n  <url><loc>${canonical}</loc></url>\n</urlset>\n`)
  }

  html = html.replace('</head>', `    ${seoTags}\n  </head>`)
  if (process.env.VERCEL_ENV && process.env.VERCEL_ENV !== 'production') {
    html = html.replace('<meta name="robots" content="index, follow" />', '<meta name="robots" content="noindex, nofollow" />')
  }
  await writeFile(indexPath, html)
  await writeFile(resolve(dist, 'robots.txt'), `User-agent: *\nAllow: /\n${canonical ? `Sitemap: ${canonical}sitemap.xml\n` : ''}`)
  console.log(`SEO: HTML pré-renderizado${canonical ? ` para ${canonical}` : ' (defina SITE_URL para canonical e sitemap)'}.`)
} finally {
  await rm(serverOutput, { recursive: true, force: true })
}
