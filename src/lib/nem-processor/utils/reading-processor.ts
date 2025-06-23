import { NMI_PARSING } from "../constants";
import type { MeterReading, RegisterProcessingResult } from "../types";

/**
 * Utility class for processing meter readings
 */
export class ReadingProcessor {
  /**
   * Adds register suffixes to duplicate readings to maintain uniqueness
   */
  static addRegisterSuffixes(
    readings: MeterReading[]
  ): RegisterProcessingResult {
    const timestampMap = new Map<string, MeterReading[]>();
    let duplicatesFound = 0;
    const registerStats: Record<string, number> = {};

    // Group readings by NMI + timestamp
    for (const reading of readings) {
      const key = `${reading.nmi}|${reading.timestamp.toISOString()}`;
      if (!timestampMap.has(key)) {
        timestampMap.set(key, []);
      }
      timestampMap.get(key)!.push(reading);
    }

    const processedReadings: MeterReading[] = [];

    // Process each group of readings that share the same NMI + timestamp combination
    for (const [, groupReadings] of timestampMap.entries()) {
      if (groupReadings.length > 1) {
        duplicatesFound += groupReadings.length - 1;
        processedReadings.push(
          ...ReadingProcessor.processDuplicateGroup(
            groupReadings,
            registerStats
          )
        );
      } else {
        processedReadings.push(
          ...ReadingProcessor.processSingleReading(groupReadings, registerStats)
        );
      }
    }

    return { processedReadings, duplicatesFound, registerStats };
  }

  /**
   * Sorts readings by NMI (with proper register suffix handling) and timestamp
   */
  static sortByNMI(readings: MeterReading[]): MeterReading[] {
    return readings.sort((a, b) => {
      const parseNMI = (nmi: string) => {
        const parts = nmi.split(NMI_PARSING.SEPARATOR);
        return {
          baseNMI: parts[NMI_PARSING.INDICES.BASE_NMI],
          register: parts[NMI_PARSING.INDICES.REGISTER] || "",
        };
      };

      const aNMI = parseNMI(a.nmi);
      const bNMI = parseNMI(b.nmi);

      // First sort by base NMI
      if (aNMI.baseNMI !== bNMI.baseNMI) {
        return aNMI.baseNMI.localeCompare(bNMI.baseNMI);
      }

      // Then sort by register suffix (original records without suffix come first)
      if (aNMI.register !== bNMI.register) {
        // Original records (no suffix) come first
        if (aNMI.register === "" && bNMI.register !== "") return -1;
        if (aNMI.register !== "" && bNMI.register === "") return 1;
        // Both have register suffixes, sort them (R1, R2, R3, etc.)
        return aNMI.register.localeCompare(bNMI.register);
      }

      // Finally sort by timestamp within the same NMI+register group
      return a.timestamp.getTime() - b.timestamp.getTime();
    });
  }

  /**
   * Processes a single reading that has no duplicates
   */
  private static processSingleReading(
    groupReadings: MeterReading[],
    registerStats: Record<string, number>
  ): MeterReading[] {
    registerStats["original"] = (registerStats["original"] || 0) + 1;
    return groupReadings;
  }

  /**
   * Processes duplicate readings by adding register suffixes to maintain uniqueness
   */
  private static processDuplicateGroup(
    groupReadings: MeterReading[],
    registerStats: Record<string, number>
  ): MeterReading[] {
    return groupReadings.map((reading, index) => {
      // Generate register suffix (R1, R2, R3, etc.)
      const registerSuffix = `${NMI_PARSING.REGISTER_PREFIX}${index + 1}`;
      registerStats[registerSuffix] = (registerStats[registerSuffix] || 0) + 1;

      return {
        ...reading,
        nmi: `${reading.nmi}${NMI_PARSING.SEPARATOR}${registerSuffix}`, // Append suffix to make NMI unique
        register: registerSuffix,
      };
    });
  }
}
