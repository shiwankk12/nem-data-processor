import type { NextRequest } from "next/server";

interface MeterReading {
  nmi: string;
  timestamp: Date;
  consumption: number;
  register?: string;
}

interface NEM12Context {
  currentNMI: string;
  intervalLength: number;
}

class NEM12Parser {
  private context: NEM12Context = {
    currentNMI: "",
    intervalLength: 30,
  };

  private readings: MeterReading[] = [];
  private errors: string[] = [];

  parseCSVContent(content: string): {
    readings: MeterReading[];
    errors: string[];
  } {
    const lines = content
      .split("\n")
      .map((line) => line.trim())
      .filter((line) => line.length > 0);

    lines.forEach((line, index) => {
      try {
        this.parseLine(line, index + 1);
      } catch (error) {
        this.errors.push(
          `Line ${index + 1}: ${
            error instanceof Error ? error.message : "Unknown error"
          }`
        );
      }
    });

    return {
      readings: this.readings,
      errors: this.errors,
    };
  }

  private parseLine(line: string, lineNumber: number): void {
    const fields = line.split(",").map((field) => field.trim());
    const recordType = fields[0];

    switch (recordType) {
      case "100":
        // Header record - validate format
        this.validateHeader(fields);
        break;

      case "200":
        // NMI data record
        this.parseNMIData(fields);
        break;

      case "300":
        // Interval data record
        this.parseIntervalData(fields);
        break;

      case "500":
        // End of NMI data
        this.context.currentNMI = "";
        break;

      case "900":
        // End of file
        break;

      default:
        // Unknown record type - log but don't fail
        console.warn(
          `Unknown record type: ${recordType} at line ${lineNumber}`
        );
    }
  }

  private validateHeader(fields: string[]): void {
    if (fields[1] !== "NEM12") {
      throw new Error("Invalid NEM12 format");
    }
  }

  private parseNMIData(fields: string[]): void {
    this.context.currentNMI = fields[1];
    this.context.intervalLength = parseInt(fields[8]) || 30;
  }

  private parseIntervalData(fields: string[]): void {
    if (!this.context.currentNMI) {
      throw new Error("Interval data found without NMI context");
    }

    const dateStr = fields[1];
    if (!dateStr || dateStr.length !== 8) {
      throw new Error("Invalid date format");
    }

    const baseDate = this.parseDate(fields[1]);

    // Each field represents a 30-minute interval (or whatever interval length is specified)
    // Process consumption values - calculate intervals based on interval length
    const maxIntervalsInDay = Math.floor(1440 / this.context.intervalLength);
    const maxIntervals = Math.min(maxIntervalsInDay, fields.length - 2);

    for (let i = 2; i < 2 + maxIntervals; i++) {
      const consumptionStr = fields[i];
      if (!consumptionStr || consumptionStr === "") continue;

      const consumption = parseFloat(consumptionStr);
      if (isNaN(consumption)) continue;

      // Include ALL consumption values including zeros

      // Calculate timestamp for this interval
      const intervalIndex = i - 2; // 0-based interval index
      const minutesOffset = intervalIndex * this.context.intervalLength;
      const timestamp = new Date(
        baseDate.getTime() + minutesOffset * 60 * 1000
      );

      this.readings.push({
        nmi: this.context.currentNMI,
        timestamp,
        consumption,
      });
    }
  }

  private parseDate(dateStr: string): Date {
    if (!dateStr || dateStr.length !== 8) {
      throw new Error("Invalid date format");
    }

    // Parse date (YYYYMMDD format)
    const year = parseInt(dateStr.substring(0, 4));
    const month = parseInt(dateStr.substring(4, 6)) - 1;
    const day = parseInt(dateStr.substring(6, 8));
    const date = new Date(year, month, day);

    if (isNaN(date.getTime())) {
      throw new Error(`Invalid date: ${dateStr}`);
    }

    return date;
  }
}

function formatDateTimeForSQL(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");
  const seconds = String(date.getSeconds()).padStart(2, "0");

  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
}

function formatDateForRange(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function addRegisterSuffixes(readings: MeterReading[]): {
  processedReadings: MeterReading[];
  duplicatesFound: number;
  registerStats: Record<string, number>;
} {
  const timestampMap = new Map<string, MeterReading[]>();
  let duplicatesFound = 0;
  const registerStats: Record<string, number> = {};

  // Group readings by NMI + timestamp
  for (const reading of readings) {
    const key = `${reading.nmi}|${reading.timestamp}`;

    if (!timestampMap.has(key)) {
      timestampMap.set(key, []);
    }
    // Group all readings with same NMI + timestamp
    timestampMap.get(key)!.push(reading);
  }

  const processedReadings: MeterReading[] = [];

  // Process each group and add register suffixes for duplicates
  for (const [, groupReadings] of timestampMap.entries()) {
    if (groupReadings.length === 1) {
      // No duplicates, keep as is without any suffix
      processedReadings.push(groupReadings[0]);
      registerStats["original"] = (registerStats["original"] || 0) + 1;
    } else {
      // Multiple readings for same NMI + timestamp - ALL get register suffixes
      duplicatesFound += groupReadings.length - 1;

      // Add register suffixes to ALL duplicate records (including the first one)
      groupReadings.forEach((reading, index) => {
        const registerSuffix = `R${index + 1}`; // R1, R2, R3, etc.
        const processedReading = {
          ...reading,
          nmi: `${reading.nmi}_${registerSuffix}`,
          register: registerSuffix,
        };
        processedReadings.push(processedReading);
        registerStats[registerSuffix] =
          (registerStats[registerSuffix] || 0) + 1;
      });
    }
  }

  return {
    processedReadings,
    duplicatesFound,
    registerStats,
  };
}

function sortByNMI(readings: MeterReading[]): MeterReading[] {
  return readings.sort((a, b) => {
    // Extract base NMI and register suffix for proper sorting
    const parseNMI = (nmi: string) => {
      const parts = nmi.split("_");
      const baseNMI = parts[0];
      const register = parts[1] || ""; // Empty string if no register suffix
      return { baseNMI, register };
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

function generateSQLInserts(readings: MeterReading[]): string[] {
  return readings.map((reading) => {
    const timestamp = formatDateTimeForSQL(reading.timestamp);

    return `INSERT INTO meter_readings (nmi, timestamp, consumption) VALUES ('${reading.nmi}', '${timestamp}', ${reading.consumption});`;
  });
}

export async function POST(request: NextRequest) {
  const startTime = Date.now();

  try {
    const formData = await request.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return new Response(JSON.stringify({ error: "No file provided" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

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
    const dateRange = {
      start: timestamps.length > 0 ? formatDateForRange(timestamps[0]) : "",
      end:
        timestamps.length > 0
          ? formatDateForRange(timestamps[timestamps.length - 1])
          : "",
    };

    const result = {
      sqlStatements,
      summary: {
        totalRecords: readings.length,
        uniqueRecords: sortedReadings.length,
        duplicatesFound: duplicatesFound,
        registerStats: registerStats,
        nmis,
        dateRange,
        processingTime: Date.now() - startTime,
      },
      errors,
    };

    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error processing file:", error);
    return new Response(
      JSON.stringify({
        error:
          error instanceof Error ? error.message : "Failed to process file",
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}
