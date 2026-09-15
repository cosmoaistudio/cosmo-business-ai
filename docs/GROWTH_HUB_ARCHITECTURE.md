# Growth Hub V1 — Arquitetura

Módulo de **crescimento** (marketing/conteúdo/tráfego/IA).  
Não controla operação (PDV, cozinha, financeiro).

## Pasta

```
src/features/growth-hub/
├── types/growthHub.types.ts
├── constants/growthHub.constants.ts
├── services/
│   ├── growthHub.service.ts      # snapshot local (sem Supabase)
│   └── ideaGenerator.service.ts  # provider swapável (IA depois)
├── hooks/useGrowthHub.ts
├── components/GrowthHubPage.tsx
├── styles/growth-hub.css
└── index.ts
```

Rota: `/crescimento`  
Sidebar: **Crescimento → Growth Hub**

## Contratos importantes

### Ideias ilimitadas

```
Nicho → Tema → Objetivo → Rede → Quantidade → generateIdeas()
```

`IdeaGenerationRequest` + `IdeaGeneratorProvider` permitem trocar o stub local por LLM sem mudar a UI.

### Tráfego pago

Canais tipados: `meta_ads` | `google_ads` | `tiktok_ads`  
Sem integração de API em V1 — apenas UI + contratos.

### IA Studio

Slots: roteiro, legenda, hashtags, oferta, criativo — prontos para binding futuro.

## O que V1 NÃO faz

- Não grava no Supabase
- Não chama APIs de ads
- Não gera com LLM real
- Não altera PDV / Dashboard / Foundation
