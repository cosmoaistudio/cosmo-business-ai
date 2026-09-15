import { Toaster } from "sonner";

import SplashScreen from "./components/splash/SplashScreen";
import ErrorBoundary from "./components/errors/ErrorBoundary";
import AppRoutes from "./routes/AppRoutes";
import { AuthProvider } from "@/features/auth";
import DesktopOAuthListener from "@/features/auth/components/DesktopOAuthListener";
import { OperationSetupProvider } from "@/features/operation-onboarding";
import { CoreProvider } from "@/core";
import { MotionProvider } from "@/motion";
import { UpdateNotification } from "@/desktop/updater/UpdateNotification";
import { ThemeProvider } from "@/design";

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider>
        <MotionProvider>
          <AuthProvider>
            <DesktopOAuthListener />
            <OperationSetupProvider>
              <CoreProvider>
                <SplashScreen>
                  <AppRoutes />
                </SplashScreen>

                <UpdateNotification />

                <Toaster
                  position="top-right"
                  richColors
                  expand
                  closeButton
                  theme="dark"
                />
              </CoreProvider>
            </OperationSetupProvider>
          </AuthProvider>
        </MotionProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
