# Scale Manager — Cosmo Business RC1

## Princípio

O frontend **nunca** acessa portas COM/USB.  
Toda I/O passa pelo Desktop Agent (Electron main).

## Drivers (`apps/desktop/electron/src/hardware/scale/drivers/`)

```
drivers/
  toledo/
  filizola/
  urano/
  elgin/
  prix/
  generic/
```

Cada fabricante é isolado. Novos drivers = nova pasta + registro em `drivers/index.ts`.

## Status RC1

| Fabricante | Protocolo implementado | Motivo |
|------------|------------------------|--------|
| Toledo / Prix 3 Fit / Fit/2 | **Sim (Prt5)** | Manual MU-3-Fit §5.3.4 — ver `docs/TOLEDO_PRIX3_FIT_PROTOCOL.md` |
| Filizola | Não | Idem |
| Urano | Não | Idem |
| Elgin (balança) | Não | Idem (≠ impressora Elgin) |
| Generic ASCII | Não | Aguarda `serialport` + formato ASCII documentado |

**Não há simulação de peso.** `readWeight` / zerar / tara retornam erro explícito até o protocolo real.

## Conexão (config)

Modelo, tipo, porta, baud, bits, parity, stop bits, handshake — salvos em `scale-config.json`.

Detecção de portas: WMI `Win32_SerialPort` (COM).  
USB / Bluetooth / Ethernet: arquitetura de tipos pronta; implementação depende do fabricante.

## PDV — Venda por peso

Hook `useWeightSale` (`src/features/hardware/hooks/useWeightSale.ts`):

1. Selecionar produto  
2. `readWeight()` via Agent  
3. Calcular R$/kg ou R$/g  
4. Caller adiciona item ao pedido com qty = kg  
5. Finalizar venda (motor PDV existente)

Configurável: preço kg/g, min/max, arredondamento, tara automática.

## Toledo Prix 3 Fit (RC1.1)

Driver oficial Prt5 implementado. Dependências:

1. `npm i serialport` + rebuild Electron  
2. Balança com **C14 = Prt5**  
3. Teste físico COM

Detalhes: `docs/TOLEDO_PRIX3_FIT_PROTOCOL.md`

## O que falta para outras marcas

Documentação oficial do protocolo (frames) **ou** SDK — sem inventar.
