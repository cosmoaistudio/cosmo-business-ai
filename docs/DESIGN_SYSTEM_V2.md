# Cosmo Design System V2

**Versão:** 2.0  
**Status:** ✅ Aprovado — **revisão final concluída** — aguardando início da Fase 1  
**Escopo:** Visual + UX apenas. Sem alteração de regras de negócio, Supabase, APIs ou RPCs.

---

## Visão

Transformar o Cosmo Business AI em um produto **enterprise premium** — confiança, tecnologia, velocidade, inteligência e simplicidade.

O Cosmo não é apenas uma Dashboard. É um **sistema operacional empresarial (Cosmo OS)** onde cada módulo se comporta como um aplicativo dedicado, com foco total no contexto do usuário.

**Referências de qualidade (não cópia):** Stripe Dashboard, Shopify POS, Linear, Notion, Vercel, Raycast, Arc Browser.

**Identidade Cosmo:** dark-first refinado, superfícies grafite, acentos cirúrgicos, motion sutil, densidade controlada.

---

## 1. Arquitetura visual

### 1.1 Camadas do sistema

```
┌─────────────────────────────────────────────────────────────┐
│  Cosmo OS — Shell global                                    │
│  ├── Sidebar V2 (apps / módulos)                            │
│  ├── Header V2 (search, Command Palette, Quick Actions)     │
│  ├── App Canvas (módulo ativo — Focus Mode)                 │
│  └── Cosmo Manager (FAB + painel lateral)                   │
├─────────────────────────────────────────────────────────────┤
│  Design System V2 (tokens + primitivos)                     │
│  src/design-system/                                         │
│  ├── tokens/   colors, typography, spacing, radius, motion  │
│  ├── icons/    mapeamento Lucide + tamanhos                 │
│  └── components/  Card, KPI, Skeleton, Empty, Badge...      │
├─────────────────────────────────────────────────────────────┤
│  Design System V1 (legado — migração gradual)               │
│  src/design/  → deprecar após Fase 5                        │
└─────────────────────────────────────────────────────────────┘
```

### 1.2 Princípios

| Princípio | Descrição |
|-----------|-----------|
| **Cosmo OS** | Cada módulo é um app. Contexto único por vez. |
| **Clareza** | Uma ideia por bloco. Hierarquia óbvia em 3 segundos. |
| **Respiro** | Mais whitespace; menos cards competindo por atenção. |
| **Confiança** | Tipografia estável, números legíveis, estados previsíveis. |
| **Velocidade** | Command Palette, Quick Actions, motion < 300ms. |
| **Restrição cromática** | Roxo **exclusivo** do Cosmo AI — nunca predominante na Dashboard. |

### 1.3 Grid e breakpoints

| Token | Largura | Colunas | Gutter | Margin |
|-------|---------|---------|--------|--------|
| `sm` | ≥640px | 4 | 16px | 16px |
| `md` | ≥768px | 8 | 20px | 24px |
| `lg` | ≥1024px | 12 | 24px | 32px |
| `xl` | ≥1280px | 12 | 24px | 40px |
| `2xl` | ≥1536px | 12 | 32px | 48px (max-width 1440px conteúdo) |
| `uw` | ≥1920px | 12 | 32px | auto (max-width 1600px) |

**Dashboard:** conteúdo principal `max-w-[1440px] mx-auto` para ultrawide.

### 1.4 Estrutura de pastas (implementação futura)

```
src/design-system/
├── tokens/
│   ├── colors.ts
│   ├── typography.ts
│   ├── spacing.ts
│   ├── radius.ts
│   ├── shadows.ts
│   ├── animations.ts
│   └── index.ts
├── icons.ts
├── components/
│   ├── Card/
│   ├── KpiCard/
│   ├── Skeleton/
│   ├── EmptyState/
│   ├── Badge/
│   ├── Button/
│   └── index.ts
└── index.ts
```

Compatibilidade: re-exportar gradualmente de `@/design-system` mantendo `@/design` até migração completa.

---

## 2. Cosmo OS

### 2.1 Conceito

Cosmo OS é a metáfora de experiência: um **sistema operacional para o negócio**, não uma única tela administrativa.

Cada módulo principal funciona como um **aplicativo independente** dentro do shell Cosmo. Ao entrar em um módulo, o usuário deve sentir que entrou em um contexto dedicado — com layout, densidade e distrações calibradas para aquela função.

### 2.2 Módulos (Apps)

| App | Rota | Propósito | Sensação |
|-----|------|-----------|----------|
| **Dashboard** | `/` | Visão executiva do dia | Centro de comando |
| **Centro de Operações** | `/operacoes` | Monitoramento realtime | Sala de controle |
| **PDV** | `/pdv` | Vendas no balcão | Terminal de caixa |
| **Cozinha** | `/cozinha` | Produção e fila KDS | Estação de trabalho |
| **Financeiro** | `/financeiro` | Fluxo de caixa | Painel financeiro |
| **Produtos** | `/produtos` | Catálogo e estoque | Gestão de inventário |
| **Cosmo Manager** | Copilot / `/ia` | Gerente operacional IA | Assistente executivo |

### 2.3 Comportamento por módulo

```
Usuário clica "PDV" na Sidebar
        │
        ▼
┌─────────────────────────────────────┐
│  Shell mínimo (Focus Mode ativo)    │
│  ┌───────────────────────────────┐  │
│  │         PDV App Canvas        │  │
│  │   (100% foco no caixa)        │  │
│  └───────────────────────────────┘  │
│  Cosmo Manager: FAB apenas          │
│  Sidebar: colapsada ou discreta     │
└─────────────────────────────────────┘
```

- **Transição entre apps:** fade + slide leve (250ms) — sensação de “abrir aplicativo”.
- **Estado persistente:** cada app lembra scroll, filtros e painéis (localStorage / URL params).
- **Identidade por app:** ícone + cor semântica no header (PDV = azul, Cozinha = laranja, Financeiro = verde) — **nunca roxo** exceto Cosmo Manager.

### 2.4 Shell vs App

| Camada | Sempre visível | Ocultável (Focus Mode) |
|--------|----------------|------------------------|
| Sidebar | ✓ (colapsável) | ✓ (PDV, Cozinha) |
| Header | ✓ (reduzido) | parcial |
| Cosmo Manager FAB | ✓ | ✓ |
| Command Palette | via `Ctrl+K` | — |
| Quick Actions | via `Ctrl+K` ou botão `+` | — |

---

## 3. Paleta

### 3.1 Filosofia

- **Base:** grafite, preto profundo, branco suave — 90% da UI.
- **Semântica:** verde (sucesso/receita), laranja (atenção), vermelho (risco).
- **Acento primário:** azul elétrico (ações, links, focus, Dashboard).
- **Acento premium:** roxo **exclusivo** do Cosmo AI e ações premium.

### 3.2 Uso do roxo — regra absoluta

> **O roxo pertence exclusivamente ao Cosmo AI e a ações premium.**  
> **Não utilizar roxo como cor predominante da Dashboard.**

| Permitido (roxo) | Proibido (roxo) |
|------------------|-----------------|
| FAB do Cosmo Manager | Background de cards KPI |
| Tab ativa do painel IA | Gradientes na Dashboard |
| Badge “Cosmo AI” / “Insight” | Sidebar, header, gráficos |
| Botão variant `intelligence` | Secondary global (V1 `#7C3AED`) |
| Indicador de prioridade IA | Bordas e glows em cards operacionais |

**Dashboard V2:** 100% neutros + azul semântico + verde/laranja/vermelho para deltas. Roxo ≤ 5% da área visível.

### 3.3 Tokens de cor

```typescript
// Proposta — colors.ts
export const palette = {
  bg: {
    base: "#030712",
    elevated: "#0A0F1A",
    surface: "#111827",
    muted: "#1F2937",
    overlay: "rgba(3, 7, 18, 0.72)",
  },
  border: {
    subtle: "rgba(255, 255, 255, 0.06)",
    default: "rgba(255, 255, 255, 0.10)",
    strong: "rgba(255, 255, 255, 0.16)",
  },
  text: {
    primary: "#F9FAFB",
    secondary: "#9CA3AF",
    tertiary: "#6B7280",
    inverse: "#030712",
  },
  accent: {
    blue: "#3B82F6",
    blueHover: "#2563EB",
    blueMuted: "rgba(59, 130, 246, 0.12)",
  },
  intelligence: {
    purple: "#8B5CF6",      // EXCLUSIVO Cosmo AI
    purpleHover: "#7C3AED",
    purpleMuted: "rgba(139, 92, 246, 0.12)",
  },
  success: { DEFAULT: "#10B981", muted: "rgba(16, 185, 129, 0.12)" },
  warning: { DEFAULT: "#F97316", muted: "rgba(249, 115, 22, 0.12)" },
  danger:  { DEFAULT: "#EF4444", muted: "rgba(239, 68, 68, 0.12)" },
} as const;
```

### 3.4 Mapeamento V1 → V2

| V1 | V2 | Ação |
|----|-----|------|
| `secondary: #7C3AED` | `intelligence.purple` | Remover de Dashboard/shell |
| `primary: #2563EB` | `accent.blue` | Manter |
| `background: #050816` | `bg.base: #030712` | Neutro mais profundo |

### 3.5 Contraste (WCAG AA)

- Texto primário sobre `bg.surface`: ≥ 7:1
- Texto secundário sobre `bg.surface`: ≥ 4.5:1
- Botões primários: texto branco sobre `accent.blue` ≥ 4.5:1
- Estados focus: outline `accent.blue` 2px + offset 2px

---

## 4. Componentes

### 4.1 Taxonomia

| Nível | Exemplos | Uso |
|-------|----------|-----|
| **Primitivos** | Button, Input, Badge, Avatar | Ações e formulários |
| **Compostos** | Card, KpiCard, ChartCard, EmptyState | Dashboard, listas |
| **Shell** | Sidebar, Header, CosmoManagerPanel, CommandPalette | Cosmo OS |
| **Feedback** | Skeleton, Toast, Tooltip, LoadingBar | Estados transitórios |

### 4.2 Card V2 (`CosmoCard`)

- **Radius:** `radius.lg` (16px)
- **Shadow:** `shadow.sm` — sem glow colorido
- **Border:** `border.subtle` — 1px
- **Background:** `bg.surface`
- **Hover:** `translateY(-1px)` + `shadow.md` (150ms)

### 4.3 KpiCard V2

Props: `label`, `value`, `delta`, `deltaType`, `icon`, `loading`, `format`.

Estados: Loading (skeleton), Empty (`—`), Realtime (dot verde).

### 4.4 Button V2

| Variant | Uso |
|---------|-----|
| `primary` | Ação principal (azul) |
| `secondary` | Ação secundária |
| `ghost` | Toolbar, sidebar |
| `intelligence` | **Cosmo AI exclusivo (roxo)** |
| `danger` | Exclusão |

### 4.5 Ícones

Lucide React · tamanhos `16 | 20 | 24 | 32` · stroke 1.75.

---

## 5. Wireframes

### 5.1 Cosmo OS — Shell global

```
┌──────────┬──────────────────────────────────────────────────────────┐
│          │  Header: [App] [Ctrl+K Search] [+] [●Online] [Avatar]   │
│ Sidebar  ├──────────────────────────────────────────────────────────┤
│          │                                                          │
│  Apps    │              APP CANVAS (módulo ativo)                   │
│          │                                                          │
│          │                                              ┌─────┐     │
│          │                                              │ FAB │ ← IA│
└──────────┴──────────────────────────────────────────────────────────┘
```

### 5.2 Dashboard Hero — above the fold (1080p)

```
┌─────────────────────────────────────────────────────────────────────┐
│ ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓ HERO — elemento visual principal ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓ │
│                                                                     │
│  Bom dia, Felipe                         [● Saúde: Operacional]   │
│                                                                     │
│  R$ 4.820 faturados hoje · 47 pedidos · Meta: 78% atingida        │
│                                                                     │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐                   │
│  │ Faturamento │ │   Pedidos   │ │    Meta     │  ← inline no Hero │
│  │  R$ 4.820   │ │     47      │ │    78%      │                   │
│  └─────────────┘ └─────────────┘ └─────────────┘                   │
│ ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓ fim above the fold ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓ │
├─────────────────────────────────────────────────────────────────────┤
│ KPI ROW expandida (Lucro, Ticket, Clientes...)                      │
│ Chart Hero                                                          │
└─────────────────────────────────────────────────────────────────────┘
```

### 5.3 Command Palette (`Ctrl+K`)

```
┌─────────────────────────────────────────────────────┐
│  🔍  Buscar produtos, rotas, ações...               │
├─────────────────────────────────────────────────────┤
│  AÇÕES RÁPIDAS                                      │
│  + Novo Produto    + Nova Venda    + Novo Cliente   │
├─────────────────────────────────────────────────────┤
│  ROTAS                                              │
│  → Dashboard    → PDV    → Cozinha    → Financeiro  │
├─────────────────────────────────────────────────────┤
│  COSMO MANAGER                                      │
│  → Abrir painel IA    → Ver prioridades             │
└─────────────────────────────────────────────────────┘
```

### 5.4 Cosmo Manager — painel lateral

```
┌──────────────────────────────┐
│ Cosmo Manager    [─][📌][✕]  │
├──────────────────────────────┤
│ Insights | Prioridades | ... │
├──────────────────────────────┤
│ RESUMO DO DIA                │
│ 47 pedidos · R$ 4.820 · OK   │
│                              │
│ PRIORIDADES                  │
│ • Estoque baixo: Coca-Cola   │
│                              │
│ AÇÕES SUGERIDAS              │
│ [Repor estoque] [Ver cozinha]│
└──────────────────────────────┘
```

---

## 6. Dashboard V2

### 6.1 Hero — elemento visual principal

O Hero é o **primeiro e mais importante bloco** da Dashboard. Deve comunicar, **acima da dobra** (viewport 1080p), tudo que o gestor precisa saber em 5 segundos:

| Elemento | Conteúdo | Prioridade visual |
|----------|----------|-------------------|
| **Saudação** | “Bom dia, {nome}” | `display-xl`, peso 700 |
| **Resumo operacional** | 1 linha narrativa | `body`, `text.secondary` |
| **Indicador de saúde** | Operacional / Atenção / Crítico | Chip semântico (verde/laranja/vermelho) |
| **Faturamento do dia** | Valor tabular | `display`, inline no Hero |
| **Pedidos do dia** | Contagem | `display`, inline no Hero |
| **Meta** | % atingida ou progress ring | inline no Hero |

**Regras Hero:**
- Ocupa **100% da largura** do canvas, min-height 240px.
- **Sem roxo** — apenas neutros + azul/verde semântico.
- **Sem emoji** — tipografia e números fazem o impacto.
- KPI row completa fica **abaixo** do Hero; métricas críticas (faturamento, pedidos, meta) sobem para **dentro** do Hero.

### 6.2 Consolidar V1

| V1 | V2 |
|----|-----|
| WelcomeDashboard separado | Integrado no Hero |
| DashboardMetricsGrid denso | Hero inline + KPI row |
| DashboardInsights inline | Cosmo Manager |
| 4 gráficos 2×2 | 1 chart hero + 2 secundários |

### 6.3 Seções abaixo do Hero

1. **KPI Row** — Lucro, Ticket médio, Clientes (faturamento/pedidos já no Hero).
2. **Chart Hero** — Receita 30 dias (66% width).
3. **Side stack** — estoque crítico, última venda.
4. **Secondary** — top produtos + alertas (máx. 2 cards).

### 6.4 Dados

Reutilizar `useDashboardStats()` — **sem alterar API**.

---

## 7. Sidebar V2

### 7.1 Grupos (Apps do Cosmo OS)

```
OPERAÇÃO          → Dashboard, Centro Ops, PDV, Cozinha, Financeiro
CATÁLOGO          → Produtos, Builder, Opções, Estoque
RELACIONAMENTO    → Clientes
SISTEMA           → Automações, Configurações
```

**Cosmo Manager:** acesso via FAB + `Ctrl+K` — **não** item permanente na sidebar.

### 7.2 Comportamento

- Expandida 240px / Recolhida 72px
- Transição 250ms · persistência `localStorage`
- Active: barra 3px `accent.blue`
- Hover: `bg.muted` fade 150ms

---

## 8. Cosmo Manager

### 8.1 Conceito

A IA **não é um chat**. É um **gerente operacional** — painel executivo que monitora, prioriza e recomenda ações.

O chat existe como **aba secundária**, não como interface principal.

### 8.2 Problema atual (V1)

`CosmoAIWidget` — widget 360px fixo, gradiente roxo, sobrepõe Dashboard, aparência de chatbot.

### 8.3 Comportamento alvo

| Estado | UI |
|--------|-----|
| **Fechado** | FAB 56px + badge alertas |
| **Aberto** | Painel lateral 420px |
| **Fixado** | Empurra canvas (sem overlay) |
| **Minimizado** | Dock bar 48px |

**Regra:** nunca bloquear Hero ou chart hero da Dashboard.

### 8.4 Estrutura do painel — ordem das abas

```
1. Insights        ← visão analítica (default ao abrir)
2. Prioridades     ← o que fazer agora
3. Automações      ← regras e logs
4. Chat            ← conversa (secundário)
5. Histórico       ← timeline de eventos
```

### 8.5 Conteúdo por aba

| Aba | Conteúdo | Tom |
|-----|----------|-----|
| **Insights** | Análises, tendências, `data.insights` | Analítico |
| **Prioridades** | Top ações ordenadas por score | Diretivo |
| **Automações** | Atalhos + últimos logs | Operacional |
| **Chat** | Stub LLM — pergunta/resposta | Conversacional |
| **Histórico** | `data.timeline` | Cronológico |

### 8.6 Blocos fixos (topo do painel — todas as abas)

Antes das tabs ou na aba Insights como header persistente:

- **Resumo do dia** — pedidos, faturamento, status geral
- **Alertas** — `data.alerts` (vermelho/laranja)
- **Recomendações** — `data.priorities` resumidas
- **Ações sugeridas** — CTAs contextuais (ex: “Repor estoque”, “Abrir cozinha”)

### 8.7 Integração

- Hook: `useCosmoAi()` — sem alteração
- Substituir `CosmoAIWidget` por `CosmoManagerShell`
- `/ia` permanece como visão full-screen opcional

---

## 9. Command Palette

### 9.1 Conceito

Paleta de comandos global — navegação e ações instantâneas. Inspirada em Linear, Raycast, Notion.

**Atalho:** `Ctrl+K` (Windows/Linux) · `Cmd+K` (macOS)

### 9.2 Escopo de busca

| Categoria | Exemplos |
|-----------|----------|
| **Produtos** | Buscar por nome, ir para produto, editar |
| **Pedidos** | Últimas vendas, ir para cozinha |
| **Clientes** | Buscar cliente, novo cliente |
| **Configurações** | Rotas `/configuracoes/*` |
| **Rotas** | Navegar para qualquer módulo Cosmo OS |
| **Relatórios** | Dashboard, Financeiro, exportações |
| **IA** | “Abrir Cosmo Manager”, “Ver prioridades” |
| **Automações** | Listar, criar nova |

### 9.3 UX

- Modal centrado, max-width 560px, overlay `bg.overlay`
- Input autofocus · resultados fuzzy search
- `↑↓` navegar · `Enter` executar · `Esc` fechar
- Seção “Recentes” + “Ações rápidas” quando input vazio
- Ícone + label + atalho secundário por item

### 9.4 Implementação futura

- Componente: `CommandPalette` em `src/design-system/components/`
- Provider global no `AppLayout`
- **Sem alteração de API** — busca client-side + rotas existentes

---

## 10. Quick Actions

### 10.1 Conceito

Ações de criação frequentes, acessíveis **globalmente** de qualquer módulo.

### 10.2 Ações padrão

| Ação | Atalho sugerido | Destino |
|------|-----------------|---------|
| **Novo Produto** | `Ctrl+Shift+P` | `/produtos` + modal create |
| **Nova Venda** | `Ctrl+Shift+V` | `/pdv` |
| **Novo Cliente** | `Ctrl+Shift+C` | `/clientes` + modal create |
| **Novo Pedido** | — | `/pdv` ou pedido digital |
| **Nova Automação** | — | `/automacoes/nova` |

### 10.3 Pontos de acesso

1. **Botão `+`** no Header (dropdown)
2. **Command Palette** — seção “Ações rápidas” no topo
3. **Cosmo Manager** — “Ações sugeridas” contextual

### 10.4 Visual

- Dropdown compacto, ícone Lucide + label
- Separadores por categoria
- Atalhos de teclado exibidos à direita (caption mono)

---

## 11. Focus Mode

### 11.1 Conceito

Cada módulo Cosmo OS ativa um **Focus Mode** que esconde distrações e maximiza o contexto de trabalho.

### 11.2 Comportamento por app

| App | Focus Mode | O que esconde/reduz |
|-----|------------|---------------------|
| **PDV** | Terminal | Sidebar colapsada, header mínimo, sem Cosmo Manager expandido |
| **Cozinha** | Produção | Full-screen canvas, sidebar oculta, tipografia grande |
| **Financeiro** | Análise | Sidebar colapsada, gráficos maximizados |
| **Produtos** | Catálogo | Filtros sticky, lista/grid dominante |
| **Dashboard** | Visão geral | Focus Mode **off** — shell completo |

### 11.3 Ativação

- **Automática** ao entrar em rotas configuradas (`/pdv`, `/cozinha`, `/financeiro`)
- **Manual** — toggle no header ou `Ctrl+Shift+F`
- **Persistência** — preferência por módulo em `localStorage`

### 11.4 Layout PDV (exemplo)

```
┌─────────────────────────────────────────────────────────┐
│  PDV · Caixa #1                    [Sair Focus] [Avatar]│
├─────────────────────────────────────────────────────────┤
│                                                         │
│              GRADE PRODUTOS  │  CARRINHO               │
│                              │                         │
│                              │  [Finalizar venda]      │
└─────────────────────────────────────────────────────────┘
  (sem sidebar · sem widget IA · sem KPIs)
```

### 11.5 Transição

- Entrada Focus Mode: sidebar slide-out 250ms, header compact 150ms
- Saída: reverse animation
- `prefers-reduced-motion`: instant toggle

---

## 12. Header V2

```
[ App context ]  [Ctrl+K — Buscar...]  [+]  [Desktop ●]  [Live ●]  [Avatar ▾]
```

| Elemento | Especificação |
|----------|---------------|
| **App context** | Nome do módulo ativo + breadcrumb |
| **Search** | Abre Command Palette (`Ctrl+K`) |
| **Botão `+`** | Quick Actions dropdown |
| **Desktop status** | Chip discreto verde/cinza |
| **Realtime** | Dot pulsante “Ao vivo” |
| **Perfil** | Avatar + dropdown |

---

## 13. Motion

| Token | Valor | Uso |
|-------|-------|-----|
| `instant` | 100ms | Hover |
| `fast` | 150ms | Botões |
| `normal` | 250ms | Sidebar, app switch |
| `slow` | 400ms | Panel slide, Focus Mode |
| `counter` | 800ms | KPI count-up Hero |

Respeitar `prefers-reduced-motion`.

---

## 14. Tipografia

Geist Variable + Geist Mono (KPIs).

| Token | Size | Uso |
|-------|------|-----|
| `display-xl` | 48px | Hero saudação |
| `display` | 36px | KPI Hero / cards |
| `heading-lg` | 24px | Seções |
| `body` | 15px | Resumo operacional |
| `caption` | 12px | Labels |
| `overline` | 11px | Sidebar groups |

---

## 15. Espaçamento, radius, responsividade, a11y

- **Spacing:** section gap 32px · Hero padding 40px · card padding 24px
- **Radius:** sm 8 · md 12 · lg 16 · xl 20 · full pills
- **Shadows:** sm/md/lg — sem glow colorido (exceto FAB IA)
- **Breakpoints:** ver §1.3
- **A11y:** focus visible azul · `Ctrl+K` aria-label · live regions KPI · axe ≥ 90

---

## 16. Roadmap de implementação

> **Gate Fase 1:** este documento revisado e aprovado ✅

### Fase 0 — Revisão documental ✅
- [x] Aprovação Design System V2
- [x] Cosmo OS, Cosmo Manager, Command Palette, Quick Actions, Focus Mode
- [x] Hero above the fold · regra roxo

### Fase 1 — Fundação tokens (2–3 dias)
- [ ] `src/design-system/tokens/*`
- [ ] CSS variables `--cosmo-v2-*`
- [ ] Migration guide V1→V2

### Fase 2 — Primitivos (2–3 dias)
- [ ] Card, KpiCard, Skeleton, EmptyState, Button V2

### Fase 3 — Cosmo OS Shell (3–4 dias)
- [ ] Sidebar V2 · Header V2 · Focus Mode base
- [ ] Command Palette (`Ctrl+K`)
- [ ] Quick Actions dropdown
- [ ] Cosmo Manager shell (substituir widget)

### Fase 4 — Dashboard V2 (3–4 dias)
- [ ] Hero above the fold
- [ ] KPI row + chart hero
- [ ] Zero roxo na Dashboard

### Fase 5 — Apps Focus Mode (2–3 dias)
- [ ] PDV · Cozinha · Financeiro layouts dedicados

### Fase 6 — QA
- [ ] build · lint · typecheck · a11y audit

**Estimativa:** 14–19 dias úteis.

---

## 17. Fora de escopo

- Supabase / RPCs / regras de negócio
- Novos endpoints Dashboard
- Mobile redesign
- Light mode (V2.1)

---

## 18. Critérios de aceite

1. Hero comunica saudação + resumo + saúde + faturamento + pedidos + meta **above the fold**.
2. Roxo ≤ 5% da Dashboard · exclusivo Cosmo Manager.
3. Cosmo Manager nunca cobre Hero ou chart.
4. `Ctrl+K` abre Command Palette funcional.
5. Quick Actions acessíveis globalmente.
6. Focus Mode ativo em PDV e Cozinha.
7. Cada módulo parece app dedicado (Cosmo OS).
8. Build e lint sem regressão.

---

## Apêndice A — Diff V1 vs V2

| Aspecto | V1 | V2 |
|---------|----|----|
| Metáfora | Dashboard admin | **Cosmo OS** — apps modulares |
| IA | Chat widget roxo | **Cosmo Manager** gerencial |
| Navegação | Sidebar only | Sidebar + **Command Palette** |
| Criação | Por tela | **Quick Actions** global |
| Hero | Emoji genérico | **Above the fold** executivo |
| Roxo | Secondary global | **Exclusivo IA** |
| PDV/Cozinha | Layout genérico | **Focus Mode** |

---

## Apêndice B — Arquivos impactados (implementação futura)

| Arquivo | Mudança |
|---------|---------|
| `src/pages/Dashboard/index.tsx` | Hero V2 |
| `src/components/layout/Sidebar.tsx` | Cosmo OS apps |
| `src/components/layout/Topbar.tsx` | Command Palette + Quick Actions |
| `src/components/layout/AppLayout.tsx` | Focus Mode + Manager shell |
| `src/components/ai/CosmoAIWidget.tsx` | → CosmoManagerShell |
| `src/design-system/**` | Novo (Fase 1+) |

---

**Documento revisado e aprovado para implementação.**  
Iniciar **Fase 1** somente após sinal verde explícito da equipe.
