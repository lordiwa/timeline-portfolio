// Genera /firestore.rules desde los LIMITS de src/qa-lab/report/schema.js (para que no se desalineen).
// Uso: node scripts/gen-firestore-rules.mjs          -> escribe firestore.rules
//      node scripts/gen-firestore-rules.mjs --stdout -> imprime sin escribir (lo usa el test de sincronia)
// Por que se genera: Firestore Rules limita las LLAMADAS A FUNCIONES por evaluacion (medido en produccion:
// con validFinding + 2 optStr por finding, 4 findings ya daban permission-denied). Cada finding se escribe EN LINEA
// y todo el documento se valida con una sola funcion (validAttempt).
import { writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import { LIMITS, SEVERITIES, LANGS, DOC_KEYS, SCORE_KEYS } from '../src/qa-lab/report/schema.js'
import { LEVELS } from '../src/qa-lab/generator/levels.js'

const q = (list) => `[${list.map((k) => `'${k}'`).join(', ')}]`
const FINDING_KEYS = ['id', 'page', 'description', 'severity', 'guessedBugId', 'guessedCategory']
const SCORE_MAX = { value: 100, hits: LIMITS.findings, halfHits: LIMITS.findings, falsePositives: LIMITS.findings, missed: 36 }

// string acotado u omitido/null (get(clave, null): una clave ausente cuenta como null)
const optStr = (f, key, max) =>
  `(${f}.get('${key}', null) == null || (${f}.get('${key}', null) is string && ${f}.get('${key}', null).size() > 0 && ${f}.get('${key}', null).size() <= ${max}))`

function finding(i) {
  const f = `d.findings[${i}]`
  return `        && (d.findings.size() < ${i + 1} || (${f} is map
          && ${f}.keys().hasOnly(${q(FINDING_KEYS)})
          && ${f}.id is string && ${f}.id.size() > 0 && ${f}.id.size() <= ${LIMITS.id}
          && ${f}.page is string && ${f}.page.size() <= ${LIMITS.page}
          && ${f}.description is string && ${f}.description.size() > 0 && ${f}.description.size() <= ${LIMITS.description}
          && ${f}.severity in ${q(SEVERITIES)}
          && ${optStr(f, 'guessedBugId', LIMITS.bugId)}
          && ${optStr(f, 'guessedCategory', LIMITS.category)}))`
}

export function generate() {
  const all = q([...DOC_KEYS, 'createdAt'])
  const findings = Array.from({ length: LIMITS.findings }, (_, i) => finding(i)).join('\n')
  const score = SCORE_KEYS.map((k) => `d.score.${k} is int && d.score.${k} >= 0 && d.score.${k} <= ${SCORE_MAX[k]}`).join('\n        && ')
  return `rules_version = '2';

// GENERADO por scripts/gen-firestore-rules.mjs desde src/qa-lab/report/schema.js. NO editar a mano: editar el generador
// o LIMITS en schema.js y volver a correr \`node scripts/gen-firestore-rules.mjs\` (un test verifica que esten sincronizados).
//
// QA Lab: el cliente solo puede CREAR intentos. Lectura, update y delete denegados (los resultados se
// ven en la consola de Firebase). Alineado con src/qa-lab/report/schema.js.
// Las reglas no iteran listas: \`findings\` se acota a ${LIMITS.findings} y cada indice 0..${LIMITS.findings - 1} se valida EN LINEA.
// Limite que importa: LLAMADAS A FUNCIONES por evaluacion (medido en produccion: con una funcion por finding, 4 findings
// ya daban permission-denied). Por eso aqui hay UNA sola funcion (validAttempt) y candidate, score y los findings van en linea.
// Segundo limite: ~1000 expresiones por evaluacion; probar playground-20.json (20 findings completos) en el Rules Playground.
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
        && d.findings is list && d.findings.size() <= ${LIMITS.findings}
${findings}
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
