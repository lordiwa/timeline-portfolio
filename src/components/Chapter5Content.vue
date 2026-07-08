<!--
  Chapter5Content.vue — ch5 "2022 Modern" · escena "cine" (Rafael 2026-07-07).

  Concepto: sala de cine (gran hall) vista desde atrás. El "público" son 125 personajes
  únicos de pixellab repartidos por la alfombra frente a una pantalla que cicla escenas
  de la época (transmisiones ONLINE de recintos vacíos — pandemia 2022).

  MULTITUD VIVA (Rafael 2026-07-07d): cada personaje cambia de ESTADO al azar cada 1.5–3s
  (puede repetir el mismo estado → todos se mueven distinto). Estados:
    idleBack  — quieto de espaldas (norte)
    idleFront — quieto mirando al usuario (sur)
    rotR/rotL — girar a la derecha / izquierda (recorre las 8 direcciones)
    osc       — media vuelta a un lado y media al otro
    festejo   — anim de celebración (6º estado, sheet en anim/)
  Se usan las 8 vistas direccionales que pixellab ya generó por personaje
  (public/assets/ch5-cinema/rot/{slug}.png = tira de 8 frames, sentido horario desde norte)
  + el spritesheet de festejo (anim/{slug}.png). Manifest: src/data/ch5CrowdManifest.json.

  El render lo maneja UN solo bucle rAF que escribe el DOM directo (no reactividad Vue)
  para no recalcular 140+ nodos por frame. Texto original oculto (showText=false).
-->
<script setup>
import { computed, ref, onMounted, onBeforeUnmount } from 'vue'
import { useI18n } from 'vue-i18n'
import { chapters } from '@/data/chapters'
import { projects } from '@/data/projects'
import { bio } from '@/data/bio'
import crowdManifest from '@/data/ch5CrowdManifest.json'
import ProjectCard from './ProjectCard.vue'
import ScrollRevealCard from './ScrollRevealCard.vue'

const { t } = useI18n()

// ─── Slideshow de la pantalla (escenas online/vacías) — cross-fade cada 4.5s ───
const screenScenes = ['box', 'mma', 'concierto', 'lab', 'covid']
const screenIdx = ref(0)
let screenTimer = null

const chapter = chapters[5]
const ch5Projects = computed(() => projects.filter((p) => p.chapterEra === 5))
const bioParagraphs = computed(() => t(bio.eras[chapter.id].textKey).split('\n\n'))

// Texto oculto hasta decidir qué contenido va (Rafael 2026-07-07).
const showText = false

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
    const bright = 0.5 + t * 0.5
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
      const sizeMul = 0.66 + rng() * 0.64
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

// Estilo base de cada personaje (parte estática; el frame lo mueve el bucle rAF).
function seatBaseStyle(seat) {
  const m = crowdManifest[seat.slug]
  if (!m) return {}
  const k = seat.h / m.rh
  return {
    left: seat.x + '%',
    top: seat.y + '%',
    width: m.rw + 'px',
    height: m.rh + 'px',
    backgroundImage: `url(/assets/ch5-cinema/rot/${seat.slug}.png)`,
    transform: `translate(-50%, -100%) scale(${k})`,
    zIndex: seat.z,
    filter: `brightness(${seat.bright}) drop-shadow(0 3px 2px rgba(0,0,0,0.6))`,
  }
}

// ─────────────── Máquina de estados de la multitud (runtime, no reactivo) ───────────────
const audienceRef = ref(null)
let rafId = null
let runtime = [] // por asiento: estado + facing continuo; se muta y escribe al DOM

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
  if (c.state === 'festejo') {
    if (c.mode !== 'fest') {
      c.el.style.backgroundImage = `url(/assets/ch5-cinema/anim/${c.slug}.png)`
      c.el.style.width = m.fw + 'px'
      c.el.style.height = m.fh + 'px'
      c.el.style.transform = `translate(-50%, -100%) scale(${c.seat.h / m.fh})`
      c.mode = 'fest'
      c.lastFrame = -1
    }
    if (c.fFrame !== c.lastFrame) {
      c.el.style.backgroundPositionX = `-${c.fFrame * m.fw}px`
      c.lastFrame = c.fFrame
    }
  } else {
    if (c.mode !== 'rot') {
      c.el.style.backgroundImage = `url(/assets/ch5-cinema/rot/${c.slug}.png)`
      c.el.style.width = m.rw + 'px'
      c.el.style.height = m.rh + 'px'
      c.el.style.transform = `translate(-50%, -100%) scale(${c.seat.h / m.rh})`
      c.mode = 'rot'
      c.lastFrame = -1
    }
    const frame = ((Math.round(c.dir) % 8) + 8) % 8
    if (frame !== c.lastFrame) {
      c.el.style.backgroundPositionX = `-${frame * m.rw}px`
      c.lastFrame = frame
    }
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

onMounted(() => {
  screenTimer = setInterval(() => {
    screenIdx.value = (screenIdx.value + 1) % screenScenes.length
  }, 4500)

  const reduce =
    typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches
  const root = audienceRef.value
  if (!root) return
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
      mode: 'rot',
      lastFrame: -1,
      t: now,
    }
    runtime.push(c)
  })

  if (!reduce) rafId = requestAnimationFrame(tick)
})

onBeforeUnmount(() => {
  if (screenTimer) clearInterval(screenTimer)
  if (rafId) cancelAnimationFrame(rafId)
})
</script>

<template>
  <div class="ch5-layout ch5-cine">
    <!-- Pantalla del cine: slideshow de escenas de época (online/vacías), cross-fade -->
    <div class="cine-screen" aria-hidden="true">
      <img
        v-for="(scene, i) in screenScenes"
        :key="scene"
        class="cine-screen-img"
        :class="{ 'is-active': i === screenIdx }"
        :src="`/assets/ch5-cinema/screen/${scene}.png`"
        alt=""
      />
    </div>

    <!-- Público VIVO: cada asiento con manifest usa el <div> animado por el bucle rAF;
         los que (aún) no tengan sheets caen a <img> estático de espaldas (fallback). -->
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

    <!-- Contenido original preservado pero oculto hasta decidir qué va (showText=false) -->
    <template v-if="showText">
      <aside class="ch5-meta">
        <p class="ch5-year">{{ chapter.year }}</p>
        <p class="ch5-era">{{ t(chapter.eraKey) }}</p>
      </aside>

      <div class="ch5-content">
        <ScrollRevealCard :threshold="0.2" :delay="0">
          <h1 class="ch5-title">{{ t(chapter.titleKey) }}</h1>
          <p class="ch5-flavor">{{ t('chapters.5.flavor') }}</p>
          <p v-for="(para, idx) in bioParagraphs" :key="idx" class="ch5-bio">{{ para }}</p>
        </ScrollRevealCard>

        <div v-if="ch5Projects.length > 0" class="ch5-projects">
          <ScrollRevealCard
            v-for="(project, idx) in ch5Projects"
            :key="project.id"
            :threshold="0.2"
            :delay="100 * (idx + 1)"
          >
            <ProjectCard :project="project" />
          </ScrollRevealCard>
        </div>
      </div>
    </template>
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
  overflow: hidden;
  box-sizing: border-box;
  background:
    linear-gradient(rgba(4, 4, 10, 0.28), rgba(4, 4, 10, 0.5)),
    url('/assets/ch5-cinema/bg-hall-v3.png') center / cover no-repeat,
    #04040a;
}

/* Pantalla: superpuesta sobre la pantalla pintada del hall. Slideshow de escenas. */
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

/* Sprite VIVO: el bucle rAF cambia background-image (rot/festejo) y background-position-x
   (frame). El anclaje por los PIES lo da transform-origin 50% 100% + translate/scale. */
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
</style>
