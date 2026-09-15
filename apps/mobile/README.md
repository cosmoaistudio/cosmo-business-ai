# Cosmo Mobile

Centro de comando mobile da operação — **não é clone do Desktop**.

## Stack

- React Native + Expo
- TypeScript
- Expo Router
- React Query
- NativeWind
- Zustand
- Supabase Auth (mesmo login do Desktop/Web)

## Estrutura

```
apps/mobile/
├── app/                     # Expo Router (navigation)
│   ├── (auth)/login.tsx
│   └── (app)/               # Tabs autenticadas
│       ├── index.tsx        # Dashboard
│       ├── commands.tsx     # Command Center
│       └── notifications.tsx
└── src/
    ├── features/            # Telas por domínio
    ├── components/          # UI compartilhada
    ├── services/            # Command, DesktopStatus, Health, Push
    ├── hooks/
    ├── store/               # Zustand
    ├── types/
    ├── providers/
    ├── navigation/
    └── lib/supabase.ts
```

## Setup

```bash
cd apps/mobile
cp .env.example .env
npm install
npm run start
```

Variáveis (somente publishable — nunca Service Role ou credenciais Desktop):

```env
EXPO_PUBLIC_SUPABASE_URL=
EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY=
```

**Proibido no Mobile:** `SERVICE_ROLE_KEY`, `COSMO_AGENT_ID`, `COSMO_ORGANIZATION_ID` (uso exclusivo do Desktop Agent). A organização é obtida do perfil autenticado via RLS.

## Fluxo

```
Mobile (Command Center)
    ↓
remote_commands (Supabase)
    ↓
Desktop Agent (Electron)
    ↓
Executar ação (impressora, caixa, estoque...)
```

## Serviços

| Serviço | Responsabilidade |
|---|---|
| `CommandService` | Enviar comandos para `remote_commands` |
| `DesktopStatusService` | Consultar `desktop_agents` |
| `HealthService` | Saúde operacional (faturamento, fila, estoque) |
| `PushNotificationService` | Arquitetura push (Firebase pendente) |

## Scripts

```bash
npm run typecheck
npm run lint
npm run start
```
