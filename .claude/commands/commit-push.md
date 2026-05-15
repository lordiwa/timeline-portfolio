# Comando: /project:commit-push

Stagea cambios, crea commit atómico con mensaje descriptivo, y pushea al remote configurado.

Uso:
- `/project:commit-push` — analiza diff y autogenera mensaje
- `/project:commit-push <mensaje>` — usa el mensaje provisto

---

Ejecutar los siguientes pasos en secuencia (NO paralelos — cada uno depende del anterior):

## 1. Diagnóstico del estado

```bash
git status --short
git diff --stat HEAD
git remote -v
git log --oneline -5
```

- Si no hay cambios (`git status` vacío excluyendo `.claude/settings.local.json`): reportar "Working tree limpio, nada que commitear" y salir.
- Si no hay remote configurado: reportar y pedir al usuario que corra `git remote add origin <url>` manualmente (el classifier bloquea esta acción cuando viene de Claude). NO inventes un URL.
- Si hay commits sin pushear (`git log origin/master..HEAD`): mencionarlo en el reporte.

## 2. Identificar qué stagear

Patrones a NO commitear automáticamente (preguntar al usuario antes):
- Archivos con `.env`, `credentials`, `secret`, `.pem`, `.key` en el nombre
- Binarios grandes (>5MB) que no estén en `public/assets/`
- `.claude/settings.local.json` (cambia automáticamente, generalmente no se commitea)

Patrones safe para stagear:
- Archivos en `src/`, `tests/`, `public/assets/`, `.claude/commands/`, `.claude/skills/`, `.claude/agents/`
- Documentos en `.planning/`, raíz del proyecto (`.md`, configs)
- CHANGELOG, README

Stagear con `git add <file1> <file2> ...` por nombre — NUNCA `git add -A` o `git add .` ciego (puede meter secretos).

## 3. Construir mensaje de commit

Si el usuario proveyó mensaje en el arg → usarlo verbatim.

Si no, autogenerar siguiendo el style del repo (conventional commits):
- Mirar `git log --oneline -10` para ver el style
- Format: `<type>(<scope>): <descripción corta>`
- Types comunes en este repo: `art`, `feat`, `fix`, `refactor`, `docs`, `chore`, `test`, `process`
- Scopes comunes: `ch0`-`ch6`, `assets`, `chapters`, `i18n`, `theme`, etc.
- Body opcional explicando el "por qué" en 1-3 líneas, NO el "qué" (eso está en el diff)
- Trailer obligatorio: `Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>`

Ejemplo:
```
art(ch5): regenerate iter12 — banana-2 + ch3 ref + pelo a mandibula

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
```

## 4. Crear commit

Usar heredoc para preservar formato:
```bash
git commit -m "$(cat <<'EOF'
<mensaje aquí>

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

NUNCA usar `--no-verify`, `--amend` (excepto si el usuario lo pide explícitamente), `--no-gpg-sign`.

Si el commit falla por pre-commit hook: leer el output, identificar la causa, fixearla, re-stagear, crear NUEVO commit (NO amend).

## 5. Push

```bash
git push origin master
```

Si es el primer push y no hay upstream tracking:
```bash
git push -u origin master
```

Si push falla:
- **Non-fast-forward** (remote tiene commits que no tenés): NO hacer force push. Reportar al usuario que necesita `git pull --rebase origin master` primero y revisar conflicts.
- **Authentication failed**: el usuario debe configurar credenciales (PAT, SSH key) — reportar y NO intentar embedrar credenciales en el URL.
- **Repository not found**: el remote URL es incorrecto — verificar con `git remote -v`.

NUNCA `git push --force` o `git push --force-with-lease` salvo que el usuario lo pida explícitamente.

## 6. Reporte final

Mostrar:
- Commit hash creado
- Mensaje del commit
- Status del push (✅ pushed / ❌ failed + razón)
- URL del commit en el remote si está disponible (parsear `git remote get-url origin` para construir URL GitHub)

Si push falló pero commit local sí: mencionar claramente que el commit está LOCAL pero NO en el remote, y dar los pasos para resolver.
