import { MeterReading } from "../types";
import { ReadingProcessor } from "../utils/reading-processor";

describe("ReadingProcessor", () => {
  describe("addRegisterSuffixes", () => {
    it("should handle readings without duplicates", () => {
      const readings: MeterReading[] = [
        {
          nmi: "NEM1200001",
          timestamp: new Date("2005-03-01T00:00:00"),
          consumption: 1.5,
        },
        {
          nmi: "NEM1200001",
          timestamp: new Date("2005-03-01T00:30:00"),
          consumption: 2.0,
        },
      ];

      const result = ReadingProcessor.addRegisterSuffixes(readings);

      expect(result.processedReadings).toHaveLength(2);
      expect(result.duplicatesFound).toBe(0);
      expect(result.registerStats.original).toBe(2);
      expect(result.processedReadings[0].nmi).toBe("NEM1200001");
    });

    it("should add register suffixes to duplicate readings", () => {
      const readings: MeterReading[] = [
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

      const result = ReadingProcessor.addRegisterSuffixes(readings);

      expect(result.processedReadings).toHaveLength(2);
      expect(result.duplicatesFound).toBe(1);
      expect(result.registerStats.R1).toBe(1);
      expect(result.registerStats.R2).toBe(1);
      expect(result.processedReadings[0].nmi).toBe("NEM1200001_R1");
      expect(result.processedReadings[1].nmi).toBe("NEM1200001_R2");
    });

    it("should handle multiple duplicates at same timestamp", () => {
      const readings: MeterReading[] = [
        {
          nmi: "NEM1200001",
          timestamp: new Date("2005-03-01T00:00:00"),
          consumption: 1.0,
        },
        {
          nmi: "NEM1200001",
          timestamp: new Date("2005-03-01T00:00:00"),
          consumption: 2.0,
        },
        {
          nmi: "NEM1200001",
          timestamp: new Date("2005-03-01T00:00:00"),
          consumption: 3.0,
        },
      ];

      const result = ReadingProcessor.addRegisterSuffixes(readings);

      expect(result.processedReadings).toHaveLength(3);
      expect(result.duplicatesFound).toBe(2);
      expect(result.registerStats.R1).toBe(1);
      expect(result.registerStats.R2).toBe(1);
      expect(result.registerStats.R3).toBe(1);
    });

    it("should handle duplicates across different NMIs", () => {
      const readings: MeterReading[] = [
        {
          nmi: "NEM1200001",
          timestamp: new Date("2005-03-01T00:00:00"),
          consumption: 1.0,
        },
        {
          nmi: "NEM1200001",
          timestamp: new Date("2005-03-01T00:00:00"),
          consumption: 2.0,
        },
        {
          nmi: "NEM1200002",
          timestamp: new Date("2005-03-01T00:00:00"),
          consumption: 3.0,
        },
      ];

      const result = ReadingProcessor.addRegisterSuffixes(readings);

      expect(result.processedReadings).toHaveLength(3);
      expect(result.duplicatesFound).toBe(1);
      expect(result.registerStats.original).toBe(1); // NEM1200002
      expect(result.registerStats.R1).toBe(1);
      expect(result.registerStats.R2).toBe(1);
    });

    it("should preserve register property", () => {
      const readings: MeterReading[] = [
        {
          nmi: "NEM1200001",
          timestamp: new Date("2005-03-01T00:00:00"),
          consumption: 1.0,
        },
        {
          nmi: "NEM1200001",
          timestamp: new Date("2005-03-01T00:00:00"),
          consumption: 2.0,
        },
      ];

      const result = ReadingProcessor.addRegisterSuffixes(readings);

      expect(result.processedReadings[0].register).toBe("R1");
      expect(result.processedReadings[1].register).toBe("R2");
    });
  });

  describe("sortByNMI", () => {
    it("should sort by base NMI first", () => {
      const readings: MeterReading[] = [
        {
          nmi: "NEM1200002",
          timestamp: new Date("2005-03-01T00:00:00"),
          consumption: 1.0,
        },
        {
          nmi: "NEM1200001",
          timestamp: new Date("2005-03-01T00:00:00"),
          consumption: 2.0,
        },
      ];

      const sorted = ReadingProcessor.sortByNMI(readings);

      expect(sorted[0].nmi).toBe("NEM1200001");
      expect(sorted[1].nmi).toBe("NEM1200002");
    });

    it("should sort by register suffix within same NMI", () => {
      const readings: MeterReading[] = [
        {
          nmi: "NEM1200001_R2",
          timestamp: new Date("2005-03-01T00:00:00"),
          consumption: 1.0,
        },
        {
          nmi: "NEM1200001",
          timestamp: new Date("2005-03-01T00:00:00"),
          consumption: 2.0,
        },
        {
          nmi: "NEM1200001_R1",
          timestamp: new Date("2005-03-01T00:00:00"),
          consumption: 3.0,
        },
      ];

      const sorted = ReadingProcessor.sortByNMI(readings);

      expect(sorted[0].nmi).toBe("NEM1200001"); // Original first
      expect(sorted[1].nmi).toBe("NEM1200001_R1");
      expect(sorted[2].nmi).toBe("NEM1200001_R2");
    });

    it("should sort by timestamp within same NMI+register", () => {
      const readings: MeterReading[] = [
        {
          nmi: "NEM1200001",
          timestamp: new Date("2005-03-01T01:00:00"),
          consumption: 1.0,
        },
        {
          nmi: "NEM1200001",
          timestamp: new Date("2005-03-01T00:00:00"),
          consumption: 2.0,
        },
      ];

      const sorted = ReadingProcessor.sortByNMI(readings);

      expect(sorted[0].timestamp.getTime()).toBeLessThan(
        sorted[1].timestamp.getTime()
      );
    });
  });
});
