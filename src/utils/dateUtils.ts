import { ReportDateInfo } from '../types/reporting';

const DAY_NAMES = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];

/**
 * Get current date in Asia/Jakarta timezone
 */
export function getCurrentJakartaDate(): Date {
  const now = new Date();
  // Get string in Jakarta timezone
  const jakartaStr = now.toLocaleString('en-US', { timeZone: 'Asia/Jakarta' });
  return new Date(jakartaStr);
}

/**
 * Format a Date object or YYYY-MM-DD string into ReportDateInfo
 */
export function createReportDateInfo(inputDate?: Date | string): ReportDateInfo {
  let dateObj: Date;

  if (!inputDate) {
    dateObj = getCurrentJakartaDate();
  } else if (typeof inputDate === 'string') {
    // Parse YYYY-MM-DD cleanly without timezone offset shift
    const [year, month, day] = inputDate.split('-').map(Number);
    dateObj = new Date(year, month - 1, day);
  } else {
    dateObj = inputDate;
  }

  const year = dateObj.getFullYear();
  const monthNum = dateObj.getMonth() + 1;
  const dayNum = dateObj.getDate();

  const dayIndex = dateObj.getDay();
  const dayName = DAY_NAMES[dayIndex] || 'MON';

  const dd = String(dayNum).padStart(2, '0');
  const mm = String(monthNum).padStart(2, '0');
  const yyyy = String(year);

  const displayDate = `${dd}/${mm}/${yyyy}`;
  const isoDate = `${yyyy}-${mm}-${dd}`;
  const formatted = `${dayName}, ${displayDate}`;

  return {
    isoDate,
    dayName,
    displayDate,
    formatted,
  };
}

/**
 * Parses site text status symbol if already present or formats string with status symbol
 */
export function getStatusEmoji(status: string): string {
  switch (status) {
    case 'DONE':
      return '✅';
    case 'NOK':
      return '❌';
    case 'PROGRESS':
      return '⏳';
    case 'NA':
      return 'N/A';
    default:
      return '';
  }
}
