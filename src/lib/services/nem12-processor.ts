import type { ProcessingResult } from "../types";
import { NEM12Parser } from "../parsers/nem12-parser";
import {
  addRegisterSuffixes,
  sortByNMI,
} from "../processors/register-processor";
import { formatDateForRange } from "../utils/date-formatter";
import { generateSQLInserts } from "../generators/sql-generator";

/**
 * Main service class for processing NEM12 files
 */
export class NEM12ProcessorService {
  /**
   * Processes a NEM12 CSV file and returns the complete result
   */
  static async processFile(file: File): Promise<ProcessingResult> {
    const startTime = Date.now();

    try {
      // Read file content
      const content = await file.text();

      // Parse the NEM12 content
      const parser = new NEM12Parser();
      const { readings, errors } = parser.parseCSVContent(content);

      // Add register suffixes to maintain uniqueness
      const { processedReadings, duplicatesFound, registerStats } =
        addRegisterSuffixes(readings);

      // Sort by NMI (including register suffixes) and then by timestamp
      const sortedReadings = sortByNMI(processedReadings);

      // Generate SQL statements
      const sqlStatements = generateSQLInserts(sortedReadings);

      // Prepare summary
      const nmis = [...new Set(sortedReadings.map((r) => r.nmi.split("_")[0]))];
      const timestamps = sortedReadings.map((r) => r.timestamp);
      const sortedTimestamps = [...timestamps].sort(
        (a, b) => a.getTime() - b.getTime()
      );

      const dateRange = {
        start:
          sortedTimestamps.length > 0
            ? formatDateForRange(sortedTimestamps[0])
            : "",
        end:
          sortedTimestamps.length > 0
            ? formatDateForRange(sortedTimestamps[sortedTimestamps.length - 1])
            : "",
      };

      return {
        sqlStatements,
        summary: {
          totalRecords: readings.length,
          uniqueRecords: sortedReadings.length,
          duplicatesFound,
          registerStats,
          nmis,
          dateRange,
          processingTime: Date.now() - startTime,
        },
        errors,
      };
    } catch (error) {
      throw new Error(
        `Failed to process NEM12 file: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  }

  /**
   * Validates if a file is a valid CSV file
   */
  static validateFile(file: File): void {
    if (!file) {
      throw new Error("No file provided");
    }

    if (!file.name.toLowerCase().endsWith(".csv")) {
      throw new Error("File must be a CSV file");
    }
  }
}
