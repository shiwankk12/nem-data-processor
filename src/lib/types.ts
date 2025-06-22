export interface MeterReading {
  nmi: string;
  timestamp: Date;
  consumption: number;
  register?: string;
}

export interface NEM12Context {
  currentNMI: string;
  intervalLength: number;
}

export interface ProcessingResult {
  sqlStatements: string[];
  summary: {
    totalRecords: number;
    uniqueRecords: number;
    duplicatesFound: number;
    registerStats: Record<string, number>;
    nmis: string[];
    dateRange: { start: string; end: string };
    processingTime: number;
  };
  errors: string[];
}

export interface RegisterProcessingResult {
  processedReadings: MeterReading[];
  duplicatesFound: number;
  registerStats: Record<string, number>;
}
