import { generateSQLInserts } from "@/lib/generators/sql-generator";
import { MeterReading } from "@/lib/types";

describe("SQL Generator", () => {
  it("should generate correct SQL INSERT statements", () => {
    const readings: MeterReading[] = [
      {
        nmi: "NEM1201009",
        timestamp: new Date("2005-03-01T06:30:00"),
        consumption: 0.461,
      },
      {
        nmi: "NEM1201009_R1",
        timestamp: new Date("2005-03-01T07:00:00"),
        consumption: 0.81,
      },
      {
        nmi: "NEM1201010",
        timestamp: new Date("2005-03-01T06:30:00"),
        consumption: 1.233,
      },
    ];

    const sqlStatements = generateSQLInserts(readings);

    expect(sqlStatements.length).toBe(3);
    expect(sqlStatements[0]).toContain("INSERT INTO meter_readings");
    expect(sqlStatements[0]).toContain("'NEM1201009'");
    expect(sqlStatements[0]).toContain("'2005-03-01 06:30:00'");
    expect(sqlStatements[0]).toContain("0.461");
    expect(sqlStatements[0]).toContain("VALUES");
    expect(sqlStatements[0]).toContain(";");
  });

  it("should handle register suffixes in SQL statements", () => {
    const readings: MeterReading[] = [
      {
        nmi: "NEM1201009_R1",
        timestamp: new Date("2005-03-01T06:30:00"),
        consumption: 0.461,
      },
      {
        nmi: "NEM1201009_R2",
        timestamp: new Date("2005-03-01T06:30:00"),
        consumption: 0.81,
      },
    ];

    const sqlStatements = generateSQLInserts(readings);

    expect(sqlStatements[0]).toContain("'NEM1201009_R1'");
    expect(sqlStatements[1]).toContain("'NEM1201009_R2'");
    expect(sqlStatements[0]).toContain("0.461");
    expect(sqlStatements[1]).toContain("0.81");
  });

  it("should handle special characters in NMI correctly", () => {
    const readings: MeterReading[] = [
      {
        nmi: "NEM'1201009",
        timestamp: new Date("2005-03-01T06:30:00"),
        consumption: 0.461,
      },
    ];

    const sqlStatements = generateSQLInserts(readings);
    expect(sqlStatements[0]).toContain("'NEM'1201009'"); // Should handle single quotes
  });

  it("should handle decimal precision correctly", () => {
    const readings: MeterReading[] = [
      {
        nmi: "NEM1201009",
        timestamp: new Date("2005-03-01T06:30:00"),
        consumption: 0.123456789,
      },
    ];

    const sqlStatements = generateSQLInserts(readings);
    expect(sqlStatements[0]).toContain("0.123456789"); // Should preserve precision
  });
});
