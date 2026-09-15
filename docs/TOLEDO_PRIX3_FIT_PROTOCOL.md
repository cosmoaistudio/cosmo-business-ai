# Toledo Prix 3 Fit / Fit/2 — Driver Cosmo (Prt5)

**Fonte oficial:** Manual do Usuário MU-3-Fit (Toledo do Brasil), §5.3.4 Protocolo Prt5  
PDF: https://www.toledobrasil.com/wp-content/uploads/2024/08/MU-3-Fit-10-25-Rev.16.pdf

**Implementação:** `apps/desktop/electron/src/hardware/scale/drivers/toledo/`

## Serial (manual)

| Parâmetro | Valor |
|-----------|--------|
| Baud | 115200 |
| Data | 8 bits |
| Paridade | nenhuma |
| Stop | 1 |

Na balança: **C14 = Prt5** (e **C13 = SERIAL** quando aplicável).

## Comandos oficiais — cobertura

### Implementados

| Função | Host → Balança | Balança → Host | API |
|--------|----------------|----------------|-----|
| Obter peso | `[ENQ]` `05H` | `[STX][ppppp\|IIIII\|NNNNN\|SSSSS][ETX]` | `readWeight()`, `testCommunication()` |
| Preço/kg | `[STX][PPPPPP][ETX]` | `[ACK] 06H` / `[NACK] 21H` | `setPricePerKg(priceBrl)` |
| Tara (g) | `[SOH][TTTTTT][ETX]` | `[ACK] 06H` / `[NACK] 21H` | `setTareGrams(grams)` |
| Pré-empacotamento | `[DC4]` `14H` | `[SO] 0EH` / `[SI] 0FH` | `togglePrePack()` |

Peso estável: 5 dígitos = 2 inteiros + 3 decimais (ex. `14385` → 14,385 kg).

### Não documentados / não mapeáveis 1:1 no serial Prt5

| Função | Situação |
|--------|----------|
| **Zerar** | Manual Prt5 **não** define comando serial de zeramento. `zero()` retorna erro explícito. |
| **Tara sem valor** | Oficial exige gramas em `[SOH][TARA][ETX]`. `tare()` retorna erro; use `setTareGrams(g)`. |

## Dependência de I/O

- Requer pacote npm `serialport` + rebuild Electron para abrir COM.
- Sem `serialport` ou sem balança: **erro real** — nenhuma leitura simulada.

## Teste físico sugerido

1. Configurar balança C14=Prt5, C13=SERIAL se necessário  
2. Cosmo Hardware → fabricante Toledo, porta COM, 115200 8N1  
3. Conectar → Teste comunicação → Ler peso com carga estável  
