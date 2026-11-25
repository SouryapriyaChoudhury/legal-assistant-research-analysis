function Inline({ text }) {
  const parts = text.split(/(\*\*[^*]+\*\*|\*[^*\n]+\*)/g);
  return parts.map((part, index) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return <strong key={index}>{part.slice(2, -2)}</strong>;
    }
    if (part.startsWith('*') && part.endsWith('*')) {
      return <em key={index}>{part.slice(1, -1)}</em>;
    }
    return <span key={index}>{part}</span>;
  });
}

export default function AnalysisBody({ text }) {
  const blocks = (text || '').split(/\n{2,}/).map((block) => block.trim()).filter(Boolean);

  return (
    <div className="analysis-body text-[15.5px] leading-7 text-ink">
      {blocks.map((block, index) => {
        const lines = block.split('\n').map((line) => line.trim()).filter(Boolean);
        const isList = lines.every((line) => /^([-*•]|\d+[.)])\s+/.test(line));
        if (isList) {
          return (
            <ul key={index}>
              {lines.map((line) => (
                <li key={line}>
                  <Inline text={line.replace(/^([-*•]|\d+[.)])\s+/, '')} />
                </li>
              ))}
            </ul>
          );
        }
        return (
          <p key={index}>
            {lines.map((line, lineIndex) => (
              <span key={line}>
                {lineIndex > 0 && <br />}
                <Inline text={line} />
              </span>
            ))}
          </p>
        );
      })}
    </div>
  );
}
