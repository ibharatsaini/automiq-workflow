// src/lib/expression.ts
//
// A minimal slice of n8n's expression engine (packages/workflow/src/Expression.ts).
// Real n8n parses `={{ ... }}` with a full tmpl-like parser and exposes
// $json, $node['name'], $now, $workflow, etc. This version supports
// only $json / $json.dotted.path — enough for If conditions and
// Telegram/Slack message templates.

import { INodeExecutionData } from './types';

function getByPath(obj: unknown, dottedPath: string): unknown {
  return dottedPath
    .split('.')
    .filter(Boolean)
    .reduce<unknown>((acc, key) =>
      acc !== null && acc !== undefined
        ? (acc as Record<string, unknown>)[key]
        : undefined,
      obj,
    );
}


function evaluatePath(expr: string, item: INodeExecutionData | undefined): unknown {
  const trimmed = expr.trim();
  if (trimmed === '$json') return item?.json;
  if (trimmed.startsWith('$json.')) {
    return getByPath(item?.json, trimmed.slice('$json.'.length));
  }
  throw new Error(`Unsupported expression: "${trimmed}". Only $json and $json.path are supported.`);
}



export function renderTemplate(template: unknown, item: INodeExecutionData | undefined): string {
  if (typeof template !== 'string') return String(template ?? '');
  return template.replace(/\{\{(.*?)\}\}/g, (_match, expr: string) => {
    const value = evaluatePath(expr, item);
    if (value === undefined || value === null) return '';
    return typeof value === 'object' ? JSON.stringify(value) : String(value);
  });
}
