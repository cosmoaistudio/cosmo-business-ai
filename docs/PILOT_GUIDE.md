# Guia Operacional — Piloto Cosmo Business AI

Documento para implantação do primeiro cliente piloto.

## 1. Instalação

### Pré-requisitos

- Node.js 20+
- Conta Supabase (projeto dedicado ao piloto)
- Navegador Chromium ou Electron Desktop

### Web

```bash
git clone <repo>
cd cosmo-business-ai
npm install
cp .env.example .env   # VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY
npm run build
npm run preview        # ou deploy estático (Vercel/Netlify)
```

### Desktop Agent

```bash
npm run build
npm run desktop        # produção local
# ou
npm run pack:desktop   # instalador Windows
```

### Mobile (opcional)

```bash
cd apps/mobile
npm install
npm run start
```

---

## 2. Supabase

### Migrations obrigatórias (ordem)

Aplicar todas em `database/migrations/` até **024_fix_kitchen_items_and_public_checkout.sql**:

```bash
# Via Supabase CLI ou SQL Editor — em ordem numérica
001 → … → 022 → 023
```

### Variáveis

| Variável | Uso |
|----------|-----|
| `VITE_SUPABASE_URL` | Frontend |
| `VITE_SUPABASE_ANON_KEY` | Frontend (única chave exposta) |

**Nunca** embutir `service_role` no frontend. Checkout público usa RPCs `place_public_digital_order` e `get_public_digital_store` (migration 023).

### Pós-migration

1. Criar usuário admin via Signup no app
2. Completar onboarding
3. Publicar cardápio digital em **Configurações → Pedido Digital**
4. Validar QR Code em dispositivo sem login

---

## 3. Desktop

- Instalar o agente no PDV/caixa
- Verificar impressão de teste (Settings ou PDV)
- Manter agente online para fila de impressão remota

---

## 4. Mobile

- Conectar com mesmas credenciais Supabase
- Validar dashboard e notificações operacionais
- Cashier: acesso PDV + Cozinha (`/cozinha`)

---

## 5. Backup

- **Supabase**: ativar backups diários no plano Pro (recomendado para piloto)
- **Export manual**: Dashboard Supabase → Database → Backups
- **Cardápio publicado**: persistido em `digital_stores.catalog_snapshot`
- Ver também `docs/BACKUP_RECOVERY.md`

---

## 6. Atualização

1. Backup do banco
2. Aplicar novas migrations
3. `npm run build` + redeploy web/desktop
4. Smoke test (ver `docs/PILOT_CHECKLIST.md`)

---

## 7. Recuperação

| Cenário | Ação |
|---------|------|
| Migration falhou | Restaurar backup; corrigir SQL; reaplicar |
| Loja digital não aparece | Verificar `published_at` e migration 023 |
| Checkout público 403 | Confirmar grants `anon` nas RPCs 023 |
| KDS vazio | Verificar migration 022 + trigger pós-venda |
| Financeiro sem lançamento | Verificar `financial_transactions` após venda PDV/digital |

---

## 8. Monitoramento

- **Supabase Dashboard**: Auth, Database, Realtime connections
- **Logs SQL**: erros em RPCs `finalize_sale`, `place_public_digital_order`
- **Centro de Operações**: indicador Realtime conectado
- **Desktop Agent**: fila de impressão e comandos remotos

---

## 9. Fluxo piloto recomendado

```
Signup → Onboarding → Produtos → Product Builder → PDV → Venda
  → Cozinha → Desktop → Dashboard → Operações → Cosmo AI
  → Pedido Digital (QR) → Checkout → Histórico
```

---

## 10. Contatos e escalação

- Problemas de schema: revisar migrations 022/023
- Problemas de auth/RLS: migration 009
- Limitações conhecidas: `docs/KNOWN_LIMITATIONS.md`
