// PTO Maxxing — Data Models

export type PlanStrategy = 'max-efficiency' | 'max-continuous' | 'balanced';
export type WeekendPreference = 'friday-heavy' | 'midweek' | 'none';

export interface DateRange {
  start: string; // ISO date string YYYY-MM-DD
  end: string;
}

export interface Holiday {
  name: string;
  date: string;       // original date from dataset
  observedDate: string; // date used by solver
}

export interface CompanyHoliday {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
}

export interface Break {
  oooStart: string;
  oooEnd: string;
  ptoDays: string[];
  totalDaysOff: number;
  ptoUsed: number;
  holidays: Holiday[];
}

export interface PTOPlan {
  type: PlanStrategy;
  name: string;
  description: string;
  breaks: Break[];
  totalDaysOff: number;
  totalPtoUsed: number;
  efficiency: number;
  longestBreak: number;
}

export interface PlannerSettings {
  ptoAvailable: number;
  startDate: string;
  endDate: string;
  blackoutRanges: DateRange[];
  includeFridayAfterThanksgiving: boolean;
  weekendPreference: WeekendPreference;
  maxConsecutiveDays: number | null;
  companyHolidays: CompanyHoliday[];
  selectedStrategy: PlanStrategy;
}

export interface ParsedHoliday {
  name: string;
  startDate: string;
  endDate: string;
}

export const DEFAULT_SETTINGS: PlannerSettings = {
  ptoAvailable: 15,
  startDate: new Date().toISOString().split('T')[0],
  endDate: `${new Date().getFullYear()}-12-31`,
  blackoutRanges: [],
  includeFridayAfterThanksgiving: true,
  weekendPreference: 'none',
  maxConsecutiveDays: null,
  companyHolidays: [],
  selectedStrategy: 'max-efficiency',
};
