#!/usr/bin/env node
/**
 * enforce-hivemind.mjs — PreToolUse guard.
 *
 * Establecido por Rafael el 2026-07-27 tras el incidente de TASK-007: el orquestador
 * se salteo el contrato de CLAUDE.md, despacho agentes genericos en vez de los de
 * hivemind, y esos agentes tocaron archivos fuera del ticket y rompieron el minijuego
 * de ch2, el dial-up de 2001, la multitud de ch5 y la escena de ch6.
 *
 * Los agentes de hivemind traen restricciones que los genericos no tienen:
 * allowedTools por rol, tiers de verificacion y review obligatorio en contexto fresco.
 *
 * REGLA: Agent y Workflow solo pasan si el trabajo va por hivemind.
 *   - Agent    -> subagent_type debe empezar con "hivemind:"
 *   - Workflow -> o bien name empieza con "hivemind:", o bien TODA llamada agent()
 *                 del script declara un agentType "hivemind:*"
 *
 * Contrato del hook: exit 2 + stderr bloquea la llamada y le muestra el motivo a Claude.
 *
 * NO QUITAR. Rafael: "haz eso y nunca lo quites".
 */

import { readFileSync } from 'node:fs'

const ALLOWED_PREFIX = 'hivemind:'

function deny(reason) {
  process.stderr.write(`[enforce-hivemind] LLAMADA BLOQUEADA.\n${reason}\n\n` +
    `Este proyecto se opera por hivemind. Reencaminá el trabajo:\n` +
    `  - subagentes: Agent con subagent_type "hivemind:developer" | "hivemind:researcher" | ` +
    `"hivemind:reviewer" | "hivemind:security-reviewer"\n` +
    `  - varios tickets seguidos: /hivemind:loop\n` +
    `  - review de un diff grande: /hivemind:deep-review\n` +
    `  - investigacion amplia: /hivemind:deep-research\n`)
  process.exit(2)
}

function readStdin() {
  try {
    return readFileSync(0, 'utf8')
  } catch {
    return ''
  }
}

let payload
try {
  payload = JSON.parse(readStdin() || '{}')
} catch {
  // Si no se puede parsear la entrada, no bloqueamos: el hook no debe romper la sesion.
  process.exit(0)
}

const toolName = payload.tool_name || ''
const input = payload.tool_input || {}

if (toolName === 'Agent') {
  const type = input.subagent_type || ''
  if (!type.startsWith(ALLOWED_PREFIX)) {
    deny(`Agent con subagent_type "${type || '(vacio)'}", que no es de hivemind.`)
  }
  process.exit(0)
}

if (toolName === 'Workflow') {
  const name = input.name || ''
  if (name.startsWith(ALLOWED_PREFIX)) process.exit(0)

  let script = input.script || ''
  if (!script && input.scriptPath) {
    try {
      script = readFileSync(input.scriptPath, 'utf8')
    } catch {
      deny(`Workflow con scriptPath ilegible (${input.scriptPath}): no se puede auditar.`)
    }
  }

  if (!script) {
    deny(`Workflow "${name || '(sin nombre)'}" sin script auditable y sin nombre de hivemind.`)
  }

  // Toda llamada agent() debe declarar su agentType, y ese tipo debe ser de hivemind.
  const agentCalls = (script.match(/\bagent\s*\(/g) || []).length
  const declaredTypes = [...script.matchAll(/agentType\s*:\s*['"`]([^'"`]+)['"`]/g)].map((m) => m[1])

  if (agentCalls > declaredTypes.length) {
    deny(
      `El script declara ${agentCalls} llamada(s) agent() pero solo ${declaredTypes.length} ` +
      `agentType. Las llamadas sin agentType usan el subagente generico del workflow, que no ` +
      `tiene las restricciones de hivemind.`,
    )
  }

  const intrusos = declaredTypes.filter((t) => !t.startsWith(ALLOWED_PREFIX))
  if (intrusos.length) {
    deny(`El script usa agentType fuera de hivemind: ${[...new Set(intrusos)].join(', ')}.`)
  }
}

process.exit(0)
