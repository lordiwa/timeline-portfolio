// Envio del reporte a Firestore. El SDK se importa DINAMICAMENTE: queda en un chunk aparte y solo se
// descarga al enviar, y solo desde el bundle del lab. Config web publica (no es secreta) via VITE_FIREBASE_*.
import { COLLECTION, validateSubmission } from './schema.js'

const KEYS = {
  apiKey: 'VITE_FIREBASE_API_KEY',
  authDomain: 'VITE_FIREBASE_AUTH_DOMAIN',
  projectId: 'VITE_FIREBASE_PROJECT_ID',
  appId: 'VITE_FIREBASE_APP_ID',
}

export function getFirebaseConfig(env = import.meta.env) {
  const cfg = {}
  for (const [k, envKey] of Object.entries(KEYS)) {
    if (!env?.[envKey]) return null
    cfg[k] = env[envKey]
  }
  return cfg
}

/** Nunca lanza: devuelve {ok:true,id} o {ok:false,error:'invalid'|'not-configured'|'network',message}. */
export async function submitReport(doc, env = import.meta.env) {
  const v = validateSubmission(doc)
  if (!v.ok) return { ok: false, error: 'invalid', message: v.errors.join(', ') }
  const cfg = getFirebaseConfig(env)
  if (!cfg) {
    return { ok: false, error: 'not-configured', message: 'Faltan las variables VITE_FIREBASE_* (ver src/qa-lab/report/README.md).' }
  }
  try {
    const [{ initializeApp, getApps }, { getFirestore, collection, addDoc }] = await Promise.all([
      import('firebase/app'),
      import('firebase/firestore'),
    ])
    const app = getApps().length ? getApps()[0] : initializeApp(cfg)
    const ref = await addDoc(collection(getFirestore(app), COLLECTION), doc)
    return { ok: true, id: ref.id }
  } catch (e) {
    return { ok: false, error: 'network', message: String(e?.message || e) }
  }
}
