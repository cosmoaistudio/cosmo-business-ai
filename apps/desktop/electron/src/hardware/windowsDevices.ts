import { execFile } from "node:child_process";
import { promisify } from "node:util";
import type { DetectedPrinter, ScalePortInfo } from "./types.js";

const execFileAsync = promisify(execFile);

async function runPowerShell(script: string): Promise<string> {
  if (process.platform !== "win32") {
    return "[]";
  }

  const { stdout } = await execFileAsync(
    "powershell.exe",
    ["-NoProfile", "-NonInteractive", "-Command", script],
    { windowsHide: true, maxBuffer: 2 * 1024 * 1024 }
  );

  return stdout.trim() || "[]";
}

/**
 * Lists Windows printers via WMI (standard OS API — not vendor SDK).
 */
export async function listWindowsPrinters(): Promise<DetectedPrinter[]> {
  try {
    const script = `
$ErrorActionPreference = 'Stop'
Get-CimInstance Win32_Printer | Select-Object Name, DriverName, PortName, Default, PrinterStatus |
  ConvertTo-Json -Compress
`;
    const raw = await runPowerShell(script);
    const parsed = JSON.parse(raw) as
      | Array<Record<string, unknown>>
      | Record<string, unknown>;
    const rows = Array.isArray(parsed) ? parsed : [parsed];

    return rows
      .filter((row) => row && row.Name)
      .map((row) => ({
        name: String(row.Name),
        driver: String(row.DriverName ?? "—"),
        status: mapPrinterStatus(Number(row.PrinterStatus ?? 0)),
        isDefault: Boolean(row.Default),
        type: "windows" as const,
        portName: row.PortName ? String(row.PortName) : undefined,
      }));
  } catch (error) {
    console.warn("[hardware] Falha ao listar impressoras Windows:", error);
    return [];
  }
}

function mapPrinterStatus(code: number): string {
  const map: Record<number, string> = {
    1: "Outro",
    2: "Desconhecido",
    3: "Ociosa",
    4: "Imprimindo",
    5: "Aquecendo",
    6: "Parada",
    7: "Offline",
  };
  return map[code] ?? `Status ${code}`;
}

/**
 * Lists COM / serial ports via WMI.
 */
export async function listComPorts(): Promise<ScalePortInfo[]> {
  try {
    const script = `
$ErrorActionPreference = 'Stop'
Get-CimInstance Win32_SerialPort | Select-Object DeviceID, Name, Description |
  ConvertTo-Json -Compress
`;
    const raw = await runPowerShell(script);
    const parsed = JSON.parse(raw) as
      | Array<Record<string, unknown>>
      | Record<string, unknown>;
    const rows = Array.isArray(parsed) ? parsed : parsed?.DeviceID ? [parsed] : [];

    return rows.map((row) => ({
      path: String(row.DeviceID ?? ""),
      label: String(row.Name ?? row.Description ?? row.DeviceID ?? "COM"),
      kind: "com" as const,
    }));
  } catch (error) {
    console.warn("[hardware] Falha ao listar portas COM:", error);
    return [];
  }
}
