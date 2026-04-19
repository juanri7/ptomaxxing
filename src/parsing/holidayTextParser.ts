// PTO Maxxing — Holiday Text Parser
// Ported from Swift HolidayTextParser (originally from parseHolidayText.ts)

import { ParsedHoliday } from '../models/types';

const DATE_FORMATS = [
  'MMMM d, yyyy', 'MMMM d yyyy',
  'MMM d, yyyy', 'MMM d yyyy',
  'MMMM d', 'MMM d',
  'M/d/yyyy', 'MM/dd/yyyy',
  'M/d/yy', 'MM/dd/yy',
  'M-d-yyyy', 'MM-dd-yyyy',
  'yyyy-MM-dd',
  'd MMMM yyyy', 'd MMMM',
  'd MMM yyyy', 'd MMM',
];

const MONTH_NAMES: Record<string, number> = {
  jan: 1, january: 1, feb: 2, february: 2, mar: 3, march: 3,
  apr: 4, april: 4, may: 5, jun: 6, june: 6,
  jul: 7, july: 7, aug: 8, august: 8, sep: 9, sept: 9, september: 9,
  oct: 10, october: 10, nov: 11, november: 11, dec: 12, december: 12,
};

function hasYear(fmt: string): boolean {
  return fmt.includes('y');
}

function tryParseDate(dateStr: string, referenceYear: number): string | null {
  const cleaned = dateStr.trim();
  if (!cleaned) return null;

  // Try ISO format first
  const isoMatch = cleaned.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
  if (isoMatch) {
    const [, y, m, d] = isoMatch;
    return `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
  }

  // Try M/D/YYYY or M-D-YYYY
  const slashMatch = cleaned.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2,4})$/);
  if (slashMatch) {
    let [, m, d, y] = slashMatch;
    if (y.length === 2) y = (parseInt(y) > 50 ? '19' : '20') + y;
    return `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
  }

  // Try "Month Day, Year" / "Month Day Year" / "Mon D" / "Month D"
  const monthDayYearMatch = cleaned.match(
    /^(Jan(?:uary)?|Feb(?:ruary)?|Mar(?:ch)?|Apr(?:il)?|May|Jun(?:e)?|Jul(?:y)?|Aug(?:ust)?|Sep(?:t(?:ember)?)?|Oct(?:ober)?|Nov(?:ember)?|Dec(?:ember)?)\.?\s+(\d{1,2}),?\s*(?:(\d{4}))?$/i
  );
  if (monthDayYearMatch) {
    const [, monthStr, dayStr, yearStr] = monthDayYearMatch;
    const month = MONTH_NAMES[monthStr.toLowerCase().replace('.', '')];
    if (month) {
      const year = yearStr ? parseInt(yearStr) : referenceYear;
      const day = parseInt(dayStr);
      return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    }
  }

  // Try "D Month Year" / "D Month"
  const dayMonthMatch = cleaned.match(
    /^(\d{1,2})\s+(Jan(?:uary)?|Feb(?:ruary)?|Mar(?:ch)?|Apr(?:il)?|May|Jun(?:e)?|Jul(?:y)?|Aug(?:ust)?|Sep(?:t(?:ember)?)?|Oct(?:ober)?|Nov(?:ember)?|Dec(?:ember)?)\.?\s*(?:(\d{4}))?$/i
  );
  if (dayMonthMatch) {
    const [, dayStr, monthStr, yearStr] = dayMonthMatch;
    const month = MONTH_NAMES[monthStr.toLowerCase().replace('.', '')];
    if (month) {
      const year = yearStr ? parseInt(yearStr) : referenceYear;
      const day = parseInt(dayStr);
      return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    }
  }

  return null;
}

const DATE_RANGE_REGEX = /(\w+\.?\s*\d{1,2}(?:,?\s*\d{4})?)\s*(?:-|–|—|to)\s*(\w+\.?\s*\d{1,2}(?:,?\s*\d{4})?)/gi;

const SINGLE_DATE_REGEX = /(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4}|\d{4}[\/\-]\d{1,2}[\/\-]\d{1,2}|\w+\.?\s+\d{1,2}(?:,?\s*\d{4})?|\d{1,2}\s+\w+\.?(?:\s+\d{4})?)/g;

const HEADER_REGEX = /^(holiday|date|name|company|2\d{3}|observed)/i;

function trimSeparators(s: string): string {
  return s.replace(/^[\s\-–—:,]+|[\s\-–—:,]+$/g, '');
}

function parseName(line: string, removing: string[]): string {
  let name = line;
  for (const p of removing) {
    name = name.replace(p, '');
  }
  name = trimSeparators(name).trim();
  return name || 'Holiday';
}

function keyForDedup(name: string, date: string): string {
  return `${name.toLowerCase()}-${date}`;
}

export function parseHolidayText(text: string): ParsedHoliday[] {
  const holidays: ParsedHoliday[] = [];
  const lines = text.split('\n').filter(l => l.trim().length >= 3);
  const referenceYear = new Date().getUTCFullYear() + 1;

  for (const line of lines) {
    const trimmedLine = line.trim();
    if (trimmedLine.length < 3) continue;
    if (HEADER_REGEX.test(trimmedLine)) continue;

    // Date range first
    const rangeMatch = DATE_RANGE_REGEX.exec(trimmedLine);
    if (rangeMatch) {
      const full = rangeMatch[0];
      const startPiece = rangeMatch[1];
      const endPiece = rangeMatch[2];

      let startDate = tryParseDate(startPiece, referenceYear);
      let endDate = tryParseDate(endPiece, referenceYear);

      if (startDate && endDate) {
        if (endDate < startDate) {
          // Cross-year range (e.g., Dec 23 - Jan 2)
          const [y] = endDate.split('-').map(Number);
          endDate = `${y + 1}-${endDate.slice(5)}`;
        }
        const name = parseName(trimmedLine, [full]);
        holidays.push({ name, startDate, endDate });
        continue;
      }
    }

    // Reset regex state
    DATE_RANGE_REGEX.lastIndex = 0;

    // Single dates
    SINGLE_DATE_REGEX.lastIndex = 0;
    const matches = [...trimmedLine.matchAll(SINGLE_DATE_REGEX)];

    if (matches.length === 0) continue;

    const firstDateStr = matches[0][0];
    const date = tryParseDate(firstDateStr, referenceYear);
    if (!date) continue;

    let name = parseName(trimmedLine, [firstDateStr]);

    if (matches.length > 1) {
      const secondDateStr = matches[1][0];
      const endDate = tryParseDate(secondDateStr, referenceYear);
      if (endDate && endDate > date) {
        name = parseName(trimmedLine, [firstDateStr, secondDateStr]);
        holidays.push({ name, startDate: date, endDate });
        continue;
      }
    }

    holidays.push({ name, startDate: date, endDate: date });
  }

  // Deduplicate by name + date
  const seen = new Set<string>();
  return holidays.filter(h => {
    const key = keyForDedup(h.name, h.startDate);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}
