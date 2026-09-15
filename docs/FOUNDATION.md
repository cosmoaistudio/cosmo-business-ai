# Cosmo Foundation

Guia curto para manter a organização enquanto o produto cresce.

- Relatório completo e notas: [`FOUNDATION_REPORT.md`](./FOUNDATION_REPORT.md)
- Arquitetura de domínio/EventBus: [`ARCHITECTURE.md`](./ARCHITECTURE.md)
- Prontidão piloto: [`GO_LIVE_V1_REPORT.md`](./GO_LIVE_V1_REPORT.md)

## Checklist para novo módulo

1. Criar pasta em `src/features/<nome>/` com `types`, `repository`, `service`, `hooks`, `components`.
2. Registrar rota + `AppRoute` permissions.
3. Publicar eventos de domínio no EventBus (não importar outra feature).
4. UI nova via Design System V2.
5. Datas/números via `src/lib/date` e `src/lib/format`.
6. Erros via `logger` + toast ao usuário.
7. Se houver cache (RQ), registrar keys em `queryKeys`.
8. Adicionar testes no domínio crítico antes de expandir.

## O que não fazer

- Não criar segundo EmptyState/Card/ThemeProvider.
- Não copiar tipos de remote-commands — usar `@cosmo/remote-commands` (web/mobile) e manter Electron sincronizado.
- Não carregar tabelas inteiras sem limite no client.
- Não alterar RPCs/policies em sprints de fundação sem necessidade de negócio.
