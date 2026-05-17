---
name: feedback-git-identity
description: Git author identity para todos los commits de Rafael — siempre srparca@gmail.com / Rafael Matovelle
metadata: 
  node_type: memory
  type: feedback
  originSessionId: 225887d0-df91-4dd8-9095-0454f76cdf79
---

Para cualquier `git commit` en máquinas de Rafael, la identidad es:

- `user.name` = `Rafael Matovelle`
- `user.email` = `srparca@gmail.com`

Si `git config user.email` o `user.name` están vacíos en una máquina nueva, setear
ambos con `git config --global` antes del primer commit. Si un commit ya salió
con identidad incorrecta (típicamente `rafael.matovelle@softwaremind.com` derivado
del hostname corporativo) y todavía no está pusheado, fixearlo con
`git commit --amend --reset-author --no-edit`.

**Why:** Rafael explícitamente lo confirmó 2026-05-16 después de que el commit
`85ccb5c` salió con el email corporativo de Software Mind por autoderivación
(git config vacío). Quiere su identidad personal en toda contribución open / portfolio.

**How to apply:** En el skill `init-machine` (paso 2) y en cualquier `commit-push`,
no preguntar la identidad si ya está mal configurada — setearla directamente con
los valores de arriba. Solo pedir confirmación si el usuario menciona una identidad
distinta. Relacionado con [[user-profile]].
