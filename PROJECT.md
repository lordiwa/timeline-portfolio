---
name: mato-new-portfolio
type: other
created_at: 2026-07-27T01:31:14.291Z
schema_version: 1
tier: MEDIO
perfil_proyecto: {score: 4, functionality: 1, beauty: 3, design_heavy: true, framework: vue, is_canvas: true, ui_outside_canvas: true, motion_required: true, motion_layer: both, needs_research: false, assets: true, assets_list: game-sprites-tiles+illustrations}
---

# mato-new-portfolio

## Description
Portafolio personal de Rafael Matovelle como viaje vertical en el tiempo: 7 chapters cronologicos (1995-2026) decorados con pixel art generado por MCPs.

## Target users
Recruiters internacionales (US/EU/Canada) como audiencia primaria; founders, clientes potenciales para gigs y comunidad gamedev como secundaria.

## Primary use cases
- other

## Success criteria
Un recruiter que scrollea el sitio entiende en 30 segundos, sin leer una vinieta de CV, el arco de tres decadas de carrera, y eso deriva en entrevistas.

## Problem
Rafael tiene un perfil poco convencional (Flash gamedev, UX y team lead, AR/VR, QA, full-stack con AI) que un CV plano aplana y vuelve generico, invisible ante recruiters internacionales. Necesita que el medio mismo demuestre el recorrido en vez de listarlo.

## Goals
- Que un visitante entienda en 30 segundos, sin leer una vinieta de CV, que mira a alguien con tres decadas de tecnologia cuyas habilidades convergen
- Conseguir entrevistas con recruiters internacionales (US/EU/Canada)
- Deploy a Firebase Hosting con los 7 chapters completos y contenido real
- Paridad ES/EN con copies pulidos, no auto-translate

## Scope (in)
- Scroll vertical con snap suave por 7 chapters cronologicos (1995-2026)
- Avatar pixel-art bust sticky top-left que swappea segun chapter activo
- Timeline sticky bottom con marcador movil, ano/era visible y click-to-navigate
- Background que morfea entre eras al cambiar de chapter
- Toggle i18n ES/EN con estado persistente entre chapters
- Escena Phaser explorable en chapter 6 y minijuego match-3 en chapter 2
- Pixel art via pixelforge: fondos chapters 2-6, 7 busts del avatar, elementos ambientales
- Desktop fluido mas mobile portrait y landscape funcionales
- Deploy a Firebase Hosting

## Scope (out)
- Character animation pixel art (limitacion documentada de pixelforge: frames incoherentes entre generaciones)
- Gameplay con objetivos o score en chapter 6: es exploracion ambiente, no juego
- CMS o backend dinamico: el contenido es estatico en v1
- Blog o articulos largos: el formato del sitio no calza con lectura larga
- Modo accesibilidad alternativo linealizado tipo CV plano

## Stack
- design_heavy: yes
- estimated_screens: 7
- stakes: real
- design_ambition: signature
- ui_framework: vue
- has_canvas_render: yes
- ui_outside_canvas: yes
- motion_required: yes
- motion_layer: both
- needs_research: have-direction
- assets_required: [game-sprites-tiles, illustrations]
