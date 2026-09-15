# Hardware Setup — Cosmo Business RC1

## Pré-requisitos

- Windows 10/11 x64
- Cosmo Business instalado (Setup) ou Portable
- Drivers de impressora instalados no Windows (quando usar spooler)
- Para rede ESC/POS: impressora em TCP porta **9100**

## Primeira execução

1. Abrir Cosmo Business
2. Completar wizard:
   - Empresa (nome, telefone, endereço, CNPJ, logo)
   - Tipo de negócio
   - Detectar hardware (impressoras Windows + COM + catálogo de balanças)
3. Ir em **Sistema → Hardware** ou **Configurações → Hardware**

## Desktop Agent

- Roda no processo principal Electron
- Frontend **nunca** abre portas COM
- Sem `.env.desktop` o app fica em modo local (PDV/UI/print locais)

## Impressoras

Ver `docs/PRINTING.md`.

## Balanças

Ver `docs/SCALE_MANAGER.md`.

## Diagnóstico

Em Hardware → Diagnóstico → **Executar diagnóstico**  
Valida: Agent, internet, Supabase, versão, Electron, impressoras, balanças, COM, USB (hint).
