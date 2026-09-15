# Desktop Architecture

Documentação oficial da arquitetura de produção do Cosmo Desktop (Electron).

## Visão geral

O Cosmo Desktop é composto por dois processos isolados:

| Processo | Responsabilidade |
|---|---|
| **Main (Node.js)** | Desktop Agent, Supabase, impressora, IPC, health check |
| **Renderer (React/Vite)** | Interface do usuário via `window.cosmoDesktop` |

O Desktop Agent **nunca** roda no frontend React.

## Estrutura oficial

```
apps/desktop/electron/src/
├── main/
│   ├── index.ts              # Bootstrap Electron
│   ├── window.ts             # BrowserWindow principal
│   └── splash.ts             # Splash screen
├── preload/
│   └── index.ts              # contextBridge → window.cosmoDesktop
├── ipc/
│   ├── handlers.ts           # ipcMain handlers
│   └── channels.ts           # Canais IPC
├── updater/                  # electron-updater (GitHub Releases)
│   ├── autoUpdaterService.ts
│   ├── update-server.json    # owner/repo públicos (sem token)
│   └── updateState.ts
└── agent/                    # ÚNICA implementação do Desktop Agent
    ├── DesktopAgent.ts       # Orquestrador
    ├── RealtimeListener.ts   # ÚNICO listener Realtime
    ├── CommandDispatcher.ts
    ├── CommandRegistry.ts
    ├── config/
    │   ├── DesktopSecretManager.ts  # Credenciais .env.desktop
    │   └── DesktopConfig.ts  # Config persistente
    ├── health/
    │   └── HealthCheck.ts    # Diagnóstico de componentes
    ├── status/
    │   └── DesktopLifecycleStatus.ts
    ├── repository/
    │   ├── supabaseClient.ts # ÚNICO cliente Supabase do Desktop
    │   ├── desktopAgent.repository.ts
    │   ├── remoteCommand.repository.ts
    │   └── operations.repository.ts
    └── commands/
        └── ...
```

## Fluxo de inicialização

```
electron .
  ↓
main/index.ts
  ↓
dotenv (.env)
  ↓
registerIpcHandlers()
  ↓
printerService.initialize()
offlineSyncService.initialize()
  ↓
DesktopSecretManager.load()   ← main/index.ts, lê .env.desktop
  ↓
desktopAgent.start()
  ├── desktopConfig.load()
  ├── registerAllCommands()
  ├── desktopAgentRepository.register()
  ├── realtimeListener.start()
  └── healthCheck.run()
  ↓
createMainWindow()
commandExecutor.registerWindow()
```

## Shutdown

```
app.before-quit
  ↓
printerService.shutdown()
offlineSyncService.shutdown()
desktopAgent.shutdown()
  ├── heartbeat/health timers
  ├── realtimeListener.shutdown()
  ├── desktop_agents.status = offline
  └── lifecycle = STOPPED
```

## Realtime

**Implementação única:** `agent/RealtimeListener.ts`

| Mecanismo | Detalhe |
|---|---|
| Canal | `cosmo:org:{organizationId}:remote` |
| Postgres Changes | `INSERT` em `remote_commands` |
| Broadcast | evento `remote-command` |
| Polling | claim a cada 10s via RPC |

## Supabase

**Cliente único:** `agent/repository/supabaseClient.ts`

```typescript
getDesktopSupabase() // usa DesktopSecretManager (.env.desktop), sem fallback
```

### Credenciais obrigatórias (`.env.desktop` — Main only)

| Variável | Obrigatória | Descrição |
|---|---|---|
| `COSMO_SUPABASE_URL` | Sim | URL do projeto |
| `COSMO_SUPABASE_SERVICE_ROLE_KEY` | Sim | Credencial do Desktop Agent |
| `COSMO_ORGANIZATION_ID` | Sim | Tenant |
| `COSMO_AGENT_NAME` | Sim | Nome do terminal |
| `COSMO_AGENT_ID` | Não | UUID do agente (auto-registro se vazio) |

Consulte [apps/desktop/README.md](../README.md) para detalhes de segregação `.env` vs `.env.desktop`.

**Regra:** Publishable Key **nunca** é usada pelo Desktop Agent.

## IPC

```
Renderer (React)
  window.cosmoDesktop.*
    ↓ preload (contextBridge)
  ipcRenderer.invoke / on
    ↓
  ipc/handlers.ts (ipcMain)
    ↓
  commandExecutor | healthCheck | services
```

### Canais

| Canal | Direção | Uso |
|---|---|---|
| `cosmo:invoke` | R → M | Comandos locais |
| `cosmo:get-status` | R → M | Status + health check |
| `cosmo:event` | M → R | Eventos push |

O Desktop Agent notifica o Renderer via `commandExecutor.broadcast()` após comandos remotos.

## Lifecycle Status

| Status | Significado |
|---|---|
| `STARTING` | Inicializando |
| `ONLINE` | Operacional, health OK |
| `DEGRADED` | Parcialmente operacional |
| `OFFLINE` | Registrado como offline no DB |
| `STOPPED` | Encerrado ou credencial ausente |

## Health Check

Componentes verificados:

- Supabase (query `desktop_agents`)
- Realtime (canal SUBSCRIBED)
- Printer (serviço de fila)
- Storage (userData read/write)
- Internet (connectivity probe)
- Agent Registration (`agent_id` persistido)

Health roda na inicialização e a cada 30s. IPC `GET_STATUS` executa health on-demand.

## Segurança

- `contextIsolation: true`
- `nodeIntegration: false`
- `sandbox: true`
- Segredos apenas no Main via `DesktopSecretManager` (`.env.desktop`)
- Preload expõe API limitada, sem chaves

## Comandos remotos

```
Mobile/App → remote_commands (Supabase)
  ↓ Realtime INSERT
agent/RealtimeListener
  ↓
DesktopAgent.processCommand()
  ↓ acknowledge → dispatch → finalize
  ↓
commandExecutor.broadcast() → Renderer
```
