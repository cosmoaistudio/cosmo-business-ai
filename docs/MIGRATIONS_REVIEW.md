# Revisão de Migrations — RC1

| # | Arquivo | Propósito | Status |
|---|---------|-----------|--------|
| 001 | `create_products.sql` | Tabela produtos | ✅ Estável |
| 002 | `create_sales.sql` | Vendas, itens, pagamentos, RPC inicial | ✅ Substituída por versões posteriores |
| 003 | `add_sale_discount_observation.sql` | Desconto e observação em vendas | ✅ Integrada |
| 004 | `create_stock_movements.sql` | Movimentações + estoque mínimo | ✅ Integrada |
| 005 | `create_customers.sql` | Clientes | ✅ Integrada |
| 006 | `create_financial_transactions.sql` | Financeiro + integração PDV | ✅ Integrada |
| 007 | `customer_sales_integration.sql` | CPF, customer_id, RPC com cliente | ✅ Integrada |
| 008 | `fix_finalize_sale_overload.sql` | Remove overload ambíguo da RPC | ✅ Obrigatória pós-007 |
| 009 | `rc1_tenant_security.sql` | **RC1**: org, profiles, RLS, audit, RPCs seguros | ✅ **Obrigatória para produção** |

## Ordem de aplicação

```
001 → 002 → 003 → 004 → 005 → 006 → 007 → 008 → 009
```

## Dependências críticas

- **008** deve ser aplicada após **007** (corrige overload de `finalize_sale`)
- **009** deve ser aplicada por último (RLS + multi-tenant)

## Pós-migration 009

- Dados existentes migrados para "Organização Padrão"
- Usuários auth existentes recebem perfil admin na org padrão
- Novos signups criam org + perfil admin automaticamente

## Verificação

```sql
-- RLS habilitado
select tablename, rowsecurity from pg_tables
where schemaname = 'public';

-- Funções de segurança
select proname from pg_proc
where proname in ('get_my_organization_id', 'get_my_role', 'finalize_sale');
```
