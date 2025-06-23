/**
 * NEM12 Record Type Constants
 */
export const RECORD_TYPES = Object.freeze({
  /** Header record - contains file format information */
  HEADER: "100",
  /** NMI data record - contains meter identification and configuration */
  NMI_DATA: "200",
  /** Interval data record - contains actual consumption readings */
  INTERVAL_DATA: "300",
  /** End NMI data record - marks end of data for current NMI */
  END_NMI: "500",
  /** End of file record - marks end of NEM12 file */
  END_FILE: "900",
} as const);

export const NEM_FORMAT = "NEM12";

export const DEFAULT_INTERVAL_LENGTH = 30;

export const COLUMN_INDICES = Object.freeze({
  RECORD_TYPE: 0,
  NMI: 1,
  INTERVAL_LENGTH: 8,
  INTERVAL_DATE: 1, // For 300 records
  CONSUMPTION_START: 2, // First consumption value in 300 records
} as const);

// Time-related constants
export const MINUTES_PER_HOUR = 60;
export const HOURS_PER_DAY = 24;
export const SECONDS_PER_MINUTE = 60;
export const MILLISECONDS_PER_SECOND = 1000;
export const MILLISECONDS_PER_MINUTE =
  SECONDS_PER_MINUTE * MILLISECONDS_PER_SECOND;
export const MINUTES_IN_A_DAY = MINUTES_PER_HOUR * HOURS_PER_DAY;

export const DATE_FORMAT_INDICES = Object.freeze({
  /** Year component indices */
  YEAR_START: 0,
  YEAR_END: 4,

  /** Month component indices */
  MONTH_START: 4,
  MONTH_END: 6,

  /** Day component indices */
  DAY_START: 6,
  DAY_END: 8,
} as const);
