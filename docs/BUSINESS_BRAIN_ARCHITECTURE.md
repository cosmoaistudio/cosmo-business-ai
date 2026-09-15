# Business Brain V1 — Arquitetura

Cérebro operacional do Cosmo: **interpreta** dados da empresa.  
Não executa ações. Não altera regras de negócio.

## Estrutura

```
src/features/business-brain/
├── types/businessBrain.types.ts
├── repository/businessBrain.repository.ts   # adapters read-only
├── services/
│   ├── businessBrainAnalyzer.service.ts     # scoring + insights
│   ├── businessBrain.service.ts
│   └── brainAsk.service.ts                  # ask-anything (stub)
├── providers/BusinessBrainProvider.tsx      # React Query scoped
├── hooks/useBusinessBrain.ts
├── components/BusinessBrainPage.tsx
├── styles/business-brain.css
└── index.ts
```

Rota: `/cerebro`  
Menu: **Inteligência → Business Brain**  
Lazy load na rota.

## Fontes de dados (somente leitura)

- `dashboardService.getStats()`
- `cosmoAiService.analyze()` (opcional; falha não quebra o painel)

Nenhuma mutation / RPC / tabela nova.

## React Query

Provider **escopo local** no módulo (não mexe no App root).  
Keys: `queryKeys.businessBrain.snapshot(orgId)`.

## Ask-anything

`BrainAskProvider` + `brainAskService.setProvider(...)`  
V1 usa stub; UI já aceita perguntas sugeridas.

## Blocos da UI

1. Saúde da empresa  
2. Resumo inteligente  
3. Oportunidades  
4. Alertas  
5. Insights (comparações)  
6. Metas  
7. Marketing  
8. IA (arquitetura)
