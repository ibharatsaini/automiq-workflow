import { BaseNode } from './BaseNode';
import { CodeSandbox } from '../sandbox/CodeSandbox';
import { IExecuteContext, INodeExecutionData, INodeTypeDescription } from '../lib/types';

export class CodeNode extends BaseNode {
  readonly description: INodeTypeDescription = {
    name: 'code',
    displayName: 'Code',
    group: 'transform',
  };

  constructor(private readonly sandbox: CodeSandbox) {
    super();
  }

  async execute(context: IExecuteContext): Promise<INodeExecutionData[][]> {
    const mode    = context.getNodeParameter<string>('mode', 'runOnceForAllItems');
    const jsCode  = context.getNodeParameter<string>('jsCode', '');
    const inputItems = context.getInputData();

    if (mode === 'runOnceForAllItems') {
      const result = await this.sandbox.run(jsCode, { items: inputItems });
      return [this.standardizeOutput(result)];
    }

    if (mode === 'runOnceForEachItem') {
      const outputItems: INodeExecutionData[] = [];
      for (let i = 0; i < inputItems.length; i++) {
        const result = await this.sandbox.run(jsCode, { items: [inputItems[i]], itemIndex: i });
        outputItems.push(...this.standardizeOutput(result));
      }
      return [outputItems];
    }

    throw new Error(`CodeNode: unsupported mode "${mode}"`);
  }
}
