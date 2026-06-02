import Bull from 'bull';
import { GlobalConfig }  from '../config/GlobalConfig';
import { IJobData, IJobMessage } from '../lib/types';

const JOB_WAIT_TIMEOUT_MS = 30_000;

export class ScalingService {
  private queue: Bull.Queue<IJobData> | null = null;

  /** Pending webhook responses waiting for a worker to finish the run. */
  private readonly pending = new Map<
    string,
    { resolve: (msg: IJobMessage) => void; reject: (err: Error) => void; timer: NodeJS.Timeout }
  >();

  constructor(private readonly config: GlobalConfig) {}

  setupQueue(): Bull.Queue<IJobData> {
    if (this.queue) return this.queue;

    this.queue = new Bull<IJobData>(this.config.bullQueueName, {
      redis: {
        host: this.config.redisHost,
        port: this.config.redisPort,
      },
    });

    // Listen for job progress messages from workers (via Redis pub/sub
    // under Bull's hood) and resolve the matching pending promise, which
    // unblocks the webhook route handler waiting for a response.
    this.queue.on('global:progress', (_jobId: Bull.JobId, rawMsg: unknown) => {
      const msg = rawMsg as IJobMessage;
      const waiter = this.pending.get(msg.executionId);
      if (!waiter) return;
      clearTimeout(waiter.timer);
      this.pending.delete(msg.executionId);
      waiter.resolve(msg);
    });

    return this.queue;
  }

  /**
   * Enqueue an execution job and wait for the worker to signal completion.
   * Returns the job message (success or failure) from the worker.
   */
  async addJobAndWait(executionId: string): Promise<IJobMessage> {
    const q = this.setupQueue();

    const resultPromise = new Promise<IJobMessage>((resolve, reject) => {
      const timer = setTimeout(() => {
        this.pending.delete(executionId);
        reject(new Error(`Worker did not respond within ${JOB_WAIT_TIMEOUT_MS}ms`));
      }, JOB_WAIT_TIMEOUT_MS);
      this.pending.set(executionId, { resolve, reject, timer });
    });

    await q.add({ executionId }, { removeOnComplete: true, removeOnFail: true });
    return resultPromise;
  }

  async closeQueue(): Promise<void> {
    await this.queue?.close();
  }
}
