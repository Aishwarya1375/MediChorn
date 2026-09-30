export function parseIsoDate(dateStr: string | null): Date | null {
  if (!dateStr) return null;
  // Handles YYYY-MM-DD, YYYY-MM, YYYY
  const parts = dateStr.split('-');
  const year = parseInt(parts[0], 10);
  const month = parts.length > 1 ? parseInt(parts[1], 10) - 1 : 0;
  const day = parts.length > 2 ? parseInt(parts[2], 10) : 1;
  if (isNaN(year)) return null;
  return new Date(Date.UTC(year, month, day));
}

const MONTH_NAMES_SHORT = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
];

const MONTH_NAMES_FULL = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

export function formatDate(
  dateStr: string | null,
  precision: 'day' | 'month' | 'year' | 'unknown' = 'day'
): string {
  if (!dateStr) return 'Undated';
  const parts = dateStr.split('-');
  const year = parts[0];
  const monthIdx = parts.length > 1 ? parseInt(parts[1], 10) - 1 : null;
  const day = parts.length > 2 ? parseInt(parts[2], 10) : null;

  if (precision === 'year' || monthIdx === null || isNaN(monthIdx) || monthIdx < 0 || monthIdx > 11) {
    return year;
  }
  const monthName = MONTH_NAMES_SHORT[monthIdx] || '';
  if (precision === 'month' || day === null || isNaN(day)) {
    return `${monthName} ${year}`;
  }
  return `${day} ${monthName} ${year}`;
}

export function formatMonthHeader(monthKey: string): string {
  // monthKey format: "YYYY-MM" or "YYYY"
  const parts = monthKey.split('-');
  const year = parts[0];
  if (parts.length > 1) {
    const monthIdx = parseInt(parts[1], 10) - 1;
    return `${MONTH_NAMES_FULL[monthIdx] || ''} ${year}`;
  }
  return year;
}

export function getMonthKey(dateStr: string | null): string {
  if (!dateStr) return 'undated';
  const parts = dateStr.split('-');
  if (parts.length >= 2) {
    return `${parts[0]}-${parts[1].padStart(2, '0')}`;
  }
  return parts[0];
}

export function getDifferenceInDays(startStr: string, endStr: string): number {
  const d1 = parseIsoDate(startStr);
  const d2 = parseIsoDate(endStr);
  if (!d1 || !d2) return 0;
  const msPerDay = 1000 * 60 * 60 * 24;
  return Math.round((d2.getTime() - d1.getTime()) / msPerDay);
}

export function formatDateRange(startStr: string, endStr: string): string {
  const p1 = startStr.split('-');
  const p2 = endStr.split('-');

  const d1 = p1.length > 2 ? parseInt(p1[2], 10) : '';
  const m1 = p1.length > 1 ? MONTH_NAMES_SHORT[parseInt(p1[1], 10) - 1] : '';
  const y1 = p1[0];

  const d2 = p2.length > 2 ? parseInt(p2[2], 10) : '';
  const m2 = p2.length > 1 ? MONTH_NAMES_SHORT[parseInt(p2[1], 10) - 1] : '';
  const y2 = p2[0];

  if (y1 === y2) {
    if (m1 === m2) {
      return `${d1} – ${d2} ${m2} ${y2}`;
    }
    return `${d1} ${m1} – ${d2} ${m2} ${y2}`;
  }
  return `${d1} ${m1} ${y1} – ${d2} ${m2} ${y2}`;
}
