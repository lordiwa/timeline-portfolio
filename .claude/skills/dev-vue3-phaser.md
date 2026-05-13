---
name: dev-vue3-phaser
description: >
  Desarrolla componentes Vue 3, escenas Phaser 3, configuración Vite y deploys
  para el proyecto mato-new-portfolio. Usar cuando se pida: crear escena Phaser, integrar
  personaje animado, configurar parallax, ajustar Vite, hacer deploy, escribir
  componentes Vue, integrar Phaser dentro de Vue.
---

# Skill: Desarrollo Vue 3 + Vite + Phaser

## Configuración del proyecto

```
Stack:    Vue 3 (Composition API) + Vite 5 + Phaser 3.86
Idioma:   JavaScript ESM (sin TypeScript)
Resol.:   480×270 virtual, zoom ×3 → 1440×810 en pantalla
Pixel:    pixelArt: true en Phaser.Game config
Server:   http://127.0.0.1:5173/ (npm run dev)
OS:       Windows 11 / PowerShell 5.1
```

---

## Estructura de archivos relevante

```
src/
├── main.js              ← Phaser.Game: 480×270, zoom 3, pixelArt: true
└── scenes/
    └── ParallaxScene.js ← tileSprites con scrollFactor + fallback procedural
public/
└── assets/
    ├── parallax/        ← PNG de capas generados por pixelforge
    └── hero/            ← sprites del personaje
vite.config.js           ← host: '127.0.0.1', port: 5173, open: true
index.html               ← image-rendering: pixelated en canvas, HUD
```

---

## Configuración de Phaser (referencia)

```js
// src/main.js
new Phaser.Game({
  type: Phaser.AUTO,
  width: 480,
  height: 270,
  zoom: 3,
  pixelArt: true,
  backgroundColor: '#1a1a2e',
  scene: [ParallaxScene]
})
```

---

## Sistema de capas parallax

```js
// src/scenes/ParallaxScene.js — configuración de capas target (3 capas opacas)
const LAYERS = [
  { key: 'layer-01-sky',       file: 'layer-01-sky.png',       scrollFactor: 0.05 },
  { key: 'layer-04-mid-trees', file: 'layer-04-mid-trees.png', scrollFactor: 0.50 },
  { key: 'layer-05-ground',    file: 'layer-05-ground.png',    scrollFactor: 1.00 }
];
```

**Nota:** Las capas 02 y 03 tienen artefactos documentados (ver CLAUDE.md sección 5.1).
El plan vigente es reducir a estas 3 capas opacas.

---

## Controles de la escena

```js
// Mover cámara con teclas (ya implementado)
// ← → / A D — mover cámara
// Shift — acelerar 3x

// Integrar animación de personaje (próxima tarea):
// - idle cuando no hay tecla presionada
// - walk cuando A/D/←/→ está activa
```

---

## Integrar personaje animado (próxima tarea)

```js
// En preload():
this.load.spritesheet('hero', 'assets/hero/hero-sheet.png', {
  frameWidth: 48,  // ajustar según el sprite real
  frameHeight: 64
})

// En create():
this.anims.create({
  key: 'walk',
  frames: this.anims.generateFrameNumbers('hero', { start: 0, end: 5 }),
  frameRate: 8,
  repeat: -1
})
this.anims.create({
  key: 'idle',
  frames: this.anims.generateFrameNumbers('hero', { start: 0, end: 0 }),
  frameRate: 1,
  repeat: -1
})

// Sprite fijo al centro (no se mueve con la cámara):
this.hero = this.add.sprite(240, 135, 'hero')  // centro de 480×270
this.hero.setScrollFactor(0)
this.hero.play('idle')

// En update():
const cursors = this.input.keyboard.createCursorKeys()
const wasd = this.input.keyboard.addKeys('W,A,S,D')
const moving = cursors.left.isDown || cursors.right.isDown ||
               wasd.A.isDown || wasd.D.isDown

if (moving) {
  if (!this.hero.anims.isPlaying || this.hero.anims.currentAnim.key !== 'walk') {
    this.hero.play('walk')
  }
} else {
  if (!this.hero.anims.isPlaying || this.hero.anims.currentAnim.key !== 'idle') {
    this.hero.play('idle')
  }
}
```

---

## Placeholders procedurales

`ParallaxScene.ensurePlaceholders()` detecta si los PNG reales existen.
Si no existen, genera placeholders en canvas para poder validar el efecto parallax
**sin assets**. Al poner los PNG reales en `public/assets/parallax/`, los placeholders
quedan inactivos automáticamente.

---

## Deploy

```powershell
# Build de producción:
npm run build
# Output en dist/

# Preview local del build:
npm run preview

# Deploy a Netlify (drop de dist/ en netlify.com/drop) o:
# npx netlify-cli deploy --prod --dir=dist
```

---

## Comandos útiles en PowerShell

```powershell
npm run dev        # servidor de desarrollo
npm run build      # build producción
npm run preview    # preview del build
npm install        # instalar dependencias
```
