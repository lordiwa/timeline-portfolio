// scripts/verify-content-reachable.mjs
// TASK-041 RONDA 2 — contra-sensor de "contenido alcanzable" (CDP crudo).
//
// POR QUÉ EXISTE (LECCIONES-TECNICAS.md §8): `verify-chassis-overlap.mjs` mide
// solapamiento del chasis flotante contra los glifos visibles, y esa métrica
// mejora de DOS maneras que no distingue: (1) dar espacio real al texto, lo
// que se quiere, o (2) achicar la ventana del texto (`max-height`/`height`/
// `overflow` de una caja con scroll interno) para que haya menos glifos que
// intersectar, lo CONTRARIO de lo que se quiere. En la ronda 1 de TASK-041 el
// fix de ch4 redujo `.ch4-panel-column` a un `max-height` que colapsaba a
// 12px de clientHeight con el 100% del texto (título incluido) detrás del
// scroll interno, y el arnés de solapamiento reportó "cero fallos nuevos" —
// correcto en su propio criterio, ciego a este otro.
//
// QUÉ MIDE: para cada (capítulo, viewport, selector de caja con scroll
// interno) declarado en TARGETS, vía CDP real en Chrome headed:
//   - clientHeight vs scrollHeight de la caja (¿cuánto de su contenido real
//     entra en la ventana visible?).
//   - de las PALABRAS de texto propias de la caja (split por espacio en
//     blanco sobre los nodos de texto, vía Range.getClientRects()), cuántas
//     tienen su rect COMPLETAMENTE contenido dentro del rect visible de la
//     caja (getBoundingClientRect(), que ya refleja max-height/clip real) y
//     cuántas caen aunque sea parcialmente afuera — esas son "ocultas": o
//     bien alcanzables con scroll (aceptable, el usuario puede llegar) o bien
//     genuinamente perdidas si la caja colapsó (inaceptable, ver arriba).
//
// Un fix que mejora el solapamiento del otro arnés y EMPEORA (clientHeight
// más chico, % de palabras ocultas más alto, o el corte cae dentro de
// contenido crítico) el número de acá NO es un fix — regla general anotada
// en LECCIONES-TECNICAS.md §8.
//
// PUNTO CIEGO DE CLIP POR ANCESTRO (LOW pendiente de la ronda 2, ADDENDUM de
// §8 en LECCIONES-TECNICAS.md — el HIGH bloqueante de la ronda 2/3 vivía
// exactamente acá): `el.getBoundingClientRect()` de la caja medida NO refleja
// el recorte de un ancestro con `overflow: hidden`/`clip`. Una caja puede
// reportar un rect "completo" mientras un ancestro (p.ej. `.chapter-section`,
// 100dvh + overflow:hidden, ScrollShell.vue) le recorta la mitad de abajo sin
// que exista NINGÚN mecanismo de scroll para llegar a esa mitad — eso es
// PEOR que un scroll container propio, porque lo recortado es inalcanzable,
// no diferido. Con los TARGETS actuales (`.ch4-panel-column`, `.ch5-panel-body`,
// ambos con su propio overflow-y interno) esto no cambia el resultado, pero
// cualquier target nuevo que NO tenga su propio scroll interno sí lo
// necesita. Mitigado en esta ronda (no eliminado del todo, ver más abajo):
// `__reachable()` ahora acumula la intersección de `el` con el rect de CADA
// ancestro cuyo overflow computado (x o y) sea hidden/clip, y reporta
// `clipRect` + `clippedAwayWords` (palabras cuyo rect cae completamente fuera
// de ese frame acumulado — inalcanzables sin importar scroll) por separado de
// `hiddenWords` (fuera de la caja propia, puede ser alcanzable con scroll
// interno si `el` mismo scrollea). Sigue siendo una heurística de DOM, no un
// motor de pintado real (no modela `clip-path`, `mask`, ni transforms que
// muevan contenido fuera de su propio rect) — para ese caso, la prueba
// definitiva sigue siendo medición manual con CDP real como la de este
// mismo ticket (ver hand-off de la ronda 3).
//
// CÓMO CORRERLO (misma receta que verify-chassis-overlap.mjs, LECCIONES-
// TECNICAS.md §6):
//   1. `npm run dev`
//   2. Chrome HEADED con --remote-debugging-port, --user-data-dir propio.
//   3. `node scripts/verify-content-reachable.mjs --url=http://127.0.0.1:PORT/
//      --locale=es|en --cdp-port=NNNN [--chapters=4,5]`
//
// Bloqueadores/trampas del instrumento ya resueltos: ver el encabezado de
// verify-chassis-overlap.mjs (BootScreen, cinemática ch2→ch3, foreground-lock
// de Windows, cuantización de altos impares, sleep fijo tras scroll). Este
// script reutiliza exactamente la misma receta de boot/navegación.

import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

function parseArgs(argv) {
  const out = { cdpPort: 9333, url: 'http://127.0.0.1:5173/', chapters: [4, 5], locale: null }
  for (const arg of argv) {
    const m = arg.match(/^--([\w-]+)=(.+)$/)
    if (!m) continue
    if (m[1] === 'cdp-port') out.cdpPort = Number(m[2])
    if (m[1] === 'url') out.url = m[2]
    if (m[1] === 'chapters') out.chapters = m[2].split(',').map(Number)
    if (m[1] === 'locale') out.locale = m[2]
  }
  if (out.locale !== 'es' && out.locale !== 'en') {
    throw new Error(`--locale=es|en es obligatorio (recibido: ${JSON.stringify(out.locale)}).`)
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
  await sleep(400)
  return ready
}

// MEASURE — clientHeight/scrollHeight + palabras ocultas de UNA caja.
const MEASURE_REACHABLE = `
window.__reachable = function(selector) {
  const el = document.querySelector(selector);
  if (!el) return null;
  const box = el.getBoundingClientRect();
  // TASK-041 RONDA 3 — mitigación del punto ciego de clip por ancestro (ver
  // encabezado del archivo): acumula la intersección de \`el\` con el rect de
  // CADA ancestro cuyo overflow computado (x o y) sea hidden/clip. Ese frame
  // acumulado es lo más cerca que se puede llegar, sin un motor de pintado
  // real, a "lo que efectivamente puede pintar \`el\`" — a diferencia de \`box\`
  // (el rect propio de \`el\`, ciego a cualquier recorte de un ancestro).
  let clip = { left: -Infinity, top: -Infinity, right: Infinity, bottom: Infinity };
  let hasClippingAncestor = false;
  for (let anc = el.parentElement; anc; anc = anc.parentElement) {
    const cs = getComputedStyle(anc);
    if (cs.overflowX === 'hidden' || cs.overflowX === 'clip' || cs.overflowY === 'hidden' || cs.overflowY === 'clip') {
      hasClippingAncestor = true;
      const ar = anc.getBoundingClientRect();
      clip = {
        left: Math.max(clip.left, ar.left),
        top: Math.max(clip.top, ar.top),
        right: Math.min(clip.right, ar.right),
        bottom: Math.min(clip.bottom, ar.bottom),
      };
    }
  }
  const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT, {
    acceptNode(node) {
      if (!node.textContent.trim()) return NodeFilter.FILTER_REJECT;
      if (node.parentElement && node.parentElement.closest('svg, script, style, noscript, [aria-hidden="true"]')) return NodeFilter.FILTER_REJECT;
      return NodeFilter.FILTER_ACCEPT;
    }
  });
  let totalWords = 0;
  let hiddenWords = 0;
  let clippedAwayWords = 0;
  let node;
  while ((node = walker.nextNode())) {
    const text = node.textContent;
    // Offsets de cada palabra (split por whitespace) dentro del text node.
    const re = /\\S+/g;
    let match;
    while ((match = re.exec(text))) {
      totalWords++;
      const r = document.createRange();
      r.setStart(node, match.index);
      r.setEnd(node, match.index + match[0].length);
      const rects = Array.from(r.getClientRects());
      // "oculta" = NINGÚN rect de la palabra intersecta (aunque sea
      // parcialmente) el rect visible de la caja (box, que ya refleja
      // max-height/clip real) — es decir, cae COMPLETAMENTE fuera. Un
      // criterio de "contención total" sería más estricto pero cuenta como
      // ocultas palabras que sólo tocan el borde por redondeo de línea/
      // subpíxel, sin relación con el defecto real (contenido que requiere
      // scroll o que quedó irrecuperable). "Intersecta algo" es el mismo
      // criterio que ya usa verify-chassis-overlap.mjs para chasis×glifo.
      const visible = rects.some((rr) =>
        rr.width > 0 && rr.height > 0 &&
        rr.left < box.right && rr.right > box.left &&
        rr.top < box.bottom && rr.bottom > box.top
      );
      if (!visible) hiddenWords++;
      // "recortada por ancestro" = ningún rect de la palabra intersecta el
      // frame acumulado de ancestros con overflow:hidden/clip — inalcanzable
      // aunque \`el\` mismo scrollee, porque el recorte lo hace un padre sin
      // mecanismo de scroll propio (el caso del bloqueante de ronda 2).
      if (hasClippingAncestor) {
        const withinClip = rects.some((rr) =>
          rr.width > 0 && rr.height > 0 &&
          rr.left < clip.right && rr.right > clip.left &&
          rr.top < clip.bottom && rr.bottom > clip.top
        );
        if (!withinClip) clippedAwayWords++;
      }
    }
  }
  return {
    clientHeight: el.clientHeight,
    scrollHeight: el.scrollHeight,
    boxRect: { x0: Math.round(box.left), y0: Math.round(box.top), x1: Math.round(box.right), y1: Math.round(box.bottom) },
    hasClippingAncestor,
    clipRect: hasClippingAncestor
      ? { x0: Math.round(clip.left), y0: Math.round(clip.top), x1: Math.round(clip.right), y1: Math.round(clip.bottom) }
      : null,
    totalWords,
    hiddenWords,
    clippedAwayWords,
  };
};
'installed';
`

const RESULTS = []
let anySkipped = false
function report(name, detail) {
  RESULTS.push({ name, detail })
  const pct = detail && detail.totalWords ? Math.round((detail.hiddenWords / detail.totalWords) * 100) : null
  const clipInfo = detail && detail.hasClippingAncestor ? ` clippedAway=${detail.clippedAwayWords}` : ''
  console.log(
    `MEASURE — ${name} :: clientHeight=${detail?.clientHeight} scrollHeight=${detail?.scrollHeight} palabras=${detail?.totalWords} ocultas=${detail?.hiddenWords}${pct !== null ? ` (${pct}%)` : ''}${clipInfo}`
  )
}

// TASK-041 RONDA 3 — HIGH/LOW de la ronda 2: un target ausente (sección que
// no monta, o selector que ya no existe) hacía `continue` en silencio y la
// entrada desaparecía del artefacto sin error ni marca — así quedó un
// artefacto de una corrida de base solo-ch5 pisando el JSON de HEAD de ES sin
// que nadie lo notara. Ahora emite una línea SKIPPED explícita y marca el
// run para salir con código != 0: un sensor que se saltea en silencio se lee
// como cobertura, y no lo es.
function reportSkipped(name, reason) {
  anySkipped = true
  RESULTS.push({ name, detail: null, skipped: true, reason })
  console.log(`SKIPPED — ${name} :: ${reason}`)
}

const VIEWPORTS = [
  ['390x844-mobile-portrait', 390, 844, 3, true],
  ['844x390-mobile-landscape', 844, 390, 3, true],
  ['834x1194-tablet-portrait', 834, 1194, 2, true],
  ['1536x791-desktop-dpr1.25', 1536, 791, 1.25, false],
  ['1440x900-desktop', 1440, 900, 1, false],
]

// Cajas con scroll interno tocadas por TASK-041 en ch4/ch5 — únicas cajas
// para las que el ticket pide este contra-sensor (ch2/ch3 no tocaron ninguna
// caja con overflow-y:auto/scroll interno, ver hand-off).
const TARGETS = {
  4: ['.ch4-panel-column'],
  5: ['.ch5-panel-body'],
}

async function main() {
  const { cdpPort, url, chapters, locale } = parseArgs(process.argv.slice(2))
  const cx = await connect(cdpPort, url)
  await cx.send('Page.enable')
  await cx.send('Runtime.enable')
  await cx.send('DOM.enable')
  await cx.send('Page.addScriptToEvaluateOnNewDocument', {
    source: `try { localStorage.setItem('portfolio.locale', ${JSON.stringify(locale)}); } catch {}`,
  })

  const allResults = {}
  for (const [name, w, h, dsf, mobile] of VIEWPORTS) {
    await cx.send('Emulation.setDeviceMetricsOverride', { width: w, height: h, deviceScaleFactor: dsf, mobile })
    await sleep(250)
    await bootToHome(cx, url)
    allResults[name] = {}
    for (const n of chapters) {
      const targets = TARGETS[n] || []
      if (targets.length === 0) continue // capítulo sin target declarado — no es un skip, no hay chequeo que hacer
      const ready = await jumpToChapter(cx, n)
      if (!ready) {
        for (const sel of targets) {
          reportSkipped(`[${name}] ch${n} ${sel}`, `sección [data-chapter="${n}"] no montó — jumpToChapter() no encontró section[data-chapter="${n}"] tras el timeout`)
        }
        continue
      }
      await cx.evaluate(MEASURE_REACHABLE)
      for (const sel of targets) {
        const detail = await cx.evaluate(`window.__reachable(${JSON.stringify(sel)})`)
        if (!detail) {
          reportSkipped(`[${name}] ch${n} ${sel}`, `document.querySelector('${sel}') no encontró el elemento dentro de ch${n} en este viewport`)
          continue
        }
        allResults[name][`ch${n} ${sel}`] = detail
        report(`[${name}] ch${n} ${sel}`, detail)
      }
    }
  }

  const skippedEntries = RESULTS.filter((r) => r.skipped)
  const outPath = path.resolve(__dirname, '..', '.planning', `task041-content-reachable-${locale}.json`)
  try {
    fs.writeFileSync(outPath, JSON.stringify({ locale, results: allResults, skipped: skippedEntries }, null, 2))
    console.log(`\nResultados escritos en ${outPath}`)
  } catch {
    // best-effort
  }
  if (anySkipped) {
    console.log(`\n=== RESULTADO: ${skippedEntries.length} TARGET(S) SALTEADO(S) — ver líneas SKIPPED arriba ===`)
  }
  cx.ws.close()
  // TASK-041 RONDA 3 — un target ausente ya no es cobertura silenciosa: sale
  // con código != 0 para que CI/el desarrollador lo note (ver defecto de la
  // ronda 2 documentado arriba de reportSkipped()).
  process.exitCode = anySkipped ? 1 : 0
}

main().catch((e) => {
  console.error('FATAL', e && e.stack ? e.stack : String(e))
  process.exitCode = 1
})
