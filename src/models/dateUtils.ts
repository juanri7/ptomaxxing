// PTO Maxxing — Date Utilities (UTC-safe, no timezone drift)

/**
 * All dates in this app are YYYY-MM-DD strings.
 * Date math is done by parsing to UTC midnight to avoid timezone issues.
 */

export function parseDate(dateStr: string): Date {
  const [y, m, d] = dateStr.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, d));
}

export function formatDate(date: Date): string {
  const y = date.getUTCFullYear();
  const m = String(date.getUTCMonth() + 1).padStart(2, '0');
  const d = String(date.getUTCDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function addDays(dateStr: string, days: number): string {
  const d = parseDate(dateStr);
  d.setUTCDate(d.getUTCDate() + days);
  return formatDate(d);
}

export function daysBetween(startStr: string, endStr: string): number {
  const s = parseDate(startStr);
  const e = parseDate(endStr);
  return Math.round((e.getTime() - s.getTime()) / (86400 * 1000));
}

/** weekday: 0=Sun, 1=Mon, ..., 6=Sat (UTC) */
export function weekdayIndexSun0(dateStr: string): number {
  return parseDate(dateStr).getUTCDay();
}

export function isWeekend(dateStr: string): boolean {
  const w = weekdayIndexSun0(dateStr);
  return w === 0 || w === 6;
}

export function isSameDay(a: string, b: string): boolean {
  return a === b;
}

export function isDateInRange(dateStr: string, ranges: { start: string; end: string }[]): boolean {
  return ranges.some(r => dateStr >= r.start && dateStr <= r.end);
}

export function isCompanyHoliday(dateStr: string, companyHolidays: { startDate: string; endDate: string }[]): boolean {
  return companyHolidays.some(h => dateStr >= h.startDate && dateStr <= h.endDate);
}

export function formatMonthDay(dateStr: string): string {
  const d = parseDate(dateStr);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' });
}

export function formatFullDay(dateStr: string): string {
  const d = parseDate(dateStr);
  return d.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
    timeZone: 'UTC',
  });
}

export function todayStr(): string {
  return formatDate(new Date());
}

/** Generate all dates between two strings inclusive */
export function dateRange(startStr: string, endStr: string): string[] {
  const dates: string[] = [];
  let current = startStr;
  while (current <= endStr) {
    dates.push(current);
    current = addDays(current, 1);
  }
  return dates;
}
