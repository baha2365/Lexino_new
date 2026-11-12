import { useState } from 'react';
import type { Card } from '../lib/content';

/** Photo if `card.image` exists in public/images/, otherwise the emoji placeholder. */
export function CardFace({ card, className }: { card: Pick<Card, 'emoji' | 'image' | 'word'>; className?: string }) {
  const [broken, setBroken] = useState(false);
  if (card.image && !broken) {
    return <img className={`face-img ${className ?? ''}`} src={`./images/${card.image}`} alt="" draggable={false} onError={() => setBroken(true)} />;
  }
  return (
    <span className={`face-emoji ${className ?? ''}`} aria-hidden="true">
      {card.emoji}
    </span>
  );
}
