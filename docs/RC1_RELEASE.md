# Cosmo Business — RC1 Release

**Versão:** `1.0.0-rc.1`  
**Produto:** Cosmo Business  
**Data:** 2026-08-07

## Artefatos

Comando de geração:

```bash
npm run build
npx electron-builder --config apps/desktop/electron/electron-builder.yml
```

(Em ambientes com lock em `release/desktop`, o pack pode usar pasta temp e copiar os `.exe` para `release/desktop`.)

| Artefato | Caminho |
|----------|---------|
| Installer (NSIS) | `release/desktop/CosmoBusiness-1.0.0-rc.1-Setup.exe` |
| Portable | `release/desktop/CosmoBusiness-1.0.0-rc.1-Portable.exe` |
| Pasta release | `release/desktop/` |

Splash: `apps/desktop/electron/assets/splash.html`  
Ícone: `apps/desktop/electron/assets/icon.png`  
Auto-update: `electron-updater` + GitHub Releases (`cosmoaistudio/cosmo-business-ai`). Ver `docs/DESKTOP_UPDATES.md`.

## O que a RC1 inclui

- Installer + Portable (electron-builder)
- Wizard de primeira execução (Empresa → Tipo de negócio → Hardware)
- Print Manager (detecção Windows, ESC/POS, papéis Caixa/Cozinha/Delivery)
- Scale Manager (arquitetura de drivers; protocolos proprietários **não inventados**)
- Diagnóstico de hardware via Desktop Agent
- UI: Configurações → Hardware (`/configuracoes/hardware`)

## Veredito RC1

**RC1 reprovada para “loja 100% operacional com balança física”.**

**RC1 aprovada parcialmente para instalação desktop + Print Manager + arquitetura Scale.**

### Justificativa

| Critério | Status |
|----------|--------|
| Windows Installer (.exe) | ✔ Gerado |
| Portable (.exe) | ✔ Gerado |
| Electron + splash + ícone + auto-update preparado | ✔ |
| Desktop Agent (processo main / standby local) | ✔ |
| Print Manager + ESC/POS + detecção Windows | ✔ (requer impressora/driver real no SO) |
| Impressão “funcionando” no CI sem hardware | ⚠ Não validável sem equipamento físico |
| Scale Manager extensível | ✔ Arquitetura |
| Leitura de peso Toledo/Prix/etc. | ✖ Protocolos proprietários **não inventados** |
| Venda por peso no PDV | ✔ Hook arquitetural (`useWeightSale`); sem fake weight |
| Wizard primeira execução | ✔ |

**Não declarar “balanças funcionando / leitura peso funcionando” até driver real + teste físico.**

## Comandos

```bash
npm run typecheck
npx oxlint src/features/hardware apps/desktop/electron/src
npm run build
npm run pack:desktop
node scripts/validate-rc1-smoke.mjs
```

## Limitações honestas

1. **Balanças:** drivers Toledo/Prix/Filizola/Urano/Elgin/Generic estão estruturados, mas `protocolImplemented: false` até documentação/SDK oficial + (opcional) `serialport` nativo.
2. **Daruma:** preset ESC/POS genérico — não inclui SDK Daruma.
3. **Leitura de peso / venda por peso:** arquitetura + hook `useWeightSale`; leitura real falha com erro claro até protocol drivers.
4. **Impressão:** funciona com spooler Windows e/ou TCP 9100 ESC/POS quando hardware/driver do SO está correto — não há simulação falsa de sucesso.
5. **Auto-update:** preparado; CDN de updates precisa dos artefatos publicados.
