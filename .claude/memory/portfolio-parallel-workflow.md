---
name: portfolio-parallel-workflow
description: "Workflow paralelo aprobado para portafolio — implementación Phase 2 (theme+i18n) por Claude + producción de contenido Phase 3 (bio+proyectos+paletas) por Rafael, asincrónicos"
metadata: 
  node_type: memory
  type: project
  originSessionId: bef623f6-4b20-4718-aadf-a4a316f59b80
---

Rafael aprobó 2026-05-12 un workflow paralelo donde:
- **Claude implementa Phase 2** (Theme System + i18n) — infraestructura sin dependencia de contenido real
- **Rafael produce contenido Phase 3** (bio ES/EN, lista de proyectos por chapter de carrera, paletas pixel art por chapter) — work humano sin dependencia de código

Cuando ambos converjan: Phase 2 PASS + contenido listo → Phase 3 puede ejecutarse de corrido.

**Why:** Rafael dijo literalmente "empieza 3 y hagamos 2". Interpretación clarificada con AskUserQuestion: NO romper el orden de dependencias del roadmap (Phase 3 depende de Phase 2 para i18n + theme), sino paralelizar trabajo humano (contenido) + trabajo Claude (impl) para no perder ciclos esperando al otro. El "Content readiness Phase 3" ya estaba flaggeado como blocker conocido en STATE.md desde el inicio.

**How to apply:**
- Cuando Rafael diga "empieza X" donde X es una phase futura del roadmap, NO romper dependencias técnicas a ciegas — preguntar AskUserQuestion ofreciendo (a) trabajo paralelo respetando orden, (b) romper orden con costo de refactor, (c) seguir orden original
- En este proyecto específico, mientras estemos en Phase 2: NO bloquear avance de Phase 2 esperando contenido de Rafael; pero SÍ surfacear cualquier decisión de scope donde el contenido de Phase 3 informe (ej: cuántas keys i18n preparar, cuántos themes pulir primero)
- Generar `.planning/phases/03-chapter-3-end-to-end/CONTENT-CHECKLIST.md` como handoff document de qué necesita Rafael producir — relacionado con [[portfolio-design-decisions]]
- Cuando preguntar a Rafael sobre Phase 2 (durante discuss-phase 2): respetar que está trabajando en contenido en paralelo, no pedirle decisiones que requieran context-switching innecesario
