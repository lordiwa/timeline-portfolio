// scripts/verify-image-audit.mjs
// TASK-035 — auditoria medida de TODAS las imagenes de los 7 capitulos
// (pedido directo de Rafael: "revisa tambien que todas las fotos de cada
// chapter se vean bien"). Committeado al repo por la misma razon que el
// resto de los arneses de .planning/LECCIONES-TECNICAS.md §6: "si el
// instrumento no esta en el repo, su verde no es auditable ni reproducible".
//
// ESTE SCRIPT NO ARREGLA NADA. Es diagnostico puro — recorre los 7
// capitulos en 4 viewports, evalua CADA <img> y CADA elemento con
// background-image real (url(), no gradientes) que cae dentro de la
// section del capitulo activo o en el chrome fijo asociado (.avatar-bust,
// .bg-layer), y mide:
//
//   A. CARGA — naturalWidth/naturalHeight===0 tras `complete` (AC2). El
//      rewrite `** -> /index.html` de firebase.json hace que un asset
//      faltante devuelva 200 con el HTML del SPA — el codigo HTTP NO es
//      sensor aqui. Se confirma ademas con Content-Type real (fetch
//      in-browser, mismo origen que la pagina) como segunda señal.
//   B. ASPECT DISTORTION — para <img>: solo aplica si `object-fit` efectivo
//      es 'fill' (o no declarado), porque 'contain'/'cover'/'none' nunca
//      estiran por definicion del propio CSS. Para background-image: solo
//      si `background-size` es un par de longitudes EXPLICITAS (nunca
//      cover/contain/auto, que tampoco estiran).
//   C. UPSCALE — escala efectiva renderizado/natural segun el modo real
//      (contain=min, cover=max, fill=promedio de ejes, auto=1 — el modo
//      'auto' cubre los sprite-sheets de ch5, que NO se escalan, solo
//      recortan/mueven con background-position). Si `image-rendering` es
//      pixelated/crisp-edges (pixel art deliberado, spec CLAUDE.md), un
//      upscale CERCA de un entero es INTENCIONAL y no se reporta; solo se
//      reporta el upscale NO entero (bordes irregulares). Si NO es pixel
//      art, se reporta como candidato a revisión visual solo si excede 1.3x
//      (posible borrosidad), nunca como defecto duro.
//   D. TAPADA / RECORTADA / FUERA DE VIEWPORT — geometrico, por
//      getBoundingClientRect: occlusion via document.elementsFromPoint en 5
//      puntos (centro + 4 esquinas), recorte via ancestros con
//      overflow:hidden|clip|scroll|auto cuyo rect no contiene al de la
//      imagen, y viewport via interseccion con {0,0,vw,vh}.
//   E. BUSTS — coherencia de piel/pelo/ojos contra ch3 (referencia visual
//      buena, memoria del proyecto) por pixel-sampling real
//      (Page.captureScreenshot, NUNCA canvas.toDataURL — Lección técnica
//      #3) sobre .avatar-bust, con los hex medidos.
//
// QUE NO HACE: no regenera arte, no mueve assets, no toca componentes de
// capitulo. Ver tasks/TASK-035.json.
//
// FORMATO DE SALIDA: por (capitulo, viewport) imprime un resumen (N
// evaluadas, M marcadas) + una linea por cada imagen MARCADA con su
// medicion. Imprimir una linea por cada una de las ~300+ imagenes
// evaluadas (incluye la multitud de ch5) volveria la salida inauditable;
// el JSON completo (con cada imagen, marcada o no) se escribe aparte
// (gitignored, `.planning/*-verify-results.json`) para inspeccion profunda.
//
// CÓMO CORRERLO (receta completa en .planning/LECCIONES-TECNICAS.md §6):
//   1. `npm run dev` (deja el server en :5173 o el próximo puerto libre).
//   2. Chrome HEADED con --remote-debugging-port=NNNN (headless degrada
//      compositor y además ignora --window-size chico).
//   3. `node scripts/verify-image-audit.mjs --cdp-port=NNNN --url=http://127.0.0.1:PORT/`
//
// Bloqueadores ya resueltos (no los redescubras): BootScreen exige
// Input.dispatchMouseEvent real; la cinemática ch2->ch3 se saltea con
// Escape; Page.setWebLifecycleState + Emulation.setFocusEmulationEnabled
// fuerzan el foco sin depender del z-order real; Emulation.setDeviceMetricsOverride
// cuantiza altos IMPARES hacia arriba (los viewports de abajo usan pares o
// están dentro del margen); nunca un sleep fijo tras un salto de scroll.
//
// Exit code 0 si CERO defectos de severidad HIGH; 1 si hay al menos uno
// (MEDIUM/LOW nunca hacen fallar el exit code — son candidatos a revisión,
// no defectos duros confirmados).

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
  async function evaluate(expression, awaitPromise = false) {
    const res = await send('Runtime.evaluate', { expression, returnByValue: true, awaitPromise })
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
  // Dejar asentar animaciones de entrada (scroll-reveal, crossfades) antes de medir.
  await sleep(500)
  return ready
}

async function waitImagesSettled(cx) {
  const { evaluate } = cx
  for (let i = 0; i < 20; i++) {
    const allDone = await evaluate(`Array.from(document.images).every((img) => img.complete)`)
    if (allDone) break
    await sleep(200)
  }
  await sleep(150)
}

// ─────────────────────────────────────────────────────────────────────────
// Script in-page instalado una vez por navegación (SPA — persiste entre
// saltos de capítulo, sólo hay que reinstalarlo tras un Page.navigate real).
// ─────────────────────────────────────────────────────────────────────────
const AUDIT_CORE = `
window.__rect = function(el) {
  const r = el.getBoundingClientRect();
  return { x0: r.left, y0: r.top, x1: r.right, y1: r.bottom, w: r.width, h: r.height };
};
window.__intersectsRect = function(a, b) {
  if (!a || !b) return false;
  return a.x0 < b.x1 && a.x1 > b.x0 && a.y0 < b.y1 && a.y1 > b.y0;
};
window.__isVisible = function(el) {
  let node = el;
  while (node && node.nodeType === 1) {
    const cs = getComputedStyle(node);
    if (cs.display === 'none' || cs.visibility === 'hidden') return false;
    if (parseFloat(cs.opacity) === 0) return false;
    node = node.parentElement;
  }
  return true;
};
window.__clippedByAncestor = function(el, r) {
  const clips = [];
  let node = el.parentElement;
  while (node && node !== document.body && node !== document.documentElement) {
    const cs = getComputedStyle(node);
    const ov = cs.overflow + ' ' + cs.overflowX + ' ' + cs.overflowY;
    if (/hidden|clip|scroll|auto/.test(ov)) {
      const nr = window.__rect(node);
      if (nr.w > 0 && nr.h > 0) {
        const insideX = r.x0 >= nr.x0 - 0.5 && r.x1 <= nr.x1 + 0.5;
        const insideY = r.y0 >= nr.y0 - 0.5 && r.y1 <= nr.y1 + 0.5;
        if (!insideX || !insideY) {
          // área visible tras el recorte (intersección) vs área total del elemento —
          // cuantifica cuánto se pierde, no sólo que "algo" se recorta.
          const ix0 = Math.max(r.x0, nr.x0), iy0 = Math.max(r.y0, nr.y0);
          const ix1 = Math.min(r.x1, nr.x1), iy1 = Math.min(r.y1, nr.y1);
          const visW = Math.max(0, ix1 - ix0), visH = Math.max(0, iy1 - iy0);
          const visibleAreaPct = (r.w * r.h) > 0 ? (visW * visH) / (r.w * r.h) * 100 : 0;
          // reachableViaScroll: si el eje violado corresponde a un ancestro con
          // overflow scroll/auto (no hidden/clip), el contenido NO está perdido
          // para siempre — un usuario real puede scrollear ESE contenedor interno
          // y llegar a verlo (confirmado manualmente en ch0 mobile: .ch0-content
          // es overflow:auto y el terminal-program-img aparece intacto tras
          // llevar su scrollTop al máximo). Sin esta distinción, TODO contenedor
          // con scroll interno legítimo (patrón ya usado en ch0/ch4/ch5) se
          // reportaría igual que un recorte permanente por overflow:hidden.
          const reachableX = insideX || /scroll|auto/.test(cs.overflowX)
          const reachableY = insideY || /scroll|auto/.test(cs.overflowY)
          clips.push({
            selector: node.tagName.toLowerCase() + (node.className ? '.' + String(node.className).trim().split(/\\s+/).join('.') : ''),
            ancestorRect: nr, insideX, insideY, visibleAreaPct: Math.round(visibleAreaPct * 10) / 10,
            reachableViaScroll: reachableX && reachableY,
          });
        }
      }
    }
    node = node.parentElement;
  }
  return clips;
};
window.__occlusionCheck = function(el, r) {
  const vw = window.innerWidth, vh = window.innerHeight;
  if (r.w <= 0 || r.h <= 0) return { anyOccluded: false, samples: [] };
  // La MAYORÍA de las imágenes decorativas de este sitio son aria-hidden con
  // pointer-events:none (chasis fijo, GIFs, parallax, multitud de ch5) — por
  // spec de CSS, un elemento con pointer-events:none (heredado o propio) NO
  // aparece en document.elementsFromPoint aunque esté pintado ahí, así que un
  // primer intento sin este fix marcaba TODA imagen decorativa como "tapada
  // por su propio contenedor" (falso positivo sistemático, encontrado en la
  // primera corrida de este mismo arnés). Forzar pointer-events:auto SÓLO en
  // el elemento auditado (nunca en hermanos/ancestros) lo hace hit-testeable
  // sin alterar qué hay pintado encima: si otro elemento real (con su propio
  // pointer-events:auto) sigue tapándolo, seguirá resultando ausente del
  // stack; si el "tapador" es otro decorativo con pointer-events:none (p.ej.
  // otro miembro de la multitud de ch5 superpuesto por diseño de asientos),
  // no intercepta el hit-test y el elemento auditado sigue apareciendo — el
  // solapamiento de multitud POR DISEÑO no se reporta como defecto.
  const prevPE = el.style.pointerEvents;
  el.style.pointerEvents = 'auto';
  const raw = [
    [r.x0 + r.w * 0.5, r.y0 + r.h * 0.5],
    [r.x0 + 2, r.y0 + 2],
    [r.x1 - 2, r.y0 + 2],
    [r.x0 + 2, r.y1 - 2],
    [r.x1 - 2, r.y1 - 2],
  ].filter(([x, y]) => x >= 0 && y >= 0 && x <= vw && y <= vh);
  const samples = raw.map(([x, y]) => {
    const stack = document.elementsFromPoint(x, y);
    const occluded = stack.length === 0 || !stack.includes(el);
    const topTag = stack[0] ? (stack[0].tagName.toLowerCase() + (stack[0].className ? '.' + String(stack[0].className).trim().split(/\\s+/)[0] : '')) : null;
    return { x: Math.round(x), y: Math.round(y), occluded, topTag };
  });
  el.style.pointerEvents = prevPE;
  return { anyOccluded: samples.some((s) => s.occluded), samples };
};
window.__describe = function(el) {
  let sel = el.tagName.toLowerCase();
  if (el.className && typeof el.className === 'string' && el.className.trim()) {
    sel += '.' + el.className.trim().split(/\\s+/).join('.');
  }
  if (el.id) sel += '#' + el.id;
  return sel;
};

window.__auditImages = function(chapterN) {
  const vw = window.innerWidth, vh = window.innerHeight;
  const viewportRect = { x0: 0, y0: 0, x1: vw, y1: vh };
  const results = [];
  const seen = new Set();

  const scopeRoots = [
    document.querySelector('section[data-chapter="' + chapterN + '"]'),
    document.querySelector('.avatar-bust'),
  ].filter(Boolean);

  // ── <img> elements ──────────────────────────────────────────────────
  for (const root of scopeRoots) {
    const imgs = root.matches('img') ? [root] : Array.from(root.querySelectorAll('img'));
    for (const img of imgs) {
      if (seen.has(img)) continue;
      seen.add(img);
      const r = window.__rect(img);
      const cs = getComputedStyle(img);
      const natW = img.naturalWidth, natH = img.naturalHeight;
      const visible = window.__isVisible(img);
      const inViewport = window.__intersectsRect(r, viewportRect);
      const clips = window.__clippedByAncestor(img, r);
      const occ = (visible && r.w > 0 && r.h > 0) ? window.__occlusionCheck(img, r) : { anyOccluded: false, samples: [] };
      results.push({
        kind: 'img',
        selector: window.__describe(img),
        src: img.currentSrc || img.src,
        rect: r, natW, natH, complete: img.complete,
        broken: img.complete && (natW === 0 || natH === 0),
        objectFit: cs.objectFit,
        pixelArt: cs.imageRendering === 'pixelated' || cs.imageRendering === 'crisp-edges',
        visible, inViewport, clips,
        occluded: occ.anyOccluded, occSamples: occ.samples,
      });
    }
  }

  // ── background-image url() elements (excluye gradientes) ───────────
  for (const root of scopeRoots) {
    const all = [root, ...Array.from(root.querySelectorAll('*'))];
    for (const el of all) {
      if (seen.has(el)) continue;
      const cs = getComputedStyle(el);
      const bi = cs.backgroundImage;
      const m = bi.match(/^url\\((['"]?)(.*?)\\1\\)$/);
      if (!m) continue;
      seen.add(el);
      const r = window.__rect(el);
      const visible = window.__isVisible(el);
      const inViewport = window.__intersectsRect(r, viewportRect);
      const clips = window.__clippedByAncestor(el, r);
      const occ = (visible && r.w > 0 && r.h > 0) ? window.__occlusionCheck(el, r) : { anyOccluded: false, samples: [] };
      results.push({
        kind: 'bg',
        selector: window.__describe(el),
        src: new URL(m[2], location.href).pathname,
        rect: r,
        backgroundSize: cs.backgroundSize,
        pixelArt: cs.imageRendering === 'pixelated' || cs.imageRendering === 'crisp-edges',
        visible, inViewport, clips,
        occluded: occ.anyOccluded, occSamples: occ.samples,
      });
    }
  }

  // Chrome global siempre presente (StickyTimeline/ContactHUD/LangToggle) NO
  // se audita aquí — no son "fotos de capítulo", son HUD invariante sin
  // imagen (fuera de alcance del ticket).
  return results;
};
'installed';
`

// Probe de carga real para background-image (no hay <img> que exponga
// naturalWidth): crea un Image() con la MISMA URL, más un fetch (mismo
// origen que la página) para leer Content-Type — el rewrite SPA de
// firebase.json hace irrelevante el status HTTP en producción, así que acá
// también se prioriza naturalWidth/Content-Type sobre el status.
async function probeUrlsInBrowser(cx, urls) {
  if (urls.length === 0) return {}
  const script = `
    (async () => {
      const urls = ${JSON.stringify(urls)};
      const out = {};
      await Promise.all(urls.map(async (u) => {
        let natW = 0, natH = 0, imgError = false;
        try {
          const img = new Image();
          await new Promise((resolve) => {
            img.onload = resolve;
            img.onerror = () => { imgError = true; resolve(); };
            img.src = u;
          });
          natW = img.naturalWidth; natH = img.naturalHeight;
        } catch { imgError = true; }
        let contentType = null, fetchError = null;
        try {
          const res = await fetch(u);
          contentType = res.headers.get('content-type');
        } catch (e) { fetchError = String(e); }
        out[u] = { natW, natH, imgError, contentType, fetchError };
      }));
      return out;
    })()
  `
  return cx.evaluate(script, true)
}

// ─────────────────────────────────────────────────────────────────────────
// Clasificación (Node-side) — separa medición cruda de veredicto para que
// el reporte final pueda mostrar el número medido, no un adjetivo.
// ─────────────────────────────────────────────────────────────────────────
function classifyImg(rec) {
  const problems = []
  if (rec.broken) {
    problems.push({ severity: 'HIGH', type: 'BROKEN', detail: `naturalWidth=${rec.natW} naturalHeight=${rec.natH} complete=${rec.complete}` })
  } else if (rec.natW > 0 && rec.natH > 0 && rec.rect.w > 0 && rec.rect.h > 0) {
    const fit = rec.objectFit || 'fill'
    let effScale = null
    if (fit === 'contain') {
      effScale = Math.min(rec.rect.w / rec.natW, rec.rect.h / rec.natH)
    } else if (fit === 'cover') {
      effScale = Math.max(rec.rect.w / rec.natW, rec.rect.h / rec.natH)
    } else if (fit === 'none') {
      effScale = 1
    } else {
      const scaleX = rec.rect.w / rec.natW
      const scaleY = rec.rect.h / rec.natH
      effScale = (scaleX + scaleY) / 2
      const ratio = scaleX > scaleY ? scaleX / scaleY : scaleY / scaleX
      if (ratio > 1.03) {
        problems.push({ severity: 'HIGH', type: 'ASPECT_DISTORTION', detail: `object-fit=${fit} scaleX=${scaleX.toFixed(3)} scaleY=${scaleY.toFixed(3)} ratio=${ratio.toFixed(3)} natural=${rec.natW}x${rec.natH} rendered=${Math.round(rec.rect.w)}x${Math.round(rec.rect.h)}` })
      }
    }
    if (effScale !== null && effScale > 1.01) {
      const nearestInt = Math.round(effScale)
      const intDelta = Math.abs(effScale - nearestInt)
      if (rec.pixelArt) {
        if (intDelta > 0.05) {
          problems.push({ severity: 'MEDIUM', type: 'UPSCALE_NON_INTEGER', detail: `pixel art, object-fit=${fit}, scale=${effScale.toFixed(3)} (no entero — bordes irregulares esperables). natural=${rec.natW}x${rec.natH} rendered=${Math.round(rec.rect.w)}x${Math.round(rec.rect.h)}` })
        }
      } else if (effScale > 1.3) {
        problems.push({ severity: 'LOW', type: 'UPSCALE_BLUR_CANDIDATE', detail: `NO es pixel art, object-fit=${fit}, scale=${effScale.toFixed(3)} — candidato a revisión visual de borrosidad. natural=${rec.natW}x${rec.natH} rendered=${Math.round(rec.rect.w)}x${Math.round(rec.rect.h)}` })
      }
    }
  }
  pushGeometryProblems(rec, problems)
  return problems
}

function parseBgSizeMode(bgSizeStr, boxW, boxH) {
  const s = (bgSizeStr || '').trim()
  if (s === 'cover') return { mode: 'cover' }
  if (s === 'contain') return { mode: 'contain' }
  if (s === 'auto' || s === 'auto auto' || s === '') return { mode: 'auto' }
  const parts = s.split(/\s+/)
  if (parts.length === 2 && parts[0] !== 'auto' && parts[1] !== 'auto') {
    const dispW = parts[0].endsWith('%') ? boxW * (parseFloat(parts[0]) / 100) : parseFloat(parts[0])
    const dispH = parts[1].endsWith('%') ? boxH * (parseFloat(parts[1]) / 100) : parseFloat(parts[1])
    return { mode: 'explicit', dispW, dispH }
  }
  return { mode: 'other:' + s }
}

function classifyBg(rec, probe) {
  const problems = []
  const natW = probe?.natW ?? 0
  const natH = probe?.natH ?? 0
  const broken = probe && (probe.imgError || natW === 0 || natH === 0 || (probe.contentType && !probe.contentType.startsWith('image/')))
  if (broken) {
    problems.push({ severity: 'HIGH', type: 'BROKEN', detail: `natW=${natW} natH=${natH} imgError=${probe?.imgError} contentType=${probe?.contentType} fetchError=${probe?.fetchError ?? 'n/a'}` })
  } else if (natW > 0 && natH > 0 && rec.rect.w > 0 && rec.rect.h > 0) {
    const sizeMode = parseBgSizeMode(rec.backgroundSize, rec.rect.w, rec.rect.h)
    if (sizeMode.mode === 'cover') {
      const effScale = Math.max(rec.rect.w / natW, rec.rect.h / natH)
      appendUpscale(problems, rec, effScale, 'cover', natW, natH)
    } else if (sizeMode.mode === 'contain') {
      const effScale = Math.min(rec.rect.w / natW, rec.rect.h / natH)
      appendUpscale(problems, rec, effScale, 'contain', natW, natH)
    } else if (sizeMode.mode === 'explicit') {
      const scaleX = sizeMode.dispW / natW
      const scaleY = sizeMode.dispH / natH
      const ratio = scaleX > scaleY ? scaleX / scaleY : scaleY / scaleX
      if (ratio > 1.03) {
        problems.push({ severity: 'HIGH', type: 'ASPECT_DISTORTION', detail: `background-size=${rec.backgroundSize} scaleX=${scaleX.toFixed(3)} scaleY=${scaleY.toFixed(3)} ratio=${ratio.toFixed(3)} natural=${natW}x${natH}` })
      }
      appendUpscale(problems, rec, (scaleX + scaleY) / 2, 'explicit(' + rec.backgroundSize + ')', natW, natH)
    }
    // mode 'auto' (sprite-sheets ch5 y similares): NO se escala — sin chequeo de upscale/aspecto, por diseño.
  }
  pushGeometryProblems(rec, problems)
  return problems
}

function appendUpscale(problems, rec, effScale, modeLabel, natW, natH) {
  if (effScale === null || !(effScale > 1.01)) return
  const nearestInt = Math.round(effScale)
  const intDelta = Math.abs(effScale - nearestInt)
  if (rec.pixelArt) {
    if (intDelta > 0.05) {
      problems.push({ severity: 'MEDIUM', type: 'UPSCALE_NON_INTEGER', detail: `pixel art, background-size=${modeLabel}, scale=${effScale.toFixed(3)} (no entero). natural=${natW}x${natH} rect=${Math.round(rec.rect.w)}x${Math.round(rec.rect.h)}` })
    }
  } else if (effScale > 1.3) {
    problems.push({ severity: 'LOW', type: 'UPSCALE_BLUR_CANDIDATE', detail: `NO es pixel art, background-size=${modeLabel}, scale=${effScale.toFixed(3)} — candidato a revisión visual. natural=${natW}x${natH} rect=${Math.round(rec.rect.w)}x${Math.round(rec.rect.h)}` })
  }
}

function pushGeometryProblems(rec, problems) {
  if (!rec.visible) return
  if (!rec.inViewport) {
    problems.push({ severity: 'MEDIUM', type: 'OUT_OF_VIEWPORT', detail: `rect=${JSON.stringify(rec.rect)}` })
  }
  if (rec.occluded) {
    problems.push({ severity: 'HIGH', type: 'OCCLUDED', detail: JSON.stringify(rec.occSamples.filter((s) => s.occluded)) })
  }
  if (rec.clips && rec.clips.length > 0) {
    const worst = rec.clips.reduce((a, b) => (a.visibleAreaPct < b.visibleAreaPct ? a : b))
    // 'bg' (divs con background-image) en este sitio son mayoritariamente
    // capas de parallax (ch4-parallax) o fondos full-bleed DELIBERADAMENTE
    // sobredimensionados y recortados por su contenedor con overflow:hidden
    // — es el mecanismo mismo del efecto, no un accidente (mismo patrón que
    // documenta verify-ch6-climax.mjs check C sobre zoom COVER). Un <img>
    // real (asset discreto: bust, GIF, foto de proyecto) SÍ es candidato a
    // "pierde su sujeto" con el mismo % de recorte — la severidad HIGH sólo
    // aplica ahí; en 'bg' se reporta como candidato a revisión (nunca hace
    // fallar el exit code) salvo que se pierda más de la mitad del área.
    let severity
    if (rec.kind === 'img') {
      severity = worst.visibleAreaPct < 90 ? 'HIGH' : 'MEDIUM'
    } else {
      severity = worst.visibleAreaPct < 50 ? 'MEDIUM' : 'LOW'
    }
    // El contenido detrás de un ancestro overflow:scroll|auto (nunca hidden|clip)
    // es alcanzable scrolleando ESE contenedor interno — patrón ya usado a
    // propósito en ch0/ch4/ch5 (ver scripts/verify-ch0-ch4-text-overflow.mjs).
    // Confirmado manualmente (2026-07-30): en ch0 mobile, `.terminal-program-img`
    // media 0% visible al aterrizar en el capítulo, pero tras
    // `.ch0-content.scrollTop = scrollHeight` aparece intacto — no es una
    // pérdida permanente. Se reporta igual (con el rótulo explícito) porque
    // AC5 pide la prueba geométrica, pero se degrada de la severidad dura.
    if (worst.reachableViaScroll) severity = 'LOW'
    problems.push({ severity, type: 'CLIPPED_BY_ANCESTOR', detail: `peor visibleAreaPct=${worst.visibleAreaPct}% reachableViaScroll=${!!worst.reachableViaScroll} :: ${JSON.stringify(rec.clips)}` })
  }
}

// ─────────────────────────────────────────────────────────────────────────
// Bust color-sampling (AC6): ch3 es la referencia visual buena (memoria del
// proyecto). Se navega ch0..ch6, se captura Page.captureScreenshot (Lección
// #3 — nunca canvas.toDataURL) y se muestrea el PNG ya capturado dentro de
// un <canvas> oculto de la propia página. Los puntos de muestra son
// relativos al sub-rect real que `object-fit: contain` despliega dentro de
// los 80×96px del marco (calculado con naturalWidth/naturalHeight reales de
// CADA bust, no asumidos) — así los mismos puntos relativos (pelo arriba,
// ojos medio-alto, mejillas medio-bajo) caen sobre las mismas zonas
// anatómicas en distintos retratos con distinto aspecto de imagen.
// ─────────────────────────────────────────────────────────────────────────
// Fracciones calibradas visualmente (2026-07-30) inspeccionando recortes reales
// de .avatar-bust vía Page.captureScreenshot para ch0/ch3/ch4/ch6: el primer
// intento (mejillas en fx=0.26/0.74) caía sistemáticamente FUERA de la cara,
// sobre el fondo del marco — medía "piel" #edf6fb (casi blanco) en ch3 y
// #090c33 (azul oscuro) en ch0, ninguno de los dos plausible como tono de
// piel. `piel-frente` (línea media vertical, fx=0.5) es el punto más fiable:
// verificado que cae sobre piel real en los 7 bustos. `piel-mejilla` baja
// (fy=0.66) puede caer sobre barba/sombra en los capítulos con barba — se
// reporta igual pero con esa reserva explícita en el hand-off.
const BUST_SAMPLE_POINTS = [
  { label: 'pelo', fx: 0.5, fy: 0.12 },
  { label: 'ojo-izq', fx: 0.4, fy: 0.38 },
  { label: 'ojo-der', fx: 0.6, fy: 0.38 },
  { label: 'piel-frente', fx: 0.5, fy: 0.5 },
  { label: 'piel-mejilla', fx: 0.5, fy: 0.66 },
]

function toHex([r, g, b]) {
  return '#' + [r, g, b].map((v) => Math.round(v).toString(16).padStart(2, '0')).join('')
}

function colorDistance([r1, g1, b1], [r2, g2, b2]) {
  return Math.sqrt((r1 - r2) ** 2 + (g1 - g2) ** 2 + (b1 - b2) ** 2)
}

async function sampleBustAt(cx, base64Png) {
  const script = `
    (async () => {
      const img = new Image();
      const src = 'data:image/png;base64,${base64Png}';
      await new Promise((resolve, reject) => { img.onload = resolve; img.onerror = reject; img.src = src; });
      const canvas = document.createElement('canvas');
      canvas.width = img.naturalWidth; canvas.height = img.naturalHeight;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0);
      const dsf = img.naturalWidth / window.innerWidth;
      const bustImg = document.querySelector('.avatar-bust');
      if (!bustImg) return { ok: false, reason: 'no .avatar-bust' };
      const r = bustImg.getBoundingClientRect();
      const natW = bustImg.naturalWidth, natH = bustImg.naturalHeight;
      if (!natW || !natH) return { ok: false, reason: 'bust naturalWidth/Height=0' };
      const boxAR = r.width / r.height, natAR = natW / natH;
      let cw, ch;
      if (natAR > boxAR) { cw = r.width; ch = r.width / natAR; } else { ch = r.height; cw = r.height * natAR; }
      const cx0 = r.left + (r.width - cw) / 2, cy0 = r.top + (r.height - ch) / 2;
      const points = ${JSON.stringify(BUST_SAMPLE_POINTS)};
      const samples = points.map((p) => {
        const sx = Math.round((cx0 + p.fx * cw) * dsf);
        const sy = Math.round((cy0 + p.fy * ch) * dsf);
        const px = Math.max(0, Math.min(canvas.width - 1, sx));
        const py = Math.max(0, Math.min(canvas.height - 1, sy));
        const d = ctx.getImageData(px, py, 1, 1).data;
        return { label: p.label, rgb: [d[0], d[1], d[2]] };
      });
      return { ok: true, samples, containRect: { cx0, cy0, cw, ch }, natW, natH, boxRect: { x0: r.left, y0: r.top, w: r.width, h: r.height } };
    })()
  `
  const { send } = cx
  const res = await send('Runtime.evaluate', { expression: script, returnByValue: true, awaitPromise: true })
  if (res.exceptionDetails) throw new Error('Eval error: ' + JSON.stringify(res.exceptionDetails))
  return res.result.value
}

async function auditBusts(cx, url) {
  console.log('\n=== E. BUSTS — coherencia piel/pelo/ojos vs ch3 (referencia visual buena) ===')
  await cx.send('Emulation.setDeviceMetricsOverride', { width: 1521, height: 791, deviceScaleFactor: 1, mobile: false })
  await sleep(300)
  await bootToHome(cx, url)
  const perChapter = {}
  for (let n = 0; n <= 6; n++) {
    await jumpToChapter(cx, n)
    await waitImagesSettled(cx)
    const screenshot = await cx.send('Page.captureScreenshot', { format: 'png' })
    const sample = await sampleBustAt(cx, screenshot.data)
    perChapter[n] = sample
    if (!sample.ok) {
      console.log(`ch${n} bust: NO MEDIDO (${sample.reason})`)
      continue
    }
    console.log(`ch${n} bust: natural=${sample.natW}x${sample.natH} ` + sample.samples.map((s) => `${s.label}=${toHex(s.rgb)}`).join(' '))
  }
  const ref = perChapter[3]
  const rows = []
  if (ref && ref.ok) {
    for (let n = 0; n <= 6; n++) {
      if (n === 3) continue
      const cur = perChapter[n]
      if (!cur || !cur.ok) {
        rows.push({ chapter: n, ok: false, reason: cur?.reason ?? 'sin datos' })
        continue
      }
      const deltas = BUST_SAMPLE_POINTS.map((p, i) => {
        const d = colorDistance(cur.samples[i].rgb, ref.samples[i].rgb)
        return { label: p.label, curHex: toHex(cur.samples[i].rgb), refHex: toHex(ref.samples[i].rgb), distance: Math.round(d * 10) / 10 }
      })
      rows.push({ chapter: n, ok: true, deltas })
      console.log(`ch${n} vs ch3: ` + deltas.map((d) => `${d.label} ${d.curHex} vs ${d.refHex} (Δ${d.distance})`).join(' | '))
    }
  } else {
    console.log('ch3 (referencia) NO se pudo medir — sin comparación posible.')
  }
  return { perChapter, rows }
}

// ─────────────────────────────────────────────────────────────────────────
// Main
// ─────────────────────────────────────────────────────────────────────────
const VIEWPORTS = [
  ['1521x791', 1521, 791, 1, false],
  ['1920x912', 1920, 912, 1, false],
  ['390x844-portrait', 390, 844, 3, true],
  ['844x390-landscape', 844, 390, 3, true],
]

async function main() {
  const { cdpPort, url } = parseArgs(process.argv.slice(2))
  const cx = await connect(cdpPort, url)
  await cx.send('Page.enable')
  await cx.send('Runtime.enable')
  await cx.send('DOM.enable')

  const probeCache = new Map() // url -> probe result
  const allFindings = [] // { chapter, viewport, kind, selector, src, severity, type, detail }
  const rawRecordsAll = [] // todo lo evaluado (para el JSON de detalle)
  let highCount = 0

  for (const [vpName, w, h, dsf, mobile] of VIEWPORTS) {
    console.log(`\n\n########## VIEWPORT ${vpName} ##########`)
    await cx.send('Emulation.setDeviceMetricsOverride', { width: w, height: h, deviceScaleFactor: dsf, mobile })
    await sleep(300)
    await bootToHome(cx, url)
    await cx.evaluate(AUDIT_CORE)

    for (let n = 0; n <= 6; n++) {
      const ready = await jumpToChapter(cx, n)
      if (!ready) {
        console.log(`ch${n} [${vpName}]: NO READY — sección nunca montó, se omite auditoría de imágenes`)
        continue
      }
      await waitImagesSettled(cx)
      const raw = await cx.evaluate(`window.__auditImages(${n})`)

      // Probe de background-image no medidos aún (naturalWidth/Content-Type).
      const bgToProbe = raw.filter((r) => r.kind === 'bg' && !probeCache.has(r.src)).map((r) => r.src)
      const uniqueToProbe = [...new Set(bgToProbe)]
      if (uniqueToProbe.length > 0) {
        const probed = await probeUrlsInBrowser(cx, uniqueToProbe)
        for (const u of uniqueToProbe) probeCache.set(u, probed[u])
      }

      let flaggedCount = 0
      for (const rec of raw) {
        const problems = rec.kind === 'img' ? classifyImg(rec) : classifyBg(rec, probeCache.get(rec.src))
        rawRecordsAll.push({ chapter: n, viewport: vpName, ...rec, problems })
        if (problems.length > 0) {
          flaggedCount++
          for (const p of problems) {
            if (p.severity === 'HIGH') highCount++
            allFindings.push({ chapter: n, viewport: vpName, kind: rec.kind, selector: rec.selector, src: rec.src, ...p })
            console.log(`  [${p.severity}] ch${n} [${vpName}] ${rec.kind} ${rec.selector} src=${rec.src} :: ${p.type} :: ${p.detail}`)
          }
        }
      }
      console.log(`ch${n} [${vpName}]: ${raw.length} imágenes evaluadas, ${flaggedCount} marcadas`)
    }
  }

  const bustResult = await auditBusts(cx, url)

  const outPath = path.resolve(__dirname, '..', '.planning', 'task035-image-audit-verify-results.json')
  try {
    fs.writeFileSync(outPath, JSON.stringify({ findings: allFindings, rawRecords: rawRecordsAll, busts: bustResult }, null, 2))
    console.log(`\nResultados detallados escritos en ${outPath}`)
  } catch {
    // best-effort
  }

  console.log(`\n\n=== RESUMEN PRIORIZADO (HIGH primero) ===`)
  const bySeverity = { HIGH: [], MEDIUM: [], LOW: [] }
  for (const f of allFindings) bySeverity[f.severity].push(f)
  for (const sev of ['HIGH', 'MEDIUM', 'LOW']) {
    console.log(`\n-- ${sev} (${bySeverity[sev].length}) --`)
    const byKey = new Map()
    for (const f of bySeverity[sev]) {
      const key = `${f.type}::${f.src}::${f.selector}`
      if (!byKey.has(key)) byKey.set(key, { ...f, viewports: new Set() })
      byKey.get(key).viewports.add(`ch${f.chapter}/${f.viewport}`)
    }
    for (const f of byKey.values()) {
      console.log(`${f.type} :: ${f.kind} ${f.selector} src=${f.src} :: ${f.detail} :: visto en [${[...f.viewports].join(', ')}]`)
    }
  }

  console.log(`\n=== RESULTADO: ${highCount === 0 ? 'CERO defectos HIGH' : highCount + ' defecto(s) HIGH encontrados'} (ver detalle arriba y JSON) ===`)
  cx.ws.close()
  process.exitCode = highCount === 0 ? 0 : 1
}

main().catch((e) => {
  console.error('FATAL', e && e.stack ? e.stack : String(e))
  process.exitCode = 1
})
