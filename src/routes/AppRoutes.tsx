import { lazy, Suspense, type ReactNode } from "react";
import {
  BrowserRouter,
  HashRouter,
  Navigate,
  Routes,
  Route,
  useLocation,
} from "react-router-dom";

import AppLayout from "../components/layout/AppLayout";
import PdvLayout from "../components/layout/PdvLayout";
import RouteErrorBoundary from "../components/errors/RouteErrorBoundary";
import {
  GuestRoute,
  ProtectedRoute,
  RoleRoute,
  type AppRoute,
} from "@/features/auth";

/** Eager: first paint for guests (auth entry). */
import Login from "../pages/Login";

const Dashboard = lazy(() => import("../pages/Dashboard"));
const Products = lazy(() => import("../pages/Products"));
const ProductBuilder = lazy(() => import("../pages/ProductBuilder"));
const ProductBuilderList = lazy(() => import("../pages/ProductBuilder/List"));
const Inventory = lazy(() => import("../pages/Inventory"));
const PDV = lazy(() => import("../pages/PDV"));
const Finance = lazy(() => import("../pages/Finance"));
const KitchenDisplayPage = lazy(() => import("../pages/KitchenDisplay"));
const Orders = lazy(() => import("../pages/Orders"));
const Customers = lazy(() => import("../pages/Customers"));
const OptionGroups = lazy(() => import("../pages/OptionGroups"));
const OptionItems = lazy(() => import("../pages/OptionItems"));
const AI = lazy(() => import("../pages/AI"));
const OperationCenterPage = lazy(() => import("../pages/OperationCenter"));
const DigitalMenuPage = lazy(() => import("../pages/DigitalOrdering/MenuPage"));
const DigitalTablePage = lazy(
  () => import("../pages/DigitalOrdering/TablePage")
);
const DigitalPickupPage = lazy(
  () => import("../pages/DigitalOrdering/PickupPage")
);
const DigitalDeliveryPage = lazy(
  () => import("../pages/DigitalOrdering/DeliveryPage")
);
const DigitalOrderStatusPage = lazy(
  () => import("../pages/DigitalOrdering/OrderStatusPage")
);
const DigitalOrderingSettingsPage = lazy(
  () => import("../pages/DigitalOrdering/SettingsPage")
);
const OnboardingAssistantPage = lazy(() => import("../pages/Onboarding"));
const CompanyOnboardingPage = lazy(
  () => import("../pages/CompanyOnboarding")
);
const GrowthHubPage = lazy(() => import("../pages/GrowthHub"));
const DesignPreviewPage = lazy(() => import("../pages/DesignPreview"));
const BusinessBrainPage = lazy(() => import("../pages/BusinessBrain"));
const AutomationsPage = lazy(() => import("../pages/Automations"));
const AutomationEditorPage = lazy(() => import("../pages/Automations/Editor"));
const MyPlanPage = lazy(() => import("../pages/MyPlan"));
const HelpPage = lazy(() => import("../pages/Help"));
const DiagnosticsPage = lazy(() => import("../pages/Diagnostics"));
const SettingsPage = lazy(() => import("../pages/Settings"));
const HardwarePage = lazy(() => import("../pages/Hardware"));

function RouteFallback({ compact = false }: { compact?: boolean }) {
  if (compact) {
    return (
      <div className="flex min-h-[40vh] flex-col items-center justify-center gap-3 text-sm text-slate-400">
        <div className="h-9 w-9 animate-spin rounded-full border-2 border-blue-400/30 border-t-blue-400" />
        <span>Carregando módulo…</span>
      </div>
    );
  }

  return (
    <div className="space-y-4 p-2" aria-busy="true" aria-label="Carregando página">
      <div className="h-28 animate-pulse rounded-2xl bg-white/5" />
      <div className="h-40 animate-pulse rounded-2xl bg-white/5" />
      <div className="h-24 animate-pulse rounded-2xl bg-white/5" />
    </div>
  );
}

function LazyPage({
  children,
  compact,
}: {
  children: ReactNode;
  compact?: boolean;
}) {
  const location = useLocation();

  return (
    <RouteErrorBoundary resetKey={location.pathname}>
      <Suspense fallback={<RouteFallback compact={compact} />}>
        {children}
      </Suspense>
    </RouteErrorBoundary>
  );
}

function ProtectedPage({
  path,
  children,
}: {
  path: AppRoute;
  children: React.ReactNode;
}) {
  return (
    <ProtectedRoute>
      <RoleRoute path={path}>{children}</RoleRoute>
    </ProtectedRoute>
  );
}

/** Electron `loadFile` (file://) requires HashRouter; web keeps BrowserRouter. */
function useElectronHashRouter() {
  if (typeof window === "undefined") return false;
  return (
    window.location.protocol === "file:" ||
    Boolean(window.cosmoDesktop?.isDesktop)
  );
}

export default function AppRoutes() {
  const Router = useElectronHashRouter() ? HashRouter : BrowserRouter;

  return (
    <Router>
      <Routes>
        <Route
          path="/login"
          element={
            <GuestRoute>
              <Login />
            </GuestRoute>
          }
        />

        <Route
          path="/"
          element={
            <ProtectedPage path="/">
              <AppLayout>
                <LazyPage>
                  <Dashboard />
                </LazyPage>
              </AppLayout>
            </ProtectedPage>
          }
        />

        <Route
          path="/operacoes"
          element={
            <ProtectedPage path="/operacoes">
              <AppLayout>
                <LazyPage>
                  <OperationCenterPage />
                </LazyPage>
              </AppLayout>
            </ProtectedPage>
          }
        />

        <Route
          path="/produtos"
          element={
            <ProtectedPage path="/produtos">
              <AppLayout>
                <LazyPage>
                  <Products />
                </LazyPage>
              </AppLayout>
            </ProtectedPage>
          }
        />

        <Route
          path="/produtos/builder"
          element={
            <ProtectedPage path="/produtos/builder">
              <AppLayout>
                <LazyPage>
                  <ProductBuilderList />
                </LazyPage>
              </AppLayout>
            </ProtectedPage>
          }
        />

        <Route
          path="/produtos/builder/:id"
          element={
            <ProtectedPage path="/produtos">
              <AppLayout>
                <LazyPage>
                  <ProductBuilder />
                </LazyPage>
              </AppLayout>
            </ProtectedPage>
          }
        />

        <Route
          path="/products/builder/:id"
          element={
            <ProtectedPage path="/produtos">
              <AppLayout>
                <LazyPage>
                  <ProductBuilder />
                </LazyPage>
              </AppLayout>
            </ProtectedPage>
          }
        />

        <Route
          path="/estoque"
          element={
            <ProtectedPage path="/estoque">
              <AppLayout>
                <LazyPage>
                  <Inventory />
                </LazyPage>
              </AppLayout>
            </ProtectedPage>
          }
        />

        <Route
          path="/pdv"
          element={
            <ProtectedPage path="/pdv">
              <PdvLayout>
                <LazyPage compact>
                  <PDV />
                </LazyPage>
              </PdvLayout>
            </ProtectedPage>
          }
        />

        <Route
          path="/financeiro"
          element={
            <ProtectedPage path="/financeiro">
              <AppLayout>
                <LazyPage>
                  <Finance />
                </LazyPage>
              </AppLayout>
            </ProtectedPage>
          }
        />

        <Route
          path="/pedidos"
          element={
            <ProtectedPage path="/pedidos">
              <AppLayout>
                <LazyPage>
                  <Orders />
                </LazyPage>
              </AppLayout>
            </ProtectedPage>
          }
        />

        <Route
          path="/cozinha"
          element={
            <ProtectedPage path="/cozinha">
              <LazyPage compact>
                <KitchenDisplayPage />
              </LazyPage>
            </ProtectedPage>
          }
        />

        <Route
          path="/clientes"
          element={
            <ProtectedPage path="/clientes">
              <AppLayout>
                <LazyPage>
                  <Customers />
                </LazyPage>
              </AppLayout>
            </ProtectedPage>
          }
        />

        <Route
          path="/opcoes/grupos"
          element={
            <ProtectedPage path="/opcoes/grupos">
              <AppLayout>
                <LazyPage>
                  <OptionGroups />
                </LazyPage>
              </AppLayout>
            </ProtectedPage>
          }
        />

        <Route
          path="/opcoes/itens"
          element={
            <ProtectedPage path="/opcoes/itens">
              <AppLayout>
                <LazyPage>
                  <OptionItems />
                </LazyPage>
              </AppLayout>
            </ProtectedPage>
          }
        />

        <Route
          path="/automacoes"
          element={
            <ProtectedPage path="/automacoes">
              <AppLayout>
                <LazyPage>
                  <AutomationsPage />
                </LazyPage>
              </AppLayout>
            </ProtectedPage>
          }
        />

        <Route
          path="/automacoes/nova"
          element={
            <ProtectedPage path="/automacoes">
              <AppLayout>
                <LazyPage compact>
                  <AutomationEditorPage />
                </LazyPage>
              </AppLayout>
            </ProtectedPage>
          }
        />

        <Route
          path="/automacoes/:id"
          element={
            <ProtectedPage path="/automacoes">
              <AppLayout>
                <LazyPage compact>
                  <AutomationEditorPage />
                </LazyPage>
              </AppLayout>
            </ProtectedPage>
          }
        />

        <Route
          path="/ia"
          element={
            <ProtectedPage path="/ia">
              <AppLayout>
                <LazyPage>
                  <AI />
                </LazyPage>
              </AppLayout>
            </ProtectedPage>
          }
        />

        <Route
          path="/cerebro"
          element={
            <ProtectedPage path="/cerebro">
              <AppLayout>
                <LazyPage>
                  <BusinessBrainPage />
                </LazyPage>
              </AppLayout>
            </ProtectedPage>
          }
        />

        <Route
          path="/crescimento"
          element={
            <ProtectedPage path="/crescimento">
              <AppLayout>
                <LazyPage>
                  <GrowthHubPage />
                </LazyPage>
              </AppLayout>
            </ProtectedPage>
          }
        />

        <Route
          path="/meu-plano"
          element={
            <ProtectedPage path="/meu-plano">
              <AppLayout>
                <LazyPage>
                  <MyPlanPage />
                </LazyPage>
              </AppLayout>
            </ProtectedPage>
          }
        />

        <Route
          path="/ajuda"
          element={
            <ProtectedPage path="/ajuda">
              <AppLayout>
                <LazyPage>
                  <HelpPage />
                </LazyPage>
              </AppLayout>
            </ProtectedPage>
          }
        />

        <Route
          path="/diagnostico"
          element={
            <ProtectedPage path="/diagnostico">
              <AppLayout>
                <LazyPage>
                  <DiagnosticsPage />
                </LazyPage>
              </AppLayout>
            </ProtectedPage>
          }
        />

        <Route
          path="/configuracoes"
          element={
            <ProtectedPage path="/configuracoes">
              <AppLayout>
                <LazyPage>
                  <SettingsPage />
                </LazyPage>
              </AppLayout>
            </ProtectedPage>
          }
        />

        <Route
          path="/menu/:slug"
          element={
            <LazyPage compact>
              <DigitalMenuPage />
            </LazyPage>
          }
        />
        <Route
          path="/table/:tableId"
          element={
            <LazyPage compact>
              <DigitalTablePage />
            </LazyPage>
          }
        />
        <Route
          path="/pickup"
          element={
            <LazyPage compact>
              <DigitalPickupPage />
            </LazyPage>
          }
        />
        <Route
          path="/delivery"
          element={
            <LazyPage compact>
              <DigitalDeliveryPage />
            </LazyPage>
          }
        />
        <Route
          path="/order-status/:orderId"
          element={
            <LazyPage compact>
              <DigitalOrderStatusPage />
            </LazyPage>
          }
        />

        <Route
          path="/configuracoes/pedido-digital"
          element={
            <ProtectedPage path="/configuracoes/pedido-digital">
              <AppLayout>
                <LazyPage>
                  <DigitalOrderingSettingsPage />
                </LazyPage>
              </AppLayout>
            </ProtectedPage>
          }
        />

        <Route
          path="/configuracoes/hardware"
          element={
            <ProtectedPage path="/configuracoes/hardware">
              <AppLayout>
                <LazyPage>
                  <HardwarePage />
                </LazyPage>
              </AppLayout>
            </ProtectedPage>
          }
        />

        <Route
          path="/onboarding"
          element={
            <ProtectedPage path="/onboarding">
              <LazyPage>
                <CompanyOnboardingPage />
              </LazyPage>
            </ProtectedPage>
          }
        />

        <Route
          path="/assistente"
          element={
            <ProtectedPage path="/assistente">
              <AppLayout>
                <LazyPage>
                  <OnboardingAssistantPage />
                </LazyPage>
              </AppLayout>
            </ProtectedPage>
          }
        />

        {import.meta.env.DEV ? (
          <Route
            path="/design-preview"
            element={
              <ProtectedPage path="/design-preview">
                <LazyPage>
                  <DesignPreviewPage />
                </LazyPage>
              </ProtectedPage>
            }
          />
        ) : null}

        {/*
          Unknown paths → login. GuestRoute sends authenticated users via
          startup (onboarding → /onboarding, ready → role default / dashboard).
          Guests stay on login — never open a private screen without a session.
        */}
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </Router>
  );
}
