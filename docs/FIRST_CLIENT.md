# Primeiro Cliente — Guia de Uso Cosmo Business AI

Manual prático para configurar e operar o sistema no dia a dia.

---

## 1. Como configurar

### Primeiro acesso

1. Acesse a URL fornecida pela equipe Cosmo
2. Clique em **Cadastrar** e crie a conta admin
3. Complete o **Onboarding** (10 passos):
   - Dados da empresa
   - Contato
   - Mesas (opcional)
   - Categorias e produtos iniciais
   - Impressora / Desktop Agent
   - Kitchen Display
   - Cardápio digital + QR
   - Mobile

### Configurações essenciais

| Área | Caminho | O que fazer |
|------|---------|-------------|
| Produtos | `/produtos` | Cadastrar itens com preço e estoque |
| Product Builder | `/produtos/builder` | Montar composições com opções |
| Pedido Digital | `/configuracoes/pedido-digital` | Slug, tema, mesas, publicar cardápio |
| Cozinha | `/cozinha` | Validar fila de pedidos |
| Financeiro | `/financeiro` | Conferir lançamentos automáticos |

### Publicar loja digital

1. Vá em **Configurações → Pedido Digital**
2. Defina o **slug** (ex: `minha-loja` → URL `/menu/minha-loja`)
3. Configure tema e mensagem de boas-vindas
4. Clique em **Publicar cardápio**
5. Baixe ou imprima os **QR Codes** gerados

---

## 2. Como iniciar o dia

### Web (gerente/admin)

1. Login em `/login`
2. Verifique **Dashboard** — vendas e indicadores do dia
3. Abra **Centro de Operações** (`/operacoes`) para visão geral
4. Confira estoque baixo em **Estoque** se necessário

### PDV (caixa)

1. Login com perfil **cashier** ou **manager**
2. Acesse **PDV** (`/pdv`)
3. Mantenha aba **Cozinha** (`/cozinha`) em monitor secundário, se disponível

### Desktop Agent (impressão)

1. Inicie o aplicativo Cosmo Desktop no computador do caixa
2. Verifique status **online** nas configurações
3. Faça uma impressão de teste

---

## 3. Como vender (PDV)

1. Abra **PDV**
2. Toque nos produtos para adicionar ao carrinho
3. Ajuste quantidades e opções (Product Engine)
4. Selecione forma de pagamento
5. Clique em **Finalizar venda**

**O que acontece automaticamente:**

- Estoque é baixado
- Lançamento no **Financeiro**
- Ticket na **Cozinha**
- Impressão (se Desktop Agent ativo)
- Dashboard e Cosmo AI atualizam

---

## 4. Como usar a Cozinha (KDS)

Acesse **`/cozinha`** (tela dedicada, ideal para tablet/monitor na cozinha).

### Fluxo do pedido

```
Aguardando (pending) → Aceito → Preparando → Pronto → Entregue
```

### Ações

- **Aceitar** — confirma recebimento do pedido
- **Preparar** — inicia preparo
- **Pronto** — pedido finalizado na cozinha
- **Entregue** — entregue ao cliente/mesa

> A rota `/pedidos` redireciona para `/cozinha` (mesma funcionalidade).

---

## 5. Como usar o Mobile

1. Instale o app Cosmo Mobile (link fornecido na implantação)
2. Login com as mesmas credenciais
3. Perfis disponíveis conforme role:
   - **Admin/Manager**: Dashboard, operações
   - **Cashier**: PDV e cozinha

Use o mobile para acompanhar vendas e fila da cozinha fora do balcão.

---

## 6. Como usar QR Code (Pedido Digital)

### Para o cliente (sem login)

1. Escaneie o QR da mesa, retirada ou delivery
2. Navegue pelo cardápio
3. Adicione itens ao carrinho
4. Finalize com PIX ou pagamento configurado
5. Acompanhe em **Acompanhe seu pedido** (`/order-status/...`)

### Tipos de QR

| QR | Uso |
|----|-----|
| Mesa | Pedido na mesa (`dine_in`) |
| Retirada | Cliente busca no balcão |
| Delivery | Entrega (endereço no checkout) |
| Evento | Cardápio para eventos |

### Dicas operacionais

- **Publique o cardápio** após alterar produtos no Builder
- Mesas são configuradas em Pedido Digital → Mesas
- Pedido mínimo e taxa de entrega: mesma tela de configurações

---

## 7. Financeiro

Lançamentos são **automáticos**:

| Origem | Quando |
|--------|--------|
| PDV | Venda finalizada no caixa |
| Pedido Digital | Checkout público via QR |

Acesse **Financeiro** (`/financeiro`) para conferir receitas do dia.

---

## 8. Dashboard, Operações e Cosmo AI

| Tela | Função |
|------|--------|
| **Dashboard** | KPIs do dia — vendas, produtos, clientes |
| **Centro de Operações** | Visão operacional em tempo real |
| **Cosmo AI** | Insights e alertas para o gerente |

Atualizam automaticamente após vendas (Realtime + eventos).

---

## 9. Como atualizar

Updates são feitos pela equipe Cosmo. Quando houver nova versão:

1. Comunicação prévia da janela de manutenção
2. Atualização do site/app (automática ou reinstall desktop)
3. Validação rápida: PDV → venda teste → cozinha → financeiro

**Não** aplique migrations manualmente — apenas a equipe técnica.

---

## 10. Problemas comuns

| Problema | Solução |
|----------|---------|
| QR não abre loja | Publicar cardápio; verificar slug |
| Pedido QR não envia | Verificar estoque do produto |
| Cozinha vazia após venda | Contatar suporte (KDS) |
| Impressão não sai | Reiniciar Desktop Agent |
| Produto não aparece no QR | Publicar cardápio novamente |

**Suporte piloto:** canal definido no contrato de implantação.

---

## Referências

- [GO_LIVE.md](./GO_LIVE.md) — checklist técnico go-live
- [PILOT_CHECKLIST.md](./PILOT_CHECKLIST.md) — validação completa
- [ROUTES_KITCHEN.md](./ROUTES_KITCHEN.md) — cozinha vs pedidos
