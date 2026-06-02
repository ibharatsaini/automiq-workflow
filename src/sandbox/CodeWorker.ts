import { workerData, parentPort } from 'worker_threads';
import vm from 'vm';

interface WorkerInput {
  jsCode: string;
  payload: {
    items: Array<{ json: Record<string, unknown> }>;
    itemIndex?: number;
  };
}

async function main(): Promise<void> {
  const { jsCode, payload } = workerData as WorkerInput;
  const items = payload.items ?? [];

  const sandboxGlobals = {
    items,
    $input: {
      all: () => items,
      first: () => items[0],
      item: items[0],
    },
    $json: items[0]?.json,
    $itemIndex: payload.itemIndex ?? 0,
    console: {
      log:   (...args: unknown[]) => parentPort!.postMessage({ type: 'log',   level: 'log',   args }),
      warn:  (...args: unknown[]) => parentPort!.postMessage({ type: 'log',   level: 'warn',  args }),
      error: (...args: unknown[]) => parentPort!.postMessage({ type: 'log',   level: 'error', args }),
    },
  };

  const context = vm.createContext(sandboxGlobals, {
    codeGeneration: { strings: false, wasm: false },
  });


  const wrapped = `(async () => {\n${jsCode}\n})()`;

  try {
    const script = new vm.Script(wrapped, { filename: 'CodeNode.vm.js' });
    const result = await script.runInContext(context, { timeout: 9_000 });
    parentPort!.postMessage({ type: 'result', result });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    parentPort!.postMessage({ type: 'error', error: message });
  }
}

main();
