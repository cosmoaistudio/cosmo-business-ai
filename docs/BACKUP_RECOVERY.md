# Backup e Recuperação — RC1

## Backup automático (Supabase)

1. Acesse **Project Settings → Database → Backups**
2. Em planos Pro+, backups diários são automáticos
3. Retenção padrão: 7 dias (ajustável conforme plano)

## Backup manual do schema

O schema versionado está em `database/migrations/`:

```
001_create_products.sql
002_create_sales.sql
003_add_sale_discount_observation.sql
004_create_stock_movements.sql
005_create_customers.sql
006_create_financial_transactions.sql
007_customer_sales_integration.sql
008_fix_finalize_sale_overload.sql
009_rc1_tenant_security.sql
```

Para recriar em ambiente novo: execute os arquivos **em ordem numérica**.

## Export de dados (pg_dump)

Com connection string do Supabase:

```bash
pg_dump "$DATABASE_URL" --schema=public --data-only -f backup-data.sql
pg_dump "$DATABASE_URL" --schema=public --schema-only -f backup-schema.sql
```

## Restore

1. Crie novo projeto Supabase (ou restaure via dashboard)
2. Aplique migrations 001–009
3. Importe dados se necessário:

```bash
psql "$DATABASE_URL" -f backup-data.sql
```

## Recuperação de desastre — checklist

- [ ] Novo projeto Supabase provisionado
- [ ] Migrations aplicadas
- [ ] Variáveis de ambiente atualizadas no host
- [ ] Redirect URLs de auth atualizadas
- [ ] Usuários recriados ou auth restaurado
- [ ] `npm run validate:full` passando

## Script de validação pós-restore

```bash
npm run validate:full
```
