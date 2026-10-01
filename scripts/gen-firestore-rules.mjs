// Genera /firestore.rules desde los LIMITS de src/qa-lab/report/schema.js (para que no se desalineen).
// Uso: node scripts/gen-firestore-rules.mjs          -> escribe firestore.rules
//      node scripts/gen-firestore-rules.mjs --stdout -> imprime sin escribir (lo usa el test de sincronia)
// Los findings NO se validan por elemento en las reglas (medido en produccion: excede el presupuesto de evaluacion, aun
// en linea): viajan como `findingsJson` (string acotado) + `findingsCount`; los valida el cliente (validateSubmission).
import { writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import { LIMITS, LANGS, DOC_KEYS, SCORE_KEYS, FINDINGS_JSON_MAX } from '../src/qa-lab/report/schema.js'
import { LEVELS } from '../src/qa-lab/generator/levels.js'

const q = (list) => `[${list.map((k) => `'${k}'`).join(', ')}]`
const SCORE_MAX = { value: 100, hits: LIMITS.findings, halfHits: LIMITS.findings, falsePositives: LIMITS.findings, missed: 36 }

export function generate() {
  const all = q([...DOC_KEYS, 'createdAt'])
  const score = SCORE_KEYS.map((k) => `d.score.${k} is int && d.score.${k} >= 0 && d.score.${k} <= ${SCORE_MAX[k]}`).join('\n        && ')
  return `rules_version = '2';

// GENERADO por scripts/gen-firestore-rules.mjs desde src/qa-lab/report/schema.js. NO editar a mano: editar el generador
// o LIMITS en schema.js y volver a correr \`node scripts/gen-firestore-rules.mjs\` (un test verifica que esten sincronizados).
//
// QA Lab: el cliente solo puede CREAR intentos. Lectura, update y delete denegados (los resultados se
// ven en la consola de Firebase). Alineado con src/qa-lab/report/schema.js.
// Los findings no se validan por elemento (ni con funciones ni en linea: ambas variantes excedieron el presupuesto de
// evaluacion en produccion). Se guardan como \`findingsJson\` (string <= ${FINDINGS_JSON_MAX}, peor caso de ${LIMITS.findings} findings) y
// \`findingsCount\` (0..${LIMITS.findings}); el cliente valida cada finding antes de enviar. Solo hay una funcion (validAttempt).
service cloud.firestore {
  match /databases/{database}/documents {

    function validAttempt(d) {
      return d.keys().hasOnly(${all})
        && d.keys().hasAll(${all})
        && d.seed is string && d.seed.size() > 0 && d.seed.size() <= ${LIMITS.seed}
        && d.level in ${q(LEVELS)}
        && d.lang in ${q(LANGS)}
        && d.candidate is map
        && d.candidate.keys().hasOnly(['name', 'email'])
        && d.candidate.name is string && d.candidate.name.size() > 0 && d.candidate.name.size() <= ${LIMITS.name}
        && d.candidate.email is string && d.candidate.email.size() <= ${LIMITS.email}
        && d.candidate.email.matches('^[^@ \\\\t\\\\r\\\\n]+@[^@ \\\\t\\\\r\\\\n]+\\\\.[^@ \\\\t\\\\r\\\\n]+$')
        && d.startedAt is int && d.startedAt > 0
        && d.finishedAt is int && d.finishedAt >= d.startedAt && d.finishedAt <= request.time.toMillis() + 300000
        && d.durationMs is int && d.durationMs == d.finishedAt - d.startedAt
        && d.findingsJson is string && d.findingsJson.size() <= ${FINDINGS_JSON_MAX}
        && d.findingsCount is int && d.findingsCount >= 0 && d.findingsCount <= ${LIMITS.findings}
        && d.score is map
        && d.score.keys().hasOnly(${q(SCORE_KEYS)})
        && ${score}
        && d.createdAt == request.time // al final: asi el Playground evalua antes todos los findings
        && d.solutionViewed is bool
        && d.labVersion is string && d.labVersion.size() > 0 && d.labVersion.size() <= ${LIMITS.labVersion}
        && d.userAgent is string && d.userAgent.size() <= ${LIMITS.userAgent};
    }

    match /qa_lab_attempts/{id} {
      allow create: if validAttempt(request.resource.data);
      allow get, list, update, delete: if false;
    }

    // Todo lo demas, denegado.
    match /{document=**} {
      allow get, list, create, update, delete: if false;
    }
  }
}
`
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const out = generate()
  if (process.argv.includes('--stdout')) process.stdout.write(out)
  else writeFileSync(join(dirname(fileURLToPath(import.meta.url)), '..', 'firestore.rules'), out)
}
