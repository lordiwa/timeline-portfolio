// Temas genericos. Solo datos visuales; los textos viven en i18n (theme.<id>.*).
// hue base (0-360) + familia tipografica del sistema (sin fuentes pesadas) + radio.
export const THEMES = [
  { id: 'store', hue: 215, font: 'sans', radius: 6 },
  { id: 'clinic', hue: 175, font: 'sans', radius: 10 },
  { id: 'gym', hue: 8, font: 'sans', radius: 2 },
  { id: 'travel', hue: 195, font: 'serif', radius: 12 },
  { id: 'restaurant', hue: 24, font: 'serif', radius: 4 },
  { id: 'library', hue: 35, font: 'serif', radius: 2 },
  { id: 'bank', hue: 225, font: 'sans', radius: 4 },
  { id: 'school', hue: 265, font: 'sans', radius: 8 },
]

export const THEME_IDS = THEMES.map((t) => t.id)
