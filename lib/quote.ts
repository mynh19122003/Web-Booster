/** Illustrative USD estimate only. A live service must calculate quotes server-side. */
export function estimateQuote(current: number, target: number, queue: string) {
  const steps = Math.max(1, Math.min(7, target - current));
  return {
    price: Number((steps * 16.63 * (queue === "Duo" ? 1.3 : 1)).toFixed(2)),
    minHours: steps * 4,
    maxHours: steps * 8,
  };
}
