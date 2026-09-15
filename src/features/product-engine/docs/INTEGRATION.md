# Integração — Product Engine

## PDV (sem alterar código existente)

```typescript
import { productEngine, toPdvCartItem } from "@/features/product-engine";

const result = await productEngine.addToCart(productId, buildState, "pdv");
if (result.valid && result.cartPayload) {
  const node = await productEngine.loadProduct(productId);
  const pdvItem = toPdvCartItem(result.cartPayload, node.productName);
  // Consumir pdvItem no hook useCart existente quando migrar
}
```

## Delivery

```typescript
import { toDeliveryOrderItem } from "@/features/product-engine";

const orderItem = toDeliveryOrderItem(node, cartPayload);
```

## Cardápio Digital

```typescript
import { toDigitalMenuProduct } from "@/features/product-engine";

const menuProduct = toDigitalMenuProduct(node);
```

## Mobile

```typescript
import { toMobileProductCard } from "@/features/product-engine";

const card = toMobileProductCard(node);
```

## Desktop (impressão)

```typescript
import { productSummary, toDesktopReceipt } from "@/features/product-engine";

const summary = productSummary.generate(node, buildState);
const receipt = toDesktopReceipt(summary);
```

## API REST (futuro)

```typescript
import { toApiProductResponse, toApiCartPayload } from "@/features/product-engine";

GET  /api/products/:id/engine  → toApiProductResponse(node)
POST /api/cart                 → toApiCartPayload(cartPayload)
```

## Canais suportados

| Canal | Adapter | `EngineChannel` |
|-------|---------|-----------------|
| PDV | `pdv.adapter.ts` | `pdv` |
| Delivery | `delivery.adapter.ts` | `delivery` |
| Cardápio Digital | `digitalMenu.adapter.ts` | `digital_menu` |
| Mobile | `mobile.adapter.ts` | `mobile` |
| Desktop | `desktop.adapter.ts` | `desktop` |
| API | `api.adapter.ts` | `api` |

## Eventos de estoque

Conectar webhook ou listener Supabase Realtime em `options`:

```typescript
productEngine.handleOptionStockChange(optionId, newStock, oldStock);
```

Isso dispara pause/reactivate automático nos produtos afetados.
