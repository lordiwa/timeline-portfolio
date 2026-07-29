<!--
  Chapter5Content.vue — ch5 "LA TRANSMISION" · broadcast anclado en VivoEnVivo (TASK-011).

  Concepto (TASK-011, .planning/design/05-ch5-pandemia-broadcast.md): sala de cine
  (gran hall) vista desde atrás, ahora vestida de SEÑAL EN VIVO en vez de "pixel art
  de época" — badge EN VIVO, scanlines, glitch de compresion procedural y lower-third
  por escena sobre la pantalla, que deja de ser un slideshow generico y pasa a ser la
  transmision propia de VivoEnVivo (la plataforma de streaming de Rafael, 2020-2023).
  El "público" son 125 personajes únicos de pixellab (CAST.length) repartidos por la
  alfombra frente a esa pantalla.

  TEXTO (defecto 1 de TASK-007, resuelto aquí): el antiguo `const showText = false`
  envolvía TODO el bloque de texto en un v-if sin UI para activarlo — innerText medía 0.
  Ese flag se elimina. El texto de bio.eras.5 (8 párrafos reales, ver TASK-011 hand-off
  para el conteo medido — la spec original estimó "180 palabras / 3 párrafos" antes de
  que Rafael entregara el texto final ~4x más largo) vive SIEMPRE en el DOM dentro de
  `.ch5-stream-panel`, un panel lateral de transmisión (sidebar de stream con
  timestamps) — nunca oculto tras interacción, tal como pide el AC.

  FALLBACK DE LAYOUT (spec §4.2): la spec preferia un scroll interno de 200dvh con el
  panel revelado a mitad de scroll (requiere `chapterViewports` en App.vue, mecanismo ya
  construido por TASK-014). Este ticket NO edita App.vue (regla explicita del dispatch:
  "para y consulta antes" — afecta a los 7 capitulos) asi que usa el fallback
  pre-aprobado por la propia spec: la section se queda en 100dvh y el panel monta
  ABIERTO de entrada. Esto ademas cumple el AC de forma mas directa ("sin requerir
  interaccion"). El body del panel es internamente `overflow-y: auto` (mismo mecanismo
  que la spec ya autoriza para el caso de que el feed exceda el alto visible) — se
  reutiliza en mobile portrait tambien, en vez del "crece a su altura natural (>100dvh)"
  de la spec, que si hubiera requerido tocar el shell.

  MULTITUD VIVA (conservada intacta, Rafael 2026-07-07d — TASK-011 SOLO ajusta la
  FOTOGRAFIA sobre ella, nunca el rAF/sheets): cada personaje cambia de ESTADO al azar
  cada 1.5-3s (puede repetir el mismo estado → todos se mueven distinto). Estados:
    idleBack  — quieto de espaldas (norte)
    idleFront — quieto mirando al usuario (sur)
    rotR/rotL — girar a la derecha / izquierda (recorre las 8 direcciones)
    osc       — media vuelta a un lado y media al otro
    festejo   — anim de celebración (6º estado, sheet en anim/), ahora sincronizado con
                un flash de `.cine-screen-light` (spec §2.5)
  Cada personaje usa UNA tira webp combinada (public/assets/ch5-cinema/live/{slug}.webp):
  frames 0-7 = las 8 vistas direccionales (rotación, horario desde norte) + frames 8.. =
  el festejo. Un solo background-image (nunca cambia) → sin titileo. Manifest:
  src/data/ch5CrowdManifest.json {w,h,ff,festStart}. Fuentes PNG (rot/anim) NO se versionan;
  se regeneran gratis desde pixellab (build_rotation_sheets.py + anim_poll.sh) → build_live_sheets.py.

  El render lo maneja UN solo bucle rAF que escribe el DOM directo (no reactividad Vue)
  para no recalcular 140+ nodos por frame.

  TIPOGRAFIA (decision registrada, TASK-011, resuelve el hallazgo del hook `impeccable`
  sobre Inter en el comentario del orchestrator de este ticket): el chrome de broadcast
  (badge EN VIVO, timestamps, contador, lower-third, label de canales) usa `var(--hud-font)`
  — la misma monoespaciada del chasis RAFAEL-OS, cero bytes nuevos — en vez de Inter, que
  es la fuente mas generica posible para un capitulo que debe sentirse un producto de
  streaming propio. El cuerpo del feed (los 8 parrafos reales) se queda en Inter Variable
  vía `var(--font-body)`, tal como fija .planning/design/05-ch5-pandemia-broadcast.md §5
  ("cero fuentes nuevas") — 714-748 palabras de prosa se leen peor en monoespaciada que en
  humanista, y la spec (autoridad estética, Lección 7) ya decidió esto explícitamente.
  Inter Variable NO se retira del bundle en este ticket: hacerlo requiere tocar
  src/main.js + package.json (fuera de la lista blanca de TASK-011); ver hand-off para el
  detalle de ese seguimiento pendiente.
-->
<script setup>
import { computed, ref, inject, watch, onMounted, onBeforeUnmount } from 'vue'
import { useI18n } from 'vue-i18n'
import { chapters } from '@/data/chapters'
import { projects } from '@/data/projects'
import { bio } from '@/data/bio'
import crowdManifest from '@/data/ch5CrowdManifest.json'
import ProjectCard from './ProjectCard.vue'

const { t } = useI18n()

function prefersReducedMotion() {
  return typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches
}

// ─── Slideshow de la pantalla (escenas online/vacías) — cross-fade cada 4.5s ───
const screenScenes = ['box', 'mma', 'concierto', 'lab', 'covid']
const screenIdx = ref(0)
let screenTimer = null

// Color dominante de cada escena: alimenta la luz de pantalla sobre la sala.
// rgb sin alpha — el alpha lo maneja el CSS vía opacity del elemento.
const sceneMeta = [
  { glowColor: [220, 155, 55] },   // box      — calidez ámbar de arena
  { glowColor: [205, 70, 40] },    // mma      — rojo anaranjado del octágono
  { glowColor: [140, 55, 215] },   // concierto — púrpura de stage
  { glowColor: [75, 195, 225] },   // lab       — cian frío de laboratorio
  { glowColor: [55, 85, 205] },    // covid     — azul frío de aislamiento
]

// Fondo computed de .cine-screen-light — cambia con el slideshow.
// Reemplaza el radial-gradient hardcodeado en CSS para que el color se adapte
// a la escena activa. Sin transition aquí: el overlay es tan sutil (opacity ~0.07)
// que el cambio de color es imperceptible; la continuidad visual la dan las
// pantallas cruzadas que se solapan durante 1s.
const screenGlowStyle = computed(() => {
  const m = sceneMeta[screenIdx.value]
  if (!m) return {}
  const [r, g, b] = m.glowColor
  return {
    background: `radial-gradient(ellipse 45% 55% at 50% 40%, rgba(${r},${g},${b},0.9) 0%, rgba(${r},${g},${b},0.5) 38%, transparent 70%)`,
  }
})

const chapter = chapters[5]
const ch5Projects = computed(() => projects.filter((p) => p.chapterEra === 5))
const bioParagraphs = computed(() => t(bio.eras[chapter.id].textKey).split('\n\n'))

// Panel de transmisión (spec §4, TASK-011) — feed con timestamp por párrafo real de
// bio.eras.5. Los timestamps son i18n keys chapters.5.panel.feed.t{N} (solo años/rangos,
// idénticos en ES/EN — no requieren traducción pero viven en i18n por si Rafael los
// ajusta junto al contenido). Si algún día bio.eras.5 gana/pierde párrafos, el `|| ''`
// evita un timestamp roto en vez de reventar el render.
const FEED_TIMESTAMP_KEYS = ['t0', 't1', 't2', 't3', 't4', 't5', 't6', 't7']
const feedEntries = computed(() =>
  bioParagraphs.value.map((text, idx) => ({
    text,
    timestamp: t(`chapters.5.panel.feed.${FEED_TIMESTAMP_KEYS[idx] ?? 't0'}`) || '',
  }))
)

// Grade unificador de sala (spec §2, punto 1): un solo overlay soft-light sobre TODA
// la multitud, coloreado con el mismo glowColor que ya usa screenGlowStyle — así las
// 125 paletas de personajes se subordinan a UNA sola luz (la de la pantalla) en vez de
// competir entre sí. alpha 0.35 fija (spec); el color cambia con el slideshow (transition
// CSS de background-color, ver <style>).
const crowdGradeStyle = computed(() => {
  const m = sceneMeta[screenIdx.value]
  if (!m) return {}
  const [r, g, b] = m.glowColor
  return { backgroundColor: `rgba(${r},${g},${b},0.35)` }
})

// Chrome de broadcast: lower-third por escena (spec §3.3) + glitch de compresión al
// cambiar de escena (spec §3.2) + flash de pantalla sincronizado al festejo (spec §2.5).
// Los tres respetan prefers-reduced-motion (spec §6): bajo PRM, lower-third queda
// estático (CSS media query), glitch y flash directamente no se disparan (early-return
// aquí, no solo un "sin animación" cosmético — cero clase, cero repintado extra).
const lowerThirdText = computed(() => t(`chapters.5.broadcast.${screenScenes[screenIdx.value]}`))
const isGlitch = ref(false)
const flashActive = ref(false)
let glitchTimer = null
let flashTimer = null

function triggerGlitch() {
  if (prefersReducedMotion()) return
  isGlitch.value = true
  clearTimeout(glitchTimer)
  glitchTimer = setTimeout(() => {
    isGlitch.value = false
  }, 140)
}

// Público: 125 personajes únicos de pixellab (25 beat-em-up + 100 temáticos).
const CAST = [
  'all-around', 'player-brawler', 'bboy-skater', 'bboy-kungfu', 'ninja',
  'zoner', 'female-1', 'female-2', 'female-3', 'balanced',
  'tank', 'grappler', 'warden', 'charger', 'shield-drone',
  'empire-drone', 'idle-a', 'attack1', 'walk-a', 'idle-b',
  'fighter', 'flyer', 'monk', 'eyeball', 'monitor-frame',
  'pulga-gigante', 'centauro-reversa', 'androide-hippie', 'simio-terno', 'mono-terno',
  'alce-terno', 'pulpo-bibliotecario', 'cactus-samurai', 'tiburon-oficinista', 'gato-astronauta',
  'rana-predicadora', 'buho-detective', 'zombi-vegetariano', 'mantis-evangelista', 'cangrejo-boxeador',
  'sapo-opera', 'nutria-pirata', 'cebra-codigobarras', 'pavo-real', 'gel-musculoso',
  'dona-cuarentena', 'papel-coronado', 'jeringa-ninja', 'canguro-grappler', 'gallo-striker',
  'rinoceronte-noqueador', 'cannabis-guardian', 'planta-rasta', 'semilla-bebe', 'robot-jardinero',
  'zanahoria-musculosa', 'aguila-alturas', 'ornitorrinco-espia', 'lemur-raver', 'zorro-broker',
  'flamenco-yoga', 'camello-dj', 'leon-karaoke', 'gorila-muaythai', 'tejon-enmascarado',
  'avestruz-kickboxer', 'tortuga-sumo', 'hoja-surfista', 'vacuna-heroe', 'pinata-andante',
  'cerebro-graduado', 'dado-suerte', 'medusa-ballet', 'oso-pesado', 'taco-mariachi',
  'aguacate-galan', 'alpaca-influencer', 'ardilla-culturista', 'bisonte-motero', 'bong-jazz',
  'brownie-relajado', 'cabra-metalera', 'cactus-disco', 'camaleon-influencer', 'cerdo-banquero',
  'champinon-copa', 'cogollo-boxeador', 'cubrebocas-justiciero', 'dragon-vegano', 'erizo-punk',
  'escarabajo-aristocrata', 'esqueleto-dj', 'estrella-fugaz', 'fantasma-fiestero', 'foca-comediante',
  'girasol-vampiro', 'globo-helio', 'grinder-breakdancer', 'guante-mimo', 'hipopotamo-tango',
  'iguana-rockera', 'koala-insomne', 'loro-poliglota', 'mapache-gourmet', 'maria-diva',
  'masa-madre', 'momia-pijama', 'muela-rey', 'murcielago-barista', 'nube-paraguas',
  'panda-contador', 'pez-globo-ansioso', 'pinguino-luchador', 'pizza-rockera', 'porro-aventurero',
  'qr-menu', 'robot-serpentinas', 'sombrero-mago', 'suricata-paranoico', 'termometro-ansioso',
  'toro-octagono', 'tucan-reggaeton', 'virus-rockstar', 'volcan-hawaiano', 'yeti-solar',
]

const NRINGS = 11

// PRNG determinista (mulberry32) → dispersión estable entre renders (el LAYOUT no baila;
// la ANIMACIÓN sí es aleatoria en runtime, ver abajo).
function mulberry32(a) {
  return function () {
    a |= 0
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

// Bolsa barajada anti-repetición: reparte cada personaje ⌊N/U⌋..⌈N/U⌉ veces (dif. máx 1).
function makeBag(items, rng) {
  let pool = []
  return () => {
    if (pool.length === 0) {
      pool = items.slice()
      for (let i = pool.length - 1; i > 0; i--) {
        const j = (rng() * (i + 1)) | 0
        const tmp = pool[i]
        pool[i] = pool[j]
        pool[j] = tmp
      }
    }
    return pool.pop()
  }
}

// Enjambre radial hacia la pantalla, pero MÁS SEPARADO y RETROCEDIDO de la pantalla
// (Rafael 2026-07-07d: "los muy cercanos a la pantalla retrocédelos; acomódalos aleatorios
// dentro de la alfombra y atrás y abajo del escenario; puedes separarlos más").
function buildCrowd() {
  const rng = mulberry32(0x5ce07)
  const draw = makeBag(CAST, rng)
  const Fx = 50
  const Fy = 52 // foco más abajo → banda retrocede de la pantalla
  const out = []
  for (let i = 0; i < NRINGS; i++) {
    const t = NRINGS === 1 ? 0 : i / (NRINGS - 1) // 0 interior (pantalla) .. 1 exterior (cámara)
    const rx = 11 + t * 27 // radio horiz %: más ancho → más separación lateral
    const ry = 13 + t * 40 // radio vert %
    const halfA = ((42 + t * 20) * Math.PI) / 180 // abanico más abierto
    const baseH = 28 + t * 104
    // TASK-011 spec §2 punto 2: rango de brillo cinematográfico 0.42-0.68 (antes
    // 0.5-1.0) — nadie a plena luz en un cine; la MASA se lee más que el detalle.
    const bright = 0.42 + t * 0.26
    const count = Math.max(8, Math.round(9 + 13 * (1 - t))) // algo menos denso → separados
    for (let c = 0; c < count; c++) {
      const aFrac = count === 1 ? 0.5 : c / (count - 1)
      const ang = (aFrac - 0.5) * 2 * halfA + (rng() - 0.5) * halfA * 0.42
      const rj = 1 + (rng() - 0.5) * 0.28
      let x = Fx + rx * rj * Math.sin(ang) + (rng() - 0.5) * 7
      let y = Fy + ry * rj * Math.cos(ang)
      y = Math.min(104, Math.max(63, y)) // clamp: nadie pegado a la pantalla (min 63), llega al borde
      // Clamp TRAPEZOIDAL a la alfombra: el ancho permitido se angosta hacia el fondo
      // (el hall es más angosto atrás y ahí hay MUEBLES). Evita que nadie "flote" sobre
      // las mesas/sofás laterales (Rafael 2026-07-07: "canguro flotando sobre una mesa").
      const yNorm = (y - 63) / 41 // 0 atrás .. 1 adelante
      const halfW = 24 + yNorm * 20 // semiancho: 24% atrás → 44% adelante
      x = Math.min(50 + halfW, Math.max(50 - halfW, x))
      // TASK-011 spec §2 punto 3: jitter de tamaño contenido 0.85-1.15 (antes
      // 0.66-1.30) — la perspectiva la dan los anillos (baseH ya crece con t), no el
      // random; menos "canguro gigante junto a hormiga".
      const sizeMul = 0.85 + rng() * 0.3
      const slug = draw()
      out.push({
        slug,
        x,
        y,
        h: baseH * sizeMul,
        z: Math.round(y * 100),
        bright: Math.min(1, bright + (rng() - 0.5) * 0.12),
        seed: (rng() * 1e9) | 0, // semilla de desfase de la animación
      })
    }
  }
  return out
}

const seats = buildCrowd()

// Guard de dev: ratio de repetición.
if (import.meta.env?.DEV) {
  const ratio = seats.length / CAST.length
  console.assert(
    ratio <= 1.8,
    `[ch5] ratio de repetición ${ratio.toFixed(2)} > 1.8 — subí el CAST (${CAST.length}) o bajá asientos (${seats.length}).`,
  )
}

// ─────────────── Oleada de festejo reactiva a la pantalla ───────────────────
// Se llama cada vez que el slideshow avanza de escena. Selecciona ~38% de la
// multitud al azar y les dispara el estado festejo con delays escalonados por
// profundidad: los más cerca de la pantalla (y mínima) reaccionan primero.
// Solo interrumpe personajes en fase 'rest'; respeta prefers-reduced-motion.
let waveTimers = []

function triggerCelebrationWave() {
  if (!runtime.length) return
  if (prefersReducedMotion()) return
  // TASK-011 spec §2 punto 5: flash de pantalla sincronizado al festejo — conecta
  // causa (la pantalla) y efecto (el público reacciona) para que la escena gane
  // lógica interna. `.is-flash` sube la opacity de .cine-screen-light 600ms.
  flashActive.value = true
  clearTimeout(flashTimer)
  flashTimer = setTimeout(() => {
    flashActive.value = false
  }, 600)
  // Baraja y toma ~38% de la multitud
  const picks = runtime.slice().sort(() => Math.random() - 0.5)
    .slice(0, Math.round(runtime.length * 0.38))
  const minY = 63, maxY = 104, maxDelay = 720
  picks.forEach((c) => {
    // yNorm 0 = cerca de pantalla (fila delantera), 1 = cerca de cámara (fila trasera)
    const yNorm = Math.max(0, Math.min(1, (c.seat.y - minY) / (maxY - minY)))
    const delay = yNorm * maxDelay // delantera reacciona primero (delay ≈ 0ms)
    const t = setTimeout(() => {
      if (c.phase === 'rest') {
        c.phase = 'act'
        c.state = 'festejo'
        c.fFrame = 0
        c.fAcc = 0
      }
    }, delay)
    waveTimers.push(t)
  })
}

// Estilo base de cada personaje (parte estática; el frame lo mueve el bucle rAF).
// UNA sola tira webp por personaje (rot 0-7 + festejo 8..) → el background-image NUNCA
// cambia, solo se mueve background-position-x (elimina el titileo del swap de imagen).
function seatBaseStyle(seat) {
  const m = crowdManifest[seat.slug]
  if (!m) return {}
  const k = seat.h / m.h
  return {
    left: seat.x + '%',
    top: seat.y + '%',
    width: m.w + 'px',
    height: m.h + 'px',
    backgroundImage: `url(/assets/ch5-cinema/live/${seat.slug}.webp)`,
    transform: `translate(-50%, -100%) scale(${k})`,
    zIndex: seat.z,
    filter: `brightness(${seat.bright}) drop-shadow(0 3px 2px rgba(0,0,0,0.6))`,
  }
}

// ─────────────── Máquina de estados de la multitud (runtime, no reactivo) ───────────────
const audienceRef = ref(null)
let rafId = null
let runtime = [] // por asiento: estado + facing continuo; se muta y escribe al DOM

// TASK-017: gate por capítulo activo — mismo patrón que Ch4PortalShader.vue /
// Chapter4Content.vue (watch sobre activeChapter con immediate arranca/para el
// loop). Antes el rAF de tick() + el setInterval del slideshow corrían SIEMPRE
// desde el mount, sin importar en qué capítulo estuviera el visitante — 125
// personajes * tick() por frame es el costo dominante medido en el techo
// global de fps (ch0 en reposo ~47.7fps vs ~60 de pestaña en blanco). Fallback
// ref(-1) (no scrollState inyectado, p.ej. tests aislados) → el loop NO
// arranca, igual que Chapter4Content.vue/Ch4PortalShader.vue.
const injectedScrollState = inject('scrollState', null)
const activeChapter = injectedScrollState?.activeChapter ?? ref(-1)
let stopChapterWatcher = null

const STATES = ['idleBack', 'idleFront', 'rotR', 'rotL', 'osc', 'festejo']

function rand(seed) {
  // solo para inicialización determinista; el runtime usa Math.random
  const r = mulberry32(seed)
  return r()
}

// Modelo acción→reposo (Rafael 2026-07-07d: "ejecutar la animación UNA vez, esperar el
// tiempo, y ejecutar otra"). Cada personaje: fase 'act' = ejecuta UN gesto una sola vez;
// al terminar pasa a 'rest' = quieto en la pose final durante 1.5–3s; luego elige otro.
function pickAction(c) {
  c.phase = 'act'
  c.state = STATES[(Math.random() * STATES.length) | 0] // uniforme, puede repetir
  if (c.state === 'idleBack') {
    c.target = 0 // gira a quedar de espaldas y se queda
  } else if (c.state === 'idleFront') {
    c.target = 4 // gira a mirar al usuario y se queda
  } else if (c.state === 'rotR') {
    c.sign = 1
    c.turnRem = 4 // media vuelta (180°) a la derecha, una vez
  } else if (c.state === 'rotL') {
    c.sign = -1
    c.turnRem = 4 // media vuelta a la izquierda, una vez
  } else if (c.state === 'osc') {
    c.sign = 1
    c.turnRem = 4 // media vuelta a un lado…
    c.oscPhase = 0 // …y luego media vuelta al otro (vuelve al inicio)
  } else if (c.state === 'festejo') {
    c.fFrame = 0
    c.fAcc = 0 // reproduce el ciclo de festejo UNA vez
  }
}

function finishAction(c, now) {
  c.phase = 'rest'
  c.restUntil = now + 1500 + Math.random() * 1500 // espera 1.5–3s quieto
  if (c.state === 'festejo') {
    // tras festejar vuelve al sprite de rotación mirando de espaldas (norte)
    c.state = 'idleBack'
    c.dir = 0
  }
}

// Giro por el camino más corto (solo para idle: llegar a target y parar).
function seekDone(c, dt) {
  let diff = (((c.target - c.dir) % 8) + 12) % 8
  if (diff > 4) diff -= 8
  const step = c.turn * dt
  if (Math.abs(diff) <= step) {
    c.dir = c.target
    return true
  }
  c.dir = (c.dir + Math.sign(diff) * step + 8) % 8
  return false
}

function renderChar(c) {
  const m = c.m
  // Una sola tira: frames 0-7 = rotación (dir), festStart+.. = festejo. Solo movemos
  // background-position-x (sin cambiar background-image ni tamaño → sin titileo).
  const frame =
    c.state === 'festejo' ? m.festStart + c.fFrame : ((Math.round(c.dir) % 8) + 8) % 8
  if (frame !== c.lastFrame) {
    c.el.style.backgroundPositionX = `-${frame * m.w}px`
    c.lastFrame = frame
  }
}

function tick(now) {
  for (const c of runtime) {
    const dt = Math.min(0.05, (now - c.t) / 1000) // clamp dt (evita saltos tras tab oculto)
    c.t = now

    if (c.phase === 'rest') {
      if (now >= c.restUntil) pickAction(c) // terminó la espera → nuevo gesto
      renderChar(c)
      continue // en reposo NO se mueve (queda quieto en la pose)
    }

    // fase 'act': ejecuta el gesto UNA vez; al completarlo pasa a reposo
    const step = c.turn * dt
    switch (c.state) {
      case 'idleBack':
      case 'idleFront':
        if (seekDone(c, dt)) finishAction(c, now)
        break
      case 'rotR':
      case 'rotL': {
        const adv = Math.min(step, c.turnRem)
        c.dir = (c.dir + c.sign * adv + 8) % 8
        c.turnRem -= adv
        if (c.turnRem <= 1e-4) finishAction(c, now)
        break
      }
      case 'osc': {
        const adv = Math.min(step, c.turnRem)
        c.dir = (c.dir + c.sign * adv + 8) % 8
        c.turnRem -= adv
        if (c.turnRem <= 1e-4) {
          if (c.oscPhase === 0) {
            c.oscPhase = 1 // segunda media vuelta, al otro lado
            c.sign = -c.sign
            c.turnRem = 4
          } else {
            finishAction(c, now)
          }
        }
        break
      }
      case 'festejo':
        c.fAcc += dt
        while (c.fAcc >= 1 / c.fFps) {
          c.fFrame += 1
          c.fAcc -= 1 / c.fFps
          if (c.fFrame >= c.m.ff) {
            // ciclo completo una vez → reposo
            finishAction(c, now)
            break
          }
        }
        break
    }
    renderChar(c)
  }
  rafId = requestAnimationFrame(tick)
}

// startCrowdLoop/stopCrowdLoop — arrancados/parados por el watch de
// activeChapter (abajo), NUNCA desde onMounted directo (TASK-017).
// screenTimer (slideshow) corre incluso bajo PRM (igual que antes: solo el
// tick() de la máquina de estados se salta, la pantalla del cine sigue
// cicleando) — se conserva el comportamiento previo, solo se gatea POR CAPÍTULO.
function startCrowdLoop() {
  if (rafId || screenTimer) return // ya corriendo (guard doble-start del watch immediate)
  screenTimer = setInterval(() => {
    screenIdx.value = (screenIdx.value + 1) % screenScenes.length
    // TASK-011 spec §3.2: glitch de compresión procedural en cada cambio de escena.
    triggerGlitch()
    // Tras el cambio de escena, la multitud reacciona: oleada de festejo por profundidad.
    triggerCelebrationWave()
  }, 4500)

  if (!prefersReducedMotion()) rafId = requestAnimationFrame(tick)
}

function stopCrowdLoop() {
  if (screenTimer) {
    clearInterval(screenTimer)
    screenTimer = null
  }
  if (rafId) {
    cancelAnimationFrame(rafId)
    rafId = null
  }
  waveTimers.forEach((t) => clearTimeout(t))
  waveTimers = []
  clearTimeout(glitchTimer)
  clearTimeout(flashTimer)
  isGlitch.value = false
  flashActive.value = false
}

onMounted(() => {
  // Init del runtime (estado inicial por asiento) — one-shot, no es un loop.
  // Se hace siempre en mount (no gateado): los 7 capítulos están SIEMPRE en
  // el DOM (ver ScrollShell.vue), así que .cine-char-live ya existe aunque
  // ch5 no sea el capítulo activo. Al re-entrar a ch5 el estado de cada
  // personaje se retoma donde quedó (no se reinicializa) — startCrowdLoop
  // solo retoma el rAF/interval, no reconstruye `runtime`.
  const root = audienceRef.value
  if (root) {
    const els = root.querySelectorAll('.cine-char-live')
    const now = typeof performance !== 'undefined' ? performance.now() : 0
    runtime = []
    els.forEach((el) => {
      const idx = Number(el.dataset.idx)
      const seat = seats[idx]
      const m = crowdManifest[seat.slug]
      if (!m) return
      const c = {
        el,
        seat,
        slug: seat.slug,
        m,
        dir: 0, // 0 = norte (de espaldas)
        state: 'idleBack',
        phase: 'rest', // arranca quieto…
        restUntil: now + rand(seat.seed ^ 0x9e3779b9) * 2500, // …con espera inicial escalonada
        target: 0,
        sign: 1,
        turnRem: 0,
        oscPhase: 0,
        turn: 3 + rand(seat.seed) * 1.6, // 3–4.6 dir/s (giro calmado, cada quien distinto)
        fFrame: 0,
        fAcc: 0,
        fFps: 9 + rand(seat.seed ^ 0x1234) * 3, // 9–12 fps de festejo
        lastFrame: -1,
        t: now,
      }
      runtime.push(c)
    })
  }

  stopChapterWatcher = watch(
    activeChapter,
    (v) => { v === 5 ? startCrowdLoop() : stopCrowdLoop() },
    { immediate: true },
  )
})

onBeforeUnmount(() => {
  stopChapterWatcher?.()
  stopCrowdLoop()
})
</script>

<template>
  <div class="ch5-layout ch5-cine">
    <!-- Escena (pantalla + público + luces): wrapper propio para poder comprimirla a
         un "player" en mobile portrait sin tocar el % de posicionamiento interno de
         cada pieza (TASK-011 §4.3) — todas siguen posicionadas en % relativas a ESTE
         contenedor, así que "encoger la escena" es tan simple como cambiar su altura. -->
    <div class="ch5-scene">
      <!-- Pantalla del cine: ya NO es un slideshow generico, es LA TRANSMISION de
           VivoEnVivo — chrome de broadcast (spec §3) encima del cross-fade existente. -->
      <div class="cine-screen" :class="{ 'is-glitch': isGlitch }" aria-hidden="true">
        <img
          v-for="(scene, i) in screenScenes"
          :key="scene"
          class="cine-screen-img"
          :class="{ 'is-active': i === screenIdx }"
          :src="`/assets/ch5-cinema/screen/${scene}.webp`"
          alt=""
        />
        <div class="cine-screen-scanlines"></div>
        <div class="cine-screen-vignette"></div>
        <p class="cine-screen-badge"><span class="cine-screen-dot"></span>{{ t('chapters.5.panel.liveBadge') }}</p>
        <div class="cine-screen-signal"></div>
      </div>

      <!-- Público VIVO: cada asiento con manifest usa el <div> animado por el bucle rAF;
           los que (aún) no tengan sheets caen a <img> estático de espaldas (fallback).

           Hallazgo de diseño revisado (TASK-011, hook impeccable "broken-image" sobre
           este <img>): verificado con evidencia, no descartado a ojo. El `:src` es un
           template literal dinámico (`/assets/ch5-cinema/${seat.slug}.png`), no un src
           vacío/placeholder — pero además se midió que la rama v-else HOY nunca se
           ejecuta: los 125 slugs de CAST tienen entrada en ch5CrowdManifest.json (0
           faltantes) Y las 125 imágenes PNG de fallback existen en
           public/assets/ch5-cinema/*.png (conteo verificado). Es una rama defensiva
           viva que funcionaría correctamente si algún día un slug perdiera su entrada
           de manifest, no una imagen rota real para ningún visitante hoy. -->
      <div ref="audienceRef" class="cine-audience" aria-hidden="true">
        <template v-for="(seat, idx) in seats" :key="idx">
          <div
            v-if="crowdManifest[seat.slug]"
            class="cine-char-live"
            :data-idx="idx"
            :style="seatBaseStyle(seat)"
          />
          <img
            v-else
            class="cine-char"
            :src="`/assets/ch5-cinema/${seat.slug}.png`"
            alt=""
            :style="{
              left: seat.x + '%',
              top: seat.y + '%',
              height: seat.h + 'px',
              zIndex: seat.z,
              filter: `brightness(${seat.bright}) drop-shadow(0 3px 2px rgba(0,0,0,0.6))`,
            }"
          />
        </template>
      </div>

      <!-- Grade unificador de sala (spec §2.1): una sola luz de sala (la de la pantalla)
           sobre las 125 paletas de la multitud, en vez de que compitan entre sí. -->
      <div class="cine-crowd-grade" aria-hidden="true" :style="crowdGradeStyle"></div>

      <!-- Cono de luz del proyector — haz azul-blanco desde la cabina hacia la pantalla.
           clip-path triangular: estrecho abajo (cabina ~50%, 89%) → ancho arriba (pantalla ~43-57%, 40%).
           Parpadeo irregular a 7.3 s; estático bajo prefers-reduced-motion. -->
      <div class="cine-projector-cone" aria-hidden="true">
        <!-- Motas de polvo flotando dentro del haz -->
        <span class="cine-dust"></span>
        <span class="cine-dust"></span>
        <span class="cine-dust"></span>
        <span class="cine-dust"></span>
        <span class="cine-dust"></span>
      </div>

      <!-- Baño de luz de la pantalla sobre la sala — radial desde la zona de pantalla.
           Color dinámico: cada escena del slideshow aporta su tinte dominante (sceneMeta).
           Respira cada 5 s simulando cambio de brillo del contenido on-screen; sube de
           opacity 600ms cuando la multitud festeja (spec §2.5). -->
      <div
        class="cine-screen-light"
        :class="{ 'is-flash': flashActive }"
        aria-hidden="true"
        :style="screenGlowStyle"
      ></div>

      <!-- Lower-third (spec §3.3): identifica QUÉ transmite la pantalla, por escena. -->
      <Transition name="ch5-lower-third">
        <p :key="screenIdx" class="ch5-lower-third" aria-hidden="true">{{ lowerThirdText }}</p>
      </Transition>
    </div>

    <!-- Panel de transmisión (spec §4, TASK-011): mata `showText = false`. Montado
         SIEMPRE en el DOM, sin depender de scroll ni click — el innerText nunca es 0.
         Fallback de layout (ver comentario de cabecera): abierto de entrada, ancho
         clamp(300px, 32vw, 420px) en vez del scroll-reveal de 200dvh que pide la spec. -->
    <aside class="ch5-stream-panel">
      <header class="ch5-panel-header">
        <p class="ch5-panel-badge">
          <span class="ch5-panel-dot" aria-hidden="true"></span>
          {{ t('chapters.5.panel.liveBadge') }}
          <span class="ch5-panel-year">{{ chapter.year }}</span>
        </p>
        <h1 class="ch5-panel-title">{{ t(chapter.titleKey) }}</h1>
        <p class="ch5-panel-viewers">{{ t('chapters.5.panel.viewers', { count: seats.length }) }}</p>
      </header>

      <div class="ch5-panel-body">
        <ul class="ch5-feed">
          <li v-for="(entry, idx) in feedEntries" :key="idx" class="ch5-feed-item">
            <span class="ch5-feed-timestamp">[{{ entry.timestamp }}]</span>
            <p class="ch5-feed-text">{{ entry.text }}</p>
          </li>
        </ul>

        <div v-if="ch5Projects.length > 0" class="ch5-channels">
          <p class="ch5-channels-label">{{ t('chapters.5.panel.channelsLabel') }}</p>
          <div class="ch5-channels-grid">
            <ProjectCard v-for="project in ch5Projects" :key="project.id" :project="project" />
          </div>
        </div>
      </div>
    </aside>
  </div>
</template>

<style scoped>
/* ─────────────────────────────────────────────────────────────
 * .ch5-cine — sala de cine oscura
 * ───────────────────────────────────────────────────────────── */
.ch5-cine {
  position: relative;
  width: 100%;
  height: 100vh;
  height: 100dvh;
  max-height: 100dvh;
  /* clip, no hidden (Lección técnica #1 del proyecto): recorta igual pero no crea
     scroll container — inofensivo aquí (sin descendientes sticky) pero es el default
     seguro del proyecto tras 6 apariciones del bug contrario. */
  overflow: clip;
  box-sizing: border-box;
  background:
    linear-gradient(rgba(4, 4, 10, 0.28), rgba(4, 4, 10, 0.5)),
    url('/assets/ch5-cinema/bg-hall-v3.webp') center / cover no-repeat,
    #04040a;
}

/* ch5-scene — wrapper de la escena (pantalla + público + luces). Desktop: full-bleed
   detrás del panel de transmisión (§ch5-stream-panel). Mobile portrait: comprimido a
   un "player" fijo arriba (media query al final del archivo) — como todo lo de adentro
   se posiciona en %, encogerlo es solo cambiar la altura de ESTE contenedor. */
.ch5-scene {
  position: absolute;
  inset: 0;
}

/* Pantalla: superpuesta sobre la pantalla pintada del hall. Slideshow de escenas.
   TASK-011: deja de ser un slideshow genérico y gana chrome de broadcast (badge,
   scanlines, viñeta, barra de señal) + glitch de compresión en cada cambio de escena. */
.cine-screen {
  position: absolute;
  top: 38%;
  left: 50%;
  transform: translateX(-50%);
  width: min(17vw, 300px);
  aspect-ratio: 16 / 9;
  background: #04040a;
  border-radius: 2px;
  overflow: hidden;
  box-shadow:
    0 0 60px 16px rgba(255, 255, 255, 0.25),
    0 0 150px 44px rgba(180, 200, 255, 0.12);
  z-index: 0;
}
.cine-screen-img {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
  image-rendering: pixelated;
  opacity: 0;
  transition: opacity 1s ease-in-out;
}
.cine-screen-img.is-active {
  opacity: 1;
}

/* Chrome de broadcast dentro de la pantalla (spec §3.1) */
.cine-screen-scanlines {
  position: absolute;
  inset: 0;
  z-index: 2;
  pointer-events: none;
  background: repeating-linear-gradient(0deg, rgba(0, 0, 0, 0.14) 0 1px, transparent 1px 3px);
  opacity: 0.5;
}
.cine-screen-vignette {
  position: absolute;
  inset: 0;
  z-index: 2;
  pointer-events: none;
  background: radial-gradient(ellipse at center, transparent 55%, rgba(0, 0, 0, 0.45) 100%);
}
.cine-screen-badge {
  position: absolute;
  top: 4px;
  left: 4px;
  z-index: 3;
  margin: 0;
  display: flex;
  align-items: center;
  gap: 3px;
  padding: 1px 4px;
  border-radius: 4px;
  background: #d92626;
  color: #fff;
  font-family: var(--hud-font);
  font-size: 7px;
  font-weight: 700;
  line-height: 1.4;
  letter-spacing: 0.05em;
  text-transform: uppercase;
}
.cine-screen-dot {
  width: 4px;
  height: 4px;
  border-radius: 50%;
  background: #fff;
  animation: ch5-badge-pulse 2s ease-in-out infinite;
}
.cine-screen-signal {
  position: absolute;
  left: 0;
  right: 0;
  bottom: 0;
  height: 2px;
  z-index: 3;
  background: linear-gradient(90deg, #818cf8, rgba(129, 140, 248, 0.3), #818cf8);
  background-size: 200% 100%;
  animation: cine-signal-shimmer 6s linear infinite;
}

/* Glitch de compresión (spec §3.2): 140ms, procedural, cero assets. */
.cine-screen.is-glitch {
  animation: cine-glitch 140ms steps(3);
}

/* Tenue "cono de luz" de la pantalla hacia el público */
.cine-audience::before {
  content: '';
  position: absolute;
  inset: 0;
  background: radial-gradient(60% 55% at 50% 18%, rgba(200, 215, 255, 0.1), transparent 70%);
  pointer-events: none;
  z-index: 0;
}

.cine-audience {
  position: absolute;
  inset: 0;
  /* Desaturación leve global (spec §2 punto 4): el color pleno queda reservado a la
     pantalla; estático, sin costo por frame. */
  filter: saturate(0.82);
}

/* Grade unificador de sala (spec §2 punto 1): subordina las 125 paletas de la
   multitud a UNA sola luz (la de la escena activa) — z-index encima del público
   (max z ~10400) pero debajo del cono/luz de pantalla. */
.cine-crowd-grade {
  position: absolute;
  inset: 0;
  z-index: 10450;
  pointer-events: none;
  mix-blend-mode: soft-light;
  transition: background-color 800ms ease;
}

/* Sprite estático de fallback (sin sheets) — de espaldas */
.cine-char {
  position: absolute;
  transform: translate(-50%, -100%);
  width: auto;
  image-rendering: pixelated;
  -webkit-user-select: none;
  user-select: none;
  pointer-events: none;
}

/* Sprite VIVO: UNA tira webp por personaje (rot 0-7 + festejo). El bucle rAF solo mueve
   background-position-x (frame); el anclaje por los PIES lo da transform-origin 50% 100%. */
.cine-char-live {
  position: absolute;
  background-repeat: no-repeat;
  background-position: 0 0;
  image-rendering: pixelated;
  transform-origin: 50% 100%;
  -webkit-user-select: none;
  user-select: none;
  pointer-events: none;
}

/* ─────────────────────────────────────────────────────────────
 * Overlays atmosféricos de cine
 * ───────────────────────────────────────────────────────────── */

/* === Cono de luz del proyector ===
   Forma triangular estrecha en la cabina (abajo-centro) y ancha en la pantalla (arriba).
   El gradiente desvanece la luz en los extremos del haz.
   z-index 10500 → flota sobre todos los personajes (max z ~10400). */
.cine-projector-cone {
  position: absolute;
  inset: 0;
  pointer-events: none;
  z-index: 10500;
  background: linear-gradient(
    to top,
    transparent 0%,
    rgba(190, 210, 255, 0.65) 35%,
    rgba(205, 225, 255, 0.95) 68%,
    rgba(215, 235, 255, 0.5) 100%
  );
  /* Cono: base estrecha en cabina (≈48-52% en y 89%) → apertura pantalla (≈43-57% en y 40%) */
  clip-path: polygon(43% 40%, 57% 40%, 52% 89%, 48% 89%);
  opacity: 0.09;
  animation: projector-flicker 7.3s linear infinite;
}

/* === Baño de luz de pantalla sobre la sala ===
   Gradiente radial centrado en la posición de la pantalla (50% 40%).
   El background se inyecta via :style binding computado (screenGlowStyle) para que
   el color cambie con el slideshow activo (sceneMeta). No hay background aquí.
   Respira suavemente simulando el cambio de brillo del contenido on-screen. */
.cine-screen-light {
  position: absolute;
  inset: 0;
  pointer-events: none;
  z-index: 10499;
  opacity: 0.06;
  animation: screen-breathe 5s ease-in-out infinite;
  transition: opacity 300ms ease;
}

/* Flash sincronizado al festejo (spec §2 punto 5): pausa la respiración normal y
   sube la opacity 600ms — conecta causa (pantalla) y efecto (multitud) en la escena.
   Gateado en JS (triggerCelebrationWave hace early-return bajo PRM), nunca se dispara
   con prefers-reduced-motion activo. */
.cine-screen-light.is-flash {
  animation: none;
  opacity: 0.18;
}

/* Lower-third (spec §3.3): identifica qué transmite la pantalla, cross-fade al
   cambiar de escena (Transition sin `mode`, ambas copias se solapan).

   Hallazgo de diseño revisado (TASK-011, hook impeccable "side-tab" sobre esta
   regla): el filete izquierdo de 3px NO es el tell genérico de "tarjeta con
   franja de color" que el hook detecta por defecto — es chrome de broadcast
   real, especificado verbatim por la spec (barra #0d1018 alpha 0.88, filete
   izquierdo 3px #d92626, texto #f2ede3; `rgba(13,16,24,0.88)` de abajo ES
   `#0d1018` en alpha 0.88, valor exacto). Todo canal de noticias/deportes usa
   esta convención (lower third) desde hace décadas; retirar el filete
   destruiría la referencia visual que el capítulo persigue. Se lee como
   broadcast real y no como card genérica porque NO tiene radio de borde, NO
   tiene sombra/glow, es angosta (12px mono, línea 1.4) y vive pegada al
   borde inferior-izquierdo de la escena, no flotando como una tarjeta de UI. */
.ch5-lower-third {
  position: absolute;
  left: 4%;
  bottom: 6%;
  max-width: 42vw;
  z-index: 10460;
  margin: 0;
  padding: 8px 14px 8px 12px;
  background: rgba(13, 16, 24, 0.88);
  border-left: 3px solid #d92626;
  color: #f2ede3;
  font-family: var(--hud-font);
  font-size: 12px;
  line-height: 1.4;
  pointer-events: none;
}
.ch5-lower-third-enter-active,
.ch5-lower-third-leave-active {
  transition:
    opacity 420ms cubic-bezier(0.22, 1, 0.36, 1),
    transform 420ms cubic-bezier(0.22, 1, 0.36, 1);
}
.ch5-lower-third-enter-from {
  opacity: 0;
  transform: translateY(8px);
}
.ch5-lower-third-leave-to {
  opacity: 0;
}

/* === Motas de polvo en el haz ===
   Cada partícula flota hacia arriba con desplazamiento lateral distinto.
   opacity ≤ 0.3 para no competir con la luz principal. */
.cine-dust {
  position: absolute;
  width: 1.5px;
  height: 1.5px;
  border-radius: 50%;
  background: #ddeeff;
  pointer-events: none;
  opacity: 0;
  animation: dust-float var(--dur, 9s) ease-in-out var(--delay, 0s) infinite;
}

/* Posiciones y parámetros individuales por mota (dentro del área del cono) */
.cine-dust:nth-child(1) { left: 47.5%; top: 78%; --delay: 0s;   --dur: 9s;  --dx: 3px; }
.cine-dust:nth-child(2) { left: 51%;   top: 65%; --delay: 2.3s; --dur: 7s;  --dx: -4px; }
.cine-dust:nth-child(3) { left: 49%;   top: 82%; --delay: 4.1s; --dur: 11s; --dx: 5px; }
.cine-dust:nth-child(4) { left: 50%;   top: 70%; --delay: 1.2s; --dur: 8s;  --dx: -2px; }
.cine-dust:nth-child(5) { left: 48.5%; top: 57%; --delay: 3.7s; --dur: 10s; --dx: 4px; }

/* ─────────────────────────────────────────────────────────────
 * ch5-stream-panel — panel lateral de transmisión (spec §4, TASK-011)
 * Mata `showText = false`: montado SIEMPRE, header fijo + body scrolleable
 * internamente (`overflow-y: auto`) para el feed de 8 párrafos reales — el
 * fallback de layout de la cabecera del script explica por qué no crece la
 * section a >100dvh (spec §4.2 scroll-reveal habría requerido tocar App.vue).
 * Tipografía: chrome (badge/timestamps/label/counter) = var(--hud-font),
 * cuerpo (título + feed) = var(--font-body) — decisión documentada arriba.
 * ───────────────────────────────────────────────────────────── */
.ch5-stream-panel {
  position: absolute;
  top: 0;
  right: 0;
  bottom: 0;
  width: clamp(300px, 32vw, 420px);
  z-index: 10510; /* encima de cono/luz de pantalla (10499-10500) y lower-third (10460) */
  display: flex;
  flex-direction: column;
  box-sizing: border-box;
  padding: 28px;
  background: rgba(10, 12, 20, 0.82);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border-left: 1px solid rgba(129, 140, 248, 0.25);
  color: #f2ede3;
  font-family: var(--hud-font);
}

.ch5-panel-header {
  flex: 0 0 auto;
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding-bottom: 20px;
  margin-bottom: 20px;
  border-bottom: 1px solid rgba(129, 140, 248, 0.2);
}
.ch5-panel-badge {
  display: flex;
  align-items: center;
  gap: 8px;
  margin: 0;
  color: #d92626;
  font-size: 13px;
  font-weight: 700;
  letter-spacing: 0.04em;
}
.ch5-panel-dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: #d92626;
  animation: ch5-badge-pulse 2s ease-in-out infinite;
}
.ch5-panel-year {
  margin-left: auto;
  color: #f2ede3;
  font-weight: 400;
  opacity: 0.7;
}
.ch5-panel-title {
  margin: 0;
  font-family: var(--font-body);
  font-size: 22px;
  font-weight: 650;
  line-height: 1.2;
  color: #f2ede3;
}
.ch5-panel-viewers {
  margin: 0;
  color: #818cf8;
  font-size: 13px;
}

.ch5-panel-body {
  flex: 1 1 auto;
  min-height: 0;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 20px;
  scrollbar-width: thin;
  scrollbar-color: rgba(129, 140, 248, 0.3) transparent;
}

.ch5-feed {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 16px;
}
.ch5-feed-item {
  display: flex;
  align-items: flex-start;
  gap: 10px;
}
.ch5-feed-timestamp {
  flex: 0 0 auto;
  color: #a89f92;
  font-size: 12px;
  white-space: nowrap;
}
.ch5-feed-text {
  margin: 0;
  max-width: 52ch;
  color: #f2ede3;
  font-family: var(--font-body);
  font-size: 16px;
  line-height: 1.65;
}

.ch5-channels {
  flex: 0 0 auto;
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding-top: 20px;
  border-top: 1px solid rgba(129, 140, 248, 0.2);
}
.ch5-channels-label {
  margin: 0;
  color: #a89f92;
  font-size: 12px;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}
.ch5-channels-grid {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

/* ProjectCard variant ch5 "canal" oscuro (spec §4.1) — la variante "modern flat"
   migrada de chapter-components.css asumía fondo blanco; ver TASK-011 hand-off. */
.ch5-channels-grid :deep(.project-card) {
  background: #1a1626;
  border: 1px solid rgba(129, 140, 248, 0.3);
  border-radius: var(--r-card, 10px);
  padding: 14px;
  box-shadow: none;
  transition: border-color 150ms ease;
}
.ch5-channels-grid :deep(.project-card:hover) {
  border-color: #818cf8;
}
.ch5-channels-grid :deep(.project-card-title) {
  display: block;
  margin: 0 0 6px 0;
  padding-bottom: 0;
  border-bottom: none;
  color: #f2ede3;
  font-family: var(--hud-font);
  font-size: 13px;
  letter-spacing: 0.02em;
  text-shadow: none;
}
.ch5-channels-grid :deep(.project-card-desc),
.ch5-channels-grid :deep(.project-card-role) {
  color: #f2ede3;
  opacity: 0.85;
  font-family: var(--font-body);
  font-size: 13px;
  line-height: 1.5;
}
.ch5-channels-grid :deep(.project-card-tech) {
  margin: 8px 0 0 0;
}
.ch5-channels-grid :deep(.project-card-tech li) {
  background: rgba(129, 140, 248, 0.1);
  border: 1px solid rgba(129, 140, 248, 0.3);
  color: #f2ede3;
  font-family: var(--hud-font);
  font-size: 11px;
}
.ch5-channels-grid :deep(.project-card-link) {
  color: #818cf8;
  font-family: var(--hud-font);
}

/* === Keyframes === */

/* Parpadeo irregular de proyector analógico (~7s loop con drops y picos no periódicos) */
@keyframes projector-flicker {
  0%, 100% { opacity: 0.09; }
  8%        { opacity: 0.055; }
  9%        { opacity: 0.10; }
  27%       { opacity: 0.075; }
  28%       { opacity: 0.052; }
  29%       { opacity: 0.095; }
  50%       { opacity: 0.08; }
  51%       { opacity: 0.10; }
  74%       { opacity: 0.07; }
  75%       { opacity: 0.09; }
}

/* Respiración lenta de la pantalla (0.06 → 0.09 en opacity del elemento) */
@keyframes screen-breathe {
  0%, 100% { opacity: 0.06; }
  50%       { opacity: 0.09; }
}

/* Flotación de polvo: sube ~35px con deriva lateral; fade in/out suave */
@keyframes dust-float {
  0%   { opacity: 0;    transform: translateY(0)     translateX(0); }
  10%  { opacity: 0.28; }
  85%  { opacity: 0.15; }
  100% { opacity: 0;    transform: translateY(-35px) translateX(var(--dx, 4px)); }
}

/* Glitch de compresión (spec §3.2): clip-path desplazado + saturate/hue-rotate +
   translateX — procedural, cero assets, 140ms via steps(3). */
@keyframes cine-glitch {
  0%   { clip-path: inset(0 0 0 0);     filter: none;                       transform: translateX(0); }
  33%  { clip-path: inset(10% 0 40% 0); filter: saturate(2) hue-rotate(12deg);  transform: translateX(2px); }
  66%  { clip-path: inset(50% 0 5% 0);  filter: saturate(2) hue-rotate(-12deg); transform: translateX(-2px); }
  100% { clip-path: inset(0 0 0 0);     filter: none;                       transform: translateX(0); }
}

/* Pulso del punto blanco del badge EN VIVO (pantalla y panel comparten el keyframe) */
@keyframes ch5-badge-pulse {
  0%, 100% { opacity: 1; }
  50%      { opacity: 0.35; }
}

/* Shimmer sutil de la barra de señal inferior de la pantalla */
@keyframes cine-signal-shimmer {
  0%   { background-position: 0% 0; }
  100% { background-position: -200% 0; }
}

/* === prefers-reduced-motion ===
   Overlays de luz quedan estáticos en su opacity base (la luz existe, solo no parpadea).
   El polvo desaparece (requiere movimiento para tener sentido visual). TASK-011: se suma
   el chrome de broadcast nuevo — cinturón de seguridad CSS-side aunque el JS (triggerGlitch/
   triggerCelebrationWave) ya hace early-return bajo PRM y nunca dispara estas clases. */
@media (prefers-reduced-motion: reduce) {
  .cine-projector-cone {
    animation: none;
    opacity: 0.085;
  }
  .cine-screen-light {
    animation: none;
    opacity: 0.06;
    transition: none;
  }
  .cine-dust {
    display: none;
  }
  .cine-screen.is-glitch {
    animation: none;
  }
  .cine-screen-dot,
  .ch5-panel-dot {
    animation: none;
    opacity: 1;
  }
  .cine-screen-signal {
    animation: none;
  }
  .ch5-lower-third-enter-active,
  .ch5-lower-third-leave-active {
    transition: none;
  }
  .ch5-lower-third-enter-from,
  .ch5-lower-third-leave-to {
    opacity: 1;
    transform: none;
  }
}

/* ─────────────────────────────────────────────────────────────
 * Responsive (spec §4.3): mobile portrait pasa a layout de app de streaming
 * (player fijo arriba + feed en flujo debajo); landscape mobile corto conserva
 * el layout desktop con panel más angosto. Breakpoints alineados con
 * src/styles/chassis.css §6.4 (<600px portrait, <480px alto landscape) para
 * consistencia cross-chapter.
 * ───────────────────────────────────────────────────────────── */
@media (max-width: 600px) {
  .ch5-cine {
    display: flex;
    flex-direction: column;
  }
  .ch5-scene {
    position: relative;
    inset: auto;
    flex: 0 0 auto;
    width: 100%;
    height: 42dvh;
  }
  .ch5-stream-panel {
    position: relative;
    top: auto;
    right: auto;
    bottom: auto;
    flex: 1 1 auto;
    min-height: 0;
    width: 100%;
    border-left: none;
    border-top: 1px solid rgba(129, 140, 248, 0.25);
  }

  /* Ronda 2 de review de TASK-011, HIGH bloqueante: el lower-third (left:4%,
     bottom:6% en la regla base) intersecta los .tick-button de StickyTimeline
     en este ancho — medido, con getBoundingClientRect(), en 390x844: el rail
     (x 9-66) se solapa con el lower-third (x 16-208). La timeline es
     navegación fija que vive vertical-centrada en TODO el viewport, no solo
     en la escena; el límite del proyecto (Lección técnica #7) es que tapar
     contenido/nav se arregla siempre, aunque la spec haya fijado left:4%. En
     este ancho la escena ocupa el 100% (el panel queda DEBAJO en flujo, no al
     costado — spec §4.3), así que mover el lower-third al lado derecho de la
     escena lo aleja del rail sin acercarlo a ningún otro elemento: medido,
     deja >100px de margen libre respecto al rail en 390px de ancho. */
  .ch5-lower-third {
    left: auto;
    right: 4%;
  }
}

/* DESVIACIÓN MEDIDA de la spec (Lección técnica #7, límite no-opinable): la
   spec §4.3 pedía panel a `min(46vw, 400px)` en landscape mobile corto. El
   arnés `scripts/verify-ch5-broadcast.mjs` midió que ese ancho SOLAPA
   `.cine-screen` (screen centrada al 50% del ancho total, min(17vw,300px) de
   ancho, nunca se movió al asumirse un panel más angosto) en 800x420 y
   844x390 — hasta ~38px de solape real, no hipotético. `min(34vw, 300px)`
   deja margen medido >= ~60px libres en ambos viewports de referencia; se
   deja documentado en vez de tapado en silencio porque el límite de "si algo
   tapa contenido se arregla igual" gana sobre el número literal de la spec. */
@media (max-height: 480px) {
  .ch5-stream-panel {
    width: min(34vw, 300px);
  }

  /* Ronda 2 de review de TASK-011, HIGH bloqueante (segunda mitad): en este
     breakpoint la escena SIGUE en absolute inset:0 (el ancho del viewport no
     bajó de 600px, así que la regla de arriba no aplica) — el rail de
     StickyTimeline usa su versión desktop con etiqueta de era (más ancho,
     medido x1≈146px) y el panel ocupa el 34vw derecho. Medido con
     getBoundingClientRect() en 844x390 y 800x420: el lower-third con
     left:4% (regla base) intersecta 1 .tick-button en ambos.
     `left: max(175px, 20%)` despeja el rail con margen (>=24px medido en
     ambos viewports de referencia, y el suelo de 175px evita que un ancho más
     angosto —p.ej. 667px, tamaño real de un teléfono en landscape— vuelva a
     acercar demasiado el % al rail) y `max-width: 180px` deja libre >=100px
     frente al borde del panel en los dos viewports medidos, incluso con el
     texto más largo del lower-third (escena "covid", ES). Mismo límite no
     opinable que la desviación de ancho del panel documentada abajo
     (Lección técnica #7): se prioriza no tapar contenido/nav sobre el valor
     literal de la spec (bottom:6%/left:4% fijos §3.3). */
  .ch5-lower-third {
    left: max(175px, 20%);
    right: auto;
    max-width: 180px;
  }
}
</style>
