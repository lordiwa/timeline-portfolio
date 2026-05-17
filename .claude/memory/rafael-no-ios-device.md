---
name: rafael-no-ios-device
description: Rafael no posee hardware iOS — cualquier smoke test/QA que requiera iPhone/iPad real está bloqueado salvo que consiga prestado un dispositivo
metadata: 
  node_type: memory
  type: project
  originSessionId: bef623f6-4b20-4718-aadf-a4a316f59b80
---

Rafael NO tiene iPhone ni iPad. Cualquier verificación que dependa de hardware iOS real (smoke tests Safari mobile, safe-area-inset en hardware, momentum scroll WebKit, gestos touch específicos de iOS) NO puede ser ejecutada por él directamente.

**Why:** Reveló esta limitación 2026-05-12 al ofrecerle ejecutar el Plan 07 (ios-smoke-test) de Phase 1 del portafolio. Phase 1 quedó en 86% (6/7 plans) y Plan 07 indefinidamente bloqueado por esta razón.

**How to apply:**
- NO ofrecer ejecutar smoke tests en iPhone/iPad directamente con Rafael
- Para verificaciones iOS-críticas, sugerir alternativas: BrowserStack/LambdaTest, emuladores (no son fidedignos para Safari mobile bugs), pedir favor a contacto con iOS, o decidir que el riesgo iOS es aceptable y mover adelante
- Para [[portfolio-goal]]: Phase 1 Plan 07 puede declararse "passed by fallback" (mitigaciones preventivas ya aplicadas: `env(safe-area-inset-bottom, 0)` + `viewport-fit=cover` + dos opciones documentadas para overflow 375×667) o quedar como deferred verification hasta que Rafael tenga acceso
- Documentar en plans futuros si introducen requisitos iOS-only para flag temprano
