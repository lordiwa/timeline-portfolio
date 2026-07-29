// scripts/verify-ch0-ch4-text-overflow.mjs
// TASK-018 — harness de verificación geométrica real para el desborde de
// texto en ch0/ch4 (Chapter0Content.vue / Chapter4Content.vue) con el texto
// final de Rafael, más la medición de las 3 tarjetas de ch2 que TASK-026
// dejó pendiente (absorbida en este mismo ticket — ver tasks/TASK-018.json).
//
// POR QUÉ EXISTE: jsdom no hace layout (.planning/LECCIONES-TECNICAS.md §2)
// — un verde de Vitest no prueba que el texto de Rafael se pueda leer
// completo. Este script mide en Chrome real vía CDP crudo, en ES y EN (el
// español es el caso largo — lección de los harnesses de ch3/ch5), en
// portrait/landscape/desktop, incluidos altos chicos.
//
// QUÉ MIDE, por viewport y locale:
//   ch0: overflow real del wrapper (section[data-chapter="0"]) y de
//     .ch0-layout/.ch0-content (scrollHeight - clientHeight); si hay un
//     contenedor con overflow-y:auto/scroll se hace scroll a su máximo y se
//     reconfirma que el último párrafo de .ch0-bio queda dentro del bound
//     real (no sólo "existe scroll" — que el scroll ALCANZA el final).
//   ch4: mismo mecanismo para section[data-chapter="4"] y
//     .ch4-panel-column; además: (a) los dos HUD diegéticos
//     (.ch4-hud-bl, .ch4-hud-br) siguen enteramente dentro de la sección
//     (regresión conocida, TASK-010); (b) .global-mantra NO intersecta
//     ningún texto de bio/proyecto de ch4 (hallazgo del comentario de
//     cierre de TASK-010 en este ticket).
//   ch2 (SOLO MEDICIÓN, no fix — ch2 es zona protegida): las 3
//     project-card (BlueLizard, Matte, Joju) — overflow propio y overlap
//     con la timeline/HUD.
//   Todos los capítulos: overlap contra los 4 ocupantes del chasis
//     (.sticky-timeline, .contact-hud, .lang-toggle, .global-mantra) —
//     lección de los harnesses previos: "sólo comparaban un par de
//     elementos".
//
// CÓMO CORRERLO (receta completa en .planning/LECCIONES-TECNICAS.md §6):
//   1. `npm run dev` (deja el server en :5173 o el próximo puerto libre).
//   2. Chrome HEADED con --remote-debugging-port=9333 (headless degrada
//      compositor/backdrop-filter y ademas ignora --window-size chico).
//   3. `node scripts/verify-ch0-ch4-text-overflow.mjs --url=http://127.0.0.1:PORT/`
//      (opcional: --cdp-port=NNNN)
//
// Bloqueadores ya resueltos (no los redescubras, ver LECCIONES-TECNICAS.md §6):
// BootScreen exige Input.dispatchMouseEvent real (no .click() sintético);
// la cinemática ch2→ch3 (~5.9s) se dispara en cualquier salto a un capítulo
// posterior y se saltea con Escape; con muchas ventanas de Chrome abiertas,
// Page.setWebLifecycleState + Emulation.setFocusEmulationEnabled fuerzan el
// foco; Emulation.setDeviceMetricsOverride cuantiza los altos IMPARES hacia
// arriba (los viewports de abajo usan altos pares); nunca un sleep fijo tras
// un salto de scroll — se espera a que scrollTop se estabilice.
//
// Exit code 0 si TODOS los viewports x locale quedan limpios en ch0/ch4;
// 1 si algo desborda o se solapa. La medición de ch2 SIEMPRE se reporta pero
// NUNCA hace fallar el exit code (es sólo diagnóstico, ch2 es zona protegida).

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

async function bootOnce(cx, url) {
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
  return ready
}

async function ensureLocale(cx, locale) {
  const { evaluate } = cx
  const wanted = locale.toUpperCase()
  let current = await evaluate(`document.querySelector('.lang-active')?.textContent?.trim()`)
  if (current !== wanted) {
    await evaluate(`document.querySelector('.lang-toggle')?.click()`)
    await sleep(200)
    current = await evaluate(`document.querySelector('.lang-active')?.textContent?.trim()`)
  }
  if (current !== wanted) {
    throw new Error(`ensureLocale: se pidió "${wanted}" pero .lang-active mide "${current}" tras el toggle`)
  }
}

// MEASURE_CORE — instalado una vez por navegación; expone
// window.__ch018Measure(chapterN, opts) para medir un capítulo.
const MEASURE_CORE = `
window.__rect = function(el) {
  const r = el.getBoundingClientRect();
  return { x0: Math.round(r.left), y0: Math.round(r.top), x1: Math.round(r.right), y1: Math.round(r.bottom), w: Math.round(r.width), h: Math.round(r.height) };
};
window.__intersects = function(a, b) {
  if (!a || !b) return false;
  return a.x0 < b.x1 && a.x1 > b.x0 && a.y0 < b.y1 && a.y1 > b.y0;
};
window.__chassisRects = function() {
  const sel = ['.sticky-timeline', '.contact-hud', '.lang-toggle', '.global-mantra'];
  const out = {};
  for (const s of sel) {
    const el = document.querySelector(s);
    out[s] = el ? window.__rect(el) : null;
  }
  return out;
};
// scrollContainerFor(el) — nearest ancestor (incl. el) between el and
// section[data-chapter] with computed overflow-y auto|scroll AND
// scrollHeight>clientHeight. Scrolls it to its max and returns it plus
// whether it was found.
window.__scrollToEndIfScrollable = async function(fromEl, sectionEl) {
  let node = fromEl;
  while (node && node !== sectionEl && node !== document.body) {
    const cs = getComputedStyle(node);
    if ((cs.overflowY === 'auto' || cs.overflowY === 'scroll') && node.scrollHeight - node.clientHeight > 1) {
      node.scrollTop = node.scrollHeight;
      await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
      return { found: true, selectorGuess: node.className, rect: window.__rect(node) };
    }
    node = node.parentElement;
  }
  return { found: false };
};
window.__bottomMax = function(selector) {
  const els = Array.from(document.querySelectorAll(selector));
  if (els.length === 0) return null;
  let maxBottom = -Infinity;
  for (const el of els) {
    const r = el.getBoundingClientRect();
    if (r.bottom > maxBottom) maxBottom = r.bottom;
  }
  return Math.round(maxBottom);
};
'installed';
`

async function measureCh0(cx, vw, vh) {
  const { evaluate } = cx
  await evaluate(`(async () => {
    const section = document.querySelector('section[data-chapter="0"]');
    const bioP = document.querySelectorAll('.ch0-bio p, .ch0-flavor');
    const lastP = bioP[bioP.length - 1];
    const scrollInfo = lastP ? await window.__scrollToEndIfScrollable(lastP, section) : { found: false };
    window.__ch0Result = {
      section: section ? window.__rect(section) : null,
      sectionOverflowPx: section ? Math.round(section.scrollHeight - section.clientHeight) : null,
      layout: document.querySelector('.ch0-layout') ? window.__rect(document.querySelector('.ch0-layout')) : null,
      layoutOverflowPx: document.querySelector('.ch0-layout') ? Math.round(document.querySelector('.ch0-layout').scrollHeight - document.querySelector('.ch0-layout').clientHeight) : null,
      content: document.querySelector('.ch0-content') ? window.__rect(document.querySelector('.ch0-content')) : null,
      contentOverflowPx: document.querySelector('.ch0-content') ? Math.round(document.querySelector('.ch0-content').scrollHeight - document.querySelector('.ch0-content').clientHeight) : null,
      scrollInfo,
      contentBottomMax: window.__bottomMax('.ch0-bio p, .ch0-flavor'),
      innerTextLen: section ? section.innerText.length : 0,
      chassis: window.__chassisRects(),
    };
  })()`)
  await sleep(50)
  const r = await evaluate(`window.__ch0Result`)
  const chapterBottom = r.section ? r.section.y1 : vh
  const overflowPx = r.contentBottomMax !== null ? Math.max(0, r.contentBottomMax - chapterBottom) : null
  return { ...r, overflowPx }
}

async function measureCh4(cx, vw, vh) {
  const { evaluate } = cx
  await evaluate(`(async () => {
    const section = document.querySelector('section[data-chapter="4"]');
    const textEls = document.querySelectorAll('.ch4-bio, .ch4-flavor, .ch4-project-desc, .ch4-project-role, .ch4-project-tech li');
    const last = textEls[textEls.length - 1];
    const panelColumn = document.querySelector('.ch4-panel-column');
    const scrollInfo = panelColumn ? await window.__scrollToEndIfScrollable(panelColumn, section) : { found: false };
    const hudBl = document.querySelector('.ch4-hud-bl');
    const hudBr = document.querySelector('.ch4-hud-br');
    const mantra = document.querySelector('.global-mantra');
    window.__ch4Result = {
      section: section ? window.__rect(section) : null,
      sectionOverflowPx: section ? Math.round(section.scrollHeight - section.clientHeight) : null,
      panelColumn: panelColumn ? window.__rect(panelColumn) : null,
      panelColumnOverflowPx: panelColumn ? Math.round(panelColumn.scrollHeight - panelColumn.clientHeight) : null,
      scrollInfo,
      contentBottomMax: window.__bottomMax('.ch4-bio, .ch4-flavor, .ch4-project-desc, .ch4-project-role, .ch4-project-tech li'),
      hudBlRect: hudBl ? window.__rect(hudBl) : null,
      hudBrRect: hudBr ? window.__rect(hudBr) : null,
      mantraRect: mantra ? window.__rect(mantra) : null,
      innerTextLen: section ? section.innerText.length : 0,
      chassis: window.__chassisRects(),
    };
  })()`)
  await sleep(50)
  return await evaluate(`window.__ch4Result`)
}

async function measureCh2Cards(cx, vw, isMobile) {
  const { evaluate } = cx
  if (!isMobile) {
    // Desktop: las 3 tarjetas viven en el panel WORK, hay que clickear el nav.
    if (await evaluate(`!!document.querySelector('.flash-nav-btn')`)) {
      await evaluate(`(() => {
        const btns = Array.from(document.querySelectorAll('.flash-nav-btn'));
        const workBtn = btns.find((b) => /WORK|TRABAJO/i.test(b.textContent));
        if (workBtn) workBtn.click();
      })()`)
      await sleep(500)
    }
  }
  return await evaluate(`(() => {
    const cards = Array.from(document.querySelectorAll('section[data-chapter="2"] .project-card'));
    const section = document.querySelector('section[data-chapter="2"]');
    return cards.map((card) => {
      const title = card.querySelector('.project-card-title')?.textContent?.trim() || '?';
      const desc = card.querySelector('.project-card-desc')?.textContent || '';
      const r = window.__rect(card);
      return {
        title,
        descLen: desc.length,
        rect: r,
        overflowPx: Math.round(card.scrollHeight - card.clientHeight),
        clippedBySection: section ? (r.y1 > window.__rect(section).y1 || r.y0 < window.__rect(section).y0) : null,
      };
    });
  })()`)
}

const VIEWPORTS = [
  ['1440x900-desktop', 1440, 900, 1, false],
  ['1366x768-desktop', 1366, 768, 1, false],
  ['390x844-mobile-portrait', 390, 844, 3, true],
  ['844x390-mobile-landscape', 844, 390, 3, true],
]

function fmtRect(r) {
  return r ? `[${r.x0},${r.y0} - ${r.x1},${r.y1}]` : 'null'
}

async function main() {
  const { cdpPort, url } = parseArgs(process.argv.slice(2))
  const cx = await connect(cdpPort, url)
  await cx.send('Page.enable')
  await cx.send('Runtime.enable')
  await cx.send('DOM.enable')

  const results = { ch0: [], ch4: [], ch2: [] }
  let allClean = true

  for (const locale of ['es', 'en']) {
    for (const [name, w, h, dsf, mobile] of VIEWPORTS) {
      await cx.send('Emulation.setDeviceMetricsOverride', { width: w, height: h, deviceScaleFactor: dsf, mobile })
      await sleep(200)
      await bootOnce(cx, url)
      await cx.evaluate(MEASURE_CORE)
      await ensureLocale(cx, locale)

      // ── ch0 ──────────────────────────────────────────────────────────
      const readyCh0 = await jumpToChapter(cx, 0)
      let m0 = null
      if (readyCh0) {
        m0 = await measureCh0(cx, w, h)
        const ok0 = (m0.overflowPx ?? 0) <= 1 && (!m0.section || m0.sectionOverflowPx <= 1 || m0.scrollInfo?.found)
        console.log(
          `ch0 ${name} [${locale}] innerText=${m0.innerTextLen} sectionOverflowPx=${m0.sectionOverflowPx} ` +
          `layoutOverflowPx=${m0.layoutOverflowPx} contentOverflowPx=${m0.contentOverflowPx} ` +
          `scrollFound=${m0.scrollInfo?.found} contentBottomMax=${m0.contentBottomMax} sectionBottom=${m0.section?.y1} ` +
          `overflowPx=${m0.overflowPx} => ${ok0 ? 'LIMPIO' : 'DESBORDA'}`
        )
        if (!ok0) allClean = false
        results.ch0.push({ name, locale, ok: ok0, m0 })
      } else {
        console.log(`ch0 ${name} [${locale}] => NO READY`)
        allClean = false
        results.ch0.push({ name, locale, ok: false, reason: 'not-ready' })
      }

      // ── ch4 ──────────────────────────────────────────────────────────
      const readyCh4 = await jumpToChapter(cx, 4)
      let m4 = null
      if (readyCh4) {
        m4 = await measureCh4(cx, w, h)
        const sectionBottom = m4.section?.y1 ?? h
        const contentOverflowPx = m4.contentBottomMax !== null ? Math.max(0, m4.contentBottomMax - sectionBottom) : null
        const hudBlOk = m4.hudBlRect ? (m4.hudBlRect.y0 >= (m4.section?.y0 ?? 0) && m4.hudBlRect.y1 <= sectionBottom) : false
        const hudBrOk = m4.hudBrRect ? (m4.hudBrRect.y0 >= (m4.section?.y0 ?? 0) && m4.hudBrRect.y1 <= sectionBottom) : false
        const mantraOverlap = m4.mantraRect && m4.contentBottomMax !== null
          ? (m4.mantraRect.y0 < m4.contentBottomMax && m4.mantraRect.x0 < (m4.panelColumn?.x1 ?? w) && m4.mantraRect.x1 > (m4.panelColumn?.x0 ?? 0))
          : false
        const ok4 = (contentOverflowPx ?? 0) <= 1 && hudBlOk && hudBrOk && !mantraOverlap
        console.log(
          `ch4 ${name} [${locale}] innerText=${m4.innerTextLen} sectionOverflowPx=${m4.sectionOverflowPx} ` +
          `panelColumnOverflowPx=${m4.panelColumnOverflowPx} scrollFound=${m4.scrollInfo?.found} ` +
          `contentBottomMax=${m4.contentBottomMax} sectionBottom=${sectionBottom} contentOverflowPx=${contentOverflowPx} ` +
          `hudBl=${fmtRect(m4.hudBlRect)}(ok=${hudBlOk}) hudBr=${fmtRect(m4.hudBrRect)}(ok=${hudBrOk}) ` +
          `mantra=${fmtRect(m4.mantraRect)} mantraOverlap=${mantraOverlap} => ${ok4 ? 'LIMPIO' : 'ROTO'}`
        )
        if (!ok4) allClean = false
        results.ch4.push({ name, locale, ok: ok4, m4, contentOverflowPx, hudBlOk, hudBrOk, mantraOverlap })
      } else {
        console.log(`ch4 ${name} [${locale}] => NO READY`)
        allClean = false
        results.ch4.push({ name, locale, ok: false, reason: 'not-ready' })
      }

      // ── ch2 (SOLO MEDICIÓN — nunca hace fallar el exit code) ─────────
      const readyCh2 = await jumpToChapter(cx, 2)
      if (readyCh2) {
        const cards = await measureCh2Cards(cx, w, mobile || w < 600)
        for (const c of cards) {
          console.log(
            `ch2-card ${name} [${locale}] "${c.title}" descLen=${c.descLen} rect=${fmtRect(c.rect)} ` +
            `overflowPx=${c.overflowPx} clippedBySection=${c.clippedBySection}`
          )
        }
        results.ch2.push({ name, locale, cards })
      } else {
        console.log(`ch2 ${name} [${locale}] => NO READY (medición informativa, no bloquea)`)
      }
    }
  }

  const outPath = path.resolve(__dirname, '..', '.planning', 'ch018-verify-results.json')
  try {
    fs.writeFileSync(outPath, JSON.stringify(results, null, 2))
    console.log(`\nResultados detallados escritos en ${outPath}`)
  } catch {
    // best-effort
  }

  console.log(`\n=== RESULTADO ch0/ch4: ${allClean ? 'todos los viewports/locale limpios' : 'hay viewports rotos, ver detalle arriba'} ===`)
  cx.ws.close()
  process.exitCode = allClean ? 0 : 1
}

main().catch((e) => {
  console.error('FATAL', e && e.stack ? e.stack : String(e))
  process.exitCode = 1
})
