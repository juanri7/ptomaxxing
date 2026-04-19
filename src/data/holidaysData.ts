// PTO Maxxing — Holiday Data Loader
import holidaysJSON from './holidays.json';
import { Holiday } from '../models/types';

export function loadHolidays(): Holiday[] {
  return holidaysJSON.holidays.map(h => ({
    name: h.name,
    date: h.date,
    observedDate: h.observedDate,
  }));
}
