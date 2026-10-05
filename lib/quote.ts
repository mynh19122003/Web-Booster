/** Preview prices. Confirm a final quote before accepting payment. */
export function estimateQuote(
  current: number,
  target: number,
  queue: string,
  service = "rank-boost",
  units = 1,
  game = "league-of-legends",
) {
  const steps = Math.max(1, Math.min(37, target - current));
  const quantity = Math.max(1, Math.min(10, units));
  if (service === "coaching" || service === "placements") {
    const hours = service === "coaching" ? quantity : quantity * 2;
    return {
      price: Number(
        (quantity * (service === "coaching" ? 24 : 8.5)).toFixed(2),
      ),
      minHours: hours,
      maxHours: hours * 2,
    };
  }
  return {
    price: Number(
      (
        steps *
        (16.63 / (game === "valorant" ? 3 : 4)) *
        (queue === "Duo" ? 1.3 : 1)
      ).toFixed(2),
    ),
    minHours: steps,
    maxHours: steps * 2,
  };
}
