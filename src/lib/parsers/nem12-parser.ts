import { NEM12_RECORD_TYPES } from "../constants";
import type { MeterReading, NEM12Context } from "../types";
import { parseNEM12Date } from "../utils/date-formatter";

export class NEM12Parser {
  private context: NEM12Context = {
    currentNMI: "",
    intervalLength: 30,
  };

  private readings: MeterReading[] = [];
  private errors: string[] = [];

  /**
   * Parses NEM12 CSV content and returns readings and errors
   */
  parseCSVContent(content: string): {
    readings: MeterReading[];
    errors: string[];
  } {
    // Reset state for new parsing
    this.readings = [];
    this.errors = [];
    this.context = { currentNMI: "", intervalLength: 30 };

    const lines = content
      .split("\n")
      .map((line) => line.trim())
      .filter((line) => line.length > 0);

    lines.forEach((line, index) => {
      try {
        this.parseLine(line);
      } catch (error) {
        this.errors.push(
          `Line ${index + 1}: ${
            error instanceof Error ? error.message : "Unknown error"
          }`
        );
      }
    });

    return {
      readings: [...this.readings], // Return copy to prevent mutation
      errors: [...this.errors],
    };
  }

  private parseLine(line: string): void {
    const fields = line.split(",").map((field) => field.trim());
    const recordType = fields[0];

    switch (recordType) {
      case NEM12_RECORD_TYPES.HEADER:
        // Header record - validate format
        this.validateHeader(fields);
        break;

      case NEM12_RECORD_TYPES.NMI_DATA:
        // NMI data record
        this.parseNMIData(fields);
        break;

      case NEM12_RECORD_TYPES.INTERVAL_DATA:
        // Interval data record
        this.parseIntervalData(fields);
        break;

      case NEM12_RECORD_TYPES.END_NMI:
        // End of NMI data
        this.context.currentNMI = "";
        break;

      case NEM12_RECORD_TYPES.END_FILE:
        // End of file
        break;

      default:
        // Unknown record type
        throw new Error(`Unknown record type: ${recordType}`);
    }
  }

  private validateHeader(fields: string[]): void {
    if (fields.length < 2 || fields[1] !== "NEM12") {
      throw new Error("Invalid NEM12 format - expected NEM12 in header");
    }
  }

  private parseNMIData(fields: string[]): void {
    this.context.currentNMI = fields[1];
    this.context.intervalLength = Number.parseInt(fields[8]) || 30;
  }

  private parseIntervalData(fields: string[]): void {
    if (!this.context.currentNMI) {
      throw new Error("Interval data found without NMI context");
    }

    const baseDate = parseNEM12Date(fields[1]);

    // Calculate maximum possible intervals in a 24-hour day based on interval length
    // e.g., for 30-minute intervals: 24 * 60 / 30 = 48 intervals per day
    const maxIntervalsInDay = Math.floor(
      (24 * 60) / this.context.intervalLength
    );

    // Extract only the consumption data fields (starting from index 2)
    // Limit to maxIntervalsInDay to prevent processing beyond valid daily intervals
    const consumptionFields = fields.slice(2, 2 + maxIntervalsInDay);

    // Transform consumption strings into MeterReading objects
    const newReadings = consumptionFields
      .map((consumptionStr, index) =>
        this.createReading(consumptionStr, index, baseDate)
      )
      .filter((reading): reading is MeterReading => reading !== null);

    this.readings.push(...newReadings);
  }

  private createReading(
    consumptionStr: string,
    intervalIndex: number,
    baseDate: Date
  ): MeterReading | null {
    if (!consumptionStr?.trim()) return null;

    const consumption = Number.parseFloat(consumptionStr);
    if (isNaN(consumption)) return null;

    // Calculate timestamp for this interval
    const minutesOffset = intervalIndex * this.context.intervalLength;
    const timestamp = new Date(baseDate.getTime() + minutesOffset * 60 * 1000);

    return {
      nmi: this.context.currentNMI,
      timestamp,
      consumption,
    };
  }
}
