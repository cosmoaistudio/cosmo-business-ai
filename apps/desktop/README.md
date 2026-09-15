# Cosmo Desktop — Credenciais e Segurança

Este documento explica como configurar credenciais do **Cosmo Desktop** (Electron Main) de forma isolada do frontend React/Vite.

## Dois arquivos, dois propósitos

| Arquivo | Consumido por | Conteúdo |
|---|---|---|
| `.env` | **Vite / React** (`import.meta.env`) | URL pública, Publishable Key, variáveis de UI |
| `.env.desktop` | **Electron Main only** (`DesktopSecretManager`) | Service Role, organização, agente |

**Regra:** nunca misture credenciais do Desktop no `.env` compartilhado com o Vite.

## Setup

```bash
cp .env.desktop.example .env.desktop
```

Preencha `.env.desktop` na **raiz do projeto**:

| Variável | Obrigatória | Descrição |
|---|---|---|
| `COSMO_SUPABASE_URL` | Sim | URL do projeto Supabase |
| `COSMO_SUPABASE_SERVICE_ROLE_KEY` | Sim | Service Role Key (Main only) |
| `COSMO_ORGANIZATION_ID` | Sim | UUID da organização |
| `COSMO_AGENT_NAME` | Sim | Nome deste terminal (ex: "PDV Loja 1") |
| `COSMO_AGENT_ID` | Não | UUID do agente; vazio = auto-registro na 1ª execução |

## O que fica em cada arquivo

### `.env` (frontend web)

```env
VITE_SUPABASE_URL=https://...
VITE_SUPABASE_PUBLISHABLE_KEY=...
```

Usado exclusivamente por:

- `src/config/supabase.ts`
- Build Vite (`import.meta.env.VITE_*`)

### `.env.desktop` (Electron Main)

```env
COSMO_SUPABASE_URL=https://...
COSMO_SUPABASE_SERVICE_ROLE_KEY=...
COSMO_ORGANIZATION_ID=...
COSMO_AGENT_ID=
COSMO_AGENT_NAME=Cosmo Desktop PDV
```

Usado exclusivamente por:

- `DesktopSecretManager` → `getDesktopSupabase()` → Desktop Agent

## Por que Service Role nunca pode ir para o React

1. **Bundle público** — O Vite embute `import.meta.env.VITE_*` no JavaScript servido ao navegador. Qualquer segredo com prefixo `VITE_` fica exposto no DevTools.
2. **Permissões totais** — A Service Role Key ignora Row Level Security. No frontend, qualquer usuário poderia ler/escrever todo o banco.
3. **Isolamento de processo** — O Desktop Agent roda no **Main process** do Electron, com `contextIsolation`, `sandbox` e preload limitado. Segredos ficam apenas em Node.js no Main.
4. **Superfície de ataque** — O Renderer (React) é acessível via DevTools em desenvolvimento. O Main não expõe variáveis via `window.cosmoDesktop`.

## Fluxo de carregamento

```
Electron Main inicia
  ↓
DesktopSecretManager.load()   ← lê APENAS .env.desktop
  ↓
Validação (fail-closed)
  ↓
DesktopAgent.start()
  ├── RealtimeListener
  └── Supabase (Service Role)
```

Se `.env.desktop` estiver ausente ou incompleto:

- Desktop Agent **não inicia**
- Realtime **não conecta**
- Dialog amigável informa o erro
- UI Electron **continua funcionando** (PDV local, impressora, etc.)

## Segurança

- `.env.desktop` está no `.gitignore` — nunca commitar
- `.env.desktop.example` é o template versionado (sem valores reais)
- `DesktopSecretManager` não usa `import.meta.env`
- Segredos nunca passam pelo preload ou IPC

## Documentação relacionada

- [DESKTOP_ARCHITECTURE.md](./electron/DESKTOP_ARCHITECTURE.md) — arquitetura completa do Electron
- [DESKTOP_UPDATES.md](../../docs/DESKTOP_UPDATES.md) — atualização remota (electron-updater)
