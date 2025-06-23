import { MeterReading } from "../types";
import { SQLGenerator } from "../utils/sql-generator";

describe("SQLGenerator", () => {
  let generator: SQLGenerator;

  beforeEach(() => {
    generator = new SQLGenerator();
  });

  describe("generateInserts", () => {
    it("should generate correct SQL INSERT statements", () => {
      const readings: MeterReading[] = [
        {
          nmi: "NEB1000001",
          timestamp: new Date("2005-03-01T00:00:00"),
          consumption: 1.5,
        },
      ];

      const sqlStatements = generator.generateInserts(readings);

      expect(sqlStatements).toHaveLength(1);
      expect(sqlStatements[0]).toMatch(
        /^INSERT INTO meter_readings \(id, nmi, timestamp, consumption\) VALUES/
      );
      expect(sqlStatements[0]).toContain("'NEB1000001'");
      expect(sqlStatements[0]).toContain("'2005-03-01 00:00:00'");
      expect(sqlStatements[0]).toContain("1.5");
    });

    it("should generate unique IDs for each reading", () => {
      const readings: MeterReading[] = [
        {
          nmi: "NEB1000001",
          timestamp: new Date("2005-03-01T00:00:00"),
          consumption: 1.5,
        },
        {
          nmi: "NEB1000001",
          timestamp: new Date("2005-03-01T00:30:00"),
          consumption: 2.0,
        },
      ];

      const sqlStatements = generator.generateInserts(readings);

      const id1Match = sqlStatements[0].match(/VALUES \('([^']+)'/);
      const id2Match = sqlStatements[1].match(/VALUES \('([^']+)'/);

      expect(id1Match).toBeTruthy();
      expect(id2Match).toBeTruthy();
      expect(id1Match![1]).not.toBe(id2Match![1]);
    });

    it("should handle negative consumption values", () => {
      const readings: MeterReading[] = [
        {
          nmi: "NEB1000001",
          timestamp: new Date("2005-03-01T00:00:00"),
          consumption: -1.5,
        },
      ];

      const sqlStatements = generator.generateInserts(readings);

      expect(sqlStatements[0]).toContain("-1.5");
    });

    it("should handle zero consumption values", () => {
      const readings: MeterReading[] = [
        {
          nmi: "NEB1000001",
          timestamp: new Date("2005-03-01T00:00:00"),
          consumption: 0,
        },
      ];

      const sqlStatements = generator.generateInserts(readings);

      expect(sqlStatements[0]).toContain("0);");
    });

    it("should handle large consumption values", () => {
      const readings: MeterReading[] = [
        {
          nmi: "NEB1000001",
          timestamp: new Date("2005-03-01T00:00:00"),
          consumption: 999999.99,
        },
      ];

      const sqlStatements = generator.generateInserts(readings);

      expect(sqlStatements[0]).toContain("999999.99");
    });

    it("should handle empty readings array", () => {
      const readings: MeterReading[] = [];

      const sqlStatements = generator.generateInserts(readings);

      expect(sqlStatements).toHaveLength(0);
    });
  });
});
