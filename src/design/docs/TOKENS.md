# Design Tokens

## Cores (`tokens/colors.ts`)

```ts
background: #050816
primary: #2563EB
secondary: #7C3AED
success: #10B981
warning: #F59E0B
danger: #EF4444
```

Variáveis CSS em `tokens/design.css`:

- `--cosmo-bg`, `--cosmo-primary`, `--cosmo-secondary`, etc.

## Spacing (`tokens/spacing.ts`)

Escala 0–24 em rem, compatível com Tailwind.

## Radius (`tokens/radius.ts`)

`sm` → `full` para chips, cards e botões.

## Typography (`tokens/typography.ts`)

| Variante | Uso |
|----------|-----|
| display | Hero, splash |
| heading | Títulos de página |
| title | Seções |
| subtitle | Descrições |
| body | Texto padrão |
| caption | Labels, metadados |

Classes utilitárias: `typographyClass.display`, etc.

## Elevations (`tokens/elevations.ts`)

Sombras `sm`–`xl` + `glowPrimary` / `glowSecondary`.

## Glass (`tokens/glass.ts`)

Presets para sidebar, panel, card e topbar.

## Gradients (`tokens/gradients.ts`)

`primary`, `secondary`, `surface`, `hero`, `logo`.

## ThemeEngine

Aplica tokens ao `document.documentElement` na inicialização.
