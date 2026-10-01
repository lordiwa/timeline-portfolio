# QA Lab: registro de la prueba (TASK-050, fase A)

Piezas autonomas, **sin cablear** en `App.vue` todavia: `scorer.js`, `schema.js`, `firebase.js`, `useAttempt.js`,
`StartAttempt.vue`, `ReportPanel.vue`.

## Puntaje (`scoreReport`)

- Acierto: `guessedBugId` activo. Cada bug cuenta una vez; repetirlo es "duplicado" (no suma ni resta).
- Medio acierto: solo `guessedCategory` que coincide con un bug activo aun libre (consume ese bug).
- Falso positivo: bug inexistente en la semilla, o categoria sin bugs activos libres. Sin pista = "sin clasificar" (neutro).
- `score = round(100 * clamp((hits + 0.5*halfHits - 0.5*falsePositives) / activos, 0, 1))`; sin activos, 0.
- **Limitacion:** se calcula en el cliente y puede manipularse. Un puntaje confiable requiere una Cloud Function (otro ticket).

## Variables de entorno (`.env.example`)

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
Limitacion: las reglas no iteran listas; cada elemento de `findings` solo se valida en el cliente (en reglas: `size() <= 50`).

**Test de reglas con emulador: PENDIENTE** (requiere Java; no disponible donde se desarrollo). Comando exacto, en una
maquina con Java 11+ y `npm i -D @firebase/rules-unit-testing firebase-tools`:

```
npx firebase emulators:exec --only firestore --project demo-qa-lab "npx vitest run tests/qa-lab/report-rules-emulator.spec.js"
```

(el spec de emulador aun no existe; el test estatico bloque estatico de `tests/qa-lab/report.spec.js` si corre siempre.)

## Deploy (NO ejecutado)

Requiere que Rafael active Firestore en `multiverse-portfolio` y apruebe: `firebase deploy --only firestore:rules,firestore:indexes`.
