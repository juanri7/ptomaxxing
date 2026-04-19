// PTO Maxxing — ICS Generator
// Produces RFC 5545 compliant .ics files

import { PTOPlan } from '../models/types';
import { addDays, formatMonthDay } from '../models/dateUtils';

function formatDateForICS(dateStr: string): string {
  return dateStr.replace(/-/g, ''); // 2025-11-27 → 20251127
}

function dtStamp(): string {
  return new Date().toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '').replace(/Z$/, 'Z');
}

function escapeICSText(text: string): string {
  return text
    .replace(/\\/g, '\\\\')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,')
    .replace(/\n/g, '\\n');
}

function createVEvent(
  uid: string,
  summary: string,
  description: string,
  dtStart: string,
  dtEnd: string,
  categories: string[],
  isOOF: boolean,
): string {
  const lines: string[] = [
    'BEGIN:VEVENT',
    `UID:${uid}`,
    `DTSTAMP:${dtStamp()}`,
    `DTSTART;VALUE=DATE:${dtStart}`,
    `DTEND;VALUE=DATE:${dtEnd}`,
    `SUMMARY:${escapeICSText(summary)}`,
    `DESCRIPTION:${escapeICSText(description)}`,
    `CATEGORIES:${categories.join(',')}`,
    'TRANSP:OPAQUE',
    'STATUS:CONFIRMED',
  ];

  if (isOOF) {
    lines.push('X-MICROSOFT-CDO-BUSYSTATUS:OOF');
  }

  lines.push('END:VEVENT');
  return lines.join('\r\n');
}

export function generateICS(plan: PTOPlan): string {
  const timezoneID = Intl.DateTimeFormat().resolvedOptions().timeZone;

  const lines: string[] = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//PTO Maxxing//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    `X-WR-CALNAME:PTO Maxxing - ${plan.name}`,
    `X-WR-TIMEZONE:${timezoneID}`,
  ];

  for (const brk of plan.breaks) {
    // OOO span event
    const oooUID = `${plan.type}-ooo-${formatDateForICS(brk.oooStart)}-${formatDateForICS(brk.oooEnd)}@ptomaxxing.app`;
    const oooStart = formatDateForICS(brk.oooStart);
    const oooEnd = formatDateForICS(addDays(brk.oooEnd, 1)); // DTEND is non-inclusive

    const holidayNames = brk.holidays.map(h => h.name).join(', ');
    const oooSummary = `Time Off (${holidayNames})`;
    const oooDescription = `PTO Maxxing break: ${formatMonthDay(brk.oooStart)} - ${formatMonthDay(brk.oooEnd)}\\n${brk.totalDaysOff} days off using ${brk.ptoUsed} PTO days`;

    lines.push(createVEvent(oooUID, oooSummary, oooDescription, oooStart, oooEnd, ['PTO Maxxing'], true));

    // Individual PTO day events
    for (const ptoDay of brk.ptoDays) {
      const ptoUID = `${plan.type}-pto-${formatDateForICS(ptoDay)}@ptomaxxing.app`;
      const ptoStart = formatDateForICS(ptoDay);
      const ptoEnd = formatDateForICS(addDays(ptoDay, 1));

      lines.push(createVEvent(ptoUID, 'PTO Day', `PTO day to request off for your ${plan.name} plan`, ptoStart, ptoEnd, ['PTO Maxxing', 'PTO'], false));
    }
  }

  lines.push('END:VCALENDAR');
  return lines.join('\r\n');
}

export function copyPTODates(plan: PTOPlan): string {
  const out: string[] = [];
  out.push(`${plan.name} - PTO Days to Request:\n`);

  for (const brk of plan.breaks) {
    const holidayNames = brk.holidays.map(h => h.name).join(', ');
    out.push(`Time off request: ${holidayNames} break:`);
    out.push(`Time off: ${formatMonthDay(brk.oooStart)} - ${formatMonthDay(brk.oooEnd)}`);
    out.push('Request these dates off:');

    for (const ptoDay of brk.ptoDays) {
      out.push(` - ${formatMonthDay(ptoDay)}`);
    }
    out.push('');
  }

  out.push(`Total: ${plan.totalDaysOff} days off using ${plan.totalPtoUsed} PTO days`);
  out.push(`Efficiency: ${plan.efficiency.toFixed(1)}x`);
  return out.join('\n');
}
