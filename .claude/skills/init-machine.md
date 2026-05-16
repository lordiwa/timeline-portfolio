# Skill: init-machine

Procedimiento para dejar el proyecto operativo en una máquina nueva (clon fresco
o setup desde cero). Trigger automático vía `SessionStart` hook configurado en
`.claude/settings.json` — detecta primera sesión por ausencia del marker
`node_modules/.machine-initialized` (gitignored) y le inyecta a Claude este
contexto: "FIRST RUN DETECTED, ejecutar el procedimiento de
`.claude/skills/init-machine.md`".

**Comunicarse con el usuario en español. Idempotente: si un paso ya está hecho,
reportar `✅` y continuar — no re-ejecutar.**

---

## Procedimiento (ejecutar en orden)

### 1. System requirements

Verificar en paralelo:

```powershell
node --version    # esperar >= 18
npm --version
git --version
```

- Si Node falta o < 18 → reportar y abortar. El usuario debe instalar
  Node 20 LTS antes de seguir.
- Si git falta → reportar y abortar.

### 2. Git identity

```powershell
git config user.name
git config user.email
```

- Si alguno está vacío → preguntar al usuario y setear con
  `git config user.name "..."` / `git config user.email "..."` (scope local
  al repo, no global).

### 3. Git remote

```powershell
git remote -v
```

- Si no hay `origin` → reportar al usuario y pedir que corra
  `git remote add origin <url>` manualmente (no inventar URLs).

### 4. Dependencias npm

```powershell
Test-Path node_modules
```

- Si no existe → `npm install` (puede tardar 1-2 min).
- Si existe pero `npm ls` lista warnings críticos → reportar pero no fallar.

### 5. GEMINI_API_KEY

```powershell
if ($env:GEMINI_API_KEY) {
  "GEMINI_API_KEY: set, len=$($env:GEMINI_API_KEY.Length)"
} else {
  "GEMINI_API_KEY: NOT SET"
}
```

- Si está set → ✅ continuar.
- Si NO está set → el usuario tiene que correr:
  ```powershell
  setx GEMINI_API_KEY "su-api-key-aqui"
  ```
  **Importante:** después de `setx` hay que **cerrar y reabrir** PowerShell + Claude Code
  para que la env var se herede. Ver CLAUDE.md §4.2/§4.3.
- **NUNCA** sugerir `claude mcp add --env GEMINI_API_KEY=...` — fuga de key
  documentada (CLAUDE.md §4.3).

### 6. MCP servers

```powershell
claude mcp list
```

Debe aparecer al menos:
- `pixelforge` (local, registro local al proyecto)
- Adobe MCP (managed remoto)
- Google Drive / Calendar / Gmail (managed remotos)
- gsd (user scope)

Si `pixelforge` falta:
```powershell
claude mcp add pixelforge npx pixelforge-mcp@latest
```
(No usar `--env`. Hereda GEMINI_API_KEY del entorno.)

### 7. Estructura de directorios

Crear si faltan:

```powershell
foreach ($d in @("public/assets/old", "public/references", "public/assets/parallax")) {
  if (-not (Test-Path $d)) { New-Item -ItemType Directory -Path $d | Out-Null }
}
```

`public/references/` está gitignored (CLAUDE.md / `.gitignore`); si está vacío,
informar al usuario que las fotos de referencia para artist-creator van ahí
manualmente (no se generan).

### 8. Smoke test MCPs

Invocar `/project:verificar-mcps` para validar que pixelforge y Adobe MCP
responden. Si falla, reportar exactamente qué falló y los pasos de CLAUDE.md §4.2.

### 9. Smoke test build

```powershell
npm run build
```

Si el build pasa → Vite + Vue + Phaser están operativos en este equipo.
Si falla → reportar el error completo, no intentar fixes especulativos.

### 10. Marker de inicialización

Solo si **todos los pasos anteriores** terminaron en ✅ (o el usuario confirmó
saltarse algún paso opcional como GEMINI_API_KEY):

```powershell
New-Item -ItemType File -Path "node_modules/.machine-initialized" -Force | Out-Null
"Init OK $(Get-Date -Format 'yyyy-MM-dd HH:mm')" | Out-File "node_modules/.machine-initialized" -Encoding utf8
```

El hook `SessionStart` revisa este marker — una vez creado, no vuelve a
disparar el procedimiento.

---

## Reporte final al usuario

Formato:

```
🛠️  Init máquina nueva — mato-new-portfolio

✅ Node v20.x.x / npm 10.x.x / git 2.x
✅ Git identity: Rafael Matovelle <srparca@gmail.com>
✅ Remote origin: <url>
✅ node_modules instalado (N paquetes)
✅ GEMINI_API_KEY set
✅ MCPs: pixelforge, Adobe, gsd
✅ Dirs: public/assets/old/, public/references/, public/assets/parallax/
✅ /project:verificar-mcps PASS
✅ npm run build PASS
✅ Marker creado: node_modules/.machine-initialized

Listo. Próximo paso: npm run dev → http://127.0.0.1:5173/
```

Si algo falló (❌), listar exactamente:
- Qué falló
- Qué línea ejecutar para arreglarlo
- Si requiere acción del usuario (setx, restart shell, etc.)

**No** marcar el marker si quedaron ❌ — la próxima sesión debe volver a
disparar el procedimiento.

---

## Cómo desactivar el auto-trigger

Si el usuario quiere que el hook deje de dispararse permanentemente
(p.ej. para debugging del propio hook), crear el marker manualmente:

```powershell
New-Item node_modules/.machine-initialized -ItemType File -Force
```

O eliminar/comentar el bloque `SessionStart` en `.claude/settings.json`.
