# QA Lab: registro de la prueba (TASK-050)

Fase B: cableado en `App.vue`. Boton "Tomar la prueba" (barra) -> `StartAttempt` -> drawer `ReportPanel`. `labVersion` = `LAB_VERSION` (`'v2'`, schema.js).
- `bugOptions` = los 36 del catalogo (orden fijo, texto generico), nunca solo los activos. El solucionario solo aparece en el resultado.
- "Revelar bugs" con la prueba en curso pide confirmacion (`ConfirmDialog.vue`, sin `window.confirm`) y marca `solutionViewed`.
- Cambiar semilla/nivel (o atras/adelante) con la prueba en curso pide confirmacion y, si se acepta, **descarta** el intento.
- Sin `VITE_FIREBASE_*` el resultado se muestra igual con aviso; el doc queda en sessionStorage y "Reintentar envio" lo reenvia.
- `level` es `junior|semi|senior` en schema.js y en firestore.rules.

## Puntaje (`scoreReport`)

- Acierto: `guessedBugId` activo. Cada bug cuenta una vez; repetirlo es "duplicado" (no suma ni resta).
- Medio acierto: solo `guessedCategory` que coincide con un bug activo aun libre (consume ese bug).
- Falso positivo: bug inexistente en la semilla, o categoria sin bugs activos libres. Sin pista = "sin clasificar" (neutro).
- `score = round(100 * clamp((hits + 0.5*halfHits - 0.5*falsePositives) / activos, 0, 1))`; sin activos, 0.
- **Limitacion:** se calcula en el cliente y puede manipularse. Un puntaje confiable requiere una Cloud Function (otro ticket).

## Variables de entorno (`.env.example` en esta carpeta)

Config web **publica** (no es secreta; no poner claves de servidor). Copiar a `.env.local` (esta en `.gitignore`):

```
VITE_FIREBASE_API_KEY=
VITE_FIREBASE_AUTH_DOMAIN=multiverse-portfolio.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=multiverse-portfolio
VITE_FIREBASE_APP_ID=
```

Sin ellas `submitReport` devuelve `{ ok: false, error: 'not-configured' }` y no rompe nada.

## Reglas de Firestore

`/firestore.rules`: solo `create` en `qa_lab_attempts/{id}` con claves exactas, tipos y tamanos; todo lo demas denegado.
`firestore.rules` es GENERADO: no editar a mano. Editar `scripts/gen-firestore-rules.mjs` (o `LIMITS` en `schema.js`) y correr `node scripts/gen-firestore-rules.mjs`; `tests/qa-lab/report-rules-gen.spec.js` falla si el archivo y el generador se desincronizan.
Las reglas NO validan los findings por elemento: ni con una funcion por finding ni escritos en linea cabian en el presupuesto de evaluacion de Firestore (medido en produccion: permission-denied desde 3-4 findings; limite de llamadas a funciones y de expresiones). Por eso el documento guarda `findingsJson` (string, `JSON.stringify` del array) y `findingsCount` (0..20) en lugar de `findings`; las reglas solo acotan `findingsJson.size() <= FINDINGS_JSON_MAX` (151000, peor caso de 20 findings al tope con todo escapado) y `findingsCount`. El cliente valida cada finding y que `findingsCount` coincida (`validateSubmission`). **En la consola de Firebase el detalle de los findings se lee en `findingsJson`.** Solo existe `validAttempt` (1 llamada). Ademas: `createdAt == request.time` (el cliente manda `serverTimestamp()`), `durationMs == finishedAt - startedAt` y `finishedAt <= request.time + 5 min`.

**Test de reglas con emulador: PENDIENTE** (requiere Java; no disponible donde se desarrollo). Comando exacto, en una
maquina con Java 11+ y `npm i -D @firebase/rules-unit-testing firebase-tools`:

```
npx firebase emulators:exec --only firestore --project demo-qa-lab "npx vitest run tests/qa-lab/report-rules-emulator.spec.js"
```

(el spec de emulador aun no existe; los tests estaticos de `tests/qa-lab/report.spec.js` y `report-wiring.spec.js` si corren siempre.)

## Deploy (NO ejecutado)

Requiere que Rafael active Firestore en `multiverse-portfolio` y apruebe: `firebase deploy --only firestore:rules,firestore:indexes`.

## App Check (reCAPTCHA v3) — pasos de consola para Rafael

El codigo ya inicializa App Check en `firebase.js` cuando existe `VITE_RECAPTCHA_SITE_KEY` (import dinamico, solo en el chunk del lab).
Las reglas no cambian: el **enforcement es de consola**.

1. reCAPTCHA admin: crear una clave **v3** con los dominios `m4to.com` y `localhost`. La clave del sitio va en `VITE_RECAPTCHA_SITE_KEY`; la secreta, en la consola de App Check (nunca en el repo).
2. Firebase console > App Check > Apps: registrar la app web con proveedor reCAPTCHA v3 y esa clave secreta.
3. En dev, crear un token de depuracion (App Check > Administrar tokens de depuracion) y ponerlo en `VITE_APPCHECK_DEBUG_TOKEN` **solo en `.env.development.local`** (nunca en `.env.local`: Vite lo carga tambien en build). El codigo lo lee solo con `import.meta.env.DEV`, y un spec de build comprueba que no llega al dist.
4. Desplegar el sitio con la clave, enviar un reporte y mirar App Check > Firestore > Metricas: deben llegar requests **verificadas**.
5. Recien despues activar el **Enforcement** en Firestore (antes, se rechazarian los envios reales).
6. GCP Billing > Budgets & alerts: crear una alerta de presupuesto de **5 USD**.

## Probar el peor caso en el Rules Playground (antes del deploy)

`playground-20.json`: documento con 20 findings completos serializados en `findingsJson` (todos los campos al maximo, guessedBugId y guessedCategory no nulos).
En Firebase console > Firestore > Reglas > Rules Playground: simular **create** en `/qa_lab_attempts/x`, pegar el JSON como
datos del documento y publicar las reglas en el Playground. `createdAt` no se puede igualar a `request.time` desde el JSON, asi que
el resultado esperado es un rechazo **solo** por esa linea (esta al final de `validAttempt`, despues de evaluar los 20 findings).
Lo que hay que comprobar: que NO aparezca un error de "maximum number of expressions" / limite de expresiones. Para ver un *permitido*,
quitar temporalmente la linea `d.createdAt == request.time` solo en el Playground.
