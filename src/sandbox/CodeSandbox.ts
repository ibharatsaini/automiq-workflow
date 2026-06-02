import { Worker } from 'worker_threads';
import path from 'path';
import { INodeExecutionData } from '../lib/types';

const WORKER_PATH = path.join(__dirname, 'CodeWorker');
const TIMEOUT_MS  = 10_000;

export class CodeSandbox {
  /**
   * Spawns a new worker_thread, runs the JS code inside a
   * restricted context, and returns the raw result.
   */
  run(
    jsCode: string,
    payload: { items: INodeExecutionData[]; itemIndex?: number },
  ): Promise<unknown> {
    return new Promise((resolve, reject) => {
      const worker = new Worker(WORKER_PATH, { workerData: { jsCode, payload } });

      const timeout = setTimeout(() => {
        void worker.terminate();
        reject(new Error(`Code node timed out after ${TIMEOUT_MS}ms`));
      }, TIMEOUT_MS);

      worker.on('message', (msg: { type: string; result?: unknown; error?: string; level?: string; args?: unknown[] }) => {
        if (msg.type === 'log') {
          const level = msg.level ?? 'log';
          (console as unknown as Record<string, (...a: unknown[]) => void>)[level]?.('[Code node]', ...(msg.args ?? []));
          return;
        }
        clearTimeout(timeout);
        void worker.terminate();
        if (msg.type === 'error') reject(new Error(msg.error));
        else resolve(msg.result);
      });

      worker.on('error', (err) => {
        clearTimeout(timeout);
        reject(err);
      });
    });
  }
}
