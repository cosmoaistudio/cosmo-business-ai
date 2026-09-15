import { Package, Sparkles, TrendingUp, Wallet } from "lucide-react";

import {
  Avatar,
  Badge,
  Button,
  Card,
  Divider,
  EmptyState,
  Input,
  LoadingState,
  MetricCard,
  PageContainer,
  Section,
  Skeleton,
  Tooltip,
  DesignSystemThemeProvider,
  palette,
  radius,
  shadows,
  spacing,
  typography,
  useTheme,
} from "@/design-system";

import "@/design-system/styles/design-system.css";

function TokenSwatch({ name, value }: { name: string; value: string }) {
  return (
    <div className="flex flex-col gap-2">
      <div
        className="h-12 rounded-[var(--cosmo-radius-md)] border border-[var(--cosmo-border-subtle)]"
        style={{ background: value }}
      />
      <div>
        <p className="text-xs font-medium text-[var(--cosmo-text-secondary)]">
          {name}
        </p>
        <p className="font-mono text-xs text-[var(--cosmo-text-tertiary)]">
          {value}
        </p>
      </div>
    </div>
  );
}

function PreviewHeader() {
  const { mode, toggleMode } = useTheme();

  return (
    <header className="border-b border-[var(--cosmo-border-subtle)] bg-[var(--cosmo-bg-elevated)] px-8 py-6">
      <div className="mx-auto flex max-w-[1440px] items-center justify-between gap-4">
        <div>
          <Badge variant="intelligence">Design System V2</Badge>
          <h1
            className="mt-3 font-bold text-[var(--cosmo-text)]"
            style={{ fontSize: typography.fontSize.displayXl }}
          >
            Cosmo Preview
          </h1>
          <p className="mt-2 text-[var(--cosmo-text-secondary)]">
            Validação visual dos tokens e componentes base — Fase 1
          </p>
        </div>
        <Button variant="secondary" onClick={toggleMode}>
          Tema: {mode === "dark" ? "Dark" : "Light"}
        </Button>
      </div>
    </header>
  );
}

function DesignPreviewContent() {
  return (
    <PageContainer className="space-y-12 pb-16">
      <Section
        title="Tipografia"
        description="Escala tipográfica V2 com Geist Variable"
      >
        <Card padding="lg">
          <div className="space-y-4">
            <p
              style={{
                fontSize: typography.fontSize.displayXl,
                fontWeight: typography.fontWeight.bold,
              }}
            >
              Display XL — Bom dia, Felipe
            </p>
            <p
              style={{
                fontSize: typography.fontSize.display,
                fontWeight: typography.fontWeight.bold,
              }}
            >
              Display — R$ 4.820,00
            </p>
            <p
              style={{
                fontSize: typography.fontSize.headingLg,
                fontWeight: typography.fontWeight.semibold,
              }}
            >
              Heading LG — Resumo operacional
            </p>
            <p
              style={{
                fontSize: typography.fontSize.heading,
                fontWeight: typography.fontWeight.semibold,
              }}
            >
              Heading — Título de seção
            </p>
            <p style={{ fontSize: typography.fontSize.body }}>
              Body — Texto de parágrafo e resumo do dia.
            </p>
            <p
              style={{
                fontSize: typography.fontSize.caption,
                fontWeight: typography.fontWeight.medium,
              }}
            >
              Caption — Label de KPI
            </p>
            <p
              style={{
                fontSize: typography.fontSize.overline,
                fontWeight: typography.fontWeight.semibold,
                letterSpacing: typography.letterSpacing.overline,
                textTransform: "uppercase",
              }}
            >
              Overline — Grupo sidebar
            </p>
          </div>
        </Card>
      </Section>

      <Section title="Botões" description="Variantes e tamanhos">
        <Card padding="lg" className="space-y-6">
          <div className="flex flex-wrap gap-3">
            <Button variant="primary">Primary</Button>
            <Button variant="secondary">Secondary</Button>
            <Button variant="ghost">Ghost</Button>
            <Button variant="intelligence">Intelligence</Button>
            <Button variant="danger">Danger</Button>
            <Button variant="primary" loading>
              Loading
            </Button>
          </div>
          <Divider />
          <div className="flex flex-wrap items-center gap-3">
            <Button size="sm">Small</Button>
            <Button size="md">Medium</Button>
            <Button size="lg">Large</Button>
            <Button size="icon" aria-label="Icon">
              +
            </Button>
          </div>
        </Card>
      </Section>

      <Section title="Inputs">
        <Card padding="lg" className="max-w-md space-y-4">
          <Input placeholder="Buscar produtos, vendas, clientes..." />
          <Input placeholder="Desabilitado" disabled />
        </Card>
      </Section>

      <Section title="Cards & MetricCards">
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <MetricCard
            label="Faturamento"
            value="R$ 4.820"
            delta="▲ 12,4% vs ontem"
            deltaType="up"
            icon={<Wallet size={18} />}
          />
          <MetricCard
            label="Pedidos"
            value="47"
            delta="▲ 8 pedidos"
            deltaType="up"
            icon={<TrendingUp size={18} />}
          />
          <MetricCard
            label="Meta"
            value="78%"
            delta="No caminho"
            deltaType="neutral"
          />
          <MetricCard label="Estoque" value="—" loading />
        </div>
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <Card padding="md">
            <p className="font-semibold">Card sólido</p>
            <p className="mt-2 text-sm text-[var(--cosmo-text-secondary)]">
              Surface + shadow sm + hover lift
            </p>
          </Card>
          <Card padding="md" glass>
            <p className="font-semibold">Card glass</p>
            <p className="mt-2 text-sm text-[var(--cosmo-text-secondary)]">
              Backdrop blur + glass token
            </p>
          </Card>
        </div>
      </Section>

      <Section title="Badges & Avatar">
        <Card padding="lg" className="flex flex-wrap items-center gap-4">
          <Badge>Default</Badge>
          <Badge variant="primary">Primary</Badge>
          <Badge variant="success">Success</Badge>
          <Badge variant="warning">Warning</Badge>
          <Badge variant="danger">Danger</Badge>
          <Badge variant="intelligence">Cosmo AI</Badge>
          <Divider orientation="vertical" className="mx-2 h-8" />
          <Avatar fallback="Felipe Silva" />
          <Avatar fallback="Cosmo" size="lg" />
          <Tooltip content="Tooltip V2">
            <Button variant="ghost" size="sm">
              Hover me
            </Button>
          </Tooltip>
        </Card>
      </Section>

      <Section title="Skeleton, Empty & Loading">
        <div className="grid gap-4 md:grid-cols-3">
          <Card padding="md" hoverable={false} static>
            <Skeleton height="1rem" width="80%" />
            <Skeleton height="2rem" width="60%" className="mt-3" />
            <Skeleton height="0.875rem" width="40%" className="mt-3" />
          </Card>
          <EmptyState
            title="Nenhum produto"
            description="Cadastre seu primeiro produto para começar."
            icon={<Package size={48} strokeWidth={1.5} />}
            action={<Button size="sm">Novo produto</Button>}
          />
          <Card padding="md" hoverable={false} static>
            <LoadingState label="Sincronizando dados..." />
          </Card>
        </div>
      </Section>

      <Section title="Spacing & Radius">
        <Card padding="lg">
          <p className="mb-4 text-sm text-[var(--cosmo-text-secondary)]">
            Spacing scale (base 4px)
          </p>
          <div className="flex flex-wrap items-end gap-2">
            {(["2", "4", "6", "8", "12"] as const).map((key) => (
              <div key={key} className="flex flex-col items-center gap-2">
                <div
                  className="bg-[var(--cosmo-primary-muted)]"
                  style={{
                    width: spacing[key],
                    height: spacing[key],
                    borderRadius: radius.sm,
                  }}
                />
                <span className="text-xs text-[var(--cosmo-text-tertiary)]">
                  {key}
                </span>
              </div>
            ))}
          </div>
          <Divider className="my-6" />
          <div className="flex flex-wrap gap-4">
            {(["sm", "md", "lg", "xl"] as const).map((key) => (
              <div
                key={key}
                className="flex h-16 w-24 items-center justify-center border border-[var(--cosmo-border)] bg-[var(--cosmo-bg-muted)] text-xs text-[var(--cosmo-text-secondary)]"
                style={{ borderRadius: radius[key] }}
              >
                {key}
              </div>
            ))}
          </div>
        </Card>
      </Section>

      <Section title="Sombras">
        <div className="grid gap-4 md:grid-cols-3">
          {(["sm", "md", "lg"] as const).map((key) => (
            <Card key={key} padding="md" static hoverable={false}>
              <div
                className="flex h-20 items-center justify-center rounded-[var(--cosmo-radius-md)] bg-[var(--cosmo-surface)] text-sm text-[var(--cosmo-text-secondary)]"
                style={{ boxShadow: shadows[key] }}
              >
                shadow.{key}
              </div>
            </Card>
          ))}
        </div>
      </Section>

      <Section title="Cores semânticas">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <TokenSwatch name="--cosmo-bg" value={palette.bg.base} />
          <TokenSwatch name="--cosmo-surface" value={palette.bg.surface} />
          <TokenSwatch name="--cosmo-primary" value={palette.accent.blue} />
          <TokenSwatch name="--cosmo-purple-ai" value={palette.intelligence.purple} />
          <TokenSwatch name="--cosmo-success" value={palette.success.DEFAULT} />
          <TokenSwatch name="--cosmo-warning" value={palette.warning.DEFAULT} />
          <TokenSwatch name="--cosmo-danger" value={palette.danger.DEFAULT} />
          <TokenSwatch name="--cosmo-border" value={palette.border.default} />
        </div>
      </Section>

      <Section title="Glass">
        <div className="grid gap-4 md:grid-cols-2">
          <div className="cosmo-v2-glass-demo">
            <div className="flex items-center gap-2">
              <Sparkles size={18} className="text-[var(--cosmo-purple-ai)]" />
              <span className="font-semibold">Glass panel</span>
            </div>
            <p className="mt-2 text-sm text-[var(--cosmo-text-secondary)]">
              Blur + saturate para header, sidebar e cards premium.
            </p>
          </div>
          <Card glass padding="lg">
            <p className="font-semibold">Card com glass token</p>
            <p className="mt-2 text-sm text-[var(--cosmo-text-secondary)]">
              Componente Card com prop glass=true
            </p>
          </Card>
        </div>
      </Section>

      <Section title="Animações">
        <Card padding="lg" className="space-y-4">
          <p className="text-sm text-[var(--cosmo-text-secondary)]">
            Motion tokens: instant 100ms · fast 150ms · normal 250ms · slow 400ms
          </p>
          <div className="flex flex-wrap gap-3">
            <Button variant="primary">Hover / focus transition</Button>
            <Card padding="sm" className="inline-block">
              Card hover lift
            </Card>
          </div>
          <Skeleton height="0.5rem" width="100%" />
          <p className="text-xs text-[var(--cosmo-text-tertiary)]">
            Shimmer skeleton · spinner em LoadingState
          </p>
        </Card>
      </Section>
    </PageContainer>
  );
}

export default function DesignPreviewPage() {
  return (
    <DesignSystemThemeProvider>
      <PreviewHeader />
      <DesignPreviewContent />
    </DesignSystemThemeProvider>
  );
}
