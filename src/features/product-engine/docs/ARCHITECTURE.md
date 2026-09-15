# Arquitetura — Product Engine

## Camadas

| Camada | Responsabilidade |
|--------|------------------|
| `types/` | Contratos enterprise (grupos, opções, pricing, cart) |
| `adapters/` | Mapeamento DB → tipos engine |
| `repository/` | Queries específicas do engine (grafo, produtos por grupo) |
| `engines/` | Lógica pura e serviços de domínio |
| `core/` | Orquestração (Composer, Builder, Summary, Engine) |
| `integrations/` | Adaptadores por canal |

## Grafo de dependência

```
Produto
  └── Grupo (option_group via product_option_groups)
        └── Opção (options)
              └── Ingredientes (tipo inferido: ingredient/sauce/drink)
```

`ProductDependencyEngine.buildGraph()` indexa:

- `groupToProducts`: grupo → produtos
- `optionToProducts`: opção → produtos
- `optionToGroups`: opção → grupo

## ProductBuilder — fluxo

1. **size** — selecionar tamanho (grupo cujo nome contém "tamanho", "size", "porção")
2. **groups** — navegar grupos visíveis
3. **options** — selecionar opções por grupo
4. **review** — calcular preço + validar + gerar payload

## ProductPricingEngine

```
total = (base + addons + premium) × quantity - discounts
```

Promoções futuras entram via array `PricingPromotion[]`.

## ProductValidator

Valida por grupo:

- `minSelection` / `maxSelection`
- `required`
- `selectionType` (radio = única opção)
- `allowsRepeat` (duplicidade)
- estoque (`stockControl` + `stock`)
- opções ativas

## ProductRulesEngine

Regras plugáveis via interface `EngineRule`:

- Premium exige tamanho selecionado
- Brinde respeita `maxFree`
- Conflitos de ingredientes (ex.: sem cebola vs extra cebola)

## Extensibilidade

Para adicionar campo enterprise no futuro (ex.: `weight`, `sku`, `hidden`):

1. Adicionar coluna/metadata no banco (migration)
2. Atualizar `compositionAdapter.ts`
3. Engines passam a consumir o campo sem alterar PDV
