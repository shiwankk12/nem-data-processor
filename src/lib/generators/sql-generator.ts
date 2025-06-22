import type { MeterReading } from "../types";
import { formatDateTimeForSQL } from "../utils/date-formatter";
import { v4 as uuidv4 } from "uuid";

/**
 * Generates SQL INSERT statements from meter readings
 */
export function generateSQLInserts(readings: MeterReading[]): string[] {
  return readings.map((reading) => {
    const timestamp = formatDateTimeForSQL(reading.timestamp);
    const id = uuidv4();
    return `INSERT INTO meter_readings (id, nmi, timestamp, consumption) VALUES ('${id}','${reading.nmi}', '${timestamp}', ${reading.consumption});`;
  });
}
