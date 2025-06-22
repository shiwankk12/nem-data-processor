/**
 * NEM12 Record Type Constants
 * These represent the different record types in the NEM12 format
 */
export const NEM12_RECORD_TYPES = Object.freeze({
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

export type NEM12RecordType =
  (typeof NEM12_RECORD_TYPES)[keyof typeof NEM12_RECORD_TYPES];
