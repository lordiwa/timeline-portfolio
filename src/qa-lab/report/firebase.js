// Envio del reporte a Firestore. El SDK se importa DINAMICAMENTE: queda en un chunk aparte y solo se
// descarga al enviar, y solo desde el bundle del lab. Config web publica (no es secreta) via VITE_FIREBASE_*.
import { COLLECTION, validateSubmission } from './schema.js'

const KEYS = {
  apiKey: 'VITE_FIREBASE_API_KEY',
  authDomain: 'VITE_FIREBASE_AUTH_DOMAIN',
  projectId: 'VITE_FIREBASE_PROJECT_ID',
  appId: 'VITE_FIREBASE_APP_ID',
}

// Accesos ESTATICOS, uno por variable: Vite reemplaza cada import.meta.env.VITE_X por su valor y NO serializa el objeto
// entero (pasar `import.meta.env` completo metia en el bundle TODAS las VITE_*, token de debug incluido). El token de
// debug solo existe en dev: en build el ternario con import.meta.env.DEV se pliega y el valor se descarta.
export function readEnv() {
  return {
    VITE_FIREBASE_API_KEY: import.meta.env.VITE_FIREBASE_API_KEY,
    VITE_FIREBASE_AUTH_DOMAIN: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
    VITE_FIREBASE_PROJECT_ID: import.meta.env.VITE_FIREBASE_PROJECT_ID,
    VITE_FIREBASE_APP_ID: import.meta.env.VITE_FIREBASE_APP_ID,
    VITE_RECAPTCHA_SITE_KEY: import.meta.env.VITE_RECAPTCHA_SITE_KEY,
    DEV: import.meta.env.DEV,
    VITE_APPCHECK_DEBUG_TOKEN: import.meta.env.DEV ? import.meta.env.VITE_APPCHECK_DEBUG_TOKEN : undefined,
  }
}

export function getFirebaseConfig(env = readEnv()) {
  const cfg = {}
  for (const [k, envKey] of Object.entries(KEYS)) {
    if (!env?.[envKey]) return null
    cfg[k] = env[envKey]
  }
  return cfg
}

let warned = false
/** App Check (reCAPTCHA v3), solo si hay VITE_RECAPTCHA_SITE_KEY; sin clave avisa UNA vez y sigue (dev/tests). */
async function initAppCheck(app, env) {
  const siteKey = env?.VITE_RECAPTCHA_SITE_KEY
  if (!siteKey) {
    if (!warned) { warned = true; console.warn('[qa-lab] App Check desactivado: falta VITE_RECAPTCHA_SITE_KEY.') }
    return
  }
  if (env.DEV && env.VITE_APPCHECK_DEBUG_TOKEN) self.FIREBASE_APPCHECK_DEBUG_TOKEN = env.VITE_APPCHECK_DEBUG_TOKEN
  const { initializeAppCheck, ReCaptchaV3Provider } = await import('firebase/app-check')
  initializeAppCheck(app, { provider: new ReCaptchaV3Provider(siteKey), isTokenAutoRefreshEnabled: true })
}

/** Nunca lanza: devuelve {ok:true,id} o {ok:false,error:'invalid'|'not-configured'|'network',message}. */
export async function submitReport(doc, env = readEnv()) {
  const v = validateSubmission(doc)
  if (!v.ok) return { ok: false, error: 'invalid', message: v.errors.join(', ') }
  const cfg = getFirebaseConfig(env)
  if (!cfg) {
    return { ok: false, error: 'not-configured', message: 'Faltan las variables VITE_FIREBASE_* (ver src/qa-lab/report/README.md).' }
  }
  try {
    const [{ initializeApp, getApps }, { getFirestore, collection, addDoc, serverTimestamp }] = await Promise.all([
      import('firebase/app'),
      import('firebase/firestore'),
    ])
    let app = getApps()[0]
    if (!app) { app = initializeApp(cfg); await initAppCheck(app, env) }
    const ref = await addDoc(collection(getFirestore(app), COLLECTION), { ...doc, createdAt: serverTimestamp() })
    return { ok: true, id: ref.id }
  } catch (e) {
    return { ok: false, error: 'network', message: String(e?.message || e) }
  }
}
