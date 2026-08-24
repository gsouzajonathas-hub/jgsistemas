export function formatDate(value: string | null | undefined): string {
  if (!value) return '-';
  const m = String(value).slice(0, 10).split('-');
  if (m.length !== 3 || m[0].length !== 4 || m[1].length !== 2 || m[2].length !== 2) {
    return String(value);
  }
  const [y, mo, d] = m;
  return `${d}-${mo}-${y}`;
}
