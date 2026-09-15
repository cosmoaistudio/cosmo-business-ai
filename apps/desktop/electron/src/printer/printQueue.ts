import { randomUUID } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import type { PrintJobPayload } from "../ipc/channels.js";

export interface QueuedPrintJob extends PrintJobPayload {
  id: string;
  attempts: number;
  createdAt: string;
  lastError?: string;
}

const MAX_ATTEMPTS = 5;

export class PrintQueue {
  private queue: QueuedPrintJob[] = [];
  private filePath = "";
  private processing = false;
  private processor: ((job: QueuedPrintJob) => Promise<void>) | null = null;
  private interval: NodeJS.Timeout | null = null;

  async initialize(
    userDataPath: string,
    processor: (job: QueuedPrintJob) => Promise<void>
  ) {
    this.filePath = path.join(userDataPath, "print-queue.json");
    this.processor = processor;
    await mkdir(userDataPath, { recursive: true });
    await this.load();
    this.interval = setInterval(() => {
      void this.processNext();
    }, 3000);
  }

  async enqueue(job: PrintJobPayload): Promise<QueuedPrintJob> {
    const queued: QueuedPrintJob = {
      ...job,
      id: job.id ?? randomUUID(),
      attempts: 0,
      createdAt: new Date().toISOString(),
      driver: job.driver ?? "generic",
      port: job.port ?? 9100,
      lines: job.lines ?? [],
    };

    this.queue.push(queued);
    await this.persist();
    void this.processNext();
    return queued;
  }

  getAll() {
    return [...this.queue];
  }

  size() {
    return this.queue.length;
  }

  async shutdown() {
    if (this.interval) clearInterval(this.interval);
    await this.persist();
  }

  private async load() {
    try {
      const raw = await readFile(this.filePath, "utf8");
      this.queue = JSON.parse(raw) as QueuedPrintJob[];
    } catch {
      this.queue = [];
    }
  }

  private async persist() {
    await writeFile(this.filePath, JSON.stringify(this.queue, null, 2), "utf8");
  }

  private async processNext() {
    if (this.processing || !this.processor || this.queue.length === 0) {
      return;
    }

    this.processing = true;

    try {
      const job = this.queue[0];

      try {
        await this.processor(job);
        this.queue.shift();
      } catch (error) {
        job.attempts += 1;
        job.lastError =
          error instanceof Error ? error.message : "Erro desconhecido";

        if (job.attempts >= MAX_ATTEMPTS) {
          this.queue.shift();
          this.queue.push(job);
        }
      }

      await this.persist();
    } finally {
      this.processing = false;
    }
  }
}

export const printQueue = new PrintQueue();
