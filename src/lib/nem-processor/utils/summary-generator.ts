import type { MeterReading, ProcessingSummary } from "../types";
import { DateFormatter } from "./date-formatter";

/**
 * Utility class for generating processing summaries
 */
export class SummaryGenerator {
  private static readonly dateFormatter = new DateFormatter();

  /**
   * Generates a processing summary from readings and processing results
   */
  static generateSummary(
    originalReadings: MeterReading[],
    processedReadings: MeterReading[],
    duplicatesFound: number,
    registerStats: Record<string, number>,
    startTime: number
  ): ProcessingSummary {
    const nmis = this.extractUniqueNMIs(processedReadings);
    const dateRange = this.calculateDateRange(processedReadings);

    return {
      totalRecords: originalReadings.length,
      uniqueRecords: processedReadings.length,
      duplicatesFound,
      registerStats,
      nmis,
      dateRange,
      processingTime: Date.now() - startTime,
    };
  }

  /**
   * Extracts unique base NMIs (without register suffixes)
   */
  private static extractUniqueNMIs(readings: MeterReading[]): string[] {
    const baseNMIs = readings.map((reading) => reading.nmi.split("_")[0]);
    return [...new Set(baseNMIs)];
  }

  /**
   * Calculates the date range from readings timestamps
   */
  private static calculateDateRange(readings: MeterReading[]) {
    if (readings.length === 0) {
      return { start: "", end: "" };
    }

    const timestamps = readings.map((reading) => reading.timestamp);
    const sortedTimestamps = [...timestamps].sort(
      (a, b) => a.getTime() - b.getTime()
    );

    return {
      start: this.dateFormatter.formatDateForRange(sortedTimestamps[0]),
      end: this.dateFormatter.formatDateForRange(
        sortedTimestamps[sortedTimestamps.length - 1]
      ),
    };
  }
}
