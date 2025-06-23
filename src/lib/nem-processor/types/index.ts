/**
 * Interface for NEM file processors
 */
export interface INEMProcessor {
  processFile(file: File): Promise<ProcessingResult>;
}

/**
 * Base interface for all NEM parsers
 */
export interface INEMParser {
  parseCSVContent(content: string): ParseResult;
}

/**
 * Interface for file validators
 */
export interface IFileValidator {
  validate(file: File): void;
}

/**
 * Parse result from any NEM parser
 */
export interface ParseResult {
  readings: MeterReading[];
  errors: string[];
}

export interface MeterReading {
  nmi: string;
  timestamp: Date;
  consumption: number;
  register?: string;
}

/**
 * Complete processing result including SQL and summary
 */
export interface ProcessingResult {
  sqlStatements: string[];
  summary: ProcessingSummary;
  errors: string[];
}

/**
 * Summary of processing results
 */
export interface ProcessingSummary {
  totalRecords: number;
  uniqueRecords: number;
  duplicatesFound: number;
  registerStats: Record<string, number>;
  nmis: string[];
  dateRange: DateRange;
  processingTime: number;
}

/**
 * Date range for processed data
 */
export interface DateRange {
  start: string;
  end: string;
}

/**
 * Result of register processing
 */
export interface RegisterProcessingResult {
  processedReadings: MeterReading[];
  duplicatesFound: number;
  registerStats: Record<string, number>;
}
