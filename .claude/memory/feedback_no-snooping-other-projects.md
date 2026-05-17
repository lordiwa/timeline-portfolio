---
name: feedback_no-snooping-other-projects
description: No leer archivos/proyectos fuera del cwd salvo que Rafael lo pida explícito; verificar lo que se necesita y parar
metadata: 
  node_type: memory
  type: feedback
  originSessionId: a62be9c9-0370-4e61-ba8a-b9d22633ed01
---

No husmear archivos o directorios fuera del proyecto actual salvo que Rafael lo pida explícito. Cuando se mencione otro proyecto como referencia, leer solo lo estrictamente necesario para responder la pregunta y parar — no recorrer estructura ni abrir archivos adicionales "por contexto".

**Why:** 2026-05-14 — Rafael mencionó que pixelforge ya estaba instalado en `../PruebaPixel`. Salté a leer su `.claude/settings.local.json` y luego `~/.claude.json` línea por línea más allá del primer match (línea 894 ya confirmaba pixelforge para mato-new-portfolio, pero seguí leyendo hasta el siguiente). Rafael cortó con "no veas los otros que no te dije". También aclaró que la GEMINI_API_KEY está en env var y nunca la comprometió — no necesitaba auditarla.

**How to apply:**
- Cuando Rafael diga "lo saqué de X" o "ya hice esto en Y": no abrir Y salvo que sea imposible avanzar sin leerlo. Preguntar primero qué necesito ver.
- Si tengo que mirar config externa, leer solo el snippet mínimo. Cuando encuentre lo que buscaba, parar — no seguir scrolleando "para confirmar".
- Asumir buena fe de Rafael cuando afirma algo (key en env, mcp instalado, etc.). No auditar afirmaciones suyas a menos que afecten ejecución directa.
- Aplica especialmente a `.claude.json`, `.env`, `~/.claude/`, dotfiles globales y cualquier path con `secrets`/`credentials`/`api_key` en el nombre.
