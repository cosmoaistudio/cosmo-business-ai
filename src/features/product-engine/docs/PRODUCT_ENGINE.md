# Product Engine Enterprise

Camada enterprise do Cosmo Business AI para composição avançada de produtos em qualquer operação de alimentação (açaí, sorveteria, hamburgueria, pizzaria, marmitaria, cafeteria, sushi, lanchonete, etc.).

## Objetivo

O Product Engine **não substitui** o módulo `products` nem o PDV atual. Ele opera como **orquestrador** sobre `product-composition`, adicionando:

- Tipos enterprise (grupos, opções, regras)
- Motores de preço, validação, dependência e disponibilidade
- Fluxo de montagem (ProductBuilder)
- Resumo para impressão
- Adaptadores de integração (PDV, Delivery, Cardápio, Mobile, Desktop, API)

## Arquitetura

```
ProductEngine (facade)
├── ProductComposer      → carrega grafo produto → grupos → opções
├── ProductBuilder       → fluxo size → groups → options → price → validate → cart
├── ProductValidator     → mín/máx, obrigatórios, estoque, duplicidade
├── ProductPricingEngine → base + adicionais + premium + quantidade + promoções
├── ProductRulesEngine   → regras de negócio extensíveis
├── ProductDependencyEngine → grafo de dependências
├── ProductAvailabilityEngine → pause/reactivate automático por estoque
└── ProductSummary       → resumo para impressão
```

## Tipos de grupo

| Tipo | Label |
|------|-------|
| `required` | Obrigatório |
| `optional` | Opcional |
| `single_choice` | Escolha única |
| `multiple_choice` | Escolha múltipla |
| `premium` | Premium |
| `gift` | Brinde |
| `complement` | Complemento |
| `ingredient` | Ingrediente |
| `sauce` | Molho |
| `drink` | Bebida |

O tipo é inferido a partir do nome do grupo e de `selection_type` / `required` do schema existente.

## Compatibilidade

- **Sem alteração no PDV** — integração via `integrations/pdv.adapter.ts`
- **Sem migration de banco** — campos enterprise extras usam defaults/adapters
- **Reutiliza** `option_groups`, `options`, `product_option_groups`, `products`

## Uso rápido

```typescript
import { productEngine } from "@/features/product-engine";

const { node, state } = await productEngine.builder.start(productId);

const result = await productEngine.addToCart(productId, state, "pdv", 1);

if (result.valid && result.cartPayload) {
  // Integrar com PDV via toPdvCartItem()
}

const summary = productEngine.summary.generate(node, state);
```

## Disponibilidade automática

Quando uma opção fica sem estoque:

1. `ProductAvailabilityEngine` pausa a opção (`active: false`)
2. Descobre produtos afetados via `ProductDependencyEngine`
3. Pausa produtos cujos grupos obrigatórios ficaram indisponíveis

Quando o estoque volta, reativa automaticamente.

```typescript
await productEngine.handleOptionStockChange(optionId, 0, previousStock);
```

## Documentação adicional

- [ARCHITECTURE.md](./ARCHITECTURE.md)
- [INTEGRATION.md](./INTEGRATION.md)
