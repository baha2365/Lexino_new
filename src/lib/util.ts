export function shuffle<T>(arr: readonly T[]): T[] {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export const sample = <T,>(arr: readonly T[], n: number): T[] => shuffle(arr).slice(0, n);
export const pick = <T,>(arr: readonly T[]): T => arr[Math.floor(Math.random() * arr.length)];
export const wait = (ms: number): Promise<void> => new Promise((r) => setTimeout(r, ms));
export const cx = (...parts: (string | false | null | undefined)[]): string => parts.filter(Boolean).join(' ');

const reduced = () => typeof matchMedia !== 'undefined' && matchMedia('(prefers-reduced-motion: reduce)').matches;

/** A little burst of stars from a point on screen. */
export function confetti(x: number, y: number, count = 18): void {
  if (reduced()) return;
  const colors = ['#ffc83d', '#ff6b57', '#3fb67c', '#26264f', '#4aa8ff'];
  for (let i = 0; i < count; i++) {
    const s = document.createElement('span');
    s.className = 'conf';
    s.textContent = '★';
    s.style.left = `${x}px`;
    s.style.top = `${y}px`;
    s.style.color = colors[i % colors.length];
    document.body.appendChild(s);
    const a = Math.random() * Math.PI * 2;
    const dist = 80 + Math.random() * 140;
    s.animate(
      [
        { transform: 'translate(-50%,-50%) scale(.4)', opacity: 1 },
        {
          transform: `translate(calc(-50% + ${Math.cos(a) * dist}px), calc(-50% + ${Math.sin(a) * dist - 60}px)) scale(1.3) rotate(${Math.random() * 360}deg)`,
          opacity: 0,
        },
      ],
      { duration: 800 + Math.random() * 400, easing: 'cubic-bezier(.2,.8,.3,1)' },
    ).onfinish = () => s.remove();
  }
}

export function confettiAtElement(el: Element | null, count?: number): void {
  if (!el) return confetti(window.innerWidth / 2, window.innerHeight / 2, count);
  const r = el.getBoundingClientRect();
  confetti(r.left + r.width / 2, r.top + r.height / 2, count);
}
