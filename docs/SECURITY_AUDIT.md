# Auditoria de Segurança — RC1

## Implementado

| Controle | Status | Detalhe |
|----------|--------|---------|
| RLS em todas as tabelas de negócio | ✅ | Migration 009 |
| Isolamento por organização | ✅ | `organization_id` + policies |
| Perfis de acesso | ✅ | admin, manager, cashier |
| Rotas protegidas | ✅ | `ProtectedRoute` + `RoleRoute` |
| RPCs com checagem de org/role | ✅ | `finalize_sale`, `register_stock_movement` |
| Auditoria | ✅ | Tabela `audit_logs` + `log_audit()` |
| Sessão persistente + refresh | ✅ | Supabase Auth |
| Error boundary global | ✅ | `ErrorBoundary` |
| Logger estruturado | ✅ | `src/lib/logger.ts` |
| Validação de env | ✅ | `src/config/supabase.ts` |

## Matriz de permissões

| Recurso | Admin | Gerente | Caixa |
|---------|-------|---------|-------|
| Dashboard | ✅ | ✅ | ❌ |
| Produtos CRUD | ✅ | ✅ | ❌ |
| Estoque | ✅ | ✅ | ❌ |
| PDV / Vendas | ✅ | ✅ | ✅ |
| Clientes CRUD | ✅ | ✅ | 👁️ leitura |
| Financeiro | ✅ | ✅ | ❌ |
| Configurações | ✅ | ❌ | ❌ |
| Audit logs | ✅ | ✅ | ❌ |

## Pendências conhecidas

- **Convite de usuários**: signup cria org própria; falta fluxo de convite para mesma empresa
- **Gerenciamento de roles**: UI de configurações ainda stub
- **Rate limiting**: depende do Supabase Auth
- **CSP / headers**: configurar no host de deploy
- **Service role**: nunca usar no frontend

## Testes de segurança recomendados

1. Login como caixa → tentar acessar `/financeiro` → deve redirecionar
2. Usuário org A → não deve ver produtos da org B (RLS)
3. Anon key sem JWT → inserts devem falhar
4. RPC finalize_sale como caixa → deve funcionar
5. RPC register_stock_movement como caixa → deve falhar

## Comandos

```bash
npm run validate:full   # fluxo autenticado end-to-end
npm run lint
npm run build
```
