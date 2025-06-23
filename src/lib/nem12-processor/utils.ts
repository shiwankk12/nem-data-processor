import { MeterReading } from "../nem-processor/types";
import {
  COLUMN_INDICES,
  DATE_FORMAT_INDICES,
  DEFAULT_INTERVAL_LENGTH,
  FIELD_DELIMITER,
  MILLISECONDS_PER_MINUTE,
  MINUTES_IN_A_DAY,
  NEM_FORMAT,
  RECORD_TYPES,
} from "./constants";
import { NEM12Context } from "./types";

/**
 * Parses a date string in YYYYMMDD format to a Date object (NEM12 specific)
 */
export const parseNEM12Date = (dateStr: string): Date => {
  if (!dateStr || dateStr.length !== 8) {
    throw new Error("Invalid NEM12 date format - expected YYYYMMDD");
  }

  const year = Number.parseInt(
    dateStr.substring(
      DATE_FORMAT_INDICES.YEAR_START,
      DATE_FORMAT_INDICES.YEAR_END
    )
  );
  const month =
    Number.parseInt(
      dateStr.substring(
        DATE_FORMAT_INDICES.MONTH_START,
        DATE_FORMAT_INDICES.MONTH_END
      )
    ) - 1;
  const day = Number.parseInt(
    dateStr.substring(
      DATE_FORMAT_INDICES.DAY_START,
      DATE_FORMAT_INDICES.DAY_END
    )
  );
  const date = new Date(year, month, day);

  if (isNaN(date.getTime())) {
    throw new Error(`Invalid NEM12 date: ${dateStr}`);
  }

  return date;
};

export const parseNEM12Line = (line: string, context: NEM12Context) => {
  try {
    const fields = line.split(FIELD_DELIMITER).map((field) => field.trim());
    const recordType = fields[COLUMN_INDICES.RECORD_TYPE];

    switch (recordType) {
      case RECORD_TYPES.HEADER:
        // Header record - validate format
        validateHeader(fields);
        return { newReadings: [] };

      case RECORD_TYPES.NMI_DATA:
        // NMI data record
        context.currentNMI = fields[COLUMN_INDICES.NMI];
        context.intervalLength =
          Number.parseInt(fields[COLUMN_INDICES.INTERVAL_LENGTH]) ||
          DEFAULT_INTERVAL_LENGTH;
        return { newReadings: [] };

      case RECORD_TYPES.INTERVAL_DATA:
        // Interval data record
        const readings = parseIntervalData(fields, context);
        return { newReadings: readings };

      case RECORD_TYPES.END_NMI:
        // End of NMI data
        context.currentNMI = "";
        return { newReadings: [] };

      case RECORD_TYPES.END_FILE:
        // End of file
        return { newReadings: [] };

      default:
        // Unknown record type
        throw new Error(`Unknown NEM12 record type: ${recordType}`);
    }
  } catch (error) {
    return {
      newReadings: [],
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
};

const validateHeader = (fields: string[]): void => {
  if (
    fields.length < COLUMN_INDICES.CONSUMPTION_START ||
    fields[COLUMN_INDICES.NMI] !== NEM_FORMAT
  ) {
    throw new Error("Invalid NEM12 format - expected NEM12 in header");
  }
};

const parseIntervalData = (
  fields: string[],
  context: NEM12Context
): MeterReading[] => {
  if (!context.currentNMI) {
    throw new Error("Interval data found without NMI context");
  }

  const baseDate = parseNEM12Date(fields[COLUMN_INDICES.INTERVAL_DATE]);
  // Calculate maximum possible intervals in a 24-hour day based on interval length
  // e.g., for 30-minute intervals: 24 * 60 / 30 = 48 intervals per day
  const maxIntervalsInDay = Math.floor(
    MINUTES_IN_A_DAY / context.intervalLength
  );
  const consumptionFields = fields.slice(
    COLUMN_INDICES.CONSUMPTION_START,
    COLUMN_INDICES.CONSUMPTION_START + maxIntervalsInDay
  );

  // Extract only the consumption data fields (starting from index 2)
  // Limit to maxIntervalsInDay to prevent processing beyond valid daily intervals
  return consumptionFields
    .map((consumptionStr, index) =>
      createReading(consumptionStr, index, baseDate, context)
    )
    .filter((reading): reading is MeterReading => reading !== null);
};

// Transform consumption strings into MeterReading objects
const createReading = (
  consumptionStr: string,
  intervalIndex: number,
  baseDate: Date,
  context: NEM12Context
): MeterReading | null => {
  if (!consumptionStr?.trim()) return null;

  const consumption = Number.parseFloat(consumptionStr);
  if (isNaN(consumption)) return null;

  // Calculate timestamp for this interval
  const minutesOffset = intervalIndex * context.intervalLength;
  const timestamp = new Date(
    baseDate.getTime() + minutesOffset * MILLISECONDS_PER_MINUTE
  );

  return {
    nmi: context.currentNMI,
    timestamp,
    consumption,
  };
};
