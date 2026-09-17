const protocols = [
  ['P01','ROOT-CAUSE','Find and correct the actual cause.','root-cause accuracy','root cause stated with evidence · original path passes','trace'],
  ['P02','CAUSAL-TRACE','Localize the first divergence in a causal chain.','causal localization','ordered causal chain · first divergence supported','trace'],
  ['P03','FALSIFY-FIRST','Reject attractive but unsupported explanations.','false-hypothesis rejection','competitor hypotheses · disconfirming checks','trace'],
  ['P04','EVIDENCE-FIRST','Make decisions from explicit observable evidence.','evidence-backed decision rate','observations separated · unknowns marked','context'],
  ['P05','CHALLENGE-FIRST-ANSWER','Catch errors in an initial answer or plan.','errors caught on challenge pass','challenge recorded · constraints checked','quality'],
  ['P06','TRACE-BEFORE-EDIT','Understand the responsible component before editing.','first-edit correctness','path inspected before edit · component identified','trace'],
  ['P07','CHANGE-IMPACT','Control downstream impact of a change.','regression avoidance','impact inventory · unrelated diff avoided','quality'],
  ['P08','MINIMAL-SAFE-CHANGE','Deliver the smallest complete safe fix.','correctness per changed surface','diff is scoped · contracts preserved','quality'],
  ['P09','REGRESSION-GUARD','Protect behavior that must remain stable.','regression-free completion','new path tested · old paths tested','quality'],
  ['P10','NEGATIVE-TESTING','Validate rejection and boundary behavior.','invalid-case rejection accuracy','negative cases run · safe rejection observed','quality'],
  ['P11','CONTEXT-MIN','Use the smallest sufficient authoritative context.','success per context token','task-relevant context · unneeded context avoided','context'],
  ['P12','CONTEXT-REFRESH','Prevent stale observations after consequential changes.','stale-context failure rate','post-change refresh · fresh tests/evidence','context'],
  ['P13','AUTHORITY-FIRST','Resolve facts using the strongest current source.','authoritative-source accuracy','authority ranked · current source used','context'],
  ['P14','CONTRADICTION-HUNT','Expose and resolve conflicting evidence.','conflict-resolution accuracy','contradiction sought · resolution justified','context'],
  ['P15','RECOVER-AND-CONTINUE','Recover safely from failures and preserve progress.','recovery success rate','failure evidence preserved · blocker classified','quality'],
  ['P16','END-TO-END-PROOF','Prove the real user/system-visible path.','real-path completion','real path exercised · limitation disclosed','quality'],
  ['P17','QUALITY-GATE','Make completion claims accountable to observable gates.','completion-claim accuracy','gates listed · evidence per gate','quality'],
  ['P18','SECOND-PASS','Find defects after implementation.','second-pass defect yield','fresh review · findings disposition','quality'],
  ['P19','GOAL-DRIVEN','Keep work aligned with the user’s final outcome.','goal alignment','goal restated · irrelevant work avoided','context'],
  ['P20','RESEARCH-SYNTHESIS','Produce grounded conclusions from multiple sources.','grounded synthesis quality','source types distinguished · gaps stated','context']
];

const resultData = { tokens: { label: 'tokens', unit: '', values: [78769.4, 82060.3, 76564.6, 88825.9], caption: 'A2 was 2.80% below A0; A1 was 4.18% above; A3 was 12.77% above. Descriptive only.' }, latency: { label: 'latency', unit: ' ms', values: [40383.8, 41442.1, 38821.5, 41444.3], caption: 'A2 was 3.87% below A0; A1 was 2.62% above; A3 was 2.63% above. Descriptive only.' }, delta: { label: 'token delta vs A0', unit: '%', values: [0, 4.18, -2.80, 12.77], caption: 'Token delta versus A0: A0 baseline; A1 +4.18%; A2 -2.80%; A3 +12.77%.' } };
const armLabels = ['A0', 'A1', 'A2', 'A3'];

function renderChart(metric = 'tokens') {
  const data = resultData[metric];
  const max = Math.max(...data.values);
  const chart = document.querySelector('#bar-chart');
  const scale = metric === 'delta' ? 165 / Math.max(...data.values.map(value => Math.abs(value)), 1) : 165 / max;
  chart.innerHTML = data.values.map((value, index) => `<div class="bar-item"><span class="bar-value">${metric === 'delta' && value > 0 ? '+' : ''}${value.toLocaleString(undefined, { maximumFractionDigits: 1 })}${data.unit}</span><span class="bar-fill" style="--height:${Math.max(9, Math.abs(value) * scale)}px" role="img" aria-label="${armLabels[index]} ${value.toLocaleString(undefined, { maximumFractionDigits: 1 })}${data.unit}"></span><span class="bar-label">${armLabels[index]}</span></div>`).join('');
  document.querySelector('#chart-caption').textContent = data.caption;
  document.querySelectorAll('.metric-button').forEach(button => button.classList.toggle('is-active', button.dataset.metric === metric));
}

function renderProtocols() {
  const query = document.querySelector('#protocol-search').value.trim().toLowerCase();
  const filter = document.querySelector('.filter-button.is-active').dataset.filter;
  const visible = protocols.filter(([id, trigger, purpose, metric, signals, family]) => {
    const matchesQuery = !query || [id, trigger, purpose, metric, signals].join(' ').toLowerCase().includes(query);
    return matchesQuery && (filter === 'all' || family === filter);
  });
  document.querySelector('#protocol-grid').innerHTML = visible.map(([id, trigger, purpose, metric, signals]) => `<article class="protocol-card"><span class="protocol-id">${id}</span><h3>${trigger}</h3><p class="protocol-purpose">${purpose}</p><div class="protocol-meta"><small>Primary metric</small><strong>${metric}</strong><p class="protocol-signal">Signals: ${signals}</p></div></article>`).join('');
  document.querySelector('#protocol-count').textContent = visible.length;
  document.querySelector('#no-results').hidden = visible.length !== 0;
}

document.addEventListener('DOMContentLoaded', () => {
  const mechanismData = {
    A0: ['Plain', 'Nowhere extra: the shared behavior instruction is absent from the prompt and candidate workspace.', 'The agent receives only the task context. There is no extra instruction to discover or persist.', '15/15 success · 78,769.4 mean tokens · 40,383.8 ms mean latency.'],
    A1: ['Strong Prompt', 'In the task prompt, delivered directly before the task.', 'The agent receives the instruction in-band with the task; it is available immediately for that prompt, but is not a workspace artifact.', '15/15 success · 82,060.3 mean tokens · 41,442.1 ms mean latency.'],
    A2: ['AGENTS.md', 'In a candidate-visible AGENTS.md file in the workspace.', 'The agent receives the task plus a file it can discover from workspace context. The instruction persists as a file for work in that workspace.', '15/15 success · 76,564.6 mean tokens · 38,821.5 ms mean latency.'],
    A3: ['Agent Skill', 'In a candidate-visible skill file, discoverable through the workspace skill location.', 'The agent receives the task plus a discoverable skill artifact. The instruction persists in the workspace, but V2 did not use a native skill-invocation system.', '15/15 success · 88,825.9 mean tokens · 41,444.3 ms mean latency.']
  };
  const panel = document.querySelector('#mechanism-panel');
  function showMechanism(id) {
    const [name, where, receives, metrics] = mechanismData[id];
    panel.innerHTML = `<p class="eyebrow">Selected arm · ${id}</p><h3>${name}</h3><div class="mechanism-facts"><div><strong>WHERE</strong><p>${where}</p></div><div><strong>WHAT THE AGENT RECEIVES</strong><p>${receives}</p></div><div><strong>V2 OBSERVED METRICS</strong><p>${metrics}</p></div></div>${id === 'A3' ? '<p class="mechanism-note"><strong>Invocation asymmetry:</strong> pinned Codex required a short explicit prompt directive to invoke the candidate-visible Skill. This is a documented adapter limitation, not an extra substantive instruction.</p>' : ''}`;
    document.querySelectorAll('.mechanism-tab').forEach(tab => { const selected = tab.dataset.arm === id; tab.classList.toggle('is-active', selected); tab.setAttribute('aria-pressed', selected); });
  }
  document.querySelectorAll('.mechanism-tab').forEach(tab => tab.addEventListener('click', () => showMechanism(tab.dataset.arm)));
  showMechanism('A0');
  const matrix = document.querySelector('.matrix-cells');
  matrix.innerHTML = '<i aria-hidden="true"></i>'.repeat(60);
  renderChart();
  renderProtocols();
  document.querySelectorAll('.metric-button').forEach(button => button.addEventListener('click', () => renderChart(button.dataset.metric)));
  document.querySelectorAll('.filter-button').forEach(button => button.addEventListener('click', () => { document.querySelectorAll('.filter-button').forEach(item => item.classList.remove('is-active')); button.classList.add('is-active'); renderProtocols(); }));
  document.querySelector('#protocol-search').addEventListener('input', renderProtocols);
  document.querySelectorAll('[data-quiz] button').forEach(button => button.addEventListener('click', () => {
    const feedback = document.querySelector('#quiz-feedback');
    feedback.textContent = button.dataset.correct === 'true' ? 'Supported: V2 observed 15/15 success for A0, A1, A2, and A3. It does not establish a universal winner.' : 'Unsupported: V2 is descriptive. All arms were 15/15, so this statement goes beyond the evidence.';
    document.querySelectorAll('[data-quiz] button').forEach(item => item.classList.toggle('quiz-selected', item === button));
  }));
});
