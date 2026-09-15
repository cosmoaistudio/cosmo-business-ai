# Cosmo Foundation V1 — Relatório de Arquitetura

Data: 2026-08-07  
Escopo: organização, reutilização, manutenibilidade e performance estrutural.  
**Sem alteração** de regras de negócio, comportamento Supabase, fluxos, autenticação ou UX aprovada.

---

## Classificação final — Arquitetura

### Nota: **B+** (entre B e A)

### Justificativa

**Pontos fortes (nível A):**
- Modularização por feature (`repository → service → hooks → UI`)
- Core com EventBus / Automation / FeatureFlags / Audit
- TypeScript sem `any` no app
- Pacote compartilhado `@cosmo/remote-commands`
- Testes sólidos em product-engine, PDV e desktop agent
- Design System V2 já existe e é usado no shell

**Pontos que impedem A / A+:**
- Duas camadas de design (`src/design` + `src/design-system`) e EmptyState/Card triplicados
- Web ainda sem React Query (fetch ad-hoc por feature)
- Dashboard web com leituras potencialmente unbounded
- Desktop ainda duplica `remoteCommands` localmente
- Cobertura de testes ausente em digital-ordering, kitchen, finance, cosmo-ai

Com a fundação desta sprint e o roadmap abaixo, a trajetória natural é **A** em 1–2 ciclos focados (RQ no web + unificação DS + índices/paginação).

---

## 1. Arquitetura atual

```
Web (src/)
├── core/                 EventBus, engines
├── features/*            Domínios de negócio
├── design-system/        DS V2 (canônico para UI nova)
├── design/               Camada visual legada ainda no App root
├── components/           Layout, shared, AI drawer
├── pages/                Shells de rota
├── lib/                  format, date, logger, queryKeys
└── routes/

Desktop (apps/desktop/electron)
└── agent + printer + IPC (+ cópia local de remoteCommands)

Mobile (apps/mobile)
└── Expo + React Query + features próprias
    + imports pontuais de product-engine

Shared (packages/shared/remote-commands)
└── Contratos de comando remoto

Database
└── migrations 001–025
```

### Providers (web)

`ErrorBoundary → ThemeProvider(design) → MotionProvider → AuthProvider → CoreProvider → Routes`  
Por layout autenticado: `CosmoAiProvider → CosmoAiDrawerProvider`.

### Providers (mobile)

`QueryClientProvider → Auth → Push → Realtime`.

---

## 2. Problemas encontrados

| Prioridade | Problema |
|------------|----------|
| **Crítica** | Dashboard repository pode carregar sales/items/finance sem limite |
| **Crítica** | Zero testes em digital-ordering e kitchen-display |
| **Alta** | Dual design system + EmptyState/Card duplicados |
| **Alta** | Web sem React Query / cache unificado |
| **Alta** | Desktop fork de `@cosmo/remote-commands` |
| **Alta** | Índices compostos / paginação ausentes no caminho de dashboard |
| **Alta** | Módulos finance / OC / cosmo-ai / auth sem testes |
| **Média** | Helpers de data duplicados (corrigido parcialmente) |
| **Média** | `console.error` bypassando `logger` |
| **Média** | DesignPreview em build de produção (corrigido: só DEV) |
| **Média** | ProductImageField morto (removido) |
| **Baixa** | README ainda era template Vite (corrigido) |
| **Baixa** | Docs CosmoAIWidget stale |

---

## 3. Correções realizadas nesta sprint

1. **`src/lib/date.ts`** — helpers canônicos (`isToday`, `startOfTodayIso`, `isSameLocalDay`)
2. **Consumidores atualizados** — dashboard, finance, kitchen, cosmo-ai, operation-center
3. **`src/lib/queryKeys.ts`** — fábrica de keys para adoção futura de React Query no web
4. **Mobile `queryKeys`** — `apps/mobile/src/lib/queryKeys.ts` + dashboard queries alinhadas
5. **Remoção** de `ProductImageField` (stub morto)
6. **DesignPreview** apenas em `import.meta.env.DEV`
7. **Logger** em hooks críticos (products, dashboard, finance, customers, inventory, OC, cosmo-ai)
8. **Documentação** — README reescrito; este relatório; apontamentos em ARCHITECTURE
9. **Comentário canônico** no fork desktop de `remoteCommands`

---

## 4. Dívidas técnicas restantes

### Crítica
- [ ] Paginar / limitar leituras do dashboard web (sem mudar regras — só shape da query)
- [ ] Testes de digital-ordering + kitchen-display (sem mocks inventados: preferir integração real / contratos)

### Alta
- [ ] Adotar React Query no web usando `src/lib/queryKeys.ts`
- [ ] Unificar EmptyState/Card sob `design-system` (re-export thin das APIs antigas)
- [ ] Apontar Electron `tsconfig` para `packages/shared/remote-commands` e apagar cópia
- [ ] Índice composto sugerido: `sales (organization_id, status, created_at desc)` — **additive**, validar com EXPLAIN
- [ ] Testes finance / operation-center / cosmo-ai

### Média
- [ ] Migrar ThemeProvider root de `src/design` → DS V2 sem regressão visual
- [ ] Substituir restantes `console.*` por `logger`
- [ ] Extrair formatCurrency mobile → shared util
- [ ] Atualizar `docs/MIGRATIONS_REVIEW.md` até 025

### Baixa
- [ ] Remover alias mortos (`AutomationEngineProvider` se não usado)
- [ ] Feature-flag de módulos marketplace/loyalty já tipados mas sem UI

---

## 5. React Query (estado e plano)

| Superfície | Estado |
|------------|--------|
| Mobile | QueryClient ativo; dashboard com stale/refetch |
| Web | Sem RQ; hooks `useState` + `onDataChanged` |

**Plano seguro (próxima fundação):**
1. Instalar `@tanstack/react-query` no web
2. Provider no App
3. Migrar `useProducts` / `useDashboardStats` / `useFinance` primeiro
4. Invalidations via EventBus → `queryClient.invalidateQueries`
5. Prefetch no hover da sidebar para PDV/Cozinha

Optimistic updates: só após cobertura de testes dos módulos.

---

## 6. Supabase (revisão estrutural — sem mudança de comportamento)

- 25 migrations versionadas
- RLS e RPCs de checkout/kitchen recentes (022–025)
- Observação de perf: dashboard e IA fazem selects amplos; índice composto e limites são o próximo passo **additive**
- Policies/triggers: não alterados nesta sprint

---

## 7. Testes — módulos críticos sem validação

| Módulo | Prioridade de teste |
|--------|---------------------|
| digital-ordering | Crítica |
| kitchen-display | Crítica |
| finance | Alta |
| operation-center | Alta |
| cosmo-ai | Alta |
| auth client paths | Alta |
| inventory | Alta |
| customers / products CRUD | Média |
| onboarding | Média |

Cobertos hoje: product-engine, automation core, PDV cart/finalize, desktop agent, dashboard service unit, mobile dashboard integration.

---

## 8. Mobile ↔ Web ↔ Desktop

| Recurso | Compartilhado? | Ação |
|---------|----------------|------|
| remote-commands | Parcial | Unificar Electron → package |
| product-engine | Mobile importa web | Manter |
| date/format | Parcial | Expandir `src/lib` → package utils |
| UI | Não (RN vs DOM) | Compartilhar tipos/contratos, não componentes |

---

## 9. Priorização consolidada

| Prioridade | Itens |
|------------|-------|
| Crítica | Dashboard unbounded reads; testes kitchen/digital |
| Alta | RQ web; unificar DS; remote-commands único; índice sales; testes finance/OC/AI |
| Média | ThemeProvider único; logger 100%; format shared; migrations review |
| Baixa | Dead aliases; flags sem UI |

---

## Missão

O Cosmo deixa de ser “projeto React orgânico” e passa a ter:
- utilitários canônicos (`date`, `queryKeys`, `logger`)
- documentação de produto real (README)
- mapa explícito de dívida com prioridade
- trilha clara para A/A+ sem reescrever o produto

**Próximo passo recomendado (Foundation V2):** React Query no web + paginação do dashboard + unificação EmptyState/Card.
