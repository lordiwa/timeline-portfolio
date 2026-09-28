#!/usr/bin/env node
/**
 * hivemind-cm.mjs — lanzador de los scripts context-monitor de hivemind
 * independiente de la version instalada del plugin.
 *
 * Uso: node .claude/hooks/hivemind-cm.mjs <script.mjs>
 *
 * Por que: settings.json de proyecto no expande ${CLAUDE_PLUGIN_ROOT}, asi que
 * el init de hivemind hornea una ruta absoluta con la version (…/hivemind/0.21.0/…).
 * Cada `/plugin update` borra ese directorio y el hook Stop revienta con
 * MODULE_NOT_FOUND en la sesion donde repin.mjs recien lo repara (Claude Code ya
 * leyo los settings viejos). Este lanzador resuelve el installPath vigente desde
 * ~/.claude/plugins/installed_plugins.json en cada ejecucion.
 *
 * Nunca bloquea la sesion: si no encuentra el plugin o el script, sale 0 en silencio.
 */
import { readFileSync, existsSync } from 'node:fs';
import { homedir } from 'node:os';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';

const script = process.argv[2];
if (!script) process.exit(0);

let installPath;
try {
  const reg = JSON.parse(
    readFileSync(join(homedir(), '.claude', 'plugins', 'installed_plugins.json'), 'utf8'),
  );
  installPath = (reg.plugins?.['hivemind@hivemind-marketplace'] ?? [])[0]?.installPath;
} catch {
  process.exit(0);
}

const target = installPath && join(installPath, 'context-monitor', script);
if (!target || !existsSync(target)) process.exit(0);

const res = spawnSync(process.execPath, [target, ...process.argv.slice(3)], { stdio: 'inherit' });
process.exit(res.status ?? 0);
