# Cosmo SaaS V1 — Arquitetura

Camada comercial do Cosmo: **pronta para estruturar clientes pagantes**.  
Não adiciona módulos operacionais. Não integra gateway. Não altera Auth/DB/RPC.

## Classificação

**Pronto para clientes pagantes? Não.**

Justificativa:
- Gateways (Stripe / Mercado Pago) estão só como adapters — sem checkout real.
- Limites não bloqueiam uso nos módulos (engine de avaliação, sem enforcement).
- Uso / billing ainda local (`localStorage`), sem tabelas de assinatura nem webhooks.
- Papéis Marketing/Financeiro são catálogo planejado — não entram no constraint do banco.
- Falta: contrato comercial, cobrança recorrente, portal do cliente, medidores server-side e trial enforcement.

**Sim para:** shell comercial, UX de plano/uso, onboarding checklist, ajuda, feedback, diagnóstico e settings separados.

## Menu (Sistema)

| Item | Rota |
|------|------|
| Meu Plano | `/meu-plano` |
| Configurações | `/configuracoes` |
| Pedido Digital | `/configuracoes/pedido-digital` (inalterado) |
| Central de Ajuda | `/ajuda` |
| Diagnóstico | `/diagnostico` |

## Estrutura

```
src/features/saas/
├── catalog/          # planos + papéis comerciais
├── services/
│   ├── limitsEngine.ts
│   ├── subscription.service.ts
│   ├── diagnostics.service.ts
│   ├── feedback.service.ts
│   ├── onboardingChecklist.service.ts
│   └── billing/      # stripe + mercadopago adapters
├── components/       # Meu Plano, Settings hub, Help, Diagnóstico, Feedback
├── providers/SaasProvider.tsx
└── styles/saas.css
```

## Planos

Starter · Professional · Business · Enterprise  
Preços e limites em `plans.catalog.ts`. Seleção local para demo de UX.

## Limites

`createLimitsEngine(planId).check(resource, used)`  
Recursos: produtos, usuários, lojas, pedidos, IA, automações, conteúdo, campanhas.

## Permissões (catálogo)

Administrador · Gerente · Caixa (**ativos** no auth)  
Marketing · Financeiro (**planejados** — sem mudança de DB)

## Assinatura

`BillingProviderAdapter` compartilhado por Stripe e Mercado Pago.  
`createCheckoutSession` retorna `not_configured` até chaves + backend.

## Onboarding checklist

Cadastro → Empresa → Produtos → PDV → Pedido Digital → Impressão → Primeiro pedido → Primeiro cliente.

## Feedback

Botão flutuante global: **Enviar sugestão** / **Reportar problema** (fila local).

## Diagnóstico

Internet · Supabase · Banco · Desktop Agent · Versão · Build.

## Configurações

Abas: Conta · Empresa · Equipe · Integrações · Assinatura · Sistema.

## Screenshots

- `docs/assets/cosmo-saas-v1-meu-plano.png`
- `docs/assets/cosmo-saas-v1-settings.png`
- `docs/assets/cosmo-saas-v1-diagnostico.png`
