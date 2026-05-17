// src/phaser/ch2/MatchScene.js — Match-3 60s scene para ch2 mini-advergame (Phase 04.2).
//
// Mechanics:
//   - 6x6 grid de tiles, 5 tipos (cursor/banner/gem/joystick/star).
//   - Click tile → click adjacent tile → swap.
//   - 3+ matching in row/col → clear, score, gravity refill, cascade re-check.
//   - 60s timer countdown. End → overlay con score + RESTART.
//   - Score: 3=30pts, 4=60pts, 5+=120pts, cascada multiplica ×2 por cada chain.
//
// PRM (prefers-reduced-motion): tweens reemplazados por instant transitions.
// Sin sprites externos — tiles son Graphics primitives (background + glyph text).

import Phaser from 'phaser'

const GRID_COLS = 6
const GRID_ROWS = 6
const TILE_SIZE = 52
const TILE_GAP = 4
const GRID_OFFSET_X = (360 - (GRID_COLS * TILE_SIZE + (GRID_COLS - 1) * TILE_GAP)) / 2
const GRID_OFFSET_Y = 80
const TIME_LIMIT = 60_000  // 60s in ms

// 5 tile types — cada uno: { color, glyph, glow }
const TILE_TYPES = [
  { color: 0x5af2ff, glow: 0x5af2ff, glyph: '▲' }, // cursor (cyan)
  { color: 0xff7a1a, glow: 0xffaa44, glyph: '▭' }, // banner (orange)
  { color: 0xb8ff3a, glow: 0xddff88, glyph: '◆' }, // gem (lime)
  { color: 0xff44aa, glow: 0xff88cc, glyph: '⊕' }, // joystick (magenta)
  { color: 0xffdd44, glow: 0xffee88, glyph: '★' }, // star (yellow)
]

export class MatchScene extends Phaser.Scene {
  constructor() {
    super({ key: 'MatchScene' })
  }

  create() {
    this.prefersReduced = !!this.registry.get('prefersReduced')

    // Grid model: 2D array de números 0..4 (tipo de tile)
    this.grid = []
    // Sprites paralelos: 2D array de Phaser.GameObjects.Container
    this.tiles = []
    // Estado de input
    this.firstSelected = null
    this.locked = false  // bloquea input durante animaciones
    this.score = 0
    this.timeLeft = TIME_LIMIT
    this.gameOver = false

    // HUD: time + score
    this.timeText = this.add.text(20, 20, this.formatTime(this.timeLeft), {
      fontFamily: 'VT323, monospace',
      fontSize: '20px',
      color: '#5af2ff',
    })
    this.scoreText = this.add.text(360 - 20, 20, 'SCORE 0', {
      fontFamily: 'VT323, monospace',
      fontSize: '20px',
      color: '#b8ff3a',
    }).setOrigin(1, 0)

    // Hint line VT323
    this.add.text(180, 52, 'MATCH 3+ · 60s', {
      fontFamily: 'VT323, monospace',
      fontSize: '14px',
      color: 'rgba(248, 252, 255, 0.6)',
    }).setOrigin(0.5, 0).setAlpha(0.7)

    // Build initial grid (no initial matches)
    this.fillGridNoMatches()
    this.renderGrid()

    // Timer
    this.timeEvent = this.time.addEvent({
      delay: 100,
      loop: true,
      callback: () => this.tickTime(100),
    })

    // PRM: scenes/registry already consulted; tweens disabled in helpers below.
  }

  // ─────────────────────────────────────────────────────────
  // Grid generation
  // ─────────────────────────────────────────────────────────

  fillGridNoMatches() {
    for (let r = 0; r < GRID_ROWS; r++) {
      this.grid[r] = []
      for (let c = 0; c < GRID_COLS; c++) {
        let candidate
        let attempts = 0
        do {
          candidate = Phaser.Math.Between(0, TILE_TYPES.length - 1)
          attempts++
        } while (this.wouldFormMatch(r, c, candidate) && attempts < 12)
        this.grid[r][c] = candidate
      }
    }
  }

  wouldFormMatch(r, c, type) {
    // ¿Poner `type` en (r,c) crearía un match horizontal o vertical de 3+ con celdas ya pobladas?
    // Horizontal: chequear las 2 hacia la izquierda.
    if (c >= 2 && this.grid[r][c - 1] === type && this.grid[r][c - 2] === type) return true
    // Vertical: chequear las 2 hacia arriba.
    if (r >= 2 && this.grid[r - 1][c] === type && this.grid[r - 2][c] === type) return true
    return false
  }

  renderGrid() {
    for (let r = 0; r < GRID_ROWS; r++) {
      this.tiles[r] = []
      for (let c = 0; c < GRID_COLS; c++) {
        this.tiles[r][c] = this.createTileSprite(r, c, this.grid[r][c])
      }
    }
  }

  createTileSprite(r, c, type) {
    const { x, y } = this.gridToScreen(r, c)
    const tileDef = TILE_TYPES[type]
    const container = this.add.container(x, y)

    // Background rounded rect
    const bg = this.add.graphics()
    bg.fillStyle(tileDef.color, 1)
    bg.fillRoundedRect(-TILE_SIZE / 2, -TILE_SIZE / 2, TILE_SIZE, TILE_SIZE, 8)
    bg.lineStyle(1, 0xffffff, 0.25)
    bg.strokeRoundedRect(-TILE_SIZE / 2, -TILE_SIZE / 2, TILE_SIZE, TILE_SIZE, 8)
    container.add(bg)

    // Glyph text
    const txt = this.add.text(0, 0, tileDef.glyph, {
      fontFamily: 'Verdana, sans-serif',
      fontSize: '24px',
      color: '#050a18',
      fontStyle: 'bold',
    }).setOrigin(0.5)
    container.add(txt)

    // Interactive
    container.setSize(TILE_SIZE, TILE_SIZE)
    container.setInteractive({ useHandCursor: true })
    container.row = r
    container.col = c
    container.tileType = type
    container.on('pointerdown', () => this.onTileClick(container))

    return container
  }

  gridToScreen(r, c) {
    return {
      x: GRID_OFFSET_X + c * (TILE_SIZE + TILE_GAP) + TILE_SIZE / 2,
      y: GRID_OFFSET_Y + r * (TILE_SIZE + TILE_GAP) + TILE_SIZE / 2,
    }
  }

  // ─────────────────────────────────────────────────────────
  // Input
  // ─────────────────────────────────────────────────────────

  onTileClick(tile) {
    if (this.locked || this.gameOver) return

    if (!this.firstSelected) {
      this.firstSelected = tile
      this.highlightTile(tile, true)
      return
    }

    // Si clickeé el mismo tile → deseleccionar
    if (this.firstSelected === tile) {
      this.highlightTile(tile, false)
      this.firstSelected = null
      return
    }

    // ¿Son adyacentes?
    const a = this.firstSelected
    const b = tile
    if (this.areAdjacent(a, b)) {
      this.highlightTile(a, false)
      this.firstSelected = null
      this.attemptSwap(a, b)
    } else {
      // Cambiar selección
      this.highlightTile(a, false)
      this.highlightTile(b, true)
      this.firstSelected = b
    }
  }

  highlightTile(tile, on) {
    if (on) {
      tile.setScale(1.08)
    } else {
      tile.setScale(1.0)
    }
  }

  areAdjacent(a, b) {
    const dr = Math.abs(a.row - b.row)
    const dc = Math.abs(a.col - b.col)
    return (dr === 1 && dc === 0) || (dr === 0 && dc === 1)
  }

  // ─────────────────────────────────────────────────────────
  // Swap + Match
  // ─────────────────────────────────────────────────────────

  attemptSwap(a, b) {
    this.locked = true
    this.swapModel(a.row, a.col, b.row, b.col)

    // Animate swap visual
    const aPos = this.gridToScreen(b.row, b.col)
    const bPos = this.gridToScreen(a.row, a.col)
    const ar = a.row, ac = a.col
    const br = b.row, bc = b.col
    a.row = br; a.col = bc
    b.row = ar; b.col = ac
    this.tiles[a.row][a.col] = a
    this.tiles[b.row][b.col] = b

    this.tweenTo(a, aPos.x, aPos.y, 160, () => {
      // Check matches after swap
      const matches = this.findAllMatches()
      if (matches.length > 0) {
        this.resolveMatches(matches, 1)
      } else {
        // Revert
        this.swapModel(a.row, a.col, b.row, b.col)
        const aOrig = this.gridToScreen(ar, ac)
        const bOrig = this.gridToScreen(br, bc)
        a.row = ar; a.col = ac
        b.row = br; b.col = bc
        this.tiles[a.row][a.col] = a
        this.tiles[b.row][b.col] = b
        this.tweenTo(a, aOrig.x, aOrig.y, 160)
        this.tweenTo(b, bOrig.x, bOrig.y, 160, () => {
          this.locked = false
        })
      }
    })
    this.tweenTo(b, bPos.x, bPos.y, 160)
  }

  swapModel(r1, c1, r2, c2) {
    const tmp = this.grid[r1][c1]
    this.grid[r1][c1] = this.grid[r2][c2]
    this.grid[r2][c2] = tmp
  }

  findAllMatches() {
    const matches = []
    // Horizontal
    for (let r = 0; r < GRID_ROWS; r++) {
      let start = 0
      while (start < GRID_COLS) {
        const type = this.grid[r][start]
        let end = start
        while (end < GRID_COLS && this.grid[r][end] === type) end++
        if (end - start >= 3) {
          const cells = []
          for (let c = start; c < end; c++) cells.push([r, c])
          matches.push(cells)
        }
        start = end
      }
    }
    // Vertical
    for (let c = 0; c < GRID_COLS; c++) {
      let start = 0
      while (start < GRID_ROWS) {
        const type = this.grid[start][c]
        let end = start
        while (end < GRID_ROWS && this.grid[end][c] === type) end++
        if (end - start >= 3) {
          const cells = []
          for (let r = start; r < end; r++) cells.push([r, c])
          matches.push(cells)
        }
        start = end
      }
    }
    return matches
  }

  resolveMatches(matches, chain) {
    // Dedupe (un tile puede estar en horizontal Y vertical match)
    const seen = new Set()
    const toClear = []
    for (const group of matches) {
      const baseScore = group.length === 3 ? 30 : group.length === 4 ? 60 : 120
      this.score += baseScore * chain
      for (const [r, c] of group) {
        const k = `${r},${c}`
        if (!seen.has(k)) {
          seen.add(k)
          toClear.push([r, c])
        }
      }
    }
    this.scoreText.setText(`SCORE ${this.score}`)

    // Animación clear (fade + scale)
    toClear.forEach(([r, c]) => {
      const tile = this.tiles[r][c]
      if (!tile) return
      this.tweenClear(tile, () => tile.destroy())
      this.tiles[r][c] = null
      this.grid[r][c] = -1
    })

    // Después de clear, gravity + refill
    const delay = this.prefersReduced ? 0 : 220
    this.time.delayedCall(delay, () => this.applyGravityAndRefill(chain))
  }

  applyGravityAndRefill(chain) {
    // Compactar columnas hacia abajo
    for (let c = 0; c < GRID_COLS; c++) {
      let writeRow = GRID_ROWS - 1
      for (let r = GRID_ROWS - 1; r >= 0; r--) {
        if (this.grid[r][c] !== -1) {
          if (r !== writeRow) {
            this.grid[writeRow][c] = this.grid[r][c]
            this.grid[r][c] = -1
            const tile = this.tiles[r][c]
            this.tiles[writeRow][c] = tile
            this.tiles[r][c] = null
            if (tile) {
              tile.row = writeRow
              tile.col = c
              const pos = this.gridToScreen(writeRow, c)
              this.tweenTo(tile, pos.x, pos.y, 160)
            }
          }
          writeRow--
        }
      }
      // Refill las celdas vacías de arriba
      for (let r = writeRow; r >= 0; r--) {
        const newType = Phaser.Math.Between(0, TILE_TYPES.length - 1)
        this.grid[r][c] = newType
        const sprite = this.createTileSprite(r, c, newType)
        // Empezar arriba (off-screen) y caer
        const targetPos = this.gridToScreen(r, c)
        sprite.y = targetPos.y - (GRID_ROWS + 1) * (TILE_SIZE + TILE_GAP)
        this.tiles[r][c] = sprite
        this.tweenTo(sprite, targetPos.x, targetPos.y, 220)
      }
    }

    // Después de refill, check cascade
    const delay = this.prefersReduced ? 0 : 280
    this.time.delayedCall(delay, () => {
      const newMatches = this.findAllMatches()
      if (newMatches.length > 0) {
        this.resolveMatches(newMatches, chain + 1)
      } else {
        // Deadlock check
        if (!this.hasPossibleMove()) {
          this.reshuffle()
        }
        this.locked = false
      }
    })
  }

  hasPossibleMove() {
    // Brute-force: probar swap de cada par adyacente y ver si genera match
    for (let r = 0; r < GRID_ROWS; r++) {
      for (let c = 0; c < GRID_COLS; c++) {
        // Right swap
        if (c + 1 < GRID_COLS) {
          this.swapModel(r, c, r, c + 1)
          const m = this.findAllMatches().length > 0
          this.swapModel(r, c, r, c + 1)
          if (m) return true
        }
        // Down swap
        if (r + 1 < GRID_ROWS) {
          this.swapModel(r, c, r + 1, c)
          const m = this.findAllMatches().length > 0
          this.swapModel(r, c, r + 1, c)
          if (m) return true
        }
      }
    }
    return false
  }

  reshuffle() {
    // Destruir todos los sprites + regenerar grid
    for (let r = 0; r < GRID_ROWS; r++) {
      for (let c = 0; c < GRID_COLS; c++) {
        this.tiles[r][c]?.destroy()
        this.tiles[r][c] = null
      }
    }
    this.fillGridNoMatches()
    this.renderGrid()
  }

  // ─────────────────────────────────────────────────────────
  // Tween helper (PRM-aware)
  // ─────────────────────────────────────────────────────────

  tweenTo(obj, x, y, duration, onComplete) {
    if (this.prefersReduced) {
      obj.x = x
      obj.y = y
      onComplete && onComplete()
      return
    }
    this.tweens.add({
      targets: obj,
      x,
      y,
      duration,
      ease: 'Cubic.easeOut',
      onComplete,
    })
  }

  tweenClear(obj, onComplete) {
    if (this.prefersReduced) {
      obj.setAlpha(0)
      onComplete && onComplete()
      return
    }
    this.tweens.add({
      targets: obj,
      scale: 1.3,
      alpha: 0,
      duration: 200,
      ease: 'Back.easeIn',
      onComplete,
    })
  }

  // ─────────────────────────────────────────────────────────
  // Timer + End
  // ─────────────────────────────────────────────────────────

  tickTime(ms) {
    if (this.gameOver) return
    this.timeLeft -= ms
    if (this.timeLeft <= 0) {
      this.timeLeft = 0
      this.endGame()
    }
    this.timeText.setText(this.formatTime(this.timeLeft))
    // Colorize cuando queda poco
    if (this.timeLeft <= 10_000) {
      this.timeText.setColor('#ff7a1a')
    }
  }

  formatTime(ms) {
    const s = Math.ceil(ms / 1000)
    return `TIME ${s.toString().padStart(2, '0')}s`
  }

  endGame() {
    this.gameOver = true
    this.locked = true
    if (this.timeEvent) this.timeEvent.remove()

    // Overlay
    const overlay = this.add.graphics()
    overlay.fillStyle(0x050a18, 0.92)
    overlay.fillRect(0, 0, 360, 420)

    this.add.text(180, 140, 'TIME UP', {
      fontFamily: 'Press Start 2P, monospace',
      fontSize: '20px',
      color: '#b8ff3a',
    }).setOrigin(0.5)

    this.add.text(180, 190, `SCORE ${this.score}`, {
      fontFamily: 'VT323, monospace',
      fontSize: '28px',
      color: '#5af2ff',
    }).setOrigin(0.5)

    const matchesCount = Math.floor(this.score / 30)
    this.add.text(180, 230, `you shipped ${matchesCount} games`, {
      fontFamily: 'Verdana, sans-serif',
      fontSize: '12px',
      color: 'rgba(248, 252, 255, 0.7)',
    }).setOrigin(0.5)

    // Restart button
    const btnBg = this.add.graphics()
    btnBg.fillStyle(0xb8ff3a, 1)
    btnBg.fillRoundedRect(110, 280, 140, 36, 4)
    const btnLabel = this.add.text(180, 298, 'RESTART ▸', {
      fontFamily: 'Press Start 2P, monospace',
      fontSize: '12px',
      color: '#050a18',
    }).setOrigin(0.5)
    const btnZone = this.add.zone(180, 298, 140, 36).setInteractive({ useHandCursor: true })
    btnZone.on('pointerdown', () => {
      this.scene.restart()
    })
  }
}
