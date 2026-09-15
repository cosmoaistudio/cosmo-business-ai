# Print Manager — Cosmo Business RC1

## Arquitetura

```
UI (React)
  → preload cosmoDesktop.*
    → IPC
      → PrintManager / PrinterService (Electron main)
        → ESC/POS buffer
          → TCP :9100  OU  spooler Windows (copy /b)
```

## Marcas

| Marca | Status RC1 |
|-------|------------|
| Epson | Preset ESC/POS |
| Bematech | Preset ESC/POS (+ code page) |
| Elgin | Preset ESC/POS |
| Daruma | Preset ESC/POS genérico (sem SDK Daruma) |
| Windows | Lista via WMI + spooler do SO |
| Generic | Fallback ESC/POS |

## Papéis

- Caixa
- Cozinha
- Delivery

Persistidos em `%APPDATA%/…/hardware-config.json`.

## Ticket 80mm

Layout textual: logo (hint), empresa, pedido, itens, peso, subtotal, total, PIX, QR (hint), horário.  
Raster logo / QR ESC/POS nativo: evolução futura.

## Fluxos

- Pedido Digital → impressão automática (flag `autoPrintDigitalOrders`)
- PDV → impressão automática configurável (`autoPrintPdv`)

## Botões (UI)

- Detectar automaticamente
- Imprimir teste
- Reimprimir último ticket
- Abrir fila

## Teste manual

1. Instalar driver Windows da impressora **ou** configurar host TCP
2. Hardware → Imprimir teste
3. Confirmar saída física do ticket
