# Cosmo Business Desktop — RC1.6 Stabilization Report

**Version:** `1.0.0-rc.1`  
**Date:** 2026-08-07  
**Scope:** Electron infrastructure only (no Supabase/DB/RPC/business rules)

---

## Objective

Make Cosmo Desktop a stable Windows executable for real-store use tomorrow:
no infinite splash, no preload crash, no black screen, no hardware/agent blocking startup.

---

## Problems found

| # | Problem | Root cause |
|---|---------|------------|
| 1 | `Unable to load preload script` / `Cannot use import statement outside a module` | Preload compiled as ESM (`import`) under root `"type": "module"` + `sandbox: true`. Sandboxed preload is not an ESM loader. |
| 2 | Packaged blank / black screen | `BrowserRouter` + `loadFile` (`file://`) → routes never match |
| 3 | Splash stayed open / felt stuck | Splash waited for agent dialogs + first-run wizard before MainWindow |
| 4 | Wizard could block perceived startup | Wizard ran before MainWindow; broken ESM preload broke bridge |
| 5 | Agent/hardware felt mandatory | `startDesktopAgent` awaited with modal dialogs over splash |
| 6 | `npm run desktop` risked blank UI | `isDev` used `!app.isPackaged`, loading Vite URL without server |
| 7 | Silent asset copy | Missing splash/first-run did not fail the build |

---

## Corrections applied

| # | Fix |
|---|-----|
| 1 | **Definitive preload CJS:** `scripts/build-electron-preload.mjs` (esbuild) emits single-file `index.cjs` / `firstRunPreload.cjs` with `require("electron")` and inlined IPC channels |
| 2 | Main/wizard load `*.cjs` via `resolvePreloadPath()` (`sandbox: true` kept) |
| 3 | **HashRouter** when `file:` or `window.cosmoDesktop` (web keeps `BrowserRouter`) |
| 4 | Lifecycle: Splash → Main create → local services → show → Splash destroy → agent/wizard after |
| 5 | Wizard independent (`parent: mainWindow`); close → Dashboard already open |
| 6 | Hardware/agent/print/scale init failures are warnings — Dashboard still opens |
| 7 | Structured logs (`bootstrapLog.ts` + renderer `[Cosmo]` markers) |
| 8 | `loadFile(app.getAppPath()/dist/index.html)` when not using Vite; Vite only with `VITE_DEV_SERVER_URL` + development |
| 9 | Required assets must exist or `copy-electron-assets` exits 1 |

---

## Architecture (module system)

| Layer | Format |
|-------|--------|
| Main process | ESM (`"type": "module"`, `tsc` NodeNext) — valid for Electron 35 |
| Preload | **Bundled CommonJS `.cjs`** (esbuild) — required for sandbox |
| Renderer | Vite SPA, `base: "./"` |
| Pack | `electron-builder` → asar includes `dist/**` + `apps/desktop/electron/dist/**` |

---

## Startup flow (mandatory)

```
app.whenReady()
  → Splash
  → MainWindow created (hidden)
  → local IPC / printers / scale config (optional failures OK)
  → did-finish-load / ready-to-show
  → MainWindow.show()
  → Splash.close() + destroy()
  → Desktop Agent (optional, non-blocking)
  → First-run Wizard (if needed; close skips to Dashboard)
```

On any init error: Splash destroyed → MainWindow shown → error dialog only.

---

## Files changed

- `package.json` — `build:electron` includes preload bundle
- `scripts/build-electron-preload.mjs` — **new**
- `scripts/copy-electron-assets.mjs` — fail on missing required assets
- `scripts/validate-rc1-smoke.mjs` — checks `.cjs` preloads
- `apps/desktop/electron/src/main/index.ts` — stable lifecycle
- `apps/desktop/electron/src/main/window.ts` — load paths, preload `.cjs`, diagnostics
- `apps/desktop/electron/src/main/splash.ts` — close/destroy + logs
- `apps/desktop/electron/src/main/bootstrapLog.ts` — **new**
- `apps/desktop/electron/src/main/paths.ts` — **new**
- `apps/desktop/electron/src/hardware/firstRun.ts` — independent wizard + CJS preload
- `src/routes/AppRoutes.tsx` — HashRouter for Electron `file://`
- `src/main.tsx` — renderer boot logs
- `docs/RC1.6_STABILITY.md` — this report

---

## Validation checklist

| Check | Result |
|-------|--------|
| `npm run typecheck` | Pass |
| `oxlint` on Electron + AppRoutes + main.tsx | Pass (repo-wide `npm run lint` still noisy from mobile export artifacts — pre-existing) |
| `npm run build` / `build:electron` | Pass — emits `dist/preload/*.cjs` |
| `electron-builder` Setup + Portable | Pass |
| Preload uses `require("electron")` | Verified in `index.cjs` |
| `validate:rc1` | Pass (incl. Preload CJS checks) |
| Auto-update | Initialized (`electron-updater`); update host may 404 until publish |

### Artifacts

- `release/desktop/CosmoBusiness-1.0.0-rc.1-Setup.exe`
- `release/desktop/CosmoBusiness-1.0.0-rc.1-Portable.exe`
- `release/desktop/win-unpacked/` (copied from pack output)

### Smoke (win-unpacked, packaged=true)

Observed in process log:

1. Electron iniciado  
2. Splash criada / exibida  
3. Main criada com `preload=…/index.cjs`  
4. Main `loadFile` → `app.asar/dist/index.html`  
5. `[Cosmo] React iniciado` / `React renderizado`  
6. `Desktop bridge OK (preload/contextBridge)`  
7. `MainWindow.show() — ready-to-show`  
8. `Splash.close() + destroy()`  
9. Dashboard / MainWindow aberta  
10. Desktop Agent standby (modo local)  
11. Wizard de primeira execução (após Main)

No preload SyntaxError. No infinite splash.

---

## Store-readiness verdict

**Desktop shell ready for production trial tomorrow.**

- Preload/contextBridge path is correct (CJS)
- Packaged routing works (HashRouter)
- Splash cannot trap the user
- Missing hardware / agent does not block Dashboard

Remaining store ops items (billing, native `serialport` ABI rebuild when Python available, update CDN) are outside this RC1.6 shell scope.
