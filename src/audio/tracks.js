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

// ─── ch1 · 2001 · GeoCities · Punk-Rock Skate · 170bpm ──────────────────────
// "Niño rebelde descubriendo que es bueno en algo que para otros es difícil."
// Estilo: Ramones/blink-182/Millencolin era skate 2001. Crudo, rápido, directo.
// Progresión I-IV-V punk en Do mayor: C(0-7) | F(8-15) | G(16-19) | F(20-23) | C(24-27) | G(28-31)
// Power chords = raíz+quinta (sin tercera): C4+G4, F4+C5, G4+D5.
// C4=60 G4=67 | F4=65 C5=72 | G4=67 D5=74 | C2=36 F2=41 G2=43
const TRACK_1 = {
  bpm: 170,
  loopBeats: 32,
  channels: [
    {
      // Power chords driving: saw filtrado, down-picking en corcheas constantes.
      // Raíz+quinta simultáneas en cada corchea (t=0, 0.5, 1, 1.5...).
      // Acentos en downbeats (vel más alta) vs. upbeats (vel más baja).
      // Saw con filter ~2200Hz: más gritón y agresivo que pulse — tipo guitarra distorsionada.
      voice: 'saw',
      gainDb: -13,
      attack: 0.003,
      decay: 0.38,
      filter: { freq: 2200, Q: 1.8 },
      notes: [
        // C power (beats 0-7, 2 compases, 16 ataques en corcheas)
        ...Array.from({ length: 16 }, (_, i) => [
          { t: i * 0.5,        dur: 0.42, midi: 60, vel: i % 2 === 0 ? 0.90 : 0.75 },  // C4
          { t: i * 0.5,        dur: 0.42, midi: 67, vel: i % 2 === 0 ? 0.80 : 0.65 },  // G4
        ]).flat(),
        // F power (beats 8-15, 2 compases)
        ...Array.from({ length: 16 }, (_, i) => [
          { t: 8 + i * 0.5,   dur: 0.42, midi: 65, vel: i % 2 === 0 ? 0.90 : 0.75 },  // F4
          { t: 8 + i * 0.5,   dur: 0.42, midi: 72, vel: i % 2 === 0 ? 0.80 : 0.65 },  // C5
        ]).flat(),
        // G power (beats 16-19, 1 compás)
        ...Array.from({ length: 8 }, (_, i) => [
          { t: 16 + i * 0.5,  dur: 0.42, midi: 67, vel: i % 2 === 0 ? 0.90 : 0.75 },  // G4
          { t: 16 + i * 0.5,  dur: 0.42, midi: 74, vel: i % 2 === 0 ? 0.80 : 0.65 },  // D5
        ]).flat(),
        // F power (beats 20-23, 1 compás — turnaround)
        ...Array.from({ length: 8 }, (_, i) => [
          { t: 20 + i * 0.5,  dur: 0.42, midi: 65, vel: i % 2 === 0 ? 0.85 : 0.70 },  // F4
          { t: 20 + i * 0.5,  dur: 0.42, midi: 72, vel: i % 2 === 0 ? 0.75 : 0.60 },  // C5
        ]).flat(),
        // C power (beats 24-27, 1 compás)
        ...Array.from({ length: 8 }, (_, i) => [
          { t: 24 + i * 0.5,  dur: 0.42, midi: 60, vel: i % 2 === 0 ? 0.90 : 0.75 },  // C4
          { t: 24 + i * 0.5,  dur: 0.42, midi: 67, vel: i % 2 === 0 ? 0.80 : 0.65 },  // G4
        ]).flat(),
        // G power (beats 28-31, turnaround final — más fuerte, empuja al loop)
        ...Array.from({ length: 8 }, (_, i) => [
          { t: 28 + i * 0.5,  dur: 0.42, midi: 67, vel: i % 2 === 0 ? 0.95 : 0.80 },  // G4
          { t: 28 + i * 0.5,  dur: 0.42, midi: 74, vel: i % 2 === 0 ? 0.85 : 0.70 },  // D5
        ]).flat(),
      ],
    },
    {
      // Bajo punk: tri en corcheas, solo raíz — corre, no camina.
      // Sigue los cambios de power chord al pie de la letra. Vel constante, crudo.
      voice: 'tri',
      gainDb: -15,
      attack: 0.005,
      decay: 0.35,
      notes: [
        ...steps(0,  0.5, 16, { dur: 0.42, midi: 36, vel: 0.80 }),  // C2 (beats 0-7)
        ...steps(8,  0.5, 16, { dur: 0.42, midi: 41, vel: 0.80 }),  // F2 (beats 8-15)
        ...steps(16, 0.5,  8, { dur: 0.42, midi: 43, vel: 0.80 }),  // G2 (beats 16-19)
        ...steps(20, 0.5,  8, { dur: 0.42, midi: 41, vel: 0.75 }),  // F2 (beats 20-23)
        ...steps(24, 0.5,  8, { dur: 0.42, midi: 36, vel: 0.80 }),  // C2 (beats 24-27)
        ...steps(28, 0.5,  8, { dur: 0.42, midi: 43, vel: 0.85 }),  // G2 (beats 28-31)
      ],
    },
    {
      // Kick drum: noise lowpass muy grave (100Hz), beats 1 y 3 de cada compás.
      // En loopBeats=32 (8 compases): kick en 0,2,4,...,30 — 16 kicks totales.
      voice: 'noise',
      gainDb: -16,
      attack: 0.001,
      decay: 0.18,
      filter: { freq: 100, Q: 0.6 },
      notes: [
        ...steps(0, 2, 16, { dur: 0.20, midi: 60, vel: 0.92 }),
      ],
    },
    {
      // Snare: noise resonante (lowpass 1800Hz, Q=4 → pico de "crack").
      // Beats 2 y 4 de cada compás: 1,3,5,...,31 — 16 snares. Backbeat punk clásico.
      voice: 'noise',
      gainDb: -18,
      attack: 0.002,
      decay: 0.12,
      filter: { freq: 1800, Q: 4 },
      notes: [
        ...steps(1, 2, 16, { dur: 0.12, midi: 60, vel: 0.80 }),
      ],
    },
    {
      // Hats en corcheas: 64 ataques, constante, imparable — energía skate-punk.
      voice: 'noise',
      gainDb: -24,
      attack: 0.002,
      decay: 0.06,
      filter: { freq: 7000, Q: 0.5 },
      notes: [
        ...steps(0, 0.5, 64, { dur: 0.07, midi: 60, vel: 0.55 }),
      ],
    },
    {
      // Hook de lead: pulse, aparece SOLO en los últimos 8 beats (compases 7-8).
      // Corto y descarado — tipo intro de guitarra punk, no melodía continua.
      // Compás 7 (sobre C): ascendente G4→E5 con pausa.
      // Compás 8 (sobre G): G4→G5 apoteósico, nota larga que cierra el loop.
      voice: 'pulse',
      duty: 0.5,
      gainDb: -12,
      attack: 0.005,
      decay: 0.30,
      notes: [
        // Compás 7 — riff ascendente sobre C (beats 24-27)
        { t: 24.0, dur: 0.42, midi: 67, vel: 0.85 },  // G4
        { t: 24.5, dur: 0.42, midi: 69, vel: 0.80 },  // A4
        { t: 25.0, dur: 0.42, midi: 72, vel: 0.90 },  // C5
        { t: 25.5, dur: 0.42, midi: 74, vel: 0.85 },  // D5
        { t: 26.0, dur: 0.85, midi: 76, vel: 0.95 },  // E5 (aguanta, respira en beat 27)
        // Compás 8 — hook resolutivo sobre G (beats 28-31)
        { t: 28.0, dur: 0.42, midi: 67, vel: 0.88 },  // G4
        { t: 28.5, dur: 0.42, midi: 71, vel: 0.82 },  // B4
        { t: 29.0, dur: 0.42, midi: 74, vel: 0.90 },  // D5
        { t: 29.5, dur: 0.42, midi: 79, vel: 0.95 },  // G5 (cima)
        { t: 30.0, dur: 1.80, midi: 76, vel: 0.90 },  // E5 (larga, prepara el loop)
      ],
    },
  ],
}

// ─── ch2 · 2009 · Newgrounds · Industrial Ominoso · 140bpm ──────────────────
// "Progreso fuerte y seguro con fondo ominoso — impending doom."
// Mi menor: E2=40 G2=43 B2=47 D2=38 B1=35
// Tritono E–Bb: Bb1=34 (A#1) contra E2=40 → amenaza latente diatónica.
// Estructura: kick 4x4 + clank metálico backbeat + bajo driving ostinato + drone tritono.
const TRACK_2 = {
  bpm: 140,
  loopBeats: 32,
  channels: [
    {
      // Kick mecánico: noise lowpass muy grave — golpe industrial 4-on-the-floor.
      // attack 0.001 = instantáneo. decay corto = no reverbera, seco y duro.
      voice: 'noise',
      gainDb: -16,
      attack: 0.001,
      decay: 0.14,
      filter: { freq: 130, Q: 0.8 },
      notes: [
        ...steps(0, 1, 32, { dur: 0.15, midi: 60, vel: 0.90 }),
      ],
    },
    {
      // Clank metálico: noise resonante en backbeat (2º y 4º tiempo de cada compás).
      // Lowpass a 3800 Hz con Q=5 → pico resonante que emula el "ring" del metal.
      // En loopBeats=32 (8 compases × 4 beats): t=1,3,5,...,31 = 16 clanks.
      voice: 'noise',
      gainDb: -20,
      attack: 0.002,
      decay: 0.07,
      filter: { freq: 3800, Q: 5 },
      notes: [
        ...steps(1, 2, 16, { dur: 0.07, midi: 60, vel: 0.75 }),
      ],
    },
    {
      // Bajo driving: saw filtrado, riff ostinato en Em en corcheas.
      // Patrón de 4 beats (corcheas): E2 G2 D2 E2 | B1 E2 G2 D2 — confiado, mecánico.
      // Se repite 8 veces cerrando los 32 beats del loop.
      voice: 'saw',
      gainDb: -13,
      attack: 0.008,
      decay: 0.35,
      filter: { freq: 800, Q: 1.2 },
      notes: [
        // 8 repeticiones del patrón base (b = inicio del compás de 4 beats)
        ...Array.from({ length: 8 }, (_, i) => {
          const b = i * 4
          return [
            { t: b + 0.0, dur: 0.45, midi: 40, vel: 0.85 },  // E2
            { t: b + 0.5, dur: 0.45, midi: 43, vel: 0.75 },  // G2 (tercera menor)
            { t: b + 1.0, dur: 0.45, midi: 38, vel: 0.80 },  // D2 (séptima menor)
            { t: b + 1.5, dur: 0.45, midi: 40, vel: 0.85 },  // E2
            { t: b + 2.0, dur: 0.45, midi: 35, vel: 0.75 },  // B1 (quinta grave)
            { t: b + 2.5, dur: 0.45, midi: 40, vel: 0.80 },  // E2
            { t: b + 3.0, dur: 0.45, midi: 43, vel: 0.75 },  // G2
            { t: b + 3.5, dur: 0.45, midi: 38, vel: 0.70 },  // D2
          ]
        }).flat(),
      ],
    },
    {
      // Drone ominoso: Bb1(34) contra E(40) = TRITONO (tritono = disonancia máxima).
      // gainDb muy bajo — se siente más que se oye. Attack 3.5s: emerge lentamente.
      // Refuerza la sensación de "algo va a pasar" sin dominar la mezcla.
      voice: 'saw',
      gainDb: -27,
      attack: 3.5,
      decay: 90.0,
      filter: { freq: 200, Q: 0.4 },
      notes: [
        { t: 0, dur: 31.5, midi: 34, vel: 1.0 },  // Bb1 — tritono vs E
      ],
    },
    {
      // Stabs oscuros esporádicos: quinta E2-B2, con prob=0.5 para variación generativa.
      // Puntúan la progresión, añaden tensión sin saturar. Compás 2, 4, 6 y 8.
      voice: 'pulse',
      duty: 0.5,
      gainDb: -19,
      attack: 0.01,
      decay: 0.40,
      filter: { freq: 500, Q: 1.5 },
      notes: [
        { t: 4,  dur: 0.80, midi: 40, vel: 0.75, prob: 0.5 },  // E2
        { t: 4,  dur: 0.80, midi: 47, vel: 0.65, prob: 0.5 },  // B2 (quinta)
        { t: 12, dur: 0.80, midi: 40, vel: 0.75, prob: 0.5 },  // E2
        { t: 12, dur: 0.80, midi: 47, vel: 0.65, prob: 0.5 },  // B2
        { t: 20, dur: 0.80, midi: 40, vel: 0.75, prob: 0.5 },  // E2
        { t: 20, dur: 0.80, midi: 47, vel: 0.65, prob: 0.5 },  // B2
        { t: 28, dur: 0.80, midi: 33, vel: 0.80, prob: 0.5 },  // A1 (más oscuro)
        { t: 28, dur: 0.80, midi: 40, vel: 0.70, prob: 0.5 },  // E2
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
