export function splitAnalysis(text) {
  const source = typeof text === 'string' ? text : String(text ?? '');
  const marker = '--- Evaluation Summary ---';
  const index = source.indexOf(marker);
  if (index === -1) {
    return { body: source.trim(), evaluation: '' };
  }
  return {
    body: source.slice(0, index).trim(),
    evaluation: source.slice(index + marker.length).trim(),
  };
}

function readScore(evaluation, label) {
  const match = evaluation.match(new RegExp(`${label}\\s*:\\s*([\\d.]+)`, 'i'));
  return match ? Number(match[1]) : null;
}

export function parseEvaluation(evaluation) {
  if (!evaluation) return null;
  const overallMatch = evaluation.match(/Overall Confidence Score:\s*([\d.]+)/i);
  const justificationMatch = evaluation.match(/Justification:\s*([\s\S]+)/i);
  const overall = overallMatch ? Number(overallMatch[1]) : null;
  if (overall == null || Number.isNaN(overall)) return null;
  return {
    overall,
    relevance: readScore(evaluation, 'Relevance Score'),
    faithfulness: readScore(evaluation, 'Context Faithfulness Score'),
    clarity: readScore(evaluation, 'Clarity Score'),
    justification: justificationMatch?.[1]?.trim() || '',
  };
}

export function formatWhen(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value || '';
  return date.toLocaleString([], {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}
