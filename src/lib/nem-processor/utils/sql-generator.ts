import type { MeterReading } from "../types";
import { DateFormatter } from "./date-formatter";
import { v4 as uuidv4 } from "uuid";

export class SQLGenerator {
  private readonly dateFormatter = new DateFormatter();

  generateInserts(readings: MeterReading[]): string[] {
    return readings.map((reading) => {
      const timestamp = this.dateFormatter.formatDateTimeForSQL(
        reading.timestamp
      );
      const id = uuidv4();
      return `INSERT INTO meter_readings (id, nmi, timestamp, consumption) VALUES ('${id}','${reading.nmi}', '${timestamp}', ${reading.consumption});`;
    });
  }
}
