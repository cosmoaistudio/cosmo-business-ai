# Checklist Final — Piloto Cosmo Business AI

Marque cada item antes de go-live com o cliente piloto.

## Infraestrutura

- [ ] Migrations 001–023 aplicadas no Supabase
- [ ] `.env` configurado (somente anon key no frontend)
- [ ] Backups Supabase habilitados
- [ ] `npm run build` sem erros
- [ ] `npm run lint` sem erros
- [ ] `npm run typecheck` sem erros
- [ ] `npm test` passando

---

## Desktop

- [ ] Instalador/agente instalado no PDV
- [ ] Impressão de teste OK
- [ ] Agente reconecta após reinício

---

## Mobile

- [ ] Login com perfil correto (admin/manager/cashier)
- [ ] Dashboard carrega métricas
- [ ] Permissões por role validadas

---

## PDV

- [ ] Cadastro de produtos ativos com estoque
- [ ] Venda com opções (Product Engine)
- [ ] Finalizar venda (cash/pix/cartão)
- [ ] Estoque decrementado
- [ ] Lançamento financeiro gerado

---

## Product Engine

- [ ] Builder salva composição
- [ ] Produto ativo aparece no PDV
- [ ] Opções com controle de estoque funcionam

---

## Kitchen (KDS)

- [ ] Ticket criado automaticamente após venda
- [ ] Status: pending → accepted → preparing → ready → delivered
- [ ] Schema migration 022 (sem campos legados)
- [ ] Rota `/cozinha` operacional
- [ ] `/pedidos` redireciona para `/cozinha`

---

## QR Code / Pedido Digital

- [ ] Loja publicada em Supabase (`digital_stores`)
- [ ] Slug único configurado
- [ ] Mesas persistidas (`digital_store_tables`)
- [ ] QR Codes gerados e testados
- [ ] Cardápio público carrega sem login
- [ ] Checkout público via RPC (sem auth)
- [ ] Acompanhamento de pedido (`/order-status/:id`)

---

## Dashboard

- [ ] Métricas do dia atualizam após venda
- [ ] Sem polling excessivo (eventos + Realtime)

---

## Operation Center

- [ ] Overview carrega setores
- [ ] Realtime kitchen/sales conectado
- [ ] Timeline recebe eventos live

---

## Automation

- [ ] Regra de teste dispara em venda
- [ ] Logs visíveis em Automações

---

## Cosmo AI

- [ ] Painel carrega insights
- [ ] Atualiza após venda (event bus, sem polling 30s)
- [ ] Insights de cozinha usam status `pending` (022)

---

## Financeiro

- [ ] Venda PDV gera `financial_transactions` (source: pdv)
- [ ] Pedido digital gera lançamento (source: digital_ordering)
- [ ] Dashboard reflete receita

---

## Digital Ordering

- [ ] Configurações salvas no Supabase (não localStorage como fonte)
- [ ] Tema aplicado na loja pública
- [ ] localStorage apenas cache offline

---

## Smoke test E2E

- [ ] Signup
- [ ] Onboarding completo
- [ ] Produtos + Builder
- [ ] PDV → venda
- [ ] Cozinha recebe ticket
- [ ] Desktop imprime (se configurado)
- [ ] Dashboard atualizado
- [ ] Operation Center
- [ ] Cosmo AI
- [ ] QR → pedido → checkout → histórico

---

## Assinatura go-live

| Campo | Valor |
|-------|-------|
| Cliente piloto | |
| Data | |
| Responsável técnico | |
| Migrations versão | 023 |
| Nota prontidão | /100 |
| Aprovado | ☐ Sim ☐ Ajustes necessários |
