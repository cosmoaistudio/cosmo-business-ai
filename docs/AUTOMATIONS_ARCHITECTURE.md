# Cosmo Automations V1 — Arquitetura

Módulo conector do Cosmo: **Evento → Condição → Ação**.  
Não altera regras de negócio dos módulos conectados.  
Não muda Supabase, DB, RPC, Auth, PDV, Growth Hub ou Business Brain.

## Objetivo

Permitir que eventos do sistema disparem ações automaticamente, com UI e catálogos preparados para expansão. A execução real permanece no `AutomationEngine` já existente; o builder visual desta sprint é arquitetura / rascunho.

## Menu

**Inteligência → Automações** → `/automacoes`  
Editor: `/automacoes/nova`, `/automacoes/:id`  
Lazy load nas rotas.

## Estrutura

```
src/features/automation/
├── catalog/
│   ├── triggerCatalog.ts     # biblioteca de gatilhos (live + planned)
│   ├── actionCatalog.ts      # biblioteca de ações (live + planned)
│   └── types.ts
├── components/
│   ├── hub/AutomationsHubPage.tsx
│   ├── library/CatalogLibrary.tsx
│   ├── builder/NodeFlowBuilder.tsx
│   ├── executions/ExecutionsPanel.tsx
│   ├── rules/RulesPanel.tsx
│   └── RuleBuilder.tsx       # editor SE/ENTÃO existente (persistência)
├── providers/AutomationsProvider.tsx   # React Query scoped
├── hooks/useAutomationsHub.ts
├── services/                 # engine + CRUD (inalterados na sprint)
└── styles/automations-hub.css
```

## Conceito

```
Evento  →  Condição  →  Ação  →  Resultado
```

Exemplo arquitetural:

```
Quando: Venda finalizada
Então:
  · Atualizar Business Brain   (planned)
  · Atualizar Dashboard        (planned)
  · Atualizar Financeiro       (live: CREATE_FINANCIAL_ENTRY)
  · Atualizar Estoque          (planned)
  · Atualizar Growth Hub       (planned)
  · Registrar atividade        (planned)
```

## Biblioteca

| Catálogo | Conteúdo |
|----------|----------|
| Gatilhos | Eventos live do EventBus + planejados (estoque crítico, meta, dia encerrado, pedido cancelado…) |
| Ações | Ações live do `actionExecutor` + planejadas (insight, workflow, campanha, preparar IA…) |

Itens `planned` **não** são enviados ao motor até implementação futura.  
O botão “Continuar no editor” só persiste ações `live`.

## Builder

Canvas em nós (Evento → Condição → Ação → Resultado).  
**Não executa o grafo.** Serve para desenhar a conexão entre módulos e encaminhar rascunhos live ao editor clássico.

## Execuções

Tela de histórico com filtros:

- Executada (`success`)
- Falhou (`failed`)
- Em andamento (`finished_at` nulo)
- Ignorada (`skipped`)

Dados via `automationLogsService` (tabelas existentes).

## React Query

Provider **escopo local** (`AutomationsProvider`).  
Keys: `queryKeys.automations.rules()`, `queryKeys.automations.logs(status)`.

## Performance

- Lazy routes (`AppRoutes`)
- React Query com `staleTime`
- Componentes de biblioteca / builder / execuções com `memo`

## O que NÃO muda

- `AutomationEngine` / `actionExecutor` / condition evaluator
- Migrations / RPC / Auth
- PDV, Growth Hub, Business Brain (somente conectores `planned` no catálogo)
- Shape de persistência das regras (`trigger_type` + `conditions[]` + `actions[]`)

## Screenshots

- `docs/assets/cosmo-automations-v1-overview.png`
- `docs/assets/cosmo-automations-v1-builder.png`
- `docs/assets/cosmo-automations-v1-executions.png`
