# Go-Live — Cosmo Business AI (Primeiro Cliente Piloto)

Documento operacional para liberação em produção assistida.

---

## 1. Checklist pré go-live

### Infraestrutura

- [ ] Migrations **001 → 025** aplicadas no Supabase de produção
- [ ] Backup manual antes do deploy
- [ ] `.env` de produção com `VITE_SUPABASE_URL` e `VITE_SUPABASE_PUBLISHABLE_KEY`
- [ ] **Service role** apenas no servidor/CI — nunca no frontend
- [ ] Confirmação de e-mail desabilitada ou SMTP configurado (piloto)

### Validação automatizada

```bash
npm run validate:kitchen   # Migration 022 — KDS
npm run validate:pilot     # Smoke test completo (022 + 023 + 024)
npm run validate:full      # RC1 PDV + financeiro
npm run build
npm run typecheck
npm run lint
npm test
```

### Funcional

- [ ] Signup + onboarding concluído
- [ ] Produtos ativos com estoque
- [ ] Product Builder validado
- [ ] PDV finaliza venda
- [ ] Cozinha (`/cozinha`) recebe tickets
- [ ] Pedido Digital publicado + QR testado
- [ ] Checkout público sem login
- [ ] Financeiro registra PDV e digital
- [ ] Dashboard e Centro de Operações atualizam
- [ ] Desktop Agent instalado (se impressão local)
- [ ] Mobile conectado (se aplicável)

Ver também: [PILOT_CHECKLIST.md](./PILOT_CHECKLIST.md)

---

## 2. Backup

### Antes do go-live

1. **Supabase Dashboard** → Database → Backups → criar snapshot manual
2. Exportar SQL das tabelas críticas (opcional):
   - `organizations`, `profiles`, `products`, `digital_stores`
3. Guardar `.env` e credenciais admin em cofre seguro

### Rotina recomendada (piloto)

| Frequência | Ação |
|------------|------|
| Diária | Verificar backup automático Supabase |
| Semanal | Export manual de `digital_stores.catalog_snapshot` |
| Pré-update | Snapshot + tag git do release |

Detalhes: [BACKUP_RECOVERY.md](./BACKUP_RECOVERY.md)

---

## 3. Rollback

### Aplicação (web/desktop)

1. Reverter deploy para tag/commit anterior
2. `npm run build` do release estável
3. Redistribuir instalador desktop se necessário

### Banco de dados

| Cenário | Ação |
|---------|------|
| Migration com erro | Restaurar backup Supabase **antes** de reaplicar SQL corrigido |
| Migration 023 parcial | Executar DROP das tabelas `digital_stores`, `digital_store_tables` e RPCs 023; restaurar backup |
| Migration 022 parcial | **Não** dropar em produção sem backup — restaurar snapshot |

### RPC / checkout público

Se checkout público falhar após deploy 023:

- PDV autenticado continua via `finalize_sale`
- Despublicar loja (`published_at = null`) até correção
- Rollback de frontend não exige rollback de 023 se RPCs permanecem compatíveis

---

## 4. Atualização

### Procedimento padrão

```
1. Comunicar janela ao cliente (15–30 min)
2. Backup Supabase
3. Aplicar novas migrations (SQL Editor ou CLI)
4. npm run validate:kitchen && npm run validate:pilot
5. Deploy web + desktop
6. Smoke test manual (5 min)
7. Monitorar logs 24h
```

### Ordem de migrations

Sempre numérica: `001`, `002`, … `022`, `023`, `024`.

Nunca pular versões.

---

## 5. Monitoramento

### Supabase Dashboard

- **Auth**: logins falhos, sessões ativas
- **Database**: queries lentas, erros RPC
- **Realtime**: conexões ativas (KDS, Operation Center)
- **Logs**: `finalize_sale`, `place_public_digital_order`

### Aplicação

| Módulo | O que observar |
|--------|----------------|
| PDV | Erros ao finalizar venda |
| Cozinha | Tickets não aparecem pós-venda |
| Pedido Digital | QR retorna loja não encontrada |
| Financeiro | Lançamentos ausentes |
| Desktop Agent | Fila de impressão parada |

### Alertas manuais (piloto)

- Venda concluída sem ticket KDS → verificar migration 022
- Checkout QR com erro 403/42883 → verificar migration 023 e grants `anon`
- Dashboard zerado → RLS ou org_id incorreto

---

## 6. Suporte

### Níveis

| Nível | Escopo | SLA piloto |
|-------|--------|------------|
| L1 | Operador (PDV, cozinha, QR) | Imediato in-loco |
| L2 | Admin (config, produtos, publicação) | 4h úteis |
| L3 | Engenharia (migrations, bugs) | 24h úteis |

### Informações para escalação

Incluir sempre:

- Horário do incidente
- Usuário/role (admin, cashier)
- Passo do fluxo (PDV, QR, cozinha)
- Mensagem de erro exata
- `sale_id` ou `sale_number` se aplicável
- Screenshot do Supabase Logs (RPC)

### Documentos relacionados

- [FIRST_CLIENT.md](./FIRST_CLIENT.md) — guia do cliente
- [PILOT_GUIDE.md](./PILOT_GUIDE.md) — instalação técnica
- [KNOWN_LIMITATIONS.md](./KNOWN_LIMITATIONS.md) — limitações conhecidas

---

## 7. Critérios de go / no-go

| Critério | Go | No-go |
|----------|-----|-------|
| `validate:pilot` | ✅ Passou | ❌ Falhou |
| Migrations 022–024 | Aplicadas | Pendentes |
| Backup | Confirmado | Ausente |
| Treinamento cliente | Realizado | Não realizado |

**Classificação recomendada após checklist:** Piloto assistido → Produção plena.
