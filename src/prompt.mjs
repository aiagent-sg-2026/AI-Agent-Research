import { sha256 } from './hash.mjs';

export function validateTask(task) {
  if (!task || typeof task !== 'object' || Array.isArray(task) || typeof task.task !== 'string' || !task.task.trim()) {
    throw new Error('task must contain a non-empty string task prompt');
  }
  return task.task;
}

export function buildPrompt(task, protocol, arm) {
  const taskText = validateTask(task);
  const scope = task.allowedTarget ? `Visible scope: edit only the existing implementation file ${task.allowedTarget}. Do not edit tests, package metadata, evaluator files, or unrelated files. The task contract is the complete visible specification.` : '';
  if (arm === 'B0') return `${taskText}\n\n${scope}`;
  if (arm === 'B1') return `${protocol.trigger}. ${taskText}\n\n${scope}`;
  if (arm === 'B2') return `Analyze the task carefully, use available tools when useful, verify important assumptions, complete the task, and check your work before finishing.\n\n${taskText}\n\n${scope}`;
  if (arm === 'FULL') return `Protocol: ${protocol.trigger}\nPurpose: ${protocol.purpose}\nBehavior contract:\n${protocol.contract.map(x => `- ${x}`).join('\n')}\nObservable signals:\n${protocol.observableSignals.map(x => `- ${x}`).join('\n')}\n\nTask:\n${taskText}\n\n${scope}`;
  throw new Error(`unknown arm ${arm}`);
}
export const promptHash = sha256;
