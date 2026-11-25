/** Round steps that cover the values. Always includes zero unless `fromZero` is false. */
export function niceTicks(values: number[], count = 4, fromZero = true): number[] {
  const real = values.filter(Number.isFinite);
  let min = Math.min(...real, ...(fromZero ? [0] : []));
  let max = Math.max(...real, ...(fromZero ? [0] : []));
  if (!Number.isFinite(min)) return [0, 1];
  if (min === max) {
    // One flat value still needs a scale.
    if (max === 0) max = 1;
    else if (max > 0) min = fromZero ? 0 : min - Math.abs(min) * 0.1;
    else max = 0;
  }
  const raw = (max - min) / count;
  const power = 10 ** Math.floor(Math.log10(raw));
  const step = ([1, 2, 2.5, 5, 10].find((n) => n * power >= raw) ?? 10) * power;
  const ticks: number[] = [];
  for (let i = Math.floor(min / step); i <= Math.ceil(max / step); i++) {
    ticks.push(Number((i * step).toPrecision(12)));
  }
  return ticks;
}

/** A line through the points; nothing is drawn across missing values. */
export function linePath(points: ([number, number] | null)[]): string {
  let path = '';
  let pen = false;
  for (const point of points) {
    if (point) path += `${pen ? 'L' : 'M'}${point[0].toFixed(1)},${point[1].toFixed(1)}`;
    pen = !!point;
  }
  return path;
}

/** A bar with rounded corners only at its data end. */
export function barPath(x: number, y: number, width: number, height: number, end: 'top' | 'bottom' | 'right' | 'left' | 'none') {
  const r = end === 'none' ? 0 : Math.min(4, width / 2, height / 2);
  const tl = end === 'top' || end === 'left' ? r : 0;
  const tr = end === 'top' || end === 'right' ? r : 0;
  const br = end === 'bottom' || end === 'right' ? r : 0;
  const bl = end === 'bottom' || end === 'left' ? r : 0;
  return (
    `M${x + tl},${y}h${width - tl - tr}a${tr},${tr} 0 0 1 ${tr},${tr}v${height - tr - br}` +
    `a${br},${br} 0 0 1 ${-br},${br}h${-(width - br - bl)}a${bl},${bl} 0 0 1 ${-bl},${-bl}v${-(height - bl - tl)}a${tl},${tl} 0 0 1 ${tl},${-tl}z`
  );
}

/** A slice of a ring. Angles in turns, 0 at the top. */
export function ringPath(center: number, outer: number, inner: number, from: number, to: number) {
  // A full circle has no start and end, so leave a hair open.
  const end = Math.min(to, from + 0.9999);
  const at = (turn: number, r: number) => {
    const a = (turn - 0.25) * Math.PI * 2;
    return `${(center + r * Math.cos(a)).toFixed(2)},${(center + r * Math.sin(a)).toFixed(2)}`;
  };
  const large = end - from > 0.5 ? 1 : 0;
  return `M${at(from, outer)}A${outer},${outer} 0 ${large} 1 ${at(end, outer)}L${at(end, inner)}A${inner},${inner} 0 ${large} 0 ${at(from, inner)}Z`;
}
