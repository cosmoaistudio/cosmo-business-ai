# Cosmo Business AI

Plataforma operacional SaaS para food service: PDV, cozinha, financeiro, catálogo, pedido digital e Cosmo AI.

Status atual: **Pronta para Piloto** (ver `docs/GO_LIVE_V1_REPORT.md`).  
Fundação arquitetural: ver `docs/FOUNDATION_REPORT.md`.

## Monorepo

```
src/                         # Web app (React + Vite)
apps/desktop/electron/       # Desktop agent (Electron)
apps/mobile/                 # Mobile (Expo)
packages/shared/             # Contratos compartilhados (remote-commands)
database/migrations/         # SQL versionado (001–025)
docs/                        # Arquitetura, piloto, fundação
tests/                       # Vitest unit/integration/e2e
```

## Stack

- React 19 + TypeScript + Vite
- Supabase (Auth, Postgres, Realtime, Storage)
- Framer Motion + Design System V2 (`src/design-system`)
- Electron Desktop Agent (impressão / gaveta / comandos remotos)
- Expo Mobile + React Query (mobile)

## Scripts

```bash
npm run dev              # Web
npm run dev:desktop      # Web + Electron
npm run build            # Web + Electron
npm run typecheck
npm run lint
npm run test
npm run validate:pilot   # Smoke do piloto
```

Mobile:

```bash
npm run mobile:typecheck
npm run mobile:lint
```

## Arquitetura (resumo)

Cada domínio vive em `src/features/<domínio>` com:

`types → repository → service → hooks → components`

Comunicação cross-módulo via **EventBus** (`src/core`).  
Não chamar feature A direto de feature B.

Documentação detalhada: `docs/ARCHITECTURE.md`.

## Ambientes

- Web: `.env` / Vite `VITE_SUPABASE_*`
- Desktop: `.env.desktop` (ver `docs/DESKTOP_AGENT_SETUP.md`)
- Mobile: `apps/mobile/.env`

## Princípios de crescimento

1. UX aprovada não é redesenhada sem necessidade.
2. Regras de negócio e RPCs não mudam em sprints de fundação.
3. Preferir utilitários em `src/lib` e contratos em `packages/shared`.
4. Design System V2 é a camada canônica para novos componentes.
5. Queries unbounded e duplicação de fetch são dívida alta — ver relatório de fundação.
