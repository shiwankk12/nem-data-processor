import {
  addRegisterSuffixes,
  sortByNMI,
} from "@/lib/processors/register-processor";
import { MeterReading } from "@/lib/types";

describe("Register Processor", () => {
  it("should add register suffixes to duplicate readings", () => {
    const readings: MeterReading[] = [
      {
        nmi: "NEM1201009",
        timestamp: new Date("2005-03-01T06:30:00"),
        consumption: 0.5,
      },
      {
        nmi: "NEM1201009",
        timestamp: new Date("2005-03-01T06:30:00"),
        consumption: 0.3,
      }, // Duplicate
      {
        nmi: "NEM1201009",
        timestamp: new Date("2005-03-01T07:00:00"),
        consumption: 0.81,
      }, // Unique
    ];

    const { processedReadings, duplicatesFound, registerStats } =
      addRegisterSuffixes(readings);

    expect(duplicatesFound).toBe(1);
    expect(processedReadings.length).toBe(3);
    expect(registerStats.original).toBe(1);
    expect(registerStats.R1).toBe(1);
    expect(registerStats.R2).toBe(1);

    // Check duplicate readings have register suffixes
    const duplicates = processedReadings.filter(
      (r) =>
        r.timestamp.toISOString() ===
        new Date("2005-03-01T06:30:00").toISOString()
    );
    expect(duplicates[0].nmi).toBe("NEM1201009_R1");
    expect(duplicates[1].nmi).toBe("NEM1201009_R2");
  });

  it("should maintain original order for duplicate groups", () => {
    const readings: MeterReading[] = [
      {
        nmi: "NEM1201009",
        timestamp: new Date("2005-03-01T06:30:00"),
        consumption: 0.5,
      },
      {
        nmi: "NEM1201009",
        timestamp: new Date("2005-03-01T06:30:00"),
        consumption: 0.3,
      },
      {
        nmi: "NEM1201009",
        timestamp: new Date("2005-03-01T06:30:00"),
        consumption: 0.8,
      },
    ];

    const { processedReadings } = addRegisterSuffixes(readings);

    expect(processedReadings[0].nmi).toBe("NEM1201009_R1");
    expect(processedReadings[0].consumption).toBe(0.5); // First in original order
    expect(processedReadings[1].nmi).toBe("NEM1201009_R2");
    expect(processedReadings[1].consumption).toBe(0.3); // Second in original order
    expect(processedReadings[2].nmi).toBe("NEM1201009_R3");
    expect(processedReadings[2].consumption).toBe(0.8); // Third in original order
  });

  it("should sort by NMI with register suffixes properly", () => {
    const readings: MeterReading[] = [
      {
        nmi: "NEM1201010",
        timestamp: new Date("2005-03-01T07:00:00"),
        consumption: 0.5,
      },
      {
        nmi: "NEM1201009_R2",
        timestamp: new Date("2005-03-01T06:30:00"),
        consumption: 0.3,
      },
      {
        nmi: "NEM1201009",
        timestamp: new Date("2005-03-01T08:00:00"),
        consumption: 0.81,
      },
      {
        nmi: "NEM1201009_R1",
        timestamp: new Date("2005-03-01T06:30:00"),
        consumption: 0.5,
      },
    ];

    const sortedReadings = sortByNMI(readings);

    expect(sortedReadings[0].nmi).toBe("NEM1201009"); // Original first
    expect(sortedReadings[1].nmi).toBe("NEM1201009_R1"); // R1 second
    expect(sortedReadings[2].nmi).toBe("NEM1201009_R2"); // R2 third
    expect(sortedReadings[3].nmi).toBe("NEM1201010"); // Different base NMI last
  });

  it("should sort timestamps within same NMI+register group", () => {
    const readings: MeterReading[] = [
      {
        nmi: "NEM1201009",
        timestamp: new Date("2005-03-01T08:00:00"),
        consumption: 0.8,
      },
      {
        nmi: "NEM1201009",
        timestamp: new Date("2005-03-01T06:00:00"),
        consumption: 0.5,
      },
      {
        nmi: "NEM1201009",
        timestamp: new Date("2005-03-01T07:00:00"),
        consumption: 0.3,
      },
    ];

    const sortedReadings = sortByNMI(readings);

    expect(sortedReadings[0].timestamp.getHours()).toBe(6); // 06:00
    expect(sortedReadings[1].timestamp.getHours()).toBe(7); // 07:00
    expect(sortedReadings[2].timestamp.getHours()).toBe(8); // 08:00
  });
});
