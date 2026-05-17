---
name: mcp-stack
description: "MCPs registrados en el entorno de Rafael — qué hay, qué hace cada uno, qué falta"
metadata: 
  node_type: memory
  type: reference
  originSessionId: 3d0d00bd-ebb1-4343-9152-e7beb98f3251
---

## Registrados (user scope, en `C:\Users\RafaelMatovelle\.claude.json`)

| MCP | Paquete / URL | Propósito |
|---|---|---|
| **Adobe for creativity** | hosted (claude.ai) | Post-procesar pixel art: bg removal, crop, expand, ajustes HSL |
| **Google Drive / Gmail / Calendar** | hosted (claude.ai) | Pendientes de auth — no priorizados aún |
| **gsd** | `npx get-shit-done-cc@latest` | Planning / definición de trabajo. Registrado mayo 2026, requiere restart de Claude Code para conectar |

## Registrados (local scope, por-proyecto)

- **pixelforge-mcp** — `npx pixelforge-mcp@latest` (stdio). Hereda `GEMINI_API_KEY` desde la env del proceso (Rafael la tiene en env var del sistema, NO en `.claude.json`). Tools: `forge_background`, `forge_sprite`, `forge_animation`, `process_sprite`, `optimize_sprite`. NO usar `--env GEMINI_API_KEY=...` al registrar (filtra la key, ver CLAUDE.md §4.3).

## Verificar estado
```powershell
claude mcp list
```

## Tras instalar un MCP nuevo
Cerrar Claude Code (`/exit`) y volver a arrancar (`claude`). Los MCPs se cargan al inicio del proceso.
