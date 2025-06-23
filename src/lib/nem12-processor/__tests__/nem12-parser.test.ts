import { NEM12Parser } from "@/lib/nem12-processor/parsers/nem12.parser";

describe("NEM12Parser", () => {
  let parser: NEM12Parser;

  beforeEach(() => {
    parser = new NEM12Parser();
  });

  describe("parseCSVContent", () => {
    it("should parse a complete NEM12 file successfully", () => {
      const csvContent = `100,NEM12,200501081149,UNITEDDP,NEMMCO
200,NEB1000001,E1,E1,E1,N,,,kWh,30,
300,20050301,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,A,,,20050301094500,20050301104500
500,
900`;

      const result = parser.parseCSVContent(csvContent);

      expect(result.readings).toHaveLength(46); // 46 30-minute intervals in a day
      expect(result.errors).toHaveLength(0);
      expect(result.readings[0].nmi).toBe("NEB1000001");
      expect(result.readings[0].consumption).toBe(0);
    });

    it("should handle header record correctly", () => {
      const csvContent = "100,NEM12,200501081149,UNITEDDP,NEMMCO";

      const result = parser.parseCSVContent(csvContent);

      expect(result.readings).toHaveLength(0);
      expect(result.errors).toHaveLength(0);
    });

    it("should handle NMI data record correctly", () => {
      const csvContent = "200,NEB1000001,E1,E1,E1,N,,,kWh,30,";

      const result = parser.parseCSVContent(csvContent);

      expect(result.readings).toHaveLength(0);
      expect(result.errors).toHaveLength(0);
    });

    it("should parse interval data with valid consumption values", () => {
      const csvContent = `200,NEB1000001,E1,E1,E1,N,,,kWh,30,
300,20050301,1.5,2.0,0,1.2,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,A,,,20050301094500,20050301104500`;

      const result = parser.parseCSVContent(csvContent);

      expect(result.readings).toHaveLength(46);
      expect(result.readings[0].consumption).toBe(1.5);
      expect(result.readings[1].consumption).toBe(2.0);
      expect(result.readings[2].consumption).toBe(0);
      expect(result.readings[3].consumption).toBe(1.2);
    });

    it("should calculate correct timestamps for intervals", () => {
      const csvContent = `200,NEB1000001,E1,E1,E1,N,,,kWh,30,
300,20050301,1.5,2.0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,A,,,20050301094500,20050301104500`;

      const result = parser.parseCSVContent(csvContent);

      const baseDate = new Date(2005, 2, 1); // March 1, 2005
      expect(result.readings[0].timestamp).toEqual(baseDate);
      expect(result.readings[1].timestamp).toEqual(new Date(2005, 2, 1, 0, 30)); // +30 minutes
      expect(result.readings[2].timestamp).toEqual(new Date(2005, 2, 1, 1, 0)); // +60 minutes
    });

    it("should handle multiple NMIs", () => {
      const csvContent = `100,NEM12,200501081149,UNITEDDP,NEMMCO
200,NEB1000001,E1,E1,E1,N,,,kWh,30,
300,20050301,0
500,
200,NEB1000002,E1,E1,E1,N,,,kWh,30,
300,20050301,2.5
500,
900`;

      const result = parser.parseCSVContent(csvContent);
      expect(result.readings[0].nmi).toBe("NEB1000001");
      expect(result.readings[1].nmi).toBe("NEB1000002");
    });

    it("should handle different interval lengths", () => {
      const csvContent = `200,NEM1201009,E1E2,1,E1,N1,01009,kWh,15,20050610
300,20050301,1.5,2.0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,A,,,20050301094500,20050301104500`;

      const result = parser.parseCSVContent(csvContent);

      // 15-minute intervals
      const baseDate = new Date(2005, 2, 1);
      expect(result.readings[0].timestamp).toEqual(baseDate);
      expect(result.readings[1].timestamp).toEqual(new Date(2005, 2, 1, 0, 15)); // +15 minutes
    });

    it("should handle invalid date format", () => {
      const csvContent = `200,NEB1000001,E1,E1,E1,N,,,kWh,30,
300,2005031,1.5,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,A,,,20050301094500,20050301104500`;

      const result = parser.parseCSVContent(csvContent);

      expect(result.readings).toHaveLength(0);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0]).toContain("Invalid NEM12 date format");
    });

    it("should handle interval data without NMI context", () => {
      const csvContent =
        "300,20050301,1.5,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,A,,,20050301094500,20050301104500";

      const result = parser.parseCSVContent(csvContent);

      expect(result.readings).toHaveLength(0);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0]).toContain(
        "Interval data found without NMI context"
      );
    });

    it("should handle invalid header format", () => {
      const csvContent = "100,INVALID,200501081149,UNITEDDP,NEMMCO";

      const result = parser.parseCSVContent(csvContent);

      expect(result.readings).toHaveLength(0);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0]).toContain("Invalid NEM12 format");
    });

    it("should handle unknown record types", () => {
      const csvContent = "999,UNKNOWN,DATA";

      const result = parser.parseCSVContent(csvContent);

      expect(result.readings).toHaveLength(0);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0]).toContain("Unknown NEM12 record type: 999");
    });

    it("should handle end records correctly", () => {
      const csvContent = `200,NEB1000001,E1,E1,E1,N,,,kWh,30,
500,
900`;

      const result = parser.parseCSVContent(csvContent);

      expect(result.readings).toHaveLength(0);
      expect(result.errors).toHaveLength(0);
    });
  });

  describe("resetContext", () => {
    it("should reset context to default values", () => {
      // Set up some context
      const csvContent = "200,NEB1000001,E1,E1,E1,N,,,kWh,15,";
      parser.parseCSVContent(csvContent);

      // Reset context
      parser.resetContext();

      // Try to parse interval data without NMI context
      const intervalData =
        "300,20050301,1.5,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,A,,,20050301094500,20050301104500";
      const result = parser.parseCSVContent(intervalData);

      expect(result.errors).toHaveLength(1);
      expect(result.errors[0]).toContain(
        "Interval data found without NMI context"
      );
    });
  });
});
