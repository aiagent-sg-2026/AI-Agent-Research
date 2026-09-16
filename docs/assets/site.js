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

const resultData = { tokens: { label: 'tokens', unit: '', values: [74977.2, 81991.8, 106000.6, 96696.6], caption: 'B1 used 9.36% more tokens than B0; B2 used 41.38% more; FULL used 28.97% more.' }, latency: { label: 'latency', unit: ' ms', values: [60778.4, 52850.4, 59770.8, 61407.6], caption: 'B1 was 13.04% below B0 latency in this sample; FULL was 1.04% above. These are descriptive, not general rankings.' } };
const armLabels = ['B0', 'B1', 'B2', 'FULL'];

function renderChart(metric = 'tokens') {
  const data = resultData[metric];
  const max = Math.max(...data.values);
  const chart = document.querySelector('#bar-chart');
  chart.innerHTML = data.values.map((value, index) => `<div class="bar-item"><span class="bar-value">${Math.round(value).toLocaleString()}${data.unit}</span><span class="bar-fill" style="--height:${Math.max(9, value / max * 165)}px" role="img" aria-label="${armLabels[index]} ${Math.round(value).toLocaleString()}${data.unit}"></span><span class="bar-label">${armLabels[index]}</span></div>`).join('');
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
  renderChart();
  renderProtocols();
  document.querySelectorAll('.metric-button').forEach(button => button.addEventListener('click', () => renderChart(button.dataset.metric)));
  document.querySelectorAll('.filter-button').forEach(button => button.addEventListener('click', () => { document.querySelectorAll('.filter-button').forEach(item => item.classList.remove('is-active')); button.classList.add('is-active'); renderProtocols(); }));
  document.querySelector('#protocol-search').addEventListener('input', renderProtocols);
});
