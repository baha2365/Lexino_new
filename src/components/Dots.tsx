export function Dots({ total, done, now }: { total: number; done: number; now?: number }) {
  return (
    <ol className="dots" aria-label="Progress">
      {Array.from({ length: total }, (_, i) => (
        <li key={i} className={`dot ${i < done ? 'done' : ''} ${i === (now ?? done) ? 'now' : ''}`} />
      ))}
    </ol>
  );
}
