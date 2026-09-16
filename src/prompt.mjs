import { sha256 } from './hash.mjs';
export function buildPrompt(task, protocol, arm) {
  const taskText = typeof task.task === 'string' ? task.task : JSON.stringify(task.task ?? task);
  if (arm === 'B0') return taskText;
  if (arm === 'B1') return `${protocol.trigger}. ${taskText}`;
  if (arm === 'B2') return `Analyze the task carefully, use available tools when useful, verify important assumptions, complete the task, and check your work before finishing.\n\n${taskText}`;
  if (arm === 'FULL') return `Protocol: ${protocol.trigger}\nPurpose: ${protocol.purpose}\nBehavior contract:\n${protocol.contract.map(x => `- ${x}`).join('\n')}\nObservable signals:\n${protocol.observableSignals.map(x => `- ${x}`).join('\n')}\n\nTask:\n${taskText}`;
  throw new Error(`unknown arm ${arm}`);
}
export const promptHash = sha256;
