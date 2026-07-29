// scripts/verify-ch5-broadcast.mjs
// TASK-011 — harness de verificación geométrica/real para ch5 "LA TRANSMISION"
// (Chapter5Content.vue), committeado al repo porque el instrumento tiene que
// ser auditable por el reviewer (Lección técnica #6: "si el instrumento no
// está en el repo, su verde no es auditable"). Basado en el mismo patrón que
// scripts/verify-ch3-roadmap-geometry.mjs (TASK-024).
//
// POR QUÉ EXISTE: jsdom no hace layout ni compone WebGL/backdrop-filter
// (.planning/LECCIONES-TECNICAS.md §2) — un verde de la suite Vitest no prueba
// que el panel de transmisión sea legible, que nada tape la pantalla, ni que
// la multitud/el slideshow avancen de verdad. Este script mide eso en Chrome
// real vía CDP crudo.
//
// QUÉ MIDE, por viewport y locale:
//   A. innerText de section[data-chapter="5"] > 0 SIN interacción (AC#1).
//   B. .ch5-stream-panel no intersecta .cine-screen y su ancho <= 40% del
//      viewport en desktop (AC de la spec §4.4/§8).
//   C. Progresión REAL en DOS instantes distintos (Lección #2 — getAnimations
//      no prueba avance): el índice activo del slideshow (.cine-screen-img
//      .is-active) cambia entre t0 y t0+5s, Y al menos un .cine-char-live
//      cambia su backgroundPositionX en la misma ventana (prueba que tick()
//      de la multitud avanza, no sólo que existe).
//   D. Conteo de la multitud: seats renderizados (.cine-char-live +
//      .cine-char) y CAST único (grep del SFC) — se imprimen para que el
//      hand-off los reporte.
//   E. Contraste real: Page.captureScreenshot + sampling del píxel detrás de
//      un .ch5-feed-text contra su color de texto computado (nunca
//      canvas.toDataURL — Lección #3).
//   F. prefers-reduced-motion: con `Emulation.setEmulatedMedia` a `reduce`,
//      confirma que `.cine-screen` nunca gana `.is-glitch` durante una ventana
//      de scene-advance (4.5s) y que los dots de pulso quedan con
//      animation-name: none.
//   G. Sin em-dash en el innerText renderizado (regla editorial del sitio).
//   H. Mobile portrait: `.ch5-scene` mide significativamente menos que el
//      viewport completo (layout de streaming apilado) y `.ch5-stream-panel`
//      no se solapa con ella.
//
// CÓMO CORRERLO (Windows/PowerShell, receta completa en
// .planning/LECCIONES-TECNICAS.md §6):
//   1. `npm run dev` en una terminal (deja el server en :5173).
//   2. Levantar Chrome HEADED (headless degrada compositor/backdrop-filter):
//      & "C:\Program Files\Google\Chrome\Application\chrome.exe" `
//        --remote-debugging-port=9333 `
//        --user-data-dir="$env:TEMP\ch5-verify-profile" `
//        --no-first-run --no-default-browser-check `
//        "http://127.0.0.1:5173/"
//   3. `node scripts/verify-ch5-broadcast.mjs`
//      (opcional: --cdp-port=NNNN, --url=http://...)
//
// Bloqueadores ya resueltos (no los redescubras): BootScreen exige
// Input.dispatchMouseEvent real, no .click() sintético. La cinemática
// ch2->ch3 (~5.9s) se dispara en CUALQUIER salto directo a un capítulo
// posterior (incluido ch5) y se saltea con Escape. Con muchas ventanas de
// Chrome abiertas, Page.setWebLifecycleState + Emulation.setFocusEmulationEnabled
// fuerzan el foco sin depender del z-order real. Emulation.setDeviceMetricsOverride
// cuantiza altos IMPARES hacia arriba — los viewports de abajo usan altos pares.
// Nunca un sleep fijo tras un salto de scroll: se espera a que scrollTop se
// estabilice por polling (ver waitScrollStable).
//
// Exit code 0 si TODOS los viewports x locale quedan limpios; 1 si algo falla.

import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

function parseArgs(argv) {
  const out = { cdpPort: 9333, url: 'http://127.0.0.1:5173/' }
  for (const arg of argv) {
    const m = arg.match(/^--([\w-]+)=(.+)$/)
    if (!m) continue
    if (m[1] === 'cdp-port') out.cdpPort = Number(m[2])
    if (m[1] === 'url') out.url = m[2]
  }
  return out
}

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms))
}

async function connect(cdpPort, url) {
  const targets = await (await fetch(`http://127.0.0.1:${cdpPort}/json`)).json()
  const urlOrigin = new URL(url).origin
  let page = targets.find((t) => t.type === 'page' && t.url.startsWith(urlOrigin))
  if (!page) page = targets.find((t) => t.type === 'page')
  if (!page) throw new Error(`No se encontró ningún target "page" en :${cdpPort} — ¿Chrome levantado con --remote-debugging-port?`)
  const ws = new WebSocket(page.webSocketDebuggerUrl)
  let msgId = 0
  const pending = new Map()
  const eventHandlers = []
  ws.addEventListener('message', (ev) => {
    const msg = JSON.parse(ev.data)
    if (msg.id !== undefined && pending.has(msg.id)) {
      const { resolve, reject } = pending.get(msg.id)
      pending.delete(msg.id)
      if (msg.error) reject(new Error(JSON.stringify(msg.error)))
      else resolve(msg.result)
    } else if (msg.method) {
      for (const h of eventHandlers) h(msg)
    }
  })
  await new Promise((resolve, reject) => {
    ws.addEventListener('open', resolve)
    ws.addEventListener('error', reject)
  })
  function send(method, params = {}) {
    const id = ++msgId
    return new Promise((resolve, reject) => {
      pending.set(id, { resolve, reject })
      ws.send(JSON.stringify({ id, method, params }))
    })
  }
  async function evaluate(expression) {
    const res = await send('Runtime.evaluate', { expression, returnByValue: true })
    if (res.exceptionDetails) throw new Error('Eval error: ' + JSON.stringify(res.exceptionDetails))
    return res.result.value
  }
  return { ws, send, evaluate, eventHandlers }
}

async function waitScrollStable(cx) {
  const { evaluate } = cx
  let last = null
  let stableCount = 0
  for (let i = 0; i < 60; i++) {
    const top = await evaluate(`(document.querySelector('.scroll-shell') || document.scrollingElement).scrollTop`)
    if (last !== null && Math.abs(top - last) < 0.5) {
      stableCount++
      if (stableCount >= 5) break
    } else {
      stableCount = 0
    }
    last = top
    await sleep(60)
  }
  await sleep(150)
}

async function bootAndJumpToCh5(cx, url) {
  const { send, evaluate, eventHandlers } = cx
  await send('Page.navigate', { url })
  await new Promise((resolve) => {
    const h = (msg) => {
      if (msg.method === 'Page.loadEventFired') {
        eventHandlers.splice(eventHandlers.indexOf(h), 1)
        resolve()
      }
    }
    eventHandlers.push(h)
  })
  await send('Page.setWebLifecycleState', { state: 'active' })
  await send('Emulation.setFocusEmulationEnabled', { enabled: true })
  await sleep(800)

  // BootScreen: gesto de usuario REAL (Lección #6) — Input.dispatchMouseEvent.
  const skipRect = await evaluate(`(() => {
    const btn = document.querySelector('.boot-screen__skip, .boot-screen__ghost-btn, .boot-screen__option');
    const el = btn || document.body;
    const r = el.getBoundingClientRect();
    return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
  })()`)
  await send('Input.dispatchMouseEvent', { type: 'mousePressed', x: skipRect.x, y: skipRect.y, button: 'left', clickCount: 1 })
  await send('Input.dispatchMouseEvent', { type: 'mouseReleased', x: skipRect.x, y: skipRect.y, button: 'left', clickCount: 1 })
  await sleep(400)

  if (await evaluate(`!!document.querySelector('.boot-screen__option')`)) {
    const optRect = await evaluate(`(() => {
      const opts = document.querySelectorAll('.boot-screen__option');
      const el = opts[1] || opts[0];
      const r = el.getBoundingClientRect();
      return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
    })()`)
    await send('Input.dispatchMouseEvent', { type: 'mousePressed', x: optRect.x, y: optRect.y, button: 'left', clickCount: 1 })
    await send('Input.dispatchMouseEvent', { type: 'mouseReleased', x: optRect.x, y: optRect.y, button: 'left', clickCount: 1 })
    await sleep(400)
  }
  for (let i = 0; i < 6; i++) {
    if (!(await evaluate(`!!document.querySelector('.boot-screen')`))) break
    await sleep(400)
  }
  await sleep(300)

  // Salto directo a ch5 (capítulo posterior) dispara la cinemática ch2->ch3.
  if (await evaluate(`!!document.querySelector('.tick-button[data-chapter="5"]')`)) {
    await evaluate(`document.querySelector('.tick-button[data-chapter="5"]').click()`)
  }
  await sleep(600)
  for (let i = 0; i < 16; i++) {
    if (!(await evaluate(`!!document.querySelector('.ch2-cin-root, .dialup-scrim')`))) break
    await send('Input.dispatchKeyEvent', { type: 'keyDown', key: 'Escape', code: 'Escape' })
    await send('Input.dispatchKeyEvent', { type: 'keyUp', key: 'Escape', code: 'Escape' })
    await sleep(450)
  }
  await waitScrollStable(cx)

  let ready = false
  for (let i = 0; i < 12; i++) {
    ready = await evaluate(`!!document.querySelector('.ch5-stream-panel') && !!document.querySelector('.cine-screen')`)
    if (ready) break
    await sleep(300)
  }
  return ready
}

async function ensureLocale(cx, locale) {
  const { evaluate } = cx
  const current = await evaluate(`document.querySelector('.lang-active')?.textContent?.trim()`)
  if (current !== locale.toUpperCase()) {
    await evaluate(`document.querySelector('.lang-toggle')?.click()`)
    await sleep(200)
  }
}

const MEASURE = `
  window.__ch5Measure = function(vw, vh) {
    function rect(el) { const r = el.getBoundingClientRect(); return { x0: Math.round(r.left), y0: Math.round(r.top), x1: Math.round(r.right), y1: Math.round(r.bottom), w: Math.round(r.width), h: Math.round(r.height) }; }
    function intersects(a, b) { if (!a || !b) return false; return a.x0 < b.x1 && a.x1 > b.x0 && a.y0 < b.y1 && a.y1 > b.y0; }
    const section = document.querySelector('section[data-chapter="5"]');
    const panel = document.querySelector('.ch5-stream-panel');
    const screen = document.querySelector('.cine-screen');
    const scene = document.querySelector('.ch5-scene');
    const innerTextLen = (section ? section.innerText : '').length;
    const hasEmDash = /\\u2014/.test(section ? section.innerText : '');
    const panelRect = panel ? rect(panel) : null;
    const screenRect = screen ? rect(screen) : null;
    const sceneRect = scene ? rect(scene) : null;
    const feedItems = document.querySelectorAll('.ch5-feed-item').length;
    const seatsLive = document.querySelectorAll('.cine-char-live').length;
    const seatsFallback = document.querySelectorAll('.cine-char').length;
    const activeSlide = Array.from(document.querySelectorAll('.cine-screen-img')).findIndex((el) => el.classList.contains('is-active'));
    const firstLiveBgX = (() => {
      const el = document.querySelector('.cine-char-live');
      return el ? el.style.backgroundPositionX : null;
    })();
    return {
      innerTextLen, hasEmDash, panelRect, screenRect, sceneRect,
      panelOverlapsScreen: intersects(panelRect, screenRect),
      panelWidthPct: panelRect ? (panelRect.w / vw) * 100 : null,
      feedItems, seatsLive, seatsFallback, activeSlide, firstLiveBgX,
    };
  };
  'installed';
`

// Sampling de contraste real (Lección #3: Page.captureScreenshot, nunca
// canvas.toDataURL): este harness NO lee un canvas WebGL en vivo (el
// anti-patrón que documenta la Lección #3) — dibuja el PNG YA capturado por
// Page.captureScreenshot (que sí pasa por el compositor nativo) en un
// <canvas> oculto dentro de la propia página y lee el píxel con
// getImageData. Ver sampleContrastInBrowserAwait más abajo (usa
// Runtime.evaluate con awaitPromise:true porque dibuja una <img> async).
async function evaluateAwaitPromise(cx, expression) {
  const { send } = cx
  const res = await send('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true })
  if (res.exceptionDetails) throw new Error('Eval error: ' + JSON.stringify(res.exceptionDetails))
  return res.result.value
}

function relLuminance([r, g, b]) {
  const lin = (c) => {
    const cs = c / 255
    return cs <= 0.03928 ? cs / 12.92 : Math.pow((cs + 0.055) / 1.055, 2.4)
  }
  return 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b)
}

function parseRgb(str) {
  const m = str.match(/rgba?\(([\d.]+),\s*([\d.]+),\s*([\d.]+)/)
  if (!m) return null
  return [Number(m[1]), Number(m[2]), Number(m[3])]
}

function contrastRatio(rgbA, rgbB) {
  const la = relLuminance(rgbA) + 0.05
  const lb = relLuminance(rgbB) + 0.05
  return la > lb ? la / lb : lb / la
}

async function measureViewport(cx, url, name, w, h, dsf, mobile, locale, results) {
  const { send, evaluate } = cx
  await send('Emulation.setDeviceMetricsOverride', { width: w, height: h, deviceScaleFactor: dsf, mobile })
  await sleep(300)
  const ready = await bootAndJumpToCh5(cx, url)
  if (!ready) {
    console.log(`${name} [${locale}] => NO READY (ch5 nunca montó)`)
    results.push({ name, locale, ok: false, reason: 'not-ready' })
    return false
  }
  await ensureLocale(cx, locale)
  await evaluate(MEASURE)
  await sleep(200)

  const m0 = await evaluate(`window.__ch5Measure(${w}, ${h})`)
  let ok = true
  const problems = []

  if (!(m0.innerTextLen > 0)) { ok = false; problems.push(`innerText=0 (AC#1 roto)`) }
  if (m0.hasEmDash) { ok = false; problems.push(`em-dash detectado en innerText`) }
  if (m0.panelOverlapsScreen) { ok = false; problems.push(`panel solapa .cine-screen`) }
  if (!mobile && m0.panelWidthPct !== null && m0.panelWidthPct > 40) {
    ok = false
    problems.push(`panel ${m0.panelWidthPct.toFixed(1)}% del ancho (>40%)`)
  }
  if (m0.feedItems !== 8) { ok = false; problems.push(`feedItems=${m0.feedItems} (esperado 8)`) }

  // Progresión real en DOS instantes (Lección #2): esperar el ciclo completo
  // del slideshow (4.5s) + margen y volver a medir.
  await sleep(5000)
  const m1 = await evaluate(`window.__ch5Measure(${w}, ${h})`)
  const slideProgressed = m0.activeSlide !== m1.activeSlide
  const crowdProgressed = m0.firstLiveBgX !== m1.firstLiveBgX
  if (!slideProgressed) { ok = false; problems.push('slideshow NO avanzó entre t0 y t0+5s') }
  // crowdProgressed es best-effort: un personaje puede caer en 'rest' con el
  // MISMO frame en ambos instantes por azar — no lo volvemos bloqueante solo,
  // pero si NINGUNO avanza junto con el slide es señal real de rAF congelado.
  if (!slideProgressed && !crowdProgressed) { problems.push('multitud tampoco avanzó (posible rAF congelado)') }

  // Contraste real (peor caso, AC#6 >= 8.9:1)
  const screenshot = await send('Page.captureScreenshot', { format: 'png' })
  let contrastRatioMeasured = null
  try {
    const sample = await sampleContrastInBrowserAwait(cx, screenshot.data)
    if (sample.ok) {
      const bg = sample.bg
      const fg = parseRgb(sample.textColor)
      if (fg) {
        contrastRatioMeasured = contrastRatio(fg, bg)
        if (contrastRatioMeasured < 8.9) {
          ok = false
          problems.push(`contraste medido ${contrastRatioMeasured.toFixed(2)}:1 < 8.9:1`)
        }
      }
    }
  } catch (e) {
    problems.push(`contraste: no se pudo medir (${e.message})`)
  }

  console.log(
    `${name} [${locale}] innerText=${m0.innerTextLen} feedItems=${m0.feedItems} ` +
    `seats(live+fallback)=${m0.seatsLive + m0.seatsFallback} panelWidth%=${m0.panelWidthPct?.toFixed(1)} ` +
    `slideProgressed=${slideProgressed} crowdProgressed=${crowdProgressed} ` +
    `contrast=${contrastRatioMeasured ? contrastRatioMeasured.toFixed(2) + ':1' : 'n/a'} ` +
    `=> ${ok ? 'LIMPIO' : 'ROTO: ' + problems.join('; ')}`
  )
  results.push({ name, locale, ok, problems, m0, m1, contrastRatioMeasured })
  return ok
}

async function sampleContrastInBrowserAwait(cx, base64Png) {
  const script = `
    (async () => {
      const img = new Image();
      const src = 'data:image/png;base64,${base64Png}';
      await new Promise((resolve, reject) => { img.onload = resolve; img.onerror = reject; img.src = src; });
      const canvas = document.createElement('canvas');
      canvas.width = img.naturalWidth; canvas.height = img.naturalHeight;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0);
      const el = document.querySelector('.ch5-feed-text');
      if (!el) return { ok: false, reason: 'no .ch5-feed-text' };
      const r = el.getBoundingClientRect();
      const dsf = img.naturalWidth / window.innerWidth;
      const px = Math.max(0, Math.round((r.left + 4) * dsf));
      const py = Math.max(0, Math.round((r.top + r.height / 2) * dsf));
      const data = ctx.getImageData(px, py, 1, 1).data;
      const textColor = getComputedStyle(el).color;
      return { ok: true, bg: [data[0], data[1], data[2]], textColor };
    })()
  `
  return evaluateAwaitPromise(cx, script)
}

async function measureReducedMotion(cx, url, results) {
  const { send, evaluate } = cx
  await send('Emulation.setDeviceMetricsOverride', { width: 1440, height: 900, deviceScaleFactor: 1, mobile: false })
  await send('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-reduced-motion', value: 'reduce' }] })
  await sleep(200)
  const ready = await bootAndJumpToCh5(cx, url)
  if (!ready) {
    results.push({ name: 'PRM', ok: false, reason: 'not-ready' })
    console.log('PRM check => NO READY')
    return
  }
  await sleep(5200) // cubre un ciclo completo de scene-advance (4.5s)
  const glitchEverAdded = await evaluate(`!!document.querySelector('.cine-screen.is-glitch')`)
  const dotAnim = await evaluate(`getComputedStyle(document.querySelector('.cine-screen-dot')).animationName`)
  const ok = !glitchEverAdded && (dotAnim === 'none')
  console.log(`PRM check: is-glitch nunca visto=${!glitchEverAdded}, dot animation-name=${dotAnim} => ${ok ? 'LIMPIO' : 'ROTO'}`)
  results.push({ name: 'PRM', ok })
  await send('Emulation.setEmulatedMedia', { features: [] })
}

const VIEWPORTS = [
  ['1440x900-desktop', 1440, 900, 1, false],
  ['1366x768-desktop', 1366, 768, 1, false],
  ['390x844-mobile-portrait', 390, 844, 3, true],
  ['844x390-mobile-landscape', 844, 390, 3, true],
  ['800x420-landscape-corto', 800, 420, 1, false], // bajo el umbral max-height:480px
]

async function main() {
  const { cdpPort, url } = parseArgs(process.argv.slice(2))
  const cx = await connect(cdpPort, url)
  await cx.send('Page.enable')
  await cx.send('Runtime.enable')
  await cx.send('DOM.enable')
  await cx.send('Page.setWebLifecycleState', { state: 'active' })
  await cx.send('Emulation.setFocusEmulationEnabled', { enabled: true })

  const results = []
  let allClean = true
  for (const locale of ['es', 'en']) {
    for (const [name, w, h, dsf, mobile] of VIEWPORTS) {
      const clean = await measureViewport(cx, url, name, w, h, dsf, mobile, locale, results)
      if (!clean) allClean = false
    }
  }
  await measureReducedMotion(cx, url, results)
  if (!results.find((r) => r.name === 'PRM')?.ok) allClean = false

  const outPath = path.resolve(__dirname, '..', '.planning', 'ch5-verify-results.json')
  try {
    fs.writeFileSync(outPath, JSON.stringify(results, null, 2))
    console.log(`\nResultados detallados escritos en ${outPath}`)
  } catch {
    // best-effort — no bloquea el exit code
  }

  console.log(`\n=== RESULTADO: ${allClean ? 'todos los viewports/locale limpios + PRM limpio' : 'hay viewports rotos, ver detalle arriba'} ===`)
  cx.ws.close()
  process.exitCode = allClean ? 0 : 1
}

main().catch((e) => {
  console.error('FATAL', e && e.stack ? e.stack : String(e))
  process.exitCode = 1
})
