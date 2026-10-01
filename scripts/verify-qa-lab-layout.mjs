// scripts/verify-qa-lab-layout.mjs
// TASK-049 — verificacion de LAYOUT REAL de los bugs visuales del QA Lab, en Chrome headed por CDP crudo (sin Playwright,
// sin dependencias nuevas: solo Node 22 y su WebSocket nativo) sobre `vite preview` (el build de PRODUCCION: pilla tambien
// errores que solo existen en prod).
//
// POR QUE EXISTE: jsdom no hace layout. Los specs de Vitest afirman que el flag agrega la clase o el nodo del bug
// (.bug-truncated, .qa-sticker, .site-strip...), pero no que el efecto geometrico exista de verdad ni que el sitio SIN
// flag este limpio. Esto lo mide con getBoundingClientRect / elementFromPoint / scrollWidth, con flag y sin flag:
//
//   button-covered   elementFromPoint en el centro de la mitad IZQUIERDA del boton principal: con flag devuelve la etiqueta
//                    promocional (.qa-sticker), sin flag el propio boton.
//   mobile-overflow  viewport 375x667: documentElement.scrollWidth > clientWidth solo con flag (sin flag el sitio no desborda:
//                    un desborde sin flag seria un bug no catalogado del lab).
//   text-truncated   scrollHeight > clientHeight de la nota bajo el titulo (.site-note) solo con flag.
//   misaligned       desplazamiento de `left` del h1 respecto de su contenedor (.site-page) > 2 px solo con flag.
//
// El "sticky que tapa el boton de pagar" (sticky-summary-covers-pay) NO esta en la seleccion de 36 bugs de v2 (decision de
// Rafael, BUGS-V2.md 2B: descartado), asi que no se mide. Si algun dia entra al catalogo, agregar su caso a CASES.
//
// "Semillas que los activan": el script importa el generador (funcion pura), busca para cada bug una (semilla, nivel) que lo
// active en una pagina y otra semilla CONTROL con esa misma pagina y ninguno de los bugs de layout activos, y abre
// ?seed=..&level=..&lang=es#/ruta. Nunca se fuerza un flag por URL (no hay esa via: seria filtrar el solucionario).
//
// Uso:
//   node scripts/verify-qa-lab-layout.mjs                 # buildea siempre, levanta preview + Chrome, mide, cierra todo
//   opciones: --only=button-covered,mobile-overflow  --chrome="C:\\ruta\\chrome.exe"  --preview-port=4173  --cdp-port=9444
//             --no-build (usa el dist/ existente)  --keep (deja Chrome y preview abiertos)
//   env CHROME_PATH tambien fija el ejecutable. Chrome corre HEADED (headless degrada layout/compositor y ignora ventanas chicas;
//   ver .planning/LECCIONES-TECNICAS.md §6). Codigo de salida 0 = todo coincide; 1 = alguna medicion no coincide o no pudo medirse.

import { spawn, spawnSync } from 'node:child_process'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const args = Object.fromEntries(process.argv.slice(2).map((a) => { const [k, v] = a.replace(/^--/, '').split('='); return [k, v ?? true] }))
const PREVIEW_PORT = Number(args['preview-port'] || 4173)
const CDP_PORT = Number(args['cdp-port'] || 9444)
const ONLY = args.only ? String(args.only).split(',') : null
const sleep = (ms) => new Promise((r) => setTimeout(r, ms))
const lab = (p) => import(pathToFileURL(path.join(ROOT, 'src/qa-lab', p)).href)

// ---------------------------------------------------------------- casos
const LAYOUT_BUGS = ['button-covered', 'mobile-overflow', 'text-truncated', 'misaligned']
const MOBILE = { width: 375, height: 667, mobile: false }
const DESKTOP = { width: 1280, height: 900, mobile: false }
// level = nivel minimo del bug; se mide ademas en senior. viewport = donde se manifiesta el efecto.
const CASES = {
  'button-covered': { levels: ['semi', 'senior'], viewport: DESKTOP, measure: 'buttonCovered', flagged: (m) => m.covered === true && m.hit === 'qa-sticker', clean: (m) => m.covered === false },
  'mobile-overflow': { levels: ['semi', 'senior'], viewport: MOBILE, measure: 'overflowX', flagged: (m) => m.sw > m.cw, clean: (m) => m.sw <= m.cw },
  'text-truncated': { levels: ['junior', 'senior'], viewport: DESKTOP, measure: 'noteTruncated', flagged: (m) => m.sh > m.ch + 1, clean: (m) => m.sh <= m.ch + 1 },
  misaligned: { levels: ['junior', 'senior'], viewport: DESKTOP, measure: 'h1Offset', flagged: (m) => m.dx > 2, clean: (m) => Math.abs(m.dx) <= 2 },
}

// Expresiones que se evaluan en la pagina (devuelven JSON simple).
const MEASURES = {
  buttonCovered: `(() => {
    const b = document.querySelector('.qa-btn-wrap .qa-btn'); if (!b) return { error: 'la pagina no tiene boton principal' }
    b.scrollIntoView({ block: 'center' })
    const r = b.getBoundingClientRect()
    const el = document.elementFromPoint(r.left + r.width * 0.25, r.top + r.height / 2) // centro de la mitad izquierda
    return { covered: !!el && el !== b && !b.contains(el), hit: el ? (el.className || el.tagName).toString().split(' ')[0] : null, btn: [r.left, r.top, r.width, r.height].map(Math.round) }
  })()`,
  overflowX: `({ sw: document.documentElement.scrollWidth, cw: document.documentElement.clientWidth, iw: window.innerWidth })`,
  noteTruncated: `(() => { const n = document.querySelector('.site-note'); return n ? { sh: n.scrollHeight, ch: n.clientHeight, cls: n.className } : { error: 'sin .site-note' } })()`,
  h1Offset: `(() => { const h = document.querySelector('.site-page > h1'), s = document.querySelector('.site-page'); return h && s ? { dx: Math.round((h.getBoundingClientRect().left - s.getBoundingClientRect().left) * 10) / 10 } : { error: 'sin h1' } })()`,
}

/** Primer (semilla, nivel) donde `bugId` esta activo, y una semilla control con esa pagina y ninguno de los bugs de layout. */
async function findCase(bugId, level, generateSite) {
  let flagged = null
  for (let i = 0; i < 600 && !flagged; i++) {
    const site = generateSite(`layout-${bugId}-${i}`, level)
    if (site.bugs.includes(bugId) && !['login', 'signup'].includes(site.bugPages[bugId])) flagged = site // login/signup con sesion redirigen
  }
  if (!flagged) throw new Error(`ninguna semilla activa ${bugId} en ${level}`)
  const page = flagged.bugPages[bugId]
  for (let i = 0; i < 600; i++) {
    const site = generateSite(`layout-control-${i}`, level)
    if (site.pages.includes(page) && !LAYOUT_BUGS.some((b) => site.bugs.includes(b) && site.bugPages[b] === page)) return { page, flagged, control: site }
  }
  throw new Error(`ninguna semilla control con la pagina ${page} en ${level}`)
}

// ---------------------------------------------------------------- procesos (vite preview + Chrome)
function chromePath() {
  const c = [args.chrome, process.env.CHROME_PATH,
    'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe', 'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
    process.env.LOCALAPPDATA && path.join(process.env.LOCALAPPDATA, 'Google', 'Chrome', 'Application', 'chrome.exe'),
    'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
    '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', '/usr/bin/google-chrome', '/usr/bin/chromium', '/usr/bin/chromium-browser']
  const found = c.filter(Boolean).find((p) => typeof p === 'string' && fs.existsSync(p))
  if (!found) throw new Error('no encuentro Chrome: pasa --chrome="<ruta>" o define CHROME_PATH')
  return found
}

function kill(child) {
  if (!child || child.killed || child.exitCode !== null) return
  if (process.platform === 'win32') spawnSync('taskkill', ['/pid', String(child.pid), '/T', '/F'], { stdio: 'ignore' })
  else child.kill('SIGKILL')
}

async function waitHttp(url, label, ms = 30000) {
  const t0 = Date.now()
  while (Date.now() - t0 < ms) {
    try { if ((await fetch(url)).ok) return } catch { /* aun no */ }
    await sleep(250)
  }
  throw new Error(`${label} no respondio en ${ms} ms (${url})`)
}

// ---------------------------------------------------------------- CDP crudo
async function connect(cdpPort) {
  const targets = await (await fetch(`http://127.0.0.1:${cdpPort}/json`)).json()
  const page = targets.find((t) => t.type === 'page')
  if (!page) throw new Error('Chrome no expone ningun target "page"')
  const ws = new WebSocket(page.webSocketDebuggerUrl)
  let id = 0
  const pending = new Map()
  ws.addEventListener('message', (ev) => {
    const msg = JSON.parse(ev.data)
    if (msg.id !== undefined && pending.has(msg.id)) {
      const { resolve, reject } = pending.get(msg.id)
      pending.delete(msg.id)
      if (msg.error) reject(new Error(JSON.stringify(msg.error)))
      else resolve(msg.result)
    }
  })
  await new Promise((resolve, reject) => { ws.addEventListener('open', resolve); ws.addEventListener('error', reject) })
  const send = (method, params = {}) => new Promise((resolve, reject) => { const i = ++id; pending.set(i, { resolve, reject }); ws.send(JSON.stringify({ id: i, method, params })) })
  const evaluate = async (expression) => {
    const r = await send('Runtime.evaluate', { expression, returnByValue: true })
    if (r.exceptionDetails) throw new Error(`Eval: ${JSON.stringify(r.exceptionDetails)}`)
    return r.result.value
  }
  // Una pestana sin foco en Windows queda "hidden" y Chrome pausa rAF/IO: se fuerza activa (LECCIONES-TECNICAS §6).
  await send('Page.enable')
  await send('Page.setWebLifecycleState', { state: 'active' }).catch(() => {})
  await send('Emulation.setFocusEmulationEnabled', { enabled: true }).catch(() => {})
  return { ws, send, evaluate }
}

async function waitFor(fn, label, ms = 15000) {
  const t0 = Date.now()
  while (Date.now() - t0 < ms) { if (await fn()) return; await sleep(80) }
  throw new Error(`timeout esperando: ${label}`)
}

/** Abre ?seed&level&lang#/ruta con el estado minimo en sessionStorage (carrito para el checkout, sesion para la cuenta). */
async function open(cx, origin, site, page, viewport, storageKey, concretePath) {
  await cx.send('Emulation.setDeviceMetricsOverride', { ...viewport, deviceScaleFactor: 1 })
  await cx.send('Page.navigate', { url: `${origin}/qa-lab/?prime=${Date.now()}` })
  await waitFor(async () => (await cx.evaluate('document.readyState')) === 'complete', 'carga inicial')
  const saved = page === 'checkout' ? { cart: [{ id: 1, qty: 1 }] } : page === 'account' ? { user: { name: 'Ana', email: 'ana@example.com' } } : null
  if (saved) await cx.evaluate(`sessionStorage.setItem(${JSON.stringify(storageKey(site.seed, site.level))}, ${JSON.stringify(JSON.stringify(saved))})`)
  await cx.send('Page.navigate', { url: `${origin}/qa-lab/?seed=${site.seed}&level=${site.level}&lang=es#${concretePath(site, page)}` })
  await waitFor(() => cx.evaluate(`document.readyState === 'complete' && !!document.querySelector('main [data-page="${page}"]')`), `pagina ${page} de ${site.seed}`)
  await sleep(300) // fuentes y layout asentados
}

// ---------------------------------------------------------------- main
const { generateSite } = await lab('generator/site.js')
const { concretePath } = await lab('generator/pages.js')
const { storageKey } = await lab('state/store.js')

const children = []
let profile = null
let exitCode = 0
const rows = []
try {
  if (!args['no-build']) { // SIEMPRE buildea (un dist/ viejo mediria otro codigo); --no-build es la unica forma de saltearlo
    console.log('vite build (produccion)...')
    const b = spawnSync(process.execPath, [path.join(ROOT, 'node_modules/vite/bin/vite.js'), 'build'], { cwd: ROOT, stdio: 'inherit' })
    if (b.status !== 0) throw new Error('vite build fallo')
  }
  const preview = spawn(process.execPath, [path.join(ROOT, 'node_modules/vite/bin/vite.js'), 'preview', '--port', String(PREVIEW_PORT), '--strictPort', '--host', '127.0.0.1'], { cwd: ROOT, stdio: 'ignore' })
  children.push(preview)
  const origin = `http://127.0.0.1:${PREVIEW_PORT}`
  await waitHttp(`${origin}/qa-lab/`, 'vite preview')

  profile = fs.mkdtempSync(path.join(os.tmpdir(), 'qa-lab-layout-'))
  const chrome = spawn(chromePath(), [`--remote-debugging-port=${CDP_PORT}`, `--user-data-dir=${profile}`, '--no-first-run', '--no-default-browser-check',
    '--disable-background-timer-throttling', '--disable-renderer-backgrounding', '--disable-backgrounding-occluded-windows', `--window-size=1400,1000`, 'about:blank'], { stdio: 'ignore' })
  children.push(chrome)
  await waitHttp(`http://127.0.0.1:${CDP_PORT}/json/version`, 'Chrome (CDP)')
  const cx = await connect(CDP_PORT)

  for (const [bugId, spec] of Object.entries(CASES)) {
    if (ONLY && !ONLY.includes(bugId)) continue
    for (const level of spec.levels) {
      const c = await findCase(bugId, level, generateSite)
      for (const [kind, site] of [['con flag', c.flagged], ['sin flag', c.control]]) {
        let m, ok, note = ''
        try {
          await open(cx, origin, site, c.page, spec.viewport, storageKey, concretePath)
          m = await cx.evaluate(MEASURES[spec.measure])
          ok = m.error ? false : kind === 'con flag' ? spec.flagged(m) : spec.clean(m)
          if (m.error) note = m.error
        } catch (e) {
          ok = false
          note = String(e.message || e)
        }
        rows.push({ bug: bugId, nivel: level, pagina: c.page, caso: kind, semilla: site.seed, ok, medicion: m || note })
        if (!ok) exitCode = 1
      }
    }
  }

  console.log('\nQA Lab - layout real (Chrome headed, vite preview)')
  for (const r of rows) console.log(`${r.ok ? 'OK  ' : 'FAIL'} ${r.bug.padEnd(15)} ${r.nivel.padEnd(7)} ${r.pagina.padEnd(9)} ${r.caso.padEnd(8)} ${r.semilla.padEnd(34)} ${JSON.stringify(r.medicion)}`)
  console.log(`\n${rows.filter((r) => r.ok).length}/${rows.length} mediciones coinciden con lo esperado`)
  await cx.ws.close()
} catch (e) {
  console.error('ERROR:', e.message || e)
  exitCode = 1
} finally {
  if (!args.keep) {
    children.forEach(kill)
    await sleep(800) // Chrome suelta el perfil al morir (en Windows el borrado inmediato da EBUSY)
    try { if (profile) fs.rmSync(profile, { recursive: true, force: true }) } catch { /* el perfil temporal queda en %TEMP%: no es un fallo de la medicion */ }
  }
}
process.exit(exitCode)
