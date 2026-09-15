# Known Limitations — Cosmo Business AI

Limitações conhecidas na consolidação pré-primeiro-cliente. Use este documento para alinhar expectativas com operadores e suporte.

---

## Plataforma geral

- **Multi-tenant** depende da migration 009 aplicada. Sem ela, não há isolamento por organização.
- **Convite de usuários** na mesma empresa não existe: cada signup cria uma organização nova.
- **Feature flags** existem no banco (019) mas não controlam módulos na interface.
- **Idioma:** interface em português (BR); sem i18n.

---

## Pedido Digital / QR Code

- Configuração da loja (slug, mesas, tema, pagamento) persiste em **localStorage do navegador** que configurou.
- QR Codes e links públicos **só funcionam no mesmo domínio/browser** que publicou, até existir backend de loja.
- **Checkout público** exige usuário autenticado no Supabase — clientes anônimos não finalizam pedido hoje.
- Pagamento online (PIX/cartão/gateway) é **stub** — sem cobrança real.
- Catálogo público usa snapshot local quando não há sessão autenticada.

**Workaround piloto:** operador logado publica loja no mesmo PC que exibe QR; ou usar PDV/counter para pedidos.

---

## Kitchen Display (KDS)

- Migration **022** usa status `pending`, coluna `ticket_type`, `notes`, tabela `kitchen_ticket_items`.
- TypeScript KDS ainda usa `new`, `service_type`, `observation` e lê itens de `sale_items`.
- Com 022 aplicada **sem alinhar TS**, tickets do trigger ficam invisíveis ou não avançam de status.
- Configurações KDS (som, refresh) são **localStorage** por browser.

**Workaround piloto:** não aplicar 022 até alinhar TS; ou usar operation center para monitorar fila.

---

## Onboarding

- Progresso salvo em **localStorage** (`cosmo:onboarding:{orgId}`).
- Outro administrador ou outro dispositivo **não vê** o mesmo progresso automaticamente.
- Criação de produtos na etapa 5 é best-effort — falhas individuais não bloqueiam o wizard.

---

## Cosmo AI Manager

- Insights são **rule-based** — não há LLM conectado (stubs prontos para integração futura).
- Resolver/ignorar insight persiste só em localStorage.
- Previsão climática para marketing usa heurística sazonal, não API de tempo real.

---

## Financeiro

- Receitas do PDV **não** entram automaticamente em `financial_transactions`.
- Lucro no dashboard mistura transações manuais + vendas agregadas de `sales`.
- Configure regra de automação `CREATE_FINANCIAL_ENTRY` ou lançamento manual.

---

## Desktop & Mobile

- **Desktop Agent** requer app Electron instalado, `.env` configurado e migration **020** (`desktop_agents`, `remote_commands`).
- Impressora depende de driver/modelo configurado no agente — falha de impressão **não cancela** a venda.
- **Mobile** é app Expo separado — pareamento usa código UX no onboarding, sem validação server-side ainda.
- Heartbeat desktop: se agente offline, comandos ficam na fila `remote_commands`.

---

## Operation Center

- Métricas de cozinha/desktop vazias se tabelas 020/022 não existirem (degradação graciosa).
- Modo TV/Gerente/Operacional disponível; requer dados reais para mapa operacional útil.

---

## Performance

- Bundle web principal **> 500 KB** minificado — first load pode ser lento em conexões fracas.
- Operation Center e Cosmo AI fazem **refresh a cada 15–30 segundos** por aba aberta.
- Dashboard carrega histórico de vendas completadas sem paginação.

---

## Segurança & compliance

- Sem CSP/headers de segurança no código — configurar no host (Vercel/Netlify/etc.).
- Rate limiting depende do Supabase Auth.
- Logs de auditoria existem; UI de consulta audit limitada.
- **Nunca** commitar `.env` ou service role key.

---

## Testes

- **109 testes** automatizados cobrem product-engine, PDV, desktop, automação, builder.
- **Sem testes** dedicados para: KDS, digital ordering, onboarding, cosmo-ai, operation-center.
- `validate:full` requer Supabase live + credenciais em `.env`.

---

## Migrations pendentes (verificar no Supabase)

| Migration | Conteúdo |
|-----------|----------|
| 010–015 | Imagens, opções, sale_item_options |
| 016–017 | Automação |
| 018 | Audit logs |
| 019 | Feature flags |
| 020 | Remote commands + desktop |
| 021 | Product Engine enterprise |
| 022 | Kitchen Display |

Ordem: aplicar sequencialmente; **022 só após alinhar KDS TS** ou aceitar limitação acima.
