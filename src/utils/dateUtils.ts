import { ReportDateInfo } from '../types/reporting';

const DAY_NAMES_EN = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
const DAY_NAMES_ID = ['MINGGU', 'SENIN', 'SELASA', 'RABU', 'KAMIS', 'JUMAT', 'SABTU'];

/**
 * Get current date in Asia/Jakarta timezone (WIB UTC+7)
 */
export function getCurrentJakartaDate(): Date {
  const now = new Date();
  const options: Intl.DateTimeFormatOptions = {
    timeZone: 'Asia/Jakarta',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  };

  try {
    const formatter = new Intl.DateTimeFormat('en-US', options);
    const parts = formatter.formatToParts(now);
    let year = now.getFullYear();
    let month = now.getMonth() + 1;
    let day = now.getDate();
    let hour = now.getHours();
    let minute = now.getMinutes();
    let second = now.getSeconds();

    parts.forEach((p) => {
      if (p.type === 'year') year = parseInt(p.value, 10);
      if (p.type === 'month') month = parseInt(p.value, 10);
      if (p.type === 'day') day = parseInt(p.value, 10);
      if (p.type === 'hour') hour = parseInt(p.value, 10);
      if (p.type === 'minute') minute = parseInt(p.value, 10);
      if (p.type === 'second') second = parseInt(p.value, 10);
    });

    return new Date(year, month - 1, day, hour, minute, second);
  } catch (err) {
    // Fallback if Intl fails
    const utc7Time = now.getTime() + (now.getTimezoneOffset() + 420) * 60000;
    return new Date(utc7Time);
  }
}

/**
 * Get real-time WIB clock string (e.g., "14:30:45 WIB")
 */
export function getCurrentWibClockString(): string {
  const d = getCurrentJakartaDate();
  const hh = String(d.getHours()).padStart(2, '0');
  const mm = String(d.getMinutes()).padStart(2, '0');
  const ss = String(d.getSeconds()).padStart(2, '0');
  return `${hh}:${mm}:${ss} WIB`;
}

/**
 * Format a Date object or YYYY-MM-DD string into ReportDateInfo in WIB
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
  const dayNameEn = DAY_NAMES_EN[dayIndex] || 'MON';
  const dayNameId = DAY_NAMES_ID[dayIndex] || 'SENIN';

  const dd = String(dayNum).padStart(2, '0');
  const mm = String(monthNum).padStart(2, '0');
  const yyyy = String(year);

  const displayDate = `${dd}/${mm}/${yyyy}`;
  const isoDate = `${yyyy}-${mm}-${dd}`;
  const formatted = `${dayNameEn}, ${displayDate}`;

  return {
    isoDate,
    dayName: dayNameEn,
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

