---
name: routing-gsd-executor-mcp-bug
description: "Cuando un plan GSD requiere MCP tools (pixelforge/Adobe/etc.) y gsd-executor falla con \"No such tool available\", re-routar a agentes especialistas del proyecto con allowedTools MCP explícito."
metadata: 
  node_type: memory
  type: feedback
  originSessionId: 12ecb221-ea5c-4124-9ef0-bc4f0ec91ee9
---

Cuando un plan GSD (ejecutado vía `gsd-executor` con `isolation="worktree"`) requiere MCP tools (pixelforge, Adobe MCP, etc.) y reporta `Error: No such tool available` para esos tools — es bug upstream Claude Code #13898: `tools:` frontmatter restrictivo strip los MCP tools al spawn de subagentes worktree-isolated. Los servidores MCP están `Connected` al process root pero no propagan al subagente.

**Why:** documentado en Phase 5 W1 (2026-05-14): gsd-executor falló al generar 8 pixel-art assets ch6 con pixelforge; los 3 intentos (`forge_background`, `forge_sprite`, `adobe_mandatory_init`) devolvieron "No such tool available" pese a que `claude mcp list` confirmaba ambos servers conectados y `GEMINI_API_KEY` heredada del env.

**How to apply:**
1. Si el blocker es por MCP tools missing en gsd-executor, NO retry — el bug es upstream y no se resuelve por sí solo.
2. Revertir cualquier SUMMARY.md "BLOCKED" que el executor haya commiteado (`git revert <hash>`).
3. Buscar agentes especialistas del proyecto en `.claude/agents/` cuyo `allowedTools` liste el MCP necesario:
   - pixelforge → [[mcp-stack]] artist-creator (`allowedTools: mcp__pixelforge__*`)
   - Adobe MCP → artist-editor (`allowedTools: mcp__claude_ai_Adobe_for_creativity__*`)
4. Despachar al especialista con instrucciones explícitas — el subagente con allowedTools list explícita SÍ recibe los MCP tools.
5. El especialista no puede Write/Edit, solo Read+Bash+MCP. El orchestrator escribe SUMMARY.md manualmente tras recibir el reporte.
6. Tras éxito, commit atómico del SUMMARY.md y `gsd-sdk query roadmap.update-plan-progress` normal — el flujo GSD continúa intacto.

**Cost del workaround:** un round-trip extra (revert + 2 dispatches) pero conserva commits atómicos, tracking, y no requiere mover la fase fuera de GSD. Aplicable a Phase 6 si surge asset work adicional.
