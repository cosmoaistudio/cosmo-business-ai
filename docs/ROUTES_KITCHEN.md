# Rotas de Cozinha vs Pedidos

## Decisão (piloto)

As rotas `/pedidos` e `/cozinha` eram **equivalentes**: ambas renderizavam o `KitchenDisplayBoard` (KDS).

| Rota | Antes | Depois |
|------|-------|--------|
| `/cozinha` | KDS em tela cheia (admin, manager, cashier) | **Rota canônica** do Kitchen Display |
| `/pedidos` | Mesmo KDS dentro do AppLayout (admin, manager) | **Redirect** para `/cozinha` |

## Responsabilidades

- **`/cozinha`**: fila operacional da cozinha (aceitar, preparar, pronto, entregar).
- **`/pedidos`**: alias legado; mantido apenas para links antigos.

## Permissões

- Admin, manager e **cashier** acessam `/cozinha`.
- Cashiers não tinham acesso a `/pedidos`; unificar evita confusão operacional.
