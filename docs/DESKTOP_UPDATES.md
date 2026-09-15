# Atualização remota — Cosmo Business AI Desktop

O Desktop usa **electron-updater** com provider **GitHub Releases**.
Não há um segundo updater. O renderer não fala com o GitHub nem com electron-updater.

Repositório:

`cosmoaistudio/cosmo-business-ai`

Tags:

```
v1.0.0-rc.1
v1.0.0-rc.2
v1.0.0
v1.0.1
```

## Como o updater encontra as Releases

O instalador empacota `app-update.yml` com:

- `provider: github`
- `owner: cosmoaistudio`
- `repo: cosmo-business-ai`

No Main, `autoUpdater.setFeedURL` usa a mesma configuração **sem token**.
O app consulta a API pública de Releases. Repositório precisa permanecer público.

Enquanto a versão instalada for prerelease (`1.0.0-rc.x`):

- `autoUpdater.allowPrerelease = true`
- o updater considera Releases marcadas como prerelease (`v1.0.0-rc.2`, …)

Versão estável (`1.0.0`) não aceita prerelease. `allowDowngrade` fica `false`.

`COSMO_UPDATE_SERVER_URL` é override **somente local** (generic HTTP). Não é o destino de produção.

## Artefatos gerados por `npm run pack:desktop`

O pack **não publica** no GitHub (`--publish never`). Ele gera em `release/desktop/`:

- `Cosmo.Business.AI.Setup.exe` — instalador NSIS
- `Cosmo.Business.AI.Setup.exe.blockmap`
- `Cosmo.Business.AI.Portable.exe` — não é o fluxo da loja
- `latest.yml` — manifesto oficial do provider GitHub (produzido pelo electron-builder; não editar SHA512)

No cliente, o electron-updater (versão prerelease) tenta `rc.yml` na Release e, se não achar, usa `latest.yml`.
Por isso o próximo publish deve anexar o `latest.yml` gerado neste pack.

Não renomeie os arquivos. Não escreva SHA512 à mão. Não reescreva a Release `v1.0.0-rc.1`.

A Release `v1.0.0-rc.1` já publicada **não deve ser apagada nem reescrita**.

## Versionamento

A versão vem de `package.json` → `app.getVersion()`.

```bash
# RC  1.0.0-rc.1 → 1.0.0-rc.2
npm version prerelease --preid=rc --no-git-tag-version
npm run pack:desktop

# estável  1.0.0-rc.x → 1.0.0  (quando for a hora)
npm version 1.0.0 --no-git-tag-version
npm run pack:desktop

# patch  1.0.0 → 1.0.1
npm version patch --no-git-tag-version
npm run pack:desktop

# minor  1.0.0 → 1.1.0
npm version minor --no-git-tag-version
npm run pack:desktop
```

## Como publicar uma atualização (manual)

1. Subir a versão (comandos acima). **Não** rode o bump sem decisão explícita.
2. `npm run pack:desktop`
3. Criar a GitHub Release com tag `v` + versão (`v1.0.0-rc.2`).
   - RC: marcar como **prerelease**
   - estável: Release normal
4. Anexar Setup.exe, blockmap e o yml gerado neste pack.
5. Nas lojas, o app já instalado com o provider GitHub verifica ~20 s após ficar utilizável e a cada 6 h.

Não use `GH_TOKEN` no aplicativo. Token só no processo de publish (quando você fornecer), nunca no instalador.

## Onde ver no app

Configurações abre na aba **Atualizações**.

Lá aparecem versão instalada, canal, GitHub Releases, status, última verificação e o botão **Verificar agora**.

---

## Segurança na loja

- Download e instalação **não** são automáticos.
- Carrinho PDV, checkout, carrinho digital e pedido em confirmação bloqueiam “Atualizar agora”.
- “Atualizar ao fechar” continua permitido.

## Teste real (rc.1 → rc.2)

A. Loja / máquina de teste com **1.0.0-rc.1** (este pack, provider GitHub).
B. Depois: `npm version prerelease --preid=rc --no-git-tag-version` → `1.0.0-rc.2`
C. `npm run pack:desktop` e publicar Release `v1.0.0-rc.2` (prerelease) com os artefatos novos.
D. Instalar a rc.1 deste pack (se a instalação atual ainda for generic, reinstalar uma vez).
E. Abrir o Cosmo.
F. Esperar a verificação ou usar Configurações → Sistema → Verificar atualizações.
G. Deve aparecer “Nova atualização disponível”.
H. Baixar.
I. Conferir progresso.
J. “Atualizar agora” com o PDV ocioso.
K. Com item no carrinho, “Atualizar agora” deve ser recusado.

## Teste local sem GitHub

```powershell
$env:COSMO_UPDATE_SERVER_URL="http://127.0.0.1:8787/"
npm run pack:desktop
npm run serve:desktop-updates
```

Isso só aponta o instalador de teste para HTTP local. Não altere `update-server.json` para localhost.

## IPC

Renderer usa só `window.cosmoDesktop`:

- `checkUpdate()`
- `updaterGetStatus()`
- `updaterDownload()`
- `updaterInstall({ when: "now" | "quit", criticalOperation?, criticalReason? })`
- `updaterDismiss()`
- evento `cosmo:event` com `type: "desktop-update"`

Não importe `electron-updater` no React. Não coloque token no preload.
