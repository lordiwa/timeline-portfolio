// src/audio/tracks.js
// Los 7 temas musicales del portfolio — datos puros interpretados por sequencer.js.
//
// Cada track: { bpm, loopBeats, channels: [Channel] }
// Cada channel: { voice, duty?, detune?, filter?, lfo?, gainDb, attack?, decay?, notes: [Note] }
// Cada note: { t (beat offset en el loop), dur (beats), midi, vel }
//
// Guía de eras:
//   ch0 1995  — ambient DOS, PC-speaker, 60bpm
//   ch1 2001  — GeoCities MIDI naive, 118bpm
//   ch2 2009  — Newgrounds energético, 140bpm
//   ch3 2013  — Orquestal-8bit sombrío (Kingdom era), 70bpm
//   ch4 2015  — Synthwave pads, 100bpm
//   ch5 2022  — Cinemático cálido, 80bpm
//   ch6 2026  — Ambient sci-fi, 30bpm (tempo lento estructural, no percusivo)

// ─── Helper: generar n notas equidistantes (hats, drones repetidos) ─────────
function steps(startBeat, stepSize, count, { midi, dur, vel }) {
  return Array.from({ length: count }, (_, i) => ({
    t: startBeat + i * stepSize,
    dur,
    midi,
    vel,
  }))
}

// ─── Am pentatónica: A C D E G ───────────────────────────────────────────────
// MIDI en octava 4: A4=69, C5=72, D5=74, E5=76, G5=79
// MIDI en octava 3: A3=57, C4=60, D4=62, E4=64, G4=67

// ─── ch0 · 1995 · Ambient DOS · 60bpm ────────────────────────────────────────
// Casi silence — sala con un 386 encendido. Blips esporádicos de PC-speaker.
const TRACK_0 = {
  bpm: 60,
  loopBeats: 16,
  channels: [
    {
      // PC-speaker blips: notas sueltas pentatónica menor de A
      voice: 'pulse',
      duty: 0.5,
      gainDb: -18,
      attack: 0.005,
      decay: 0.25,
      notes: [
        { t: 0,    dur: 0.3, midi: 69, vel: 0.7 },  // A4
        { t: 4.5,  dur: 0.3, midi: 76, vel: 0.5 },  // E5
        { t: 9,    dur: 0.3, midi: 72, vel: 0.6 },  // C5
        { t: 11.5, dur: 0.3, midi: 74, vel: 0.4 },  // D5
        { t: 14,   dur: 0.3, midi: 67, vel: 0.5 },  // G4
      ],
    },
    {
      // Hum grave: triángulo A1 muy suave — el "zumbido" del monitor CRT
      voice: 'tri',
      gainDb: -30,
      attack: 1.0,
      decay: 13.0,
      notes: [
        { t: 0, dur: 15.5, midi: 33, vel: 1.0 },  // A1
      ],
    },
  ],
}

// ─── ch1 · 2001 · GeoCities MIDI · 118bpm ────────────────────────────────────
// I-V-vi-IV en Do mayor. Melodía pulse deliberadamente "cursi".
// Bajo tri en negras. 16 beats = 4 compases de 4/4.
const TRACK_1 = {
  bpm: 118,
  loopBeats: 16,
  channels: [
    {
      // Melodía pulse I-V-vi-IV: cuatro compases, notas en negras
      voice: 'pulse',
      duty: 0.5,
      gainDb: -14,
      attack: 0.01,
      decay: 0.35,
      notes: [
        // Compás 1 (I – C): E4 G4 E4 C4
        { t: 0,  dur: 0.9, midi: 64, vel: 0.9 },  // E4
        { t: 1,  dur: 0.9, midi: 67, vel: 0.8 },  // G4
        { t: 2,  dur: 0.9, midi: 64, vel: 0.8 },  // E4
        { t: 3,  dur: 0.9, midi: 60, vel: 0.7 },  // C4
        // Compás 2 (V – G): D4 G4 B4 G4
        { t: 4,  dur: 0.9, midi: 62, vel: 0.8 },  // D4
        { t: 5,  dur: 0.9, midi: 67, vel: 0.9 },  // G4
        { t: 6,  dur: 0.9, midi: 71, vel: 0.8 },  // B4
        { t: 7,  dur: 0.9, midi: 67, vel: 0.7 },  // G4
        // Compás 3 (vi – Am): A4 C5 E4 A4
        { t: 8,  dur: 0.9, midi: 69, vel: 0.9 },  // A4
        { t: 9,  dur: 0.9, midi: 72, vel: 0.8 },  // C5
        { t: 10, dur: 0.9, midi: 64, vel: 0.8 },  // E4
        { t: 11, dur: 0.9, midi: 69, vel: 0.7 },  // A4
        // Compás 4 (IV – F): F4 A4 C5 A4
        { t: 12, dur: 0.9, midi: 65, vel: 0.8 },  // F4
        { t: 13, dur: 0.9, midi: 69, vel: 0.9 },  // A4
        { t: 14, dur: 0.9, midi: 72, vel: 0.8 },  // C5
        { t: 15, dur: 0.9, midi: 69, vel: 0.7 },  // A4
      ],
    },
    {
      // Bajo tri en negras: C G Am F (raíces)
      voice: 'tri',
      gainDb: -16,
      attack: 0.01,
      decay: 0.7,
      notes: [
        ...steps(0, 1, 4, { dur: 0.8, midi: 48, vel: 0.75 }), // C2 x4
        ...steps(4, 1, 4, { dur: 0.8, midi: 55, vel: 0.70 }), // G2 x4
        ...steps(8, 1, 4, { dur: 0.8, midi: 57, vel: 0.70 }), // A2 x4
        ...steps(12, 1, 4, { dur: 0.8, midi: 53, vel: 0.70 }), // F2 x4
      ],
    },
  ],
}

// ─── ch2 · 2009 · Newgrounds · 140bpm ────────────────────────────────────────
// Lead pulse duty 0.25, Em pentatónica. Bajo tri octavado. Hats noise en corcheas.
// Em pentatónica: E4=64, G4=67, A4=69, B4=71, D5=74
const TRACK_2 = {
  bpm: 140,
  loopBeats: 16,
  channels: [
    {
      // Lead energético
      voice: 'pulse',
      duty: 0.25,
      gainDb: -12,
      attack: 0.005,
      decay: 0.25,
      notes: [
        { t: 0,   dur: 0.4, midi: 64, vel: 0.9 },  // E4
        { t: 0.5, dur: 0.4, midi: 67, vel: 0.8 },  // G4
        { t: 1,   dur: 0.4, midi: 69, vel: 0.9 },  // A4
        { t: 1.5, dur: 0.4, midi: 71, vel: 0.8 },  // B4
        { t: 2,   dur: 0.4, midi: 74, vel: 1.0 },  // D5
        { t: 2.5, dur: 0.4, midi: 71, vel: 0.8 },  // B4
        { t: 3,   dur: 0.4, midi: 69, vel: 0.8 },  // A4
        { t: 3.5, dur: 0.4, midi: 67, vel: 0.7 },  // G4
        // Repetición con variación
        { t: 4,   dur: 0.4, midi: 64, vel: 0.9 },  // E4
        { t: 4.5, dur: 0.4, midi: 71, vel: 0.8 },  // B4
        { t: 5,   dur: 0.8, midi: 74, vel: 1.0 },  // D5 (más larga)
        { t: 6,   dur: 0.4, midi: 69, vel: 0.9 },  // A4
        { t: 6.5, dur: 0.4, midi: 67, vel: 0.8 },  // G4
        { t: 7,   dur: 0.8, midi: 64, vel: 0.9 },  // E4 (más larga)
        // Bridge
        { t: 8,   dur: 0.4, midi: 76, vel: 0.9 },  // E5
        { t: 8.5, dur: 0.4, midi: 74, vel: 0.8 },  // D5
        { t: 9,   dur: 0.4, midi: 71, vel: 0.8 },  // B4
        { t: 9.5, dur: 0.4, midi: 69, vel: 0.7 },  // A4
        { t: 10,  dur: 0.8, midi: 67, vel: 0.9 },  // G4
        { t: 11,  dur: 0.8, midi: 64, vel: 0.8 },  // E4
        // Outro
        { t: 12,  dur: 0.4, midi: 69, vel: 0.9 },  // A4
        { t: 12.5,dur: 0.4, midi: 71, vel: 0.8 },  // B4
        { t: 13,  dur: 0.4, midi: 74, vel: 0.9 },  // D5
        { t: 13.5,dur: 0.4, midi: 71, vel: 0.8 },  // B4
        { t: 14,  dur: 0.4, midi: 69, vel: 0.9 },  // A4
        { t: 14.5,dur: 0.4, midi: 67, vel: 0.8 },  // G4
        { t: 15,  dur: 0.8, midi: 64, vel: 1.0 },  // E4 final
      ],
    },
    {
      // Bajo tri octavado
      voice: 'tri',
      gainDb: -14,
      attack: 0.01,
      decay: 0.4,
      notes: [
        ...steps(0, 1, 16, { dur: 0.8, midi: 40, vel: 0.7 }),  // E2 en todos los beats
      ],
    },
    {
      // Hats noise en corcheas (cada 0.5 beats = 32 hats)
      voice: 'noise',
      gainDb: -22,
      attack: 0.002,
      decay: 0.06,
      filter: { freq: 8000, Q: 0.5 },
      notes: [
        ...steps(0, 0.5, 32, { dur: 0.1, midi: 60, vel: 0.5 }),
      ],
    },
  ],
}

// ─── ch3 · 2013 · Orquestal-8bit · 70bpm ─────────────────────────────────────
// Arpegios lentos en Re menor. Triste, espacioso, quintas graves.
// Dm: D4=62, F4=65, A4=69, D5=74
const TRACK_3 = {
  bpm: 70,
  loopBeats: 16,
  channels: [
    {
      // Arpegio tri lento en Dm (ascendente + descendente)
      voice: 'tri',
      gainDb: -14,
      attack: 0.08,
      decay: 1.2,
      notes: [
        // Arpegio 1 (Dm ascendente): D4 F4 A4 D5
        { t: 0,  dur: 1.8, midi: 62, vel: 0.8 },  // D4
        { t: 2,  dur: 1.8, midi: 65, vel: 0.7 },  // F4
        { t: 4,  dur: 1.8, midi: 69, vel: 0.7 },  // A4
        { t: 6,  dur: 1.8, midi: 74, vel: 0.6 },  // D5
        // Arpegio 2 (Am descendente): A4 F4 D4 A3)
        { t: 8,  dur: 1.8, midi: 69, vel: 0.7 },  // A4
        { t: 10, dur: 1.8, midi: 65, vel: 0.6 },  // F4
        { t: 12, dur: 1.8, midi: 62, vel: 0.7 },  // D4
        { t: 14, dur: 1.8, midi: 57, vel: 0.6 },  // A3
      ],
    },
    {
      // Notas largas graves: D2 y A2 (quinta)
      voice: 'tri',
      gainDb: -20,
      attack: 0.3,
      decay: 7.0,
      notes: [
        { t: 0, dur: 7.5, midi: 38, vel: 0.9 },   // D2
        { t: 8, dur: 7.5, midi: 45, vel: 0.8 },   // A2 (quinta)
      ],
    },
  ],
}

// ─── ch4 · 2015 · Synthwave · 100bpm ──────────────────────────────────────────
// Pads saw detuned en Am-F-C-G, 8 beats cada acorde. Lowpass con LFO lento.
// Am: A3=57,C4=60,E4=64 | F: F3=53,A3=57,C4=60 | C: C4=60,E4=64,G4=67 | G: G3=55,B3=59,D4=62
const TRACK_4 = {
  bpm: 100,
  loopBeats: 32,
  channels: [
    {
      // Pad saw detuned (dual) con lowpass LFO lento
      voice: 'saw',
      detune: 12,  // cents — detuning ligero para efecto "chorus" de synthwave
      gainDb: -16,
      attack: 0.8,
      decay: 6.5,
      filter: {
        freq: 900,
        Q: 1.5,
        lfo: { rate: 0.25, depth: 350 },
      },
      notes: [
        // Am (beats 0–7): tres notas del acorde
        { t: 0, dur: 7.5, midi: 57, vel: 0.85 },   // A3
        { t: 0, dur: 7.5, midi: 60, vel: 0.75 },   // C4
        { t: 0, dur: 7.5, midi: 64, vel: 0.65 },   // E4
        // F (beats 8–15)
        { t: 8, dur: 7.5, midi: 53, vel: 0.85 },   // F3
        { t: 8, dur: 7.5, midi: 57, vel: 0.75 },   // A3
        { t: 8, dur: 7.5, midi: 60, vel: 0.65 },   // C4
        // C (beats 16–23)
        { t: 16, dur: 7.5, midi: 60, vel: 0.85 },  // C4
        { t: 16, dur: 7.5, midi: 64, vel: 0.75 },  // E4
        { t: 16, dur: 7.5, midi: 67, vel: 0.65 },  // G4
        // G (beats 24–31)
        { t: 24, dur: 7.5, midi: 55, vel: 0.85 },  // G3
        { t: 24, dur: 7.5, midi: 59, vel: 0.75 },  // B3
        { t: 24, dur: 7.5, midi: 62, vel: 0.65 },  // D4
      ],
    },
    {
      // Bajo suave tri que refuerza la raíz
      voice: 'tri',
      gainDb: -22,
      attack: 0.3,
      decay: 7.0,
      notes: [
        { t: 0,  dur: 7.5, midi: 33, vel: 0.8 },  // A1
        { t: 8,  dur: 7.5, midi: 29, vel: 0.8 },  // F1
        { t: 16, dur: 7.5, midi: 36, vel: 0.8 },  // C2
        { t: 24, dur: 7.5, midi: 31, vel: 0.8 },  // G1
      ],
    },
  ],
}

// ─── ch5 · 2022 · Cinemático Cálido · 80bpm ──────────────────────────────────
// La mayor: A C# E. Progresión A-E-F#m-D. Pad suave + plucks tri esporádicos.
const TRACK_5 = {
  bpm: 80,
  loopBeats: 16,
  channels: [
    {
      // Pad saw filtrado muy suave (cálido)
      voice: 'saw',
      detune: 8,
      gainDb: -20,
      attack: 1.0,
      decay: 3.0,
      filter: { freq: 600, Q: 0.8, lfo: { rate: 0.15, depth: 150 } },
      notes: [
        // A major (beats 0–3): A3 C#4 E4
        { t: 0, dur: 3.8, midi: 57, vel: 0.7 },  // A3
        { t: 0, dur: 3.8, midi: 61, vel: 0.6 },  // C#4
        { t: 0, dur: 3.8, midi: 64, vel: 0.5 },  // E4
        // E major (beats 4–7): E4 G#4 B4
        { t: 4, dur: 3.8, midi: 64, vel: 0.7 },  // E4
        { t: 4, dur: 3.8, midi: 68, vel: 0.6 },  // G#4
        { t: 4, dur: 3.8, midi: 71, vel: 0.5 },  // B4
        // F#m (beats 8–11): F#3 A3 C#4
        { t: 8, dur: 3.8, midi: 54, vel: 0.7 },  // F#3
        { t: 8, dur: 3.8, midi: 57, vel: 0.6 },  // A3
        { t: 8, dur: 3.8, midi: 61, vel: 0.5 },  // C#4
        // D major (beats 12–15): D4 F#4 A4
        { t: 12, dur: 3.8, midi: 62, vel: 0.7 }, // D4
        { t: 12, dur: 3.8, midi: 66, vel: 0.6 }, // F#4
        { t: 12, dur: 3.8, midi: 69, vel: 0.5 }, // A4
      ],
    },
    {
      // Plucks tri esporádicos (esperanzadores)
      voice: 'tri',
      gainDb: -18,
      attack: 0.005,
      decay: 0.8,
      notes: [
        { t: 1,   dur: 0.5, midi: 69, vel: 0.7 },  // A4
        { t: 3,   dur: 0.5, midi: 64, vel: 0.6 },  // E4
        { t: 5,   dur: 0.5, midi: 71, vel: 0.7 },  // B4
        { t: 7,   dur: 0.5, midi: 68, vel: 0.6 },  // G#4
        { t: 9,   dur: 0.5, midi: 66, vel: 0.7 },  // F#4
        { t: 11,  dur: 0.5, midi: 61, vel: 0.6 },  // C#4
        { t: 13,  dur: 0.5, midi: 69, vel: 0.7 },  // A4
        { t: 15,  dur: 0.5, midi: 74, vel: 0.8 },  // D5 (final esperanzador)
      ],
    },
  ],
}

// ─── ch6 · 2026 · Ambient Sci-fi · (30bpm, estructural) ─────────────────────
// Sin pulso rítmico. Drone grave filtrado + destellos agudos aleatorios en Lidia.
// Escala lidia en C: C D E F# G A B
// Destellos en octava 6: C6=84, D6=86, E6=88, F#6=90, G6=91, A6=93, B6=95
const _lydianHigh = [84, 86, 88, 90, 91, 93, 95]
const _sparkleNotes = []
// 64 beats de loop, una oportunidad de destello cada 2 beats → 32 slots
for (let beat = 0; beat < 64; beat += 2) {
  const midi = _lydianHigh[Math.floor(Math.random() * _lydianHigh.length)]
  _sparkleNotes.push({ t: beat, dur: 1.5, midi, vel: 0.5, prob: 0.3 })
}

const TRACK_6 = {
  bpm: 30,
  loopBeats: 64,
  channels: [
    {
      // Drone grave: saw muy filtrado (casi sub-bass), C2=36
      voice: 'saw',
      gainDb: -18,
      attack: 3.0,
      decay: 100.0, // prácticamente sustain
      filter: { freq: 180, Q: 0.5 },
      notes: [
        { t: 0, dur: 63, midi: 36, vel: 0.9 },  // C2
      ],
    },
    {
      // Destellos agudos Lidia con prob — generativos
      voice: 'sine',
      gainDb: -24,
      attack: 0.01,
      decay: 1.2,
      notes: _sparkleNotes,
    },
  ],
}

// ─── Array de 7 tracks (índice = chapter) ────────────────────────────────────
export const TRACKS = [
  TRACK_0,  // ch0 1995
  TRACK_1,  // ch1 2001
  TRACK_2,  // ch2 2009
  TRACK_3,  // ch3 2013
  TRACK_4,  // ch4 2015
  TRACK_5,  // ch5 2022
  TRACK_6,  // ch6 2026
]
