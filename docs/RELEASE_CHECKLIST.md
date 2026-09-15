# Release Checklist — Primeiro Cliente Real

Checklist operacional para go-live assistido. Marque cada item antes de entregar ao cliente.

---

## 1. Infraestrutura Supabase

- [ ] Projeto Supabase produção criado (região adequada)
- [ ] Migrations **001 → 009** aplicadas (obrigatório)
- [ ] Migrations **010 → 021** aplicadas (opções, automação, audit, flags, remote commands, product engine)
- [ ] Migration **022** — aplicar **somente** se KDS TS estiver alinhado (ver `KNOWN_LIMITATIONS.md`)
- [ ] RLS habilitado: `select tablename, rowsecurity from pg_tables where schemaname = 'public'`
- [ ] Trigger `on_auth_user_created` / `handle_new_user` ativo
- [ ] Realtime habilitado para tabelas necessárias (`sales`, `kitchen_tickets`, `remote_commands`, `desktop_agents`)
- [ ] Backups automáticos habilitados (plano Pro recomendado)
- [ ] Storage bucket produtos — policies revisadas

---

## 2. Auth & usuários

- [ ] Site URL e Redirect URLs de produção configurados
- [ ] Confirmação de e-mail definida (recomendado: habilitada)
- [ ] Google OAuth configurado (se usado)
- [ ] Primeiro admin criado e perfil vinculado à org correta
- [ ] Roles testados: admin → `/`, manager → `/`, cashier → `/pdv`
- [ ] Caixa **não** acessa `/financeiro`, `/configuracoes`, `/produtos`

---

## 3. Variáveis de ambiente

- [ ] `VITE_SUPABASE_URL` (web)
- [ ] `VITE_SUPABASE_PUBLISHABLE_KEY` (web — anon/publishable only)
- [ ] `.env` **não** commitado
- [ ] Service role **apenas** em edge functions/backend — nunca no Vite
- [ ] Desktop: `.env.desktop` conforme `.env.desktop.example`
- [ ] Mobile: variáveis Expo configuradas

---

## 4. Build & qualidade

- [ ] `npm run typecheck` ✅
- [ ] `npm run lint` ✅
- [ ] `npm run build` ✅
- [ ] `npm run test` ✅ (109 testes)
- [ ] `npm run validate:full` com credenciais staging (recomendado)

---

## 5. Fluxo do primeiro cliente (smoke test)

Execute na ordem no ambiente de staging/produção:

- [ ] **Cadastro** — novo usuário cria org + perfil admin
- [ ] **Onboarding** — `/onboarding` — empresa, categorias, 1+ produto
- [ ] **Produtos** — produto visível em `/produtos` e estoque
- [ ] **Product Builder** — editar produto com opções (se aplicável)
- [ ] **PDV** — venda completa com pagamento
- [ ] **Pedido** — registro em `sales` confirmado
- [ ] **Kitchen** — ticket visível em `/cozinha` (se 022 + TS OK)
- [ ] **Impressão** — desktop agent recebe comando (se desktop instalado)
- [ ] **Dashboard** — receita/venda refletida
- [ ] **IA** — `/ia` gera insights após venda
- [ ] **Histórico** — venda em lista recente; log automação se regra ativa

---

## 6. Superfícies por produto

### Desktop
- [ ] Electron build gerado (`npm run pack:desktop` ou pipeline)
- [ ] Agente registra em `desktop_agents`
- [ ] Impressora testada (recibo + comanda)
- [ ] Gaveta (se usada) testada
- [ ] Auto-update configurado (se produção)

### Mobile
- [ ] App instalado em dispositivo teste
- [ ] Login com mesma org
- [ ] Command center envia comando ao desktop
- [ ] Push notifications (se configurado)

### PDV
- [ ] Caixa consegue vender sem acesso admin
- [ ] Composição/opções funcionando
- [ ] Desconto e observação (se usados)
- [ ] Cliente vinculado opcional

### KDS
- [ ] Tela `/cozinha` em monitor dedicado
- [ ] Som de novo pedido (config local)
- [ ] Fluxo: novo → preparando → pronto → entregue
- [ ] **Bloqueador conhecido:** ver `KNOWN_LIMITATIONS.md` se 022 aplicada

### QR Code / Pedido Digital
- [ ] Slug definido em `/configuracoes/pedido-digital` ou onboarding etapa 8
- [ ] QR impresso/testado no **mesmo ambiente** que publicou
- [ ] Menu público carrega (`/menu/:slug`)
- [ ] **Limitação:** checkout anônimo pode falhar — documentar para cliente

### Automation
- [ ] Pelo menos 1 regra ativa (ex.: estoque baixo → notificação)
- [ ] Logs visíveis em `/automacoes`
- [ ] Falhas monitoradas

### AI (`/ia`)
- [ ] Painel carrega sem erro
- [ ] Insights após operação (estoque, vendas)
- [ ] Widget flutuante no layout (admin/manager)

### Dashboard
- [ ] Welcome dashboard / marcos visíveis para org nova
- [ ] Métricas coerentes após vendas teste

### Operation Center (`/operacoes`)
- [ ] Mapa operacional com cores
- [ ] Conectividade desktop (se agent online)
- [ ] Alert center populado após cenários de teste

---

## 7. Segurança pré-go-live

- [ ] RLS testado: usuário org A não vê dados org B
- [ ] Anon sem JWT não insere em tabelas protegidas
- [ ] RPC `finalize_sale` funciona como cashier
- [ ] RPC `register_stock_movement` **falha** como cashier
- [ ] CSP / security headers no host de deploy
- [ ] HTTPS em produção

---

## 8. Monitoramento & suporte

- [ ] Sentry ou equivalente (recomendado)
- [ ] Contato de suporte definido para o cliente
- [ ] `docs/BACKUP_RECOVERY.md` lido pela equipe
- [ ] Procedimento rollback migration documentado

---

## 9. Entrega ao cliente

- [ ] Credenciais admin entregues de forma segura
- [ ] Treinamento: PDV + produtos + cozinha (30–60 min)
- [ ] `KNOWN_LIMITATIONS.md` compartilhado (versão cliente se necessário)
- [ ] Data go-live e janela de suporte acordadas

---

## 10. Pós go-live (primeiras 72h)

- [ ] Confirmar primeira venda real no dashboard
- [ ] Verificar impressão/comanda em produção
- [ ] Revisar logs automação e erros Supabase
- [ ] Coletar feedback UX (cliques, telas confusas)
- [ ] Registrar issues para sprint de hardening

---

## Comandos rápidos

```bash
npm run typecheck
npm run lint
npm run build
npm run test
npm run validate:full   # requer .env + Supabase
```

## Referências

- `docs/PRODUCTION_READINESS.md` — notas e auditoria completa
- `docs/KNOWN_LIMITATIONS.md` — limitações para alinhar expectativa
- `docs/SECURITY_AUDIT.md` — controles RC1
- `docs/DEPLOY_CHECKLIST.md` — deploy base RC1
