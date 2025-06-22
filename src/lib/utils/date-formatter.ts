/**
 * Formats a Date object for SQL timestamp format (YYYY-MM-DD HH:MM:SS)
 */
export function formatDateTimeForSQL(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");
  const seconds = String(date.getSeconds()).padStart(2, "0");

  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
}

/**
 * Formats a Date object for date range display (YYYY-MM-DD)
 */
export function formatDateForRange(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

/**
 * Parses a date string in YYYYMMDD format to a Date object
 */
export function parseNEM12Date(dateStr: string): Date {
  if (!dateStr || dateStr.length !== 8) {
    throw new Error("Invalid date format - expected YYYYMMDD");
  }

  const year = Number.parseInt(dateStr.substring(0, 4));
  const month = Number.parseInt(dateStr.substring(4, 6)) - 1; // Month is 0-based
  const day = Number.parseInt(dateStr.substring(6, 8));
  const date = new Date(year, month, day);

  if (isNaN(date.getTime())) {
    throw new Error(`Invalid date: ${dateStr}`);
  }

  return date;
}
