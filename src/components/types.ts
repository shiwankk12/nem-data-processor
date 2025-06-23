/**
 * Complete processing result including SQL and summary
 */
export type ProcessingResult = {
  sqlStatements: string[];
  summary: ProcessingSummary;
  errors: string[];
};

/**
 * Summary of processing results
 */
export type ProcessingSummary = {
  totalRecords: number;
  uniqueRecords: number;
  duplicatesFound: number;
  registerStats: Record<string, number>;
  nmis: string[];
  dateRange: DateRange;
  processingTime: number;
};

/**
 * Date range for processed data
 */
export type DateRange = {
  start: string;
  end: string;
};
