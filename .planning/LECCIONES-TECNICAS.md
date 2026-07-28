# Lecciones técnicas del rediseño — mato-new-portfolio

Documento vivo. Cada lección acá se pagó con al menos una ronda de review perdida o un
defecto que llegó a producción sin que nadie lo viera. **Leerlo antes de despachar
cualquier ticket de capítulo.**

Vive en `.planning/` y no en el bundle de sesión a propósito: el bundle rota sus
arrays a 15 entradas y esto tiene que sobrevivir a la rotación.

---

## 1. `overflow: hidden` crea scroll container — seis apariciones

Rompió `position: sticky` dos veces en TASK-014 y `animation-timeline: scroll(nearest)`
una vez en TASK-009, y volvió a aparecer en ch4.

**Regla del proyecto:** si el contenedor solo quiere recorte visual, usar
`overflow: clip`, **nunca** `hidden`.

## 2. Un verde no prueba nada

Los dos HIGH de TASK-014, el parallax muerto de TASK-009 y la lente espejada de TASK-010
estuvieron **todos verdes en la suite completa**. jsdom no hace layout y el WebGL está
mockeado, así que la suite es estructuralmente incapaz de ver una clase entera de defectos.

**Regla:** verificar **progresión medida en dos puntos distintos** del recorrido.
`getAnimations()` y el computed style prueban que la animación *existe*, no que *avanza*.

Corolario descubierto el 2026-07-27 en la verificación de cierre de ch4: los dos HUD
diegéticos del capítulo (`.ch4-hud-bl`, `.ch4-hud-br`, este último con el rótulo
"OCULUS RIFT CV1 / AR/VR 2015" que ancla el capítulo en su época) **nunca fueron visibles
en ningún viewport**, recortados por un `box-sizing: content-box` con `height: 100%` más
96px de padding contra un `overflow: hidden`. Ni un solo test lo vio, y tampoco lo vio
ninguna de las tres rondas de review previas.

## 3. Capturar pantalla: `Page.captureScreenshot`, nunca `toDataURL`

`canvas.toDataURL()` devuelve **bytes idénticos** aunque el WebGL esté renderizando a
110 fps bajo automatización CDP. `Page.captureScreenshot` pasa por el compositor nativo
y sí ve lo que hay.

`gl.readPixels` da negro con `preserveDrawingBuffer: false`, lo cual es **lo esperado y
no un síntoma**: activarlo tras un query param de debug y leer *dentro* del frame de dibujo.

## 4. Para lockear CSS, compilar el `<style scoped>` real

Compilar con `@vue/compiler-sfc` y verificar la cascada con `getComputedStyle`.
Los regex sobre el texto fuente son ciegos a especificidad y a cascada — así se coló
exactamente el HIGH del safeguard en TASK-014.

## 5. Los subagentes recortan alcance en silencio si no se les prohíbe

El developer de ch4 cortó la lente Sobel — el efecto firma del capítulo — por presupuesto
de sesión, sin avisar.

**Regla obligatoria en todo dispatch:** si algo de la spec no entra, **se para y se reporta
al orquestador**; nunca se recorta callado.

## 6. Chrome headed por CDP crudo — receta y bloqueadores ya resueltos

La ventana de Chrome de Rafael suele estar oculta, y `document.visibilityState: hidden`
pausa Phaser y todos los rAF. **Headless no sirve** para verificar shaders ni animaciones
de compositor: usa software rendering y degrada justo lo que hay que medir; además ignora
un `--window-size` chico.

Receta validada: levantar Chrome **headed** propio con `--remote-debugging-port` y un
`--user-data-dir` temporal en el scratchpad, manejarlo con el `WebSocket` nativo de Node 22
(no hace falta instalar nada), y fijar viewports con `Emulation.setDeviceMetricsOverride`.

Dos bloqueadores encontrados el 2026-07-27, **no los redescubras**:

- **BootScreen** exige un gesto de usuario *real*: `ctx.resume()` nunca resuelve con un
  `.click()` sintético. Usar `Input.dispatchMouseEvent`.
- La **cinemática ch2→ch3** ("la muerte de Flash", ~5.9 s) se dispara en cualquier salto
  directo a un capítulo posterior y tapa la pantalla. Se saltea con `Escape`, sin efecto
  secundario.
- **Tercer bloqueador, encontrado el 2026-07-28 en TASK-025.** Con muchas ventanas de Chrome
  abiertas (le pasó con ~50), Windows le niega `SetForegroundWindow` al proceso de
  automatización por su restricción de foreground-lock. La página queda en
  `visibilityState: hidden` y **los `Input.dispatchMouseEvent` sintéticos no llegan al DOM
  en absoluto** — confirmado con un listener en fase de captura que no recibía nada. Bloquea
  incluso el BootScreen, o sea el arnés no arranca. Se resuelve **sin depender del z-order
  real** con dos llamadas CDP: `Page.setWebLifecycleState({state:'active'})` +
  `Emulation.setFocusEmulationEnabled({enabled:true})`.

  Vale la pena entender el síntoma: no es que el click "no haga efecto", es que el evento
  **no existe**. Si un día un arnés de verificación parece colgado en el BootScreen sin
  ningún error, es esto y no un bug del sitio.

## 7. La estética la manda la spec; el límite es la navegación

Rafael, 2026-07-27: *"lo que fable 5 recomiende estéticamente yo me acoto mientras no dañe
la navegación"*.

Las specs de `.planning/design/` son la autoridad estética y **ganan sobre el texto de un
criterio de aceptación** si hay conflicto — caso resuelto: el AC5 de TASK-010 pedía "sin
scroll interno" pero la spec §8 diseñó scroll interno con fade a propósito.

El límite es medible y no es opinable: si un elemento tapa contenido, corta texto a mitad
de frase o vuelve algo inalcanzable, **se arregla igual**, aunque la spec lo haya pedido así.
La prueba es geométrica (`getBoundingClientRect()` que no intersecte cajas de texto), no a ojo.
