import { NEM12Parser } from "@/lib/parsers/nem12-parser";

describe("NEM12Parser", () => {
  // Sample NEM12 CSV content for testing
  const sampleNEM12Content = `100,NEM12,200508081149,NEMMCO,NEMMCO
200,NEM1201009,E1E2,1,E1,N1,01009,kWh,30,20050301
300,20050301,0.461,0.810,0.568,0.944,1.233,1.233,1.233,1.233,1.233,1.233,1.233,1.233,1.233,1.233,1.233,1.233,1.233,1.233,1.233,1.233,1.233,1.233,1.233,1.233,1.233,1.233,1.233,1.233,1.233,1.233,1.233,1.233,1.233,1.233,1.233,1.233,1.233,1.233,1.233,1.233,1.233,1.233,1.233,1.233,1.233,1.233,1.233,1.233,A,,,20050310121004,20050310182204
200,NEM1201010,E1E2,1,E1,N1,01010,kWh,30,20050301
300,20050301,0.123,0.456,0.789,1.012,1.345,1.678,1.901,2.234,2.567,2.890,3.123,3.456,3.789,4.012,4.345,4.678,4.901,5.234,5.567,5.890,6.123,6.456,6.789,7.012,7.345,7.678,7.901,8.234,8.567,8.890,9.123,9.456,9.789,10.012,10.345,10.678,10.901,11.234,11.567,11.890,12.123,12.456,12.789,13.012,13.345,13.678,13.901,14.234,A,,,20050310121004,20050310182204
900`;
  let parser: NEM12Parser;

  beforeEach(() => {
    parser = new NEM12Parser();
  });

  it("should parse NEM12 CSV content correctly", () => {
    const result = parser.parseCSVContent(sampleNEM12Content);

    expect(result.readings.length).toBeGreaterThan(0);
    expect(result.errors.length).toBe(0);

    // Check first reading
    expect(result.readings[0].nmi).toBe("NEM1201009");
    expect(result.readings[0].consumption).toBe(0.461);
    expect(result.readings[0].timestamp).toBeInstanceOf(Date);
  });

  it("should handle multiple NMIs correctly", () => {
    const result = parser.parseCSVContent(sampleNEM12Content);

    const nmi1009Readings = result.readings.filter(
      (r) => r.nmi === "NEM1201009"
    );
    const nmi1010Readings = result.readings.filter(
      (r) => r.nmi === "NEM1201010"
    );

    expect(nmi1009Readings.length).toBeGreaterThan(0);
    expect(nmi1010Readings.length).toBeGreaterThan(0);
    expect(nmi1009Readings[0].consumption).toBe(0.461);
    expect(nmi1010Readings[0].consumption).toBe(0.123);
  });

  it("should handle invalid NEM12 format", () => {
    const invalidContent = `INVALID,FORMAT,DATA
200,NEM1201009,E1E2,1,E1,N1,01009,kWh,30,20050301`;

    const result = parser.parseCSVContent(invalidContent);
    expect(result.errors.length).toBeGreaterThan(0);
    expect(result.errors[0]).toContain("Line 1: Unknown record type");
  });

  it("should handle missing NMI context", () => {
    const invalidContent = `100,NEM12,200508081149,NEMMCO,NEMMCO
300,20050301,0.461,0.810,0.568`;

    const result = parser.parseCSVContent(invalidContent);
    expect(result.errors.length).toBeGreaterThan(0);
    expect(result.errors[0]).toContain(
      "Interval data found without NMI context"
    );
  });

  it("should handle invalid date format", () => {
    const invalidContent = `100,NEM12,200508081149,NEMMCO,NEMMCO
200,NEM1201009,E1E2,1,E1,N1,01009,kWh,30,20050301
300,INVALID,0.461,0.810`;

    const result = parser.parseCSVContent(invalidContent);
    expect(result.errors.length).toBeGreaterThan(0);
    expect(result.errors[0]).toContain("Invalid date format");
  });

  it("should skip empty and invalid consumption values", () => {
    const contentWithEmptyValues = `100,NEM12,200508081149,NEMMCO,NEMMCO
200,NEM1201009,E1E2,1,E1,N1,01009,kWh,30,20050301
300,20050301,0.461,,INVALID,0.944,1.233
900`;

    const result = parser.parseCSVContent(contentWithEmptyValues);
    expect(result.errors.length).toBe(0);
    expect(result.readings.length).toBe(3); // Only valid values: 0.461, 0.944, 1.233
    expect(result.readings[0].consumption).toBe(0.461);
    expect(result.readings[1].consumption).toBe(0.944);
    expect(result.readings[2].consumption).toBe(1.233);
  });
});
