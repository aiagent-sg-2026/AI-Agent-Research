export function summarizeReport(input) {
  if (Array.isArray(input.values)) return { title: input.title, lines: [`summary: ${input.values.reduce((a,b)=>a+b,0)}`] };
  return { title: input.title, lines: [] };
}
