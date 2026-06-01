# PLAN — Fix overflow horizontal global en mobile

> Creado 2026-06-01 (Fase C ch4). Para ejecutar tras `/clear` con contexto fresco.
> Comunicación con Rafael en **español**.

## ✅ RESUELTO 2026-06-01 — era artefacto de medición, NO bug real

**El "overflow horizontal global en mobile" no existía en dispositivo real.** El diagnóstico
original (`docScrollW=482` a 390px) midió un **artefacto de Chrome headless**: en este Windows,
headless **ignora `--window-size=390`** y siempre reporta `innerWidth=482` / `screen.width=800`
(confirmado con página en blanco trivial; `--headless=old` y `--force-device-scale-factor=1`
no lo arreglan). Ver memoria [[chrome-headless-viewport-artifact]].

Verificado con **emulación mobile REAL vía CDP** (`Emulation.setDeviceMetricsOverride`
width:390 mobile:true, usando `WebSocket` global de Node 24): a 390px reales
→ **`docScrollW === innerW === 390` en ch1/ch3/ch4**, sin overflow del documento, títulos y
paneles completos sin recorte. Desktop 1366: parallax intacto. Tests 418/418.

**Cambios aplicados igual (higiene defensiva, inofensivos):**
- `index.html` — guard global `html,body { overflow-x:hidden; max-width:100% }`.
- `Chapter4Content.vue` — mobile: capas estáticas `inset:0; width/height:100%` (sin overscan).
- `Chapter3Content.vue` — mobile: capas `left:0; width:100%` (quita overscan lateral inútil sin
  puntero; conserva el vertical para el drift de scroll).

Lo de abajo queda como registro del razonamiento original (premisa parcialmente errónea).

## Contexto / problema

En viewports angostos (mobile) el contenido de varios chapters aparece **recortado a ambos
lados** (ej. ch3 título "THE DEATH OF FLASH" cortado; ch4 paneles cortados). Causa: el
documento se hace más ancho que el viewport → `.chapter-section` (que es `display:flex;
justify-content:center`) **centra** el contenido sobreancho y lo recorta por izquierda y derecha.

NO lo introdujo el trabajo de ch4 — es **pre-existente y global** (afecta chapters que no se
tocaron, como ch3).

## Diagnóstico (hecho, con evidencia en vivo)

Medido con un script temporal (`document.documentElement.scrollWidth` + scan de elementos cuyo
`getBoundingClientRect().right > clientWidth`) a 390px de ancho de ventana headless:

- **`docScrollW = 482` y `clientWidth = 482`** (el viewport de layout se expandió de 390 → 482).
- **Únicos elementos que desbordan**: las capas de parallax, todas en `-37 → 504`:
  - `div.ch3-layer--sky`, `--mountains`, `--path`
  - `div.ch4-layer--matrix`, `--glyphs`, `--character`, `--near`, `div.ch4-character-art`
- Esas capas usan `inset: -8%; width: 116%` (overscan para el movimiento del parallax).

Datos relevantes del CSS actual:
- `.scroll-shell` (el scroller, `ScrollShell.vue`) YA tiene `overflow-x: hidden` + `overflow-y: scroll` + `scroll-snap-type: y mandatory`.
- `.chapter-section` YA tiene `overflow: hidden`.
- **`html, body` (en `index.html`) NO tienen `overflow-x: hidden`** → el viewport de layout
  puede expandirse al ancho del contenido en mobile (`width=device-width`).
- Las capas viven en contenedores con overflow:hidden (`.ch3-parallax` sticky, `.ch4-parallax`
  absolute) pero aún así el documento se expande → el overscan de las capas dispara la
  expansión del layout viewport mobile.

## Fix recomendado (verificar en este orden)

1. **Guard global** en `index.html`:
   ```css
   html, body { overflow-x: hidden; max-width: 100%; }
   ```
   Es seguro: el scroller es `.scroll-shell` (no el body), así que esto NO debería romper
   scroll-snap ni `position: sticky` de ch3. Es el candidato #1 para matar la expansión.

2. **Quitar overscan de las capas donde NO se mueven** (defensa + corrección de raíz):
   - **ch4**: en mobile las capas ya son estáticas (`@media (max-width:599px) .ch4-layer { transform: none }`).
     → añadir en ese mismo media query: `.ch4-layer { inset: 0; width: 100%; height: 100%; }`.
     Sin movimiento no necesitan overscan. (`Chapter4Content.vue`)
   - **ch3**: ⚠️ las capas SÍ se mueven en mobile (parallax acoplado a scroll vía `--sx`).
     Si se les quita todo el overscan, los bordes podrían revelarse al scrollear. Opciones:
     (a) confiar en el guard global del paso 1 (mantener 116% pero clipado arriba), o
     (b) reducir overscan en mobile a algo chico (ej. `inset:-2%; width:104%`).
     Probar (a) primero; si el guard global ya lo resuelve, no tocar ch3. (`Chapter3Content.vue`)

3. Revisar si hay OTROS chapters con capas overscan (el diagnóstico solo mostró ch3 y ch4;
   `BackgroundLayers.vue` usa `inset:0` sin overscan → ok). Confirmar con el script de abajo.

## Verificación

Reinyectar temporalmente en `index.html` (antes de `</body>`) este script y screenshot mobile:
```html
<script>
  setTimeout(function () {
    var vw = document.documentElement.clientWidth, out = []
    document.querySelectorAll('*').forEach(function (el) {
      var r = el.getBoundingClientRect()
      if (r.width === 0) return
      if (r.right > vw + 1 || r.left < -1)
        out.push(Math.round(r.left) + '→' + Math.round(r.right) + ' ' + el.tagName.toLowerCase() + '.' + (typeof el.className==='string'?el.className.trim().split(/\s+/).join('.'):'').slice(0,70))
    })
    var b = document.createElement('pre')
    b.style.cssText = 'position:fixed;inset:0 0 auto 0;z-index:99999;background:#000;color:#0f0;font-size:9px;margin:0;padding:4px;max-height:60vh;overflow:auto;white-space:pre-wrap'
    b.textContent = 'docScrollW='+document.documentElement.scrollWidth+' vw='+vw+'\n'+(out.slice(0,30).join('\n')||'NINGUNO')
    document.body.appendChild(b)
  }, 3500)
</script>
```
Comando (usar el puerto real del dev server):
```
chrome --headless=new --disable-gpu --window-size=390,844 --virtual-time-budget=6000 \
  --screenshot=out.png "http://localhost:PORT/?ch=3"
```
**Criterio de éxito**: `docScrollW === clientWidth` (≈390) y lista "NINGUNO" en ch0..ch6.
Luego screenshots de ch1, ch3, ch4 mobile → contenido NO recortado a los lados.
**Quitar el script de debug al terminar.**

## Regresión a vigilar
- Desktop (1366 y 1882): parallax ch3/ch4 sigue moviéndose bien, sin bordes revelados.
- `position: sticky` de ch3 (`.ch3-parallax`) sigue funcionando con el `overflow-x:hidden` global.
- scroll-snap entre chapters intacto.
- `npm run test:run` → 418/418.

## Archivos
- `index.html` — guard global `overflow-x:hidden` en html,body.
- `src/components/Chapter4Content.vue` — `@media` mobile: capas `inset:0;width/height:100%`.
- `src/components/Chapter3Content.vue` — solo si el guard global no basta (reducir overscan mobile).
