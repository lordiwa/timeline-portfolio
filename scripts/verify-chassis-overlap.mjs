// scripts/verify-chassis-overlap.mjs
// TASK-019 — harness de verificación geométrica real (CDP crudo) para el
// solapamiento de los elementos flotantes del chasis (StickyTimeline,
// ContactHUD, SoundToggle, LangToggle, GlobalMantra, StickyAvatar, SkipLink)
// sobre el contenido de texto de los 7 capítulos.
//
// POR QUÉ EXISTE: jsdom no hace layout (LECCIONES-TECNICAS.md §2) — un verde
// de Vitest no prueba que un icono fijo no tape un párrafo. La prueba es
// geométrica en Chrome real: getBoundingClientRect() de cada elemento
// flotante del chasis, intersectado contra getBoundingClientRect() de cada
// caja de texto visible dentro de cada <section data-chapter>.
//
// QUÉ MIDE, por viewport:
//   Para cada uno de los 7 capítulos:
//     - rects de los 7 elementos flotantes del chasis (los 5 nombrados por el
//       ticket + StickyAvatar + SkipLink, enumerados en vez de asumidos).
//     - rects de TODAS las cajas de texto visibles dentro de la section
//       (heurística: elementos cuyo firstChild es un text node no vacío tras
//       trim, offsetParent !== null, no aria-hidden, no dentro de <svg>/<script>/
//       <style>, y con área > 0). Esto cubre título, bio, flavor, HUD diegético,
//       tarjetas de proyecto, etc. de CUALQUIER capítulo sin necesitar
//       conocer su markup específico (systemic, no per-chapter).
//     - intersección chasis×texto → si hay alguna, FAIL para ese
//       (capítulo, viewport, elemento-chasis).
//   AC4 (landscape): título del capítulo (h1, o el primer heading real de la
//     sección) legible completo — ningún carácter de su rect queda cubierto
//     por StickyTimeline (chequeo específico, no solo genérico).
//
// Exit code 0 si limpio; 1 si algún viewport/capítulo tiene solapamiento.
//
// CÓMO CORRERLO (receta completa .planning/LECCIONES-TECNICAS.md §6):
//   1. `npm run dev` (deja el server en :5173 o el siguiente puerto libre).
//   2. Chrome HEADED con --remote-debugging-port=9333 (headless degrada
//      compositor/backdrop-filter y además ignora --window-size chico).
//   3. `node scripts/verify-chassis-overlap.mjs --url=http://127.0.0.1:PORT/`
//      (opcional: --cdp-port=NNNN --chapters=0,1,2,3,4,5,6)
//
// Bloqueadores ya resueltos, no los redescubras: BootScreen exige
// Input.dispatchMouseEvent real; la cinemática ch2→ch3 (~5.9s) se saltea con
// Escape; con muchas ventanas de Chrome, Page.setWebLifecycleState +
// Emulation.setFocusEmulationEnabled fuerzan foco; setDeviceMetricsOverride
// cuantiza altos impares hacia arriba (viewports de abajo usan altos pares
// salvo los que el propio ticket pide en impar, ver comentario en VIEWPORTS);
// nunca sleep fijo tras un salto de scroll — se espera a que scrollTop se
// estabilice.

import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

function parseArgs(argv) {
  const out = { cdpPort: 9333, url: 'http://127.0.0.1:5173/', chapters: [0, 1, 2, 3, 4, 5, 6] }
  for (const arg of argv) {
    const m = arg.match(/^--([\w-]+)=(.+)$/)
    if (!m) continue
    if (m[1] === 'cdp-port') out.cdpPort = Number(m[2])
    if (m[1] === 'url') out.url = m[2]
    if (m[1] === 'chapters') out.chapters = m[2].split(',').map(Number)
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

async function bootToHome(cx, url) {
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
}

async function skipCinematicIfAny(cx) {
  const { evaluate, send } = cx
  for (let i = 0; i < 16; i++) {
    if (!(await evaluate(`!!document.querySelector('.ch2-cin-root, .dialup-scrim')`))) break
    await send('Input.dispatchKeyEvent', { type: 'keyDown', key: 'Escape', code: 'Escape' })
    await send('Input.dispatchKeyEvent', { type: 'keyUp', key: 'Escape', code: 'Escape' })
    await sleep(450)
  }
}

async function jumpToChapter(cx, n) {
  const { evaluate } = cx
  if (await evaluate(`!!document.querySelector('.tick-button[data-chapter="${n}"]')`)) {
    await evaluate(`document.querySelector('.tick-button[data-chapter="${n}"]').click()`)
  }
  await sleep(500)
  await skipCinematicIfAny(cx)
  await waitScrollStable(cx)
  let ready = false
  for (let i = 0; i < 12; i++) {
    ready = await evaluate(`!!document.querySelector('section[data-chapter="${n}"]')`)
    if (ready) break
    await sleep(250)
  }
  // margen extra para que animaciones de entrada (stagger 240ms max) asienten
  await sleep(400)
  return ready
}

// MEASURE_CORE — instalado una vez por navegación.
const MEASURE_CORE = `
window.__rect = function(el) {
  const r = el.getBoundingClientRect();
  return { x0: Math.round(r.left), y0: Math.round(r.top), x1: Math.round(r.right), y1: Math.round(r.bottom), w: Math.round(r.width), h: Math.round(r.height) };
};
window.__intersects = function(a, b) {
  if (!a || !b) return false;
  return a.x0 < b.x1 && a.x1 > b.x0 && a.y0 < b.y1 && a.y1 > b.y0;
};
// Los 7 candidatos "flotantes del chasis" enumerados (ticket: "no asumas que
// son tres, puede haber más" — StickyAvatar y SkipLink se miden también).
window.__CHASSIS_SELECTORS = {
  timeline: '.sticky-timeline',
  contactHud: '.contact-hud',
  soundToggle: '.sound-toggle',
  langToggle: '.lang-toggle',
  globalMantra: '.global-mantra',
  stickyAvatar: '.sticky-avatar',
  skipLink: '.skip-link',
};
window.__chassisRects = function() {
  const out = {};
  for (const [key, sel] of Object.entries(window.__CHASSIS_SELECTORS)) {
    const el = document.querySelector(sel);
    if (!el) { out[key] = null; continue; }
    // skip-link: invisible tras el primer scroll (opacity 0, pointer-events
    // none) — no cuenta como "flotante activo" en ese estado, coherente con
    // lo que un usuario real ve.
    if (key === 'skipLink') {
      const cs = getComputedStyle(el);
      if (cs.opacity === '0' || cs.pointerEvents === 'none') { out[key] = null; continue; }
    }
    out[key] = window.__rect(el);
  }
  return out;
};
// Cajas de texto visibles dentro de una section: heurística genérica —
// cualquier elemento con texto propio no vacío (ownText, no de descendientes),
// visible (offsetParent !== null O position:fixed con área>0), fuera de
// <svg>/<script>/<style>/[aria-hidden="true"].
window.__textBoxesInSection = function(sectionSelector) {
  const section = document.querySelector(sectionSelector);
  if (!section) return [];
  const all = section.querySelectorAll('*');
  const boxes = [];
  for (const el of all) {
    if (el.closest('svg, script, style, noscript')) continue;
    if (el.getAttribute('aria-hidden') === 'true') continue;
    if (el.closest('[aria-hidden="true"]')) continue;
    const cs = getComputedStyle(el);
    if (cs.display === 'none' || cs.visibility === 'hidden' || cs.opacity === '0') continue;
    // ownText: concatenar solo los child nodes de tipo texto directos
    let ownText = '';
    for (const child of el.childNodes) {
      if (child.nodeType === 3) ownText += child.textContent;
    }
    ownText = ownText.trim();
    if (!ownText) continue;
    if (el.offsetParent === null && cs.position !== 'fixed') continue;
    const r = el.getBoundingClientRect();
    if (r.width <= 0 || r.height <= 0) continue;
    boxes.push({ tag: el.tagName, cls: (el.className && el.className.baseVal) || el.className || '', text: ownText.slice(0, 60), rect: window.__rect(el) });
  }
  return boxes;
};
window.__titleRect = function(sectionSelector) {
  const section = document.querySelector(sectionSelector);
  if (!section) return null;
  const h = section.querySelector('h1, h2, [class*="title"]');
  return h ? window.__rect(h) : null;
};
'installed';
`

const RESULTS = []
function report(name, ok, detail) {
  RESULTS.push({ name, ok, detail })
  console.log(`${ok ? 'PASS' : 'FAIL'} — ${name}${detail ? ' :: ' + detail : ''}`)
  return ok
}

async function measureChapterAtViewport(cx, viewportName, chapterN) {
  const { evaluate } = cx
  const ready = await jumpToChapter(cx, chapterN)
  if (!ready) {
    report(`[${viewportName}] ch${chapterN} sección monta`, false, 'section no encontrada')
    return
  }
  await evaluate(MEASURE_CORE)
  const chassis = await evaluate(`window.__chassisRects()`)
  const textBoxes = await evaluate(`window.__textBoxesInSection('section[data-chapter="${chapterN}"]')`)
  const titleRect = await evaluate(`window.__titleRect('section[data-chapter="${chapterN}"]')`)

  const offenders = []
  for (const [chassisKey, chassisRect] of Object.entries(chassis)) {
    if (!chassisRect) continue
    for (const box of textBoxes) {
      const a = chassisRect
      const b = box.rect
      const intersects = a.x0 < b.x1 && a.x1 > b.x0 && a.y0 < b.y1 && a.y1 > b.y0
      if (intersects) {
        offenders.push({ chassisKey, chassisRect, box })
      }
    }
  }

  const ok = offenders.length === 0
  report(
    `[${viewportName}] ch${chapterN} — ningún elemento flotante del chasis intersecta texto de contenido`,
    ok,
    ok ? `chassisFound=${Object.entries(chassis).filter(([, v]) => v).map(([k]) => k).join(',')}` : JSON.stringify(offenders.slice(0, 8))
  )

  // AC4 — título legible completo (chequeo específico contra StickyTimeline).
  if (titleRect && chassis.timeline) {
    const t = titleRect
    const tl = chassis.timeline
    const titleIntersects = tl.x0 < t.x1 && tl.x1 > t.x0 && tl.y0 < t.y1 && tl.y1 > t.y0
    report(
      `[${viewportName}] ch${chapterN} — título NO tapado por StickyTimeline`,
      !titleIntersects,
      JSON.stringify({ titleRect: t, timelineRect: tl })
    )
  }

  return { chassis, textBoxes: textBoxes.length, offenders, titleRect }
}

// Viewports del ticket:
//  - mobile portrait 390x844 (AC1)
//  - mobile landscape 844x390 (AC1 + AC4)
//  - tablet portrait — SIN medición previa (AC3). 834x1194 es el tamaño lógico
//    de iPad Air/Pro portrait (Apple HIG), el más representativo de "tablet
//    portrait" real; se usa un alto PAR (1194) por la cuantización de altos
//    impares de setDeviceMetricsOverride (Lección técnica §6).
//  - desktop 1536x791 dpr1.25 (AC5, viewport real de Rafael)
//  - desktop 1440x900 dpr1 (AC5)
const VIEWPORTS = [
  ['390x844-mobile-portrait', 390, 844, 3, true],
  ['844x390-mobile-landscape', 844, 390, 3, true],
  ['834x1194-tablet-portrait', 834, 1194, 2, true],
  ['1536x791-desktop-dpr1.25', 1536, 791, 1.25, false],
  ['1440x900-desktop', 1440, 900, 1, false],
]

async function main() {
  const { cdpPort, url, chapters } = parseArgs(process.argv.slice(2))
  const cx = await connect(cdpPort, url)
  await cx.send('Page.enable')
  await cx.send('Runtime.enable')
  await cx.send('DOM.enable')

  const allResults = {}
  for (const [name, w, h, dsf, mobile] of VIEWPORTS) {
    await cx.send('Emulation.setDeviceMetricsOverride', { width: w, height: h, deviceScaleFactor: dsf, mobile })
    await sleep(250)
    await bootToHome(cx, url)
    allResults[name] = {}
    for (const n of chapters) {
      allResults[name][n] = await measureChapterAtViewport(cx, name, n)
    }
  }

  const allClean = RESULTS.every((r) => r.ok)
  const outPath = path.resolve(__dirname, '..', '.planning', 'task019-chassis-verify-results.json')
  try {
    fs.writeFileSync(outPath, JSON.stringify({ summary: RESULTS, detail: allResults }, null, 2))
    console.log(`\nResultados detallados escritos en ${outPath}`)
  } catch {
    // best-effort
  }
  console.log(`\n=== RESULTADO: ${allClean ? 'TODO LIMPIO' : 'HAY SOLAPAMIENTOS'} (${RESULTS.filter((r) => r.ok).length}/${RESULTS.length}) ===`)
  cx.ws.close()
  process.exitCode = allClean ? 0 : 1
}

main().catch((e) => {
  console.error('FATAL', e && e.stack ? e.stack : String(e))
  process.exitCode = 1
})
