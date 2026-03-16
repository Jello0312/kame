// ─── In-Memory Job Processor ────────────────────────
// Replaces Redis + BullMQ. Sufficient for MVP scale.
// Add Redis back at 10K+ users if persistence/distribution needed.

export interface JobData {
  id: string;
  handler: () => Promise<void>;
}

class JobProcessor {
  private running = 0;
  private concurrency: number;
  private queue: JobData[] = [];

  constructor(concurrency = 2) {
    this.concurrency = concurrency;
  }

  add(id: string, handler: () => Promise<void>): void {
    this.queue.push({ id, handler });
    this.process();
  }

  private async process(): Promise<void> {
    while (this.running < this.concurrency && this.queue.length > 0) {
      this.running++;
      const job = this.queue.shift()!;
      job
        .handler()
        .then(() => console.log(`Job ${job.id} completed`))
        .catch((err: Error) =>
          console.error(`Job ${job.id} failed:`, err.message),
        )
        .finally(() => {
          this.running--;
          this.process();
        });
    }
  }

  get pendingCount(): number {
    return this.queue.length;
  }

  get activeCount(): number {
    return this.running;
  }
}

export const tryonProcessor = new JobProcessor(2);
