# Cosmo Business AI — Arquitetura Modular

Este documento descreve a infraestrutura central da plataforma Cosmo (`src/core`).
Todo novo módulo DEVE seguir estes padrões.

---

## Visão geral

```
┌─────────────────────────────────────────────────────────────┐
│                        src/core                              │
│  EventBus │ AutomationEngine │ PermissionEngine             │
│  FeatureFlagEngine │ NotificationEngine │ AuditEngine        │
└─────────────────────────────────────────────────────────────┘
         ▲ publish                    │ subscribe
         │                            ▼
┌────────┴────────┐          ┌───────────────────┐
│ features/products│          │ features/automation│
│ features/pdv     │          │ (regras SE/ENTÃO)  │
│ features/customers│         └───────────────────┘
└─────────────────┘
```

**Regra de ouro:** nenhum módulo chama outro módulo diretamente.
Toda comunicação ocorre via **EventBus**.

---

## Estrutura do Core

```
src/core/
├── index.ts                    # API pública do Core
├── CoreProvider.tsx            # Bootstrap dos engines (App.tsx)
├── event-bus/
│   └── EventBus.ts
├── automation/
│   └── AutomationEngine.ts
├── notification/
│   └── NotificationEngine.ts
├── audit/
│   ├── AuditEngine.ts
│   └── audit.repository.ts
├── feature-flags/
│   ├── FeatureFlagEngine.ts
│   └── featureFlags.repository.ts
├── permission/
│   └── PermissionEngine.ts
└── types/
    ├── events.ts
    ├── permissions.ts
    ├── featureFlags.ts
    ├── notifications.ts
    └── audit.ts
```

---

## EventBus

### Publicar eventos

```typescript
import { eventBus, DomainEvents } from "@/core";

// Após criar um produto no repository/service do módulo:
eventBus.publish(DomainEvents.ProductCreated, {
  module: "products",
  entityId: product.id,
  entityType: "product",
  productName: product.name,
  source: "user",
});
```

### Consumir eventos

```typescript
import { eventBus, DomainEvents } from "@/core";

const unsubscribe = eventBus.subscribe(DomainEvents.StockChanged, async (event) => {
  console.log(event.payload.stock, event.payload.productId);
});

// Cleanup
unsubscribe();
```

### Catálogo de eventos

| Evento | Quando publicar |
|--------|-----------------|
| `ProductCreated` | Produto criado |
| `ProductUpdated` | Produto alterado |
| `ProductDeleted` | Produto excluído |
| `ProductPaused` / `ProductActivated` | Status alterado |
| `StockChanged` | Movimentação de estoque |
| `SaleCompleted` | Venda finalizada no PDV |
| `CustomerCreated` / `CustomerUpdated` / `CustomerInactive` | CRUD clientes |
| `OptionPaused` / `OptionActivated` | Status de opção |
| `OrderCreated` / `OrderCompleted` | Pedidos (v2.1) |
| `PaymentReceived` / `PaymentOverdue` | Financeiro |
| `DataChanged` | Invalidar caches de UI |

### Compatibilidade legada

`emitAutomationEvent()` e `emitDataChanged()` em `src/lib/` delegam ao EventBus.
Migre gradualmente para `eventBus.publish(DomainEvents.X, payload)`.

---

## Como criar um módulo novo

### 1. Estrutura de pastas

```
src/features/meu-modulo/
├── repository/       # Supabase — apenas queries
├── services/         # Orquestração — publica eventos aqui
├── hooks/            # React hooks
├── components/       # UI
├── types/
└── index.ts          # Barrel exports
```

### 2. Service publica eventos (nunca importa outro feature)

```typescript
// ✅ Correto
import { eventBus, DomainEvents } from "@/core";

export const meuModuloService = {
  async create(payload: CreateDTO) {
    const record = await createRecord(payload); // repository local

    eventBus.publish(DomainEvents.OrderCreated, {
      module: "orders",
      entityId: record.id,
      entityType: "order",
      source: "user",
    });

    eventBus.publish(DomainEvents.DataChanged, { module: "orders" });

    return record;
  },
};
```

```typescript
// ❌ Proibido — acoplamento direto
import { productsService } from "@/features/products";
await productsService.update(id, { status: "inactive" });
```

### 3. Consumir eventos de outros módulos

Registre handlers no bootstrap do módulo ou via automação:

```typescript
eventBus.subscribe(DomainEvents.StockChanged, async (event) => {
  // Reagir sem importar inventory
});
```

### 4. Feature flag

```typescript
import { featureFlagEngine, FeatureModules } from "@/core";

if (!featureFlagEngine.isEnabled(FeatureModules.orders)) {
  return null; // módulo desabilitado para esta org
}
```

### 5. Permissões

```typescript
import { permissionEngine } from "@/core";

if (!permissionEngine.hasPermission(profile.role, "orders:write")) {
  throw new Error("Sem permissão");
}
```

---

## SaaS Foundation

Camada comercial (Meu Plano, limites, ajuda, diagnóstico, settings hub):  
ver `docs/SAAS_ARCHITECTURE.md`. Sem gateway integrado nesta versão.

## Automation Engine

Regras SE/ENTÃO configuradas em `/automacoes` (menu **Inteligência → Automações**).

Hub V1 (catálogos, builder visual, execuções): ver `docs/AUTOMATIONS_ARCHITECTURE.md`.  
O motor de execução existente permanece a fonte da verdade; itens `planned` no catálogo são arquitetura de conexão entre módulos.

### Como registrar automações

1. Acesse **Automações** → **Nova automação** (ou Builder → Continuar no editor)
2. Configure: **SE** evento → **Condição** → **ENTÃO** ação
3. O motor escuta eventos do EventBus automaticamente

### Mapeamento evento → trigger

| Domain Event | Trigger legado (DB) |
|--------------|---------------------|
| `StockChanged` | `STOCK_CHANGED` |
| `SaleCompleted` | `SALE_COMPLETED` |
| `ProductPaused` | `PRODUCT_PAUSED` |
| ... | ... |

---

## Notification Engine

Canais suportados (infraestrutura):

| Canal | Status |
|-------|--------|
| `toast` | Implementado (Sonner) |
| `email` | Fila (v2.1) |
| `whatsapp` | Fila (v2.1) |
| `push` | Fila (v2.1) |
| `sms` | Fila (v2.1) |
| `webhook` | Fila (v2.1) |
| `telegram` | Fila (v2.1) |

```typescript
import { notificationEngine, NotificationChannels } from "@/core";

await notificationEngine.send(NotificationChannels.toast, {
  message: "Estoque baixo!",
  title: "Alerta",
});
```

---

## Audit Engine

Registra: quem, quando, IP, antes/depois, tabela, registro.

```typescript
import { auditEngine } from "@/core";

await auditEngine.record({
  action: "update",
  table_name: "products",
  record_id: product.id,
  before_data: { status: "active" },
  after_data: { status: "inactive" },
});
```

Auto-audit: habilitado no `CoreProvider` para eventos de domínio (exceto `DataChanged`).

Tabela: `audit_logs` (migration 018).

---

## Feature Flag Engine

Módulos configuráveis por organização:

- `orders`, `delivery`, `crm`, `finance`, `pdv`, `ai`, `loyalty`, `marketplace`

```typescript
import { featureFlagEngine, FeatureModules } from "@/core";

if (featureFlagEngine.isEnabled(FeatureModules.delivery)) {
  // renderizar módulo delivery
}
```

Tabela: `organization_feature_flags` (migration 019).

**Padrão:** módulos existentes habilitados quando não há registro no banco.

---

## Permission Engine

Papéis:

| Papel | Descrição |
|-------|-----------|
| `admin` | Acesso total |
| `manager` | Operacional completo |
| `cashier` | PDV + clientes |
| `kitchen` | Pedidos (futuro) |
| `delivery` | Entregas (futuro) |
| `finance` | Financeiro (futuro) |

```typescript
import { permissionEngine } from "@/core";

permissionEngine.hasPermission("manager", "finance:write"); // true
permissionEngine.canAccessRoute("cashier", "/pdv"); // true
```

---

## Bootstrap

`CoreProvider` em `App.tsx` inicializa:

1. AuditEngine (contexto do usuário)
2. FeatureFlagEngine (flags da org)
3. AutomationEngine (regras SE/ENTÃO)
4. Auto-audit via EventBus

---

## Migrations necessárias

| Migration | Tabela |
|-----------|--------|
| 016 | `automation_rules` |
| 017 | `automation_logs` |
| 018 | `audit_logs` |
| 019 | `organization_feature_flags` |

---

## Roadmap de migração

1. ✅ Core + EventBus criados
2. ✅ Bridges legados (`lib/automation-events`, `lib/sale-events`)
3. 🔲 Migrar services para `eventBus.publish(DomainEvents.X)` direto
4. 🔲 Remover imports cross-module (`actionExecutor` → handlers no bus)
5. 🔲 Unificar `auth/types/roles.ts` com `PermissionEngine`
6. 🔲 Gate de rotas via `FeatureFlagEngine`

---

## Foundation V1 (crescimento de longo prazo)

Ver relatório completo: [`docs/FOUNDATION_REPORT.md`](./FOUNDATION_REPORT.md).

### Pastas canônicas para código novo

| Tipo | Onde colocar |
|------|----------------|
| Domínio | `src/features/<domínio>/` |
| UI reutilizável | `src/design-system/` (preferir) |
| Utilitários puros | `src/lib/` (`date`, `format`, `logger`, `queryKeys`) |
| Contratos multi-app | `packages/shared/` |
| Rotas | `src/routes/AppRoutes.tsx` + `AppRoute` em auth types |

### Regras de fundação

1. Não duplicar `isToday` / `formatCurrency` — usar `src/lib`.
2. Novas keys de cache devem nascer em `src/lib/queryKeys.ts` (web) ou `apps/mobile/src/lib/queryKeys.ts`.
3. Logging via `logger`, não `console.*` direto.
4. Design Preview só em desenvolvimento.
5. Comunicação entre features via EventBus.
