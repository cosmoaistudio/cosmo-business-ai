import { Toaster } from "sonner";

import SplashScreen from "./components/splash/SplashScreen";
import AppRoutes from "./routes/AppRoutes";

function App() {
  return (
    <>
      <SplashScreen>
        <AppRoutes />
      </SplashScreen>

      <Toaster
        position="top-right"
        richColors
        expand
        closeButton
      />
    </>
  );
}

export default App;