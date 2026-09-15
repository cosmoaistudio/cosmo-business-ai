# Go Live V1 — Relatório de Prontidão

Data: 2026-08-07  
Escopo: UX / usabilidade / fluxos aparentes (sem alteração de Supabase, banco, RPC, Electron, autenticação ou regras de negócio).

## Classificação final

**Pronto para piloto**

Adequado para o primeiro cliente piloto operando PDV, catálogo, cozinha, financeiro, clientes e pedido digital.  
Ainda não classificado como “pronto para produção” em escala (chat IA, equipe multi-usuário avançada e alguns polish restantes).

---

## 1. Problemas encontrados

### P0 (bloqueadores de confiança)
- Pesquisa global do header sem ação (apenas foco Ctrl+K)
- Notificações com badge permanente e sem clique
- Chat da tela Cosmo AI falso (`readOnly` + botão sem ação)
- Menu **Pedidos** redirecionava silenciosamente para Cozinha
- Label **Categorias** apontava para Grupos de Opções
- Configurações com cards claros em tema escuro + “em breve” sem contexto
- Índice de saúde da IA com fallback falso `72%`
- Empty states / headers com contraste inadequado no tema escuro
- Card flutuante de IA já removido em sprints anteriores; chat ainda confundia

### P1
- Itens de Opções fora da sidebar
- Badge RC1 pouco claro para cliente
- Empty de vendas sem CTA
- PDV/estoque com loading textual fraco
- Página Settings incompleta para “equipe/perfil”

### P2
- Design Preview ainda acessível por URL admin
- Mobile Command Center com IDs dummy (fora do escopo web desta sprint)
- Skeleton incompleto em algumas telas públicas digitais

---

## 2. Problemas corrigidos

| Item | Correção |
|------|----------|
| Pesquisa global | Command palette funcional (Ctrl+K) com navegação por módulos |
| Notificações | Menu real com alertas/prioridades da IA ou empty state |
| Chat IA | Removido; badge **Em breve** + explicação |
| Pedidos | Hub `/pedidos` com próximos passos (Cozinha / PDV / Digital) |
| Sidebar | Labels corretos; Itens de Opções; Pedido Digital; badge **Piloto** |
| Settings | Cards no tema escuro + CTA claros + “Em breve” honesto |
| Drawer IA | Sem % inventado; status “Analisando/Aguardando” |
| Dashboard vendas | Empty premium + botão “Criar primeira venda” |
| PageHeader / EmptyState | Tipografia legível no tema escuro |
| PDV grid / estoque | Skeletons e empty states mais claros |
| Produtos filtrados | Mensagem distinta para busca vazia vs catálogo vazio |

---

## 3. Melhorias aplicadas

- Experiência de “próximo passo” em Pedidos e Dashboard
- Header deixa de mentir (search/notifications/status com copy realista web vs desktop)
- IA posicionada como gerente operacional (drawer + painel), não chat
- Navegação alinhada ao que o cliente realmente encontra
- Empty/error/loading mais consistentes nos pontos críticos do piloto

---

## 4. Fluxos revisados

| Fluxo | Status |
|-------|--------|
| Login / Cadastro | OK (sem alteração de auth) |
| Dashboard | OK + empty de vendas |
| Produtos / Opções / Builder | OK |
| PDV → Financeiro → Cozinha | OK (regras intactas) |
| Pedidos (hub) → Cozinha | OK |
| Clientes / Estoque / Financeiro | OK |
| Configurações / Pedido Digital / QR | OK |
| Cosmo AI Drawer (fechado por padrão) | OK |
| Desktop / Mobile | Parcial (capacidades dependem do ambiente) |

---

## 5. Funcionalidades ainda pendentes

- Chat conversacional Cosmo AI (marcado Em breve)
- Gestão avançada de equipe/perfil em Configurações
- Relatórios dedicados (não há rota própria)
- Notificações push web dedicadas (hoje baseadas em insights IA)
- Skeletons em 100% das páginas públicas digitais
- Remoção/ocultação definitiva do Design Preview em builds de piloto
- Harden do Command Center mobile (`configure-no-mobile`)

---

## 6. Classificação

| Nível | Resultado |
|-------|-----------|
| Não pronto | Não |
| **Pronto para piloto** | **Sim** |
| Pronto para produção | Não ainda |

### Critério do piloto
O cliente consegue operar o dia a dia sem encontrar botões mortos no header, menus enganosos ou chat falso. Fluxos centrais (vender, cozinhar, financeiro, digital) estão utilizáveis.

### Critério de produção
Exige equipe/perfil, chat/IA conversacional (ou remoção permanente da expectativa), cobertura total de empty/skeleton e hardening mobile/desktop.
