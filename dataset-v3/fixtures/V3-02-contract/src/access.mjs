import { roleRules } from './role-rules.mjs';
export function decideAccess(input) { if (input.decision === 'deny') return {allowed:false,reason:'explicit-deny'}; return {allowed:input.decision==='allow',reason:'decision'}; }
