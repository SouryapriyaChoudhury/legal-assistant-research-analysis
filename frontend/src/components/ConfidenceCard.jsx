export default function ConfidenceCard({ evaluation }) {
  const width = `${Math.max(0, Math.min(100, (evaluation.overall / 5) * 100))}%`;
  const details = [
    ['Relevance', evaluation.relevance],
    ['Faithfulness', evaluation.faithfulness],
    ['Clarity', evaluation.clarity],
  ].filter(([, value]) => typeof value === 'number' && !Number.isNaN(value));

  return (
    <div className="mt-5 rounded-2xl border border-line bg-paper px-4 py-3">
      <div className="flex items-end justify-between gap-4">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-brass">
            Confidence
          </p>
          <p className="font-serif text-2xl text-pine">
            {evaluation.overall.toFixed(2)}
            <span className="ml-1 text-base text-mist">/ 5</span>
          </p>
        </div>
        <p className="max-w-[14rem] text-right text-xs leading-5 text-mist">
          60% model review, 40% semantic similarity
        </p>
      </div>
      <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-line">
        <div className="h-full rounded-full bg-pine" style={{ width }} />
      </div>
      {details.length > 0 && (
        <div className="mt-3 grid grid-cols-3 gap-2 text-xs text-mist">
          {details.map(([label, value]) => (
            <div key={label}>
              <p className="uppercase tracking-wide">{label}</p>
              <p className="font-semibold text-ink">{value.toFixed(2)}</p>
            </div>
          ))}
        </div>
      )}
      {evaluation.justification && (
        <p className="mt-3 text-sm leading-6 text-ink/80">{evaluation.justification}</p>
      )}
    </div>
  );
}
