import { randomUUID } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import type { OfflineOperation } from "../ipc/channels.js";
import { getDesktopSupabase } from "../agent/repository/supabaseClient.js";
import { DesktopSecretValidationError } from "../agent/config/DesktopSecretManager.js";

export class OfflineSyncService {
  private queue: OfflineOperation[] = [];
  private filePath = "";
  private supabase: ReturnType<typeof getDesktopSupabase> | null = null;
  private syncing = false;
  private lastSyncAt: string | null = null;
  private interval: NodeJS.Timeout | null = null;

  async initialize(userDataPath: string) {
    this.filePath = path.join(userDataPath, "offline-queue.json");
    await mkdir(userDataPath, { recursive: true });
    await this.load();
    this.connectSupabase();

    this.interval = setInterval(() => {
      void this.sync();
    }, 15000);
  }

  enqueue(type: string, payload: Record<string, unknown>) {
    const operation: OfflineOperation = {
      id: randomUUID(),
      type,
      payload,
      createdAt: new Date().toISOString(),
      retries: 0,
    };

    this.queue.push(operation);
    void this.persist();
    return operation;
  }

  size() {
    return this.queue.length;
  }

  getLastSyncAt() {
    return this.lastSyncAt;
  }

  async sync() {
    if (this.syncing || this.queue.length === 0) {
      return { ok: true, data: { synced: 0 } };
    }

    if (!this.supabase) {
      this.connectSupabase();
    }

    if (!this.supabase) {
      return { ok: false, error: "Supabase não configurado" };
    }

    this.syncing = true;
    let synced = 0;

    try {
      const remaining: OfflineOperation[] = [];

      for (const operation of this.queue) {
        try {
          await this.pushOperation(operation);
          synced += 1;
        } catch (error) {
          operation.retries += 1;
          remaining.push(operation);
          console.error("Offline sync failed:", error);
        }
      }

      this.queue = remaining;
      this.lastSyncAt = new Date().toISOString();
      await this.persist();

      return { ok: true, data: { synced, remaining: this.queue.length } };
    } finally {
      this.syncing = false;
    }
  }

  async runBackup() {
    const backup = {
      exportedAt: new Date().toISOString(),
      offlineQueue: this.queue,
    };

    const backupPath = this.filePath.replace(
      "offline-queue.json",
      `backup-${Date.now()}.json`
    );

    await writeFile(backupPath, JSON.stringify(backup, null, 2), "utf8");
    return { ok: true, data: { path: backupPath } };
  }

  async shutdown() {
    if (this.interval) clearInterval(this.interval);
    await this.persist();
  }

  private connectSupabase() {
    try {
      this.supabase = getDesktopSupabase();
    } catch (error) {
      if (!(error instanceof DesktopSecretValidationError)) {
        console.error("[OfflineSyncService] Falha ao conectar Supabase:", error);
      }
      this.supabase = null;
    }
  }

  private async pushOperation(operation: OfflineOperation) {
    if (!this.supabase) throw new Error("Supabase indisponível");

    const table = String(operation.payload.table ?? "offline_events");

    const { error } = await this.supabase.from(table).insert({
      event_type: operation.type,
      payload: operation.payload,
      source: "cosmo-desktop",
      created_at: operation.createdAt,
    });

    if (error) {
      throw error;
    }
  }

  private async load() {
    try {
      const raw = await readFile(this.filePath, "utf8");
      this.queue = JSON.parse(raw) as OfflineOperation[];
    } catch {
      this.queue = [];
    }
  }

  private async persist() {
    await writeFile(this.filePath, JSON.stringify(this.queue, null, 2), "utf8");
  }
}

export const offlineSyncService = new OfflineSyncService();
