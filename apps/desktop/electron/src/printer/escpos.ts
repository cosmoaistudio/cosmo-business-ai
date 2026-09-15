export type PrinterDriver =
  | "epson"
  | "bematech"
  | "elgin"
  | "daruma"
  | "generic";

export interface EscPosDocument {
  lines: string[];
  cut?: boolean;
  openDrawer?: boolean;
}

const ESC = 0x1b;
const GS = 0x1d;

export function buildEscPosBuffer(
  document: EscPosDocument,
  driver: PrinterDriver = "generic"
): Buffer {
  const chunks: Buffer[] = [];

  chunks.push(getInitSequence(driver));
  chunks.push(Buffer.from([ESC, 0x40])); // Initialize

  for (const line of document.lines) {
    chunks.push(Buffer.from(line, "utf8"));
    chunks.push(Buffer.from("\n", "utf8"));
  }

  chunks.push(Buffer.from("\n\n", "utf8"));

  if (document.openDrawer) {
    chunks.push(openDrawerCommand());
  }

  if (document.cut !== false) {
    chunks.push(Buffer.from([GS, 0x56, 0x00])); // Full cut
  }

  return Buffer.concat(chunks);
}

function getInitSequence(driver: PrinterDriver): Buffer {
  switch (driver) {
    case "epson":
      return Buffer.from([ESC, 0x40]);
    case "bematech":
      return Buffer.from([ESC, 0x40, ESC, 0x74, 0x06]);
    case "elgin":
      return Buffer.from([ESC, 0x40, ESC, 0x52, 0x00]);
    case "daruma":
      // ESC/POS-compatible preset only — Daruma SDK not bundled.
      return Buffer.from([ESC, 0x40]);
    default:
      return Buffer.from([ESC, 0x40]);
  }
}

export function openDrawerCommand(): Buffer {
  // ESC p m t1 t2 — pulse drawer kick
  return Buffer.from([ESC, 0x70, 0x00, 0x19, 0xfa]);
}

export async function sendToNetworkPrinter(
  buffer: Buffer,
  host: string,
  port = 9100,
  timeoutMs = 8000
): Promise<void> {
  const net = await import("node:net");

  await new Promise<void>((resolve, reject) => {
    const socket = new net.Socket();
    let settled = false;

    const finish = (error?: Error) => {
      if (settled) return;
      settled = true;
      socket.destroy();
      if (error) reject(error);
      else resolve();
    };

    socket.setTimeout(timeoutMs);
    socket.once("error", (error) => finish(error));
    socket.once("timeout", () =>
      finish(new Error(`Timeout ao conectar impressora ${host}:${port}`))
    );

    socket.connect(port, host, () => {
      socket.write(buffer, (error) => {
        if (error) {
          finish(error);
          return;
        }

        socket.end(() => finish());
      });
    });
  });
}

export async function sendToSpooler(buffer: Buffer, jobName: string) {
  const fs = await import("node:fs/promises");
  const os = await import("node:os");
  const path = await import("node:path");
  const { execFile } = await import("node:child_process");
  const { promisify } = await import("node:util");
  const execFileAsync = promisify(execFile);

  const tempFile = path.join(
    os.tmpdir(),
    `cosmo-print-${Date.now()}-${jobName.replace(/\W+/g, "-")}.bin`
  );

  await fs.writeFile(tempFile, buffer);

  try {
    if (process.platform === "win32") {
      await execFileAsync("cmd.exe", ["/c", "copy", "/b", tempFile, "PRN"]);
    } else {
      await execFileAsync("lp", ["-o", "raw", tempFile]).catch(async () => {
        await execFileAsync("lpr", ["-o", "raw", tempFile]);
      });
    }
  } finally {
    await fs.unlink(tempFile).catch(() => undefined);
  }
}
