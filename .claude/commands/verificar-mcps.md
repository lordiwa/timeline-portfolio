# Comando: /project:verificar-mcps

Verifica que pixelforge-mcp y Adobe MCP están disponibles y funcionales.

---

Ejecutar los siguientes pasos en secuencia:

1. **Pixelforge — cargar schema:**
   ```
   ToolSearch(query="select:mcp__pixelforge__forge_background,mcp__pixelforge__forge_sprite,mcp__pixelforge__process_sprite,mcp__pixelforge__optimize_sprite", max_results=10)
   ```
   - Si devuelve tools: ✅ schema cargado
   - Si devuelve `InputValidationError` o vacío: ❌ pixelforge no está instalado → seguir CLAUDE.md sección 3.2

2. **Pixelforge — smoke test (imagen pequeña):**
   Llamar `forge_background` con una imagen pequeña de prueba:
   - description: "pixel art test, solid blue sky, 16x9 aspect"
   - outputPath: "public/assets/test-smoke.png"
   - Si genera el PNG: ✅ pixelforge operativo
   - Si devuelve "API key expired" o "limit:0": ❌ key revocada o billing no habilitado → seguir CLAUDE.md sección 3.3

3. **Adobe MCP:**
   Llamar `adobe_mandatory_init()`
   - Si responde sin error: ✅ Adobe MCP cargado
   - Si no encuentra la tool: ❌ Adobe MCP no está conectado

4. Reportar estado final:
   ```
   Pixelforge: [✅ operativo | ⚠️ schema cargado pero sin billing | ❌ no instalado]
   Adobe MCP:  [✅ operativo | ❌ no disponible]
   ```
   
   Si hay problemas: mostrar exactamente qué falló y los pasos de la sección correspondiente del CLAUDE.md.
