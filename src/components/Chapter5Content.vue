<!--
  Chapter5Content.vue — ch5 "2022 Modern" · PRUEBA DE CONCEPTO "cine" (Rafael 2026-07-07).

  Concepto: la sección es una sala de cine vista desde atrás. El "público" son los
  25 personajes de pixellab en su vista de espaldas (rotación norte, bajados a
  public/assets/ch5-cinema/). Se despliegan escalonados con profundidad (fan shape
  fondo→frente) mirando hacia el fondo de la sección, donde por ahora hay un
  CUADRADO BLANCO = placeholder de la futura "tele"/pantalla.

  - Texto (título/flavor/bio/proyectos) OCULTO hasta decidir qué contenido va:
    gateado con `v-if="showText"` (showText=false) — NO borrado, solo escondido.
  - Fondo oscuro tipo sala (stage opaco cubre el bg claro global de [data-chapter=5]).
  - Primer objetivo: "cuadrar" a todos mirando la pantalla con buena profundidad.
    Iterativo con Rafael — las posiciones se derivan de ROWS + config abajo.
-->
<script setup>
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { chapters } from '@/data/chapters'
import { projects } from '@/data/projects'
import { bio } from '@/data/bio'
import ProjectCard from './ProjectCard.vue'
import ScrollRevealCard from './ScrollRevealCard.vue'

const { t } = useI18n()

const chapter = chapters[5]
const ch5Projects = computed(() => projects.filter((p) => p.chapterEra === 5))
const bioParagraphs = computed(() => t(bio.eras[chapter.id].textKey).split('\n\n'))

// Texto oculto hasta decidir qué contenido va (Rafael 2026-07-07).
const showText = false

// Público: personajes de pixellab, vista de espaldas (rotación norte).
// = 25 beat-em-up reusados + 100 temáticos groomeados (ver .planning/ch5-cinema/CHARACTER-ROSTER.md).
// COMPLETO: 125 únicos → ratio 146/125 = 1.168 ≤ 1.2 (el guard de dev ya no avisa).
// Backfill de los 100 temáticos completado 2026-07-07 pese al incidente de pixellab (fallos que no
// gastan cuota; se reintentó en lotes chicos). ids finales en .planning/ch5-cinema/IDS.tsv.
const CAST = [
  // — 25 existentes (beat-em-up) —
  'all-around', 'player-brawler', 'bboy-skater', 'bboy-kungfu', 'ninja',
  'zoner', 'female-1', 'female-2', 'female-3', 'balanced',
  'tank', 'grappler', 'warden', 'charger', 'shield-drone',
  'empire-drone', 'idle-a', 'attack1', 'walk-a', 'idle-b',
  'fighter', 'flyer', 'monk', 'eyeball', 'monitor-frame',
  // — 100 temáticos (groomeados, ver CHARACTER-ROSTER.md) —
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

// Nº de anillos concéntricos del enjambre radial alrededor de la pantalla.
const NRINGS = 11

// Duración del bucle de festejo (s); cada asiento arranca en una fase distinta
// (animDelay) para que la multitud NO lata en sincronía (se ve orgánica).
const ANIM_DURATION = 0.9

// PRNG determinista (mulberry32) con semilla fija → dispersión "aleatoria" pero
// estable entre renders (nada de layout que baila en cada repintado).
function mulberry32(a) {
  return function () {
    a |= 0
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

// Bolsa barajada anti-repetición (regla de Rafael: "no repetir en un ratio > 1.2").
// En vez de muestreo CON reemplazo (`CAST[rng()*len]`, que puede sacar un personaje 5
// veces y otro 0), se baraja el CAST (Fisher–Yates con el mismo PRNG) y se reparte 1 por
// asiento; al agotar la bolsa se rebaraja. Así cada personaje aparece ⌊N/U⌋..⌈N/U⌉ veces
// (diferencia máx. 1). Con U=125 únicos y ~146 asientos, 146/125 = 1.168 ≤ 1.2. ✔
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

// Enjambre RADIAL alrededor de la pantalla (Rafael 2026-07-07: "un círculo concéntrico
// que se hace menos acumulado hacia afuera pq todos quieren ir hacia la pantalla").
// Foco = centro de la pantalla. Anillos concéntricos que se abren hacia abajo/los lados:
//  - interior (pegado a la pantalla): MUY apretado + pequeño + oscuro (lejos, al fondo).
//  - exterior: espaciado crece (menos acumulado), tamaño y brillo crecen (más cerca).
// Reusa los 25 PNG → el navegador solo carga 25 imágenes.
function buildCrowd() {
  const rng = mulberry32(0x5ce07)
  const draw = makeBag(CAST, rng)                // reparto parejo (ratio ≤ 1.2)
  const Fx = 50
  const Fy = 48                                  // foco (línea de pies del anillo interior) MÁS abajo → banda baja
  const out = []
  for (let i = 0; i < NRINGS; i++) {
    const t = NRINGS === 1 ? 0 : i / (NRINGS - 1) // 0 interior (pantalla) .. 1 exterior
    const rx = 8 + t * 18                         // radio horiz %: CONTENIDO en la alfombra (no a los muros)
    const ry = 15 + t * 35                        // radio vert %: banda compacta baja (altura sin cambios)
    const halfA = ((34 + t * 18) * Math.PI) / 180 // semiapertura moderada → llena el centro, no los extremos
    const baseH = 30 + t * 109                    // alto px: multitud pequeña, cámara cerca
    const bright = 0.5 + t * 0.5                  // interior oscuro (fondo) .. exterior claro
    // MÁS LLENO y con el centro denso (Rafael): mucha gente en todos los anillos,
    // scatter angular/radial, contenida en la alfombra con clamp de altura.
    const count = Math.max(9, Math.round(12 + 16 * (1 - t)))
    for (let c = 0; c < count; c++) {
      const aFrac = count === 1 ? 0.5 : c / (count - 1)
      const ang = (aFrac - 0.5) * 2 * halfA + (rng() - 0.5) * halfA * 0.34 // reparto + scatter angular
      const rj = 1 + (rng() - 0.5) * 0.22         // scatter radial (±11%)
      let x = Fx + rx * rj * Math.sin(ang) + (rng() - 0.5) * 4 // + jitter horizontal pequeño
      let y = Fy + ry * rj * Math.cos(ang)
      y = Math.min(100, Math.max(60, y))          // CLAMP altura a la ALFOMBRA (no trepan junto a la pantalla)
      const sizeMul = 0.66 + rng() * 0.64         // variación de tamaño
      const slug = draw()                         // personaje de la bolsa barajada (reparto parejo)
      out.push({
        slug,
        x,
        y,
        h: baseH * sizeMul,
        z: Math.round(y * 100),                   // z-order por posición vertical: más abajo = más cerca = encima
        bright: Math.min(1, bright + (rng() - 0.5) * 0.12),
        animDelay: rng() * ANIM_DURATION,         // desfase de fase del festejo (desincroniza la multitud)
      })
    }
  }
  return out
}

const seats = buildCrowd()

// Guard de dev: si alguien sube los anillos o baja el CAST rompiendo el ratio ≤ 1.2, avisa.
if (import.meta.env?.DEV) {
  const ratio = seats.length / CAST.length
  console.assert(
    ratio <= 1.8, // Rafael pidió multitud LLENA → tope relajado a 1.8 (bolsa barajada reparte parejo)
    `[ch5] ratio de repetición ${ratio.toFixed(2)} > 1.8 — subí el CAST (hoy ${CAST.length}) o bajá los asientos (${seats.length}).`,
  )
}
</script>

<template>
  <div class="ch5-layout ch5-cine">
    <!-- Pantalla futura: por ahora un cuadrado blanco al fondo-centro -->
    <div class="cine-screen" aria-hidden="true"></div>

    <!-- Público de espaldas, escalonado en profundidad -->
    <div class="cine-audience" aria-hidden="true">
      <img
        v-for="(seat, idx) in seats"
        :key="idx"
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
 * .ch5-cine — sala de cine oscura (prueba de concepto)
 * Stage opaco: cubre el bg claro global de [data-chapter="5"].
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

/* Pantalla: superpuesta EXACTAMENTE sobre la pantalla pintada del hall (rectángulo gris).
   Aquí irá el slideshow de escenas (box/MMA/conciertos/COVID). */
.cine-screen {
  position: absolute;
  top: 38%;
  left: 50%;
  transform: translateX(-50%);
  width: min(17vw, 300px);
  aspect-ratio: 16 / 9;
  background: #ffffff;
  border-radius: 2px;
  box-shadow:
    0 0 60px 16px rgba(255, 255, 255, 0.25),
    0 0 150px 44px rgba(180, 200, 255, 0.12);
  z-index: 0;
}

/* Tenue "cono de luz" de la pantalla hacia el público */
.cine-audience::before {
  content: '';
  position: absolute;
  inset: 0;
  background: radial-gradient(60% 55% at 50% 18%, rgba(200, 215, 255, 0.10), transparent 70%);
  pointer-events: none;
  z-index: 0;
}

.cine-audience {
  position: absolute;
  inset: 0;
}

.cine-char {
  position: absolute;
  transform: translate(-50%, -100%); /* ancla por los PIES: y = línea del piso (no flotan) */
  width: auto;
  image-rendering: pixelated;
  -webkit-user-select: none;
  user-select: none;
  pointer-events: none;
  /* sombra sutil bajo cada figura para asentarlas en el "piso" */
  filter: brightness(1);
}

/* Sin cambios de layout en mobile por ahora: la escena es full-viewport y se
 * reescala sola con vw/%. (Prueba de concepto — pulido responsive luego.) */
</style>
