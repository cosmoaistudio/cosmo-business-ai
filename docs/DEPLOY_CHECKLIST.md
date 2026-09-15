# Checklist de Deploy — Cosmo Business AI RC1

## Pré-requisitos

- [ ] Node.js 20+
- [ ] Projeto Supabase criado
- [ ] Domínio de produção definido

## Banco de dados

- [ ] Aplicar migrations `001` → `009` em ordem no SQL Editor
- [ ] Confirmar RLS habilitado em todas as tabelas
- [ ] Confirmar trigger `on_auth_user_created` ativo
- [ ] Testar cadastro de usuário cria org + perfil admin

## Supabase Auth

- [ ] Configurar **Site URL** e **Redirect URLs** de produção
- [ ] Habilitar Google OAuth (se usado)
- [ ] Revisar confirmação de e-mail (recomendado: habilitada em produção)
- [ ] Templates de e-mail personalizados

## Variáveis de ambiente

- [ ] `VITE_SUPABASE_URL`
- [ ] `VITE_SUPABASE_PUBLISHABLE_KEY`
- [ ] Nunca expor `service_role` no frontend

## Build e qualidade

- [ ] `npm run build` sem erros
- [ ] `npm run lint` sem erros
- [ ] `npm run validate:full` passando com usuário autenticado

## Segurança RC1

- [ ] RLS ativo (migration 009)
- [ ] Perfis: admin, manager, cashier
- [ ] Rotas protegidas por autenticação + role
- [ ] RPCs `finalize_sale` e `register_stock_movement` com checagem de org/role
- [ ] Auditoria em `audit_logs`

## Backup

- [ ] Backups automáticos do Supabase habilitados (Pro plan)
- [ ] Procedimento de restore documentado em `BACKUP_RECOVERY.md`
- [ ] Export manual do schema versionado no repositório

## Deploy frontend

- [ ] Deploy em Vercel/Netlify/similar
- [ ] Variáveis configuradas no painel do host
- [ ] Teste manual: login → PDV → venda → dashboard

## Pós-deploy

- [ ] Criar usuário administrador inicial
- [ ] Convidar gerentes e caixas (via signup ou painel futuro)
- [ ] Monitorar logs e erros (Sentry recomendado)
