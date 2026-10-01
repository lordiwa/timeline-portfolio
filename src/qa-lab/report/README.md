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
Las reglas no iteran listas: `findings` se acota a 30 y cada indice 0..29 se valida con `validFinding`. Ademas: `createdAt == request.time` (el cliente manda `serverTimestamp()`), `durationMs == finishedAt - startedAt` y `finishedAt <= request.time + 60 s`.

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
3. En dev, crear un token de depuracion (App Check > Administrar tokens de depuracion) y ponerlo en `VITE_APPCHECK_DEBUG_TOKEN`.
4. Desplegar el sitio con la clave, enviar un reporte y mirar App Check > Firestore > Metricas: deben llegar requests **verificadas**.
5. Recien despues activar el **Enforcement** en Firestore (antes, se rechazarian los envios reales).
6. GCP Billing > Budgets & alerts: crear una alerta de presupuesto de **5 USD**.
