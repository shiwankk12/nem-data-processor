import { MeterReading } from "../types";
import { SummaryGenerator } from "../utils/summary-generator";

describe("SummaryGenerator", () => {
  describe("generateSummary", () => {
    it("should generate correct summary for basic readings", () => {
      const originalReadings: MeterReading[] = [
        {
          nmi: "NEM1200001",
          timestamp: new Date("2005-03-01T00:00:00"),
          consumption: 1.5,
        },
        {
          nmi: "NEM1200002",
          timestamp: new Date("2005-03-01T00:30:00"),
          consumption: 2.0,
        },
      ];

      const processedReadings = [...originalReadings];
      const startTime = Date.now() - 1000;

      const summary = SummaryGenerator.generateSummary(
        originalReadings,
        processedReadings,
        0,
        { original: 2 },
        startTime
      );

      expect(summary.totalRecords).toBe(2);
      expect(summary.uniqueRecords).toBe(2);
      expect(summary.duplicatesFound).toBe(0);
      expect(summary.registerStats).toEqual({ original: 2 });
      expect(summary.nmis).toEqual(["NEM1200001", "NEM1200002"]);
      expect(summary.dateRange.start).toBe("2005-03-01");
      expect(summary.dateRange.end).toBe("2005-03-01");
      expect(summary.processingTime).toBeGreaterThan(0);
    });

    it("should handle duplicate readings with register suffixes", () => {
      const originalReadings: MeterReading[] = [
        {
          nmi: "NEM1200001",
          timestamp: new Date("2005-03-01T00:00:00"),
          consumption: 1.5,
        },
        {
          nmi: "NEM1200001",
          timestamp: new Date("2005-03-01T00:00:00"),
          consumption: 2.5,
        },
      ];

      const processedReadings: MeterReading[] = [
        {
          nmi: "NEM1200001_R1",
          timestamp: new Date("2005-03-01T00:00:00"),
          consumption: 1.5,
          register: "R1",
        },
        {
          nmi: "NEM1200001_R2",
          timestamp: new Date("2005-03-01T00:00:00"),
          consumption: 2.5,
          register: "R2",
        },
      ];

      const startTime = Date.now() - 500;

      const summary = SummaryGenerator.generateSummary(
        originalReadings,
        processedReadings,
        1,
        { R1: 1, R2: 1 },
        startTime
      );

      expect(summary.totalRecords).toBe(2);
      expect(summary.uniqueRecords).toBe(2);
      expect(summary.duplicatesFound).toBe(1);
      expect(summary.nmis).toEqual(["NEM1200001"]); // Base NMI without suffix
    });

    it("should calculate correct date range", () => {
      const readings: MeterReading[] = [
        {
          nmi: "NEM1200001",
          timestamp: new Date("2005-03-01T00:00:00"),
          consumption: 1.5,
        },
        {
          nmi: "NEM1200001",
          timestamp: new Date("2005-03-15T12:30:00"),
          consumption: 2.0,
        },
        {
          nmi: "NEM1200001",
          timestamp: new Date("2005-03-31T23:59:59"),
          consumption: 3.0,
        },
      ];

      const startTime = Date.now() - 100;

      const summary = SummaryGenerator.generateSummary(
        readings,
        readings,
        0,
        { original: 3 },
        startTime
      );

      expect(summary.dateRange.start).toBe("2005-03-01");
      expect(summary.dateRange.end).toBe("2005-03-31");
    });

    it("should handle empty readings", () => {
      const startTime = Date.now() - 100;

      const summary = SummaryGenerator.generateSummary(
        [],
        [],
        0,
        {},
        startTime
      );

      expect(summary.totalRecords).toBe(0);
      expect(summary.uniqueRecords).toBe(0);
      expect(summary.duplicatesFound).toBe(0);
      expect(summary.nmis).toEqual([]);
      expect(summary.dateRange.start).toBe("");
      expect(summary.dateRange.end).toBe("");
    });

    it("should extract unique base NMIs correctly", () => {
      const readings: MeterReading[] = [
        {
          nmi: "NEM1200001_R1",
          timestamp: new Date("2005-03-01T00:00:00"),
          consumption: 1.5,
        },
        {
          nmi: "NEM1200001_R2",
          timestamp: new Date("2005-03-01T00:00:00"),
          consumption: 2.5,
        },
        {
          nmi: "NEM1200002",
          timestamp: new Date("2005-03-01T00:00:00"),
          consumption: 3.0,
        },
      ];

      const startTime = Date.now() - 100;

      const summary = SummaryGenerator.generateSummary(
        readings,
        readings,
        0,
        {},
        startTime
      );

      expect(summary.nmis).toEqual(["NEM1200001", "NEM1200002"]);
    });
  });
});
