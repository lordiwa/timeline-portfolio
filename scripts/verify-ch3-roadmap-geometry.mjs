// scripts/verify-ch3-roadmap-geometry.mjs
// TASK-024 — harness de verificación geométrica real para el stepper de
// ch3 (Ch3Roadmap.vue) contra el contenido de ch3 (Chapter3Content.vue),
// committeado a pedido explícito del reviewer en la ronda 3 ("el reviewer
// no pudo auditar tus puntos ciegos porque el instrumento no está en el
// repo... si commitearlo es barato, hacelo").
//
// POR QUÉ EXISTE: jsdom no hace layout (.planning/LECCIONES-TECNICAS.md
// §2) y tampoco evalúa @media (confirmado con un sandbox real durante la
// ronda 3: getComputedStyle nunca resuelve una regla dentro de un @media
// aunque se fuerce window.innerHeight/matchMedia). La única prueba real de
// que el stepper no tapa ni recorta contenido, en un viewport dado, es
// geométrica en un navegador real. Este script es esa prueba, hecha
// reproducible en vez de vivir sólo en la sesión que la corrió.
//
// QUÉ MIDE, por cada viewport:
//   - Los 8 pasos del roadmap en su estado COLAPSADO: ¿algún elemento de
//     texto/botón real del slide activo intersecta el rect del rail?
//     ¿tiene su borde inferior por debajo del alto real del viewport, o su
//     borde superior por encima de 0?
//   - RONDA 5: los 4 beats CON expansor (I-IV), en su estado EXPANDIDO
//     ("Seguir leyendo" clickeado) — el HIGH de la ronda 5 fue exactamente
//     que nadie clickeaba el expansor, así que el recorte del estado
//     expandido (altura fija por la reserva + `overflow:clip` sin scroll
//     interno = inalcanzable) pasaba desapercibido en 4 rondas de barrido.
//   - RONDA 5: en AMBOS locales (ES/EN) — con perfil fresco Chrome puede
//     arrancar en `en-US` (texto corto); ES es más largo y es el caso que
//     de verdad prueba los umbrales de wrap. Un solo locale esconde
//     defecto según la máquina/perfil que corra el script.
// "Recortado/inalcanzable" en `.ch3-scene` (`overflow:clip`, sin scroll
// interno) — no sólo tapado.
//
// CÓMO CORRERLO (Windows/PowerShell, receta completa en
// .planning/LECCIONES-TECNICAS.md §6):
//   1. `npm run dev` en una terminal (deja el server en :5173).
//   2. Levantar Chrome HEADED (no headless — headless degrada compositor/
//      layout) con remote debugging, ej.:
//      & "C:\Program Files\Google\Chrome\Application\chrome.exe" `
//        --remote-debugging-port=9333 `
//        --user-data-dir="$env:TEMP\ch3-verify-profile" `
//        --no-first-run --no-default-browser-check `
//        "http://127.0.0.1:5173/"
//   3. `node scripts/verify-ch3-roadmap-geometry.mjs`
//      (opcional: pasar --cdp-port=NNNN si no es 9333, --url=http://... si
//      el dev server no está en localhost:5173)
//
// Bloqueadores ya resueltos (no los redescubras): BootScreen exige un
// gesto de usuario REAL — Input.dispatchMouseEvent, no un .click() de JS,
// porque ctx.resume() no responde a un evento sintético no confiable. La
// cinemática ch2→ch3 (~5.9s) se saltea con Escape. Con muchas ventanas de
// Chrome abiertas, Windows puede negar el foco real: Page.setWebLifecycleState
// + Emulation.setFocusEmulationEnabled lo fuerzan sin depender del z-order.
//
// LOW (ronda 5, corregidos): `connect()` ahora elige el target por URL, no
// el primer target `page` de la lista (que puede ser una pestaña ajena —
// ej. "Chrome Web Store Payments" — si el perfil de Chrome tiene otras
// pestañas abiertas). `clipped` ahora también mira el borde superior
// (`y0 < 0`), no sólo el inferior.
//
// Exit code 0 si TODOS los viewports quedan limpios (8 pasos colapsados +
// 4 beats expandidos, en ES y EN); 1 si algo falla (imprime el detalle).

import fs from 'node:fs'

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
  // LOW (ronda 5): elegir por URL, no "el primer target page" — con otras
  // pestañas abiertas en el mismo perfil de Chrome, el primer target puede
  // ser una pestaña ajena (ej. "Chrome Web Store Payments") y el script la
  // secuestraría navegándola. Se autocorrige en la práctica (el próximo
  // Page.navigate la lleva al dev server), pero no hay motivo para tocar
  // una pestaña que no es la nuestra.
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

async function bootAndSkipToCh3(cx, url) {
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

  if (await evaluate(`!!document.querySelector('.tick-button[data-chapter="3"]')`)) {
    await evaluate(`document.querySelector('.tick-button[data-chapter="3"]').click()`)
  }
  await sleep(600)
  for (let i = 0; i < 16; i++) {
    if (!(await evaluate(`!!document.querySelector('.ch2-cin-root, .dialup-scrim')`))) break
    await send('Input.dispatchKeyEvent', { type: 'keyDown', key: 'Escape', code: 'Escape' })
    await send('Input.dispatchKeyEvent', { type: 'keyUp', key: 'Escape', code: 'Escape' })
    await sleep(450)
  }

  let ready = false
  for (let i = 0; i < 12; i++) {
    ready = await evaluate(`!!document.querySelector('.ch3-roadmap') && !!document.querySelector('.ch3-stage')`)
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

async function clickStep(cx, step) {
  const { send, evaluate } = cx
  await evaluate(`document.querySelectorAll('.ch3-roadmap-dot')[${step}].click()`)
  await sleep(250)
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

const MEASURE_ALL = `
  window.__ch3Measure = function(step, vpHeight) {
    function rect(el) { const r = el.getBoundingClientRect(); return { x0: Math.round(r.left), y0: Math.round(r.top), x1: Math.round(r.right), y1: Math.round(r.bottom) }; }
    function intersects(a, b) { if (!a || !b) return false; return a.x0 < b.x1 && a.x1 > b.x0 && a.y0 < b.y1 && a.y1 > b.y0; }
    // LOW (ronda 5): clipped ahora mira los DOS bordes (y1 > vh Y y0 < 0),
    // no sólo el inferior — con align-items:flex-start el caso real medido
    // siempre fue el inferior, pero era un supuesto no verificado.
    function clipped(r) { return r.y1 > vpHeight + 1 || r.y0 < -1; }
    const roadmapEl = document.querySelector('.ch3-roadmap');
    const roadmapRect = roadmapEl ? rect(roadmapEl) : null;
    let container = null, targets = [];
    if (step === 0) {
      container = document.querySelector('.ch3-act1-decor');
      targets = [['title', document.querySelector('.ch3-act1-title')], ['flash-stage', document.querySelector('.ch3-flash-stage')]];
    } else {
      const slides = Array.from(document.querySelectorAll('.ch3-slide'));
      let best = null, bestOp = -1;
      for (const s of slides) { const op = parseFloat(getComputedStyle(s).opacity || '0'); if (op > bestOp) { bestOp = op; best = s; } }
      container = best;
      const texts = Array.from((best || document.createElement('div')).querySelectorAll('h1,h2,h3,p,button,a'))
        .filter((e) => { const r = e.getBoundingClientRect(); return r.width > 0 && r.height > 0; });
      targets = texts.map((e, i) => ['el' + i + '-' + e.tagName.toLowerCase(), e]);
    }
    const results = targets.map(([label, el]) => {
      if (!el) return { label, rect: null, overlap: false, clipped: false };
      const r = rect(el);
      return { label, rect: r, overlap: intersects(r, roadmapRect), clipped: clipped(r) };
    });
    return { step, anyOverlap: results.some((r) => r.overlap), anyClipped: results.some((r) => r.clipped), bad: results.filter((r) => r.overlap || r.clipped).map((r) => r.label) };
  };
  window.__ch3MeasureExpanded = function(beatIndex, vpHeight) {
    function rect(el) { const r = el.getBoundingClientRect(); return { x0: Math.round(r.left), y0: Math.round(r.top), x1: Math.round(r.right), y1: Math.round(r.bottom) }; }
    function intersects(a, b) { if (!a || !b) return false; return a.x0 < b.x1 && a.x1 > b.x0 && a.y0 < b.y1 && a.y1 > b.y0; }
    function clipped(r) { return r.y1 > vpHeight + 1 || r.y0 < -1; }
    const roadmapEl = document.querySelector('.ch3-roadmap');
    const roadmapRect = roadmapEl ? rect(roadmapEl) : null;
    const slides = Array.from(document.querySelectorAll('.ch3-slide'));
    let best = null, bestOp = -1;
    for (const s of slides) { const op = parseFloat(getComputedStyle(s).opacity || '0'); if (op > bestOp) { bestOp = op; best = s; } }
    if (!best) return { beatIndex, ok: false, reason: 'no active slide' };
    const article = best.querySelector('.ch3-beat');
    const restOpen = best.querySelector('.ch3-beat-rest.is-open');
    if (!article || !restOpen) return { beatIndex, ok: false, reason: 'expander no abrió' };
    const r = rect(article);
    return {
      beatIndex, ok: true, rect: r,
      overlap: intersects(r, roadmapRect),
      clipped: clipped(r),
    };
  };
  'installed';
`

async function measureViewport(cx, url, name, w, h, dsf, mobile, locale) {
  const { send, evaluate } = cx
  await send('Emulation.setDeviceMetricsOverride', { width: w, height: h, deviceScaleFactor: dsf, mobile })
  await sleep(300)
  const ready = await bootAndSkipToCh3(cx, url)
  if (!ready) {
    console.log(`${name} [${locale}] => NO READY (ch3/roadmap nunca montaron)`)
    return false
  }
  await ensureLocale(cx, locale)
  await evaluate(MEASURE_ALL)
  let vpClean = true

  for (let i = 0; i < 8; i++) {
    await clickStep(cx, i)
    const m = await evaluate(`window.__ch3Measure(${i}, ${h})`)
    if (m.anyOverlap || m.anyClipped) {
      vpClean = false
      console.log(`${name} [${locale}] step ${i} (colapsado) ROTO:`, JSON.stringify(m.bad))
    }
  }

  // RONDA 5: los 4 beats con expansor (I-IV = índices 0-3, pasos 2-5) en
  // su estado EXPANDIDO — el punto ciego que dejó pasar el HIGH de esta
  // ronda.
  for (let b = 0; b < 4; b++) {
    await clickStep(cx, b + 2)
    const clicked = await evaluate(`
      (() => {
        const slides = Array.from(document.querySelectorAll('.ch3-slide'));
        let best = null, bestOp = -1;
        for (const s of slides) { const op = parseFloat(getComputedStyle(s).opacity || '0'); if (op > bestOp) { bestOp = op; best = s; } }
        const btn = best ? best.querySelector('.ch3-beat-more') : null;
        if (btn) { btn.click(); return true; }
        return false;
      })()
    `)
    if (!clicked) {
      // TASK-024 ronda 6 (MEDIUM #2 de review): un `continue` silencioso acá
      // reintroduce el mismo punto ciego de 4 rondas que este harness vino a
      // cerrar — el expansor "Seguir leyendo" DEBE existir en los índices
      // 0-3 (siempre lo tienen, ver Chapter3Content.vue) y si el click no lo
      // encuentra, el viewport queda SIN medir pero el script seguía
      // reportando exit 0. Ahora es un FALLO duro, no un salto silencioso.
      vpClean = false
      console.log(`${name} [${locale}] beat${b} expansor NO encontrado — FALLO SILENCIOSO EVITADO (ver ronda 6 de review)`)
      continue
    }
    await sleep(400) // transition grid-template-rows 0.35s
    const m = await evaluate(`window.__ch3MeasureExpanded(${b}, ${h})`)
    if (!m.ok) {
      vpClean = false
      console.log(`${name} [${locale}] beat${b} expandido ROTO: ${m.reason}`)
      continue
    }
    if (m.overlap || m.clipped) {
      vpClean = false
      console.log(`${name} [${locale}] beat${b} expandido ROTO:`, JSON.stringify(m.rect))
    }
  }

  console.log(`${name} [${locale}] => ${vpClean ? 'LIMPIO (8 pasos + 4 beats expandidos)' : 'ROTO'}`)
  return vpClean
}

// Los 6 viewports de prueba estándar del proyecto (TASK-019/021/024) más
// las fronteras conocidas de los TRES umbrales de ch3 (ronda 4: reserva
// 767px, compactación Acto 1 735px, compactación Acto 2 525px — ver
// Chapter3Content.vue).
//
// RONDA 5 (MEDIUM del review): agregadas 800x530 y 768x530 — el lado
// RESERVA-SOLA de la frontera del Acto 2 (525px es el umbral de
// compactación; 520/525 sólo probaban el lado CON compactación, nunca el
// lado sin ella que depende de que 525 sea el número correcto). 768px de
// ancho también se agrega explícito: el layout en fila de los beats rige
// desde 768px (no 800px como se asumió en la ronda 4) — 768-799 es más
// angosto y wrapea más, así que 768 es el peor caso real, no 800.
const DEFAULT_VIEWPORTS = [
  ['1440x900', 1440, 900, 1, false],
  ['1366x768', 1366, 768, 1, false],
  ['1536x791dpr1.25', 1536, 791, 1.25, false],
  ['768x1024-tablet', 768, 1024, 2, true],
  ['390x844-mobile-portrait', 390, 844, 3, true],
  ['844x390-mobile-landscape', 844, 390, 3, true],
  ['1366x660-caso-original-BLOCK', 1366, 660, 1, false],
  ['1280x700-caso-original-BLOCK', 1280, 700, 1, false],
  ['1280x730-frontera-acto1', 1280, 730, 1, false],
  ['1280x735-frontera-acto1', 1280, 735, 1, false],
  ['800x520-frontera-acto2-con-compactacion', 800, 520, 1, false],
  ['800x525-frontera-acto2-con-compactacion', 800, 525, 1, false],
  ['800x530-frontera-acto2-reserva-sola', 800, 530, 1, false],
  ['768x530-frontera-acto2-reserva-sola-ancho-real', 768, 530, 1, false],
  ['1280x767-frontera-reserva', 1280, 767, 1, false],
  ['1280x770-fuera-de-banda', 1280, 770, 1, false],
]

async function main() {
  const { cdpPort, url } = parseArgs(process.argv.slice(2))
  const cx = await connect(cdpPort, url)
  await cx.send('Page.enable')
  await cx.send('Runtime.enable')
  await cx.send('DOM.enable')
  await cx.send('Page.setWebLifecycleState', { state: 'active' })
  await cx.send('Emulation.setFocusEmulationEnabled', { enabled: true })

  let allClean = true
  // RONDA 5 (MEDIUM del review): barrer ES Y EN — un solo locale esconde
  // defecto dependiendo del perfil/máquina que corra el script (perfil
  // fresco de Chrome arranca en en-US, el texto corto).
  for (const locale of ['es', 'en']) {
    for (const [name, w, h, dsf, mobile] of DEFAULT_VIEWPORTS) {
      const clean = await measureViewport(cx, url, name, w, h, dsf, mobile, locale)
      if (!clean) allClean = false
    }
  }
  console.log(`\n=== RESULTADO: ${allClean ? 'todos los viewports limpios (ES+EN, colapsado+expandido)' : 'hay viewports rotos, ver detalle arriba'} ===`)
  cx.ws.close()
  process.exitCode = allClean ? 0 : 1
}

main().catch((e) => {
  console.error('FATAL', e && e.stack ? e.stack : String(e))
  process.exitCode = 1
})
