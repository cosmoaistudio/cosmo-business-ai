import { contextBridge, ipcRenderer } from "electron";

contextBridge.exposeInMainWorld("cosmoFirstRun", {
  complete(payload: unknown) {
    return ipcRenderer.invoke("cosmo:first-run:complete", payload);
  },
  detectHardware() {
    return ipcRenderer.invoke("cosmo:first-run:detect-hardware");
  },
});
