# Configuração do Desktop Agent

Guia para habilitar o **Desktop Agent** no Cosmo Desktop (Electron).  
Sem este arquivo, o Cosmo **continua funcionando** em modo local — PDV, interface e impressora operam normalmente.

## Modo local vs. agente remoto

| Recurso | Modo local (sem `.env.desktop`) | Com Desktop Agent |
|---------|----------------------------------|-------------------|
| Interface web / PDV | ✅ | ✅ |
| Impressora local | ✅ | ✅ |
| Controle remoto | ❌ | ✅ |
| Realtime / sync avançado | ❌ | ✅ |

Ao iniciar sem configuração, o Cosmo exibe **"Modo local ativo"** — não é um erro, é o comportamento esperado.

## Setup em 3 passos

```bash
# Na raiz do projeto cosmo-business-ai
cp .env.desktop.example .env.desktop
```

Edite `.env.desktop` e preencha:

| Variável | Obrigatória | Descrição |
|----------|-------------|-----------|
| `COSMO_SUPABASE_URL` | Sim | URL do projeto Supabase |
| `COSMO_SUPABASE_SERVICE_ROLE_KEY` | Sim | Service Role Key (**somente Main process**) |
| `COSMO_ORGANIZATION_ID` | Sim | UUID da organização |
| `COSMO_AGENT_NAME` | Sim | Nome deste terminal (ex: `PDV Loja 1`) |
| `COSMO_AGENT_ID` | Não | UUID do agente; deixe vazio na 1ª execução |

Reinicie o Cosmo Desktop:

```bash
npm run desktop
```

## Segurança

- `.env.desktop` está no `.gitignore` — **nunca commitar**
- Use `.env.desktop.example` como template (sem valores reais)
- **Nunca** coloque a Service Role Key no `.env` do Vite/React

## Documentação relacionada

- [apps/desktop/README.md](../apps/desktop/README.md) — visão geral
- [apps/desktop/electron/DESKTOP_ARCHITECTURE.md](../apps/desktop/electron/DESKTOP_ARCHITECTURE.md) — arquitetura
