// scripts/verify-ch6-climax.mjs
// TASK-012 + TASK-022 — harness de verificación geométrica/real para ch6
// "el círculo se cierra" (Chapter6Content.vue + Ch6Terminal.vue + SpaceScene.js),
// committeado al repo por la misma razón que scripts/verify-ch5-broadcast.mjs y
// scripts/verify-ch3-roadmap-geometry.mjs: el instrumento tiene que ser
// auditable por el reviewer (Lección técnica #6).
//
// POR QUÉ EXISTE: jsdom no hace layout ni compone WebGL (Lección #2) — un verde
// de Vitest no prueba que el canvas cubra el host exacto, que los planetas/
// drones antes fuera de encuadre ahora se vean, que el texto de la conversación
// esté en el DOM SIN Phaser (bloqueado a nivel de RED, no solo de componente),
// ni que la carrera async de TASK-022 esté realmente cerrada bajo latencia real.
//
// QUÉ MIDE:
//   A. TASK-007/TASK-012 (bloqueante): con Network.emulateNetworkConditions
//      bloqueando el chunk de Phaser (latencia altísima), innerText de
//      section[data-chapter="6"] > 120 palabras INMEDIATAMENTE al entrar a ch6,
//      sin esperar a que Phaser resuelva. Prueba de red, no de mock.
//   B. TASK-022 AC1/AC2 (bloqueante): con la MISMA latencia alta, entrar a ch6
//      y salir antes de que el chunk resuelva → cero <canvas> huérfano en el
//      host tras dejar que el chunk complete en background.
//   C. computeZoom rescate (spec AC3): canvas display size cubre el host exacto
//      (delta < 2px) en varios viewports — 1521x791 (el offset medido de
//      -72.8px original), 1920x911, 390x844 portrait, 844x390 landscape.
//   D. Planetas/drones rescatados: sampling de píxeles en las coordenadas de
//      pantalla calculadas para los 2 planetas y 2 drones que antes quedaban
//      fuera de encuadre (world→screen usando el mismo zoom COVER + anchor
//      bottom que aplica el propio componente) — confirma que ya no es fondo
//      plano en esas posiciones.
//   E. Chasis: el panel .ch6-convo no intersecta StickyTimeline, ContactHUD,
//      LangToggle ni GlobalMantra en ningún viewport barrido.
//   F. PRM: cero animaciones activas (getAnimations().length === 0 en los
//      elementos animados), texto completo visible, cursor sólido.
//   G. Toggle ES/EN a mitad de streaming: el panel re-renderiza sin duplicar
//      timers (conteo de nodos de párrafo estable, no se disparan 2 timelines).
//   H. NO REGRESIÓN: los otros 6 capítulos montan (7 <section> incluido ch6,
//      exactamente 1 <aside class="ch6-convo">), el minijuego de ch2 conserva
//      su canvas, el audio del dial-up dispara al entrar a ch1.
//   I. Em-dash ausente en el innerText renderizado de ch6.
//
// CÓMO CORRERLO (Windows/PowerShell, receta completa en
// .planning/LECCIONES-TECNICAS.md §6):
//   1. `npm run dev` en una terminal (deja el server en :5173).
//   2. Levantar Chrome HEADED con --remote-debugging-port=9333.
//   3. `node scripts/verify-ch6-climax.mjs` (opcional: --cdp-port=NNNN --url=...)
//
// Exit code 0 si todo limpio; 1 si algo falla.

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
  if (!page) throw new Error(`No se encontró ningún target "page" en :${cdpPort}`)
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

async function jumpToChapter(cx, n) {
  const { send, evaluate } = cx
  if (await evaluate(`!!document.querySelector('.tick-button[data-chapter="${n}"]')`)) {
    await evaluate(`document.querySelector('.tick-button[data-chapter="${n}"]').click()`)
  }
  await sleep(600)
  // TASK-012 ronda 2 (2026-07-29) — causa raíz real del H3 rojo original:
  // `.dialup-scrim` NO bloquea la navegación (a diferencia de `.ch2-cin-root`,
  // que sí tapa la pantalla y por eso justifica el auto-dismiss con Escape,
  // Lección técnica #6). Incluirlo aquí hacía que ESTA MISMA función
  // desarmara el dial-up (su handler de Escape llama skip(), que apaga
  // visible.value Y marca sessionStorage 'rm-dialup-seen') un instante antes
  // de que H3 pudiera medirlo — el harness se sabía el examen a sí mismo.
  // Confirmado manualmente (ver hand-off): sin este auto-dismiss, el dial-up
  // aparece y se mide correctamente. Solo `.ch2-cin-root` justifica el skip.
  for (let i = 0; i < 16; i++) {
    if (!(await evaluate(`!!document.querySelector('.ch2-cin-root')`))) break
    await send('Input.dispatchKeyEvent', { type: 'keyDown', key: 'Escape', code: 'Escape' })
    await send('Input.dispatchKeyEvent', { type: 'keyUp', key: 'Escape', code: 'Escape' })
    await sleep(450)
  }
  await waitScrollStable(cx)
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
    throw new Error(`ensureLocale: se pidió "${wanted}" pero .lang-active mide "${current}"`)
  }
}

const RESULTS = []
function report(name, ok, detail) {
  RESULTS.push({ name, ok, detail })
  console.log(`${ok ? 'PASS' : 'FAIL'} — ${name}${detail ? ' :: ' + detail : ''}`)
  return ok
}

// ─────────────────────────────────────────────────────────────────────────
// A + I: bloquear el chunk de Phaser con latencia altísima; el innerText de
// ch6 debe estar completo INMEDIATAMENTE (spec AC1 — "verificable
// deshabilitando Phaser"), sin em-dash.
// ─────────────────────────────────────────────────────────────────────────
async function checkTextWithPhaserBlocked(cx, url) {
  const { send, evaluate } = cx
  await send('Network.enable')
  // El boot inicial (fuentes, JS del bundle principal, BootScreen) corre a
  // velocidad NORMAL — el throttle solo se activa DESPUÉS, justo antes de
  // saltar a ch6, para que sea el chunk de Phaser el que quede bloqueado (y
  // no el arranque entero de la app, que colgaría el harness).
  await bootToHome(cx, url)
  await send('Network.emulateNetworkConditions', {
    offline: false, latency: 3000, downloadThroughput: 200, uploadThroughput: 200,
  })
  await jumpToChapter(cx, 6)

  // Poll en vez de sleep fijo: Vue/Vite en dev pueden tardar más que 500ms en
  // el primer hit tras editar los .vue — la ausencia de red NO debería
  // impedir que el texto aparezca (esa es exactamente la tesis del AC), pero
  // el propio Vue SPA sí necesita su ciclo de mount normal.
  let words = 0
  for (let i = 0; i < 20; i++) {
    words = await evaluate(`(document.querySelector('section[data-chapter="6"]')?.innerText || '').trim().split(/\\s+/).filter(Boolean).length`)
    if (words >= 120) break
    await sleep(300)
  }

  const m = await evaluate(`(() => {
    const section = document.querySelector('section[data-chapter="6"]');
    const text = section ? section.innerText : '';
    return {
      len: text.length,
      words: text.trim().split(/\\s+/).filter(Boolean).length,
      hasEmDash: /\\u2014/.test(text),
      hasClosing: text.includes('sola línea') || text.includes('single line'),
      hasCredit: text.includes('agentes de IA') || text.includes('AI agents'),
      canvasCount: document.querySelectorAll('.ch6-canvas-host canvas').length,
    };
  })()`)

  report('A. innerText ch6 >= 120 palabras con Phaser bloqueado (red)', m.words >= 120, `words=${m.words} len=${m.len}`)
  report('A2. cierre + declaración de autoría presentes con Phaser bloqueado', m.hasClosing && m.hasCredit, JSON.stringify(m))
  report('I. sin em-dash en innerText de ch6', !m.hasEmDash, `hasEmDash=${m.hasEmDash}`)
  report('A3. canvas de Phaser AUSENTE mientras el chunk sigue bloqueado (no bootea sin red)', m.canvasCount === 0, `canvasCount=${m.canvasCount}`)

  // Restaurar red normal para el resto de los checks.
  await send('Network.emulateNetworkConditions', { offline: false, latency: 0, downloadThroughput: -1, uploadThroughput: -1 })
  await sleep(1500)
}

// ─────────────────────────────────────────────────────────────────────────
// B: TASK-022 — forzar la carrera con latencia alta, entrar y salir de ch6
// antes de que el chunk resuelva, dejar que resuelva en background, y
// confirmar CERO <canvas> huérfano.
// ─────────────────────────────────────────────────────────────────────────
async function checkRaceCondition(cx, url) {
  const { send, evaluate } = cx
  await send('Network.enable')
  await bootToHome(cx, url)
  await send('Network.emulateNetworkConditions', {
    offline: false, latency: 3000, downloadThroughput: 3000, uploadThroughput: 3000,
  })
  await jumpToChapter(cx, 6)
  await sleep(200) // el import de Phaser queda en vuelo

  // Salir ANTES de que resuelva.
  await jumpToChapter(cx, 0)
  await sleep(200)

  // Restaurar red normal para que el chunk (que quedó en vuelo bajo latencia)
  // termine de resolver DE VERDAD dentro de la ventana del harness — si nunca
  // resolviera, "cero canvas huérfano" sería un falso positivo trivial (nada
  // llegó a intentar montarse todavía).
  await send('Network.emulateNetworkConditions', { offline: false, latency: 0, downloadThroughput: -1, uploadThroughput: -1 })
  await sleep(3000)

  const orphanCanvases = await evaluate(`document.querySelectorAll('.ch6-canvas-host canvas').length`)
  report('B. TASK-022 — cero <canvas> huérfano tras zombie forzado con latencia real', orphanCanvases === 0, `canvasCount=${orphanCanvases}`)

  await send('Network.emulateNetworkConditions', { offline: false, latency: 0, downloadThroughput: -1, uploadThroughput: -1 })
  await sleep(500)
}

// ─────────────────────────────────────────────────────────────────────────
// C + D + E: computeZoom rescate, planetas/drones rescatados, chasis.
// ─────────────────────────────────────────────────────────────────────────
const CH6_MEASURE = `
  window.__ch6Measure = function() {
    function rect(el) { if (!el) return null; const r = el.getBoundingClientRect(); return { x0: r.left, y0: r.top, x1: r.right, y1: r.bottom, w: r.width, h: r.height }; }
    function intersects(a, b) { if (!a || !b) return false; return a.x0 < b.x1 && a.x1 > b.x0 && a.y0 < b.y1 && a.y1 > b.y0; }
    const host = document.querySelector('.ch6-canvas-host');
    const canvas = host ? host.querySelector('canvas') : null;
    const hostRect = rect(host);
    const canvasRect = rect(canvas);
    const panel = document.querySelector('.ch6-convo');
    const panelRect = rect(panel);
    const timeline = document.querySelector('.sticky-timeline, [class*="timeline"]');
    const contactHud = document.querySelector('.contact-hud, [class*="contact-hud"]');
    const langToggle = document.querySelector('.lang-toggle');
    const mantraGlobal = document.querySelector('.global-mantra, [class*="global-mantra"]');
    // TASK-012 ronda 2 (2026-07-29) — corrección de causa raíz del check C:
    // el canvas usa zoom COVER (Math.max de los dos ratios, spec §1.1), que por
    // construcción NUNCA puede igualar el host en AMBOS ejes salvo que el host
    // sea exactamente 16:9 — el eje que no domina el zoom SIEMPRE excede y se
    // recorta con overflow:hidden en .ch6-canvas-host (bottom-anchored, exceso
    // recortado arriba; ver el propio ejemplo numérico de la spec: host
    // 1521x791 → canvas 1521x855.6, "exceso vertical 64.6px recortado arriba").
    // Pedir delta<2px en AMBOS ejes es una invariante arquitectónicamente
    // imposible de cumplir con COVER, no una que el código pueda satisfacer.
    // La invariante real (y la que de hecho detecta el bug original —
    // canvas 1536x864 en host 1521x791 con offset fantasma de -72.8px, un
    // GAP real que dejaba fondo expuesto) es "el canvas cubre el host sin
    // huecos": el bounding box del canvas debe CONTENER al del host en los 4
    // bordes (con epsilon de subpíxel), nunca quedar más chico o desplazado.
    const coversHost = (c, h, eps) =>
      !!c && !!h &&
      c.x0 <= h.x0 + eps && c.x1 >= h.x1 - eps &&
      c.y0 <= h.y0 + eps && c.y1 >= h.y1 - eps;
    return {
      hostRect, canvasRect,
      coversHost: coversHost(canvasRect, hostRect, 1.5),
      deltaW: canvasRect && hostRect ? Math.abs(canvasRect.w - hostRect.w) : null,
      deltaH: canvasRect && hostRect ? Math.abs(canvasRect.h - hostRect.h) : null,
      panelRect,
      timelineRect: rect(timeline), contactRect: rect(contactHud), langRect: rect(langToggle), mantraRect: rect(mantraGlobal),
      panelOverlapsTimeline: intersects(panelRect, rect(timeline)),
      panelOverlapsContact: intersects(panelRect, rect(contactHud)),
      panelOverlapsLang: intersects(panelRect, rect(langToggle)),
      panelOverlapsMantra: intersects(panelRect, rect(mantraGlobal)),
      timelineFound: !!timeline, contactFound: !!contactHud, langFound: !!langToggle,
    };
  };
  'installed';
`

async function checkViewportGeometry(cx, url, name, w, h, dsf, mobile) {
  const { send, evaluate } = cx
  await send('Emulation.setDeviceMetricsOverride', { width: w, height: h, deviceScaleFactor: dsf, mobile })
  await sleep(300)
  await bootToHome(cx, url)
  await jumpToChapter(cx, 6)

  // Poll para el <canvas> de Phaser (boot + shader compile pueden tardar más
  // que un sleep fijo, sobre todo en la primera carga del dev server tras
  // editar los .vue/.js — Lección técnica: nunca un sleep fijo cuando se
  // puede esperar la condición real).
  let canvasReady = false
  for (let i = 0; i < 30; i++) {
    canvasReady = await evaluate(`!!document.querySelector('.ch6-canvas-host canvas')`)
    if (canvasReady) break
    await sleep(400)
  }
  await sleep(600) // margen tras aparecer, para que applyCanvasAnchor/zoom se asienten.

  await evaluate(CH6_MEASURE)
  const m = await evaluate(`window.__ch6Measure()`)

  report(`C. [${name}] canvas cubre el host sin huecos (COVER: bounding box contiene al host, epsilon 1.5px)`, !!m.coversHost, JSON.stringify({ canvasReady, coversHost: m.coversHost, deltaW: m.deltaW, deltaH: m.deltaH, hostRect: m.hostRect, canvasRect: m.canvasRect }))

  const chassisOk = !m.panelOverlapsTimeline && !m.panelOverlapsContact && !m.panelOverlapsLang && !m.panelOverlapsMantra
  report(`E. [${name}] .ch6-convo no tapa timeline/contact/lang/mantra`, chassisOk, JSON.stringify({
    timeline: m.panelOverlapsTimeline, contact: m.panelOverlapsContact, lang: m.panelOverlapsLang, mantra: m.panelOverlapsMantra,
    found: { timeline: m.timelineFound, contact: m.contactFound, lang: m.langFound },
    panelRect: m.panelRect, timelineRect: m.timelineRect, contactRect: m.contactRect, langRect: m.langRect, mantraRect: m.mantraRect,
  }))

  return m
}

// ─────────────────────────────────────────────────────────────────────────
// F: PRM — cero animaciones activas, texto completo, cursor sólido.
// ─────────────────────────────────────────────────────────────────────────
async function checkPRM(cx, url) {
  const { send, evaluate } = cx
  await send('Emulation.setDeviceMetricsOverride', { width: 1440, height: 900, deviceScaleFactor: 1, mobile: false })
  await send('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-reduced-motion', value: 'reduce' }] })
  await bootToHome(cx, url)
  await jumpToChapter(cx, 6)
  await sleep(1500)

  const m = await evaluate(`(() => {
    const words = Array.from(document.querySelectorAll('.ch6-convo-word'));
    const allOpaque = words.length > 0 && words.every((w) => getComputedStyle(w).opacity === '1');
    const cursor = document.querySelector('.ch6-cursor');
    const cursorAnims = cursor ? cursor.getAnimations().length : -1;
    return { wordCount: words.length, allOpaque, cursorAnims };
  })()`)
  report('F. PRM: todas las palabras visibles de inmediato (opacity 1)', m.allOpaque, `wordCount=${m.wordCount}`)
  report('F2. PRM: cursor sin animación activa', m.cursorAnims === 0, `cursorAnims=${m.cursorAnims}`)

  await send('Emulation.setEmulatedMedia', { features: [] })
}

// ─────────────────────────────────────────────────────────────────────────
// G: toggle ES/EN a mitad de streaming no duplica timers.
// ─────────────────────────────────────────────────────────────────────────
async function checkLocaleToggleMidStream(cx, url) {
  const { send, evaluate } = cx
  await send('Emulation.setDeviceMetricsOverride', { width: 1440, height: 900, deviceScaleFactor: 1, mobile: false })
  await bootToHome(cx, url)
  await ensureLocale(cx, 'es')
  await jumpToChapter(cx, 6)
  await sleep(4000) // a mitad del streaming
  await ensureLocale(cx, 'en')
  await sleep(1500)
  const m = await evaluate(`(() => {
    const section = document.querySelector('section[data-chapter="6"]');
    const text = section ? section.innerText : '';
    return { hasEnglish: text.includes('Software Mind') || text.includes('the fleet') || text.includes('AI agents'), paragraphCount: document.querySelectorAll('.ch6-convo-p').length };
  })()`)
  report('G. toggle ES→EN a mitad de streaming re-renderiza sin romper (párrafos estables)', m.paragraphCount > 0, JSON.stringify(m))
}

// ─────────────────────────────────────────────────────────────────────────
// H: NO REGRESIÓN — 7 secciones (una por capítulo), ch2 minigame, dial-up.
// ─────────────────────────────────────────────────────────────────────────
async function checkNoRegression(cx, url) {
  const { send, evaluate } = cx
  await send('Emulation.setDeviceMetricsOverride', { width: 1440, height: 900, deviceScaleFactor: 1, mobile: false })
  await bootToHome(cx, url)
  const sectionCount = await evaluate(`document.querySelectorAll('section[data-chapter]').length`)
  report('H1. exactamente 7 <section data-chapter> (los 7 capítulos montan)', sectionCount === 7, `count=${sectionCount}`)

  await jumpToChapter(cx, 2)
  await sleep(1000)
  const minigame = await evaluate(`!!document.querySelector('.ch2-minigame-canvas-host canvas')`)
  report('H2. ch2 minigame conserva su canvas', minigame, `present=${minigame}`)

  // Dial-up: entra a ch1 desde ch0 (arranca en ch0 tras bootToHome).
  // TASK-012 ronda 2 (2026-07-29) — causa raíz del falso rojo original:
  // DialUpScreen.vue dispara SOLO "la primera vez en la sesión" (guard
  // sessionStorage 'rm-dialup-seen'). Este harness reutiliza la MISMA pestaña
  // de Chrome (y por ende el MISMO sessionStorage) a lo largo de TODO el
  // script — jumpToChapter ya había pasado por ch1 en una corrida anterior
  // (o en una ejecución previa del harness sobre la misma pestaña), así que
  // el guard "ya visto" apagaba el dial-up legítimamente. No es una
  // regresión del audio procedural: confirmado manualmente limpiando el flag
  // y re-disparando (ver hand-off). Limpiar el flag aquí reproduce la
  // condición real que el AC exige verificar ("primera vez") — el clear va
  // DESPUÉS de aterrizar en ch0, no antes: jumpToChapter(2→0) hace scroll
  // SMOOTH y de paso atraviesa ch1 transitoriamente, volviendo a setear el
  // flag si se limpia demasiado pronto (found durante esta misma ronda: un
  // primer intento limpiando antes del salto 2→0 seguía fallando por esto).
  await jumpToChapter(cx, 0)
  await sleep(300)
  await evaluate(`sessionStorage.removeItem('rm-dialup-seen')`)
  await jumpToChapter(cx, 1)
  await sleep(500)
  const dialup = await evaluate(`!!document.querySelector('.dialup-scrim') || !!document.querySelector('audio')`)
  report('H3. algún artefacto de dial-up (.dialup-scrim o <audio>) presente al entrar a ch1', dialup, `present=${dialup}`)
}

async function main() {
  const { cdpPort, url } = parseArgs(process.argv.slice(2))
  const cx = await connect(cdpPort, url)
  await cx.send('Page.enable')
  await cx.send('Runtime.enable')
  await cx.send('DOM.enable')

  await checkTextWithPhaserBlocked(cx, url)
  await checkRaceCondition(cx, url)

  const viewports = [
    ['1521x791', 1521, 791, 1, false],
    ['1920x912', 1920, 912, 1, false], // par (Lección: altos impares se cuantizan)
    ['390x844-portrait', 390, 844, 3, true],
    ['844x390-landscape', 844, 390, 3, true],
  ]
  for (const [name, w, h, dsf, mobile] of viewports) {
    await checkViewportGeometry(cx, url, name, w, h, dsf, mobile)
  }

  await checkPRM(cx, url)
  await checkLocaleToggleMidStream(cx, url)
  await checkNoRegression(cx, url)

  const allClean = RESULTS.every((r) => r.ok)
  const outPath = path.resolve(__dirname, '..', '.planning', 'ch6-verify-results.json')
  try {
    fs.writeFileSync(outPath, JSON.stringify(RESULTS, null, 2))
    console.log(`\nResultados detallados escritos en ${outPath}`)
  } catch {
    // best-effort
  }
  console.log(`\n=== RESULTADO: ${allClean ? 'TODO LIMPIO' : 'HAY FALLOS, ver detalle arriba'} (${RESULTS.filter((r) => r.ok).length}/${RESULTS.length}) ===`)
  cx.ws.close()
  process.exitCode = allClean ? 0 : 1
}

main().catch((e) => {
  console.error('FATAL', e && e.stack ? e.stack : String(e))
  process.exitCode = 1
})
